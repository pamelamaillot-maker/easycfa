// lib/criteresEvaluation.ts
// Référentiel des critères d'évaluation des enseignements — Indicateur 33 RNQ.
//
// ATTENTION : les clés ci-dessous sont les clés du jsonb 'notes' stocké en base.
// Une fois des réponses réelles collectées, elles ne doivent PLUS être modifiées,
// sous peine de rendre les campagnes incomparables entre elles.
// Pour faire évoluer le questionnaire : ajouter un critère, jamais renommer.

export interface CritereEvaluation {
  cle: string;
  libelle: string;
  aide?: string;
}

export const CRITERES_EVALUATION: CritereEvaluation[] = [
  {
    cle: 'objectifs',
    libelle: "Clarté des objectifs de l'activité type",
    aide: "Vous saviez ce que vous deviez être capable de faire à la fin de la période.",
  },
  {
    cle: 'contenus',
    libelle: 'Adéquation des contenus au métier visé',
    aide: "Ce qui a été enseigné correspond à ce qu'on attend de vous en entreprise.",
  },
  {
    cle: 'supports',
    libelle: 'Qualité des supports remis',
    aide: 'Documents, exercices et ressources mis à votre disposition.',
  },
  {
    cle: 'rythme',
    libelle: 'Rythme et progression',
    aide: "Ni trop rapide ni trop lent, l'enchaînement des notions était logique.",
  },
  {
    cle: 'animation',
    libelle: 'Animation et pédagogie',
    aide: "Manière d'expliquer, disponibilité pour répondre aux questions.",
  },
  {
    cle: 'pratique',
    libelle: 'Place accordée à la mise en pratique',
    aide: 'Exercices, cas concrets, mises en situation.',
  },
];

/** Échelle de notation commune au formulaire et à la synthèse. */
export const ECHELLE_NOTES: { valeur: number; libelle: string }[] = [
  { valeur: 1, libelle: 'Pas du tout satisfaisant' },
  { valeur: 2, libelle: 'Peu satisfaisant' },
  { valeur: 3, libelle: 'Satisfaisant' },
  { valeur: 4, libelle: 'Très satisfaisant' },
  { valeur: 5, libelle: 'Excellent' },
];

export const NOTE_MAX = 5;

/** Champs libres du questionnaire, en complément des notes. */
export const CHAMPS_LIBRES = [
  { cle: 'pointsForts', libelle: 'Ce qui vous a le plus aidé à progresser' },
  { cle: 'pointsAmeliorer', libelle: 'Ce qui pourrait être amélioré' },
] as const;

/**
 * Moyenne d'un critère sur l'ensemble des réponses.
 * Retourne null si aucune réponse ne renseigne ce critère.
 */
export function moyenneCritere(
  reponses: { notes?: Record<string, number> }[],
  cle: string
): number | null {
  const valeurs = (reponses || [])
    .map(r => r?.notes?.[cle])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (valeurs.length === 0) return null;
  const somme = valeurs.reduce((a, b) => a + b, 0);
  return Math.round((somme / valeurs.length) * 100) / 100;
}

/**
 * Moyenne générale, tous critères confondus.
 */
export function moyenneGlobale(
  reponses: { notes?: Record<string, number> }[]
): number | null {
  const moyennes = CRITERES_EVALUATION
    .map(c => moyenneCritere(reponses, c.cle))
    .filter((v): v is number => v !== null);
  if (moyennes.length === 0) return null;
  const somme = moyennes.reduce((a, b) => a + b, 0);
  return Math.round((somme / moyennes.length) * 100) / 100;
}

/**
 * Détail par critère, trié du plus faible au plus élevé.
 * Utile pour la synthèse : les critères en tête sont ceux
 * qui appellent une action d'amélioration.
 */
export function detailParCritere(
  reponses: { notes?: Record<string, number> }[]
): { cle: string; libelle: string; moyenne: number | null }[] {
  return CRITERES_EVALUATION
    .map(c => ({ cle: c.cle, libelle: c.libelle, moyenne: moyenneCritere(reponses, c.cle) }))
    .sort((a, b) => {
      if (a.moyenne === null) return 1;
      if (b.moyenne === null) return -1;
      return a.moyenne - b.moyenne;
    });
}

/**
 * Couleur d'affichage d'une moyenne, aux couleurs de la charte.
 */
export function couleurMoyenne(moyenne: number | null): string {
  if (moyenne === null) return '#9CA3AF';
  if (moyenne >= 4) return '#006B68';
  if (moyenne >= 3) return '#C8A23A';
  return '#DC2626';
}