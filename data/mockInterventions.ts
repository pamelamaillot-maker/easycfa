// ============================================================================
// FICHE D'INTERVENTION FORMATEUR (Qualiopi)
// Document signé par le formateur attestant du contenu pédagogique d'une journée
// ============================================================================

export type FicheIntervention = {
  // === Identification ===
  id: string;                           // ex: "fiche_<sessionId>_<date>"
  sessionId: string;
  sessionNumero: string;                // ex: "SC-2025-005"
  formationLabel: string;               // ex: "TP Secrétaire Comptable"
  date: string;                          // JJ/MM/AAAA
  jour: string;                          // Lundi, Mardi...
  formateurId: string;
  formateurNom: string;                  // "MAILLOT Gaëlle"

  // === Section 1 — Identification pédagogique ===
  activiteType: string;                  // ex: "Activité Type 2"
  competence: string;                    // ex: "Tenir la comptabilité"
  seance: string;                        // ex: "Séance n°5"

  // === Section 2 — Contenu pédagogique (11 champs Qualiopi) ===
  objectifsSeance: string;               // 1. Objectifs de la séance
  contenusVus: string;                   // 2. Contenus vus
  evaluationRealisee: 'OUI' | 'NON' | ''; // 3. Évaluation réalisée ?
  formatEvaluation: string;              // 4. Format de l'évaluation (si oui)
  outils: string;                        // 5. Outils utilisés
  ressourcesUrl: string;                 // 6. Ressources de synthèse (URL)
  lienDistanciel: string;                // 7. Lien si en ligne (URL)
  difficultes: string;                   // 8. Difficultés rencontrées

  // === Section 3 — Incidents (auto depuis présences + saisie motifs) ===
  retards: { apprenantId: string; nom: string; prenom: string; heureArrivee: string; duree: string; motif: string }[];  // 9 + 10
  absences: { apprenantId: string; nom: string; prenom: string; motif: string; justificatifNom?: string; justificatifUrl?: string; justificatifCheminStorage?: string; justificatifDateImport?: string }[];  // 11

  // === Section 4 — Signature ===
  certifiee: boolean;                    // ☑ "Je certifie"
  dateSignature?: string;                // ISO timestamp
  heureSignature?: string;                // HH:MM
};

export const FICHE_VIDE: Omit<FicheIntervention, 'id' | 'sessionId' | 'sessionNumero' | 'formationLabel' | 'date' | 'jour' | 'formateurId' | 'formateurNom'> = {
  activiteType: '',
  competence: '',
  seance: '',
  objectifsSeance: '',
  contenusVus: '',
  evaluationRealisee: '',
  formatEvaluation: '',
  outils: '',
  ressourcesUrl: '',
  lienDistanciel: '',
  difficultes: '',
  retards: [],
  absences: [],
  certifiee: false,
};

const STORAGE_KEY = 'easycfa_interventions_v1';

// Charge toutes les fiches depuis localStorage
export function chargerFiches(): FicheIntervention[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Sauvegarde toutes les fiches
export function sauvegarderFiches(fiches: FicheIntervention[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fiches));
  } catch (err) {
    console.error('Erreur sauvegarde fiches:', err);
  }
}

// Récupère une fiche par son ID (ou la crée vide si elle n'existe pas)
export function chargerOuCreerFiche(
  feuilleId: string,
  sessionId: string,
  sessionNumero: string,
  formationLabel: string,
  date: string,
  jour: string,
  formateurId: string,
  formateurNom: string,
): FicheIntervention {
  const fiches = chargerFiches();
  const existante = fiches.find(f => f.id === feuilleId);
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

// Sauvegarde une fiche (créée ou mise à jour)
export function sauvegarderFiche(fiche: FicheIntervention): void {
  const fiches = chargerFiches();
  const existante = fiches.findIndex(f => f.id === fiche.id);
  if (existante >= 0) {
    fiches[existante] = fiche;
  } else {
    fiches.push(fiche);
  }
  sauvegarderFiches(fiches);
}

// Supprime une fiche
export function supprimerFiche(id: string): void {
  const fiches = chargerFiches().filter(f => f.id !== id);
  sauvegarderFiches(fiches);
}

// Récupère les fiches d'un formateur
export function fichesParFormateur(formateurId: string): FicheIntervention[] {
  return chargerFiches().filter(f => f.formateurId === formateurId);
}

// Vérification de complétude d'une fiche (champs obligatoires Qualiopi)
export function ficheCompletee(fiche: FicheIntervention): { ok: boolean; manquants: string[] } {
  const manquants: string[] = [];
  if (!fiche.activiteType.trim()) manquants.push('Activité Type');
  if (!fiche.competence.trim()) manquants.push('Compétence');
  if (!fiche.seance.trim()) manquants.push('Séance');
  if (!fiche.objectifsSeance.trim()) manquants.push('Objectifs');
  if (!fiche.contenusVus.trim()) manquants.push('Contenus vus');
  if (!fiche.evaluationRealisee) manquants.push('Évaluation OUI/NON');
  if (fiche.evaluationRealisee === 'OUI' && !fiche.formatEvaluation.trim()) {
    manquants.push('Format d\'évaluation');
  }
  if (!fiche.outils.trim()) manquants.push('Outils');
  // Difficultés, ressources, retards/absences = optionnels (pas tous les jours)
  return { ok: manquants.length === 0, manquants };
}
