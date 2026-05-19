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
  dateRupture?: string;
  maintienFormation?: string;
  contratPrecedent?: string;
  contratSuivant?: string;
  archive?: boolean;

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
  'statut', 'dateRupture', 'maintienFormation', 'contratPrecedent', 'contratSuivant', 'archive',
  'situationAvant', 'derniereSituationCode', 'dernierDiplome', 'intituleDernierDiplome',
  'derniereClasse', 'dernierEtablissement', 'dernierOrganismeUai', 'anneeObtention',
  'dateCreation', 'dateModification',
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