export type Utilisateur = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  fonction: string;
  role: 'admin' | 'pedagogique' | 'comptable' | 'formateur' | 'lecteur';
  motDePasse: string;
  signatureEmail: string;
  actif: boolean;
  avatar: string;
};

export const UTILISATEURS: Utilisateur[] = [
  {
    id: 'PAMA',
    nom: 'MAILLOT',
    prenom: 'Paméla',
    email: 'pamelamaillot@pamoi.re',
    telephone: '06 93 55 64 92',
    fonction: 'Directrice',
    role: 'admin',
    motDePasse: 'admin2024',
    signatureEmail: 'Paméla MAILLOT\nDirectrice — PAM OI Formation\n06 93 55 64 92\npamelamaillot@pamoi.re',
    actif: true,
    avatar: 'PM',
  },
  {
    id: 'BERE',
    nom: 'REBOUL',
    prenom: 'Betty',
    email: 'pedagogie@pamoi.re',
    telephone: '06 93 55 64 97',
    fonction: 'Responsable pédagogique',
    role: 'pedagogique',
    motDePasse: 'pamoi2024',
    signatureEmail: 'Betty REBOUL\nResponsable pédagogique — PAM OI Formation\n06 93 55 64 97\npedagogie@pamoi.re',
    actif: true,
    avatar: 'BR',
  },
  {
    id: 'RALI',
    nom: 'LIBEL',
    prenom: 'Raoul',
    email: 'compta@pamoi.re',
    telephone: '06 93 55 64 97',
    fonction: 'Secrétaire Comptable',
    role: 'comptable',
    motDePasse: 'pamoi2024',
    signatureEmail: 'Raoul LIBEL\nSecrétaire Comptable — PAM OI Formation\n06 93 55 64 97\ncompta@pamoi.re',
    actif: true,
    avatar: 'RL',
  },
  {
    id: 'NOVE',
    nom: 'VELIO',
    prenom: 'Noella',
    email: 'contact@pamoi.re',
    telephone: '06 93 55 64 97',
    fonction: 'Assistante RH',
    role: 'pedagogique',
    motDePasse: 'pamoi2024',
    signatureEmail: 'Noella VELIO\nAssistante RH — PAM OI Formation\n06 93 55 64 97\ncontact@pamoi.re',
    actif: true,
    avatar: 'NV',
  },
];

export const ACCES_PAR_ROLE: Record<string, string[]> = {
  admin: [
    '/', '/apprenants', '/entreprises', '/formateurs', '/formations',
    '/sessions', '/planning', '/emargement', '/presences',
    '/documents', '/qualiopi', '/bpf', '/parametres',
    '/precomptabilite', '/opco', '/recrutement', '/examens',
  ],
  pedagogique: [
    '/', '/apprenants', '/entreprises', '/formateurs', '/formations',
    '/sessions', '/planning', '/emargement', '/presences', '/documents',
    '/parametres', '/recrutement', '/opco', '/examens',
  ],
  comptable: [
    '/', '/apprenants', '/entreprises', '/formateurs', '/formations',
    '/sessions', '/planning', '/emargement', '/presences', '/documents',
    '/precomptabilite', '/opco', '/recrutement', '/examens',
    // BPF non inclus — à activer en ajoutant '/bpf' à cette liste
  ],
  formateur: ['/emargement'],
  lecteur: ['/'],
};

export const ROLES = [
  { id: 'admin', label: 'Administrateur', description: 'Accès complet', couleur: '#006B68' },
  { id: 'pedagogique', label: 'Pédagogique', description: 'Accès pédagogique complet (sans Qualiopi, BPF, Facturation)', couleur: '#3a5bc7' },
  { id: 'comptable', label: 'Comptable', description: 'Accès pédagogique + Facturation OPCO', couleur: '#9333ea' },
  { id: 'formateur', label: 'Formateur', description: 'Émargement uniquement', couleur: '#C8A23A' },
  { id: 'lecteur', label: 'Lecteur', description: 'Consultation uniquement', couleur: '#888' },
];
