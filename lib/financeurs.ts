// lib/financeurs.ts
// Référentiel des FINANCEURS de la formation et des types de financement.
//
// POURQUOI CE FICHIER EXISTE
// Jusqu'en 2026, PAM OI ne faisait que de l'apprentissage : le financeur était
// toujours un OPCO, et le vocabulaire « OPCO » suffisait partout. Depuis la
// convention Transition Pro (première apprenante hors apprentissage), et avec
// l'ouverture envisagée vers le CPF, la Région, France Travail et les fonds
// personnels, « OPCO » n'est plus qu'un financeur parmi d'autres.
//
// ⚠️ NOMS TECHNIQUES INCHANGÉS
// Les colonnes Supabase gardent leurs noms historiques : `opco`,
// `numeroDossierOpco`, `dateDepotOpco`. Les renommer imposerait une migration
// et la reprise de toutes les données existantes, pour un gain nul.
// Ce sont donc des noms hérités : `opco` signifie « financeur ».
// Seuls les LIBELLÉS AFFICHÉS parlent de financeur.
//
// LIEN AVEC LE BPF
// Les catégories ci-dessous reprennent la ventilation du cadre C du Cerfa
// 10443*17 (origine des produits). Chaque financeur porte la ligne du Cerfa
// sur laquelle ses produits doivent être déclarés : voir `ligneBpf`.

// ---------------------------------------------------------------------------
// CATÉGORIES DE FINANCEURS
// ---------------------------------------------------------------------------

export type CategorieFinanceur =
  | 'opco'
  | 'transition_pro'
  | 'cpf'
  | 'region'
  | 'france_travail'
  | 'entreprise'
  | 'particulier';

export interface CategorieInfo {
  cle: CategorieFinanceur;
  libelle: string;
  /** Ligne du cadre C du BPF (Cerfa 10443*17) où déclarer ces produits. */
  ligneBpf: string;
  commentaireBpf: string;
}

export const CATEGORIES_FINANCEUR: CategorieInfo[] = [
  {
    cle: 'opco',
    libelle: 'OPCO',
    ligneBpf: '2a',
    commentaireBpf: "Organismes gestionnaires des fonds — contrats d'apprentissage",
  },
  {
    cle: 'transition_pro',
    libelle: 'Transition Pro',
    ligneBpf: '2d',
    commentaireBpf: 'Organismes gestionnaires des fonds — projets de transition professionnelle',
  },
  {
    cle: 'cpf',
    libelle: 'CPF',
    ligneBpf: '2e',
    commentaireBpf: 'Organismes gestionnaires des fonds — compte personnel de formation',
  },
  {
    cle: 'region',
    libelle: 'Région',
    ligneBpf: '6',
    commentaireBpf: 'Pouvoirs publics pour publics spécifiques — conseils régionaux',
  },
  {
    cle: 'france_travail',
    libelle: 'France Travail',
    ligneBpf: '7',
    commentaireBpf: 'Pouvoirs publics pour publics spécifiques — France Travail',
  },
  {
    cle: 'entreprise',
    libelle: 'Entreprise',
    ligneBpf: '1',
    commentaireBpf: 'Entreprises pour la formation de leurs salariés',
  },
  {
    cle: 'particulier',
    libelle: 'Particulier (fonds personnels)',
    ligneBpf: '9',
    commentaireBpf: 'Contrats conclus avec des personnes à titre individuel et à leurs frais',
  },
];

export function libelleCategorie(cle?: string): string {
  return CATEGORIES_FINANCEUR.find(c => c.cle === cle)?.libelle ?? (cle ?? '');
}

// ---------------------------------------------------------------------------
// FINANCEURS
// ---------------------------------------------------------------------------

export interface Financeur {
  /** Valeur stockée dans la colonne `opco` — ne pas modifier une valeur déjà utilisée. */
  code: string;
  categorie: CategorieFinanceur;
}

