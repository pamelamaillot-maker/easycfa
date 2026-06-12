// ============================================================================
// MODULE APPRÉCIATION FORMATEUR — QUALIOPI INDICATEUR 31
// ============================================================================
// Référence Qualiopi :
//   - Critère 7, Indicateur 31 : Recueil des appréciations des parties prenantes
//     "Le prestataire recueille les appréciations des parties prenantes :
//      bénéficiaires, financeurs, équipes pédagogiques et entreprises concernées."
//
// Le formateur évalue PAM OI Formation (CFA), PAS l'inverse.
// Cela permet d'identifier les axes d'amélioration du CFA selon les formateurs.
// ============================================================================

export type StatutEvaluation = 'brouillon' | 'finalisee' | 'signee';

export interface CritereNote {
  /** Note de 1 à 5 (1 = très insuffisant, 5 = excellent) */
  note: number;
  /** Commentaire libre par critère (optionnel) */
  commentaire?: string;
}

/**
 * Appréciation du formateur sur PAM OI Formation
 * (Le formateur évalue le CFA, pas l'inverse)
 */
export interface EvaluationFormateur {
  /** Identifiant unique : EVAL_FORMATEUR_<formateurId>_<année> */
  id: string;
  /** ID du formateur qui donne son appréciation */
  formateurId: string;
  /** Nom complet du formateur (pour affichage) */
  formateurNom: string;
  /** Année concernée par l'appréciation (ex: 2026) */
  annee: number;
  /** Date à laquelle l'appréciation a été remplie (YYYY-MM-DD) */
  dateEvaluation: string;
  /** Nom de la personne qui a saisi (PAMA, ou le formateur lui-même) */
  evaluateur: string;

  /**
   * Les 10 critères d'appréciation du CFA par le formateur.
   * Chaque critère a une note 1-5 + un commentaire libre optionnel.
   */
  criteres: {
    // Cadre de travail
    locaux: CritereNote;
    equipementsPedagogiques: CritereNote;
    outilsNumeriques: CritereNote;
    // Organisation pédagogique
    constitutionClasses: CritereNote;
    volumeHoraire: CritereNote;
    adequationProgramme: CritereNote;
    // Relation avec le CFA
    communicationDirection: CritereNote;
    suiviAdministratif: CritereNote;
    reactivite: CritereNote;
    // Synthèse
    recommanderaitPamOi: CritereNote;
  };

  /** Note moyenne calculée automatiquement (sur 5) */
  noteMoyenne: number;

  /** Synthèse libre */
  appreciationGlobale?: string;
  pointsForts: string;
  axesAmelioration: string;
  planAmelioration?: string;
  suggestions: string;

  /** Date d'entretien prévue avec le formateur (YYYY-MM-DD) */
  dateEntretien?: string;

  /** Workflow de l'appréciation */
  statut: StatutEvaluation;

  /** PDF de l'appréciation rempli et signé par le formateur (importé après réception) */
  signatureFormateur?: { nom: string; taille: string; dateImport: string };

  /**
   * Confidentialité : true = informations sensibles, accès restreint
   */
  confidentielle: boolean;

  /** Métadonnées */
  dateCreation: string;
  dateModification?: string;
  modifiePar?: string;
}

// ============================================================================
// LIBELLÉS DES 10 CRITÈRES
// ============================================================================

export type CleCritere = keyof EvaluationFormateur['criteres'];

