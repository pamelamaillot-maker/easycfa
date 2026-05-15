// types/formationContinue.ts
// Module Indicateur 22 Qualiopi - Formations continues des formateurs
// CFA PAM OI Formation - La Réunion

export type TypeFormationContinue =
  | 'pedagogique'
  | 'technique'
  | 'certification'
  | 'veille';

export const LABELS_TYPE_FORMATION: Record<TypeFormationContinue, string> = {
  pedagogique: '🎓 Formation pédagogique',
  technique: '🔧 Formation technique/métier',
  certification: '📜 Certification / Habilitation',
  veille: '👁️ Veille professionnelle',
};

export const COULEURS_TYPE: Record<TypeFormationContinue, string> = {
  pedagogique: 'bg-blue-100 text-blue-800 border-blue-300',
  technique: 'bg-green-100 text-green-800 border-green-300',
  certification: 'bg-purple-100 text-purple-800 border-purple-300',
  veille: 'bg-amber-100 text-amber-800 border-amber-300',
};

export interface FormationContinue {
  id: string;
  formateurId: string;

  // Type et intitulé
  type: TypeFormationContinue;
  intitule: string;
  organisme: string;

  // Dates et durée
  dateDebut: string;        // ISO YYYY-MM-DD
  dateFin: string;          // ISO YYYY-MM-DD
  dureeHeures: number;

  // Validité (utile surtout pour certifications/habilitations)
  dateExpiration?: string;  // ISO YYYY-MM-DD - optionnel

  // Lien avec le référentiel
  competencesVisees: string[]; // tags / compétences du référentiel formateur

  // Justificatif
  justificatif?: {
    nomFichier: string;
    typeMime: string;
    tailleKo: number;
    dataBase64: string;     // stocké en base64 dans localStorage
    dateUpload: string;     // ISO
  };

  // Commentaire libre
  commentaire?: string;

  // Métadonnées
  dateCreation: string;
  dateModification: string;
}

// Statut de validité pour les certifications
export type StatutValidite = 'valide' | 'bientot_expire' | 'expire' | 'sans_expiration';

export function getStatutValidite(f: FormationContinue): StatutValidite {
  if (!f.dateExpiration) return 'sans_expiration';
  const today = new Date();
  const expiration = new Date(f.dateExpiration);
  const diffJours = Math.floor((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffJours < 0) return 'expire';
  if (diffJours <= 90) return 'bientot_expire'; // alerte 3 mois avant
  return 'valide';
}

export const LABELS_STATUT: Record<StatutValidite, string> = {
  valide: '✅ Valide',
  bientot_expire: '⚠️ Expire bientôt',
  expire: '❌ Expirée',
  sans_expiration: '➖ Sans expiration',
};

export const COULEURS_STATUT: Record<StatutValidite, string> = {
  valide: 'bg-green-100 text-green-800',
  bientot_expire: 'bg-orange-100 text-orange-800',
  expire: 'bg-red-100 text-red-800',
  sans_expiration: 'bg-gray-100 text-gray-700',
};
