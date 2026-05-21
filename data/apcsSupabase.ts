// data/apcsSupabase.ts
// Module API Supabase pour les tables 'apcs' + 'echeances'
// CFA PAM OI Formation

import { supabase } from '../lib/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface Echeance {
  id: string;
  apc_id?: string;
  label?: string;
  type?: string;
  annee?: number;
  pourcentage?: number;
  montantPrevu?: number;
  dateEcheance?: string;
  numeroFacture?: string;
  dateFacture?: string;
  dateDepotOpco?: string;
  dateEcheance30j?: string;
  datePaiement?: string;
  montantPaye?: number;
  anneePaiement?: string;
  fichierFacture?: string;
  modifiee?: boolean;
}

export interface Apc {
  id: string;
  apprenantId?: string;
  apprenantNom?: string;
  apprenantPrenom?: string;
  formation?: string;
  entreprise?: string;
  opco?: string;
  numeroDossierOpco?: string;
  numeroDeca?: string;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  dateDebutFormation?: string;
  annee?: string;
  npecBranche?: number;
  coutPedagoDemande?: number;
  coutPedagoAccorde?: number;
  premierEquipement?: number;
  fraisRepas?: number;
  nbJoursFormation?: number;
  resteACharge?: number;
  apcRecu?: string;
  dateReception?: string;
  statut?: string;
  echeances?: Echeance[];
  dateCreation?: string;
  dateModification?: string;
}

// Champs valides pour la table 'apcs' (sans echeances qui est sa propre table)
const CHAMPS_VALIDES_APC = new Set<string>([
  'id', 'apprenantId', 'apprenantNom', 'apprenantPrenom',
  'formation', 'entreprise', 'opco', 'numeroDossierOpco', 'numeroDeca',
  'dateDebutContrat', 'dateFinContrat', 'dateDebutFormation', 'annee',
  'npecBranche', 'coutPedagoDemande', 'coutPedagoAccorde', 'premierEquipement', 'fraisRepas',
  'nbJoursFormation', 'resteACharge', 'apcRecu', 'apcRecuUrl', 'apcRecuCheminStorage', 'dateReception', 'statut',
  'dateCreation', 'dateModification',
]);

const CHAMPS_VALIDES_ECHEANCE = new Set<string>([
  'id', 'apc_id', 'label', 'type', 'annee', 'pourcentage',
  'montantPrevu', 'dateEcheance', 'numeroFacture', 'dateFacture',
  'dateDepotOpco', 'dateEcheance30j', 'datePaiement', 'montantPaye', 'anneePaiement',
  'fichierFacture', 'modifiee',
  'dateCreation', 'dateModification',
  'pieces',
]);

// ============================================================================
// API APCs
// ============================================================================

/**
 * Charge tous les APCs avec leurs échéances imbriquées.
 */
export async function chargerApcs(): Promise<Apc[]> {
  try {
    const { data: apcs, error: errApc } = await supabase
      .from('apcs')
      .select('*')
      .order('apprenantNom', { ascending: true });
    if (errApc) {
      console.error('Erreur Supabase chargerApcs:', errApc);
      return [];
    }
    if (!apcs || apcs.length === 0) return [];

    // Charger toutes les échéances en une seule requête
    const { data: echeances, error: errEch } = await supabase
      .from('echeances')
      .select('*');
    if (errEch) {
      console.error('Erreur Supabase chargerEcheances:', errEch);
      // On renvoie les APCs sans échéances plutôt que rien
      return apcs.map(a => ({ ...a, echeances: [] }));
    }

    // Grouper les échéances par apc_id
    const echeancesParApc = new Map<string, Echeance[]>();
    (echeances || []).forEach(e => {
      const list = echeancesParApc.get(e.apc_id) || [];
      list.push(e);
      echeancesParApc.set(e.apc_id, list);
    });

    return apcs.map(a => ({ ...a, echeances: echeancesParApc.get(a.id) || [] }));
  } catch (e) {
    console.error('Erreur réseau chargerApcs:', e);
    return [];
  }
}

/**
 * Charge un APC avec ses échéances.
 */
export async function chargerApc(id: string): Promise<Apc | null> {
  try {
    const { data: apc, error } = await supabase
      .from('apcs').select('*').eq('id', id).maybeSingle();
    if (error || !apc) {
      if (error) console.error('Erreur Supabase chargerApc:', error);
      return null;
    }
    const { data: echeances } = await supabase
      .from('echeances').select('*').eq('apc_id', id);
    return { ...apc, echeances: echeances || [] };
  } catch (e) {
    console.error('Erreur réseau chargerApc:', e);
    return null;
  }
}

