// lib/dates.ts
// Utilitaires de format de dates — CFA PAM OI Formation
// Stockage en base : ISO (AAAA-MM-JJ). Affichage utilisateur : JJ/MM/AAAA.

/** ISO ou FR → JJ/MM/AAAA (pour l'affichage et les PDF) */
export function formaterDateFR(valeur?: string | null): string {
  if (!valeur) return '';
  const v = String(valeur).trim();
  if (v.includes('/')) return v;
  const p = v.slice(0, 10).split('-');
  if (p.length !== 3) return v;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

/** FR ou ISO → AAAA-MM-JJ (pour l'enregistrement) */
export function isoDepuisFR(valeur?: string | null): string | null {
  if (!valeur) return null;
  const v = String(valeur).trim();
  if (v.includes('-')) return v.slice(0, 10);
  const p = v.split('/');
  if (p.length !== 3) return null;
  return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
}

/** ISO ou FR → objet Date (null si invalide) */
export function lireDate(valeur?: string | null): Date | null {
  const iso = isoDepuisFR(valeur);
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/** ISO ou FR → JJMMAAAA (format d'export SIFA) */
export function formaterDateSifa(valeur?: string | null): string {
  const iso = isoDepuisFR(valeur);
  if (!iso) return '';
  const p = iso.split('-');
  return `${p[2]}${p[1]}${p[0]}`;
}