'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Utilisateur } from '../data/mockUtilisateurs';
import { supabase } from './supabaseClient';

type UserContextType = {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  connecter: (email: string, motDePasse: string) => Promise<{ ok: boolean; erreur?: string }>;
  deconnecter: () => Promise<void>;
  mettreAJour: (data: Partial<Utilisateur>) => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  utilisateur: null,
  chargement: true,
  connecter: async () => ({ ok: false }),
  deconnecter: async () => {},
  mettreAJour: async () => {},
});

// ---------- Mapping profiles (Supabase) -> Utilisateur (type app) ----------
function mapProfileVersUtilisateur(profile: any): Utilisateur {
  return {
    id: profile.id,
    nom: profile.nom ?? '',
    prenom: profile.prenom ?? '',
    email: profile.email ?? '',
    telephone: profile.telephone ?? '',
    fonction: profile.fonction ?? '',
    role: profile.role ?? 'lecteur',
    motDePasse: '', // jamais renvoyé par Supabase, on conserve la prop pour la compat du type
    signatureEmail: profile.signatureEmail ?? '',
    actif: profile.actif ?? true,
    avatar: profile.avatar ?? '',
    formateurId: profile.formateurId ?? undefined,
  };
}

async function chargerProfil(userId: string): Promise<Utilisateur | null> {
  try {
    // Workaround : on utilise fetch direct car supabase.from().select().single() 
    // peut rester pendant dans certaines conditions (SDK v2.105 + clé publishable)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('[UserContext] Pas de session pour chargerProfil');
      return null;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const res = await fetch(`${url}/rest/v1/profiles?select=*&id=eq.${userId}`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${session.access_token}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('[UserContext] Erreur HTTP chargerProfil :', res.status);
      return null;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) {
      console.error('[UserContext] Profil non trouvé pour userId', userId);
      return null;
    }

    return mapProfileVersUtilisateur(rows[0]);
  } catch (err) {
    console.error('[UserContext] Exception chargerProfil :', err);
    return null;
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  // 1. Hydratation initiale au montage (version simplifiée sans onAuthStateChange)
  useEffect(() => {
    let actif = true;

    (async () => {
      console.log('[UserContext] Init: getSession...');

      // Garde-fou : getSession() peut rester pendant indéfiniment si le verrou
      // interne du SDK n'a pas été relâché (fermeture brutale du navigateur,
      // onglets multiples). Sans délai, l'application reste figée sur "Chargement...".
      let session: any = null;
      try {
        const resultat: any = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, rejeter) => setTimeout(() => rejeter(new Error('timeout')), 5000)),
        ]);
        session = resultat?.data?.session ?? null;
      } catch (err: any) {
        if (err?.message === 'timeout') {
          console.warn('[UserContext] getSession sans réponse après 5 s — bascule sur écran de connexion.');
        } else {
          console.error('[UserContext] Exception getSession :', err);
        }
        session = null;
      }

      console.log('[UserContext] Init: session =', session?.user?.email ?? 'aucune');
      if (!actif) return;

      if (session?.user) {
        const profil = await chargerProfil(session.user.id);
        if (actif) setUtilisateur(profil);
      }
      if (actif) setChargement(false);
    })();

    return () => { actif = false; };
  }, []);

  // 2. Connexion
  const connecter = useCallback(async (email: string, motDePasse: string) => {
    console.log('[UserContext] 1. Début connecter, email=', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: motDePasse,
    });

    console.log('[UserContext] 2. signInWithPassword retourné', { data, error });

    if (error || !data.user) {
      console.log('[UserContext] 3a. Erreur Auth');
      return { ok: false, erreur: error?.message ?? 'Identifiants invalides' };
    }

    console.log('[UserContext] 3b. User ID =', data.user.id);
    console.log('[UserContext] 4. Appel chargerProfil...');
    
    const profil = await chargerProfil(data.user.id);
    
    console.log('[UserContext] 5. chargerProfil retourné', profil);

    if (!profil) {
      console.log('[UserContext] 6a. Profil null, signOut');
      await supabase.auth.signOut();
      return { ok: false, erreur: 'Profil introuvable. Contactez l\'administrateur.' };
    }
    if (!profil.actif) {
      console.log('[UserContext] 6b. Profil inactif, signOut');
      await supabase.auth.signOut();
      return { ok: false, erreur: 'Compte désactivé. Contactez l\'administrateur.' };
    }

    console.log('[UserContext] 7. Succès, setUtilisateur');
    setUtilisateur(profil);
    return { ok: true };
  }, []);

  // 3. Déconnexion
  const deconnecter = useCallback(async () => {
    await supabase.auth.signOut();
    setUtilisateur(null);
    // Nettoyage anciens vestiges du mock (au cas où)
    try {
      sessionStorage.removeItem('easycfa_user');
      localStorage.removeItem('easycfa_user');
    } catch {}
  }, []);

  // 4. Mise à jour profil
  const mettreAJour = useCallback(async (data: Partial<Utilisateur>) => {
    if (!utilisateur) return;

    // On retire les champs qu'on ne veut JAMAIS pousser
    const { id, motDePasse, ...patch } = data;

    // La table profiles est en camelCase (signatureEmail, formateurId)
    // donc on peut passer le patch directement, sans transformation
    const { error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', utilisateur.id);

    if (error) {
      console.error('[UserContext] Erreur mettreAJour :', error);
      return;
    }

    setUtilisateur({ ...utilisateur, ...data });
  }, [utilisateur]);

  return (
    <UserContext.Provider value={{ utilisateur, chargement, connecter, deconnecter, mettreAJour }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}