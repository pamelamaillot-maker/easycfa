// lib/calculBpfCadreF.ts
// Calcul du CADRE F du BPF (Cerfa 10443*17) depuis les données réelles Supabase.
//
// ⚠️ CADRE RÉGLEMENTAIRE
// Le cadre F recense les stagiaires et apprentis formés pendant le DERNIER
// EXERCICE COMPTABLE CLOS (cadre B du Cerfa). Ce n'est pas l'année civile.
// PAM OI déclare un exercice décalé (ex. 30/12/2024 au 29/12/2025).
//
// PAM OI ne dispensant que de l'apprentissage :
//   - ligne F-1.a (salariés hors apprentis)         = 0
//   - ligne F-1.b (apprentis)                       = calculée ici
//   - lignes F-1.c, d, e                            = 0
//   - ligne F-3.a (formations visant un titre RNCP) = total apprentis
//   - ventilation F-3 par niveau                    = calculée ici
//
// RÈGLE D'INCLUSION (à présenter en cas de contrôle) :
// un apprenti est compté si son contrat CHEVAUCHE l'exercice, c'est-à-dire
// si dateDebutContrat <= finExercice ET (fin retenue >= debutExercice
// ou contrat sans date de fin).
//
// RÈGLE DE FIN DE CONTRAT (à présenter en cas de contrôle) :
// pour un contrat au statut « Rupture », la date de fin réelle est la date
// de rupture effective, pas la date de fin initialement prévue. Le calcul
// retient donc dateRuptureEffective lorsqu'elle existe.
// GARDE-FOU : cette date ne peut qu'ÉCOURTER le contrat, jamais le prolonger.
// Une saisie erronée ne peut donc pas gonfler le comptage.
// Les ruptures sans dateRuptureEffective sont listées dans
// `rupturesSansDateEffective` : elles retombent sur dateFinContrat.
//
// RÈGLE DE DÉDOUBLONNAGE (à présenter en cas de contrôle) :
// le Cerfa demande un nombre de PERSONNES, pas un nombre de contrats.
// Deux lignes sont fusionnées si nom + prénom + date de naissance
// correspondent, après normalisation (majuscules, accents retirés,
// tirets et espaces uniformisés). Si la date de naissance est absente,
// le rapprochement se fait sur nom + prénom seuls et le cas est signalé
// dans `sansDateNaissance`.

import { chargerApprentis, type Apprenti } from '../data/apprentisSupabase';

