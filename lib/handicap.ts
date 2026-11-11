// lib/handicap.ts
// Situation de handicap : types de reconnaissance ouvrant droit à des aménagements
// (formation et épreuves d'examen — art. L5212-13 du Code du travail et L114 CASF).

export const TYPES_RECONNAISSANCE: { value: string; label: string; boeth: boolean }[] = [
  { value: 'RQTH', label: 'RQTH — Reconnaissance de la qualité de travailleur handicapé', boeth: true },
  { value: 'BOETH_AAH', label: 'BOETH — Allocation aux adultes handicapés (AAH)', boeth: true },
  { value: 'BOETH_INVALIDITE', label: "BOETH — Pension d'invalidité", boeth: true },
  { value: 'BOETH_ATMP', label: 'BOETH — Rente accident du travail / maladie professionnelle (IPP ≥ 10 %)', boeth: true },
  { value: 'BOETH_CMI', label: "BOETH — Carte mobilité inclusion « invalidité »", boeth: true },
  { value: 'BOETH_AUTRE', label: 'BOETH — Autre catégorie (L5212-13)', boeth: true },
  { value: 'TROUBLE_TEMPORAIRE', label: 'Trouble de santé invalidant temporaire (L114 CASF)', boeth: false },
];

export function libelleReconnaissance(type?: string): string {
  if (!type) return 'RQTH';
  return TYPES_RECONNAISSANCE.find(t => t.value === type)?.label || type;
}

/** Libellé court pour les documents : « RQTH », « BOETH — AAH », « Trouble de santé temporaire »… */
export function libelleCourtReconnaissance(type?: string): string {
  if (!type || type === 'RQTH') return 'RQTH';
  if (type === 'TROUBLE_TEMPORAIRE') return 'Trouble de santé invalidant temporaire';
  const l = libelleReconnaissance(type);
  return l.replace(/^BOETH — /, 'BOETH — ').split(' (')[0];
}

/** SIFA : seule la RQTH est déclarée (champ « rqth_apprenant »). Ancien format sans type = RQTH. */
export function estRqthPourSifa(a: { rqth?: string; amenagementRqth?: { typeReconnaissance?: string } }): boolean {
  if (a.rqth !== 'OUI') return false;
  const t = a.amenagementRqth?.typeReconnaissance;
  return !t || t === 'RQTH';
}

// ────────────────────────────────────────────────────────────────
// Demande d'aménagement des épreuves (titre professionnel)
// ────────────────────────────────────────────────────────────────

/** Aménagements du formulaire officiel (cases de la page « Partie candidat »). */
export const AMENAGEMENTS_EPREUVES: { value: string; label: string; aide: string }[] = [
  { value: 'majoration', label: "Majoration du temps d'épreuves", aide: 'Taux (max. 30 %) et épreuves concernées : écrites, orales, pratiques, préparation' },
  { value: 'accessibilite', label: 'Accessibilité des locaux', aide: 'Ascenseur, salle au rez-de-chaussée…' },
  { value: 'installation', label: 'Installation particulière de la salle / matériel', aide: 'Éclairage, loupe, ordinateur, clavier braille…' },
  { value: 'agrandissement', label: 'Agrandissement des sujets', aide: 'Format A3/A4, police, taille de caractère…' },
  { value: 'braille', label: 'Sujet en braille', aide: 'Braille intégral ou abrégé' },
  { value: 'tierce', label: "Assistance d'une tierce personne", aide: 'Épreuves concernées, nature et durée de l’assistance' },
  { value: 'autres', label: 'Autres aménagements', aide: 'À préciser' },
];

/** Difficultés rencontrées pendant la formation (observations du centre). */
export const DIFFICULTES_FORMATION: { value: string; label: string }[] = [
  { value: 'manutention', label: 'Problème de manutention' },
  { value: 'charges', label: 'Port de charges lourdes' },
  { value: 'langue', label: 'Expression et compréhension orale, maîtrise de la langue française' },
  { value: 'images', label: 'Lecture d’images, cartes, figures' },
  { value: 'textes', label: 'Lecture de textes ou énoncés' },
  { value: 'comprehension', label: 'Compréhension du texte lu' },
  { value: 'autres', label: 'Autres' },
];

/**
 * Épreuves du titre complet, d'après les référentiels d'évaluation (RE) :
 * MSP = mise en situation professionnelle, ET = entretien technique,
 * QP = questionnement à partir de production(s), EF = entretien final.
 * ⚠️ À mettre à jour à chaque nouvelle version du RE.
 */
