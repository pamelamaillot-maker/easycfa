// data/sessionsSupabase.ts
// Module API Supabase pour la table 'sessions'

import { supabase } from '../lib/supabaseClient';

export interface PlanningEntry {
  date: string;
  type: string;
  semaine: number;
  formateurId?: string;
  formateurNom?: string;
  module?: string;
}

export interface Session {
  id: string;
  numero?: string;
  formation?: string;
  annee?: string;
  dateDebut?: string;
  dateFin?: string;
  apprenantIds?: string[];
  modules?: any[];
  planning?: PlanningEntry[];
  statut?: string;
  salle?: string;
  notes?: string;
  dateCreation?: string;
  dateModification?: string;
}

const CHAMPS_VALIDES_SESSION = new Set<string>([
  'id', 'numero', 'formation', 'annee', 'dateDebut', 'dateFin',
  'apprenantIds', 'modules', 'planning', 'statut', 'salle', 'notes',
  'dateCreation', 'dateModification',
]);

export async function chargerSessions(): Promise<Session[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('dateDebut', { ascending: true });
    if (error) {
      console.error('Erreur Supabase chargerSessions:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('Erreur réseau chargerSessions:', e);
    return [];
  }
}

export async function chargerSession(id: string): Promise<Session | null> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('Erreur Supabase chargerSession:', error);
      return null;
    }
    return data || null;
  } catch (e) {
    console.error('Erreur réseau chargerSession:', e);
    return null;
  }
}

export async function creerSession(session: Session): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('sessions')
      .upsert([{ ...session, dateModification: new Date().toISOString() }]);
    if (error) {
      console.error('Erreur Supabase creerSession:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau creerSession:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

export async function modifierSession(id: string, modifications: Partial<Session>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ ...modifications, dateModification: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('Erreur Supabase modifierSession:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau modifierSession:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

export async function supprimerSession(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Erreur Supabase supprimerSession:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau supprimerSession:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

function nettoyerSessionPourSupabase(raw: any): Session {
  const out: any = {};
  for (const [key, value] of Object.entries(raw)) {
    if (CHAMPS_VALIDES_SESSION.has(key)) out[key] = value;
  }
  return out as Session;
}

export async function migrerSessionsDepuisLocalStorage(
  sessions: any[]
): Promise<{ success: number; erreurs: string[]; ignores: string[] }> {
  const erreurs: string[] = [];
  const ignores: string[] = [];
  let success = 0;
  for (const raw of sessions) {
    const champsIgnores = Object.keys(raw).filter(k => !CHAMPS_VALIDES_SESSION.has(k));
    if (champsIgnores.length > 0) {
      ignores.push(`${raw.numero || raw.id} : champs ignorés [${champsIgnores.join(', ')}]`);
    }
    const sessionNettoyee = nettoyerSessionPourSupabase(raw);
    const res = await creerSession(sessionNettoyee);
    if (res.success) success++;
    else erreurs.push(`${raw.numero || raw.id} : ${res.error}`);
  }
  return { success, erreurs, ignores };
}