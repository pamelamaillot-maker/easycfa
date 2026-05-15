// ============================================================================
// TYPE APPRENANT ENRICHI POUR SIFA
// ============================================================================
// Ce type remplace l'ancien type Apprenant dans data/mockApprenants_reels.ts
// Les nouveaux champs sont TOUS OPTIONNELS — aucune fiche existante ne sera cassée
// ============================================================================

export type Apprenant = {
  // ===== Champs existants (inchangés) =====
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
  nir: string;
  situationAvant: string;
  dernierDiplome: string;
  formation: string;
  entreprise: string;
  dateDebutContrat: string;
  dateFinContrat: string;
  dateDebutFormation: string;
  dateFinFormation: string;
  numeroDossierOpco: string;
  numeroDeca: string;
  statut: string;
  dateRupture: string;
  maintienFormation: string;
  rqth: string;
  representantNom: string;
  representantPrenom: string;
  representantLien: string;
  representantTel: string;

  // ===== NOUVEAUX CHAMPS POUR SIFA (tous optionnels) =====
  sexe?: 'M' | 'F';                     // SIFA col 4 — obligatoire
  codePostalNaissance?: string;         // SIFA col 5 — CP du lieu de naissance (5 chiffres)
  ine?: string;                          // SIFA col 9 — Identifiant National Élève (11 caractères)
  dateRqth?: string;                     // SIFA col 12 — Date de reconnaissance RQTH (JJ/MM/AAAA)
  responsableEmail1?: string;            // SIFA col 13 — Email du 1er responsable légal (mineurs)
  responsableEmail2?: string;            // SIFA col 14 — Email du 2ème responsable légal (mineurs)
  dernierOrganismeUai?: string;          // SIFA col 15 — UAI de l'établissement précédent (7 chiffres + 1 lettre)
  derniereSituationCode?: string;        // SIFA col 16 — Code situation année précédente (4 chiffres)
  representantEmail?: string;            // Bonus : email du représentant légal (complète representantNom/Prenom/Tel)
};

// ============================================================================
// CODES SIFA — Nomenclatures officielles
// ============================================================================
// Source : https://www.education.gouv.fr (nomenclature SIFA en cours)
// ============================================================================

export const SEXE_SIFA = [
  { code: 'M', label: 'Masculin' },
  { code: 'F', label: 'Féminin' },
];

// Codes "dernière situation" (nomenclature SIFA simplifiée)
export const DERNIERE_SITUATION_SIFA = [
  { code: '4001', label: '1ère année de BTS' },
  { code: '4002', label: '2ème année de BTS' },
  { code: '4010', label: '1ère année de DUT' },
  { code: '4011', label: '2ème année de DUT' },
  { code: '3001', label: 'Terminale BAC général' },
  { code: '3002', label: 'Terminale BAC technologique' },
  { code: '3003', label: 'Terminale BAC professionnel' },
  { code: '2001', label: '1ère année CAP' },
  { code: '2002', label: '2ème année CAP' },
  { code: '5001', label: 'Licence (L1/L2/L3)' },
  { code: '5002', label: 'Licence professionnelle' },
  { code: '6001', label: 'Master / Master pro' },
  { code: '9999', label: 'Autre situation / Non scolarisé' },
];

// Codes "type CFA" (variable globale au CFA, à stocker dans Paramètres CFA)
export const TYPE_CFA_SIFA = [
  { code: '01', label: 'CFA public (Éducation nationale)' },
  { code: '02', label: 'CFA public (Agriculture)' },
  { code: '03', label: 'CFA consulaire (CCI/CMA)' },
  { code: '04', label: 'CFA privé sous contrat' },
  { code: '05', label: 'CFA privé hors contrat' },
  { code: '06', label: 'CFA d\'entreprise' },
  { code: '07', label: 'CFA d\'OPCA/OPCO' },
  { code: '08', label: 'CFA hospitalier' },
  { code: '09', label: 'CFA associatif' },
  { code: '10', label: 'Autre' },
];

