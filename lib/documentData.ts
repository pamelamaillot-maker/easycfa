import type { Npec } from '../data/npecSupabase';
import { buildFinanceSplit, formatDateFr, formatAmount, extractRncp } from './financementConvention';

const CFA = {
  raisonSociale: 'PAM OI Formation',
  siret: '881 279 392 00016',
  telephone: '0693 55 64 92',
  email: 'pamelamaillot@pamoi.re',
  directeur: 'Gaëlle Marie Paméla MAILLOT',
};

/**
 * Données financières spécifiques à un apprenant (stockées dans apprenant.financement JSONB).
 */
export interface FinancementApprenant {
  coutPedagogiqueAnnee1?: number;
  coutPedagogiqueAnnee2?: number;
  coutTotalFraisPedagogiques?: number;
  fraisPremierEquipement?: number;
  nbRepasAnnee1?: number;
  fraisAnnexesRepasAnnee1?: number;
  nbRepasAnnee2?: number;
  fraisAnnexesRepasAnnee2?: number;
  totalFraisAnnexes?: number;
  codeRncpManuel?: string;
}

/**
 * Assemble les données document à partir des objets apprenant et entreprise Supabase.
 * - npec : référentiel OPCO (résolu par code RNCP)
 * - financementApprenant : coûts spécifiques de l'apprenant (issu de apprenant.financement)
 * Tolère les valeurs manquantes (renvoie chaîne vide).
 */
