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
}

const CHAMPS_VALIDES_ENTREPRISE = new Set<string>([
  'id', 'raisonSociale', 'siret', 'codeApe', 'formeJuridique', 'effectif',
  'adresse', 'codePostal', 'ville', 'email', 'telephone',
  'idcc', 'opco', 'regimeProtectionSociale', 'secteur',
  'dirigeantNom', 'dirigeantPrenom', 'dirigeantFonction', 'dirigeantEmail',
  'tuteurNom', 'tuteurPrenom', 'tuteurFonction', 'tuteurEmail', 'tuteurTelephone', 'tuteurNiveauDiplome',
  'rhNom', 'rhEmail', 'facturationEmail', 'iban', 'bic', 'opcoNumeroAdherent',
  'dateCreation', 'dateModification',
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