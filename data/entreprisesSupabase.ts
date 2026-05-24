// data/entreprisesSupabase.ts
import { supabase } from '../lib/supabaseClient';

export interface Entreprise {
  id: string;
  raisonSociale: string;
  siret?: string;
  codeApe?: string;
  formeJuridique?: string;
  effectif?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  email?: string;
  telephone?: string;
  idcc?: string;
  opco?: string;
  regimeProtectionSociale?: string;
  secteur?: string;
  dirigeantNom?: string;
  dirigeantPrenom?: string;
  dirigeantFonction?: string;
  dirigeantEmail?: string;
  tuteurNom?: string;
  tuteurPrenom?: string;
  tuteurFonction?: string;
  tuteurEmail?: string;
  tuteurTelephone?: string;
  tuteurNiveauDiplome?: string;
  rhNom?: string;
  rhEmail?: string;
  facturationEmail?: string;
  iban?: string;
  bic?: string;
  opcoNumeroAdherent?: string;
  dateCreation?: string;
  dateModification?: string;
  financementsApprenants?: Record<string, FinancementApprenant>;
}

export interface ConventionStatut {
  statut: 'a_generer' | 'en_attente' | 'signee';
  dateGeneration?: string;
  dateEnvoiEmail?: string;
  emailDestinataire?: string;
  dateSignature?: string;
  fichierSigneUrl?: string;
  fichierSigneNom?: string;
}

export interface FinancementApprenant {
  coutPedagogiqueAnnee1?: number;
  coutPedagogiqueAnnee2?: number;
  coutTotalFraisPedagogiques?: number;
  fraisPremierEquipement?: number;
  nbRepasAnnee1?: number;
  fraisAnnexesRepasAnnee1?: number;
  nbRepasAnnee2?: number;
  fraisAnnexesRepasAnnee2?: number;
  totalFraisAnnexes?: number;
  codeRncpManuel?: string;
  dateMaj?: string;
  convention?: ConventionStatut;
}

const CHAMPS_VALIDES_ENTREPRISE = new Set<string>([
  'id', 'raisonSociale', 'siret', 'codeApe', 'formeJuridique', 'effectif',
  'adresse', 'codePostal', 'ville', 'email', 'telephone',
  'idcc', 'opco', 'regimeProtectionSociale', 'secteur',
  'dirigeantNom', 'dirigeantPrenom', 'dirigeantFonction', 'dirigeantEmail',
  'tuteurNom', 'tuteurPrenom', 'tuteurFonction', 'tuteurEmail', 'tuteurTelephone', 'tuteurNiveauDiplome',
  'rhNom', 'rhEmail', 'facturationEmail', 'iban', 'bic', 'opcoNumeroAdherent',
  'dateCreation', 'dateModification', 'financementsApprenants',
]);

