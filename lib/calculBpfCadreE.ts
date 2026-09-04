// lib/calculBpfCadreE.ts
// Calcul du CADRE E du BPF (Cerfa 10443*17) depuis les données réelles Supabase.
//
// ⚠️ CADRE RÉGLEMENTAIRE
// Le cadre E recense les PERSONNES DISPENSANT DES HEURES DE FORMATION
// pendant le dernier exercice comptable clos, en deux lignes :
//
//   1. Personnes DE VOTRE ORGANISME dispensant des heures de formation
//   2. Personnes EXTÉRIEURES dispensant des heures dans le cadre de
//      contrats de SOUS-TRAITANCE
//
// Pour chaque ligne : un nombre de personnes, et un nombre d'heures dispensées.
//
// LIGNE DE PARTAGE CHEZ PAM OI
// Le rattachement est porté par la colonne `formateurs.rattachement` :
//   - 'interne' : formatrice salariée de la structure (SASU)
//   - 'externe' : auto-entrepreneurs facturant des honoraires
// Cette séparation recoupe le cadre D du Cerfa, qui distingue les salaires
// des formateurs des achats de prestation et honoraires de formation.
//
// SOURCE DES HEURES
// Les heures proviennent des ÉMARGEMENTS (`emargements.demiJournees[].heures`),
// c'est-à-dire de ce qui a réellement été dispensé en salle, et non d'un
// prévisionnel de planning. C'est la source défendable en contrôle DREETS.
//
// ⚠️ RAPPROCHEMENT PAR LE NOM
// `demiJournees[].formateur` est un texte libre, pas un identifiant. Le
// rapprochement avec les fiches formateurs se fait donc sur le nom normalisé
// (majuscules, accents retirés, tirets et espaces uniformisés). Les noms non
// rapprochés sont remontés dans `formateursNonRapproches` : ils ne sont
// comptés dans AUCUNE des deux lignes, et doivent être corrigés en base.
//
// UNE PERSONNE N'EST COMPTÉE QUE SI ELLE A DISPENSÉ DES HEURES
// Un formateur inscrit mais sans intervention sur l'exercice ne figure pas
// au cadre E : le Cerfa demande les personnes « dispensant des heures ».

import { chargerEmargements } from '../data/emargementsSupabase';
import { chargerFormateurs, type Formateur } from '../data/formateursSupabase';
import { lireDateSouple, normaliserNom } from './calculBpfCadreF';

// ---------------------------------------------------------------------------
// STRUCTURES DE RÉSULTAT
// ---------------------------------------------------------------------------

export type Rattachement = 'interne' | 'externe';

export interface FormateurCadreE {
  formateurId: string | null;
  nom: string;              // nom tel qu'affiché dans les émargements
  rattachement: Rattachement | null;
  demiJournees: number;
  heures: number;
}

export interface LigneCadreE {
  libelle: string;
  nombre: number;           // nombre de personnes
  heures: number;           // heures dispensées
}

export interface CadreE {
  exerciceDebut: string;
  exerciceFin: string;

  /** Ligne 1 du cadre E — personnes de l'organisme. */
  interne: LigneCadreE;

  /** Ligne 2 du cadre E — personnes extérieures (sous-traitance). */
  externe: LigneCadreE;

  /** Total, pour contrôle de cohérence. */
  totalHeures: number;

  /** Détail par formateur, pour justification en contrôle. */
  detail: FormateurCadreE[];

  /** Noms présents dans les émargements sans fiche formateur correspondante. */
  formateursNonRapproches: string[];

  /** Formateurs rapprochés mais sans valeur dans `rattachement`. */
  rattachementManquant: string[];

  /** Demi-journées retenues dont le champ `heures` est vide ou nul. */
  demiJourneesSansHeures: number;

  /** Feuilles d'émargement dont la date est illisible : exclues du calcul. */
  feuillesDateIllisible: number;

  calculeLe: string;
}

// ---------------------------------------------------------------------------
// RAPPROCHEMENT DES NOMS
// ---------------------------------------------------------------------------

/**
 * Construit un index des formateurs par nom normalisé.
 * Deux formes sont indexées pour absorber l'ordre de saisie :
 *   'Gaëlle MAILLOT'  -> 'GAELLE MAILLOT'
 *   'MAILLOT Gaëlle'  -> 'MAILLOT GAELLE'
 */
