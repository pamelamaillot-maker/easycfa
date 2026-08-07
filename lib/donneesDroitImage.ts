/**
 * Helper d'assemblage des données du Droit à l'image (autorisation RGPD)
 */

import { formaterDateFR, lireDate } from './dates';

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
  const d1 = lireDate(dateDebut);
  const d2 = lireDate(dateFin);
  if (!d1 || !d2) {
    const annee = new Date().getFullYear();
    return `${annee}-${annee + 1}`;
  }
  return `${d1.getFullYear()}-${d2.getFullYear()}`;
}

export function assemblerDonneesDroitImage(
  apprenant: any,
  entreprise?: any
): Record<string, string> {
  const formationLib = FORMATION_LIBELLES[apprenant.formation] || apprenant.formation || '';
  const annee = anneeFormation(apprenant.dateDebutFormation, apprenant.dateFinFormation);
  const estMineur = (() => {
    const ddn = lireDate(apprenant.dateNaissance);
    if (!ddn) return false;
    const age = (new Date().getTime() - ddn.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age < 18;
  })();

  return {
    // Identité
    APPRENANT_NOM_COMPLET: `${apprenant.prenom || ''} ${apprenant.nom || ''}`.trim(),
    APPRENANT_DATE_NAISSANCE: formaterDateFR(apprenant.dateNaissance),
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