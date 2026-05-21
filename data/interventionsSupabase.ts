// data/interventionsSupabase.ts
// Module Supabase pour les fiches d'intervention pédagogique formateur (Qualiopi)

import { supabase } from '../lib/supabaseClient';
import type { FicheIntervention } from './mockInterventions';

const TABLE = 'interventions';

const CHAMPS_VALIDES_INTERVENTION = new Set<string>([
  'id', 'sessionId', 'sessionNumero', 'formationLabel', 'date', 'jour',
  'formateurId', 'formateurNom',
  'activiteType', 'competence', 'seance',
  'objectifsSeance', 'contenusVus', 'evaluationRealisee', 'formatEvaluation',
  'outils', 'ressourcesUrl', 'lienDistanciel', 'difficultes',
  'retards', 'absences',
  'certifiee', 'dateSignature', 'heureSignature',
  'dateCreation', 'dateModification',
]);

function nettoyer(data: any): any {
  const clean: any = {};
  Object.keys(data).forEach(k => {
    if (CHAMPS_VALIDES_INTERVENTION.has(k) && data[k] !== undefined) clean[k] = data[k];
  });
  return clean;
}

/** Charge toutes les fiches d'intervention */
export async function chargerInterventions(): Promise<FicheIntervention[]> {
  const { data, error } = await supabase.from(TABLE).select('*');
  if (error) {
    console.error('[interventions] Erreur chargement:', error);
    return [];
  }
  return (data || []) as FicheIntervention[];
}

/** Charge une fiche par son ID */
export async function chargerIntervention(id: string): Promise<FicheIntervention | null> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('[interventions] Erreur chargement fiche:', error);
    return null;
  }
  return (data as FicheIntervention) || null;
}

/** Charge les fiches d'un formateur */
export async function chargerInterventionsFormateur(formateurId: string): Promise<FicheIntervention[]> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('formateurId', formateurId);
  if (error) {
    console.error('[interventions] Erreur chargement formateur:', error);
    return [];
  }
  return (data || []) as FicheIntervention[];
}

/** Crée ou met à jour une fiche (upsert sur l'id) */
export async function creerIntervention(fiche: FicheIntervention): Promise<{ success: boolean; error?: string }> {
  const clean = nettoyer({ ...fiche, dateModification: new Date().toISOString() });
  const { error } = await supabase.from(TABLE).upsert(clean, { onConflict: 'id' });
  if (error) {
    console.error('[interventions] Erreur creerIntervention:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Modifie une fiche existante (PATCH partiel) */
export async function modifierIntervention(id: string, modifs: Partial<FicheIntervention>): Promise<{ success: boolean; error?: string }> {
  const clean = nettoyer({ ...modifs, dateModification: new Date().toISOString() });
  const { error } = await supabase.from(TABLE).update(clean).eq('id', id);
  if (error) {
    console.error('[interventions] Erreur modifierIntervention:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Supprime une fiche */
export async function supprimerIntervention(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('[interventions] Erreur supprimerIntervention:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
import { FICHE_VIDE } from './mockInterventions';

/**
 * Helper compatibilité — charge une fiche depuis Supabase, sinon la crée vide en mémoire (non persistée).
 * La persistance se fait via sauvegarderFicheSupabase quand l'utilisateur enregistre.
 */
export async function chargerOuCreerFicheSupabase(
  feuilleId: string,
  sessionId: string,
  sessionNumero: string,
  formationLabel: string,
  date: string,
  jour: string,
  formateurId: string,
  formateurNom: string,
): Promise<FicheIntervention> {
  const existante = await chargerIntervention(feuilleId);
  if (existante) return existante;
  return {
    ...FICHE_VIDE,
    id: feuilleId,
    sessionId,
    sessionNumero,
    formationLabel,
    date,
    jour,
    formateurId,
    formateurNom,
  };
}

/**
 * Helper compatibilité — sauvegarde une fiche dans Supabase.
 * Fait un upsert sur l'id (création ou mise à jour automatique).
 */
export async function sauvegarderFicheSupabase(fiche: FicheIntervention): Promise<void> {
  const res = await creerIntervention(fiche);
  if (!res.success) {
    console.error('[interventions] Erreur sauvegarde:', res.error);
  } else {
    console.log(`[Intervention ${fiche.id}] Sauvegardée dans Supabase ✅`);
  }
}