function indexerFormateurs(formateurs: Formateur[]): Map<string, Formateur> {
  const index = new Map<string, Formateur>();
  for (const f of formateurs) {
    const nom = normaliserNom(f.nom);
    const prenom = normaliserNom(f.prenom);
    if (!nom && !prenom) continue;
    index.set(`${prenom} ${nom}`.trim(), f);
    index.set(`${nom} ${prenom}`.trim(), f);
  }
  return index;
}

function lireRattachement(f: Formateur): Rattachement | null {
  const v = String((f as any).rattachement ?? '').trim().toLowerCase();
  if (v === 'interne') return 'interne';
  if (v === 'externe') return 'externe';
  return null;
}

// ---------------------------------------------------------------------------
// CALCUL
// ---------------------------------------------------------------------------

/**
 * Calcule le cadre E depuis les émargements réels de Supabase.
 * @param exerciceDebut date FR ou ISO, ex. '30/12/2024'
 * @param exerciceFin   date FR ou ISO, ex. '29/12/2025'
 */
export async function calculerCadreE(
  exerciceDebut: string,
  exerciceFin: string,
): Promise<CadreE | { erreur: string }> {
  const debut = lireDateSouple(exerciceDebut);
  const fin = lireDateSouple(exerciceFin);

  if (!debut || !fin) {
    return { erreur: "Dates d'exercice illisibles. Format attendu : JJ/MM/AAAA." };
  }
  if (debut > fin) {
    return { erreur: "La date de début d'exercice est postérieure à la date de fin." };
  }

  const [emargements, formateurs] = await Promise.all([
    chargerEmargements(),
    chargerFormateurs(),
  ]);

  const index = indexerFormateurs(formateurs);

  // Accumulateurs par nom normalisé
  const cumul = new Map<string, FormateurCadreE>();
  const nonRapproches = new Set<string>();
  const rattachementManquant = new Set<string>();
  let demiJourneesSansHeures = 0;
  let feuillesDateIllisible = 0;

  for (const feuille of emargements) {
    const dateFeuille = lireDateSouple(feuille.date);
    if (!dateFeuille) { feuillesDateIllisible++; continue; }
    if (dateFeuille < debut || dateFeuille > fin) continue;

    for (const dj of (feuille.demiJournees ?? [])) {
      const nomBrut = String(dj.formateur ?? '').trim();
      if (!nomBrut) continue;

      const heures = Number(dj.heures ?? 0);
      if (!Number.isFinite(heures) || heures <= 0) demiJourneesSansHeures++;

      const cle = normaliserNom(nomBrut);
      const fiche = index.get(cle) ?? null;

      if (!fiche) nonRapproches.add(nomBrut);

      const rattachement = fiche ? lireRattachement(fiche) : null;
      if (fiche && !rattachement) {
        rattachementManquant.add(`${fiche.nom ?? ''} ${fiche.prenom ?? ''}`.trim());
      }

      const existant = cumul.get(cle);
      if (existant) {
        existant.demiJournees++;
        existant.heures += Number.isFinite(heures) && heures > 0 ? heures : 0;
      } else {
        cumul.set(cle, {
          formateurId: fiche?.id ?? null,
          nom: nomBrut,
          rattachement,
          demiJournees: 1,
          heures: Number.isFinite(heures) && heures > 0 ? heures : 0,
        });
      }
    }
  }

  const detail = Array.from(cumul.values())
    .sort((a, b) => b.heures - a.heures || a.nom.localeCompare(b.nom));

  const internes = detail.filter(d => d.rattachement === 'interne');
  const externes = detail.filter(d => d.rattachement === 'externe');

  const somme = (liste: FormateurCadreE[]) =>
    Math.round(liste.reduce((s, d) => s + d.heures, 0) * 100) / 100;

  return {
    exerciceDebut,
    exerciceFin,
    interne: {
      libelle: 'Personnes de votre organisme dispensant des heures de formation',
      nombre: internes.length,
      heures: somme(internes),
    },
    externe: {
      libelle: 'Personnes extérieures dispensant des heures (sous-traitance)',
      nombre: externes.length,
      heures: somme(externes),
    },
    totalHeures: somme(detail),
    detail,
    formateursNonRapproches: Array.from(nonRapproches).sort(),
    rattachementManquant: Array.from(rattachementManquant).sort(),
    demiJourneesSansHeures,
    feuillesDateIllisible,
    calculeLe: new Date().toISOString(),
  };
}

/** Vrai si le résultat est une erreur (garde de type). */
export function estErreurCadreE(
  r: CadreE | { erreur: string },
): r is { erreur: string } {
  return 'erreur' in r;
}