export const EPREUVES_TP: Record<string, { msp: string; mspDetail: string; et?: string; qp?: string; ef: string; total: string; source: string }> = {
  SC:   { msp: '4h00', mspDetail: 'Mise en situation professionnelle écrite (travaux sur poste informatique)', et: '0h20', ef: '0h20', total: '4h40', source: 'RE SC v09 (02/03/2023)' },
  GCF:  { msp: '4h15', mspDetail: 'Mise en situation professionnelle écrite (travaux sur poste informatique)', et: '0h30', ef: '0h20', total: '5h05', source: 'RE GCF v09 (26/07/2023)' },
  AD:   { msp: '5h00', mspDetail: 'Mise en situation professionnelle écrite', et: '0h10', qp: '0h20', ef: '0h15', total: '5h45', source: 'RE AD v04 (14/02/2024)' },
  ARH:  { msp: '3h30', mspDetail: 'Étude de cas écrite en une seule épreuve', et: '0h30', ef: '0h20', total: '4h20', source: 'RE ARH v03 (03/08/2020) — à vérifier avec le RE du titre 2025' },
  EC:   { msp: '2h05', mspDetail: 'Mise en situation professionnelle en magasin / espace de vente', qp: '0h30', ef: '0h15', total: '2h50', source: 'RE EC v08 (28/04/2023)' },
  CV:   { msp: '2h00', mspDetail: 'Mise en situation professionnelle (réception, opération promotionnelle, entretien de vente, suivi client)', et: '0h30', qp: '1h10', ef: '0h15', total: '3h55', source: 'RE CV v05 (26/07/2022)' },
  CATL: { msp: '0h45', mspDetail: 'Mise en situation professionnelle orale (accueil en français et en anglais)', et: '0h45', qp: '0h30', ef: '0h15', total: '2h15', source: 'RE CATL v02 (31/08/2023)' },
  FPA:  { msp: '0h55', mspDetail: 'Mise en situation professionnelle (animation d’une séquence)', et: '0h20', qp: '1h35', ef: '0h10', total: '3h00', source: 'RE FPA v07 (21/12/2022)' },
};

/** Délai réglementaire conseillé : demande transmise à la DEETS au moins 3 mois avant les épreuves. */
export const DELAI_DEMANDE_AMENAGEMENT_MOIS = 3;

// ────────────────────────────────────────────────────────────────
// Alertes : demande d'aménagement à transmettre à la DEETS
// ────────────────────────────────────────────────────────────────

function lireDateHandicap(v?: string): Date | null {
  const t = String(v || '').trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}

export type AlerteAmenagement = {
  apprenantId: string;
  nom: string;
  prenom: string;
  formation: string;
  dateExamen: Date;
  dateLimite: Date;
  joursRestants: number;   // négatif = délai dépassé
  niveau: 'depasse' | 'urgent' | 'a_prevoir';
};

/**
 * Apprenant(e)s en situation de handicap inscrit(e)s à une session d'examen à venir,
 * dont la demande d'aménagement n'a pas encore été transmise à la DEETS
 * (sauf si « aucun aménagement demandé » est coché).
 * Date limite = date d'examen − 3 mois. Alerte affichée à partir de J-60 avant cette limite.
 */
export function alertesAmenagement(apprenants: any[], examens: any[], joursAvant = 60): AlerteAmenagement[] {
  const aujourdhui = new Date(); aujourdhui.setHours(0, 0, 0, 0);
  const alertes: AlerteAmenagement[] = [];
  for (const a of apprenants) {
    if (a.rqth !== 'OUI' || a.archive) continue;
    const dem = a.amenagementRqth?.demandeAmenagement || {};
    if (dem.sansObjet || dem.dateEnvoiDeets) continue;
    const prochains = examens
      .filter(e => !e.archive)
      .map(e => ({ e, d: lireDateHandicap(e.dateDebut) }))
      .filter(x => x.d && x.d >= aujourdhui
        && (((x.e.candidats || []) as any[]).some(c => c.apprenantId === a.id) || (a.sessionId && x.e.sessionFormationId === a.sessionId)))
      .sort((x, y) => (x.d as Date).getTime() - (y.d as Date).getTime());
    if (!prochains.length) continue;
    const dateExamen = prochains[0].d as Date;
    const dateLimite = new Date(dateExamen); dateLimite.setMonth(dateLimite.getMonth() - DELAI_DEMANDE_AMENAGEMENT_MOIS);
    const joursRestants = Math.round((dateLimite.getTime() - aujourdhui.getTime()) / 86400000);
    if (joursRestants > joursAvant) continue;
    alertes.push({
      apprenantId: a.id, nom: a.nom, prenom: a.prenom, formation: a.formation,
      dateExamen, dateLimite, joursRestants,
      niveau: joursRestants < 0 ? 'depasse' : joursRestants <= 15 ? 'urgent' : 'a_prevoir',
    });
  }
  return alertes.sort((x, y) => x.joursRestants - y.joursRestants);
}