export const CRITERES_FORMATEUR: { cle: CleCritere; label: string; categorie: string; couleurCategorie: string }[] = [
  // 🏢 Cadre de travail
  { cle: 'locaux', label: 'Qualité des locaux (espaces, propreté, accueil)', categorie: '🏢 Cadre de travail', couleurCategorie: '#006B68' },
  { cle: 'equipementsPedagogiques', label: 'Équipements pédagogiques (tableaux, vidéoprojecteurs, matériel)', categorie: '🏢 Cadre de travail', couleurCategorie: '#006B68' },
  { cle: 'outilsNumeriques', label: 'Outils numériques (plateforme, logiciels, ressources)', categorie: '🏢 Cadre de travail', couleurCategorie: '#006B68' },
  // 👥 Organisation pédagogique
  { cle: 'constitutionClasses', label: 'Constitution des classes (niveau, taille, homogénéité)', categorie: '👥 Organisation pédagogique', couleurCategorie: '#C8A23A' },
  { cle: 'volumeHoraire', label: 'Adéquation entre volume horaire estimé et réel', categorie: '👥 Organisation pédagogique', couleurCategorie: '#C8A23A' },
  { cle: 'adequationProgramme', label: 'Adéquation du programme avec le public', categorie: '👥 Organisation pédagogique', couleurCategorie: '#C8A23A' },
  // 🤝 Relation avec le CFA
  { cle: 'communicationDirection', label: 'Communication avec la direction', categorie: '🤝 Relation avec le CFA', couleurCategorie: '#7c3aed' },
  { cle: 'suiviAdministratif', label: 'Suivi administratif (contrats, facturation, paiement)', categorie: '🤝 Relation avec le CFA', couleurCategorie: '#7c3aed' },
  { cle: 'reactivite', label: 'Réactivité face aux demandes', categorie: '🤝 Relation avec le CFA', couleurCategorie: '#7c3aed' },
  // 🌟 Synthèse
  { cle: 'recommanderaitPamOi', label: 'Recommanderiez-vous PAM OI à un autre formateur ?', categorie: '🌟 Synthèse', couleurCategorie: '#0891b2' },
];

export const LIBELLE_NOTE: Record<number, string> = {
  0: '— Non noté',
  1: '⭐ Très insuffisant',
  2: '⭐⭐ Insuffisant',
  3: '⭐⭐⭐ Satisfaisant',
  4: '⭐⭐⭐⭐ Bien',
  5: '⭐⭐⭐⭐⭐ Excellent',
};

export const STATUT_EVAL_STYLE: Record<StatutEvaluation, { bg: string; color: string; label: string; emoji: string }> = {
  brouillon: { bg: '#fef6e4', color: '#7a5c00', label: 'Brouillon', emoji: '📝' },
  finalisee: { bg: '#dcfce7', color: '#15803d', label: 'Finalisée', emoji: '✅' },
  signee: { bg: '#dbeafe', color: '#1e40af', label: 'Reçue signée', emoji: '✍️' },
};

// ============================================================================
// HELPERS — DATES
// ============================================================================

export function dateFrToIso(dateStr: string | undefined): string {
  if (!dateStr) return '';
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [jj, mm, aaaa] = parts;
  return `${aaaa}-${mm.padStart(2, '0')}-${jj.padStart(2, '0')}`;
}

export function dateIsoToFr(dateStr: string | undefined): string {
  if (!dateStr) return '';
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const [aaaa, mm, jj] = parts;
  return `${jj}/${mm}/${aaaa}`;
}

// ============================================================================
// HELPERS — CALCULS
// ============================================================================

/**
 * Calcule la note moyenne (les 10 critères, équipondérés).
 * Les notes à 0 (non noté) sont exclues du calcul.
 */
export function calculerNoteMoyenne(eval_: EvaluationFormateur): number {
  const notes = Object.values(eval_.criteres).map(c => c.note).filter(n => n > 0);
  if (notes.length === 0) return 0;
  const somme = notes.reduce((a, b) => a + b, 0);
  return Math.round((somme / notes.length) * 100) / 100;
}

/**
 * Couleur visuelle d'une note (rouge → orange → vert)
 */
export function couleurNote(note: number): string {
  if (note === 0) return '#888';
  if (note <= 2) return '#e53e3e';
  if (note < 4) return '#C8A23A';
  return '#15803d';
}

// ============================================================================
// PERSISTANCE LOCAL STORAGE
// ============================================================================

const STORAGE_KEY = 'easycfa_evaluations_formateurs_v1';

/**
 * Crée une appréciation vide pour un formateur, sur une année donnée
 */
