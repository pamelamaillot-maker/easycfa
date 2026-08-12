// lib/referentielsTP.ts
// Référentiels des Titres Professionnels dispensés par CFA PAM OI Formation.
//
// SOURCES :
//  - SC, ARH, CV, EC   : fiches RNCP France Compétences
//  - AD, CATL, GCF     : référentiels d'évaluation (REV) officiels PAM OI
//  - FPA               : NON VÉRIFIÉ (aVerifier: true)
//
// Un CCP dont le TP porte aVerifier: true ne doit pas figurer sur un document
// officiel (convocation, procès-verbal, livret de certification) avant contrôle.

export interface CCP {
  code: string;        // CCP1, CCP2, CCP3
  codeBloc: string;    // RNCP37123BC01
  intitule: string;
  ordre: number;
}

export interface ReferentielTP {
  sigle: string;
  intitule: string;
  codeRncp: string;
  codeTitre?: string;              // TP-00140 — code ministère
  millesime?: string;              // millésime du REV
  dateDernierJO?: string;          // ISO
  versionRev?: string;             // ex. REV2_GCF_V09_26072023
  niveau: number;
  ccps: CCP[];
  dateEcheanceEnregistrement?: string; // ISO
  aVerifier?: boolean;
}

export const REFERENTIELS_TP: ReferentielTP[] = [
  {
    sigle: 'SC',
    intitule: 'Secrétaire comptable',
    codeRncp: '37123',
    niveau: 4,
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP37123BC01', ordre: 1,
        intitule: 'Assurer les travaux administratifs de secrétariat au quotidien' },
      { code: 'CCP2', codeBloc: 'RNCP37123BC02', ordre: 2,
        intitule: 'Assurer les opérations comptables au quotidien' },
      { code: 'CCP3', codeBloc: 'RNCP37123BC03', ordre: 3,
        intitule: 'Préparer les opérations comptables périodiques' },
    ],
  },
  {
    sigle: 'ARH',
    intitule: 'Assistant ressources humaines',
    codeRncp: '41366',
    niveau: 5,
    dateEcheanceEnregistrement: '2027-11-04',
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP41366BC01', ordre: 1,
        intitule: 'Assurer les missions opérationnelles de la gestion des ressources humaines' },
      { code: 'CCP2', codeBloc: 'RNCP41366BC02', ordre: 2,
        intitule: 'Contribuer au développement des ressources humaines' },
    ],
  },
  {
    sigle: 'AD',
    intitule: 'Assistant de direction',
    codeRncp: '38667',
    codeTitre: 'TP-01293',
    millesime: '04',
    dateDernierJO: '2024-02-01',
    versionRev: 'REV2_AD_V04_14022024',
    niveau: 5,
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP38667BC01', ordre: 1,
        intitule: "Assurer les fonctions de support administratif et organisationnel à l'équipe de direction" },
      { code: 'CCP2', codeBloc: 'RNCP38667BC02', ordre: 2,
        intitule: "Organiser et suivre les projets et dossiers spécifiques de l'équipe de direction" },
    ],
  },
  {
    sigle: 'GCF',
    intitule: 'Gestionnaire comptable et fiscal',
    codeRncp: '37949',
    codeTitre: 'TP-00140',
    millesime: '09',
    dateDernierJO: '2023-07-21',
    versionRev: 'REV2_GCF_V09_26072023',
    niveau: 5,
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP37949BC01', ordre: 1,
        intitule: 'Établir et présenter les arrêtés comptables périodiques et annuels' },
      { code: 'CCP2', codeBloc: 'RNCP37949BC02', ordre: 2,
        intitule: 'Renseigner et contrôler les déclarations fiscales' },
      { code: 'CCP3', codeBloc: 'RNCP37949BC03', ordre: 3,
        intitule: "Établir et présenter les états prévisionnels de l'activité de l'entreprise" },
    ],
  },
  {
    sigle: 'CATL',
    intitule: "Chargé d'accueil touristique et de loisirs",
    codeRncp: '37396',
    codeTitre: 'TP-01348',
    millesime: '02',
    dateDernierJO: '2023-03-01',
    versionRev: 'REV2_CATL_V02_31082023',
    niveau: 4,
    dateEcheanceEnregistrement: '2028-08-01',
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP37396BC01', ordre: 1,
        intitule: "Gérer une relation clientèle sur une destination et/ou un lieu touristique" },
      { code: 'CCP2', codeBloc: 'RNCP37396BC02', ordre: 2,
        intitule: 'Assister la clientèle sur des prestations touristiques et de loisirs' },
      { code: 'CCP3', codeBloc: 'RNCP37396BC03', ordre: 3,
        intitule: "Contribuer à la mise en œuvre d'événements festifs et culturels" },
    ],
  },
  {
    sigle: 'EC',
    intitule: 'Employé commercial',
    codeRncp: '37099',
    niveau: 3,
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP37099BC01', ordre: 1,
        intitule: "Mettre à disposition des clients les produits de l'unité marchande dans un environnement omnicanal" },
      { code: 'CCP2', codeBloc: 'RNCP37099BC02', ordre: 2,
        intitule: 'Accueillir les clients et répondre à leur demande dans un environnement omnicanal' },
    ],
  },
  {
    sigle: 'CV',
    intitule: 'Conseiller de vente',
    codeRncp: '37098',
    niveau: 4,
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP37098BC01', ordre: 1,
        intitule: "Contribuer à l'efficacité commerciale d'une unité marchande dans un environnement omnicanal" },
      { code: 'CCP2', codeBloc: 'RNCP37098BC02', ordre: 2,
        intitule: "Améliorer l'expérience client dans un environnement omnicanal" },
    ],
  },

  // ---------------------------------------------------------------------
  // À VÉRIFIER — REV non fourni
  // ---------------------------------------------------------------------
  {
    sigle: 'FPA',
    intitule: "Formateur professionnel d'adultes",
    codeRncp: '37275',
    niveau: 5,
    aVerifier: true,
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP37275BC01', ordre: 1, intitule: 'À compléter depuis le REV' },
      { code: 'CCP2', codeBloc: 'RNCP37275BC02', ordre: 2, intitule: 'À compléter depuis le REV' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Accesseurs
// ---------------------------------------------------------------------------

export function referentielParSigle(sigle: string): ReferentielTP | undefined {
  return REFERENTIELS_TP.find(r => r.sigle === sigle);
}

export function ccpsDuTP(sigle: string): CCP[] {
  return referentielParSigle(sigle)?.ccps ?? [];
}

export function libelleCcp(sigle: string, codeCcp: string): string {
  const ccp = ccpsDuTP(sigle).find(c => c.code === codeCcp);
  return ccp ? ccp.intitule : codeCcp;
}

export function referentielAVerifier(sigle: string): boolean {
  return referentielParSigle(sigle)?.aVerifier === true;
}

/** Sigles dont le référentiel reste à vérifier (bannière d'alerte). */
export function tpAVerifier(): string[] {
  return REFERENTIELS_TP.filter(r => r.aVerifier).map(r => r.sigle);
}

/**
 * TP dont l'enregistrement RNCP arrive à échéance dans moins de N jours.
 * Un enregistrement échu interdit l'ouverture de nouveaux parcours.
 */
export function tpEcheanceProche(joursAlerte = 365): { sigle: string; echeance: string; jours: number }[] {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  return REFERENTIELS_TP
    .filter(r => r.dateEcheanceEnregistrement)
    .map(r => {
      const d = new Date(r.dateEcheanceEnregistrement as string);
      const jours = Math.round((d.getTime() - aujourdhui.getTime()) / 86400000);
      return { sigle: r.sigle, echeance: r.dateEcheanceEnregistrement as string, jours };
    })
    .filter(x => x.jours <= joursAlerte)
    .sort((a, b) => a.jours - b.jours);
}

// ---------------------------------------------------------------------------
// Logique de certification
// ---------------------------------------------------------------------------

export type EtatCcp = 'obtenu' | 'non_obtenu' | 'non_presente';

export function ccpsManquants(sigle: string, etats: Record<string, EtatCcp>): CCP[] {
  return ccpsDuTP(sigle).filter(c => etats[c.code] !== 'obtenu');
}

/**
 * Vrai si tous les CCP du titre sont obtenus.
 * L'octroi du titre suppose en plus la validation de l'entretien final.
 */
export function tousCcpsObtenus(sigle: string, etats: Record<string, EtatCcp>): boolean {
  const ccps = ccpsDuTP(sigle);
  return ccps.length > 0 && ccps.every(c => etats[c.code] === 'obtenu');
}

/**
 * Vrai si la session à venir est la dernière d'un parcours par capitalisation,
 * donc si elle doit comporter l'entretien final pour l'octroi du titre.
 * Réf. arrêté du 22 décembre 2015, art. 9.
 */
export function sessionAvecEntretienFinal(
  sigle: string,
  etatsActuels: Record<string, EtatCcp>,
  ccpsPresentes: string[]
): boolean {
  const restants = ccpsManquants(sigle, etatsActuels).map(c => c.code);
  return restants.length > 0 && restants.every(code => ccpsPresentes.includes(code));
}

/**
 * Date limite de représentation après réussite partielle ou échec :
 * un an à compter de la délibération du jury, pour les candidats
 * issus d'un parcours de formation.
 */
export function dateLimiteRepresentation(dateDeliberationIso: string): string | null {
  if (!dateDeliberationIso) return null;
  const d = new Date(dateDeliberationIso);
  if (isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/** Jours restants avant la date limite. Négatif si dépassée. */
export function joursAvantLimite(dateLimiteIso: string | null): number | null {
  if (!dateLimiteIso) return null;
  const limite = new Date(dateLimiteIso);
  if (isNaN(limite.getTime())) return null;
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  limite.setHours(0, 0, 0, 0);
  return Math.round((limite.getTime() - aujourdhui.getTime()) / 86400000);
}