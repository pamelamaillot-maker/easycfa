// data/evaluationsEntreprise.ts
// Module Évaluations entreprises/MA - Indicateur 13 Qualiopi
// CFA PAM OI Formation

import { supabase } from '../lib/supabaseClient';

export type EmbaucheEnvisagee = 'oui_cdi' | 'oui_cdd' | 'peut_etre' | 'non' | 'ne_sait_pas';

export interface EvaluationEntreprise {
  id?: string;
  session_code: string;
  session_nom?: string;
  date_reponse?: string;

  ma_nom: string;
  ma_fonction?: string;
  entreprise_nom: string;
  entreprise_siret?: string;

  apprenti_nom: string;
  apprenti_prenom?: string;
  formation?: string;

  note_savoir_faire: number;
  note_savoir_etre: number;
  note_acquisition: number;
  note_communication: number;
  note_satisfaction: number;

  points_forts?: string;
  axes_progression?: string;
  suggestions_cfa?: string;

  embauche_envisagee?: EmbaucheEnvisagee;
  commentaire_embauche?: string;

  ip_address?: string;
  user_agent?: string;
}

export const CRITERES_EVAL_ENTREPRISE = [
  { cle: 'note_savoir_faire',   label: '🛠️ Progression - Savoir-faire',  description: 'Compétences techniques acquises et mises en pratique' },
  { cle: 'note_savoir_etre',    label: '🤝 Progression - Savoir-être',   description: 'Comportement professionnel, autonomie, ponctualité' },
  { cle: 'note_acquisition',    label: '🎓 Acquisition des compétences', description: 'Adéquation entre la formation et le métier visé' },
  { cle: 'note_communication',  label: '📞 Communication CFA / entreprise', description: 'Qualité des échanges avec l\'équipe pédagogique' },
  { cle: 'note_satisfaction',   label: '😊 Satisfaction globale',         description: 'Recommanderiez-vous le CFA à d\'autres entreprises ?' },
] as const;

export type CleCritereEvalEntreprise = typeof CRITERES_EVAL_ENTREPRISE[number]['cle'];

export const LIBELLES_NOTES_ENT: Record<number, string> = {
  1: '😞 Très insuffisant',
  2: '😕 Insuffisant',
  3: '😐 Satisfaisant',
  4: '🙂 Très satisfaisant',
  5: '😍 Excellent',
};

export const LIBELLES_EMBAUCHE: Record<EmbaucheEnvisagee, string> = {
  oui_cdi: '✅ Oui, en CDI',
  oui_cdd: '📝 Oui, en CDD',
  peut_etre: '🤔 Peut-être',
  non: '❌ Non',
  ne_sait_pas: '❓ Ne sait pas encore',
};

export function genererCodeSessionEnt(sessionId: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `ent-${sessionId}-${random}`;
}

export function couleurNote(note: number): string {
  if (note >= 4.5) return '#16a34a';
  if (note >= 3.5) return '#006B68';
  if (note >= 2.5) return '#C8A23A';
  if (note >= 1.5) return '#ea580c';
  return '#dc2626';
}

export async function envoyerEvaluationEntreprise(
  evaluation: Omit<EvaluationEntreprise, 'id' | 'date_reponse'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('evaluations_entreprise')
      .insert([evaluation]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

export async function chargerEvaluationsEntrepriseSession(
  sessionCode: string
): Promise<EvaluationEntreprise[]> {
  try {
    const { data, error } = await supabase
      .from('evaluations_entreprise')
      .select('*')
      .eq('session_code', sessionCode)
      .order('date_reponse', { ascending: false });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export interface StatsEvalEntreprise {
  nbReponses: number;
  moyennes: Record<CleCritereEvalEntreprise, number>;
  moyenneGlobale: number;
  tauxEmbauche: number;
  repartitionEmbauche: Record<EmbaucheEnvisagee, number>;
}

export function calculerStatsEntreprise(evaluations: EvaluationEntreprise[]): StatsEvalEntreprise {
  const nbReponses = evaluations.length;
  const moyennes: Record<CleCritereEvalEntreprise, number> = {
    note_savoir_faire: 0, note_savoir_etre: 0, note_acquisition: 0,
    note_communication: 0, note_satisfaction: 0,
  };
  const repartitionEmbauche: Record<EmbaucheEnvisagee, number> = {
    oui_cdi: 0, oui_cdd: 0, peut_etre: 0, non: 0, ne_sait_pas: 0,
  };

  if (nbReponses === 0) {
    return { nbReponses, moyennes, moyenneGlobale: 0, tauxEmbauche: 0, repartitionEmbauche };
  }

  evaluations.forEach((e) => {
    CRITERES_EVAL_ENTREPRISE.forEach((c) => {
      const n = (e as any)[c.cle] as number;
      if (n >= 1 && n <= 5) moyennes[c.cle] += n;
    });
    if (e.embauche_envisagee) repartitionEmbauche[e.embauche_envisagee]++;
  });

  CRITERES_EVAL_ENTREPRISE.forEach((c) => {
    moyennes[c.cle] = Math.round((moyennes[c.cle] / nbReponses) * 10) / 10;
  });

  const moyenneGlobale = Math.round(
    (Object.values(moyennes).reduce((s, v) => s + v, 0) / 5) * 10
  ) / 10;

  const nbEmbauche = repartitionEmbauche.oui_cdi + repartitionEmbauche.oui_cdd;
  const tauxEmbauche = Math.round((nbEmbauche / nbReponses) * 100);

  return { nbReponses, moyennes, moyenneGlobale, tauxEmbauche, repartitionEmbauche };
}

const STORAGE_KEY = 'easycfa_codes_eval_entreprise_v1';

export function getOrCreateCodeSessionEnt(sessionId: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    if (map[sessionId]) return map[sessionId];
    const code = genererCodeSessionEnt(sessionId);
    map[sessionId] = code;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    return code;
  } catch {
    return genererCodeSessionEnt(sessionId);
  }
}