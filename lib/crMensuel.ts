// lib/crMensuel.ts
// Certificat de réalisation MENSUEL, pour les conventions hors apprentissage.
//
// POURQUOI UN CALCUL À PART
// En apprentissage, le certificat de réalisation couvre une période
// contractuelle et s'exprime en MOIS RÉALISÉS. La première facture, émise avant
// toute réalisation, n'en porte pas.
//
// En projet de transition professionnelle, le certificat est MENSUEL et
// obligatoire dès le premier mois. Il couvre le mois civil écoulé et s'exprime
// en HEURES RÉALISÉES.
// Réf. modèle officiel du ministère du Travail, note 1 : « Lorsque l'action est
// mise en œuvre dans le cadre d'un projet de transition professionnelle, le
// certificat de réalisation doit être transmis mensuellement. »
//
// D'OÙ VIENNENT LES HEURES
// Du montant de l'échéance divisé par le taux horaire de la convention :
// c'est exactement ce qui est facturé, donc ce qui doit être certifié.
// Le montant payé prime sur le montant prévu dès qu'il est renseigné — un CR
// établi après paiement doit refléter ce qui a réellement été réglé.
//
// LA PÉRIODE
// Le mois civil de l'échéance, borné par les dates de la convention : un mois
// de démarrage commence à la date d'entrée en formation, un mois de fin s'arrête
// à la date de fin de convention.
// L'échéance étant datée du 5 du mois suivant (délai de transmission exigé par
// Transition Pro Réunion), le mois concerné est celui qui précède.

// ---------------------------------------------------------------------------
// DATES
// ---------------------------------------------------------------------------

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

function ecrireDate(d: Date): string {
  const jj = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${jj}/${mm}/${d.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// LIBELLÉS DES TITRES PROFESSIONNELS
// ---------------------------------------------------------------------------

const LIBELLE_FORMATION: Record<string, string> = {
  SC: 'TP Secrétaire Comptable',
  GCF: 'TP Gestionnaire Comptable et Fiscal',
  ARH: 'TP Assistant(e) en Ressources Humaines',
  AD: 'TP Assistant(e) de Direction',
  CATL: "TP Chargé(e) d'Accueil Touristique et de Loisirs",
  EC: 'TP Employé(e) Commercial(e)',
  CV: 'TP Conseiller(ère) de Vente',
  FPA: "TP Formateur(trice) Professionnel(le) d'Adultes",
};

// ---------------------------------------------------------------------------
// CALCUL
// ---------------------------------------------------------------------------

export interface DonneesCrMensuel {
  donnees: Record<string, string>;
  periode: { debut: string; fin: string };
  heures: number;
}

/**
 * Données du certificat de réalisation mensuel d'une échéance.
 * Renvoie null si la période n'est pas calculable.
 *
 * Même forme de retour que donneesCrPourEcheance(), pour rester interchangeable
 * dans la page Facturation.
 */
export function donneesCrMensuel(
  apc: any,
  echeance: any,
  apprenant?: any,
): DonneesCrMensuel | null {
  const dateEcheance = lireDate(echeance?.dateEcheance);
  if (!dateEcheance) return null;

  // L'échéance est datée du 5 du mois SUIVANT le mois couvert.
  const moisCouvert = new Date(dateEcheance.getFullYear(), dateEcheance.getMonth() - 1, 1);

  const premierDuMois = new Date(moisCouvert.getFullYear(), moisCouvert.getMonth(), 1);
  const dernierDuMois = new Date(moisCouvert.getFullYear(), moisCouvert.getMonth() + 1, 0);

  // Bornage par les dates de la convention.
  const debutConvention = lireDate(apc?.dateDebutFormation) || lireDate(apc?.dateDebutContrat);
  const finConvention = lireDate(apc?.dateFinContrat);

  const debut = debutConvention && debutConvention > premierDuMois ? debutConvention : premierDuMois;
  const fin = finConvention && finConvention < dernierDuMois ? finConvention : dernierDuMois;
  if (fin < debut) return null;

  // Heures certifiées = ce qui est facturé, donc montant / taux horaire.
  const taux = Number(apc?.tauxHoraire) || 0;
  const tva = Number(apc?.tauxTva) || 0;
  const paye = Number(echeance?.montantPaye) || 0;
  const prevu = Number(echeance?.montantPrevu) || 0;
  // Les montants de l'échéance sont TTC, le taux de la convention est HT.
  // Il faut repasser en HT avant de diviser : 168,68 / 22,21 donnerait 7,59 h
  // au lieu des 7 h réellement suivies.
  const montantTtc = paye > 0 ? paye : prevu;
  const montantHt = tva > 0 ? montantTtc / (1 + tva / 100) : montantTtc;
  const heures = taux > 0 ? Math.round((montantHt / taux) * 100) / 100 : 0;

  const civilite = apprenant?.sexe === 'F' ? 'Mme' : 'M.';
  const formation = LIBELLE_FORMATION[apc?.formation] || apc?.formation || '';

  const donnees: Record<string, string> = {
    CFA_RAISON_SOCIALE: 'PAM OI Formation',
    CFA_DIRECTRICE: 'MAILLOT Gaëlle',
    APPRENANT_CIVILITE: civilite,
    APPRENANT_NOM_COMPLET: `${apc?.apprenantPrenom ?? ''} ${apc?.apprenantNom ?? ''}`.trim(),
    ENTREPRISE_RAISON_SOCIALE: apc?.entreprise || '',
    FORMATION_LIBELLE: formation,
    CR_DATE_DEBUT: ecrireDate(debut),
    CR_DATE_FIN: ecrireDate(fin),
    // Transition Pro attend des HEURES, pas des mois.
    CR_DUREE_HEURES: `${heures.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} heures`,
    // Nature de l'action : « action de formation », et non « par apprentissage ».
    CR_NATURE: 'action de formation',
    CR_LIEU_SIGNATURE: 'Saint-Leu',
    CR_SIGNATAIRE_QUALITE: 'Directrice et référente handicap',
    DATE_SIGNATURE_DOC: new Date().toLocaleDateString('fr-FR'),
  };

  return {
    donnees,
    periode: { debut: ecrireDate(debut), fin: ecrireDate(fin) },
    heures,
  };
}