/**
 * Helper d'assemblage des données du formulaire de rupture
 */

const MOTIFS_RUPTURE: Record<string, { label: string; cle: string }> = {
  unilateral: { cle: 'unilateral', label: '45 premiers jours' },
  commun: { cle: 'commun', label: 'Commun accord' },
  force_majeure: { cle: 'force_majeure', label: 'Force majeure' },
  faute_grave: { cle: 'faute_grave', label: 'Faute grave' },
  inaptitude: { cle: 'inaptitude', label: 'Inaptitude médicale' },
  initiative: { cle: 'initiative', label: 'Initiative apprenti' },
  liquidation: { cle: 'liquidation', label: 'Liquidation judiciaire' },
  exclusion: { cle: 'exclusion', label: 'Exclusion CFA' },
  diplome: { cle: 'diplome', label: 'Obtention diplôme' },
  administratif: { cle: 'administratif', label: 'Décision administrative' },
};

export function assemblerDonneesRupture(
  apprenant: any,
  motifCle: string,
  entreprise?: any
): Record<string, string> {
  return {
    // Apprenant
    APPRENANT_NOM_COMPLET: `${apprenant.prenom || ''} ${apprenant.nom || ''}`.trim(),
    APPRENANT_DATE_NAISSANCE: apprenant.dateNaissance || '',

    // Représentant légal (si mineur)
    REPRESENTANT_NOM_COMPLET: apprenant.representantPrenom || apprenant.representantNom
      ? `${apprenant.representantPrenom || ''} ${apprenant.representantNom || ''}`.trim()
      : '',

    // Contrat
    DATE_DEBUT_CONTRAT: apprenant.dateDebutContrat || '',
    DATE_FIN_CONTRAT: apprenant.dateFinContrat || '',
    NUMERO_OPCO: apprenant.numeroDossierOpco || apprenant.numeroDeca || '',

    // Entreprise
    ENTREPRISE_RAISON_SOCIALE: entreprise?.raisonSociale || apprenant.entreprise || '',
    ENTREPRISE_SIRET: entreprise?.siret || '',

    // Rupture
    DATE_RUPTURE: apprenant.dateRupture || '',
    MOTIF_CLE: motifCle || '',
    MAINTIEN: apprenant.maintienFormation === 'OUI' ? 'OUI' : apprenant.maintienFormation === 'NON' ? 'NON' : '',
    DATE_SORTIE: apprenant.maintienFormation === 'NON' ? (apprenant.dateRupture || '') : '',

    // Signature
    LIEU_SIGNATURE: 'Saint-Leu',
    DATE_SIGNATURE: new Date().toLocaleDateString('fr-FR'),
  };
}

export const MOTIFS_RUPTURE_LISTE = [
  { cle: 'unilateral', label: 'Rupture unilatérale pendant les 45 premiers jours en emploi, consécutifs ou non (art. L.6222-18, al.1)' },
  { cle: 'commun', label: "Rupture d'un commun accord entre l'apprenti et l'employeur (art. L.6222-18, al.2)" },
  { cle: 'force_majeure', label: 'Rupture en cas de force majeure — licenciement (art. L.6222-18, al.3)' },
  { cle: 'faute_grave', label: "Rupture en cas de faute grave de l'apprenti — licenciement (art. L.6222-18, al.3)" },
  { cle: 'inaptitude', label: "Rupture en cas d'inaptitude de l'apprenti constatée par le médecin du travail (art. L.6222-18, al.3)" },
  { cle: 'deces_employeur', label: "Rupture en cas de décès de l'employeur maître d'apprentissage en entreprise unipersonnelle (art. L.6222-18, al.3)" },
  { cle: 'initiative', label: "Rupture à l'initiative de l'apprenti après préavis et sollicitation du médiateur consulaire (art. L.6222-18, al.4)" },
  { cle: 'liquidation', label: "Rupture en cas de liquidation judiciaire de l'employeur sans maintien de l'activité (art. L.6222-18, al.5)" },
  { cle: 'exclusion', label: "Rupture en cas d'exclusion définitive de l'apprenti par le CFA (art. L.6222-18-1)" },
  { cle: 'diplome', label: "Rupture en cas d'obtention du diplôme — fin du contrat à l'initiative de l'apprenti (art. L.6222-19)" },
  { cle: 'administratif', label: "Rupture par décision administrative — risque d'atteinte à la santé ou l'intégrité de l'apprenti (art. L.6222-24 et 25)" },
];