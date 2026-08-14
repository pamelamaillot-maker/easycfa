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

export interface DureesCcp {
  msp?: string;
  et?: string;
  qap?: string;
  qp?: string;
}

export interface CCP {
  code: string;
  codeBloc: string;
  intitule: string;
  ordre: number;
  numeroCp?: string;
  durees?: DureesCcp;
}

/**
 * Découpage de la mise en situation lorsqu'elle donne lieu à DEUX passages
 * distincts appelant chacun une signature (cas de l'AD : partie orale
 * obligatoirement après la partie écrite, devant le jury).
 * Un simple découpage interne d'une MSP continue ne se déclare PAS ici :
 * le candidat signe une fois pour l'épreuve, quel que soit son déroulé.
 */
export interface MspEnDeuxTemps {
  ecrite: string;   // ex. '4h30'
  orale: string;    // ex. '0h30'
}

export interface ReferentielTP {
  sigle: string;
  intitule: string;
  mspDeuxTemps?: MspEnDeuxTemps;   // session titre uniquement
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
    codeTitre: 'TP-00402',
    niveau: 4,
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP37123BC01', ordre: 1, numeroCp: 'CP-003056',
        durees: { msp: '1h30', et: '0h20' },   // REV V09 — total session CCP 01h50
        intitule: 'Assurer les travaux administratifs de secrétariat au quotidien' },
      { code: 'CCP2', codeBloc: 'RNCP37123BC02', ordre: 2, numeroCp: 'CP-003057',
        durees: { msp: '2h00', et: '0h15' },   // DTE 01v02 du 29/01/2025
        intitule: 'Assurer les opérations comptables au quotidien' },
      { code: 'CCP3', codeBloc: 'RNCP37123BC03', ordre: 3, numeroCp: 'CP-003058',
        durees: { msp: '1h30', et: '0h15' },   // DTE 01v01 du 31/05/2023
        intitule: 'Préparer les opérations comptables périodiques' },
    ],
  },
  {
    sigle: 'ARH',
    intitule: 'Assistant ressources humaines',
    codeRncp: '41366',            // ex-RNCP 35030 — seul l'enregistrement a changé
    codeTitre: 'TP-01284',
    versionRev: 'REV2_ARH_V03_03082020',  // REV inchangé, prorogé jusqu'au 04/11/2027
    niveau: 5,
    dateEcheanceEnregistrement: '2027-11-04',
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP41366BC01', ordre: 1, numeroCp: 'CP-002821',
        durees: { msp: '2h00', et: '0h20' },   // REV V03 — total 02h20
        intitule: 'Assurer les missions opérationnelles de la gestion des ressources humaines' },
      { code: 'CCP2', codeBloc: 'RNCP41366BC02', ordre: 2, numeroCp: 'CP-002822',
        durees: { msp: '2h00', et: '0h20' },   // REV V03 — total 02h20
        intitule: 'Contribuer au développement des ressources humaines' },
    ],
  },
  {
    sigle: 'AD',
    intitule: 'Assistant de direction',
    // REV V04 : partie écrite 4h30 puis partie orale 0h30, cette dernière
    // se déroulant obligatoirement après l'écrit, devant le jury.
    // Deux passages distincts = deux signatures sur la feuille d'émargement.
    mspDeuxTemps: { ecrite: '4h30', orale: '0h30' },
    codeRncp: '38667',
    codeTitre: 'TP-01293',
    millesime: '04',
    dateDernierJO: '2024-02-01',
    versionRev: 'REV2_AD_V04_14022024',
    niveau: 5,
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP38667BC01', ordre: 1, numeroCp: 'CP-003285',
        durees: { msp: '3h00', et: '0h15' },   // REV V04 — total 03h15
        intitule: "Assurer les fonctions de support administratif et organisationnel à l'équipe de direction" },
      { code: 'CCP2', codeBloc: 'RNCP38667BC02', ordre: 2, numeroCp: 'CP-003286',
        durees: { msp: '2h30', et: '0h15', qap: '0h20' },   // REV V04 — total 03h05
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
      { code: 'CCP1', codeBloc: 'RNCP37949BC01', ordre: 1, numeroCp: 'CP-003179',
        durees: { msp: '1h45', et: '0h15' },   // REV V09 — total 02h00
        intitule: 'Établir et présenter les arrêtés comptables périodiques et annuels' },
      { code: 'CCP2', codeBloc: 'RNCP37949BC02', ordre: 2, numeroCp: 'CP-003180',
        durees: { msp: '2h15', et: '0h15' },   // REV V09 — total 02h30
        intitule: 'Renseigner et contrôler les déclarations fiscales' },
      { code: 'CCP3', codeBloc: 'RNCP37949BC03', ordre: 3, numeroCp: 'CP-003181',
        durees: { msp: '1h45', et: '0h15' },   // REV V09 — total 02h00
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
      { code: 'CCP1', codeBloc: 'RNCP37396BC01', ordre: 1, numeroCp: 'CP-003124',
        durees: { msp: '0h25', et: '0h30' },   // REV V02 — total 00h55
        intitule: "Gérer une relation clientèle sur une destination et/ou un lieu touristique" },
      { code: 'CCP2', codeBloc: 'RNCP37396BC02', ordre: 2, numeroCp: 'CP-003125',
        durees: { msp: '0h20', et: '0h15' },   // REV V02 — total 00h35
        intitule: 'Assister la clientèle sur des prestations touristiques et de loisirs' },
      { code: 'CCP3', codeBloc: 'RNCP37396BC03', ordre: 3, numeroCp: 'CP-003126',
        durees: { msp: '0h30' },   // REV V02 — présentation de projet, pas de MSP classique
        intitule: "Contribuer à la mise en œuvre d'événements festifs et culturels" },
    ],
  },
  {
    sigle: 'EC',
    intitule: 'Employé commercial',
    codeRncp: '37099',
    codeTitre: 'TP-00219',
    niveau: 3,
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP37099BC01', ordre: 1, numeroCp: 'CP-003062',
        durees: { msp: '1h15', qap: '0h30' },   // REV V08 — total 01h45
        intitule: "Mettre à disposition des clients les produits de l'unité marchande dans un environnement omnicanal" },
      { code: 'CCP2', codeBloc: 'RNCP37099BC02', ordre: 2, numeroCp: 'CP-003063',
        durees: { msp: '0h55' },   // REV V08 — total 00h55
        intitule: 'Accueillir les clients et répondre à leur demande dans un environnement omnicanal' },
    ],
  },
  {
    sigle: 'CV',
    intitule: 'Conseiller de vente',
    codeRncp: '37098',
    codeTitre: 'TP-00520',
    niveau: 4,
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP37098BC01', ordre: 1, numeroCp: 'CP-003060',
        durees: { msp: '1h15', et: '0h30', qap: '0h50' },   // REV 26/07/2022 — total 02h35
        intitule: "Contribuer à l'efficacité commerciale d'une unité marchande dans un environnement omnicanal" },
      { code: 'CCP2', codeBloc: 'RNCP37098BC02', ordre: 2, numeroCp: 'CP-003061',
        durees: { msp: '0h45', qap: '0h30' },   // REV 26/07/2022 — total 01h15, pas d'entretien technique
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
    codeTitre: 'TP-00350',
    niveau: 5,
    // Intitulés et n° CP relevés dans CERES. Ordre des CCP confirmé.
    // Durées d'épreuve non renseignées : se reporter au REV / DTE.
    ccps: [
      { code: 'CCP1', codeBloc: 'RNCP37275BC01', ordre: 1, numeroCp: 'CP-003098',
        durees: { msp: '0h35' },   // REV V07 — présentation de projet, total 00h35
        intitule: 'Concevoir et préparer la formation' },
      { code: 'CCP2', codeBloc: 'RNCP37275BC02', ordre: 2, numeroCp: 'CP-003099',
        durees: { msp: '0h30' },   // REV V07 — présentation de projet, total 00h30
        intitule: 'Animer une formation et évaluer les acquis des apprenants' },
      { code: 'CCP3', codeBloc: 'RNCP37275BC03', ordre: 3, numeroCp: 'CP-003100',
        durees: { msp: '0h25', et: '0h20' },   // REV V07 — total 00h45
        intitule: 'Accompagner les apprenants en formation' },
      { code: 'CCP4', codeBloc: 'RNCP37275BC04', ordre: 4, numeroCp: 'CP-003101',
        durees: { msp: '0h55', et: '0h25' },   // REV V07 — total 01h20
        intitule: "Inscrire sa pratique professionnelle dans une démarche de qualité et de responsabilité sociale des entreprises" },
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