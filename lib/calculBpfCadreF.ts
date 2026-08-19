// lib/calculBpfCadreF.ts
// Calcul du CADRE F du BPF (Cerfa 10443*17) depuis les données réelles Supabase.
//
// ⚠️ CADRE RÉGLEMENTAIRE
// Le cadre F recense les stagiaires et apprentis formés pendant le DERNIER
// EXERCICE COMPTABLE CLOS (cadre B du Cerfa). Ce n'est pas l'année civile.
// PAM OI déclare un exercice décalé (ex. 30/12/2024 au 29/12/2025).
//
// PAM OI ne dispensant que de l'apprentissage :
//   - ligne F-1.a (salariés hors apprentis)      = 0
//   - ligne F-1.b (apprentis)                    = calculée ici
//   - lignes F-1.c, d, e                         = 0
//   - ligne F-3.a (formations visant un titre RNCP) = total apprentis
//   - ventilation F-3 par niveau                 = calculée ici
//
// RÈGLE D'INCLUSION retenue (à présenter en cas de contrôle) :
// un apprenti est compté si son contrat CHEVAUCHE l'exercice, c'est-à-dire
// si dateDebutContrat <= finExercice ET (dateFinContrat >= debutExercice
// ou contrat sans date de fin). Les ruptures sont incluses : l'apprenti a
// bien été formé pendant la période.

import { chargerApprentis, type Apprenti } from '../data/apprentisSupabase';

// ---------------------------------------------------------------------------
// NIVEAUX DES 8 TITRES PROFESSIONNELS PAM OI
// ---------------------------------------------------------------------------
// Source : fiches RNCP officielles (voir lib/referentielsTP.ts).
// Sert à ventiler le cadre F-3 du Cerfa.

export const NIVEAU_PAR_TP: Record<string, 3 | 4 | 5> = {
  SC: 4,    // Secrétaire comptable          — RNCP37123
  GCF: 5,   // Gestionnaire comptable fiscal — RNCP37949
  AD: 5,    // Assistant(e) de direction     — RNCP38667
  ARH: 5,   // Assistant(e) RH               — RNCP41366
  EC: 3,    // Employé(e) commercial(e)      — RNCP37099
  CV: 4,    // Conseiller(ère) de vente      — RNCP37098
  CATL: 4,  // Conseiller(ère) accueil       — RNCP37396
  FPA: 5,   // Formateur professionnel       — RNCP37275
};