export function creerEvaluationVide(
  formateurId: string,
  formateurNom: string,
  annee: number,
): EvaluationFormateur {
  const critereVide: CritereNote = { note: 0, commentaire: '' };
  return {
    id: `EVAL_FORMATEUR_${formateurId}_${annee}`,
    formateurId,
    formateurNom,
    annee,
    dateEvaluation: '',
    evaluateur: '',
    criteres: {
      locaux: { ...critereVide },
      equipementsPedagogiques: { ...critereVide },
      outilsNumeriques: { ...critereVide },
      constitutionClasses: { ...critereVide },
      volumeHoraire: { ...critereVide },
      adequationProgramme: { ...critereVide },
      communicationDirection: { ...critereVide },
      suiviAdministratif: { ...critereVide },
      reactivite: { ...critereVide },
      recommanderaitPamOi: { ...critereVide },
    },
    noteMoyenne: 0,
    pointsForts: '',
    axesAmelioration: '',
    suggestions: '',
    statut: 'brouillon',
    confidentielle: true,
    dateCreation: new Date().toISOString(),
  };
}

/**
 * Charge toutes les appréciations depuis localStorage
 */
export function chargerEvaluationsFormateurs(): EvaluationFormateur[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Sauvegarde la liste complète
 */
export function sauvegarderEvaluationsFormateurs(liste: EvaluationFormateur[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(liste));
}

/**
 * Récupère les appréciations d'un formateur spécifique (toutes années confondues)
 */
export function chargerEvaluationsFormateur(formateurId: string): EvaluationFormateur[] {
  const tous = chargerEvaluationsFormateurs();
  return tous
    .filter(e => e.formateurId === formateurId)
    .sort((a, b) => b.annee - a.annee);
}

/**
 * Récupère l'appréciation d'un formateur pour une année donnée
 */
export function chargerEvaluationFormateurAnnee(
  formateurId: string,
  annee: number,
): EvaluationFormateur | null {
  const tous = chargerEvaluationsFormateurs();
  return tous.find(e => e.formateurId === formateurId && e.annee === annee) || null;
}

/**
 * Sauvegarde une appréciation (création ou mise à jour)
 * Recalcule automatiquement la note moyenne
 */
export function sauvegarderEvaluation(evaluation: EvaluationFormateur, utilisateur?: any) {
  const tous = chargerEvaluationsFormateurs();
  const idx = tous.findIndex(e => e.id === evaluation.id);

  const noteMoyenne = calculerNoteMoyenne(evaluation);

  const aJour: EvaluationFormateur = {
    ...evaluation,
    noteMoyenne,
    dateModification: new Date().toISOString(),
    modifiePar: utilisateur?.identifiant ?? 'inconnu',
  };

  if (idx >= 0) {
    tous[idx] = aJour;
  } else {
    tous.push(aJour);
  }
  sauvegarderEvaluationsFormateurs(tous);
  return aJour;
}

/**
 * Supprime une appréciation
 */
export function supprimerEvaluation(id: string) {
  const tous = chargerEvaluationsFormateurs();
  const filtres = tous.filter(e => e.id !== id);
  sauvegarderEvaluationsFormateurs(filtres);
}

/**
 * Supprime toutes les appréciations d'un formateur (si formateur supprimé)
 */
export function supprimerEvaluationsFormateur(formateurId: string) {
  const tous = chargerEvaluationsFormateurs();
  const filtres = tous.filter(e => e.formateurId !== formateurId);
  sauvegarderEvaluationsFormateurs(filtres);
}

/**
 * Statistiques globales pour dashboard
 * = perception globale du CFA par les formateurs
 */
export function statistiquesEvaluations(): {
  total: number;
  brouillons: number;
  finalisees: number;
  signees: number;
  noteMoyenneGlobale: number;
} {
  const tous = chargerEvaluationsFormateurs();
  const brouillons = tous.filter(e => e.statut === 'brouillon').length;
  const finalisees = tous.filter(e => e.statut === 'finalisee').length;
  const signees = tous.filter(e => e.statut === 'signee').length;
  const notes = tous.map(e => e.noteMoyenne).filter(n => n > 0);
  const noteMoyenneGlobale = notes.length > 0
    ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 100) / 100
    : 0;
  return {
    total: tous.length,
    brouillons,
    finalisees,
    signees,
    noteMoyenneGlobale,
  };
}
