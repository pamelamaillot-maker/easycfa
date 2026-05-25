// ============================================================
// Classification des champs de la table 'formateurs'
// selon le mode d'édition autorisé pour un formateur connecté.
//
// 🟢 LIBRE      : édition directe, save immédiat dans formateurs
// 🟡 VALIDATION : crée une proposition, validée par admin
// 🔴 ADMIN_ONLY : lecture seule pour le formateur (édition par PAMA uniquement)
// ============================================================

export type ModeChamp = 'libre' | 'validation' | 'admin_only';

export type ChampFormateur = {
  cle: string;             // nom de la colonne dans la table formateurs
  label: string;           // libellé affiché à l'utilisateur
  type: 'text' | 'tel' | 'email' | 'textarea' | 'jsonb_array';
  mode: ModeChamp;
  description?: string;    // texte d'aide
};

export const CHAMPS_FORMATEUR: ChampFormateur[] = [
  // 🟢 ÉDITION LIBRE
  {
    cle: 'telephone',
    label: 'Téléphone',
    type: 'tel',
    mode: 'libre',
    description: 'Votre numéro de téléphone personnel pour vous joindre rapidement.',
  },

  // 🟡 PROPOSITIONS (validation PAMA requise)
  {
    cle: 'nom',
    label: 'Nom',
    type: 'text',
    mode: 'validation',
    description: 'Votre nom de famille tel qu\'il apparaîtra sur les documents officiels.',
  },
  {
    cle: 'prenom',
    label: 'Prénom',
    type: 'text',
    mode: 'validation',
  },
  {
    cle: 'siret',
    label: 'SIRET',
    type: 'text',
    mode: 'validation',
    description: 'Numéro SIRET (14 chiffres) si vous êtes auto-entrepreneur ou société.',
  },
  {
    cle: 'nda',
    label: 'N° déclaration d\'activité (NDA)',
    type: 'text',
    mode: 'validation',
    description: 'Numéro de déclaration d\'activité de formation si vous en avez un.',
  },
  {
    cle: 'specialites',
    label: 'Spécialités / Compétences',
    type: 'jsonb_array',
    mode: 'validation',
    description: 'Vos domaines d\'intervention pédagogique. Ajoutez une spécialité par ligne.',
  },
  // Note : 'pieces' est un objet structuré ({cv, cni, kbis, ...}) géré
  // par l'admin via la fiche formateur côté équipe. Le formateur peut
  // demander la mise à jour d'une pièce en contactant l'administration.
  // → On déplace ce champ en lecture seule pour l'instant.
  {
    cle: 'pieces',
    label: 'Pièces justificatives (CV, CNI, RC Pro...)',
    type: 'text',
    mode: 'admin_only',
    description: 'Pour mettre à jour vos pièces, contactez l\'administration.',
  },

  // 🔴 ADMIN ONLY (le formateur voit, ne peut pas éditer)
  {
    cle: 'email',
    label: 'Email de connexion',
    type: 'email',
    mode: 'admin_only',
    description: 'Email associé à votre compte. Pour le modifier, contactez l\'administration.',
  },
  {
    cle: 'statut',
    label: 'Statut',
    type: 'text',
    mode: 'admin_only',
    description: 'Statut administratif géré par le CFA.',
  },
  {
    cle: 'notes',
    label: 'Notes internes',
    type: 'textarea',
    mode: 'admin_only',
    description: 'Notes administratives (non visibles).',
  },
];

// Helpers
export const CHAMPS_LIBRES = CHAMPS_FORMATEUR.filter(c => c.mode === 'libre');
export const CHAMPS_VALIDATION = CHAMPS_FORMATEUR.filter(c => c.mode === 'validation');
export const CHAMPS_ADMIN_ONLY = CHAMPS_FORMATEUR.filter(c => c.mode === 'admin_only');

export function trouverChamp(cle: string): ChampFormateur | undefined {
  return CHAMPS_FORMATEUR.find(c => c.cle === cle);
}