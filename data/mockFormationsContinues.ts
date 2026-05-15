// data/mockFormationsContinues.ts
// CFA PAM OI Formation - Indicateur 22 Qualiopi
// Traçabilité des formations continues suivies par les formateurs
// Storage : localStorage (clé easycfa_formations_continues_v1)

// ============================================================================
// TYPES
// ============================================================================

export type TypeFormationContinue =
  | 'pedagogique'
  | 'technique'
  | 'certification'
  | 'veille';

export type StatutValidite = 'valide' | 'bientot_expire' | 'expire' | 'sans_expiration';

export interface JustificatifFormation {
  nom: string;
  taille: string; // ex: "245 Ko" ou "1.2 Mo"
  dateImport: string; // ISO
}

export interface FormationContinue {
  id: string;
  formateurId: string;          // id du formateur (string)
  formateurNom: string;         // pour affichage / export

  type: TypeFormationContinue;
  intitule: string;
  organisme: string;

  dateDebut: string;            // ISO YYYY-MM-DD
  dateFin: string;              // ISO YYYY-MM-DD
  dureeHeures: number;

  dateExpiration?: string;      // ISO (pour certifs / habilitations)

  competencesVisees: string;    // texte libre / virgules

  justificatif?: JustificatifFormation;

  commentaire?: string;

  dateCreation: string;
  dateModification: string;
  ajoutePar?: string;           // évaluateur (PAMA)
}

// ============================================================================
// LIBELLÉS ET COULEURS
// ============================================================================

export const LABELS_TYPE_FORMATION: Record<TypeFormationContinue, string> = {
  pedagogique: '🎓 Pédagogique',
  technique: '🔧 Technique / Métier',
  certification: '📜 Certification / Habilitation',
  veille: '👁️ Veille professionnelle',
};

export const COULEURS_TYPE: Record<TypeFormationContinue, { bg: string; color: string }> = {
  pedagogique:   { bg: '#dbeafe', color: '#1e40af' }, // bleu
  technique:     { bg: '#dcfce7', color: '#15803d' }, // vert
  certification: { bg: '#ede9fe', color: '#6b21a8' }, // violet
  veille:        { bg: '#fef6e4', color: '#7a5c00' }, // ambre (rappel C8A23A)
};

export const LABELS_STATUT: Record<StatutValidite, string> = {
  valide: '✅ Valide',
  bientot_expire: '⚠️ Expire bientôt',
  expire: '❌ Expirée',
  sans_expiration: '— Sans expiration',
};

export const COULEURS_STATUT: Record<StatutValidite, { bg: string; color: string }> = {
  valide:           { bg: '#dcfce7', color: '#15803d' },
  bientot_expire:   { bg: '#fed7aa', color: '#9a3412' },
  expire:           { bg: '#fde8e8', color: '#c53030' },
  sans_expiration:  { bg: '#f3f4f6', color: '#6b7280' },
};

// ============================================================================
// HELPERS
// ============================================================================

export function getStatutValidite(f: FormationContinue): StatutValidite {
  if (!f.dateExpiration) return 'sans_expiration';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(f.dateExpiration);
  expiration.setHours(0, 0, 0, 0);
  const diffJours = Math.floor((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffJours < 0) return 'expire';
  if (diffJours <= 90) return 'bientot_expire';
  return 'valide';
}

export function dateIsoToFr(iso: string): string {
  if (!iso || !iso.match(/^\d{4}-\d{2}-\d{2}$/)) return iso || '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function dateFrToIso(fr: string): string {
  if (!fr || !fr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return fr || '';
  const [d, m, y] = fr.split('/');
  return `${y}-${m}-${d}`;
}

export function formaterTailleFichier(octets: number): string {
  if (octets > 1024 * 1024) return `${(octets / 1024 / 1024).toFixed(1)} Mo`;
  return `${Math.round(octets / 1024)} Ko`;
}

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = 'easycfa_formations_continues_v1';

function lireToutes(): FormationContinue[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Erreur lecture formations continues:', e);
    return [];
  }
}

function ecrireToutes(formations: FormationContinue[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formations));
  } catch (e) {
    console.error('Erreur sauvegarde formations continues:', e);
    alert(
      "⚠️ Espace de stockage saturé.\n" +
      "Astuce : supprime les justificatifs anciens ou exporte tes données."
    );
    throw e;
  }
}

// ============================================================================
// API publique (alignée sur le style mockEvaluations)
// ============================================================================

export function chargerFormationsFormateur(formateurId: string): FormationContinue[] {
  return lireToutes()
    .filter(f => f.formateurId === formateurId)
    .sort((a, b) => new Date(b.dateFin).getTime() - new Date(a.dateFin).getTime());
}

export function chargerToutesFormations(): FormationContinue[] {
  return lireToutes();
}

export function creerFormationVide(formateurId: string, formateurNom: string): FormationContinue {
  const now = new Date().toISOString();
  return {
    id: `fc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    formateurId,
    formateurNom,
    type: 'pedagogique',
    intitule: '',
    organisme: '',
    dateDebut: '',
    dateFin: '',
    dureeHeures: 0,
    dateExpiration: '',
    competencesVisees: '',
    justificatif: undefined,
    commentaire: '',
    dateCreation: now,
    dateModification: now,
  };
}

export function sauvegarderFormation(formation: FormationContinue, utilisateur?: any): void {
  const toutes = lireToutes();
  const idx = toutes.findIndex(f => f.id === formation.id);
  const now = new Date().toISOString();

  const ajoutePar = utilisateur
    ? `${utilisateur.prenom ?? ''} ${utilisateur.nom ?? ''}`.trim()
    : undefined;

  const aSauver: FormationContinue = {
    ...formation,
    dateModification: now,
    ajoutePar: formation.ajoutePar || ajoutePar,
  };

  if (idx >= 0) {
    toutes[idx] = aSauver;
  } else {
    toutes.push({ ...aSauver, dateCreation: now });
  }

  ecrireToutes(toutes);
}

export function supprimerFormation(id: string): void {
  const toutes = lireToutes().filter(f => f.id !== id);
  ecrireToutes(toutes);
}

// Stats utiles pour audit
export interface StatsFormateur {
  total: number;
  heuresTotal: number;
  heuresAnnee: number;
  parType: Record<TypeFormationContinue, number>;
  certifsExpirees: number;
  certifsBientotExpirees: number;
}

export function calculerStatsFormateur(formateurId: string, anneeRef?: number): StatsFormateur {
  const annee = anneeRef ?? new Date().getFullYear();
  const formations = chargerFormationsFormateur(formateurId);

  const parType: Record<TypeFormationContinue, number> = {
    pedagogique: 0, technique: 0, certification: 0, veille: 0,
  };
  let certifsExpirees = 0;
  let certifsBientotExpirees = 0;

  formations.forEach(f => {
    parType[f.type]++;
    if (f.dateExpiration) {
      const statut = getStatutValidite(f);
      if (statut === 'expire') certifsExpirees++;
      if (statut === 'bientot_expire') certifsBientotExpirees++;
    }
  });

  return {
    total: formations.length,
    heuresTotal: formations.reduce((s, f) => s + f.dureeHeures, 0),
    heuresAnnee: formations
      .filter(f => f.dateFin && new Date(f.dateFin).getFullYear() === annee)
      .reduce((s, f) => s + f.dureeHeures, 0),
    parType,
    certifsExpirees,
    certifsBientotExpirees,
  };
}
