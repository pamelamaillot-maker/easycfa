// lib/tauxReussite.ts
// Calcul des taux de réussite aux titres professionnels.
//
// ⚠️ CADRE RÉGLEMENTAIRE — à lire avant toute modification.
//
// Pour un CFA, les indicateurs de résultats OBLIGATOIRES sont ceux de
// l'article L. 6111-8 du code du travail (taux d'obtention, poursuite d'études,
// interruption, insertion, valeur ajoutée, rupture). Ils sont calculés par les
// ministères et publiés sur InserJeunes ; le CFA en informe le public.
// Le CFA ne calcule ses propres indicateurs que lorsque les données ne sont pas
// disponibles sur InserJeunes (effectifs insuffisants, nouveau CFA).
//
// Les taux produits ici sont donc :
//   - des outils de PILOTAGE interne (indicateurs 2 et 30 à 32 du RNQ) ;
//   - un filet si InserJeunes ne couvre pas les effectifs.
// Ils ne se substituent pas aux indicateurs publiés par l'État.
//
// AUCUNE formule n'est imposée par le RNQ ni par la DEETS. Ce qui est exigé :
// afficher l'effectif, la période de référence et la méthode retenue.
// D'où le paramétrage ci-dessous, et la fonction libelleMethode().

import { ccpsDuTP } from './referentielsTP';

export type DecisionJury = 'reussite' | 'reussite_partielle' | 'echec' | 'absence';
export type EtatCcp = 'obtenu' | 'non_obtenu' | 'non_presente';

// ---------------------------------------------------------------------------
// PARAMÈTRES DE MÉTHODE — modifiables, affichés à l'utilisateur et à l'auditeur
// ---------------------------------------------------------------------------

export interface MethodeCalcul {
  /** 'presentes' : les absents sortent du dénominateur.
   *  'inscrits'  : tous les candidats inscrits comptent. */
  base: 'presentes' | 'inscrits';
  /** Inclure les candidats dont les résultats CCP ne sont pas encore saisis. */
  inclureNonRenseignes: boolean;
  /** Compter la réussite partielle comme un succès (déconseillé : le titre
   *  n'est pas obtenu). Faux par défaut. */
  partielCompteCommeReussite: boolean;
}

export const METHODE_PAR_DEFAUT: MethodeCalcul = {
  base: 'presentes',
  inclureNonRenseignes: false,
  partielCompteCommeReussite: false,
};

/** Phrase à afficher sous chaque taux, et à présenter à l'auditeur. */
export function libelleMethode(m: MethodeCalcul): string {
  const parts: string[] = [];
  parts.push(m.base === 'presentes'
    ? 'candidats présentés (absents exclus du calcul)'
    : 'candidats inscrits (absents inclus)');
  if (!m.inclureNonRenseignes) parts.push('dossiers sans résultat saisi exclus');
  parts.push(m.partielCompteCommeReussite
    ? 'réussite partielle comptée comme réussite'
    : 'seul le titre complet compte comme réussite');
  return 'Base de calcul : ' + parts.join(' · ') + '.';
}

// ---------------------------------------------------------------------------
// DÉDUCTION DE LA DÉCISION DU JURY
// ---------------------------------------------------------------------------

/**
 * Déduit la décision du jury des seuls résultats CCP et de l'entretien final.
 * Évite toute incohérence entre la grille CCP et la décision saisie.
 *
 * Réf. arrêté du 22 décembre 2015 : le titre est délivré lorsque l'ensemble
 * des CCP est acquis ET que l'entretien final est satisfaisant.
 */
export function deduireDecisionJury(
  formationSigle: string,
  resultatsCcp: Record<string, EtatCcp> | undefined,
  entretienFinalSatisfaisant: boolean | undefined,
  ccpsDeLaSession?: string[],   // session CCP : seuls ces CCP y sont joués
): DecisionJury | null {
  const tous = ccpsDuTP(formationSigle);
  if (tous.length === 0) return null;

  const res = resultatsCcp ?? {};
  const codes = tous.map(c => c.code);
  const saisis = codes.filter(c => res[c] && res[c] !== 'non_presente');

  // Aucun résultat saisi → on ne déduit rien (dossier à compléter).
  if (saisis.length === 0) {
    const perimetre = (ccpsDeLaSession && ccpsDeLaSession.length > 0) ? ccpsDeLaSession : codes;
    const nonPresente = perimetre.every(c => res[c] === 'non_presente');
    return nonPresente && perimetre.some(c => res[c]) ? 'absence' : null;
  }

  const obtenus = codes.filter(c => res[c] === 'obtenu');

  if (obtenus.length === 0) return 'echec';
  if (obtenus.length === codes.length) {
    return entretienFinalSatisfaisant ? 'reussite' : 'reussite_partielle';
  }
  return 'reussite_partielle';
}