function nettoyerApcPourSupabase(raw: any): any {
  const out: any = {};
  for (const [key, value] of Object.entries(raw)) {
    if (CHAMPS_VALIDES_APC.has(key)) out[key] = value;
  }
  return out;
}

function nettoyerEcheancePourSupabase(raw: any, apcId: string): any {
  const out: any = { apc_id: apcId };
  for (const [key, value] of Object.entries(raw)) {
    if (CHAMPS_VALIDES_ECHEANCE.has(key)) out[key] = value;
  }
  return out;
}

/**
 * Crée ou met à jour un APC avec ses échéances.
 * Stratégie : upsert l'APC, puis upsert ses échéances.
 */
export async function creerApc(apc: Apc): Promise<{ success: boolean; error?: string }> {
  try {
    const apcClean = nettoyerApcPourSupabase({ ...apc, dateModification: new Date().toISOString() });
    const { error: errApc } = await supabase.from('apcs').upsert([apcClean]);
    if (errApc) {
      console.error('Erreur Supabase creerApc:', errApc);
      return { success: false, error: errApc.message };
    }
    // Insérer les échéances si présentes
    if (apc.echeances && apc.echeances.length > 0) {
      const echClean = apc.echeances.map(e => nettoyerEcheancePourSupabase(e, apc.id));
      const { error: errEch } = await supabase.from('echeances').upsert(echClean);
      if (errEch) {
        console.error('Erreur Supabase creerApc (echeances):', errEch);
        return { success: false, error: errEch.message };
      }
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau creerApc:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Met à jour partiellement un APC (sans toucher aux échéances).
 */
export async function modifierApc(id: string, modifications: Partial<Apc>): Promise<{ success: boolean; error?: string }> {
  try {
    const mods: any = { ...modifications };
    delete mods.echeances; // on ne touche pas aux échéances par cette fonction
    const { error } = await supabase
      .from('apcs')
      .update({ ...mods, dateModification: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('Erreur Supabase modifierApc:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau modifierApc:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Supprime un APC (les échéances sont supprimées en cascade grâce à ON DELETE CASCADE).
 */
export async function supprimerApc(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('apcs').delete().eq('id', id);
    if (error) {
      console.error('Erreur Supabase supprimerApc:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Erreur réseau supprimerApc:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

// ============================================================================
// API Échéances individuelles (utiles pour CRUD ciblé sur une échéance)
// ============================================================================

export async function creerEcheance(apcId: string, echeance: Echeance): Promise<{ success: boolean; error?: string }> {
  try {
    const clean = nettoyerEcheancePourSupabase(echeance, apcId);
    const { error } = await supabase.from('echeances').upsert([clean]);
    if (error) { console.error('Erreur Supabase creerEcheance:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function modifierEcheance(id: string, modifications: Partial<Echeance>): Promise<{ success: boolean; error?: string }> {
  try {
    const mods: any = { ...modifications, dateModification: new Date().toISOString() };
    delete mods.apc_id; // on ne change pas l'apc parent
    const { error } = await supabase.from('echeances').update(mods).eq('id', id);
    if (error) { console.error('Erreur Supabase modifierEcheance:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function supprimerEcheance(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('echeances').delete().eq('id', id);
    if (error) { console.error('Erreur Supabase supprimerEcheance:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message || 'Erreur réseau' }; }
}

// ============================================================================
// MIGRATION
// ============================================================================

export async function migrerApcsDepuisLocalStorage(
  apcs: any[]
): Promise<{ success: number; erreurs: string[]; ignores: string[]; totalEcheances: number }> {
  const erreurs: string[] = [];
  const ignores: string[] = [];
  let success = 0;
  let totalEcheances = 0;

  for (const raw of apcs) {
    const champsIgnores = Object.keys(raw).filter(k => k !== 'echeances' && !CHAMPS_VALIDES_APC.has(k));
    if (champsIgnores.length > 0) {
      ignores.push(`${raw.apprenantNom || raw.id} : champs ignorés [${champsIgnores.join(', ')}]`);
    }
    const res = await creerApc(raw as Apc);
    if (res.success) {
      success++;
      totalEcheances += (raw.echeances?.length || 0);
    } else {
      erreurs.push(`${raw.apprenantNom || raw.id} : ${res.error}`);
    }
  }
  return { success, erreurs, ignores, totalEcheances };
}