// data/agrementsSupabase.ts
// CRUD Supabase pour les agréments TP (examens)
// 1 ligne = 1 agrément (permet l'historique : actif + archivés)

import { supabase } from '../lib/supabaseClient';

// ────────────────────────────────────────────────────────────────
// TYPE
// ────────────────────────────────────────────────────────────────

export type SituationEvaluation = {
  id: string;
  label: string;
  duree: string;
  applicable: boolean;
};

export type Agrement = {
  id: string;
  formationCode: string;
  formationLabel: string;
  numero?: string;
  couleur?: string;
  intituleAgrement?: string;
  dateDebut?: string;
  dateFin?: string;
  archive: boolean;
  situations: SituationEvaluation[];
  pdfUrl?: string;
  pdfNom?: string;
  pdfCheminStorage?: string;
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

/** Charge tous les agréments, triés par code formation */
export async function chargerAgrements(): Promise<Agrement[]> {
  const headers = await getAuthHeaders();
  if (!headers) {
    console.warn('[agrementsSupabase] Pas de session, retour [].');
    return [];
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/agrements?select=*&order=formationCode.asc`,
      { headers },
    );
    if (!res.ok) {
      console.error('[agrementsSupabase] Erreur chargement :', res.status, await res.text());
      return [];
    }
    return await res.json() as Agrement[];
  } catch (e) {
    console.error('[agrementsSupabase] Exception chargement :', e);
    return [];
  }
}

/** Crée un nouvel agrément */
export async function creerAgrement(agrement: Partial<Agrement>): Promise<{ success: boolean; error?: string; data?: Agrement }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/agrements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(agrement),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[agrementsSupabase] Erreur création :', res.status, errText);
      return { success: false, error: errText };
    }
    const rows = await res.json();
    return { success: true, data: Array.isArray(rows) ? rows[0] : rows };
  } catch (e: any) {
    console.error('[agrementsSupabase] Exception création :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Met à jour un agrément existant (par id) */
export async function modifierAgrement(id: string, patch: Partial<Agrement>): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };
  try {
    const corps = { ...patch, dateModification: new Date().toISOString() };
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/agrements?id=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', headers, body: JSON.stringify(corps) },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error('[agrementsSupabase] Erreur modification :', res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[agrementsSupabase] Exception modification :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Supprime un agrément (par id) */
export async function supprimerAgrement(id: string): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/agrements?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error('[agrementsSupabase] Erreur suppression :', res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[agrementsSupabase] Exception suppression :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

// ────────────────────────────────────────────────────────────────
// UPLOAD PDF (bucket "agrements")
// ────────────────────────────────────────────────────────────────

/** Upload un PDF d'agrément dans le bucket Storage, renvoie le chemin + l'URL signée */
export async function uploaderPdfAgrement(agrementId: string, file: File): Promise<{ success: boolean; error?: string; chemin?: string; nom?: string; url?: string }> {
  try {
    // Nettoie le nom pour le chemin Storage (pas d'accents, espaces ou caractères spéciaux)
    const nomNettoye = file.name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // retire les accents
      .replace(/[^a-zA-Z0-9._-]/g, '_');                   // remplace tout le reste par _
    const chemin = `${agrementId}/${Date.now()}_${nomNettoye}`;
    const { error: upErr } = await supabase.storage.from('agrements').upload(chemin, file, { upsert: true });
    if (upErr) {
      console.error('[agrementsSupabase] Erreur upload PDF :', upErr);
      return { success: false, error: upErr.message };
    }
    // URL signée valable 1 an (bucket privé)
    const { data: signed, error: signErr } = await supabase.storage.from('agrements').createSignedUrl(chemin, 60 * 60 * 24 * 365);
    if (signErr) {
      console.error('[agrementsSupabase] Erreur URL signée :', signErr);
      return { success: false, error: signErr.message };
    }
    return { success: true, chemin, nom: file.name, url: signed.signedUrl };
  } catch (e: any) {
    console.error('[agrementsSupabase] Exception upload PDF :', e);
    return { success: false, error: e?.message || String(e) };
  }
}