// lib/echeancesMensuelles.ts
// Génération de l'échéancier des conventions HORS APPRENTISSAGE
// (Transition Pro, CPF, Région, France Travail…).
//
// POURQUOI UNE LOGIQUE À PART
// Un contrat d'apprentissage se facture au NPEC, par tranches calculées sur la
// durée du contrat : 40 % / 30 % / 20 %, puis le solde. Les montants sont connus
// dès la signature, quelles que soient les heures réellement suivies.
//
// Une convention hors apprentissage se facture au RÉEL : chaque mois, le CFA
// déclare les heures effectivement suivies et facture heures × taux horaire.
// Rien n'est acquis d'avance ; un mois sans formation ne se facture pas.
//
// Appliquer l'échéancier NPEC à une convention Transition Pro produirait des
// montants sans rapport avec ce qui sera payé, et fausserait les totaux facturés.
//
// LE PRÉVISIONNEL
// Les heures d'un mois ne sont connues qu'à sa clôture. L'échéancier part donc
// d'un prévisionnel lissé : total des heures théoriques réparti sur les mois de
// la convention. Ce montant est remplacé par le réel dès que le mois est clôturé,
// exactement comme un montant prévu OPCO l'est par le montant payé.
//
// LA DATE D'ÉCHÉANCE
// Transition Pro Réunion exige l'attestation de présence et de paiement
// « avant le 5 de chaque mois » pour le mois écoulé. L'échéance est donc fixée
// au 5 du mois suivant.

// ---------------------------------------------------------------------------
// OUTILS DE DATE — autonomes, pour ne pas dépendre de la page
// ---------------------------------------------------------------------------

/** 'JJ/MM/AAAA' ou 'AAAA-MM-JJ' -> Date. Null si illisible. */
function lireDate(valeur?: string | null): Date | null {
  if (!valeur) return null;
  const v = String(valeur).trim();

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

/** Date -> 'JJ/MM/AAAA', format utilisé partout dans l'échéancier. */
function ecrireDate(d: Date): string {
  const jj = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${jj}/${mm}/${d.getFullYear()}`;
}

function arrondi2(n: number): number {
  return Math.round(n * 100) / 100;
}

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ---------------------------------------------------------------------------
// GÉNÉRATION
// ---------------------------------------------------------------------------

/**
 * Produit une échéance par mois civil couvert par la convention.
 *
 * ⚠️ Le champ `type` reste 'pedago' : c'est bien une prestation pédagogique.
 * Le discriminant entre apprentissage et autre financement est le FINANCEUR
 * (`apc.opco`), pas le type d'échéance — voir categorieDe() dans lib/financeurs.ts.
 * Les ventilations qui ne concernent que l'apprentissage (France Compétences,
 * comptes 7061/7062/7063) doivent donc filtrer sur le financeur.
 */
export function genererEcheancesMensuelles(apc: any): any[] {
  const debut = lireDate(apc?.dateDebutFormation) || lireDate(apc?.dateDebutContrat);
  const fin = lireDate(apc?.dateFinContrat);
  if (!debut || !fin || fin < debut) return [];

  // Nombre de mois civils couverts, bornes incluses.
  const nbMois =
    (fin.getFullYear() - debut.getFullYear()) * 12 +
    (fin.getMonth() - debut.getMonth()) + 1;
  if (nbMois <= 0 || nbMois > 120) return [];   // garde-fou contre une date aberrante

  const heures = Number(apc?.heuresTheoriques) || 0;
  const taux = Number(apc?.tauxHoraire) || 0;
  // Le taux de la convention est HT ; ce qui est facturé et encaissé est TTC.
  // La formation professionnelle continue est soumise à TVA — 8,5 % à La Réunion.
  const tva = Number(apc?.tauxTva) || 0;

  // Prévisionnel lissé, en TTC : c'est le montant qui figurera sur la facture.
  // Zéro tant que la convention n'est pas renseignée : mieux vaut un échéancier
  // à zéro qu'un montant inventé.
  const totalPrevu = heures > 0 && taux > 0 ? heures * taux * (1 + tva / 100) : 0;
  const montantMois = totalPrevu > 0 ? arrondi2(totalPrevu / nbMois) : 0;

  const base = Date.now();
  const echeances: any[] = [];

  for (let i = 0; i < nbMois; i++) {
    const mois = new Date(debut.getFullYear(), debut.getMonth() + i, 1);

    // Attestation à transmettre avant le 5 du mois suivant.
    const echeance = new Date(mois.getFullYear(), mois.getMonth() + 1, 5);

    // Année de convention : 1 pendant les 365 premiers jours, 2 ensuite.
    const joursDepuisDebut = Math.round((mois.getTime() - debut.getTime()) / 86400000);
    const annee = joursDepuisDebut < 365 ? 1 : 2;

    echeances.push({
      id: `${base}m${i}`,
      label: `${MOIS[mois.getMonth()]} ${mois.getFullYear()}`,
      type: 'pedago',
      annee,
      pourcentage: 0,
      montantPrevu: montantMois,
      dateEcheance: ecrireDate(echeance),
      numeroFacture: '',
      dateFacture: '',
      dateDepotOpco: '',
      dateEcheance30j: '',
      datePaiement: '',
      montantPaye: 0,
      fichierFacture: '',
      modifiee: false,
    });
  }

  // Le lissage laisse un résidu de quelques centimes : on l'ajoute au dernier
  // mois, pour que la somme des échéances égale exactement le total prévu.
  if (totalPrevu > 0 && echeances.length > 0) {
    const somme = arrondi2(echeances.reduce((s, e) => s + e.montantPrevu, 0));
    const residu = arrondi2(totalPrevu - somme);
    if (Math.abs(residu) >= 0.01) {
      const dernier = echeances[echeances.length - 1];
      dernier.montantPrevu = arrondi2(dernier.montantPrevu + residu);
    }
  }

  return echeances;
}