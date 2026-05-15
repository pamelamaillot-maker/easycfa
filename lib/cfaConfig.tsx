// ============================================================================
// CONFIGURATION DU CFA — Source unique de vérité pour les déclarations
// ============================================================================
// Ce fichier centralise toutes les informations relatives au CFA PAM OI.
// Les pages France Compétences, SIFA, BPF, Qualiopi peuvent lire ces données
// pour éviter les doublons et garantir la cohérence des déclarations.
// ============================================================================

// === Type CFA SIFA (codes officiels) ===
export const TYPE_CFA_OPTIONS = [
  { code: '01', label: 'CFA public (Éducation nationale)' },
  { code: '02', label: 'CFA public (Agriculture)' },
  { code: '03', label: 'CFA consulaire (CCI/CMA)' },
  { code: '04', label: 'CFA privé sous contrat' },
  { code: '05', label: 'CFA privé hors contrat' },
  { code: '06', label: 'CFA d\'entreprise' },
  { code: '07', label: 'CFA d\'OPCA/OPCO' },
  { code: '08', label: 'CFA hospitalier' },
  { code: '09', label: 'CFA associatif' },
  { code: '10', label: 'Autre' },
];

// === Formes juridiques pour France Compétences ===
export const FORMES_JURIDIQUES = [
  'Association',
  'Société commerciale',
  'Établissement public',
  'Autre structure privée',
  'Autre structure publique',
];

// === Région (pour France Compétences) ===
export const REGIONS_FRANCE_COMPETENCES = [
  'Nouvelle-Aquitaine', 'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté',
  'Bretagne', 'Centre-Val de Loire', 'Corse', 'Grand Est', 'Hauts-de-France',
  'Île-de-France', 'Normandie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur',
  'Guadeloupe', 'Guyane', 'Martinique', 'Mayotte', 'Réunion',
  'Saint-Pierre-et-Miquelon', 'Saint-Martin',
];

// ============================================================================
// IDENTITÉ DU CFA
// ============================================================================

export type CfaIdentite = {
  // Identification juridique
  siret: string;
  siren: string;
  raisonSociale: string;
  denominationUsuelle: string;
  nda: string;                      // Numéro Déclaration d'Activité (11 chiffres)
  uai: string;                      // Code UAI (7 chiffres + 1 lettre)
  qualiopi: string;                 // Numéro de certificat Qualiopi
  // Adresse
  adresse1: string;
  adresse2: string;
  codePostal: string;
  ville: string;
  region: string;
  // Représentant légal
  representantLegalNom: string;
  representantLegalPrenom: string;
  representantLegalFonction: string;
  representantLegalEmail: string;
  representantLegalTelephone: string;
  // Structure
  formeJuridique: string;
  cfaEntreprise: 'Oui' | 'Non';
  typeCfa: string;                  // Code SIFA 01-10
};

// === Valeurs par défaut pour PAM OI Formation ===
export const CFA_IDENTITE_DEFAUT: CfaIdentite = {
  siret: '88127939200016',
  siren: '881279392',
  raisonSociale: 'PAM',
  denominationUsuelle: 'PAM OI Formation',
  nda: '04973425197',
  uai: '9741871R',
  qualiopi: '51971543-3',
  adresse1: '1 Chemin Dubuisson',
  adresse2: '',
  codePostal: '97436',
  ville: 'SAINT-LEU',
  region: 'Réunion',
  representantLegalNom: 'MAILLOT',
  representantLegalPrenom: 'Gaëlle Marie Paméla',
  representantLegalFonction: 'Directrice',
  representantLegalEmail: 'pamelamaillot@pamoi.re',
  representantLegalTelephone: '0693556492',
  formeJuridique: 'Autre structure privée',
  cfaEntreprise: 'Non',
  typeCfa: '09',                    // CFA associatif
};

// ============================================================================
// RÉFÉRENT HANDICAP (obligatoire SIFA)
// ============================================================================

export type ReferentHandicapCfa = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
};

export const REFERENT_HANDICAP_DEFAUT: ReferentHandicapCfa = {
  nom: 'REBOUL',
  prenom: 'Betty',
  email: 'pedagogie@pamoi.re',
  telephone: '06 93 55 64 97',
};

// ============================================================================
// HELPERS DE LECTURE / ÉCRITURE LOCALSTORAGE
// ============================================================================

const KEY_CFA = 'easycfa_cfa_identite';
const KEY_REFERENT = 'easycfa_referent_handicap';

/**
 * Récupère l'identité du CFA depuis localStorage, ou retourne les valeurs par défaut.
 * Côté serveur (SSR), retourne toujours les valeurs par défaut.
 */
export function getCfaIdentite(): CfaIdentite {
  if (typeof window === 'undefined') return CFA_IDENTITE_DEFAUT;
  try {
    const saved = localStorage.getItem(KEY_CFA);
    if (saved) {
      return { ...CFA_IDENTITE_DEFAUT, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Erreur lecture CFA :', err);
  }
  return CFA_IDENTITE_DEFAUT;
}

/**
 * Sauvegarde l'identité du CFA dans localStorage.
 */
export function setCfaIdentite(identite: CfaIdentite): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_CFA, JSON.stringify(identite));
    // Recalcul automatique du SIREN si SIRET modifié
    window.dispatchEvent(new Event('easycfa-cfa-updated'));
  } catch (err) {
    console.error('Erreur sauvegarde CFA :', err);
  }
}

/**
 * Réinitialise l'identité du CFA aux valeurs par défaut.
 */
export function resetCfaIdentite(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_CFA);
  window.dispatchEvent(new Event('easycfa-cfa-updated'));
}

/**
 * Récupère le référent handicap depuis localStorage.
 */
export function getReferentHandicap(): ReferentHandicapCfa {
  if (typeof window === 'undefined') return REFERENT_HANDICAP_DEFAUT;
  try {
    const saved = localStorage.getItem(KEY_REFERENT);
    if (saved) {
      return { ...REFERENT_HANDICAP_DEFAUT, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Erreur lecture référent handicap :', err);
  }
  return REFERENT_HANDICAP_DEFAUT;
}

/**
 * Sauvegarde le référent handicap dans localStorage.
 */
export function setReferentHandicap(ref: ReferentHandicapCfa): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_REFERENT, JSON.stringify(ref));
    window.dispatchEvent(new Event('easycfa-cfa-updated'));
  } catch (err) {
    console.error('Erreur sauvegarde référent handicap :', err);
  }
}

/**
 * Réinitialise le référent handicap aux valeurs par défaut.
 */
export function resetReferentHandicap(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_REFERENT);
  window.dispatchEvent(new Event('easycfa-cfa-updated'));
}

// ============================================================================
// HELPERS DÉRIVÉS pour les exports
// ============================================================================

/**
 * Calcule automatiquement le SIREN depuis le SIRET (9 premiers chiffres).
 */
export function deduireSiren(siret: string): string {
  return (siret ?? '').replace(/\s/g, '').substring(0, 9);
}

/**
 * Format complet du représentant légal pour les documents officiels.
 * Ex: "MAILLOT Gaëlle Marie Paméla"
 */
export function representantLegalComplet(identite: CfaIdentite): string {
  return `${identite.representantLegalNom} ${identite.representantLegalPrenom}`.trim();
}

/**
 * Format complet de l'adresse pour les documents officiels.
 */
export function adresseComplete(identite: CfaIdentite): string {
  const ligne2 = identite.adresse2 ? identite.adresse2 + ', ' : '';
  return `${identite.adresse1}, ${ligne2}${identite.codePostal} ${identite.ville}`;
}
