// data/examensSupabase.ts
// CRUD Supabase pour les examens (TP, VAE, etc.)
// Migration depuis localStorage → Supabase (Phase de fiabilisation)

import { supabase } from '../lib/supabaseClient';

// ────────────────────────────────────────────────────────────────
// TYPE EXAMEN (aligné sur la structure localStorage existante)
// ────────────────────────────────────────────────────────────────

export type Jure = {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  specialite?: string;
  disponible?: boolean;
  mailEnvoye?: string;
  confirme?: boolean;
};

export type ResultatsCandidat = {
  MSP?: string;
  ET?: string;
  QAP?: string;
  EF?: string;
  [key: string]: string | undefined;
};

export type TypeCandidature = 'apprentissage' | 'formation_continue' | 'vae' | 'libre';
export type EtatCcpCandidat = 'obtenu' | 'non_obtenu' | 'non_presente';
export type DecisionJury = 'titre_obtenu' | 'titre_partiel' | 'ajourne' | 'absent';

export type Candidat = {
  id: string;
  nom: string;
  prenom: string;
  entreprise?: string;
  dpFourni?: boolean;
  ecfFourni?: boolean;
  convocationEnvoyee?: string;
  resultats?: ResultatsCandidat;

  // Rattachement au dossier apprenant (indispensable au livret de certification)
  apprenantId?: string;

  // Catégorie de prestation : les taux se calculent SÉPARÉMENT par catégorie.
  // Ne jamais agréger apprentissage / formation continue / VAE / libre.
  typeCandidature?: TypeCandidature;

  // Résultats au grain CCP, ex. { CCP1: 'obtenu', CCP2: 'non_obtenu' }
  resultatsCcp?: Record<string, EtatCcpCandidat>;

  decisionJury?: DecisionJury;
  dateDeliberation?: string;            // ISO AAAA-MM-JJ
  dateLimiteRepresentation?: string;    // ISO, délai d'un an après délibération
  numeroLivretCertification?: string;
};

export type Examen = {
  id: string;
  formation: string;
  sessionFormationId?: string;
  dateDebut?: string;
  dateFin?: string;
  lieu?: string;
  statut?: string;

  // Responsable
  responsableNom?: string;
  responsablePrenom?: string;
  responsableTel?: string;
  responsableEmail?: string;

  // CERES
  dateCreationCERES?: string;
  numeroCERES?: string;

  // DTE & Jury
  dateCmdDTE?: string;
  dateReceptionDTE?: string;
  dateCmdJury?: string;

  // Convocations
  dateEnvoiConvocations?: string;
  affichageReglement?: boolean;
  affichagePlanning?: boolean;
  affichageConditions?: boolean;

  // PV
  dateResultatsCERES?: string;
  pvImporte?: string;
  pvSigne?: string;
  pvEnvoiDemarche?: string;
  pvCourrierReco?: string;
  pvReceptionDeets?: string;
  pvDeets?: string;

  // Émargements
  emargementJures?: string;
  emargementsCandidats?: Record<string, any>;

  // Type de session — réf. arrêté du 22 décembre 2015
  typeSession?: 'titre' | 'ccp' | 'ccs';
  ccpVises?: string[];              // vide = tous les CCP du TP
  avecEntretienFinal?: boolean;     // obligatoire au dernier CCP d'un parcours

  // Archivage explicite — jamais déduit du statut
  archive?: boolean;

  // Sous-données
  jures?: Jure[];
  candidats?: Candidat[];

  // Audit
  dateCreation?: string;
  dateModification?: string;
};

// ────────────────────────────────────────────────────────────────
// HELPER — Fetch direct via REST (workaround SDK Supabase)
// ────────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ────────────────────────────────────────────────────────────────
// CRUD
// ────────────────────────────────────────────────────────────────

/** Charge tous les examens, triés par dateDebut décroissante */
export async function chargerExamens(): Promise<Examen[]> {
  const headers = await getAuthHeaders();
  if (!headers) {
    console.warn('[examensSupabase] Pas de session, retour [].');
    return [];
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/examens?select=*&order=dateDebut.desc`,
      { headers },
    );
    if (!res.ok) {
      console.error('[examensSupabase] Erreur chargement :', res.status, await res.text());
      return [];
    }
    const data = await res.json();
    return data as Examen[];
  } catch (e) {
    console.error('[examensSupabase] Exception chargement :', e);
    return [];
  }
}

/** Crée un nouvel examen */
export async function creerExamen(examen: Examen): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/examens`, {
      method: 'POST',
      headers,
      body: JSON.stringify(examen),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[examensSupabase] Erreur création :', res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[examensSupabase] Exception création :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Met à jour un examen existant (upsert : crée si n'existe pas) */
export async function modifierExamen(examen: Examen): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };

  try {
    const examenPatch = {
      ...examen,
      dateModification: new Date().toISOString(),
    };
    // On utilise PATCH avec filter on=id pour mettre à jour
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/examens?id=eq.${encodeURIComponent(examen.id)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(examenPatch),
      },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error('[examensSupabase] Erreur modification :', res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[examensSupabase] Exception modification :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Upsert : crée si nouvel id, ou met à jour si existe */
export async function sauvegarderExamen(examen: Examen): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };

  try {
    const examenPatch = {
      ...examen,
      dateModification: new Date().toISOString(),
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/examens`, {
      method: 'POST',
      headers: {
        ...headers,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(examenPatch),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[examensSupabase] Erreur sauvegarde :', res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[examensSupabase] Exception sauvegarde :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Supprime un examen */
export async function supprimerExamen(id: string): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/examens?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error('[examensSupabase] Erreur suppression :', res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[examensSupabase] Exception suppression :', e);
    return { success: false, error: e?.message || String(e) };
  }
}