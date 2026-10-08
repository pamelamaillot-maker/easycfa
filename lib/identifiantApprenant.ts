// lib/identifiantApprenant.ts
// Fabrication de l'identifiant d'un apprenant.
//
// POURQUOI CE FICHIER EXISTE
// L'identifiant était calculé sur la liste du navigateur (localStorage).
// Un poste qui n'avait pas vu une fiche créée ailleurs la croyait inexistante,
// réattribuait son identifiant, et l'écriture écrasait la fiche en base.
// C'est ainsi que la fiche de PERSEE Marie Michelle (PERMA_001) a disparu
// le 8 octobre 2026, remplacée par celle de PERIASSAMY Marine — même nom
// tronqué à trois lettres, même prénom tronqué à deux.
//
// La seule liste complète est celle de Supabase. C'est donc elle qui décide.
//
// ⚠️ CE CONTRÔLE NE SUFFIT PAS À LUI SEUL
// Entre la lecture de la liste et l'écriture, une autre personne peut créer
// la même fiche. Le verrou définitif est l'insertion stricte dans
// data/apprentisSupabase.ts : creerApprenti utilise insert et non upsert,
// et la base refuse alors un identifiant déjà pris.
// Ce fichier évite l'erreur ; l'insertion stricte évite le dégât.

import { chargerApprentis } from '../data/apprentisSupabase';

/**
 * Racine de l'identifiant : 3 lettres du nom + 2 du prénom.
 * Les accents sont retirés avant la troncature, sinon « Émilie » donnerait
 * une racine amputée une fois les caractères non alphabétiques supprimés.
 */
function racine(nom: string, prenom: string): string {
  const sansAccent = (s: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

  return sansAccent(nom).slice(0, 3) + sansAccent(prenom).slice(0, 2);
}

/**
 * Identifiant libre pour un nouvel apprenant, au format RACINE_001.
 *
 * @throws si la liste des apprenants ne peut pas être lue — mieux vaut
 *         refuser la création que fabriquer un identifiant à l'aveugle.
 */
export async function genererIdApprenant(nom: string, prenom: string): Promise<string> {
  const base = racine(nom, prenom);
  if (!base) {
    throw new Error("Nom et prénom ne contiennent aucune lettre exploitable.");
  }

  const tous = await chargerApprentis();
  const pris = new Set(tous.map(a => a.id));

  let num = 1;
  let id = `${base}_${String(num).padStart(3, '0')}`;
  while (pris.has(id)) {
    num++;
    id = `${base}_${String(num).padStart(3, '0')}`;
    // Garde-fou : au-delà de 999 homonymes, quelque chose cloche.
    if (num > 999) throw new Error(`Plus d'identifiant disponible pour ${base}.`);
  }
  return id;
}