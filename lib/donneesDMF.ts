/**
 * Helper d'assemblage des données du DMF (Déclaration de Maintien en Formation)
 * Calcule automatiquement la date de fin de maintien (= date rupture + 6 mois)
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

function ajouter6Mois(dateFr: string): string {
  const d = lireDate(dateFr);
  if (!d) return '';
  d.setMonth(d.getMonth() + 6);
  return d.toLocaleDateString('fr-FR');
}

function calculerDureeMois(debut: string, fin: string): number {
  const d1 = lireDate(debut);
  const d2 = lireDate(fin);
  if (!d1 || !d2) return 0;
  const ms = d2.getTime() - d1.getTime();
  if (ms <= 0) return 0;
  return Math.round(ms / (1000 * 60 * 60 * 24 * 30.4));
}

export function assemblerDonneesDMF(apprenant: any, entreprise?: any): Record<string, string> {
  const civilite = apprenant.sexe === 'F' ? 'Mme' : apprenant.sexe === 'M' ? 'M.' : 'Mme/M.';
  const formationLib = FORMATION_LIBELLES[apprenant.formation] || apprenant.formation || '';
  const duree = calculerDureeMois(apprenant.dateDebutFormation, apprenant.dateFinFormation);
  const dateFinMaintien = ajouter6Mois(apprenant.dateRuptureEffective || apprenant.dateRupture);

  return {
    // CFA
    CFA_RAISON_SOCIALE: 'PAM OI Formation',
    CFA_DIRECTRICE: 'Gaëlle MAILLOT',
    CFA_TELEPHONE: '0693 55 64 92',
    CFA_EMAIL: 'pamelamaillot@pamoi.re',
    LIEU_FORMATION: '1 Chemin Dubuisson — 97436 Saint-Leu',

    // Apprenant
    APPRENANT_CIVILITE: civilite,
    APPRENANT_NOM: apprenant.nom || '',
    APPRENANT_PRENOM: apprenant.prenom || '',
    APPRENANT_NOM_COMPLET: `${apprenant.prenom || ''} ${apprenant.nom || ''}`.trim(),
    APPRENANT_DATE_NAISSANCE: formaterDateFR(apprenant.dateNaissance),
    APPRENANT_LIEU_NAISSANCE: apprenant.lieuNaissance || '',
    APPRENANT_ADRESSE: apprenant.adresse || '',
    APPRENANT_CP: apprenant.codePostal || '',
    APPRENANT_VILLE: apprenant.ville || '',
    APPRENANT_TELEPHONE: apprenant.telephone || '',
    APPRENANT_EMAIL: apprenant.email || '',

    // Représentant légal (si mineur)
    REPRESENTANT_LEGAL_NOM: apprenant.representantNom || '',
    REPRESENTANT_LEGAL_PRENOM: apprenant.representantPrenom || '',
    REPRESENTANT_LEGAL_LIEN: apprenant.representantLien || '',
    REPRESENTANT_LEGAL_ADRESSE: apprenant.representantAdresse || '',
    REPRESENTANT_LEGAL_TELEPHONE: apprenant.representantTelephone || '',
    REPRESENTANT_LEGAL_EMAIL: apprenant.representantEmail || '',

    // Entreprise
    ENTREPRISE_RAISON_SOCIALE: entreprise?.raisonSociale || apprenant.entreprise || '',
    ENTREPRISE_SIRET: entreprise?.siret || '',
    ENTREPRISE_ACTIVITE: entreprise?.activitePrincipale || entreprise?.naf || '',
    ENTREPRISE_ADRESSE: entreprise?.adresse || '',
    ENTREPRISE_CP: entreprise?.codePostal || '',
    ENTREPRISE_VILLE: entreprise?.ville || '',
    MAITRE_APPRENTISSAGE_NOM_COMPLET: `${apprenant.tuteurPrenom || ''} ${apprenant.tuteurNom || ''}`.trim(),
    MAITRE_APPRENTISSAGE_TELEPHONE: apprenant.tuteurTelephone || '',
    MAITRE_APPRENTISSAGE_EMAIL: apprenant.tuteurEmail || '',

    // Contrat
    DATE_DEBUT_CONTRAT: formaterDateFR(apprenant.dateDebutContrat),
    DATE_FIN_CONTRAT: formaterDateFR(apprenant.dateFinContrat),
    DATE_DEBUT_FORMATION: formaterDateFR(apprenant.dateDebutFormation),
    DATE_FIN_FORMATION: formaterDateFR(apprenant.dateFinFormation),
    DUREE_FORMATION: duree > 0 ? String(duree) : '',
    N_DECA: apprenant.numeroDeca || '',
    FORMATION_LIBELLE: formationLib,

    // Rupture & maintien
    DATE_RUPTURE_CONTRAT: formaterDateFR(apprenant.dateRupture),
    DATE_FIN_MAINTIEN: dateFinMaintien,
    MAINTIEN: apprenant.maintienFormation === 'OUI' ? 'OUI' : apprenant.maintienFormation === 'NON' ? 'NON' : '',

    // Fin de maintien (à compléter manuellement plus tard)
    DATE_FIN_MAINTIEN_EFFECTIVE: '',
    MOTIF_FIN_MAINTIEN: '',
    MOTIF_FIN_AUTRE: '',

    // Signature
    DATE_SIGNATURE_DOC: new Date().toLocaleDateString('fr-FR'),
  };
}