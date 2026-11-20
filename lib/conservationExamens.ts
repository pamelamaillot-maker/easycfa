// lib/conservationExamens.ts
// Durée de conservation des dossiers de session d'examen — CFA PAM OI Formation
//
// Règle : un dossier de session archivé est détruit 5 ans après la réception
// des PV validés par la DEETS (champ pvReceptionDeets).
// L'alerte apparaît 3 mois avant l'échéance (orange), puis passe en rouge
// une fois les 5 ans atteints. Elle disparaît quand le dossier papier est
// détruit (dateDestructionDossier) ET les fichiers EasyCFA supprimés
// (dateSuppressionFichiers).

import { lireDate } from './dates';

export const DUREE_CONSERVATION_ANS = 5;
export const PREAVIS_MOIS = 3;

export type NiveauDestruction = 'a_venir' | 'echu';

export type AlerteDestruction = {
  examenId: string;
  libelle: string;
  dateReceptionPv: Date;
  dateEcheance: Date;
  joursRestants: number;          // négatif = échéance dépassée
  niveau: NiveauDestruction;
  papierDetruit: boolean;
  fichiersSupprimes: boolean;
};

/** Date lue en JJ/MM/AAAA ou ISO, années à 2 chiffres corrigées (26 → 2026) */
function lireDateSure(valeur?: string | null): Date | null {
  const d = lireDate(valeur);
  if (!d) return null;
  if (d.getFullYear() < 100) d.setFullYear(d.getFullYear() + 2000);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Échéance de destruction = réception PV DEETS + 5 ans (null si date absente) */
export function echeanceDestruction(pvReceptionDeets?: string | null): Date | null {
  const d = lireDateSure(pvReceptionDeets);
  if (!d) return null;
  const e = new Date(d);
  e.setFullYear(e.getFullYear() + DUREE_CONSERVATION_ANS);
  return e;
}

/** Une session est concernée si elle est archivée ou clôturée */
function estArchivee(e: any): boolean {
  return e?.archive === true || e?.statut === 'Clôturée';
}

/** Sessions archivées dont la destruction est à faire (dans les 3 mois ou dépassée) */
export function alertesDestruction(examens: any[], aujourdhui: Date = new Date()): AlerteDestruction[] {
  const jour = new Date(aujourdhui);
  jour.setHours(0, 0, 0, 0);
  const debutAlerte = new Date(jour);
  debutAlerte.setMonth(debutAlerte.getMonth() + PREAVIS_MOIS);

  const alertes: AlerteDestruction[] = [];
  for (const e of examens ?? []) {
    if (!estArchivee(e)) continue;
    const papierDetruit = !!e.dateDestructionDossier;
    const fichiersSupprimes = !!e.dateSuppressionFichiers;
    if (papierDetruit && fichiersSupprimes) continue;

    const reception = lireDateSure(e.pvReceptionDeets);
    const echeance = echeanceDestruction(e.pvReceptionDeets);
    if (!reception || !echeance) continue;
    if (echeance.getTime() > debutAlerte.getTime()) continue;

    const joursRestants = Math.round((echeance.getTime() - jour.getTime()) / 86400000);
    const ceres = e.numeroCERES ? ` · CERES ${e.numeroCERES}` : '';
    const date = e.dateDebut ? ` · ${e.dateDebut}` : '';
    alertes.push({
      examenId: e.id,
      libelle: `${e.formation ?? 'Session'}${ceres}${date}`,
      dateReceptionPv: reception,
      dateEcheance: echeance,
      joursRestants,
      niveau: joursRestants <= 0 ? 'echu' : 'a_venir',
      papierDetruit,
      fichiersSupprimes,
    });
  }
  return alertes.sort((a, b) => a.dateEcheance.getTime() - b.dateEcheance.getTime());
}

/** Couleurs de l'alerte selon le niveau */
export const COULEUR_DESTRUCTION: Record<NiveauDestruction, { bg: string; bord: string; txt: string }> = {
  a_venir: { bg: '#fef6e4', bord: '#f5d68a', txt: '#b7791f' },
  echu: { bg: '#fde8e8', bord: '#fecaca', txt: '#c53030' },
};
