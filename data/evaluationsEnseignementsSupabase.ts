// data/evaluationsEnseignementsSupabase.ts
// Module API Supabase pour la table 'evaluations_enseignements'
// Indicateur 33 RNQ — évaluation des contenus et enseignements par les apprentis
// Anonymat structurel : aucun identifiant d'apprenti n'est stocké dans 'reponses'.

import { supabase } from '../lib/supabaseClient';

export type StatutEvaluation = 'brouillon' | 'envoyee' | 'cloturee' | 'analysee';

/**
 * Une réponse anonyme. AUCUN champ ne doit permettre d'identifier l'apprenti :
 * ni nom, ni id, ni email. Seule la date de dépôt est conservée.
 */
export interface ReponseEvaluation {
  dateReponse: string;              // ISO
  notes: Record<string, number>;    // ex. { clarte: 4, rythme: 3, supports: 5 }
  pointsForts?: string;
  pointsAmeliorer?: string;
  commentaire?: string;
}

export interface EvaluationEnseignement {
  id: string;
  sessionId?: string;
  /** Sessions couvertes par la campagne. 36 des 41 interventions de PAM OI
   *  regroupent plusieurs sessions : une campagne rattachée au seul sessionId
   *  laisserait la majorité des apprentis sans questionnaire. */
  sessionIds?: string[];
  /** Jeton du lien public. Identifie la campagne, jamais le répondant. */
  jeton?: string;
  formation?: string;
  activiteType?: string;            // AT1, AT2, AT3
  formateurId?: string;
  formateurNom?: string;
  datePeriodeDebut?: string | null; // date ISO AAAA-MM-JJ
  datePeriodeFin?: string | null;   // date ISO AAAA-MM-JJ
  dateEnvoi?: string | null;        // timestamptz
  dateCloture?: string | null;      // timestamptz
  statut?: StatutEvaluation;
  nbApprenantsAttendus?: number;
  nbReponses?: number;
  reponses?: ReponseEvaluation[];
  synthese?: string;
  actionsAmelioration?: string;
  dateAnalyse?: string | null;      // date ISO AAAA-MM-JJ
  analysePar?: string;
  dateCreation?: string;
  dateModification?: string;
}

const CHAMPS_VALIDES_EVALUATION = new Set<string>([
  'id', 'sessionId', 'sessionIds', 'jeton', 'formation', 'activiteType',
  'formateurId', 'formateurNom',
  'datePeriodeDebut', 'datePeriodeFin',
  'dateEnvoi', 'dateCloture', 'statut',
  'nbApprenantsAttendus', 'nbReponses', 'reponses',
  'synthese', 'actionsAmelioration',
  'dateAnalyse', 'analysePar',
  'dateCreation', 'dateModification',
]);

// Colonnes de type 'date' ou 'timestamp' : une chaîne vide provoque une erreur Postgres.
const CHAMPS_DATE_EVALUATION = [
  'datePeriodeDebut', 'datePeriodeFin',
  'dateEnvoi', 'dateCloture', 'dateAnalyse',
];

/**
 * Remplace les chaînes vides par null sur les colonnes de type date.
 */
function assainirDates(obj: any): any {
  const out = { ...obj };
  for (const champ of CHAMPS_DATE_EVALUATION) {
    if (out[champ] === '' || out[champ] === undefined) out[champ] = null;
  }
  return out;
}

function nettoyerEvaluationPourSupabase(raw: any): any {
  const out: any = {};
  for (const [key, value] of Object.entries(raw)) {
    if (CHAMPS_VALIDES_EVALUATION.has(key)) out[key] = value;
  }
  return assainirDates(out);
}

/**
 * Génère un identifiant lisible : EVAL_<session>_<AT>_<horodatage>
 */
/**
 * Jeton du lien public. Aléatoire et non devinable : il identifie la campagne
 * et rien d'autre. Aucun élément permettant de remonter à un apprenti.
 */
