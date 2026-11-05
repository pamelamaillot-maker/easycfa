// lib/premierEquipement.ts
// Montant du 1er équipement, selon la règle AKTO — partagé par la facturation
// (précomptabilité) et la convention de formation.
//
// RÈGLE (contrats débutant à compter du 01/09/2026) :
//   - Titres de niveau 5 et plus : 300 €
//   - Titres de niveaux 3 et 4 : 500 €
// Les contrats antérieurs restent à 500 €, montant historique.
// La DATE DE DÉBUT DE CONTRAT fait foi, pas la date de saisie du dossier.

export const NIVEAU_PAR_TP: Record<string, 3 | 4 | 5> = {
  SC: 4, GCF: 5, AD: 5, ARH: 5, EC: 3, CV: 4, CATL: 4, FPA: 5,
};

function lireDate(v?: string): Date | null {
  if (!v) return null;
  const t = String(v).trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const fr = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fr) return new Date(Number(fr[3]), Number(fr[2]) - 1, Number(fr[1]));
  return null;
}

export function montantEquipementParDefaut(formation?: string, dateDebutContrat?: string): number {
  const d = lireDate(dateDebutContrat || '');
  if (!d || d < new Date(2026, 8, 1)) return 500;
  const niveau = NIVEAU_PAR_TP[(formation || '').trim().toUpperCase()];
  return niveau && niveau >= 5 ? 300 : 500;
}