export async function chargerEntreprises(): Promise<Entreprise[]> {
  try {
    const { data, error } = await supabase
      .from('entreprises')
      .select('*')
      .order('raisonSociale', { ascending: true });
    if (error) { console.error('Erreur Supabase chargerEntreprises:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerEntreprises:', e); return []; }
}

export async function chargerEntreprise(id: string): Promise<Entreprise | null> {
  try {
    const { data, error } = await supabase.from('entreprises').select('*').eq('id', id).maybeSingle();
    if (error) { console.error('Erreur Supabase chargerEntreprise:', error); return null; }
    return data || null;
  } catch (e) { console.error('Erreur réseau chargerEntreprise:', e); return null; }
}

export async function creerEntreprise(entreprise: Entreprise): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('entreprises').upsert([{ ...entreprise, dateModification: new Date().toISOString() }]);
    if (error) { console.error('Erreur Supabase creerEntreprise:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau creerEntreprise:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function modifierEntreprise(id: string, modifications: Partial<Entreprise>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('entreprises').update({ ...modifications, dateModification: new Date().toISOString() }).eq('id', id);
    if (error) { console.error('Erreur Supabase modifierEntreprise:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau modifierEntreprise:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

/**
 * Sauvegarde le financement d'un apprenant sur la fiche entreprise.
 * Fusionne avec les financements existants (un dict par apprenantId).
 */
export async function sauvegarderFinancementApprenant(
  entrepriseId: string,
  apprenantId: string,
  financement: FinancementApprenant
): Promise<{ success: boolean; error?: string }> {
  try {
    // Charge la fiche actuelle pour fusionner sans écraser les autres apprenants
    const { data: ent, error: errLoad } = await supabase
      .from('entreprises')
      .select('financementsApprenants')
      .eq('id', entrepriseId)
      .maybeSingle();
    if (errLoad) {
      console.error('[sauvegarderFinancementApprenant] load:', errLoad);
      return { success: false, error: errLoad.message };
    }
    const current = (ent?.financementsApprenants || {}) as Record<string, FinancementApprenant>;
    const updated = {
      ...current,
      [apprenantId]: {
        ...financement,
        dateMaj: new Date().toISOString(),
      },
    };
    const { error } = await supabase
      .from('entreprises')
      .update({ financementsApprenants: updated, dateModification: new Date().toISOString() })
      .eq('id', entrepriseId);
    if (error) {
      console.error('[sauvegarderFinancementApprenant] update:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[sauvegarderFinancementApprenant] réseau:', e);
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Marque la convention d'un apprenant comme "en attente de signature".
 * Appelée quand on génère + envoie la convention par mail à l'entreprise.
 */
export async function marquerConventionEnAttente(
  entrepriseId: string,
  apprenantId: string,
  emailDestinataire?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: ent, error: errLoad } = await supabase
      .from('entreprises')
      .select('financementsApprenants')
      .eq('id', entrepriseId)
      .maybeSingle();
    if (errLoad) return { success: false, error: errLoad.message };

    const current = (ent?.financementsApprenants || {}) as Record<string, FinancementApprenant>;
    const apprenantFin = current[apprenantId] || {};
    const updated = {
      ...current,
      [apprenantId]: {
        ...apprenantFin,
        convention: {
          ...(apprenantFin.convention || {}),
          statut: 'en_attente' as const,
          dateGeneration: apprenantFin.convention?.dateGeneration || new Date().toISOString(),
          dateEnvoiEmail: new Date().toISOString(),
          emailDestinataire: emailDestinataire || apprenantFin.convention?.emailDestinataire,
        },
      },
    };
    const { error } = await supabase
      .from('entreprises')
      .update({ financementsApprenants: updated, dateModification: new Date().toISOString() })
      .eq('id', entrepriseId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Supprime la convention d'un apprenant (mais conserve les autres données financières).
 */
export async function supprimerConventionApprenant(
  entrepriseId: string,
  apprenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: ent, error: errLoad } = await supabase
      .from('entreprises')
      .select('financementsApprenants')
      .eq('id', entrepriseId)
      .maybeSingle();
    if (errLoad) return { success: false, error: errLoad.message };

    const current = (ent?.financementsApprenants || {}) as Record<string, FinancementApprenant>;
    const apprenantFin = current[apprenantId];
    if (!apprenantFin) return { success: true };

    const { convention: _conv, ...sansConvention } = apprenantFin;
    const updated = {
      ...current,
      [apprenantId]: sansConvention,
    };
    const { error } = await supabase
      .from('entreprises')
      .update({ financementsApprenants: updated, dateModification: new Date().toISOString() })
      .eq('id', entrepriseId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

/**
 * Marque la convention comme signée après upload du PDF signé.
 */
export async function marquerConventionSignee(
  entrepriseId: string,
  apprenantId: string,
  fichierUrl: string,
  fichierNom: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: ent, error: errLoad } = await supabase
      .from('entreprises')
      .select('financementsApprenants')
      .eq('id', entrepriseId)
      .maybeSingle();
    if (errLoad) return { success: false, error: errLoad.message };

    const current = (ent?.financementsApprenants || {}) as Record<string, FinancementApprenant>;
    const apprenantFin = current[apprenantId] || {};
    const updated = {
      ...current,
      [apprenantId]: {
        ...apprenantFin,
        convention: {
          ...(apprenantFin.convention || {}),
          statut: 'signee' as const,
          dateSignature: new Date().toISOString(),
          fichierSigneUrl: fichierUrl,
          fichierSigneNom: fichierNom,
        },
      },
    };
    const { error } = await supabase
      .from('entreprises')
      .update({ financementsApprenants: updated, dateModification: new Date().toISOString() })
      .eq('id', entrepriseId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur réseau' };
  }
}

export async function supprimerEntreprise(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('entreprises').delete().eq('id', id);
    if (error) { console.error('Erreur Supabase supprimerEntreprise:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau supprimerEntreprise:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

function nettoyerEntreprisePourSupabase(raw: any): Entreprise {
  const out: any = {};
  for (const [key, value] of Object.entries(raw)) {
    if (CHAMPS_VALIDES_ENTREPRISE.has(key)) out[key] = value;
  }
  return out as Entreprise;
}

export async function migrerEntreprisesDepuisLocalStorage(
  entreprises: any[]
): Promise<{ success: number; erreurs: string[]; ignores: string[] }> {
  const erreurs: string[] = [];
  const ignores: string[] = [];
  let success = 0;
  for (const raw of entreprises) {
    const champsIgnores = Object.keys(raw).filter(k => !CHAMPS_VALIDES_ENTREPRISE.has(k));
    if (champsIgnores.length > 0) ignores.push(`${raw.raisonSociale || raw.id} : champs ignorés [${champsIgnores.join(', ')}]`);
    const entrepriseNettoyee = nettoyerEntreprisePourSupabase(raw);
    const res = await creerEntreprise(entrepriseNettoyee);
    if (res.success) success++;
    else erreurs.push(`${raw.raisonSociale || raw.id} : ${res.error}`);
  }
  return { success, erreurs, ignores };
}