/** Déduit le niveau depuis le champ `formation` d'un apprenant. */
export function niveauDeFormation(formation?: string): 3 | 4 | 5 | null {
  if (!formation) return null;
  const brut = formation.trim().toUpperCase();
  // Correspondance directe sur le sigle
  if (NIVEAU_PAR_TP[brut]) return NIVEAU_PAR_TP[brut];
  // Sigle en préfixe (ex. 'AD_29072024', 'ARH_05112025')
  for (const sigle of Object.keys(NIVEAU_PAR_TP)) {
    if (brut === sigle || brut.startsWith(sigle + '_') || brut.startsWith(sigle + ' ')) {
      return NIVEAU_PAR_TP[sigle];
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// DATES — parseur tolérant
// ---------------------------------------------------------------------------
// Les dates de la base sont tantôt en ISO (2025-09-01), tantôt en FR
// (01/09/2025). Un parseur strict compterait faux en silence.

export function lireDateSouple(valeur?: string | null): Date | null {
  if (!valeur) return null;
  const v = String(valeur).trim();
  if (!v) return null;

  // ISO : 2025-09-01 ou 2025-09-01T00:00:00Z
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  // FR : 01/09/2025 ou 01/09/25
  const fr = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (fr) {
    let annee = Number(fr[3]);
    if (annee < 100) annee += 2000;
    const d = new Date(annee, Number(fr[2]) - 1, Number(fr[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

// ---------------------------------------------------------------------------
// STRUCTURES DE RÉSULTAT
// ---------------------------------------------------------------------------

export interface LigneNiveau {
  niveau: 3 | 4 | 5;
  libelle: string;
  nombre: number;
}

export interface CadreF {
  /** Exercice retenu, tel qu'affiché à l'auditeur. */
  exerciceDebut: string;
  exerciceFin: string;

  /** F-1.b — nombre total d'apprentis sur l'exercice. */
  apprentisNombre: number;

  /** Ventilation F-3 par niveau de certification. */
  parNiveau: LigneNiveau[];

  /** Apprentis dont la formation n'a pas pu être rattachée à un TP connu. */
  formationsInconnues: string[];

  /** Détail nominatif, pour vérification et justification en contrôle. */
  detail: {
    id: string;
    nom: string;
    prenom: string;
    formation: string;
    niveau: 3 | 4 | 5 | null;
    dateDebutContrat: string;
    dateFinContrat: string;
    statut: string;
  }[];

  /** Horodatage du calcul. */
  calculeLe: string;
}

const LIBELLE_NIVEAU: Record<3 | 4 | 5, string> = {
  3: 'Niveau 3 (CAP, BEP)',
  4: 'Niveau 4 (BAC)',
  5: 'Niveau 5 (BAC+2)',
};

// ---------------------------------------------------------------------------
// CALCUL
// ---------------------------------------------------------------------------

/**
 * Détermine si un apprenti doit être compté sur l'exercice.
 * Règle : chevauchement du contrat avec la période.
 */
export function apprentiSurExercice(
  a: Apprenti,
  debutExercice: Date,
  finExercice: Date,
): boolean {
  const debutContrat = lireDateSouple(a.dateDebutContrat);
  if (!debutContrat) return false;               // sans date de début : non comptable
  if (debutContrat > finExercice) return false;  // contrat postérieur à l'exercice

  const finContrat = lireDateSouple(a.dateFinContrat);
  if (!finContrat) return true;                  // contrat en cours : compté
  return finContrat >= debutExercice;
}

/**
 * Calcule le cadre F depuis les apprenants réels de Supabase.
 * @param exerciceDebut date FR ou ISO, ex. '30/12/2024'
 * @param exerciceFin   date FR ou ISO, ex. '29/12/2025'
 */
export async function calculerCadreF(
  exerciceDebut: string,
  exerciceFin: string,
): Promise<CadreF | { erreur: string }> {
  const debut = lireDateSouple(exerciceDebut);
  const fin = lireDateSouple(exerciceFin);

  if (!debut || !fin) {
    return { erreur: "Dates d'exercice illisibles. Format attendu : JJ/MM/AAAA." };
  }
  if (debut > fin) {
    return { erreur: "La date de début d'exercice est postérieure à la date de fin." };
  }

  const tous = await chargerApprentis();
  const retenus = tous.filter(a => apprentiSurExercice(a, debut, fin));

  const compteurs: Record<3 | 4 | 5, number> = { 3: 0, 4: 0, 5: 0 };
  const inconnues = new Set<string>();

  const detail = retenus.map(a => {
    const niveau = niveauDeFormation(a.formation);
    if (niveau) compteurs[niveau]++;
    else if (a.formation) inconnues.add(a.formation);

    return {
      id: a.id,
      nom: a.nom ?? '',
      prenom: a.prenom ?? '',
      formation: a.formation ?? '',
      niveau,
      dateDebutContrat: a.dateDebutContrat ?? '',
      dateFinContrat: a.dateFinContrat ?? '',
      statut: a.statut ?? '',
    };
  });

  detail.sort((x, y) => x.nom.localeCompare(y.nom));

  return {
    exerciceDebut,
    exerciceFin,
    apprentisNombre: retenus.length,
    parNiveau: ([3, 4, 5] as const).map(n => ({
      niveau: n,
      libelle: LIBELLE_NIVEAU[n],
      nombre: compteurs[n],
    })),
    formationsInconnues: Array.from(inconnues).sort(),
    detail,
    calculeLe: new Date().toISOString(),
  };
}

/** Vrai si le résultat est une erreur (garde de type). */
export function estErreurCadreF(
  r: CadreF | { erreur: string },
): r is { erreur: string } {
  return 'erreur' in r;
}
