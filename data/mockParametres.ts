export const CFA_INFO = {
  raisonSociale: 'PAM OI',
  siret: '98765432100011',
  uai: '9740001A',
  adresse: '15 rue de la Formation',
  codePostal: '97436',
  ville: 'Saint-Leu',
  telephone: '0262 00 00 00',
  email: 'contact@pamoi.re',
  siteWeb: 'www.pamoi.re',
  directeur: 'Paméla MAILLOT',
  emailDirecteur: 'p.maillot@pamoi.re',
  qualiopi: 'Certifié Qualiopi',
  dateQualiopi: '01/01/2024',
  echeanceQualiopi: '31/12/2026',
  organisme: 'PAM GROUPE',
  nda: '97 00 00000 00',
  regionImplantation: 'La Réunion',
  categorieJuridique: 'Association',
  codeAPE: '8559A',
  tvaIntracom: 'FR98765432100',
};

export const UTILISATEURS = [
  { id: 1, nom: 'MAILLOT', prenom: 'Paméla', email: 'p.maillot@pamoi.re', role: 'Administrateur', statut: 'Actif', dernierAcces: '03/05/2026' },
  { id: 2, nom: 'GRONDIN', prenom: 'Marc', email: 'm.grondin@pamoi.re', role: 'Formateur', statut: 'Actif', dernierAcces: '02/05/2026' },
  { id: 3, nom: 'PAYET', prenom: 'Sophie', email: 's.payet@pamoi.re', role: 'Formateur', statut: 'Actif', dernierAcces: '01/05/2026' },
  { id: 4, nom: 'HOARAU', prenom: 'Jean', email: 'j.hoarau@pamoi.re', role: 'Coordinateur', statut: 'Actif', dernierAcces: '28/04/2026' },
  { id: 5, nom: 'ROBERT', prenom: 'Claire', email: 'c.robert@pamoi.re', role: 'Lecteur', statut: 'Inactif', dernierAcces: '15/03/2026' },
];

export const ROLES = [
  { nom: 'Administrateur', description: 'Accès complet à toutes les fonctionnalités', droits: ['Lecture', 'Écriture', 'Suppression', 'Configuration', 'Utilisateurs'] },
  { nom: 'Coordinateur', description: 'Gestion des sessions, apprenants et présences', droits: ['Lecture', 'Écriture', 'Présences', 'Documents'] },
  { nom: 'Formateur', description: 'Accès à ses sessions et au planning', droits: ['Lecture', 'Planning', 'Présences'] },
  { nom: 'Lecteur', description: 'Consultation uniquement, aucune modification', droits: ['Lecture'] },
];

export const CONFIG_METIER = {
  typesContrat: ['Apprentissage', 'Professionnalisation', 'Stagiaire', 'P2S'],
  modalites: ['Présentiel', 'Distanciel', 'Hybride'],
  statutsSeance: ['Prévue', 'Réalisée', 'À contrôler', 'Annulée', 'Reportée'],
  statutsApprenant: ['Active', 'P2S', 'En attente', 'Rupture', 'Terminée'],
  niveauxDiplome: ['Niveau 3', 'Niveau 4', 'Niveau 5', 'Niveau 6', 'Niveau 7'],
  tauxHoraires: [
    { role: 'Formateur interne', taux: '25 €/h' },
    { role: 'Formateur externe', taux: '45 €/h' },
    { role: 'Intervenant occasionnel', taux: '35 €/h' },
  ],
  alerteAbsence: '10 %',
  delaiSignature: '7 jours',
  mentionDocument: 'Document généré avec EasyCFA — solution éditée par PAM GROUPE',
};