// data/juresSupabase.ts
// Module API Supabase pour la table 'jures' — répertoire des jurés.
//
// Le répertoire s'alimente depuis les jurés saisis dans les sessions d'examen
// (app/examens/page.tsx). La déduplication repose sur une clé normalisée
// nom + prénom : les doublons probables sont SIGNALÉS, jamais fusionnés
// d'office — deux personnes peuvent légitimement porter le même nom.

import { supabase } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Accès REST direct — le SDK Supabase v2.105 échoue silencieusement sur cette
// table (erreur vide {}). Même contournement que examensSupabase.ts.
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

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

export interface Jure {
  id: string;
  nom: string;
  prenom: string;
  cle?: string;
  telephone?: string;
  email?: string;
  specialite?: string;
  formations?: string[];       // sigles TP : ['SC', 'GCF']
  entreprise?: string;
  fonction?: string;
  nbInterventions?: number;
  dernierExamen?: string;      // JJ/MM/AAAA
  actif?: boolean;
  notes?: string;
  archive?: boolean;
  dateCreation?: string;
  dateModification?: string;
}

const CHAMPS_VALIDES_JURE = new Set<string>([
  'id', 'nom', 'prenom', 'cle', 'telephone', 'email', 'specialite',
  'formations', 'entreprise', 'fonction', 'nbInterventions',
  'dernierExamen', 'actif', 'notes', 'archive',
  'dateCreation', 'dateModification',
]);

function nettoyer(raw: any): any {
  const out: any = {};
  for (const [k, v] of Object.entries(raw)) {
    if (CHAMPS_VALIDES_JURE.has(k)) out[k] = v;
  }
  return out;
}

/**
 * Clé de rapprochement : minuscules, sans accents, espaces et tirets réduits.
 * 'DE LA HOGUE' / 'Linda' → 'delahogue|linda'
 */
export function cleJure(nom: string, prenom: string): string {
  const norm = (s: string) => (s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');                        // espaces, tirets, apostrophes
  return `${norm(nom)}|${norm(prenom)}`;
}

export function genererIdJure(nom: string, prenom: string): string {
  return `JURE_${cleJure(nom, prenom).replace('|', '_')}_${Date.now().toString().slice(-5)}`;
}

// ---------------------------------------------------------------------------
// LECTURE
// ---------------------------------------------------------------------------

export async function chargerJures(): Promise<Jure[]> {
  const headers = await getAuthHeaders();
  if (!headers) { console.warn('[juresSupabase] Pas de session, retour [].'); return []; }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jures?select=*&order=nom.asc`, { headers });
    if (!res.ok) { console.error('[juresSupabase] Erreur chargement :', res.status, await res.text()); return []; }
    return (await res.json()) as Jure[];
  } catch (e) { console.error('[juresSupabase] Exception chargement :', e); return []; }
}

/**
 * Cherche un juré par sa clé normalisée.
 * Retourne toutes les correspondances : à charge de l'appelant de trancher.
 */
export async function chercherJureParCle(nom: string, prenom: string): Promise<Jure[]> {
  const headers = await getAuthHeaders();
  if (!headers) return [];
  try {
    const cle = encodeURIComponent(cleJure(nom, prenom));
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jures?select=*&cle=eq.${cle}`, { headers });
    if (!res.ok) { console.error('[juresSupabase] Erreur recherche :', res.status, await res.text()); return []; }
    return (await res.json()) as Jure[];
  } catch (e) { console.error('[juresSupabase] Exception recherche :', e); return []; }
}

// ---------------------------------------------------------------------------
// ÉCRITURE
// ---------------------------------------------------------------------------

export async function creerJure(jure: Jure): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };
  try {
    const maintenant = new Date().toISOString();
    const enr = nettoyer({
      actif: true,
      archive: false,
      formations: [],
      nbInterventions: 0,
      ...jure,
      cle: cleJure(jure.nom, jure.prenom),
      dateCreation: jure.dateCreation || maintenant,
      dateModification: maintenant,
    });
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jures`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(enr),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('[juresSupabase] Erreur création :', res.status, txt);
      return { success: false, error: txt };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[juresSupabase] Exception création :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

export async function modifierJure(id: string, modifications: Partial<Jure>): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };
  try {
    const mods: any = nettoyer({ ...modifications, dateModification: new Date().toISOString() });
    delete mods.id;
    // Si le nom ou le prénom change, la clé doit suivre.
    if (modifications.nom || modifications.prenom) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/jures?select=nom,prenom&id=eq.${encodeURIComponent(id)}`, { headers });
      if (r.ok) {
        const rows = await r.json();
        if (rows && rows.length > 0) {
          mods.cle = cleJure(modifications.nom ?? rows[0].nom, modifications.prenom ?? rows[0].prenom);
        }
      }
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jures?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(mods),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('[juresSupabase] Erreur modification :', res.status, txt);
      return { success: false, error: txt };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[juresSupabase] Exception modification :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

export async function supprimerJure(id: string): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jures?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('[juresSupabase] Erreur suppression :', res.status, txt);
      return { success: false, error: txt };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[juresSupabase] Exception suppression :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

// ---------------------------------------------------------------------------
// ALIMENTATION DEPUIS LES SESSIONS D'EXAMEN
// ---------------------------------------------------------------------------

export interface ResultatSynchro {
  crees: number;
  enrichis: number;
  doublonsProbables: { nom: string; prenom: string; nbFiches: number }[];
  ignores: string[];
  erreurs: string[];
}

