import type { Echeance } from '../data/apcsSupabase';

/**
 * Calcule la période couverte par le CR d'une échéance donnée.
 *
 * Règles métier CFA :
 * - Échéance #1 : pas de CR (première facture)
 * - Échéance #N (N≥2) : période = lendemain(dateFacture[N-1]) → veille(dateFacture[N])
 *   - Pour la 1ère période réelle (avant Facture[2]), on part de dateDebutContrat
 *   - Pour la dernière échéance, on va jusqu'à dateFinContrat (ou dateRupture si rupture)
 *
 * @returns { debut, fin } au format JJ/MM/AAAA, ou null si non applicable.
 */
export function calculerPeriodeCr(
  echeances: Echeance[],
  echeanceCible: Echeance,
  dateDebutContrat: string,
  dateFinContrat: string,
  dateRupture?: string
): { debut: string; fin: string } | null {
  // Trie les échéances pédagogiques par date d'échéance
  const pedago = echeances
    .filter(e => e.type === 'pedago')
    .sort((a, b) => parseDate(a.dateEcheance) - parseDate(b.dateEcheance));

  const index = pedago.findIndex(e => e.id === echeanceCible.id);
  if (index < 0) return null;
  if (index === 0) return null; // Pas de CR sur la 1ère facture

  // Date de début = date EXACTE de l'échéancier OPCO précédent (ou dateDebutContrat pour CR1)
  // Règle métier : la date de début du CR = date d'échéancier OPCO précédente exacte,
  // sans décalage. Le champ "dateEcheance" en base correspond ici à l'échéancier APC officiel.
  let debut: string;
  if (index === 1) {
    // Premier CR : on part de la date de début de contrat
    debut = dateDebutContrat;
  } else {
    const echPrec = pedago[index - 1];
    debut = echPrec.dateEcheance || '';
  }

  // Date de fin = veille de l'échéance courante (échéancier)
  // Règle uniforme pour TOUTES les échéances, y compris la dernière (solde).
  // Le CR FINAL (pour l'OPCO) est généré séparément via calculerPeriodeCrFinal.
  const fin: string = veille(echeanceCible.dateEcheance || '');

  if (!debut || !fin) return null;
  return { debut, fin };
}

function parseDate(s?: string): number {
  if (!s) return 0;
  const p = s.split('/');
  if (p.length !== 3) return 0;
  return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
}

function toFr(d: Date): string {
  return d.toLocaleDateString('fr-FR');
}

export function lendemain(s: string): string {
  const p = s.split('/');
  if (p.length !== 3) return '';
  const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  d.setDate(d.getDate() + 1);
  return toFr(d);
}

export function veille(s: string): string {
  const p = s.split('/');
  if (p.length !== 3) return '';
  const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  d.setDate(d.getDate() - 1);
  return toFr(d);
}

/**
 * Calcule le nombre de jours entre 2 dates JJ/MM/AAAA (inclus).
 */
export function nbJoursEntre(debut: string, fin: string): number {
  const d1 = parseDate(debut), d2 = parseDate(fin);
  if (!d1 || !d2 || d2 < d1) return 0;
  return Math.floor((d2 - d1) / 86400000) + 1;
}

/**
 * Calcule la période du CR FINAL pour contrôle OPCO.
 * Couvre : dateDebutContrat → dateFinContrat (ou dateRupture si rupture).
 *
 * Ce CR final est généré séparément des CR par échéance.
 * Le nombre total de mois doit être égal à la somme des mois des CR par échéance.
 */
export function calculerPeriodeCrFinal(
  dateDebutContrat: string,
  dateFinContrat: string,
  dateRupture?: string
): { debut: string; fin: string } | null {
  if (!dateDebutContrat) return null;
  const fin = dateRupture || dateFinContrat;
  if (!fin) return null;
  return { debut: dateDebutContrat, fin };
}

/**
 * Calcule le nombre de mois entre 2 dates JJ/MM/AAAA.
 * Méthode : (jours / 30.4) arrondi.
 */
export function nbMoisEntre(debut: string, fin: string): number {
  const jours = nbJoursEntre(debut, fin);
  if (jours === 0) return 0;
  return Math.round(jours / 30.4);
}