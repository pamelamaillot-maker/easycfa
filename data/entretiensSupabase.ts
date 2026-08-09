// data/entretiensSupabase.ts
// Module API Supabase pour la table 'entretiens'

import { supabase } from '../lib/supabaseClient';

export interface Entretien {
  id: string;
  apprenantId: string;
  type?: string;
  datePrevue?: string;
  dateEffective?: string;
  statut?: string;
  realisePar?: string;
  modifiePar?: string;
  supportUtilise?: Record<string, any>;
  presents?: Record<string, boolean>;
  notes?: string;
  decisions?: string;
  motifNonFait?: string;
  dateReport?: string;
  dateCreation?: string;
  dateModification?: string;
}

const CHAMPS_VALIDES_ENTRETIEN = new Set<string>([
  'id', 'apprenantId', 'type', 'datePrevue', 'dateEffective',
  'statut', 'realisePar', 'modifiePar',
  'supportUtilise', 'presents', 'notes',
  'decisions', 'motifNonFait', 'dateReport',
  'dateCreation', 'dateModification',
  'pieces',
]);

export async function chargerEntretiens(): Promise<Entretien[]> {
  try {
    const { data, error } = await supabase
      .from('entretiens')
      .select('*')
      .order('datePrevue', { ascending: true });
    if (error) { console.error('Erreur Supabase chargerEntretiens:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerEntretiens:', e); return []; }
}

/**
 * Charge tous les entretiens d'un apprenant donné.
 */
export async function chargerEntretiensApprenant(apprenantId: string): Promise<Entretien[]> {
  try {
    const { data, error } = await supabase
      .from('entretiens')
      .select('*')
      .eq('apprenantId', apprenantId)
      .order('datePrevue', { ascending: true });
    if (error) { console.error('Erreur Supabase chargerEntretiensApprenant:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerEntretiensApprenant:', e); return []; }
}

export async function creerEntretien(entretien: Entretien): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('entretiens')
      .upsert([{ ...entretien, dateModification: new Date().toISOString() }]);
    if (error) { console.error('Erreur Supabase creerEntretien:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau creerEntretien:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function modifierEntretien(id: string, modifications: Partial<Entretien>): Promise<{ success: boolean; error?: string }> {
  try {
    const mods: any = { ...modifications, dateModification: new Date().toISOString() };
    delete mods.apprenantId; // on ne change pas l'apprenant parent
    const { error } = await supabase.from('entretiens').update(mods).eq('id', id);
    if (error) { console.error('Erreur Supabase modifierEntretien:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau modifierEntretien:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function supprimerEntretien(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('entretiens').delete().eq('id', id);
    if (error) { console.error('Erreur Supabase supprimerEntretien:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau supprimerEntretien:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

/**
 * Supprime tous les entretiens d'un apprenant (utile à la suppression d'apprenant).
 * Normalement la cascade FK le fait déjà, mais c'est un filet de sécurité.
 */
export async function supprimerEntretiensApprenant(apprenantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('entretiens').delete().eq('apprenantId', apprenantId);
    if (error) { console.error('Erreur Supabase supprimerEntretiensApprenant:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau supprimerEntretiensApprenant:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

function nettoyerEntretienPourSupabase(raw: any): Entretien {
  const out: any = {};
  for (const [key, value] of Object.entries(raw)) {
    if (CHAMPS_VALIDES_ENTRETIEN.has(key)) out[key] = value;
  }
  return out as Entretien;
}

export async function migrerEntretiensDepuisLocalStorage(
  entretiens: any[]
): Promise<{ success: number; erreurs: string[]; ignores: string[] }> {
  const erreurs: string[] = [];
  const ignores: string[] = [];
  let success = 0;
  for (const raw of entretiens) {
    const champsIgnores = Object.keys(raw).filter(k => !CHAMPS_VALIDES_ENTRETIEN.has(k));
    if (champsIgnores.length > 0) {
      ignores.push(`${raw.id} : champs ignorés [${champsIgnores.join(', ')}]`);
    }
    const entretienNettoye = nettoyerEntretienPourSupabase(raw);
    const res = await creerEntretien(entretienNettoye);
    if (res.success) success++;
    else erreurs.push(`${raw.id} : ${res.error}`);
  }
  return { success, erreurs, ignores };
}
/**
 * Charge les 2 entretiens obligatoires d'un apprenant depuis Supabase.
 * Crée les entrées manquantes en mémoire (non persistées tant que non saisies).
 */
export async function chargerOuCreerEntretiensSupabase(
  apprenantId: string,
  dateDebutContrat?: string,
  dateFinContrat?: string,
  calculerDatePrevue?: (type: any, d?: string, f?: string) => string | undefined,
  calculerStatut?: (e: any) => any,
): Promise<any[]> {
  const existants = await chargerEntretiensApprenant(apprenantId);
  const types = ['6mois', '2moisAvantFin'];
  const resultat: any[] = [];

  types.forEach(type => {
    let ent: any = existants.find(e => e.type === type);
    if (!ent) {
      const datePrevue = calculerDatePrevue ? calculerDatePrevue(type, dateDebutContrat, dateFinContrat) : '';
      ent = {
        id: `ENT_${apprenantId}_${type}`,
        apprenantId,
        type,
        datePrevue: datePrevue ?? '',
        statut: 'aprevoir',
        dateCreation: new Date().toISOString(),
      };
    } else if (!ent.dateEffective && (dateDebutContrat || dateFinContrat) && calculerDatePrevue) {
      const nouvelle = calculerDatePrevue(type, dateDebutContrat, dateFinContrat);
      if (nouvelle && nouvelle !== ent.datePrevue) ent = { ...ent, datePrevue: nouvelle };
    }
    if (ent.statut !== 'fait' && ent.statut !== 'nonFait' && calculerStatut) {
      ent = { ...ent, statut: calculerStatut(ent) };
    }
    resultat.push(ent);
  });

  return resultat;
}