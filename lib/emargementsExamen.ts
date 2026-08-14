// lib/emargementsExamen.ts
// Composition des feuilles d'émargement d'une session d'examen.
//
// Principe : une ligne d'émargement = un PASSAGE du candidat, non une partie
// interne d'épreuve. Le CV a une MSP en 5 parties et l'EC en 2 : le candidat
// signe une seule fois, car il ne quitte pas son poste entre les parties.
// Seul l'AD fait exception — sa partie orale se déroule après l'écrit,
// devant le jury : deux passages, donc deux signatures.
//
// Réf. arrêté du 21 juillet 2016 portant règlement général des sessions
// d'examen : aucun format d'émargement n'est imposé. Les feuilles produites
// ici sont des pièces internes de traçabilité, utiles en audit Qualiopi.

import { referentielParSigle, ccpsDuTP } from './referentielsTP';

export interface EpreuveEmargement {
  cle: string;        // 'MSP', 'MSP_ORALE', 'ET', 'QAP', 'EF'
  libelle: string;
  duree: string;
  /** true : heure de début ET de fin (le candidat reste à son poste).
   *  false : heure de passage seule (passage individuel devant le jury). */
  avecPlage: boolean;
}

/**
 * Épreuves à faire émarger pour une session.
 *
 * @param sigle        TP concerné
 * @param typeSession  'titre' ou 'ccp'
 * @param ccpVise      code du CCP pour une session CCP, ex. 'CCP2'
 * @param avecEntretienFinal  vrai si l'entretien final se tient dans cette session
 * @param situationsTitre  situations de la session titre, telles que définies
 *                         dans FORMATIONS_EXAMEN (durées de la page Examens)
 */
export function epreuvesAEmarger(
  sigle: string,
  typeSession: string | undefined,
  ccpVise: string | undefined,
  avecEntretienFinal: boolean | undefined,
  situationsTitre?: { id: string; label: string; duree: string; applicable: boolean }[],
): EpreuveEmargement[] {
  const ref = referentielParSigle(sigle);
  const liste: EpreuveEmargement[] = [];

  // ── Session CCP : durées issues du référentiel du CCP visé ──
  if (typeSession === 'ccp') {
    const ccp = ccpsDuTP(sigle).find(c => c.code === ccpVise);
    const d = ccp?.durees;
    if (d?.msp) liste.push({ cle: 'MSP', libelle: 'Mise en situation professionnelle', duree: d.msp, avecPlage: true });
    if (d?.qap) liste.push({ cle: 'QAP', libelle: 'Questionnement à partir de production(s)', duree: d.qap, avecPlage: false });
    if (d?.et)  liste.push({ cle: 'ET',  libelle: 'Entretien technique', duree: d.et, avecPlage: false });

    if (avecEntretienFinal) {
      const ef = situationsTitre?.find(s => s.id === 'EF' && s.applicable);
      if (ef) liste.push({ cle: 'EF', libelle: 'Entretien final', duree: ef.duree, avecPlage: false });
    }
    return liste;
  }

  // ── Session titre : durées de FORMATIONS_EXAMEN ──
  const applicables = (situationsTitre ?? []).filter(s => s.applicable);
  for (const s of applicables) {
    if (s.id === 'MSP') {
      // AD : la partie orale est un passage distinct, après l'écrit.
      if (ref?.mspDeuxTemps) {
        liste.push({ cle: 'MSP', libelle: 'Mise en situation — partie écrite', duree: ref.mspDeuxTemps.ecrite, avecPlage: true });
        liste.push({ cle: 'MSP_ORALE', libelle: 'Mise en situation — partie orale', duree: ref.mspDeuxTemps.orale, avecPlage: false });
      } else {
        liste.push({ cle: 'MSP', libelle: s.label, duree: s.duree, avecPlage: true });
      }
    } else if (s.id === 'QAP') {
      liste.push({ cle: 'QAP', libelle: 'Questionnement à partir de production(s)', duree: s.duree, avecPlage: false });
    } else if (s.id === 'ET') {
      liste.push({ cle: 'ET', libelle: 'Entretien technique', duree: s.duree, avecPlage: false });
    } else if (s.id === 'QP') {
      liste.push({ cle: 'QP', libelle: 'Questionnaire professionnel', duree: s.duree, avecPlage: true });
    } else if (s.id === 'EF') {
      liste.push({ cle: 'EF', libelle: 'Entretien final', duree: s.duree, avecPlage: false });
    }
  }
  return liste;
}

/**
 * Identifiant d'anonymat du candidat : sigle TP · poste · rang.
 * Réf. DTE : « attribuez un identifiant à chaque candidat. Établissez un
 * tableau de correspondance que vous remettrez au jury pour les entretiens. »
 */
export function identifiantCandidat(sigle: string, rang: number): string {
  return `${sigle}-PC${rang}-C${rang}`;
}

/** Durée totale des épreuves, au format « 3 h 55 ». */
export function dureeTotale(epreuves: EpreuveEmargement[]): string {
  let minutes = 0;
  for (const e of epreuves) {
    const m = /^(\d+)\s*h\s*(\d{0,2})$/i.exec((e.duree ?? '').trim());
    if (m) minutes += parseInt(m[1]) * 60 + (m[2] ? parseInt(m[2]) : 0);
  }
  const h = Math.floor(minutes / 60);
  const mn = minutes % 60;
  return `${h} h ${mn.toString().padStart(2, '0')}`;
}