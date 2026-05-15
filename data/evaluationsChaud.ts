// data/evaluationsChaud.ts
// Module Évaluations à chaud apprenants - Indicateurs 30/31 Qualiopi
// CFA PAM OI Formation

import { supabase } from '../lib/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface EvaluationChaud {
  id?: string;
  session_code: string;
  session_nom?: string;
  session_formateur?: string;
  date_reponse?: string;

  apprenti_nom?: string | null;

  note_pedagogie: number;
  note_contenu: number;
  note_organisation: number;
  note_objectifs: number;
  note_satisfaction: number;

  points_forts?: string;
  points_ameliorer?: string;
  suggestions?: string;

  ip_address?: string;
  user_agent?: string;
}

export const CRITERES_EVAL_CHAUD = [
  { cle: 'note_pedagogie',    label: '👨‍🏫 Pédagogie du formateur', description: 'Qualité de l\'animation, clarté des explications' },
  { cle: 'note_contenu',      label: '📚 Contenu de la formation', description: 'Pertinence du programme, qualité des supports' },
  { cle: 'note_organisation', label: '🏢 Organisation',             description: 'Durée, rythme, conditions matérielles' },
  { cle: 'note_objectifs',    label: '🎯 Atteinte des objectifs',   description: 'Compétences acquises, utilité pour le métier' },
  { cle: 'note_satisfaction', label: '😊 Satisfaction globale',     description: 'Recommanderiez-vous cette formation ?' },
] as const;

export type CleCritereEvalChaud = typeof CRITERES_EVAL_CHAUD[number]['cle'];

export const LIBELLES_NOTES: Record<number, string> = {
  1: '😞 Très insatisfait',
  2: '😕 Insatisfait',
  3: '😐 Moyen',
  4: '🙂 Satisfait',
  5: '😍 Très satisfait',
};

// ============================================================================
// HELPERS
// ============================================================================

export function genererCodeSession(sessionId: string): string {
  // Code court mais unique pour l'URL publique
  // ex: "abc-123-xyz"
  const random = Math.random().toString(36).slice(2, 8);
  return `${sessionId}-${random}`;
}

export function couleurNote(note: number): string {
  if (note >= 4.5) return '#16a34a'; // vert
  if (note >= 3.5) return '#006B68'; // vert PAM
  if (note >= 2.5) return '#C8A23A'; // or
  if (note >= 1.5) return '#ea580c'; // orange
  return '#dc2626';                  // rouge
}

// ============================================================================
// API SUPABASE - Côté apprenti (insertion)
// ============================================================================

export async function envoyerEvaluation(
  evaluation: Omit<EvaluationChaud, 'id' | 'date_reponse'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('evaluations_chaud')
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

// ============================================================================
// API SUPABASE - Côté admin (lecture)
// ============================================================================

export async function chargerEvaluationsSession(
  sessionCode: string
): Promise<EvaluationChaud[]> {
  try {
    const { data, error } = await supabase
      .from('evaluations_chaud')
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

export interface StatsEvalChaud {
  nbReponses: number;
  moyennes: Record<CleCritereEvalChaud, number>;
  moyenneGlobale: number;
  distribution: Record<CleCritereEvalChaud, Record<number, number>>;
}

export function calculerStats(evaluations: EvaluationChaud[]): StatsEvalChaud {
  const nbReponses = evaluations.length;

  const moyennes: Record<CleCritereEvalChaud, number> = {
    note_pedagogie: 0,
    note_contenu: 0,
    note_organisation: 0,
    note_objectifs: 0,
    note_satisfaction: 0,
  };

  const distribution: Record<CleCritereEvalChaud, Record<number, number>> = {
    note_pedagogie:    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    note_contenu:      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    note_organisation: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    note_objectifs:    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    note_satisfaction: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  if (nbReponses === 0) {
    return { nbReponses, moyennes, moyenneGlobale: 0, distribution };
  }

  evaluations.forEach((e) => {
    CRITERES_EVAL_CHAUD.forEach((c) => {
      const note = (e as any)[c.cle] as number;
      if (note >= 1 && note <= 5) {
        moyennes[c.cle] += note;
        distribution[c.cle][note]++;
      }
    });
  });

  CRITERES_EVAL_CHAUD.forEach((c) => {
    moyennes[c.cle] = Math.round((moyennes[c.cle] / nbReponses) * 10) / 10;
  });

  const moyenneGlobale =
    Math.round(
      (Object.values(moyennes).reduce((s, v) => s + v, 0) / 5) * 10
    ) / 10;

  return { nbReponses, moyennes, moyenneGlobale, distribution };
}

// ============================================================================
// PERSISTANCE DU CODE SESSION (localStorage admin)
// ============================================================================
// Stocke le code unique de la session pour ne pas le régénérer à chaque fois

const STORAGE_KEY = 'easycfa_codes_eval_chaud_v1';

export function getCodeSession(sessionId: string): string | null {
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

export function setCodeSession(sessionId: string, code: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[sessionId] = code;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Erreur sauvegarde code session:', e);
  }
}

export function getOrCreateCodeSession(sessionId: string): string {
  let code = getCodeSession(sessionId);
  if (!code) {
    code = genererCodeSession(sessionId);
    setCodeSession(sessionId, code);
  }
  return code;
}
