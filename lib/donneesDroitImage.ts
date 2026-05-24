/**
 * Helper d'assemblage des données du Droit à l'image (autorisation RGPD)
 */

const FORMATION_LIBELLES: Record<string, string> = {
  'SC': 'TP Secrétaire Comptable',
  'GCF': 'TP Gestionnaire Comptable et Fiscal',
  'AD': 'TP Assistant(e) de Direction',
  'ARH': 'TP Assistant(e) en Ressources Humaines',
  'CATL': "TP Chargé(e) d'Accueil Touristique et de Loisirs",
  'EC': 'TP Employé(e) Commercial(e)',
  'CV': 'TP Conseiller(ère) de Vente',
  'FPA': "TP Formateur(trice) Professionnel(le) d'Adultes",
};

function anneeFormation(dateDebut: string | undefined, dateFin: string | undefined): string {
  if (!dateDebut || !dateFin) {
    const annee = new Date().getFullYear();
    return `${annee}-${annee + 1}`;
  }
  const pD = dateDebut.split('/');
  const pF = dateFin.split('/');
  if (pD.length !== 3 || pF.length !== 3) {
    const annee = new Date().getFullYear();
    return `${annee}-${annee + 1}`;
  }
  return `${pD[2]}-${pF[2]}`;
}

export function assemblerDonneesDroitImage(
  apprenant: any,
  entreprise?: any
): Record<string, string> {
  const formationLib = FORMATION_LIBELLES[apprenant.formation] || apprenant.formation || '';
  const annee = anneeFormation(apprenant.dateDebutFormation, apprenant.dateFinFormation);
  const estMineur = (() => {
    if (!apprenant.dateNaissance) return false;
    const p = apprenant.dateNaissance.split('/');
    if (p.length !== 3) return false;
    const ddn = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
    const age = (new Date().getTime() - ddn.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age < 18;
  })();

  return {
    // Identité
    APPRENANT_NOM_COMPLET: `${apprenant.prenom || ''} ${apprenant.nom || ''}`.trim(),
    APPRENANT_DATE_NAISSANCE: apprenant.dateNaissance || '',
    FORMATION_LIBELLE: formationLib,
    ENTREPRISE_RAISON_SOCIALE: entreprise?.raisonSociale || apprenant.entreprise || '',
    ANNEE_FORMATION: annee,

    // Représentant légal (si mineur)
    EST_MINEUR: estMineur ? 'OUI' : 'NON',
    REPRESENTANT_NOM_COMPLET: estMineur && (apprenant.representantPrenom || apprenant.representantNom)
      ? `${apprenant.representantPrenom || ''} ${apprenant.representantNom || ''}`.trim()
      : '',
    REPRESENTANT_LIEN: estMineur ? (apprenant.representantLien || '') : '',

    // Lieu/Date signature
    LIEU_SIGNATURE: 'Saint-Leu',
    DATE_SIGNATURE: new Date().toLocaleDateString('fr-FR'),
  };
}