// ============================================================================
// HELPERS pour la conversion vers SIFA
// ============================================================================

/**
 * Détermine le sexe de l'apprenant (fallback si non renseigné).
 * Méthode : déduction depuis le prénom (peu fiable) ou retour 'F' par défaut.
 */
export function deduireSexe(apprenant: Apprenant): 'M' | 'F' {
  if (apprenant.sexe) return apprenant.sexe;
  // Heuristique simple sur les terminaisons typiques
  const prenom = (apprenant.prenom ?? '').trim().toLowerCase();
  if (/[aey]$/.test(prenom) && !/^(?:joshua|elija|noah|jonas)$/i.test(prenom)) return 'F';
  return 'M';
}

/**
 * Convertit une date au format JJ/MM/AAAA en AAAA-MM-JJ (norme ISO-8601 pour SIFA).
 */
export function dateVersIso(dateFr: string): string {
  if (!dateFr) return '';
  const p = dateFr.split('/');
  if (p.length !== 3) return dateFr; // déjà au bon format ou invalide
  const [j, m, a] = p;
  return `${a}-${m.padStart(2, '0')}-${j.padStart(2, '0')}`;
}

/**
 * Calcule l'année scolaire à partir d'une date de début de formation.
 * Ex: 01/09/2024 → "2024-2025"
 */
export function calculerAnneeScolaire(dateDebut: string): string {
  if (!dateDebut) return '';
  const p = dateDebut.split('/');
  if (p.length !== 3) return '';
  const mois = parseInt(p[1]);
  const annee = parseInt(p[2]);
  // Si entrée avant août, c'est l'année scolaire précédente
  if (mois < 8) return `${annee - 1}-${annee}`;
  return `${annee}-${annee + 1}`;
}

/**
 * Indique si l'apprenant est mineur à la date de signature du contrat.
 */
export function estMineur(apprenant: Apprenant): boolean {
  if (!apprenant.dateNaissance || !apprenant.dateDebutContrat) return false;
  const dateN = apprenant.dateNaissance.split('/');
  const dateC = apprenant.dateDebutContrat.split('/');
  if (dateN.length !== 3 || dateC.length !== 3) return false;
  const n = new Date(parseInt(dateN[2]), parseInt(dateN[1]) - 1, parseInt(dateN[0]));
  const c = new Date(parseInt(dateC[2]), parseInt(dateC[1]) - 1, parseInt(dateC[0]));
  const age = c.getFullYear() - n.getFullYear() - (c < new Date(c.getFullYear(), n.getMonth(), n.getDate()) ? 1 : 0);
  return age < 18;
}

/**
 * Vérifie les champs obligatoires SIFA d'un apprenant.
 * Retourne un tableau de champs manquants pour l'affichage des alertes.
 */
export function verifierConformiteSifa(apprenant: Apprenant): string[] {
  const manquants: string[] = [];
  if (!apprenant.nom) manquants.push('nom');
  if (!apprenant.prenom) manquants.push('prenom');
  if (!apprenant.dateNaissance) manquants.push('date_de_naissance');
  if (!apprenant.sexe) manquants.push('sexe');
  if (!apprenant.email) manquants.push('email');
  if (!apprenant.adresse) manquants.push('adresse');
  if (!apprenant.codePostal) manquants.push('code_postal');
  if (!apprenant.dateDebutFormation) manquants.push('date_entree_formation');
  if (!apprenant.dateFinFormation) manquants.push('date_fin_formation');
  if (!apprenant.formation) manquants.push('formation_rncp');
  // Pour les mineurs, au moins un responsable légal email est requis
  if (estMineur(apprenant) && !apprenant.responsableEmail1 && !apprenant.responsableEmail2 && !apprenant.representantEmail) {
    manquants.push('responsable_apprenant_mail1');
  }
  return manquants;
}
