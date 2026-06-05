// lib/storage.ts
// Helper pour Supabase Storage — gestion des fichiers uploadés

import { supabase } from './supabaseClient';

const BUCKET = 'pieces-justificatives';

export interface FichierStocke {
  nom: string;          // Nom original du fichier (ex: "cv.pdf")
  taille: string;       // Taille lisible (ex: "234 Ko")
  url: string;          // URL publique pour téléchargement
  cheminStorage: string; // Chemin dans le bucket
  dateUpload?: string;  // Date d'upload ISO
}

/**
 * Formate la taille d'un fichier (octets) en chaîne lisible
 */
export function formaterTaille(octets: number): string {
  if (octets > 1024 * 1024) return `${(octets / 1024 / 1024).toFixed(1)} Mo`;
  if (octets > 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${octets} o`;
}

/**
 * Upload un fichier dans le bucket à un chemin précis.
 * Le chemin est typiquement de la forme : "apprenants/LALMA_001/cv.pdf"
 *
 * Si un fichier existe déjà à ce chemin, il est écrasé (upsert).
 */
export async function uploaderFichier(
  cheminStorage: string,
  file: File,
): Promise<{ success: boolean; fichier?: FichierStocke; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(cheminStorage, file, { upsert: true });

    if (error) {
      console.error('Erreur upload Storage:', error);
      return { success: false, error: error.message };
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(cheminStorage);

    return {
      success: true,
      fichier: {
        nom: file.name,
        taille: formaterTaille(file.size),
        url: pub.publicUrl,
        cheminStorage,
        dateUpload: new Date().toISOString(),
      },
    };
  } catch (e: any) {
    console.error('Erreur réseau upload:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Supprime un fichier du bucket à partir de son chemin.
 */
export async function supprimerFichier(cheminStorage: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([cheminStorage]);
    if (error) {
      console.error('Erreur suppression Storage:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau suppression:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Construit un chemin Storage propre pour une pièce.
 * Ex: cheminStorage('apprenants', 'LALMA_001', 'cv', 'cv.pdf')
 *      -> "apprenants/LALMA_001/cv.pdf"
 *
 * Le nom de la pièce (pieceId) sert de préfixe pour éviter les conflits si plusieurs fichiers du même nom.
 */
export function cheminStorage(
  categorie: 'apprenants' | 'entreprises' | 'entretiens' | 'mandats' | 'apcs' | 'justificatifs' | 'emargements',
  parentId: string,
  pieceId: string,
  nomFichier: string,
): string {
  // Sanitize : retire caractères dangereux du nom de fichier
  const extension = nomFichier.split('.').pop()?.toLowerCase() || 'bin';
  return `${categorie}/${parentId}/${pieceId}.${extension}`;
}

/**
 * Retourne l'URL publique d'un fichier déjà uploadé.
 */
export function getUrlPublique(cheminStorage: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(cheminStorage);
  return data.publicUrl;
}