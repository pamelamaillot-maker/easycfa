export const PRESENCE_DOCUMENTS = [
  { id: 1, apprenant: 'Léa PAYET', document: 'État mensuel individuel', mois: 'Mai 2026', version: 'V1', statut: 'Généré', signature: 'À envoyer' },
  { id: 2, apprenant: 'Emma HOARAU', document: 'État mensuel individuel', mois: 'Mai 2026', version: 'V1', statut: 'Généré', signature: 'À envoyer' },
  { id: 3, apprenant: 'Lucas TECHER', document: 'État mensuel individuel', mois: 'Mai 2026', version: 'V1', statut: 'Généré', signature: 'Signé' },
  { id: 4, apprenant: 'Nora FONTAINE', document: 'État mensuel individuel', mois: 'Mai 2026', version: 'V2', statut: 'Généré', signature: 'À envoyer' },
  { id: 5, apprenant: 'Jules ROBERT', document: 'État mensuel individuel', mois: 'Mai 2026', version: 'V1', statut: 'À contrôler', signature: 'Non envoyé' },
  { id: 6, apprenant: 'Clara MOREL', document: 'État mensuel individuel', mois: 'Mai 2026', version: 'V1', statut: 'Généré', signature: 'À envoyer' },
];

export const CHECKLIST = [
  { label: 'Session trouvée', statut: 'OK' },
  { label: '6 apprenants inscrits', statut: 'OK' },
  { label: 'Planning du mois renseigné', statut: 'OK' },
  { label: 'Formateurs renseignés', statut: 'OK' },
  { label: 'Thèmes renseignés', statut: 'À contrôler' },
  { label: 'Absences cohérentes', statut: 'OK' },
  { label: 'Emails entreprise / tuteur', statut: 'À contrôler' },
  { label: 'Documents existants pour ce mois', statut: '2 documents déjà générés' },
];

export const TYPE_DOCUMENTS = [
  { titre: 'Feuille collective journalière', description: 'Liste de présence pour une journée donnée, avec signatures.', badge: 'Journalier' },
  { titre: 'Toutes les feuilles collectives du mois', description: 'Ensemble des feuilles collectives sur un mois complet.', badge: 'Mensuel' },
  { titre: 'États mensuels individuels', description: 'Document de présence individuel par apprenant pour le mois.', badge: 'Individuel' },
  { titre: 'Synthèses entreprise mensuelles', description: 'Récapitulatif mensuel transmis aux entreprises partenaires.', badge: 'Entreprise' },
  { titre: 'Export absences', description: 'Liste détaillée des absences justifiées et non justifiées.', badge: 'Export' },
  { titre: 'Récapitulatif annuel apprenant', description: 'Bilan annuel des présences et absences par apprenant.', badge: 'Annuel' },
];