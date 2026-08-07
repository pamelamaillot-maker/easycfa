// ============================================================================
// MODULE ENTRETIENS DE SUIVI QUALIOPI
// ============================================================================
// Référence Qualiopi : Indicateurs 11, 13, 14 (spécifique CFA)
//
// Chaque apprenti doit bénéficier de 2 entretiens obligatoires :
//   1. Entretien à 6 mois après début du contrat — bilan mi-parcours
//   2. Entretien à 2 mois avant la fin du contrat — préparation post-formation
//
// Acteurs impliqués (terminologie CFA officielle) :
//   - L'apprenti
//   - Le formateur (CFA)
//   - Le maître d'apprentissage (entreprise)
//   - L'employeur / représentant entreprise
//   - Le responsable légal (si apprenti mineur)
// ============================================================================

export type TypeEntretien = '6mois' | '2moisAvantFin';

export type StatutEntretien = 'aprevoir' | 'aFaire' | 'fait' | 'nonFait' | 'enRetard';

export interface Entretien {
  /** Identifiant unique de l'entretien (ex: ENT_LALMA_001_6mois) */
  id: string;
  /** ID de l'apprenant concerné */
  apprenantId: string;
  /** Type d'entretien (6mois ou 2moisAvantFin) */
  type: TypeEntretien;

  /** Date prévue (calculée automatiquement) — format ISO YYYY-MM-DD */
  datePrevue: string;
  /** Date effective de l'entretien (si effectué) — format ISO YYYY-MM-DD */
  dateEffective?: string;

  /** Statut de l'entretien */
  statut: StatutEntretien;

  /** ID ou nom de la personne qui a réalisé l'entretien (PAMA, BERE, NOVE) */
  realisePar?: string;

  /**
   * Support utilisé pendant l'entretien.
   * Pour PAM OI : le livret d'apprentissage est le SEUL support officiel.
   * Possibilité d'uploader le livret signé après l'entretien.
   */
  supportUtilise?: {
    livretApprentissage: boolean;
    /** Livret signé importé après l'entretien (PJ) */
    livretSigne?: { nom: string; taille: string; dateImport: string };
  };

  /**
   * Présents à l'entretien — terminologie officielle CFA.
   * - apprenti
   * - formateur (CFA)
   * - maîtreApprentissage (entreprise, désigné dans le contrat)
   * - employeur (chef d'entreprise / dirigeant)
   * - responsableLegal (si apprenti mineur)
   */
  presents?: {
    apprenti: boolean;
    formateur: boolean;
    maitreApprentissage: boolean;
    employeur: boolean;
    responsableLegal: boolean;
  };

  /** Compte-rendu / observations / décisions */
  notes?: string;

  /** Décisions prises (plan d'action) */
  decisions?: string;

  /** Si non effectué : motif */
  motifNonFait?: string;

  /** Date prévue de report si non effectué */
  dateReport?: string;

  /** Métadonnées */
  dateCreation: string;
  dateModification?: string;
  modifiePar?: string;
}

// ============================================================================
// CALCULS DES DATES PRÉVUES
// ============================================================================

