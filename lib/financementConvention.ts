import type { Npec } from '../data/npecSupabase';

export interface FinanceSplit {
  dureeFormation: string;
  dateFinPremiereAnnee: string;
  dateDebutDeuxiemeAnnee: string;
  totalJoursPremiereAnnee: number | string;
  totalJoursDeuxiemeAnnee: number | string;
  montantOpcoAnnee1: string;
  montantOpcoAnnee2: string;
  montantTotalOpco: string;
  montantNpecAnnuel: string;
  coutMensuel: string;
  nbHeuresFormation: number | string;
  coutHoraire: string;
  totalFraisPedagogiques: string;
  repasAnnee1: number | string;
  repasAnnee2: number | string;
  montantRepasAnnee1: string;
  montantRepasAnnee2: string;
}

function parseDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value).trim();
  const fr = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (fr) return new Date(Number(fr[3]), Number(fr[2]) - 1, Number(fr[1]));
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const d = new Date(text);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateFr(value: any): string {
  const d = parseDate(value);
  if (!d) return value ? String(value) : '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function formatAmount(value: number): string {
  const n = Number(value || 0);
  if (!n) return '';
  return n.toFixed(2).replace('.', ',') + ' €';
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function diffDaysInclusive(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

function buildDureeTexte(start: Date, end: Date): string {
  const days = diffDaysInclusive(start, end);
  const months = Math.round(days / 30);
  return months > 0 ? `${months} mois` : `${days} jours`;
}

/**
 * Calcule le split financier OPCO Année 1 / Année 2.
 * Port direct de conventionBuildFinanceSplit_ (AppScript)
 *
 * Règle métier CFA : la prise en charge OPCO démarre à la date LA PLUS PRÉCOCE
 * entre l'entrée en entreprise (dateDebutContrat) et l'entrée en formation
 * (dateDebutFormation). Idem fin = date la plus tardive.
 *
 * Signature étendue : accepte soit (debutForm, finForm, npec) — comportement
 * historique — soit (debutForm, finForm, npec, debutContrat, finContrat).
 */
export function buildFinanceSplit(
  dateDebutFormation: any,
  dateFinFormation: any,
  npec: Npec | null,
  dateDebutContrat?: any,
  dateFinContrat?: any
): FinanceSplit {
  const debutForm = parseDate(dateDebutFormation);
  const finForm = parseDate(dateFinFormation);
  const debutContrat = parseDate(dateDebutContrat);
  const finContrat = parseDate(dateFinContrat);

  // Date de référence = la plus précoce entre contrat et formation
  let start: Date | null = null;
  if (debutForm && debutContrat) {
    start = debutForm < debutContrat ? debutForm : debutContrat;
  } else {
    start = debutForm || debutContrat;
  }

  // Date de fin = la plus tardive entre contrat et formation
  let end: Date | null = null;
  if (finForm && finContrat) {
    end = finForm > finContrat ? finForm : finContrat;
  } else {
    end = finForm || finContrat;
  }

  const montantNpecAnnuel = npec?.montantNpecAnnuel || 0;
  const coutMensuel = npec?.coutMensuel || 0;
  const nbHeures = npec?.nbHeuresFormation || 0;
  const coutHoraire = npec?.coutHoraire || 0;
  const dureeMois = npec?.dureeMois || 0;
  const repasAnnee1 = npec?.repasAnnee1 || 0;
  const repasAnnee2 = npec?.repasAnnee2 || 0;
  const montantRepasAnnee1 = npec?.montantRepasAnnee1 || 0;
  const montantRepasAnnee2 = npec?.montantRepasAnnee2 || 0;

  if (!start || !end || end < start) {
    return {
      dureeFormation: dureeMois ? `${dureeMois} mois` : '',
      dateFinPremiereAnnee: '',
      dateDebutDeuxiemeAnnee: '',
      totalJoursPremiereAnnee: '',
      totalJoursDeuxiemeAnnee: '',
      montantOpcoAnnee1: '',
      montantOpcoAnnee2: '',
      montantTotalOpco: '',
      montantNpecAnnuel: montantNpecAnnuel ? formatAmount(montantNpecAnnuel) : '',
      coutMensuel: coutMensuel ? formatAmount(coutMensuel) : '',
      nbHeuresFormation: nbHeures || '',
      coutHoraire: coutHoraire ? formatAmount(coutHoraire) : '',
      totalFraisPedagogiques: montantNpecAnnuel ? formatAmount(montantNpecAnnuel) : '',
      repasAnnee1: repasAnnee1 || '',
      repasAnnee2: repasAnnee2 || '',
      montantRepasAnnee1: montantRepasAnnee1 ? formatAmount(montantRepasAnnee1) : '',
      montantRepasAnnee2: montantRepasAnnee2 ? formatAmount(montantRepasAnnee2) : '',
    };
  }

  let finPremiereAnnee = addDays(start, 364);
  if (finPremiereAnnee > end) finPremiereAnnee = end;

  const totalJoursPremiereAnnee = diffDaysInclusive(start, finPremiereAnnee);

  let debutDeuxiemeAnnee: Date | null = null;
  let totalJoursDeuxiemeAnnee = 0;

  if (finPremiereAnnee < end) {
    debutDeuxiemeAnnee = addDays(finPremiereAnnee, 1);
    totalJoursDeuxiemeAnnee = diffDaysInclusive(debutDeuxiemeAnnee, end);
  }

  const montantOpcoAnnee1 = montantNpecAnnuel ? (montantNpecAnnuel * totalJoursPremiereAnnee / 365) : 0;
  const montantOpcoAnnee2 = montantNpecAnnuel ? (montantNpecAnnuel * totalJoursDeuxiemeAnnee / 365) : 0;
  const montantTotalOpco = montantOpcoAnnee1 + montantOpcoAnnee2;

  return {
    dureeFormation: dureeMois ? `${dureeMois} mois` : buildDureeTexte(start, end),
    dateFinPremiereAnnee: formatDateFr(finPremiereAnnee),
    dateDebutDeuxiemeAnnee: debutDeuxiemeAnnee ? formatDateFr(debutDeuxiemeAnnee) : '',
    totalJoursPremiereAnnee,
    totalJoursDeuxiemeAnnee: totalJoursDeuxiemeAnnee || '',
    montantOpcoAnnee1: formatAmount(montantOpcoAnnee1),
    montantOpcoAnnee2: formatAmount(montantOpcoAnnee2),
    montantTotalOpco: formatAmount(montantTotalOpco),
    montantNpecAnnuel: montantNpecAnnuel ? formatAmount(montantNpecAnnuel) : '',
    coutMensuel: coutMensuel ? formatAmount(coutMensuel) : '',
    nbHeuresFormation: nbHeures || '',
    coutHoraire: coutHoraire ? formatAmount(coutHoraire) : '',
    totalFraisPedagogiques: formatAmount(montantTotalOpco),
    repasAnnee1: repasAnnee1 || '',
    repasAnnee2: repasAnnee2 || '',
    montantRepasAnnee1: montantRepasAnnee1 ? formatAmount(montantRepasAnnee1) : '',
    montantRepasAnnee2: montantRepasAnnee2 ? formatAmount(montantRepasAnnee2) : '',
  };
}

export function extractRncp(formation: string): string {
  const m = String(formation || '').match(/RNCP\s*([0-9]+)/i);
  return m ? `RNCP${m[1]}` : '';
}