/**
 * Parcourt les sessions d'examen et alimente le répertoire :
 *  - crée les jurés absents ;
 *  - met à jour nbInterventions, formations et dernierExamen ;
 *  - complète téléphone / email seulement s'ils sont vides en base
 *    (la fiche du répertoire fait foi, on ne l'écrase pas) ;
 *  - signale les clés portant plusieurs fiches, sans jamais fusionner.
 *
 * @param examens  sessions issues de chargerExamens()
 * @param dateTri  fonction de tri des dates JJ/MM/AAAA (pour dernierExamen)
 */
export async function synchroniserJuresDepuisExamens(
  examens: any[],
  dateTri?: (d: string) => number
): Promise<ResultatSynchro> {
  const res: ResultatSynchro = { crees: 0, enrichis: 0, doublonsProbables: [], ignores: [], erreurs: [] };

  // 1. Agrégation des jurés rencontrés dans les sessions
  const agrege = new Map<string, {
    nom: string; prenom: string; telephone?: string; email?: string; specialite?: string;
    formations: Set<string>; nbInterventions: number; dernierExamen?: string;
  }>();

  for (const ex of examens) {
    for (const j of (ex.jures ?? [])) {
      const nom = (j.nom ?? '').trim();
      const prenom = (j.prenom ?? '').trim();
      if (!nom || !prenom) {
        res.ignores.push(`Session ${ex.numeroCERES ?? ex.id} : juré sans nom ou prénom`);
        continue;
      }
      const cle = cleJure(nom, prenom);
      const e = agrege.get(cle) ?? {
        nom, prenom, telephone: j.telephone, email: j.email, specialite: j.specialite,
        formations: new Set<string>(), nbInterventions: 0, dernierExamen: undefined,
      };
      e.nbInterventions += 1;
      if (ex.formation) e.formations.add(ex.formation);
      if (!e.telephone && j.telephone) e.telephone = j.telephone;
      if (!e.email && j.email) e.email = j.email;
      if (!e.specialite && j.specialite) e.specialite = j.specialite;
      if (ex.dateDebut) {
        if (!e.dernierExamen) e.dernierExamen = ex.dateDebut;
        else if (dateTri && dateTri(ex.dateDebut) > dateTri(e.dernierExamen)) e.dernierExamen = ex.dateDebut;
      }
      agrege.set(cle, e);
    }
  }

  // 2. Confrontation au répertoire existant
  const existants = await chargerJures();
  const parCle = new Map<string, Jure[]>();
  for (const j of existants) {
    const c = j.cle ?? cleJure(j.nom, j.prenom);
    parCle.set(c, [...(parCle.get(c) ?? []), j]);
  }

  // Doublons déjà présents en base : signalés, jamais fusionnés.
  for (const [cle, fiches] of parCle) {
    if (fiches.length > 1) {
      res.doublonsProbables.push({ nom: fiches[0].nom, prenom: fiches[0].prenom, nbFiches: fiches.length });
    }
  }

  // 3. Création ou enrichissement
  for (const [cle, e] of agrege) {
    const fiches = parCle.get(cle) ?? [];

    if (fiches.length === 0) {
      const r = await creerJure({
        id: genererIdJure(e.nom, e.prenom),
        nom: e.nom, prenom: e.prenom,
        telephone: e.telephone, email: e.email, specialite: e.specialite,
        formations: Array.from(e.formations),
        nbInterventions: e.nbInterventions,
        dernierExamen: e.dernierExamen,
      });
      if (r.success) res.crees++;
      else res.erreurs.push(`${e.nom} ${e.prenom} : ${r.error}`);
      continue;
    }

    // Fiche existante : on enrichit la première sans écraser les champs renseignés.
    const fiche = fiches[0];
    const formationsFusionnees = Array.from(new Set([...(fiche.formations ?? []), ...e.formations]));
    const patch: Partial<Jure> = {
      formations: formationsFusionnees,
      nbInterventions: e.nbInterventions,
    };
    if (!fiche.telephone && e.telephone) patch.telephone = e.telephone;
    if (!fiche.email && e.email) patch.email = e.email;
    if (!fiche.specialite && e.specialite) patch.specialite = e.specialite;
    if (e.dernierExamen && (!fiche.dernierExamen ||
        (dateTri && dateTri(e.dernierExamen) > dateTri(fiche.dernierExamen)))) {
      patch.dernierExamen = e.dernierExamen;
    }

    const r = await modifierJure(fiche.id, patch);
    if (r.success) res.enrichis++;
    else res.erreurs.push(`${e.nom} ${e.prenom} : ${r.error}`);
  }

  return res;
}

/**
 * Migration ponctuelle du répertoire localStorage vers Supabase.
 * À n'exécuter qu'une fois.
 */
export async function migrerJuresDepuisLocalStorage(
  jures: any[]
): Promise<{ crees: number; erreurs: string[] }> {
  const erreurs: string[] = [];
  let crees = 0;
  for (const j of jures) {
    const nom = (j.nom ?? '').trim();
    const prenom = (j.prenom ?? '').trim();
    if (!nom || !prenom) { erreurs.push(`Fiche sans nom ou prénom (id ${j.id})`); continue; }
    const r = await creerJure({
      id: j.id ?? genererIdJure(nom, prenom),
      nom, prenom,
      telephone: j.telephone, email: j.email, specialite: j.specialite,
    });
    if (r.success) crees++;
    else erreurs.push(`${nom} ${prenom} : ${r.error}`);
  }
  return { crees, erreurs };
}