function parseDateFr(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const v = String(dateStr).trim();
  if (v.includes('-')) {
    const d = new Date(v.slice(0, 10));
    return isNaN(d.getTime()) ? null : d;
  }
  const parts = v.split('/');
  if (parts.length !== 3) return null;
  const [jj, mm, aaaa] = parts;
  const d = new Date(`${aaaa}-${mm.padStart(2, '0')}-${jj.padStart(2, '0')}`);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateFr(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const jj = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${jj}/${mm}/${d.getFullYear()}`;
}

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

export function calculerDatePrevue(
  type: TypeEntretien,
  dateDebutContrat?: string,
  dateFinContrat?: string,
): string | undefined {
  if (type === '6mois') {
    const debut = parseDateFr(dateDebutContrat);
    if (!debut) return undefined;
    const prevue = new Date(debut);
    prevue.setMonth(prevue.getMonth() + 6);
    return prevue.toISOString().slice(0, 10);
  }
  if (type === '2moisAvantFin') {
    const fin = parseDateFr(dateFinContrat);
    if (!fin) return undefined;
    const prevue = new Date(fin);
    prevue.setMonth(prevue.getMonth() - 2);
    return prevue.toISOString().slice(0, 10);
  }
  return undefined;
}

export function calculerStatut(entretien: Partial<Entretien>): StatutEntretien {
  if (entretien.statut === 'fait') return 'fait';
  if (entretien.statut === 'nonFait') return 'nonFait';

  if (!entretien.datePrevue) return 'aprevoir';

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const prevue = new Date(entretien.datePrevue);
  prevue.setHours(0, 0, 0, 0);

  const joursAvant = Math.floor((prevue.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24));

  if (joursAvant < -7) return 'enRetard';
  if (joursAvant <= 30) return 'aFaire';
  return 'aprevoir';
}

// ============================================================================
// LIBELLÉS POUR AFFICHAGE
// ============================================================================

export const LIBELLE_TYPE: Record<TypeEntretien, string> = {
  '6mois': 'Entretien à 6 mois',
  '2moisAvantFin': 'Entretien 2 mois avant fin',
};

export const LIBELLE_TYPE_LONG: Record<TypeEntretien, string> = {
  '6mois': 'Entretien de mi-parcours (6 mois après début contrat)',
  '2moisAvantFin': 'Entretien de fin de parcours (2 mois avant fin contrat)',
};

export const INDICATEUR_QUALIOPI: Record<TypeEntretien, string> = {
  '6mois': 'Indicateur 11 — Suivi de l\'apprenti',
  '2moisAvantFin': 'Indicateur 13 — Préparation insertion/poursuite',
};

export const STATUT_STYLE: Record<StatutEntretien, { bg: string; color: string; label: string; emoji: string }> = {
  aprevoir: { bg: '#f0f0f0', color: '#888', label: 'À prévoir', emoji: '⚪' },
  aFaire: { bg: '#fef6e4', color: '#C8A23A', label: 'À faire', emoji: '🟡' },
  enRetard: { bg: '#fde8e8', color: '#e53e3e', label: 'En retard', emoji: '🔴' },
  fait: { bg: '#dcfce7', color: '#15803d', label: 'Effectué', emoji: '🟢' },
  nonFait: { bg: '#fde8e8', color: '#c53030', label: 'Non fait', emoji: '❌' },
};

export const MOTIFS_NON_FAIT = [
  'Apprenti absent / non joignable',
  'Apprenti en rupture de contrat',
  'Apprenti malade ou en arrêt',
  'Indisponibilité employeur / maître d\'apprentissage',
  'Indisponibilité formateur / CFA',
  'Apprenti ayant quitté la formation',
  'Report demandé par l\'apprenti',
  'Report demandé par l\'employeur',
  'Conditions sanitaires / cas de force majeure',
  'Autre (préciser dans les notes)',
];

// ============================================================================
// PERSISTANCE LOCAL STORAGE
// ============================================================================

const STORAGE_KEY = 'easycfa_entretiens_v1';

export function chargerEntretiens(): Entretien[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function sauvegarderEntretiens(liste: Entretien[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(liste));
}

export function chargerOuCreerEntretiensApprenant(
  apprenantId: string,
  dateDebutContrat?: string,
  dateFinContrat?: string,
): Entretien[] {
  const tous = chargerEntretiens();
  const existants = tous.filter(e => e.apprenantId === apprenantId);

  const types: TypeEntretien[] = ['6mois', '2moisAvantFin'];
  const resultat: Entretien[] = [];

  types.forEach(type => {
    let entretien = existants.find(e => e.type === type);
    if (!entretien) {
      const datePrevue = calculerDatePrevue(type, dateDebutContrat, dateFinContrat);
      entretien = {
        id: `ENT_${apprenantId}_${type}`,
        apprenantId,
        type,
        datePrevue: datePrevue ?? '',
        statut: 'aprevoir',
        dateCreation: new Date().toISOString(),
      };
    } else if (!entretien.dateEffective && (dateDebutContrat || dateFinContrat)) {
      const nouvelle = calculerDatePrevue(type, dateDebutContrat, dateFinContrat);
      if (nouvelle && nouvelle !== entretien.datePrevue) {
        entretien = { ...entretien, datePrevue: nouvelle };
      }
    }
    if (entretien.statut !== 'fait' && entretien.statut !== 'nonFait') {
      entretien = { ...entretien, statut: calculerStatut(entretien) };
    }
    resultat.push(entretien);
  });

  return resultat;
}

export function sauvegarderEntretien(entretien: Entretien) {
  const tous = chargerEntretiens();
  const idx = tous.findIndex(e => e.id === entretien.id);
  const entretienAJour = {
    ...entretien,
    dateModification: new Date().toISOString(),
  };
  if (idx >= 0) {
    tous[idx] = entretienAJour;
  } else {
    tous.push(entretienAJour);
  }
  sauvegarderEntretiens(tous);
}

export function supprimerEntretiensApprenant(apprenantId: string) {
  const tous = chargerEntretiens();
  const filtres = tous.filter(e => e.apprenantId !== apprenantId);
  sauvegarderEntretiens(filtres);
}

export function statistiquesEntretiens(): {
  total: number;
  faits: number;
  aFaire: number;
  enRetard: number;
  nonFaits: number;
  tauxRealisation: number;
} {
  const tous = chargerEntretiens();
  const faits = tous.filter(e => e.statut === 'fait').length;
  const aFaire = tous.filter(e => e.statut === 'aFaire' || e.statut === 'aprevoir').length;
  const enRetard = tous.filter(e => e.statut === 'enRetard').length;
  const nonFaits = tous.filter(e => e.statut === 'nonFait').length;
  const total = tous.length;
  const tauxRealisation = total > 0 ? Math.round((faits / total) * 100) : 0;
  return { total, faits, aFaire, enRetard, nonFaits, tauxRealisation };
}