export const FINANCEURS: Financeur[] = [
  // --- OPCO (les onze opérateurs de compétences) -----------------------------
  { code: 'AKTO', categorie: 'opco' },
  { code: 'ATLAS', categorie: 'opco' },
  { code: 'AFDAS', categorie: 'opco' },
  { code: 'OPCO EP', categorie: 'opco' },
  { code: 'OCAPIAT', categorie: 'opco' },
  { code: 'OPCOMMERCE', categorie: 'opco' },
  { code: 'UNIFORMATION', categorie: 'opco' },
  { code: 'CNFPT', categorie: 'opco' },
  { code: 'CONSTRUCTYS', categorie: 'opco' },
  { code: 'OPCO MOBILITES', categorie: 'opco' },
  { code: 'OPCO 2i', categorie: 'opco' },

  // --- Transition professionnelle -------------------------------------------
  { code: 'TRANSITION PRO', categorie: 'transition_pro' },

  // --- Autres financeurs (ouverture prévue à partir de 2027) -----------------
  { code: 'CPF', categorie: 'cpf' },
  { code: 'REGION REUNION', categorie: 'region' },
  { code: 'FRANCE TRAVAIL', categorie: 'france_travail' },
  { code: 'ENTREPRISE', categorie: 'entreprise' },
  { code: 'PARTICULIER', categorie: 'particulier' },
];

/** Liste plate des codes, pour compatibilité avec le code existant. */
export const CODES_FINANCEURS: string[] = FINANCEURS.map(f => f.code);

/** Financeurs regroupés par catégorie, dans l'ordre d'affichage souhaité. */
export function financeursParCategorie(): { categorie: CategorieInfo; codes: string[] }[] {
  return CATEGORIES_FINANCEUR
    .map(categorie => ({
      categorie,
      codes: FINANCEURS.filter(f => f.categorie === categorie.cle).map(f => f.code),
    }))
    .filter(g => g.codes.length > 0);
}

/** Catégorie d'un financeur. Null si le code n'est pas au référentiel. */
export function categorieDe(code?: string): CategorieFinanceur | null {
  if (!code) return null;
  return FINANCEURS.find(f => f.code === code.trim().toUpperCase())?.categorie ?? null;
}

/** Ligne du cadre C du BPF où déclarer les produits de ce financeur. */
export function ligneBpfDe(code?: string): string | null {
  const cat = categorieDe(code);
  if (!cat) return null;
  return CATEGORIES_FINANCEUR.find(c => c.cle === cat)?.ligneBpf ?? null;
}

// ---------------------------------------------------------------------------
// TYPE DE FINANCEMENT DE L'APPRENANT
// ---------------------------------------------------------------------------
// Porté par la colonne `apprenants.typeFinancement`.
//
// ⚠️ NE PAS CONFONDRE avec le financeur : un apprenti est financé par un OPCO,
// une stagiaire en PTP par Transition Pro, mais c'est le TYPE DE FINANCEMENT
// qui détermine si la personne entre dans SIFA et dans la déclaration
// France Compétences — réservées toutes deux à l'apprentissage.
//
// Les clés reprennent celles de lib/tauxReussite.ts (LIBELLE_CANDIDATURE),
// afin que les taux de réussite soient ventilés sur le même vocabulaire.

export type TypeFinancement = 'apprentissage' | 'formation_continue' | 'vae' | 'libre';

export interface TypeFinancementInfo {
  cle: TypeFinancement;
  libelle: string;
  /** Titre du bloc décrivant l'action de formation sur la fiche apprenant. */
  titreAction: string;
  /** Entre dans SIFA et dans la déclaration France Compétences ? */
  compteApprentissage: boolean;
  /** Ligne du cadre F-1 du BPF (type de stagiaires). */
  ligneBpfF1: string;
}

