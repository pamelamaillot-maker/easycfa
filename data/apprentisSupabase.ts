// data/apprentisSupabase.ts
// Module API Supabase pour la table 'apprenants'
// CFA PAM OI Formation

import { supabase } from '../lib/supabaseClient';

// ============================================================================
// TYPE Apprenti (correspond à la structure de la table Supabase)
// ============================================================================

export interface Apprenti {
  id: string;

  // Identité
  civilite?: string;
  nom: string;
  prenom: string;
  sexe?: string;
  nationalite?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  codePostalNaissance?: string;
  departementNaissance?: string;
  paysNaissance?: string;

  // Contact
  email?: string;
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;

  // Identifiants administratifs
  nir?: string;
  rqth?: string;
  sportifHautNiveau?: string;

  // Formation
  formation?: string;
  sessionId?: string;
  dateDebutFormation?: string;
  dateFinFormation?: string;

  // Contrat
  entreprise?: string;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  numeroDeca?: string;
  numeroDossierOpco?: string;

  // Tuteur
  tuteurNom?: string;
  tuteurPrenom?: string;
  tuteurEmail?: string;
  tuteurTelephone?: string;

  // Représentant légal
  representantNom?: string;
  representantPrenom?: string;
  representantLien?: string;
  representantEmail?: string;
  representantTelephone?: string;
  representantAdresse?: string;
  representantCodePostal?: string;
  representantVille?: string;

  // Statut et rupture
  statut?: 'En cours' | 'P2S' | 'Rupture' | 'Terminé';
   dateRupture?: string
  dateRuptureEffective?: string
  origineDateFinEffective?: string
  passeParP2S?: boolean;
  dateSortieEffective?: string;
  prorogation?: boolean;
  entreprisereprise?: string;
  maintienFormation?: string;
  contratPrecedent?: string;
  contratSuivant?: string;
  archive?: boolean;
  motifRupture?: string;
  pieces?: Record<string, any>;
  contactUrgence?: { nom?: string; parente?: string; telephone?: string; email?: string };
  amenagementRqth?: {
    accompagnementHumain?: string;
    accompagnementHumainDetail?: string;
    aidesHumaines?: string[];
    amenagementsFormation?: string[];
    amenagementsFormationDetail?: string;
    adaptationSupports?: string;
    adaptationSupportsDetail?: string;
  };
  dmf?: any;
  rupture?: any;
  ruptureSignee?: any;
  dfmf?: any;
  droitImage?: any;
  carteEtudiant?: any;
  sortiesAnticipees?: any[];

  // SIFA
  situationAvant?: string;
  derniereSituationCode?: string;
  dernierDiplome?: string;
  intituleDernierDiplome?: string;
  derniereClasse?: string;
  dernierEtablissement?: string;
  dernierOrganismeUai?: string;
  anneeObtention?: string;

  // Métadonnées
  dateCreation?: string;
  dateModification?: string;
}

// ============================================================================
// API SUPABASE
// ============================================================================

/**
 * Charge tous les apprentis depuis Supabase
 */
