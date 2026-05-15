// data/evaluationsFroid.ts
// Module Évaluations à froid 6 mois - Indicateur 30 Qualiopi
// CFA PAM OI Formation

import { supabase } from '../lib/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export type SituationPro =
  | 'emploi_cdi'
  | 'emploi_cdd'
  | 'recherche'
  | 'etudes'
  | 'creation_entreprise'
  | 'autre';

export interface EvaluationFroid {
  id?: string;
  session_code: string;
  session_nom?: string;
  session_formateur?: string;
  date_reponse?: string;

  apprenti_nom?: string | null;

  situation_pro?: SituationPro;
  poste_actuel?: string;
  entreprise_actuelle?: string;
  diplome_obtenu?: boolean;

  note_mise_pratique: number;
  note_impact_poste: number;
  note_acquisition: number;
  note_recommandation: number;
  note_pertinence: number;

  acquis_utiles?: string;
  manques_ressentis?: string;
  suggestions?: string;

  ip_address?: string;
  user_agent?: string;
}

export const CRITERES_EVAL_FROID = [
  { cle: 'note_mise_pratique',  label: '💼 Mise en pratique',         description: 'Avez-vous pu utiliser les compétences acquises au travail ?' },
  { cle: 'note_impact_poste',   label: '📈 Impact sur l\'employabilité', description: 'La formation a-t-elle amélioré votre situation professionnelle ?' },
  { cle: 'note_acquisition',    label: '🎓 Acquisition des compétences', description: 'Les compétences visées sont-elles bien acquises avec le recul ?' },
  { cle: 'note_recommandation', label: '👥 Recommandation',           description: 'Recommanderiez-vous cette formation à un ami ?' },
  { cle: 'note_pertinence',     label: '🎯 Pertinence avec le recul', description: 'Avec 6 mois de recul, la formation était-elle adaptée au métier ?' },
] as const;

export type CleCritereEvalFroid = typeof CRITERES_EVAL_FROID[number]['cle'];

export const LIBELLES_NOTES_FROID: Record<number, string> = {
  1: '😞 Pas du tout',
  2: '😕 Peu',
  3: '😐 Moyennement',
  4: '🙂 Bien',
  5: '😍 Tout à fait',
};

export const LIBELLES_SITUATION: Record<SituationPro, string> = {
  emploi_cdi: '✅ En emploi (CDI)',
  emploi_cdd: '📝 En emploi (CDD / intérim)',
  recherche: '🔍 En recherche d\'emploi',
  etudes: '📚 En poursuite d\'études',
  creation_entreprise: '🚀 Création d\'entreprise',
  autre: '❓ Autre situation',
};

// ============================================================================
// HELPERS
// ============================================================================

export function genererCodeSessionFroid(sessionId: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `froid-${sessionId}-${random}`;
}

export function couleurNote(note: number): string {
  if (note >= 4.5) return '#16a34a';
  if (note >= 3.5) return '#006B68';
  if (note >= 2.5) return '#C8A23A';
  if (note >= 1.5) return '#ea580c';
  return '#dc2626';
}

// ============================================================================
// API SUPABASE
// ============================================================================

export async function envoyerEvaluationFroid(
  evaluation: Omit<EvaluationFroid, 'id' | 'date_reponse'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('evaluations_froid')
      .insert([evaluation]);

    if (error) {
      console.error('Erreur Supabase insert:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

export async function chargerEvaluationsFroidSession(
  sessionCode: string
): Promise<EvaluationFroid[]> {
  try {
    const { data, error } = await supabase
      .from('evaluations_froid')
      .select('*')
      .eq('session_code', sessionCode)
      .order('date_reponse', { ascending: false });

    if (error) {
      console.error('Erreur Supabase select:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('Erreur réseau:', e);
    return [];
  }
}

// ============================================================================
// STATISTIQUES
// ============================================================================

export interface StatsEvalFroid {
  nbReponses: number;
  moyennes: Record<CleCritereEvalFroid, number>;
  moyenneGlobale: number;
  tauxEmploi: number;       // % en CDI ou CDD
  tauxDiplome: number;      // % ayant obtenu le diplôme
  repartitionSituation: Record<SituationPro, number>;
}

export function calculerStatsFroid(evaluations: EvaluationFroid[]): StatsEvalFroid {
  const nbReponses = evaluations.length;

  const moyennes: Record<CleCritereEvalFroid, number> = {
    note_mise_pratique: 0,
    note_impact_poste: 0,
    note_acquisition: 0,
    note_recommandation: 0,
    note_pertinence: 0,
  };

  const repartitionSituation: Record<SituationPro, number> = {
    emploi_cdi: 0,
    emploi_cdd: 0,
    recherche: 0,
    etudes: 0,
    creation_entreprise: 0,
    autre: 0,
  };

  if (nbReponses === 0) {
    return {
      nbReponses,
      moyennes,
      moyenneGlobale: 0,
      tauxEmploi: 0,
      tauxDiplome: 0,
      repartitionSituation,
    };
  }

  let nbDiplomes = 0;

  evaluations.forEach((e) => {
    CRITERES_EVAL_FROID.forEach((c) => {
      const note = (e as any)[c.cle] as number;
      if (note >= 1 && note <= 5) {
        moyennes[c.cle] += note;
      }
    });
    if (e.situation_pro) {
      repartitionSituation[e.situation_pro]++;
    }
    if (e.diplome_obtenu) nbDiplomes++;
  });

  CRITERES_EVAL_FROID.forEach((c) => {
    moyennes[c.cle] = Math.round((moyennes[c.cle] / nbReponses) * 10) / 10;
  });

  const moyenneGlobale =
    Math.round(
      (Object.values(moyennes).reduce((s, v) => s + v, 0) / 5) * 10
    ) / 10;

  const nbEnEmploi = repartitionSituation.emploi_cdi + repartitionSituation.emploi_cdd;
  const tauxEmploi = Math.round((nbEnEmploi / nbReponses) * 100);
  const tauxDiplome = Math.round((nbDiplomes / nbReponses) * 100);

  return {
    nbReponses,
    moyennes,
    moyenneGlobale,
    tauxEmploi,
    tauxDiplome,
    repartitionSituation,
  };
}

// ============================================================================
// CODES SESSION
// ============================================================================

const STORAGE_KEY = 'easycfa_codes_eval_froid_v1';

export function getCodeSessionFroid(sessionId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[sessionId] || null;
  } catch {
    return null;
  }
}

export function setCodeSessionFroid(sessionId: string, code: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[sessionId] = code;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Erreur sauvegarde code:', e);
  }
}

export function getOrCreateCodeSessionFroid(sessionId: string): string {
  let code = getCodeSessionFroid(sessionId);
  if (!code) {
    code = genererCodeSessionFroid(sessionId);
    setCodeSessionFroid(sessionId, code);
  }
  return code;
}