export const LIBELLE_DECISION: Record<DecisionJury, string> = {
  reussite: 'Réussite',
  reussite_partielle: 'Réussite partielle',
  echec: 'Échec',
  absence: 'Absence',
};

export const COULEUR_DECISION: Record<DecisionJury, string> = {
  reussite: '#16a34a',
  reussite_partielle: '#C8A23A',
  echec: '#e53e3e',
  absence: '#888888',
};

// ---------------------------------------------------------------------------
// STRUCTURES DE RÉSULTAT
// ---------------------------------------------------------------------------

export interface TauxDetail {
  cle: string;              // 'SC', '2026', 'apprentissage'…
  libelle: string;
  inscrits: number;
  presentes: number;
  absents: number;
  nonRenseignes: number;
  reussites: number;
  partielles: number;
  echecs: number;
  denominateur: number;     // effectif réellement pris en compte
  taux: number | null;      // null si dénominateur nul
}

export interface TauxCcp {
  code: string;
  intitule: string;
  presentes: number;
  obtenus: number;
  taux: number | null;
}

export interface CandidatCalcul {
  apprenantId?: string;
  nom?: string;
  prenom?: string;
  typeCandidature?: string;
  resultatsCcp?: Record<string, EtatCcp>;
  entretienFinalSatisfaisant?: boolean;
  decisionJury?: DecisionJury;
}

export interface SessionCalcul {
  formation: string;
  dateDebut?: string;
  typeSession?: string;
  ccpVises?: string[];
  candidats?: CandidatCalcul[];
}

// ---------------------------------------------------------------------------
// CALCUL
// ---------------------------------------------------------------------------

function anneeDe(dateFr?: string): string {
  if (!dateFr) return '';
  const p = dateFr.split('/');
  if (p.length !== 3) return '';
  return p[2].length === 2 ? '20' + p[2] : p[2];
}

/**
 * Calcule un taux sur un ensemble de candidats.
 * La décision est TOUJOURS déduite des résultats CCP : le champ decisionJury
 * éventuellement stocké n'est utilisé qu'en secours.
 */
function calculerSur(
  cle: string,
  libelle: string,
  entrees: { session: SessionCalcul; cand: CandidatCalcul }[],
  methode: MethodeCalcul,
): TauxDetail {
  let absents = 0, nonRenseignes = 0, reussites = 0, partielles = 0, echecs = 0;

  for (const { session, cand } of entrees) {
    const decision = deduireDecisionJury(
      session.formation, cand.resultatsCcp, cand.entretienFinalSatisfaisant, session.ccpVises
    ) ?? cand.decisionJury ?? null;

    if (decision === null) { nonRenseignes++; continue; }
    if (decision === 'absence') { absents++; continue; }
    if (decision === 'reussite') reussites++;
    else if (decision === 'reussite_partielle') partielles++;
    else if (decision === 'echec') echecs++;
  }

  const inscrits = entrees.length;
  const presentes = reussites + partielles + echecs;

  let denominateur = methode.base === 'presentes' ? presentes : presentes + absents;
  if (methode.inclureNonRenseignes) denominateur += nonRenseignes;

  const numerateur = reussites + (methode.partielCompteCommeReussite ? partielles : 0);
  const taux = denominateur > 0 ? Math.round((numerateur / denominateur) * 1000) / 10 : null;

  return { cle, libelle, inscrits, presentes, absents, nonRenseignes, reussites, partielles, echecs, denominateur, taux };
}

/** Taux par TP, pour une année donnée (ou toutes années si annee vide). */
export function tauxParTP(
  sessions: SessionCalcul[],
  methode: MethodeCalcul,
  annee?: string,
  typeCandidature?: string,
): TauxDetail[] {
  const groupes = new Map<string, { session: SessionCalcul; cand: CandidatCalcul }[]>();
  for (const s of sessions) {
    if (annee && anneeDe(s.dateDebut) !== annee) continue;
    for (const c of (s.candidats ?? [])) {
      if (typeCandidature && (c.typeCandidature ?? '') !== typeCandidature) continue;
      groupes.set(s.formation, [...(groupes.get(s.formation) ?? []), { session: s, cand: c }]);
    }
  }
  return Array.from(groupes.entries())
    .map(([sigle, entrees]) => calculerSur(sigle, sigle, entrees, methode))
    .sort((a, b) => a.cle.localeCompare(b.cle));
}

