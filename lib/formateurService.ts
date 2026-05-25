// ============================================================
// Helpers métier pour la fiche formateur
// (chargement, édition libre, propositions)
// ============================================================

import { supabase } from './supabaseClient';

export type Formateur = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string | null;
  siret: string | null;
  nda: string | null;
  statut: string | null;
  notes: string | null;
  specialites: string[] | null;
  pieces: any[] | null;
  suiviMensuel: any | null;
  interventions: any | null;
  dateCreation: string | null;
  dateModification: string | null;
};

export type Proposition = {
  id: string;
  formateurId: string;
  proposeePar: string;
  dateProposition: string;
  champsModifies: Record<string, any>;
  notesFormateur: string | null;
  statut: 'en_attente' | 'validee' | 'refusee';
  validePar: string | null;
  dateValidation: string | null;
  motifRefus: string | null;
};

// ============================================================
// 1. Charger la fiche formateur
// (workaround fetch direct comme dans UserContext, vu la pendulation du SDK)
// ============================================================
export async function chargerFormateur(formateurId: string): Promise<Formateur | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('[formateurService] Pas de session');
      return null;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const res = await fetch(`${url}/rest/v1/formateurs?select=*&id=eq.${formateurId}`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${session.access_token}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('[formateurService] Erreur HTTP chargerFormateur :', res.status);
      return null;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) return null;
    return rows[0] as Formateur;
  } catch (err) {
    console.error('[formateurService] Exception chargerFormateur :', err);
    return null;
  }
}

// ============================================================
// 2. Mettre à jour les champs libres (édition directe)
// ============================================================
export async function majChampsLibres(
  formateurId: string,
  champs: Record<string, any>
): Promise<{ ok: boolean; erreur?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, erreur: 'Session expirée. Reconnectez-vous.' };

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // On ajoute la date de modification automatiquement
    const patch = { ...champs, dateModification: new Date().toISOString() };

    const res = await fetch(`${url}/rest/v1/formateurs?id=eq.${formateurId}`, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('[formateurService] Erreur PATCH formateurs :', res.status, txt);
      return { ok: false, erreur: 'Erreur lors de l\'enregistrement.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[formateurService] Exception majChampsLibres :', err);
    return { ok: false, erreur: 'Erreur réseau.' };
  }
}

// ============================================================
// 3. Créer une proposition (champs nécessitant validation admin)
// ============================================================
export async function creerProposition(params: {
  formateurId: string;
  champsModifies: Record<string, any>;
  notesFormateur?: string;
}): Promise<{ ok: boolean; erreur?: string; proposition?: Proposition }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, erreur: 'Session expirée. Reconnectez-vous.' };

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const body = {
      formateurId: params.formateurId,
      proposeePar: session.user.id,
      champsModifies: params.champsModifies,
      notesFormateur: params.notesFormateur ?? null,
      statut: 'en_attente',
    };

    const res = await fetch(`${url}/rest/v1/formateurs_propositions`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('[formateurService] Erreur création proposition :', res.status, txt);
      return { ok: false, erreur: 'Erreur lors de la création de la proposition.' };
    }

    const rows = await res.json();
    // Notifier le serveur pour envoi du mail à PAMA (best-effort, on n'attend pas)
    fetch('/api/admin/propositions/notifier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propositionId: rows[0]?.id }),
    }).catch(() => {});

    return { ok: true, proposition: rows[0] };
  } catch (err) {
    console.error('[formateurService] Exception creerProposition :', err);
    return { ok: false, erreur: 'Erreur réseau.' };
  }
}

// ============================================================
// 4. Lister les propositions du formateur courant
// ============================================================
export async function chargerMesPropositions(formateurId: string): Promise<Proposition[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const res = await fetch(
      `${url}/rest/v1/formateurs_propositions?select=*&formateurId=eq.${formateurId}&order=dateProposition.desc`,
      {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!res.ok) {
      console.error('[formateurService] Erreur charger propositions :', res.status);
      return [];
    }

    return (await res.json()) as Proposition[];
  } catch (err) {
    console.error('[formateurService] Exception chargerMesPropositions :', err);
    return [];
  }
}