// ---------------------------------------------------------------------------
// NIVEAUX DES 8 TITRES PROFESSIONNELS PAM OI
// ---------------------------------------------------------------------------
// Source : fiches RNCP officielles (voir lib/referentielsTP.ts).

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

  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  const fr = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (fr) {
    let annee = Number(fr[3]);
    if (annee < 100) annee += 2000;
    const d = new Date(annee, Number(fr[2]) - 1, Number(fr[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/** Date ramenée à 'AAAA-MM-JJ' pour servir de clé d'identité. */
function cleDate(valeur?: string | null): string {
  const d = lireDateSouple(valeur);
  if (!d) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const jj = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${jj}`;
}

// ---------------------------------------------------------------------------
// FIN DE CONTRAT RETENUE
// ---------------------------------------------------------------------------

export type SourceDateFin = 'rupture_effective' | 'fin_contrat' | 'aucune';

export interface FinRetenue {
  date: Date | null;
  texte: string;
  source: SourceDateFin;
}

/**
 * Détermine la date de fin réellement retenue pour un contrat.
 *
 * Pour un contrat rompu, la formation s'arrête à la rupture effective.
 * Le garde-fou empêche toute prolongation : si dateRuptureEffective est
 * POSTÉRIEURE à dateFinContrat, elle est ignorée (saisie incohérente).
 */
export function finRetenue(a: Apprenti): FinRetenue {
  const finPrevue = lireDateSouple(a.dateFinContrat);
  const estRompu = (a.statut ?? '') === 'Rupture';

  if (estRompu) {
    const effective = lireDateSouple(a.dateRuptureEffective);
    if (effective && (!finPrevue || effective <= finPrevue)) {
      return {
        date: effective,
        texte: a.dateRuptureEffective ?? '',
        source: 'rupture_effective',
      };
    }
  }

  if (finPrevue) {
    return { date: finPrevue, texte: a.dateFinContrat ?? '', source: 'fin_contrat' };
  }

  return { date: null, texte: '', source: 'aucune' };
}

// ---------------------------------------------------------------------------
// NORMALISATION DES NOMS
// ---------------------------------------------------------------------------
// Vos saisies ne sont pas uniformes : 'MAROUDIN - VIRAMALE' et
// 'MAROUDIN-VIRAMALE' désignent la même personne. On uniformise avant
// comparaison, sans jamais modifier la donnée en base.

export function normaliserNom(valeur?: string | null): string {
  if (!valeur) return '';
  return String(valeur)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // retire les accents
    .toUpperCase()
    .replace(/[\s\-']+/g, ' ')          // tirets, apostrophes, espaces -> espace
    .trim()
    .replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// STRUCTURES DE RÉSULTAT
// ---------------------------------------------------------------------------

export interface LigneNiveau {
  niveau: 3 | 4 | 5;
  libelle: string;
  nombre: number;
}

export interface ContratRetenu {
  id: string;
  formation: string;
  niveau: 3 | 4 | 5 | null;
  dateDebutContrat: string;
  dateFinContrat: string;      // valeur brute en base
  dateFinRetenue: string;      // valeur réellement utilisée par le calcul
  sourceDateFin: SourceDateFin;
  statut: string;
}

export interface PersonneRetenue {
  id: string;                 // id du contrat le plus ancien
  nom: string;
  prenom: string;
  dateNaissance: string;
  formation: string;          // formation du contrat le plus ancien
  niveau: 3 | 4 | 5 | null;
  dateDebutContrat: string;
  dateFinContrat: string;
  dateFinRetenue: string;
  sourceDateFin: SourceDateFin;
  statut: string;
  nbContrats: number;
  formationsMultiples: boolean;   // vrai si les contrats visent des TP differents
}

export interface Doublon {
  nom: string;
  prenom: string;
  dateNaissance: string;
  contrats: ContratRetenu[];
  chevauchement: boolean;     // vrai si deux contrats se recouvrent dans le temps
}

export interface CadreF {
  exerciceDebut: string;
  exerciceFin: string;

  /** F-1.b — nombre de PERSONNES distinctes. C'est le chiffre à déclarer. */
  apprentisNombre: number;

  /** Nombre de lignes de contrat retenues, avant dédoublonnage. */
  contratsNombre: number;

  /** Ventilation F-3 par niveau, sur les personnes distinctes. */
  parNiveau: LigneNiveau[];

  /** Personnes présentes plusieurs fois — à vérifier en base. */
  doublons: Doublon[];

  /** Personnes sans date de naissance : rapprochées sur nom + prénom seuls. */
  sansDateNaissance: string[];

  /** Ruptures sans dateRuptureEffective : le calcul retombe sur dateFinContrat. */
  rupturesSansDateEffective: string[];

  /** Libellés de formation non rattachés à un TP connu. */
  formationsInconnues: string[];

  /** Détail nominatif dédoublonné, pour justification en contrôle. */
  detail: PersonneRetenue[];

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

/** Détermine si un contrat chevauche l'exercice. */
export function apprentiSurExercice(
  a: Apprenti,
  debutExercice: Date,
  finExercice: Date,
): boolean {
  const debutContrat = lireDateSouple(a.dateDebutContrat);
  if (!debutContrat) return false;               // sans date de debut : non comptable
  if (debutContrat > finExercice) return false;  // contrat posterieur a l'exercice

  const fin = finRetenue(a).date;
  if (!fin) return true;                         // contrat en cours : compte
  return fin >= debutExercice;
}

/** Vrai si deux contrats se recouvrent dans le temps. */
function contratsSeChevauchent(a: ContratRetenu, b: ContratRetenu): boolean {
  const debutA = lireDateSouple(a.dateDebutContrat);
  const debutB = lireDateSouple(b.dateDebutContrat);
  if (!debutA || !debutB) return false;

  const LOINTAIN = new Date(8640000000000000);
  const finA = lireDateSouple(a.dateFinRetenue) ?? LOINTAIN;
  const finB = lireDateSouple(b.dateFinRetenue) ?? LOINTAIN;

  return debutA <= finB && debutB <= finA;
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

  // --- Regroupement par identite ------------------------------------------
  const groupes = new Map<string, { apprentis: Apprenti[]; sansNaissance: boolean }>();

  for (const a of retenus) {
    const nom = normaliserNom(a.nom);
    const prenom = normaliserNom(a.prenom);
    const naissance = cleDate(a.dateNaissance);
    const sansNaissance = naissance === '';
    const cle = sansNaissance ? `${nom}|${prenom}` : `${nom}|${prenom}|${naissance}`;

    const g = groupes.get(cle);
    if (g) {
      g.apprentis.push(a);
      g.sansNaissance = g.sansNaissance || sansNaissance;
    } else {
      groupes.set(cle, { apprentis: [a], sansNaissance });
    }
  }

  // --- Construction du resultat -------------------------------------------
  const compteurs: Record<3 | 4 | 5, number> = { 3: 0, 4: 0, 5: 0 };
  const inconnues = new Set<string>();
  const doublons: Doublon[] = [];
  const sansDateNaissance: string[] = [];
  const rupturesSansDateEffective: string[] = [];
  const detail: PersonneRetenue[] = [];

  for (const groupe of Array.from(groupes.values())) {
    const apprentis = groupe.apprentis;

    // Signalement des ruptures dont la date effective manque
    for (const a of apprentis) {
      if ((a.statut ?? '') === 'Rupture' && !lireDateSouple(a.dateRuptureEffective)) {
        rupturesSansDateEffective.push(
          `${a.nom ?? ''} ${a.prenom ?? ''} (${a.formation ?? '—'})`.trim()
        );
      }
    }

    // Contrats tries du plus ancien au plus recent
    const contrats: ContratRetenu[] = apprentis
      .map(a => {
        const f = finRetenue(a);
        return {
          id: a.id,
          formation: a.formation ?? '',
          niveau: niveauDeFormation(a.formation),
          dateDebutContrat: a.dateDebutContrat ?? '',
          dateFinContrat: a.dateFinContrat ?? '',
          dateFinRetenue: f.texte,
          sourceDateFin: f.source,
          statut: a.statut ?? '',
        };
      })
      .sort((x, y) => {
        const dx = lireDateSouple(x.dateDebutContrat)?.getTime() ?? 0;
        const dy = lireDateSouple(y.dateDebutContrat)?.getTime() ?? 0;
        return dx - dy;
      });

    const principal = apprentis.find(a => a.id === contrats[0].id) ?? apprentis[0];
    const niveau = contrats[0].niveau;

    // Une personne compte une seule fois, sur le niveau de son premier contrat.
    if (niveau) compteurs[niveau]++;
    else if (contrats[0].formation) inconnues.add(contrats[0].formation);

    const formationsDistinctes = new Set(contrats.map(c => c.formation));

    detail.push({
      id: contrats[0].id,
      nom: principal.nom ?? '',
      prenom: principal.prenom ?? '',
      dateNaissance: principal.dateNaissance ?? '',
      formation: contrats[0].formation,
      niveau,
      dateDebutContrat: contrats[0].dateDebutContrat,
      dateFinContrat: contrats[0].dateFinContrat,
      dateFinRetenue: contrats[0].dateFinRetenue,
      sourceDateFin: contrats[0].sourceDateFin,
      statut: contrats[0].statut,
      nbContrats: contrats.length,
      formationsMultiples: formationsDistinctes.size > 1,
    });

    if (groupe.sansNaissance) {
      sansDateNaissance.push(`${principal.nom ?? ''} ${principal.prenom ?? ''}`.trim());
    }

    if (contrats.length > 1) {
      let chevauchement = false;
      for (let i = 0; i < contrats.length && !chevauchement; i++) {
        for (let j = i + 1; j < contrats.length; j++) {
          if (contratsSeChevauchent(contrats[i], contrats[j])) { chevauchement = true; break; }
        }
      }
      doublons.push({
        nom: principal.nom ?? '',
        prenom: principal.prenom ?? '',
        dateNaissance: principal.dateNaissance ?? '',
        contrats,
        chevauchement,
      });
    }
  }

  detail.sort((x, y) => x.nom.localeCompare(y.nom) || x.prenom.localeCompare(y.prenom));
  doublons.sort((x, y) => x.nom.localeCompare(y.nom));

  return {
    exerciceDebut,
    exerciceFin,
    apprentisNombre: detail.length,
    contratsNombre: retenus.length,
    parNiveau: ([3, 4, 5] as const).map(n => ({
      niveau: n,
      libelle: LIBELLE_NIVEAU[n],
      nombre: compteurs[n],
    })),
    doublons,
    sansDateNaissance: Array.from(new Set(sansDateNaissance)).sort(),
    rupturesSansDateEffective: Array.from(new Set(rupturesSansDateEffective)).sort(),
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