export const TYPES_FINANCEMENT: TypeFinancementInfo[] = [
  {
    cle: 'apprentissage',
    libelle: "Apprentissage (contrat d'apprentissage)",
    titreAction: 'AFA — Action de Formation par Apprentissage',
    compteApprentissage: true,
    ligneBpfF1: 'b — Apprentis',
  },
  {
    cle: 'formation_continue',
    libelle: 'Formation continue (PTP, CPF, plan de développement…)',
    titreAction: 'AF — Action de formation',
    compteApprentissage: false,
    ligneBpfF1: "a — Salariés d'employeurs privés hors apprentis",
  },
  {
    cle: 'vae',
    libelle: 'VAE',
    titreAction: 'VAE',
    compteApprentissage: false,
    ligneBpfF1: 'e — Autres stagiaires',
  },
  {
    cle: 'libre',
    libelle: 'Candidat libre (fonds personnels)',
    titreAction: 'Inscription individuelle',
    compteApprentissage: false,
    ligneBpfF1: 'd — Particuliers à leurs propres frais',
  },
];

export function libelleTypeFinancement(cle?: string): string {
  return TYPES_FINANCEMENT.find(t => t.cle === cle)?.libelle ?? 'Apprentissage';
}

/**
 * Vrai si l'apprenant doit être compté dans les déclarations réservées à
 * l'apprentissage : SIFA et France Compétences.
 *
 * Un apprenant sans `typeFinancement` est réputé en apprentissage : c'était
 * le seul cas avant 2026, et tous les dossiers antérieurs ont été initialisés
 * à 'apprentissage'.
 */
export function estApprentissage(typeFinancement?: string): boolean {
  if (!typeFinancement) return true;
  return typeFinancement === 'apprentissage';
}

// ---------------------------------------------------------------------------
// ADAPTATION DE LA FICHE APPRENANT
// ---------------------------------------------------------------------------
// La fiche apprenant décrit une action de formation. Son vocabulaire et ses
// champs dépendent du type de financement : afficher « Contrat d'apprentissage »
// et un « N° DECA » pour une stagiaire en PTP est une incohérence qui finit
// tôt ou tard dans une déclaration.

/** Titre du bloc décrivant l'action de formation. */
export function titreActionFormation(typeFinancement?: string): string {
  const t = TYPES_FINANCEMENT.find(x => x.cle === (typeFinancement || 'apprentissage'));
  return t?.titreAction ?? 'Action de formation';
}

/**
 * Champs PROPRES À L'APPRENTISSAGE, sans objet pour les autres financements.
 *   - numeroDeca      : numéro DECA, attribué au dépôt d'un contrat d'apprentissage
 *   - situationAvant  : « situation avant contrat », champ de la déclaration SIFA
 *
 * Le STATUT n'y figure pas : « En cours », « Terminé » ou « Rupture » valent
 * pour tout apprenant. Seule l'étiquette CA / P2S, qui en est déduite, relève
 * de l'apprentissage — la fiche affiche alors le statut brut à la place.
 *
 * Les champs restent VISIBLES mais grisés : un champ masqué inquiète,
 * un champ grisé s'explique. Et leur valeur en base reste intacte, au cas où
 * un apprenant changerait de type de financement.
 */
const CHAMPS_PROPRES_APPRENTISSAGE = ['numeroDeca', 'situationAvant'];

export function champSansObjet(champ: string, typeFinancement?: string): boolean {
  if (estApprentissage(typeFinancement)) return false;
  return CHAMPS_PROPRES_APPRENTISSAGE.includes(champ);
}

/**
 * Libellé d'un champ selon le type de financement.
 * Le nom technique du champ ne change jamais — seul l'affichage s'adapte.
 */
const LIBELLES_HORS_APPRENTISSAGE: Record<string, string> = {
  numeroDossierOpco: 'N° dossier financeur',
  dateDebutContrat: 'Début de convention',
  dateFinContrat: 'Fin de convention',
};

const LIBELLES_APPRENTISSAGE: Record<string, string> = {
  numeroDossierOpco: 'N° dossier OPCO',
  dateDebutContrat: 'Début contrat',
  dateFinContrat: 'Fin contrat',
};

export function libelleChamp(champ: string, typeFinancement?: string): string {
  const table = estApprentissage(typeFinancement)
    ? LIBELLES_APPRENTISSAGE
    : LIBELLES_HORS_APPRENTISSAGE;
  return table[champ] ?? champ;
}