/** Taux par année, tous TP confondus (ou un TP donné). */
export function tauxParAnnee(
  sessions: SessionCalcul[],
  methode: MethodeCalcul,
  formation?: string,
  typeCandidature?: string,
): TauxDetail[] {
  const groupes = new Map<string, { session: SessionCalcul; cand: CandidatCalcul }[]>();
  for (const s of sessions) {
    if (formation && s.formation !== formation) continue;
    const a = anneeDe(s.dateDebut);
    if (!a) continue;
    for (const c of (s.candidats ?? [])) {
      if (typeCandidature && (c.typeCandidature ?? '') !== typeCandidature) continue;
      groupes.set(a, [...(groupes.get(a) ?? []), { session: s, cand: c }]);
    }
  }
  return Array.from(groupes.entries())
    .map(([a, entrees]) => calculerSur(a, a, entrees, methode))
    .sort((x, y) => x.cle.localeCompare(y.cle));
}

/**
 * Taux par catégorie de candidature.
 * ⚠️ Les catégories ne doivent JAMAIS être agrégées entre elles :
 * apprentissage, formation continue, VAE et candidats libres relèvent
 * de populations de référence distinctes.
 */
export const LIBELLE_CANDIDATURE: Record<string, string> = {
  apprentissage: 'Apprentissage',
  formation_continue: 'Formation continue',
  vae: 'VAE',
  libre: 'Candidat libre',
  '': 'Non renseigné',
};

export function tauxParCandidature(
  sessions: SessionCalcul[],
  methode: MethodeCalcul,
  annee?: string,
  formation?: string,
): TauxDetail[] {
  const groupes = new Map<string, { session: SessionCalcul; cand: CandidatCalcul }[]>();
  for (const s of sessions) {
    if (annee && anneeDe(s.dateDebut) !== annee) continue;
    if (formation && s.formation !== formation) continue;
    for (const c of (s.candidats ?? [])) {
      const t = c.typeCandidature ?? '';
      groupes.set(t, [...(groupes.get(t) ?? []), { session: s, cand: c }]);
    }
  }
  return Array.from(groupes.entries())
    .map(([t, entrees]) => calculerSur(t, LIBELLE_CANDIDATURE[t] ?? t, entrees, methode))
    .sort((a, b) => b.inscrits - a.inscrits);
}

/**
 * Taux de réussite par CCP — donnée de PILOTAGE pédagogique.
 * N'est pas un indicateur de résultat au sens de l'indicateur 2 du RNQ :
 * ne pas le publier à la place du taux d'obtention du titre.
 */
export function tauxParCcp(
  sessions: SessionCalcul[],
  formation: string,
  annee?: string,
  typeCandidature?: string,
): TauxCcp[] {
  const compte = new Map<string, { presentes: number; obtenus: number }>();
  for (const ccp of ccpsDuTP(formation)) compte.set(ccp.code, { presentes: 0, obtenus: 0 });

  for (const s of sessions) {
    if (s.formation !== formation) continue;
    if (annee && anneeDe(s.dateDebut) !== annee) continue;
    for (const c of (s.candidats ?? [])) {
      if (typeCandidature && (c.typeCandidature ?? '') !== typeCandidature) continue;
      for (const [code, etat] of Object.entries(c.resultatsCcp ?? {})) {
        const e = compte.get(code);
        if (!e) continue;
        if (etat === 'obtenu') { e.presentes++; e.obtenus++; }
        else if (etat === 'non_obtenu') { e.presentes++; }
      }
    }
  }

  return ccpsDuTP(formation).map(ccp => {
    const e = compte.get(ccp.code)!;
    return {
      code: ccp.code,
      intitule: ccp.intitule,
      presentes: e.presentes,
      obtenus: e.obtenus,
      taux: e.presentes > 0 ? Math.round((e.obtenus / e.presentes) * 1000) / 10 : null,
    };
  });
}

/** Phrase de publication conforme à l'indicateur 2 : taux + effectif + période. */
export function phrasePublication(t: TauxDetail, periode: string): string {
  if (t.taux === null) return `${t.libelle} — aucun résultat exploitable sur ${periode}.`;
  return `${t.libelle} — taux d'obtention du titre ${periode} : ${t.taux} %, calculé sur ${t.denominateur} candidat(s).`;
}