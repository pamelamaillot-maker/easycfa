// data/qualiopiSupabase.ts
// Audits Qualiopi et leurs 33 indicateurs — données réelles, non figées.
//
// Un audit = une campagne de vérification (initial, surveillance, renouvellement).
// Les indicateurs sont rattachés à un audit : archiver un audit conserve ses
// constats, et le suivant repart d'une grille vierge.
//
// Référentiel National Qualité : 7 critères, 33 indicateurs depuis le décret
// n° 2026-728 du 1er août 2026, en vigueur au 1er novembre 2026.
// L'indicateur 33 ne s'applique qu'à la catégorie « Actions de formation
// par apprentissage ».

import { supabase } from '../lib/supabaseClient';

export type TypeAudit = 'initial' | 'surveillance' | 'renouvellement';
export type StatutAudit = 'en_cours' | 'valide' | 'archive';
export type StatutIndicateur = 'conforme' | 'a_verifier' | 'non_conforme' | 'non_applicable';

export interface AuditQualiopi {
  id: string;
  libelle: string;
  typeAudit?: TypeAudit;
  certificateur?: string;
  numeroCertificat?: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  datePeriodeDebut?: string | null;
  datePeriodeFin?: string | null;
  auditeur?: string;
  statut?: StatutAudit;
  nbConformes?: number;
  nbNonConformes?: number;
  observations?: string;
  dateCreation?: string;
  dateModification?: string;
}

export interface IndicateurQualiopi {
  id: string;
  auditId?: string;
  numero: number;
  critere: number;
  libelle?: string;
  statut?: StatutIndicateur;
  elementsPreuve?: string;
  commentaire?: string;
  dateVerification?: string | null;
  verifiePar?: string;
  dateCreation?: string;
  dateModification?: string;
}

export const LIBELLE_CRITERE: Record<number, string> = {
  1: 'Information au public',
  2: 'Objectif et adaptation des prestations',
  3: 'Accueil, suivi et évaluation du public',
  4: 'Adéquation des moyens',
  5: 'Qualification du personnel',
  6: "Investissement dans l'environnement professionnel",
  7: 'Appréciations et amélioration continue',
};

export const LIBELLE_STATUT_IND: Record<StatutIndicateur, { texte: string; bg: string; couleur: string }> = {
  conforme:       { texte: '✅ Conforme',      bg: '#e6f4f1', couleur: '#006B68' },
  a_verifier:     { texte: '⏳ À vérifier',    bg: '#fef6e4', couleur: '#C8A23A' },
  non_conforme:   { texte: '❌ Non conforme',  bg: '#fde8e8', couleur: '#e53e3e' },
  non_applicable: { texte: '⬜ Non applicable', bg: '#f0f0f0', couleur: '#888888' },
};

const CHAMPS_AUDIT = new Set<string>([
  'id', 'libelle', 'typeAudit', 'certificateur', 'numeroCertificat',
  'dateDebut', 'dateFin', 'datePeriodeDebut', 'datePeriodeFin',
  'auditeur', 'statut', 'nbConformes', 'nbNonConformes', 'observations',
  'dateCreation', 'dateModification',
]);

const CHAMPS_IND = new Set<string>([
  'id', 'auditId', 'numero', 'critere', 'libelle', 'statut',
  'elementsPreuve', 'commentaire', 'dateVerification', 'verifiePar',
  'dateCreation', 'dateModification',
]);

const DATES_AUDIT = ['dateDebut', 'dateFin', 'datePeriodeDebut', 'datePeriodeFin'];
const DATES_IND = ['dateVerification'];

function nettoyer(raw: any, valides: Set<string>, dates: string[]): any {
  const out: any = {};
  for (const [k, v] of Object.entries(raw)) if (valides.has(k)) out[k] = v;
  for (const d of dates) if (out[d] === '' || out[d] === undefined) out[d] = null;
  return out;
}

// ---------------------------------------------------------------------------
// AUDITS
// ---------------------------------------------------------------------------