export function genererJeton(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function genererIdEvaluation(sessionId: string, activiteType: string): string {
  return `EVAL_${sessionId}_${activiteType}_${Date.now()}`;
}

/**
 * Taux de réponse en pourcentage entier. Retourne 0 si aucun attendu.
 */
export function tauxReponse(evaluation: EvaluationEnseignement): number {
  const attendus = evaluation.nbApprenantsAttendus || 0;
  const recues = evaluation.nbReponses || 0;
  if (attendus <= 0) return 0;
  return Math.round((recues / attendus) * 100);
}

// ---------------------------------------------------------------------------
// LECTURE
// ---------------------------------------------------------------------------

export async function chargerEvaluationsEnseignements(): Promise<EvaluationEnseignement[]> {
  try {
    const { data, error } = await supabase
      .from('evaluations_enseignements')
      .select('*')
      .order('datePeriodeFin', { ascending: false });
    if (error) { console.error('Erreur Supabase chargerEvaluationsEnseignements:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerEvaluationsEnseignements:', e); return []; }
}

export async function chargerEvaluationsParSession(sessionId: string): Promise<EvaluationEnseignement[]> {
  try {
    const { data, error } = await supabase
      .from('evaluations_enseignements')
      .select('*')
      .eq('sessionId', sessionId)
      .order('activiteType', { ascending: true });
    if (error) { console.error('Erreur Supabase chargerEvaluationsParSession:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerEvaluationsParSession:', e); return []; }
}

/**
 * Charge une évaluation unique.
 * On n'utilise PAS .single() : il fige la requête avec le SDK v2.105.4.
 */
export async function chargerEvaluationEnseignement(id: string): Promise<EvaluationEnseignement | null> {
  try {
    const { data, error } = await supabase
      .from('evaluations_enseignements')
      .select('*')
      .eq('id', id)
      .limit(1);
    if (error) { console.error('Erreur Supabase chargerEvaluationEnseignement:', error); return null; }
    return data && data.length > 0 ? data[0] : null;
  } catch (e) { console.error('Erreur réseau chargerEvaluationEnseignement:', e); return null; }
}

// ---------------------------------------------------------------------------
// ÉCRITURE
// ---------------------------------------------------------------------------

export async function creerEvaluationEnseignement(
  evaluation: EvaluationEnseignement
): Promise<{ success: boolean; error?: string }> {
  try {
    const maintenant = new Date().toISOString();
    const enregistrement = nettoyerEvaluationPourSupabase({
      statut: 'brouillon',
      nbReponses: 0,
      reponses: [],
      ...evaluation,
      dateCreation: evaluation.dateCreation || maintenant,
      dateModification: maintenant,
    });
    const { error } = await supabase
      .from('evaluations_enseignements')
      .upsert([enregistrement]);
    if (error) { console.error('Erreur Supabase creerEvaluationEnseignement:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau creerEvaluationEnseignement:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function modifierEvaluationEnseignement(
  id: string,
  modifications: Partial<EvaluationEnseignement>
): Promise<{ success: boolean; error?: string }> {
  try {
    const mods: any = nettoyerEvaluationPourSupabase({
      ...modifications,
      dateModification: new Date().toISOString(),
    });
    // Ces trois champs ne se modifient jamais par cette voie.
    delete mods.id;
    delete mods.reponses;
    delete mods.nbReponses;
    const { error } = await supabase
      .from('evaluations_enseignements')
      .update(mods)
      .eq('id', id);
    if (error) { console.error('Erreur Supabase modifierEvaluationEnseignement:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau modifierEvaluationEnseignement:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

/**
 * Ouvre la campagne : brouillon -> envoyee. Sans cela aucune réponse n'est acceptée.
 */
export async function envoyerEvaluation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const maintenant = new Date().toISOString();
    const { error } = await supabase
      .from('evaluations_enseignements')
      .update({ statut: 'envoyee', dateEnvoi: maintenant, dateModification: maintenant })
      .eq('id', id);
    if (error) { console.error('Erreur Supabase envoyerEvaluation:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau envoyerEvaluation:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

/**
 * Ajoute une réponse anonyme via la fonction Postgres 'ajouter_reponse_evaluation'.
 * L'ajout est atomique : deux apprentis qui répondent en même temps ne s'écrasent pas.
 * La fonction refuse l'écriture si la campagne n'est pas au statut 'envoyee'.
 */
export async function ajouterReponseAnonyme(
  id: string,
  reponse: ReponseEvaluation
): Promise<{ success: boolean; error?: string }> {
  try {
    const charge: ReponseEvaluation = {
      ...reponse,
      dateReponse: reponse.dateReponse || new Date().toISOString(),
    };
    // Filet de sécurité anonymat : on retire tout champ identifiant qui aurait été passé.
    const interdits = ['apprenantId', 'apprentiId', 'nom', 'prenom', 'email', 'id'];
    for (const champ of interdits) delete (charge as any)[champ];

    const { data, error } = await supabase.rpc('ajouter_reponse_evaluation', {
      p_id: id,
      p_reponse: charge,
    });
    if (error) { console.error('Erreur Supabase ajouterReponseAnonyme:', error); return { success: false, error: error.message }; }
    if (data === false) return { success: false, error: "Cette évaluation n'est plus ouverte aux réponses." };
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau ajouterReponseAnonyme:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

/**
 * Contexte d'une campagne depuis son jeton — appel PUBLIC, sans authentification.
 * Ne renvoie jamais les réponses déjà déposées.
 */
export async function chargerEvaluationParJeton(jeton: string): Promise<{
  id: string; formation: string; activiteType: string; formateurNom: string;
  datePeriodeDebut: string; datePeriodeFin: string; statut: string;
} | null> {
  try {
    const { data, error } = await supabase.rpc('evaluation_par_jeton', { p_jeton: jeton });
    if (error) { console.error('Erreur Supabase chargerEvaluationParJeton:', error); return null; }
    return data && data.length > 0 ? data[0] : null;
  } catch (e) { console.error('Erreur réseau chargerEvaluationParJeton:', e); return null; }
}

/**
 * Dépôt d'une réponse anonyme depuis le lien public.
 * Aucun identifiant d'apprenti n'est transmis ni stocké.
 */
export async function repondreParJeton(
  jeton: string,
  reponse: ReponseEvaluation,
): Promise<{ success: boolean; error?: string }> {
  try {
    const charge: any = { ...reponse, dateReponse: reponse.dateReponse || new Date().toISOString() };
    for (const champ of ['apprenantId', 'apprentiId', 'nom', 'prenom', 'email', 'id']) delete charge[champ];

    const { data, error } = await supabase.rpc('repondre_par_jeton', { p_jeton: jeton, p_reponse: charge });
    if (error) { console.error('Erreur Supabase repondreParJeton:', error); return { success: false, error: error.message }; }
    if (data === false) return { success: false, error: "Cette évaluation n'est plus ouverte aux réponses." };
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau repondreParJeton:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

/**
 * Ferme la campagne : plus aucune réponse acceptée.
 */
export async function cloturerEvaluation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const maintenant = new Date().toISOString();
    const { error } = await supabase
      .from('evaluations_enseignements')
      .update({ statut: 'cloturee', dateCloture: maintenant, dateModification: maintenant })
      .eq('id', id);
    if (error) { console.error('Erreur Supabase cloturerEvaluation:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau cloturerEvaluation:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

/**
 * Enregistre la synthèse et les actions d'amélioration : cloturee -> analysee.
 * C'est cette étape qui matérialise l'exigence de l'indicateur 33
 * (partage des résultats et actions d'amélioration).
 */
export async function analyserEvaluation(
  id: string,
  synthese: string,
  actionsAmelioration: string,
  analysePar: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const maintenant = new Date().toISOString();
    const { error } = await supabase
      .from('evaluations_enseignements')
      .update({
        statut: 'analysee',
        synthese,
        actionsAmelioration,
        analysePar,
        dateAnalyse: maintenant.slice(0, 10),
        dateModification: maintenant,
      })
      .eq('id', id);
    if (error) { console.error('Erreur Supabase analyserEvaluation:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau analyserEvaluation:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function supprimerEvaluationEnseignement(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('evaluations_enseignements')
      .delete()
      .eq('id', id);
    if (error) { console.error('Erreur Supabase supprimerEvaluationEnseignement:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau supprimerEvaluationEnseignement:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}