export async function chargerApprentis(): Promise<Apprenti[]> {
  try {
    const { data, error } = await supabase
      .from('apprenants')
      .select('*')
      .order('nom', { ascending: true });
    if (error) {
      console.error('Erreur Supabase chargerApprentis:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('Erreur réseau chargerApprentis:', e);
    return [];
  }
}

/**
 * Charge un apprenti par son ID
 */
export async function chargerApprenti(id: string): Promise<Apprenti | null> {
  try {
    const { data, error } = await supabase
      .from('apprenants')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('Erreur Supabase chargerApprenti:', error);
      return null;
    }
    return data || null;
  } catch (e) {
    console.error('Erreur réseau chargerApprenti:', e);
    return null;
  }
}

/**
 * Crée un nouvel apprenti (ou remplace si l'ID existe déjà)
 */
export async function creerApprenti(apprenti: Apprenti): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('apprenants')
      .upsert([{ ...apprenti, dateModification: new Date().toISOString() }]);
    if (error) {
      console.error('Erreur Supabase creerApprenti:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau creerApprenti:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Met à jour partiellement un apprenti (uniquement les champs fournis)
 */
export async function modifierApprenti(id: string, modifications: Partial<Apprenti>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('apprenants')
      .update({ ...modifications, dateModification: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('Erreur Supabase modifierApprenti:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau modifierApprenti:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Supprime un apprenti
 */
export async function supprimerApprenti(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('apprenants')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Erreur Supabase supprimerApprenti:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau supprimerApprenti:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Migration : importe en masse depuis localStorage vers Supabase.
 * Renvoie le nombre d'apprentis importés avec succès.
 */
// Liste des colonnes acceptées par la table apprenants (= clés du type Apprenti)
export interface DocumentApprenant {
  statut: 'a_generer' | 'en_attente' | 'signee';
  dateGeneration?: string;
  dateEnvoiEmail?: string;
  dateSignature?: string;
  fichierNonSigneNom?: string;
  fichierNonSigneUrl?: string;
  cheminStorageNonSigne?: string;
  fichierSigneNom?: string;
  fichierSigneUrl?: string;
  cheminStorageSigne?: string;
  archive?: boolean;
}

/**
 * Marque un DMF/Rupture comme "envoyé pour signature" (sauvegarde PDF non signé)
 */
export async function marquerDocApprenantEnAttente(
  apprenantId: string,
  type: 'dmf' | 'rupture' | 'droitImage' | 'dfmf' | 'carteEtudiant',
  fichierUrl: string,
  fichierNom: string,
  cheminStorage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: app, error: errLoad } = await supabase
      .from('apprenants').select(type).eq('id', apprenantId).maybeSingle();
    if (errLoad) return { success: false, error: errLoad.message };
    const doc: DocumentApprenant = ((app as any)?.[type] || {});
    const docMaj: DocumentApprenant = {
      ...doc,
      statut: 'en_attente',
      fichierNonSigneNom: fichierNom,
      fichierNonSigneUrl: fichierUrl,
      cheminStorageNonSigne: cheminStorage,
      dateGeneration: doc.dateGeneration || new Date().toISOString(),
      dateEnvoiEmail: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('apprenants').update({ [type]: docMaj, dateModification: new Date().toISOString() }).eq('id', apprenantId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Marque un DMF/Rupture comme signé après import du PDF signé
 */
export async function marquerDocApprenantSignee(
  apprenantId: string,
  type: 'dmf' | 'rupture' | 'droitImage' | 'dfmf' | 'carteEtudiant',
  fichierUrl: string,
  fichierNom: string,
  cheminStorage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: app, error: errLoad } = await supabase
      .from('apprenants').select(type).eq('id', apprenantId).maybeSingle();
    if (errLoad) return { success: false, error: errLoad.message };
    const doc: DocumentApprenant = ((app as any)?.[type] || {});
    const docMaj: DocumentApprenant = {
      ...doc,
      statut: 'signee',
      fichierSigneNom: fichierNom,
      fichierSigneUrl: fichierUrl,
      cheminStorageSigne: cheminStorage,
      dateSignature: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('apprenants').update({ [type]: docMaj, dateModification: new Date().toISOString() }).eq('id', apprenantId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Supprime/archive un DMF ou une Rupture du registre
 */
export async function supprimerDocApprenant(
  apprenantId: string,
  type: 'dmf' | 'rupture' | 'droitImage' | 'dfmf' | 'carteEtudiant'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('apprenants').update({ [type]: null, dateModification: new Date().toISOString() }).eq('id', apprenantId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Ajoute une nouvelle sortie anticipée à l'historique d'un apprenant
 */
export async function ajouterSortieAnticipee(
  apprenantId: string,
  sortie: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: app, error: errLoad } = await supabase
      .from('apprenants').select('sortiesAnticipees').eq('id', apprenantId).maybeSingle();
    if (errLoad) return { success: false, error: errLoad.message };
    const liste = ((app as any)?.sortiesAnticipees || []) as any[];
    liste.push(sortie);
    const { error } = await supabase
      .from('apprenants').update({ sortiesAnticipees: liste, dateModification: new Date().toISOString() }).eq('id', apprenantId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Met à jour le statut d'une sortie anticipée existante (envoyée / signée)
 */
export async function modifierSortieAnticipee(
  apprenantId: string,
  sortieId: string,
  modifications: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: app, error: errLoad } = await supabase
      .from('apprenants').select('sortiesAnticipees').eq('id', apprenantId).maybeSingle();
    if (errLoad) return { success: false, error: errLoad.message };
    const liste = ((app as any)?.sortiesAnticipees || []) as any[];
    const idx = liste.findIndex(s => s.id === sortieId);
    if (idx < 0) return { success: false, error: 'Sortie introuvable' };
    liste[idx] = { ...liste[idx], ...modifications };
    const { error } = await supabase
      .from('apprenants').update({ sortiesAnticipees: liste, dateModification: new Date().toISOString() }).eq('id', apprenantId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Supprime une sortie anticipée de l'historique
 */
export async function supprimerSortieAnticipee(
  apprenantId: string,
  sortieId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: app, error: errLoad } = await supabase
      .from('apprenants').select('sortiesAnticipees').eq('id', apprenantId).maybeSingle();
    if (errLoad) return { success: false, error: errLoad.message };
    const liste = ((app as any)?.sortiesAnticipees || []) as any[];
    const nouvelleListe = liste.filter(s => s.id !== sortieId);
    const { error } = await supabase
      .from('apprenants').update({ sortiesAnticipees: nouvelleListe, dateModification: new Date().toISOString() }).eq('id', apprenantId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

const CHAMPS_VALIDES = new Set<string>([
  'id', 'civilite', 'nom', 'prenom', 'sexe', 'nationalite',
  'dateNaissance', 'lieuNaissance', 'codePostalNaissance', 'departementNaissance', 'paysNaissance',
  'email', 'telephone', 'adresse', 'codePostal', 'ville',
  'nir', 'rqth', 'sportifHautNiveau',
  'formation', 'sessionId', 'dateDebutFormation', 'dateFinFormation',
  'entreprise', 'dateDebutContrat', 'dateFinContrat', 'numeroDeca', 'numeroDossierOpco',
  'tuteurNom', 'tuteurPrenom', 'tuteurEmail', 'tuteurTelephone',
  'representantNom', 'representantPrenom', 'representantLien', 'representantEmail',
  'representantTelephone', 'representantAdresse', 'representantCodePostal', 'representantVille',
  'statut', 'dateRupture', 'dateRuptureEffective', 'origineDateFinEffective', 'passeParP2S', 'dateSortieEffective', 'prorogation', 'entrepriseReprise',
  'maintienFormation', 'contratPrecedent', 'contratSuivant', 'archive',
  'situationAvant', 'derniereSituationCode', 'dernierDiplome', 'intituleDernierDiplome',
  'derniereClasse', 'dernierEtablissement', 'dernierOrganismeUai', 'anneeObtention',
  'dateCreation', 'dateModification',
  'pieces', 'contactUrgence', 'amenagementRqth',
  'dmf', 'rupture', 'ruptureSignee', 'dfmf',
  'motifRupture',
  'droitImage', 'sortiesAnticipees', 'carteEtudiant',
]);

/**
 * Nettoie un objet apprenti localStorage pour le rendre compatible avec la table Supabase :
 *  - Renomme les anciens champs (representantTel -> representantTelephone)
 *  - Supprime les champs qui ne sont pas dans la table
 */
function nettoyerPourSupabase(raw: any): Apprenti {
  const out: any = {};
  for (const [key, value] of Object.entries(raw)) {
    // Renommages connus
    let cleanKey = key;
    if (key === 'representantTel') cleanKey = 'representantTelephone';
    // (ajouter ici d'autres renommages si besoin)

    if (CHAMPS_VALIDES.has(cleanKey)) {
      out[cleanKey] = value;
    }
    // Sinon : champ ignoré (ex: dateEntretien)
  }
  return out as Apprenti;
}

export async function migrerDepuisLocalStorage(apprentis: any[]): Promise<{ success: number; erreurs: string[]; ignores: string[] }> {
  const erreurs: string[] = [];
  const ignores: string[] = [];
  let success = 0;

  for (const raw of apprentis) {
    // Détecter les champs ignorés pour info
    const champsIgnores = Object.keys(raw).filter(
      (k) => !CHAMPS_VALIDES.has(k) && k !== 'representantTel'
    );
    if (champsIgnores.length > 0) {
      ignores.push(`${raw.nom} ${raw.prenom} : champs ignorés [${champsIgnores.join(', ')}]`);
    }

    const apprentiNettoye = nettoyerPourSupabase(raw);
    const res = await creerApprenti(apprentiNettoye);
    if (res.success) success++;
    else erreurs.push(`${raw.nom} ${raw.prenom} (${raw.id}) : ${res.error}`);
  }
  return { success, erreurs, ignores };
}