export async function chargerAudits(): Promise<AuditQualiopi[]> {
  try {
    const { data, error } = await supabase
      .from('audits_qualiopi')
      .select('*')
      .order('datePeriodeDebut', { ascending: false });
    if (error) { console.error('Erreur Supabase chargerAudits:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerAudits:', e); return []; }
}

export async function creerAudit(audit: AuditQualiopi): Promise<{ success: boolean; error?: string }> {
  try {
    const maintenant = new Date().toISOString();
    const enr = nettoyer({
      statut: 'en_cours', nbConformes: 0, nbNonConformes: 0,
      ...audit,
      dateCreation: audit.dateCreation || maintenant,
      dateModification: maintenant,
    }, CHAMPS_AUDIT, DATES_AUDIT);
    const { error } = await supabase.from('audits_qualiopi').upsert([enr]);
    if (error) { console.error('Erreur Supabase creerAudit:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function modifierAudit(id: string, mods: Partial<AuditQualiopi>): Promise<{ success: boolean; error?: string }> {
  try {
    const m = nettoyer({ ...mods, dateModification: new Date().toISOString() }, CHAMPS_AUDIT, DATES_AUDIT);
    delete m.id;
    const { error } = await supabase.from('audits_qualiopi').update(m).eq('id', id);
    if (error) { console.error('Erreur Supabase modifierAudit:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function supprimerAudit(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('audits_qualiopi').delete().eq('id', id);
    if (error) { console.error('Erreur Supabase supprimerAudit:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message || 'Erreur réseau' }; }
}

// ---------------------------------------------------------------------------
// INDICATEURS
// ---------------------------------------------------------------------------

export async function chargerIndicateurs(auditId: string): Promise<IndicateurQualiopi[]> {
  try {
    const { data, error } = await supabase
      .from('indicateurs_qualiopi')
      .select('*')
      .eq('auditId', auditId)
      .order('numero', { ascending: true });
    if (error) { console.error('Erreur Supabase chargerIndicateurs:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerIndicateurs:', e); return []; }
}

export async function modifierIndicateur(id: string, mods: Partial<IndicateurQualiopi>): Promise<{ success: boolean; error?: string }> {
  try {
    const m = nettoyer({ ...mods, dateModification: new Date().toISOString() }, CHAMPS_IND, DATES_IND);
    delete m.id;
    delete m.auditId;
    delete m.numero;
    const { error } = await supabase.from('indicateurs_qualiopi').update(m).eq('id', id);
    if (error) { console.error('Erreur Supabase modifierIndicateur:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message || 'Erreur réseau' }; }
}

/**
 * Ouvre un nouvel audit en recopiant les 33 libellés d'un audit existant,
 * tous remis à « à vérifier ». Les constats de l'audit source sont conservés :
 * archiver n'efface rien.
 */
export async function ouvrirNouvelAudit(
  audit: AuditQualiopi,
  auditSourceId: string,
): Promise<{ success: boolean; error?: string }> {
  const r = await creerAudit(audit);
  if (!r.success) return r;

  const source = await chargerIndicateurs(auditSourceId);
  if (source.length === 0) return { success: false, error: 'Aucun indicateur à recopier depuis l\'audit source.' };

  const suffixe = audit.id.replace(/[^A-Za-z0-9]/g, '').slice(-8);
  const lignes = source.map(i => ({
    id: `IND_${suffixe}_${String(i.numero).padStart(2, '0')}`,
    auditId: audit.id,
    numero: i.numero,
    critere: i.critere,
    libelle: i.libelle,
    statut: 'a_verifier',
  }));

  try {
    const { error } = await supabase.from('indicateurs_qualiopi').upsert(lignes);
    if (error) { console.error('Erreur Supabase ouvrirNouvelAudit:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message || 'Erreur réseau' }; }
}

/** Recalcule et enregistre les compteurs d'un audit. */
export async function rafraichirCompteurs(auditId: string): Promise<void> {
  const inds = await chargerIndicateurs(auditId);
  const conformes = inds.filter(i => i.statut === 'conforme').length;
  const nonConformes = inds.filter(i => i.statut === 'non_conforme').length;
  await modifierAudit(auditId, { nbConformes: conformes, nbNonConformes: nonConformes });
}

/** Indicateurs pris en compte dans le taux : les non applicables sont exclus. */
export function tauxConformite(inds: IndicateurQualiopi[]): { taux: number | null; base: number } {
  const base = inds.filter(i => i.statut !== 'non_applicable').length;
  if (base === 0) return { taux: null, base: 0 };
  const conformes = inds.filter(i => i.statut === 'conforme').length;
  return { taux: Math.round((conformes / base) * 100), base };
}