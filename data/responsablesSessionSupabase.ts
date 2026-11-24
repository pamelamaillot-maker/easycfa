// data/responsablesSessionSupabase.ts
// CRUD Supabase pour les responsables de session d'examen TP
// (titulaire / suppléant déclarés à la DEETS, surveillants)
// Règle DEETS : un responsable ou surveillant ne doit jamais être formateur du groupe évalué.

import { supabase } from '../lib/supabaseClient';

// ────────────────────────────────────────────────────────────────
// TYPE
// ────────────────────────────────────────────────────────────────

export type RoleResponsable = 'titulaire' | 'suppleant' | 'surveillant';

export const LIBELLE_ROLE: Record<RoleResponsable, string> = {
  titulaire: 'Responsable de session (titulaire)',
  suppleant: 'Responsable de session (suppléant)',
  surveillant: 'Surveillant',
};

export type ResponsableSession = {
  id: string;
  nom: string;
  prenom: string;
  fonction?: string | null;
  email?: string | null;
  telephone?: string | null;
  role: RoleResponsable;
  dateDeclarationDeets?: string | null;      // ISO AAAA-MM-JJ
  preuveDeclarationNom?: string | null;
  preuveDeclarationChemin?: string | null;
  titresConcernes: string[];                 // ex. ["SC","ARH"]
  formateurId?: string | null;               // lien formateurs.id si la personne est aussi formatrice
  actif: boolean;
  archive: boolean;
  notes?: string | null;
  dateCreation?: string;
  dateModification?: string;
};

// Colonnes acceptées par la table (évite d'envoyer des champs parasites)
const CHAMPS_VALIDES = new Set<string>([
  'nom', 'prenom', 'fonction', 'email', 'telephone', 'role',
  'dateDeclarationDeets', 'preuveDeclarationNom', 'preuveDeclarationChemin',
  'titresConcernes', 'formateurId', 'actif', 'archive', 'notes',
]);

function nettoyer(obj: Partial<ResponsableSession>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (CHAMPS_VALIDES.has(k)) out[k] = v;
  return out;
}

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
const TABLE = 'responsables_session';
const BUCKET = 'examens';

// ────────────────────────────────────────────────────────────────
// CRUD
// ────────────────────────────────────────────────────────────────

/** Charge tous les responsables, triés par rôle puis nom */
export async function chargerResponsablesSession(): Promise<ResponsableSession[]> {
  const headers = await getAuthHeaders();
  if (!headers) {
    console.warn('[responsablesSession] Pas de session, retour [].');
    return [];
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=role.asc,nom.asc`,
      { headers },
    );
    if (!res.ok) {
      console.error('[responsablesSession] Erreur chargement :', res.status, await res.text());
      return [];
    }
    return await res.json() as ResponsableSession[];
  } catch (e) {
    console.error('[responsablesSession] Exception chargement :', e);
    return [];
  }
}

/** Crée un responsable */
export async function creerResponsableSession(r: Partial<ResponsableSession>): Promise<{ success: boolean; error?: string; data?: ResponsableSession }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(nettoyer(r)),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[responsablesSession] Erreur création :', res.status, errText);
      return { success: false, error: errText };
    }
    const rows = await res.json();
    return { success: true, data: Array.isArray(rows) ? rows[0] : rows };
  } catch (e: any) {
    console.error('[responsablesSession] Exception création :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Met à jour un responsable (par id) */
export async function modifierResponsableSession(id: string, patch: Partial<ResponsableSession>): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };
  try {
    const corps = { ...nettoyer(patch), dateModification: new Date().toISOString() };
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', headers, body: JSON.stringify(corps) },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error('[responsablesSession] Erreur modification :', res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[responsablesSession] Exception modification :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Supprime un responsable (par id) — réservé au profil admin (RLS) */
export async function supprimerResponsableSession(id: string): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error('[responsablesSession] Erreur suppression :', res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[responsablesSession] Exception suppression :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

// ────────────────────────────────────────────────────────────────
// UPLOAD PREUVE DE DÉCLARATION DEETS (bucket "examens")
// ────────────────────────────────────────────────────────────────

/** Upload le mail / courrier de déclaration à la DEETS, renvoie le chemin + l'URL signée */
export async function uploaderPreuveDeclaration(responsableId: string, file: File): Promise<{ success: boolean; error?: string; chemin?: string; nom?: string; url?: string }> {
  try {
    const nomNettoye = file.name
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const chemin = `responsables/${responsableId}/${Date.now()}_${nomNettoye}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(chemin, file, { upsert: true });
    if (upErr) {
      console.error('[responsablesSession] Erreur upload preuve :', upErr);
      return { success: false, error: upErr.message };
    }
    const { data: signed, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(chemin, 60 * 60 * 24 * 365);
    if (signErr) {
      console.error('[responsablesSession] Erreur URL signée :', signErr);
      return { success: false, error: signErr.message };
    }
    return { success: true, chemin, nom: file.name, url: signed.signedUrl };
  } catch (e: any) {
    console.error('[responsablesSession] Exception upload preuve :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** URL signée fraîche pour consulter une preuve déjà archivée */
export async function urlPreuveDeclaration(chemin: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(chemin, 60 * 60);
  if (error) { console.error('[responsablesSession] Erreur URL preuve :', error); return null; }
  return data.signedUrl;
}

// ────────────────────────────────────────────────────────────────
// AIDES MÉTIER
// ────────────────────────────────────────────────────────────────

/** Personnes proposables pour un rôle et un titre donnés (actives, non archivées) */
export function candidatsPourRole(liste: ResponsableSession[], role: RoleResponsable, titre: string): ResponsableSession[] {
  return liste.filter(r =>
    r.actif && !r.archive && r.role === role &&
    (r.titresConcernes ?? []).includes(titre));
}

/** Un titulaire / suppléant non déclaré à la DEETS ne doit pas être désigné */
export function estDeclare(r: ResponsableSession): boolean {
  return r.role === 'surveillant' || !!r.dateDeclarationDeets;
}