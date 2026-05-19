// data/mandatsSupabase.ts
// Module API Supabase pour la table 'mandats'

import { supabase } from '../lib/supabaseClient';

export interface Mandat {
  id: string;
  entrepriseId?: string;
  entrepriseNom?: string;
  entrepriseAdresse?: string;
  entrepriseSiret?: string;
  entrepriseEmail?: string;
  dateContact?: string;
  formation?: string;
  nbPostes?: number;
  statut?: string;
  dateEnvoiMandat?: string;
  dateSignatureMandat?: string;
  mandatSigne?: string;
  datePublication?: string;
  dateEntretiens?: string;
  profils_proposes?: boolean;
  contrat_conclu?: boolean;
  non_abouti?: boolean;
  annule?: boolean;
  candidats?: any[];
  notes?: string;
  dateCreation?: string;
  dateModification?: string;
}

const CHAMPS_VALIDES_MANDAT = new Set<string>([
  'id', 'entrepriseId', 'entrepriseNom', 'entrepriseAdresse', 'entrepriseSiret', 'entrepriseEmail',
  'dateContact', 'formation', 'nbPostes', 'statut',
  'dateEnvoiMandat', 'dateSignatureMandat', 'mandatSigne', 'datePublication', 'dateEntretiens',
  'profils_proposes', 'contrat_conclu', 'non_abouti', 'annule',
  'candidats', 'notes', 'dateCreation', 'dateModification',
]);

export async function chargerMandats(): Promise<Mandat[]> {
  try {
    const { data, error } = await supabase
      .from('mandats')
      .select('*')
      .order('dateContact', { ascending: false });
    if (error) { console.error('Erreur Supabase chargerMandats:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerMandats:', e); return []; }
}

export async function chargerMandat(id: string): Promise<Mandat | null> {
  try {
    const { data, error } = await supabase.from('mandats').select('*').eq('id', id).maybeSingle();
    if (error) { console.error('Erreur Supabase chargerMandat:', error); return null; }
    return data || null;
  } catch (e) { console.error('Erreur réseau chargerMandat:', e); return null; }
}

export async function creerMandat(mandat: Mandat): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('mandats').upsert([{ ...mandat, dateModification: new Date().toISOString() }]);
    if (error) { console.error('Erreur Supabase creerMandat:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau creerMandat:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function modifierMandat(id: string, modifications: Partial<Mandat>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('mandats').update({ ...modifications, dateModification: new Date().toISOString() }).eq('id', id);
    if (error) { console.error('Erreur Supabase modifierMandat:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau modifierMandat:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function supprimerMandat(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('mandats').delete().eq('id', id);
    if (error) { console.error('Erreur Supabase supprimerMandat:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau supprimerMandat:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

function nettoyerMandatPourSupabase(raw: any): Mandat {
  const out: any = {};
  for (const [key, value] of Object.entries(raw)) {
    if (CHAMPS_VALIDES_MANDAT.has(key)) out[key] = value;
  }
  return out as Mandat;
}

export async function migrerMandatsDepuisLocalStorage(
  mandats: any[]
): Promise<{ success: number; erreurs: string[]; ignores: string[] }> {
  const erreurs: string[] = [];
  const ignores: string[] = [];
  let success = 0;
  for (const raw of mandats) {
    const champsIgnores = Object.keys(raw).filter(k => !CHAMPS_VALIDES_MANDAT.has(k));
    if (champsIgnores.length > 0) ignores.push(`${raw.entrepriseNom || raw.id} : champs ignorés [${champsIgnores.join(', ')}]`);
    const mandatNettoye = nettoyerMandatPourSupabase(raw);
    const res = await creerMandat(mandatNettoye);
    if (res.success) success++;
    else erreurs.push(`${raw.entrepriseNom || raw.id} : ${res.error}`);
  }
  return { success, erreurs, ignores };
}