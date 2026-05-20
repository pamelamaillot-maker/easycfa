// data/emargementsSupabase.ts
// Module API Supabase pour la table 'emargements'

import { supabase } from '../lib/supabaseClient';

export interface Presence {
  apprenantId: string;
  nom?: string;
  prenom?: string;
  entreprise?: string;
  emailApprenant?: string;
  emailEntreprise?: string;
  statut?: string;
  heuresComptees?: number;
  emailEnvoye?: boolean;
  justificatifRecu?: boolean;
  heureArrivee?: string;
  [k: string]: any;
}

export interface DemiJournee {
  id: string;
  type?: string;
  heureDebut?: string;
  heureFin?: string;
  heures?: number;
  formateur?: string;
  theme?: string;
  modalite?: string;
  presences?: Presence[];
  valide?: boolean;
  [k: string]: any;
}

export interface Emargement {
  id: string;
  formation?: string;
  formationCode?: string;
  sessionId?: string;
  sessionIds?: string[];
  sessionNumero?: string;
  date?: string;
  jour?: string;
  salle?: string;
  demiJournees?: DemiJournee[];
  dateCreation?: string;
  dateModification?: string;
}

const CHAMPS_VALIDES_EMARGEMENT = new Set<string>([
  'id', 'formation', 'formationCode', 'sessionId', 'sessionIds', 'sessionNumero',
  'date', 'jour', 'salle', 'demiJournees',
  'dateCreation', 'dateModification',
]);

export async function chargerEmargements(): Promise<Emargement[]> {
  try {
    const { data, error } = await supabase
      .from('emargements')
      .select('*')
      .order('date', { ascending: false });
    if (error) { console.error('Erreur Supabase chargerEmargements:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerEmargements:', e); return []; }
}

export async function chargerEmargement(id: string): Promise<Emargement | null> {
  try {
    const { data, error } = await supabase.from('emargements').select('*').eq('id', id).maybeSingle();
    if (error) { console.error('Erreur Supabase chargerEmargement:', error); return null; }
    return data || null;
  } catch (e) { console.error('Erreur réseau chargerEmargement:', e); return null; }
}

export async function chargerEmargementsSession(sessionId: string): Promise<Emargement[]> {
  try {
    const { data, error } = await supabase
      .from('emargements')
      .select('*')
      .eq('sessionId', sessionId)
      .order('date', { ascending: true });
    if (error) { console.error('Erreur Supabase chargerEmargementsSession:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerEmargementsSession:', e); return []; }
}

export async function creerEmargement(emargement: Emargement): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('emargements')
      .upsert([{ ...emargement, dateModification: new Date().toISOString() }]);
    if (error) { console.error('Erreur Supabase creerEmargement:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau creerEmargement:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function modifierEmargement(id: string, modifications: Partial<Emargement>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('emargements')
      .update({ ...modifications, dateModification: new Date().toISOString() })
      .eq('id', id);
    if (error) { console.error('Erreur Supabase modifierEmargement:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau modifierEmargement:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function supprimerEmargement(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('emargements').delete().eq('id', id);
    if (error) { console.error('Erreur Supabase supprimerEmargement:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau supprimerEmargement:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

function nettoyerEmargementPourSupabase(raw: any): Emargement {
  const out: any = {};
  for (const [key, value] of Object.entries(raw)) {
    if (CHAMPS_VALIDES_EMARGEMENT.has(key)) out[key] = value;
  }
  return out as Emargement;
}

export async function migrerEmargementsDepuisLocalStorage(
  emargements: any[]
): Promise<{ success: number; erreurs: string[]; ignores: string[] }> {
  const erreurs: string[] = [];
  const ignores: string[] = [];
  let success = 0;
  for (const raw of emargements) {
    const champsIgnores = Object.keys(raw).filter(k => !CHAMPS_VALIDES_EMARGEMENT.has(k));
    if (champsIgnores.length > 0) {
      ignores.push(`${raw.id} : champs ignorés [${champsIgnores.join(', ')}]`);
    }
    const emargementNettoye = nettoyerEmargementPourSupabase(raw);
    const res = await creerEmargement(emargementNettoye);
    if (res.success) success++;
    else erreurs.push(`${raw.id} : ${res.error}`);
  }
  return { success, erreurs, ignores };
}