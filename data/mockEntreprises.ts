export const ENTREPRISES_STATS = [
  { label: 'Entreprises actives', value: '18', color: '#006B68' },
  { label: 'Tuteurs actifs', value: '22', color: '#006B68' },
  { label: 'Apprentis rattachés', value: '32', color: '#006B68' },
  { label: 'Emails manquants', value: '3', color: '#C8A23A' },
  { label: 'Mandats recrutement', value: '6', color: '#C8A23A' },
  { label: 'Documents à transmettre', value: '8', color: '#C8A23A' },
];

export const ENTREPRISES_LIST = [
  { id: 'entreprise-a', nom: 'Entreprise A', siret: '12345678900011', contact: 'M. Dupont', email: 'contact@entreprise-a.fr', telephone: '0262 00 00 00', apprentis: 2, tuteurs: 1, statut: 'Active', alerte: 'OK' },
  { id: 'entreprise-b', nom: 'Entreprise B', siret: '22345678900022', contact: 'Mme Robert', email: 'contact@entreprise-b.fr', telephone: '0262 11 11 11', apprentis: 1, tuteurs: 1, statut: 'Active', alerte: 'OK' },
  { id: 'entreprise-c', nom: 'Entreprise C', siret: '32345678900033', contact: 'M. Fontaine', email: 'contact@entreprise-c.fr', telephone: '0262 22 22 22', apprentis: 1, tuteurs: 1, statut: 'Active', alerte: 'Email tuteur manquant' },
  { id: 'entreprise-d', nom: 'Entreprise D', siret: '42345678900044', contact: 'Mme Payet', email: 'contact@entreprise-d.fr', telephone: '0262 33 33 33', apprentis: 3, tuteurs: 2, statut: 'Active', alerte: 'Documents à transmettre' },
  { id: 'entreprise-e', nom: 'Entreprise E', siret: '52345678900055', contact: 'M. Morel', email: 'contact@entreprise-e.fr', telephone: '0262 44 44 44', apprentis: 1, tuteurs: 1, statut: 'Active', alerte: 'OK' },
];

export const FICHE_ENTREPRISES: Record<string, {
  nom: string; siret: string; adresse: string; codePostal: string; ville: string;
  email: string; telephone: string; statut: string;
  cerfa: {
    codeAPE: string; libelleAPE: string;
    idcc: string; libelleIDCC: string;
    opco: string; codeOPCO: string;
    effectifTotal: string; effectifApprentis: string;
    typeEmployeur: string; codeTypeEmployeur: string;
    secteurActivite: string;
    regimeSpecifique: string;
    employeurPublicPrive: string;
    tvaIntracommunautaire: string;
    telephone: string; fax: string;
    emailDRH: string;
    formeJuridique: string;
    codeFormeJuridique: string;
    conventionCollective: string;
    dateAdhesionOPCO: string;
    adherentFAF: string;
  };
  tuteurs: { nom: string; fonction: string; email: string; telephone: string; apprentisSuivis: string; statut: string }[];
  apprentis: { nom: string; prenom: string; session: string; formation: string; dateDebut: string; dateFin: string; statut: string }[];
  documents: { nom: string; statut: string }[];
  suiviMensuel: { label: string; value: string; color: string }[];
  historique: { date: string; evenement: string }[];
}> = {
  'entreprise-a': {
    nom: 'Entreprise A', siret: '12345678900011',
    adresse: '12 rue des Apprentis', codePostal: '97436', ville: 'Saint-Leu',
    email: 'contact@entreprise-a.fr', telephone: '0262 00 00 00', statut: 'Active',
    cerfa: {
      codeAPE: '6920Z',
      libelleAPE: 'Activités comptables',
      idcc: '2148',
      libelleIDCC: 'Experts-comptables et commissaires aux comptes',
      opco: 'OPCO Atlas',
      codeOPCO: 'AT',
      effectifTotal: '12',
      effectifApprentis: '2',
      typeEmployeur: 'Entreprise privée',
      codeTypeEmployeur: '11',
      secteurActivite: 'Privé',
      regimeSpecifique: 'Aucun',
      employeurPublicPrive: 'Privé',
      tvaIntracommunautaire: 'FR12345678901',
      telephone: '0262 00 00 00',
      fax: 'Non renseigné',
      emailDRH: 'drh@entreprise-a.fr',
      formeJuridique: 'SARL',
      codeFormeJuridique: '5499',
      conventionCollective: 'Convention collective nationale des experts-comptables',
      dateAdhesionOPCO: '01/01/2024',
      adherentFAF: 'Oui',
    },
    tuteurs: [
      { nom: 'M. Dupont', fonction: 'Responsable administratif', email: 'tuteur@entreprise-a.fr', telephone: '0692 11 11 11', apprentisSuivis: 'Léa PAYET', statut: 'Actif' },
    ],
    apprentis: [
      { nom: 'PAYET', prenom: 'Léa', session: 'SC-2025-06', formation: 'Secrétaire Comptable', dateDebut: '01/05/2026', dateFin: '30/04/2027', statut: 'Active' },
      { nom: 'HOARAU', prenom: 'Emma', session: 'SC-2025-06', formation: 'Secrétaire Comptable', dateDebut: '01/05/2026', dateFin: '30/04/2027', statut: 'Active' },
    ],
    documents: [
      { nom: 'Mandat de recrutement', statut: 'Disponible' },
      { nom: 'Convention de formation', statut: 'Disponible' },
      { nom: 'Synthèse mensuelle Mai 2026', statut: 'À envoyer' },
      { nom: 'État de présence Léa PAYET', statut: 'À envoyer' },
      { nom: 'État de présence Emma HOARAU', statut: 'Signé' },
      { nom: 'Contrat d\'apprentissage Léa PAYET', statut: 'À importer' },
      { nom: 'Contrat d\'apprentissage Emma HOARAU', statut: 'À importer' },
    ],
    suiviMensuel: [
      { label: 'États mensuels à envoyer', value: '2', color: '#C8A23A' },
      { label: 'États signés', value: '1', color: '#006B68' },
      { label: 'Alertes absence', value: '1', color: '#C8A23A' },
      { label: 'Documents manquants', value: '0', color: '#006B68' },
    ],
    historique: [
      { date: '01/05/2026', evenement: 'Rattachement de Léa PAYET' },
      { date: '02/05/2026', evenement: 'Convention de formation générée' },
      { date: '31/05/2026', evenement: 'État mensuel Mai 2026 généré' },
    ],
  },
};