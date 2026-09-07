// lib/heuresEffectives.ts
// Calcul des heures réellement suivies par un apprenti sur une demi-journée.
//
// POURQUOI CE MODULE EXISTE
// Les heures comptées alimentent les états mensuels OPCO et le cadre F du BPF
// (nombre total d'heures suivies par les apprentis). Elles doivent refléter
// le temps RÉELLEMENT passé en formation, pas la durée théorique de la séance.
//
// Une seule règle, appelée depuis deux endroits :
//   - la page d'émargement, quand on saisit une heure de départ ;
//   - la fiche apprenant, quand on enregistre une sortie anticipée.
// Sans cela, les deux écrans pourraient calculer différemment.
//
// RÈGLE RETENUE
//   heures comptées = (départ effectif − arrivée effective), arrondi au quart d'heure
// où :
//   - arrivée effective = heureArrivee si renseignée, sinon heureDebut de la séance
//   - départ effectif   = heureDepart si renseignée, sinon heureFin de la séance
//
// Exemple : après-midi 13h00-16h30, départ à 15h00 → 2 h comptées (au lieu de 3,5).
//
// ⚠️ CHANGEMENT PAR RAPPORT À L'ANCIEN CALCUL
// L'ancienne fonction renvoyait 3,5 h en dur pour tout « Présent », sans lire
// les horaires de la séance. Les demi-journées standard de PAM OI durent
// exactement 3,5 h (08h30-12h00 et 13h00-16h30) : le résultat est donc
// identique pour elles. Seules les séances de durée différente changent,
// et elles étaient jusqu'ici mal comptées.

export type StatutPresence =
  | 'Présent'
  | 'Absent'
  | 'Absent justifié'
  | 'Retard'
  | 'Non saisi'
  | string;

/** Horaires par défaut d'une demi-journée, si la séance ne les précise pas. */
const DEBUT_DEFAUT = '08:30';
const FIN_DEFAUT = '12:00';

/** 'HH:MM' -> minutes depuis minuit. null si illisible. */
export function minutesDepuisHeure(heure?: string | null): number | null {
  if (!heure) return null;
  const m = String(heure).trim().match(/^(\d{1,2})[:hH](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]), mn = Number(m[2]);
  if (h < 0 || h > 23 || mn < 0 || mn > 59) return null;
  return h * 60 + mn;
}

/** Minutes -> heures décimales, arrondies au quart d'heure. Jamais négatif. */
function versHeures(minutes: number): number {
  return Math.max(0, Math.round((minutes / 60) * 4) / 4);
}

/**
 * Calcule les heures réellement suivies sur une demi-journée.
 *
 * @param statut        statut de présence saisi
 * @param heureArrivee  arrivée effective (retard) — optionnelle
 * @param heureDepart   départ effectif (sortie anticipée) — optionnelle
 * @param heureDebut    début théorique de la séance
 * @param heureFin      fin théorique de la séance
 */
export function calculerHeuresEffectives(
  statut: StatutPresence,
  heureArrivee?: string,
  heureDepart?: string,
  heureDebut: string = DEBUT_DEFAUT,
  heureFin: string = FIN_DEFAUT,
): number {
  // Une absence ne compte aucune heure, même justifiée au sens disciplinaire :
  // l'apprenti n'a pas suivi la formation.
  if (statut === 'Absent') return 0;
  if (statut === 'Non saisi' || !statut) return 0;

  const debutSeance = minutesDepuisHeure(heureDebut) ?? minutesDepuisHeure(DEBUT_DEFAUT)!;
  const finSeance = minutesDepuisHeure(heureFin) ?? minutesDepuisHeure(FIN_DEFAUT)!;

  // « Absent justifié » : 0 heure, comme toute absence.
  // Le justificatif ne transforme pas une absence en heures suivies. Les heures
  // manquantes sont signalées à l'employeur, à qui il revient de décider du
  // maintien de salaire ou d'un rattrapage. Le BPF et les états mensuels ne
  // doivent porter que des heures RÉELLEMENT suivies.
  if (statut === 'Absent justifié') return 0;

  // Arrivée : celle saisie si elle est postérieure au début de séance.
  const arriveeSaisie = minutesDepuisHeure(heureArrivee);
  const arrivee = arriveeSaisie !== null && arriveeSaisie > debutSeance ? arriveeSaisie : debutSeance;

  // Départ : celui saisi s'il est antérieur à la fin de séance.
  const departSaisi = minutesDepuisHeure(heureDepart);
  const depart = departSaisi !== null && departSaisi < finSeance ? departSaisi : finSeance;

  return versHeures(depart - arrivee);
}

/**
 * Retrouve la demi-journée concernée par une sortie anticipée.
 * Renvoie l'identifiant de la demi-journée, ou null si l'heure de sortie
 * tombe en dehors de toutes les séances du jour.
 *
 * Utilisé pour propager une sortie saisie depuis la fiche apprenant vers
 * la feuille d'émargement du jour.
 */
export function demiJourneeConcernee(
  demiJournees: { id: string; heureDebut?: string; heureFin?: string }[],
  heureSortie: string,
): string | null {
  const sortie = minutesDepuisHeure(heureSortie);
  if (sortie === null) return null;

  for (const dj of demiJournees) {
    const debut = minutesDepuisHeure(dj.heureDebut) ?? minutesDepuisHeure(DEBUT_DEFAUT)!;
    const fin = minutesDepuisHeure(dj.heureFin) ?? minutesDepuisHeure(FIN_DEFAUT)!;
    if (sortie > debut && sortie < fin) return dj.id;
  }
  return null;
}

/** Libellé court du départ anticipé, pour l'affichage sur la feuille. */
export function libelleDepart(heureDepart?: string, heureFin?: string): string {
  const d = minutesDepuisHeure(heureDepart);
  const f = minutesDepuisHeure(heureFin);
  if (d === null || f === null || d >= f) return '';
  const manque = versHeures(f - d);
  return `Parti(e) à ${heureDepart} — ${manque} h non suivie(s)`;
}