// data/formateursSupabase.ts
// Module API Supabase pour la table 'formateurs'
// CFA PAM OI Formation

import { supabase } from '../lib/supabaseClient';

// ============================================================================
// TYPE Formateur
// ============================================================================

export interface PieceFormateur {
  nom: string;
  date: string;
}

export interface SuiviMensuel {
  mois: string;
  heuresPresence: number;
  heuresDistanciel: number;
  montantDu: number;
  facture?: string;
  dateFacture?: string;
  datePaiement?: string;
}

export interface Intervention {
  id: string;
  date: string;
  formation?: string;
  module?: string;
  heures: number;
  type: 'presentiel' | 'distanciel' | string;
  emargement?: string;
  sessionId?: string;
}

export interface Formateur {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  siret?: string;
  nda?: string;
  statut?: 'Actif' | 'Inactif' | string;
  notes?: string;
  specialites?: string[];
  pieces?: Record<string, PieceFormateur | null>;
  suiviMensuel?: SuiviMensuel[];
  interventions?: Intervention[];
  dateCreation?: string;
  dateModification?: string;
}

// ============================================================================
// API SUPABASE
// ============================================================================

export async function chargerFormateurs(): Promise<Formateur[]> {
  try {
    const { data, error } = await supabase
      .from('formateurs')
      .select('*')
      .order('nom', { ascending: true });
    if (error) {
      console.error('Erreur Supabase chargerFormateurs:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('Erreur réseau chargerFormateurs:', e);
    return [];
  }
}

export async function chargerFormateur(id: string): Promise<Formateur | null> {
  try {
    const { data, error } = await supabase
      .from('formateurs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('Erreur Supabase chargerFormateur:', error);
      return null;
    }
    return data || null;
  } catch (e) {
    console.error('Erreur réseau chargerFormateur:', e);
    return null;
  }
}

export async function creerFormateur(formateur: Formateur): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('formateurs')
      .upsert([{ ...formateur, dateModification: new Date().toISOString() }]);
    if (error) {
      console.error('Erreur Supabase creerFormateur:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau creerFormateur:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

export async function modifierFormateur(id: string, modifications: Partial<Formateur>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('formateurs')
      .update({ ...modifications, dateModification: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('Erreur Supabase modifierFormateur:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau modifierFormateur:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

export async function supprimerFormateur(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('formateurs')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Erreur Supabase supprimerFormateur:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau supprimerFormateur:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Champs valides selon la table Supabase
 */
const CHAMPS_VALIDES_FORMATEUR = new Set<string>([
  'id', 'nom', 'prenom', 'telephone', 'email', 'siret', 'nda', 'statut', 'notes',
  'specialites', 'pieces', 'suiviMensuel', 'interventions',
  'dateCreation', 'dateModification',
]);

function nettoyerFormateurPourSupabase(raw: any): Formateur {
  const out: any = {};
  for (const [key, value] of Object.entries(raw)) {
    if (CHAMPS_VALIDES_FORMATEUR.has(key)) {
      out[key] = value;
    }
  }
  return out as Formateur;
}

export async function migrerFormateursDepuisLocalStorage(
  formateurs: any[]
): Promise<{ success: number; erreurs: string[]; ignores: string[] }> {
  const erreurs: string[] = [];
  const ignores: string[] = [];
  let success = 0;

  for (const raw of formateurs) {
    const champsIgnores = Object.keys(raw).filter(k => !CHAMPS_VALIDES_FORMATEUR.has(k));
    if (champsIgnores.length > 0) {
      ignores.push(`${raw.nom} ${raw.prenom} : champs ignorés [${champsIgnores.join(', ')}]`);
    }

    const formateurNettoye = nettoyerFormateurPourSupabase(raw);
    const res = await creerFormateur(formateurNettoye);
    if (res.success) success++;
    else erreurs.push(`${raw.nom} ${raw.prenom} (${raw.id}) : ${res.error}`);
  }
  return { success, erreurs, ignores };
}