export function assemblerDonnees(
  apprenant: any | null,
  entreprise: any | null,
  champsSupplementaires?: Record<string, string>,
  npec?: Npec | null,
  financementApprenant?: FinancementApprenant | null
): Record<string, string> {
  const a = apprenant || {};
  const e = entreprise || {};
  const f: FinancementApprenant = financementApprenant || a.financement || {};

  const civilite = a.sexe === 'Féminin' || a.civilite === 'Madame' ? 'Mme' : 'M.';
  const nomComplet = `${a.prenom ?? ''} ${a.nom ?? ''}`.trim();
  const tuteur = e.tuteurs?.[0] || {};

  // Code RNCP : priorité financement manuel > champ apprenant > extraction du libellé formation
  const rncpCode =
    f.codeRncpManuel ||
    a.rncpCode ||
    extractRncp(a.formation || '') ||
    '';

  // Calcul du split financier Année 1 / Année 2 via le référentiel NPEC.
  // Règle CFA : on prend la date la plus précoce entre contrat et formation
  // (le financement OPCO court sur toute la période apprentissage).
  const dateDebutForm = a.dateDebutFormation ?? a.dateDebut ?? '';
  const dateFinForm = a.dateFinFormation ?? a.dateFin ?? '';
  const dateDebutContrat = a.dateDebutContrat ?? '';
  const dateFinContrat = a.dateFinContrat ?? '';
  const split = buildFinanceSplit(
    dateDebutForm,
    dateFinForm,
    npec || null,
    dateDebutContrat,
    dateFinContrat
  );

  // Montants spécifiques apprenant (priorité) vs valeurs calculées par défaut
  const coutPedaA1 = f.coutPedagogiqueAnnee1
    ? formatAmount(f.coutPedagogiqueAnnee1)
    : split.montantOpcoAnnee1;
  const coutPedaA2 = f.coutPedagogiqueAnnee2
    ? formatAmount(f.coutPedagogiqueAnnee2)
    : split.montantOpcoAnnee2;
  const coutTotalPeda = f.coutTotalFraisPedagogiques
    ? formatAmount(f.coutTotalFraisPedagogiques)
    : split.totalFraisPedagogiques;

  return {
    // === CFA ===
    CFA_RAISON_SOCIALE: CFA.raisonSociale,
    CFA_SIRET: CFA.siret,
    CFA_TELEPHONE: CFA.telephone,
    CFA_EMAIL: CFA.email,
    CFA_DIRECTRICE: CFA.directeur,
    LIEU_FORMATION: '1 Chemin Dubuisson 97436 Saint-Leu',

    // === Apprenant ===
    APPRENANT_CIVILITE: civilite,
    APPRENANT_NOM: a.nom ?? '',
    APPRENANT_PRENOM: a.prenom ?? '',
    APPRENANT_NOM_COMPLET: nomComplet,
    'NOM_APPRENTI(E)': nomComplet,
    APPRENANT_DATE_NAISSANCE: formatDateFr(a.dateNaissance) || (a.dateNaissance ?? ''),
    APPRENANT_LIEU_NAISSANCE: a.communeNaissance ?? a.lieuNaissance ?? '',
    APPRENANT_ADRESSE: a.adresse ?? '',
    APPRENANT_CP: a.codePostal ?? '',
    APPRENANT_VILLE: a.ville ?? '',
    APPRENANT_TELEPHONE: a.telephone ?? '',
    APPRENANT_EMAIL: a.email ?? '',

    // === Représentant légal ===
    REPRESENTANT_LEGAL_NOM: a.responsableLegal?.nom ?? a.representantNom ?? '',
    REPRESENTANT_LEGAL_PRENOM: a.responsableLegal?.prenom ?? a.representantPrenom ?? '',
    REPRESENTANT_LEGAL_LIEN: a.responsableLegal?.lien ?? '',
    REPRESENTANT_LEGAL_ADRESSE: a.adresse ?? '',
    REPRESENTANT_LEGAL_TELEPHONE: a.responsableLegal?.telephone ?? '',
    REPRESENTANT_LEGAL_EMAIL: a.responsableLegal?.email ?? '',

    // === Formation ===
    FORMATION_LIBELLE: npec?.intitule || a.formation || '',
    DATE_DEBUT_FORMATION: formatDateFr(dateDebutForm),
    DATE_FIN_FORMATION: formatDateFr(dateFinForm),
    DATE_DEBUT_CONTRAT: formatDateFr(a.dateDebutContrat ?? a.dateDebut),
    DATE_FIN_CONTRAT: formatDateFr(a.dateFinContrat ?? a.dateFin),
    DUREE_FORMATION: split.dureeFormation || a.dureeFormation || '',
    VOLUME_HORAIRE_TOTAL: String(split.nbHeuresFormation || a.volumeHoraire || ''),
    NB_HEURES_FORMATION: String(split.nbHeuresFormation || a.volumeHoraire || ''),

    // === Entreprise ===
    ENTREPRISE_RAISON_SOCIALE: e.raisonSociale ?? a.entreprise ?? '',
    SIRET_ENTREPRISE: e.siret ?? '',
    ADRESSE_ENTREPRISE: e.adresse ?? '',
    Code_Postal_ENTREPRISE: e.codePostal ?? '',
    Ville_ENTREPRISE: e.ville ?? '',
    ACTIVITE_ENTREPRISE: e.libelleApe ?? e.codeApe ?? '',
    IDCC_ENTREPRISE: e.idcc ?? '',
    OPCO: e.opco ?? '',
    DIRIGEANT_NOM_COMPLET: `${e.dirigeantPrenom ?? ''} ${e.dirigeantNom ?? ''}`.trim(),
    QUALITE_SIGNATAIRE_ENTREPRISE: 'Gérant',

    // === Tuteur / Maître d'apprentissage ===
    TUTEUR_NOM_COMPLET: `${e.tuteurPrenom ?? ''} ${e.tuteurNom ?? ''}`.trim() || a.tuteur || '',
    POSTE_TUTEUR: e.tuteurFonction ?? tuteur.fonction ?? '',
    Mail_TUTEUR: e.tuteurEmail ?? a.emailTuteur ?? '',
    'N° Tel_TUTEUR': e.tuteurTelephone ?? a.telephoneTuteur ?? '',
    MAITRE_APPRENTISSAGE_NOM_COMPLET: `${e.tuteurPrenom ?? ''} ${e.tuteurNom ?? ''}`.trim() || a.tuteur || '',
    MAITRE_APPRENTISSAGE_TELEPHONE: e.tuteurTelephone ?? a.telephoneTuteur ?? '',
    MAITRE_APPRENTISSAGE_EMAIL: e.tuteurEmail ?? a.emailTuteur ?? '',

    // === Documents ===
    N_DECA: '',
    DATE_SIGNATURE_DOC: new Date().toLocaleDateString('fr-FR'),
    LIEU_SIGNATURE_DOC: 'Saint-Leu',

    // === Certificat de réalisation ===
    CR_DATE_DEBUT: formatDateFr(a.dateDebutContrat ?? a.dateDebut),
    CR_DATE_FIN: formatDateFr(a.dateFinContrat ?? a.dateFin),
    CR_DUREE_MOIS: npec?.dureeMois ? String(npec.dureeMois) : '12',
    CR_LIEU_SIGNATURE: 'Saint-Leu',
    CR_SIGNATAIRE_QUALITE: 'Directrice',
    CR_DUREE_HEURES: String(split.nbHeuresFormation || a.volumeHoraire || ''),

    // === Rupture / Maintien ===
    DATE_FIN_MAINTIEN: a.dateFinMaintien ?? '',
    DATE_RUPTURE_CONTRAT: a.dateRupture ?? '',

    // === RNCP / IDCC / Code diplôme ===
    RNCP_CODE: rncpCode || 'À compléter',
    CODE_DIPLOME: npec?.codeDiplome || '',
    IDCC_CODE: e.idcc ?? a.idcc ?? '',

    // === FINANCEMENT — Référentiel NPEC ===
    MONTANT_NPEC: split.montantNpecAnnuel,
    COUT_MENSUEL_NPEC: split.coutMensuel,
    COUT_HORAIRE: split.coutHoraire,

    // === FINANCEMENT — Split OPCO Année 1 / Année 2 (calculé) ===
    DATE_FIN_PREMIERE_ANNEE: split.dateFinPremiereAnnee,
    DATE_DEBUT_DEUXIEME_ANNEE: split.dateDebutDeuxiemeAnnee,
    'DATE_DEBUT_FORMATION+365 JOURS': split.dateFinPremiereAnnee,
    TOTAL_JOURS_PREMIERE_ANNEE: String(split.totalJoursPremiereAnnee || ''),
    TOTAL_JOURS_DEUXIEME_ANNEE: String(split.totalJoursDeuxiemeAnnee || ''),
    TOTAL_JOURS: String(split.totalJoursPremiereAnnee || ''),
    MONTANT_OPCO_ANNEE_1: split.montantOpcoAnnee1,
    MONTANT_OPCO_ANNEE_2: split.montantOpcoAnnee2,
    MONTANT_TOTAL_OPCO: split.montantTotalOpco,

    // === FINANCEMENT — Coûts pédagogiques apprenant ===
    COUT_PEDAGOGIQUE_ANNEE_1: coutPedaA1,
    COUT_PEDAGOGIQUE_ANNEE_2: coutPedaA2,
    COUT_TOTAL_FRAIS_PEDAGOGIQUES: coutTotalPeda,
    TOTAL_FRAIS_PEDAGOGIQUES: coutTotalPeda,

    // === FINANCEMENT — Frais annexes (équipement + repas) ===
    // FPE : valeur apprenant en priorité, sinon référentiel NPEC
    FRAIS_PREMIER_EQUIPEMENT: (() => {
      const fpe = f.fraisPremierEquipement ?? npec?.fpe ?? 0;
      return fpe ? formatAmount(fpe) : '0';
    })(),
    // Total frais annexes = repas A1 + repas A2 + FPE (auto-calculé)
    TOTAL_FRAIS_ANNEXES: (() => {
      if (f.totalFraisAnnexes) return formatAmount(f.totalFraisAnnexes);
      const repas1 = f.fraisAnnexesRepasAnnee1 ?? npec?.montantRepasAnnee1 ?? 0;
      const repas2 = f.fraisAnnexesRepasAnnee2 ?? npec?.montantRepasAnnee2 ?? 0;
      const fpe = f.fraisPremierEquipement ?? npec?.fpe ?? 0;
      const total = Number(repas1) + Number(repas2) + Number(fpe);
      return total ? formatAmount(total) : '0';
    })(),
    FRAIS_ANNEXES_REPAS_ANNEE_1: f.fraisAnnexesRepasAnnee1
      ? formatAmount(f.fraisAnnexesRepasAnnee1)
      : split.montantRepasAnnee1 || '0',
    FRAIS_ANNEXES_REPAS_ANNEE_2: f.fraisAnnexesRepasAnnee2
      ? formatAmount(f.fraisAnnexesRepasAnnee2)
      : split.montantRepasAnnee2 || '0',
    'Nombre_repas_ 1': String(f.nbRepasAnnee1 ?? split.repasAnnee1 ?? 0),
    'Nombre_repas_ 2': String(f.nbRepasAnnee2 ?? split.repasAnnee2 ?? 0),
    'Montant_repas_ 1': f.fraisAnnexesRepasAnnee1
      ? formatAmount(f.fraisAnnexesRepasAnnee1)
      : split.montantRepasAnnee1 || '',
    'Montant_repas_ 2': f.fraisAnnexesRepasAnnee2
      ? formatAmount(f.fraisAnnexesRepasAnnee2)
      : split.montantRepasAnnee2 || '',

    // === Doublons d'alias utilisés par certains templates ===
    ENTREPRISE_SIRET: e.siret ?? '',
    ENTREPRISE_ACTIVITE: e.libelleApe ?? e.codeApe ?? '',
    ENTREPRISE_ADRESSE: e.adresse ?? '',
    ENTREPRISE_CP: e.codePostal ?? '',
    ENTREPRISE_VILLE: e.ville ?? '',

    // === Référent pédagogique ===
    REFERENT_APPRENTI_NOM_COMPLET: 'Betty REBOUL',
    REFERENT_APPRENTI_TELEPHONE: '0693 55 64 97',
    REFERENT_APPRENTI_EMAIL: 'pedagogie@pamoi.re',

    ...champsSupplementaires,
  };
}