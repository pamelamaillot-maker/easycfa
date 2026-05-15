export const TAUX_HORAIRES_FORMATEURS = {
  presentiel: 30,
  distanciel: 18,
};

export const HEURES_FORMATEURS = [
  {
    id: 'f1',
    nom: 'Sophie MARTIN',
    type: 'Indépendant',
    sessions: [
      { session: 'SC-2025-06', formation: 'Secrétaire Comptable', heuresPresentiel: 42, heuresDistanciel: 0 },
      { session: 'AD-2026-01', formation: 'Assistant de Direction', heuresPresentiel: 28, heuresDistanciel: 7 },
    ],
  },
  {
    id: 'f2',
    nom: 'Jean PAYET',
    type: 'Indépendant',
    sessions: [
      { session: 'SC-2025-06', formation: 'Secrétaire Comptable', heuresPresentiel: 35, heuresDistanciel: 14 },
      { session: 'GCF-2026-01', formation: 'Gestionnaire Comptable', heuresPresentiel: 49, heuresDistanciel: 0 },
    ],
  },
  {
    id: 'f3',
    nom: 'Marc GRONDIN',
    type: 'Indépendant',
    sessions: [
      { session: 'ARH-2026-01', formation: 'Assistant RH', heuresPresentiel: 42, heuresDistanciel: 7 },
    ],
  },
  {
    id: 'f4',
    nom: 'Betty REBOUL',
    type: 'Salarié',
    sessions: [
      { session: 'SC-2025-06', formation: 'Secrétaire Comptable', heuresPresentiel: 56, heuresDistanciel: 0 },
      { session: 'GCF-2026-01', formation: 'Gestionnaire Comptable', heuresPresentiel: 35, heuresDistanciel: 0 },
      { session: 'AD-2026-01', formation: 'Assistant de Direction', heuresPresentiel: 42, heuresDistanciel: 0 },
    ],
  },
];

export const SESSIONS_BPF = [
  { id: 'SC-2025-06', formation: 'Secrétaire Comptable', niveau: 'Niveau 4', nbInscrits: 8, nbSortants: 7, nbObtention: 6, heuresPrevues: 490, heuresRealisees: 455, tauxPresence: 92.8, tauxRupture: 12.5, modalite: 'Présentiel', dateDebut: '01/09/2025', dateFin: '30/06/2026' },
  { id: 'GCF-2026-01', formation: 'Gestionnaire Comptable et Fiscal', niveau: 'Niveau 5', nbInscrits: 6, nbSortants: 6, nbObtention: 5, heuresPrevues: 490, heuresRealisees: 490, tauxPresence: 100, tauxRupture: 0, modalite: 'Présentiel', dateDebut: '01/01/2026', dateFin: '31/12/2026' },
  { id: 'AD-2026-01', formation: 'Assistant de Direction', niveau: 'Niveau 5', nbInscrits: 5, nbSortants: 5, nbObtention: 4, heuresPrevues: 392, heuresRealisees: 392, tauxPresence: 100, tauxRupture: 0, modalite: 'Mixte', dateDebut: '01/01/2026', dateFin: '31/12/2026' },
  { id: 'ARH-2026-01', formation: 'Assistant RH', niveau: 'Niveau 5', nbInscrits: 4, nbSortants: 4, nbObtention: 3, heuresPrevues: 392, heuresRealisees: 385, tauxPresence: 98.2, tauxRupture: 0, modalite: 'Présentiel', dateDebut: '01/01/2026', dateFin: '31/12/2026' },
];

export const DONNEES_FINANCIERES_MANUELLES = {
  annee: 2026,
  produits: {
    financementOPCO: 145000,
    financementRegion: 12000,
    financementAutres: 3500,
    autresProduits: 2000,
  },
  charges: {
    loyerLocaux: 18000,
    materielPedagogique: 4500,
    fraisAdministratifs: 6000,
    autresCharges: 3200,
  },
};