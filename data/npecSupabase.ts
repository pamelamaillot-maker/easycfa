import { supabase } from '../lib/supabase';

export interface Npec {
  id?: string;
  codeInterne?: string;   // Code interne PAM OI : SC, GCF, AD...
  codeDiplome?: string;   // Code diplôme officiel : 46T32403...
  codeRncp: string;
  intitule: string;
  montantNpecAnnuel: number;
  coutMensuel: number;
  nbHeuresFormation: number;
  dureeMois: number;
  dureeJours: number;
  totalJoursAnnee1Theorique: number;
  totalJoursAnnee2Theorique: number;
  repasTotal: number;
  repasAnnee1: number;
  repasAnnee2: number;
  montantRepasAnnee1: number;
  montantRepasAnnee2: number;
  fpe: number;
  coutHoraire: number;
  actif?: boolean;
}

const CHAMPS_VALIDES_NPEC = [
  'code_interne', 'code_diplome', 'code_rncp', 'intitule',
  'montant_npec_annuel', 'cout_mensuel',
  'nb_heures_formation', 'duree_mois', 'duree_jours',
  'total_jours_annee_1_theorique', 'total_jours_annee_2_theorique',
  'repas_total', 'repas_annee_1', 'repas_annee_2',
  'montant_repas_annee_1', 'montant_repas_annee_2',
  'fpe', 'cout_horaire', 'actif'
];

function dbToNpec(row: any): Npec {
  return {
    id: row.id,
    codeInterne: row.code_interne || '',
    codeDiplome: row.code_diplome || '',
    codeRncp: row.code_rncp || '',
    intitule: row.intitule || '',
    montantNpecAnnuel: Number(row.montant_npec_annuel) || 0,
    coutMensuel: Number(row.cout_mensuel) || 0,
    nbHeuresFormation: Number(row.nb_heures_formation) || 0,
    dureeMois: Number(row.duree_mois) || 0,
    dureeJours: Number(row.duree_jours) || 0,
    totalJoursAnnee1Theorique: Number(row.total_jours_annee_1_theorique) || 0,
    totalJoursAnnee2Theorique: Number(row.total_jours_annee_2_theorique) || 0,
    repasTotal: Number(row.repas_total) || 0,
    repasAnnee1: Number(row.repas_annee_1) || 0,
    repasAnnee2: Number(row.repas_annee_2) || 0,
    montantRepasAnnee1: Number(row.montant_repas_annee_1) || 0,
    montantRepasAnnee2: Number(row.montant_repas_annee_2) || 0,
    fpe: Number(row.fpe) || 0,
    coutHoraire: Number(row.cout_horaire) || 0,
    actif: row.actif !== false,
  };
}

function npecToDb(n: Partial<Npec>): any {
  const m: any = {};
  if (n.codeInterne !== undefined) m.code_interne = n.codeInterne;
  if (n.codeDiplome !== undefined) m.code_diplome = n.codeDiplome;
  if (n.codeRncp !== undefined) m.code_rncp = n.codeRncp;
  if (n.intitule !== undefined) m.intitule = n.intitule;
  if (n.montantNpecAnnuel !== undefined) m.montant_npec_annuel = n.montantNpecAnnuel;
  if (n.coutMensuel !== undefined) m.cout_mensuel = n.coutMensuel;
  if (n.nbHeuresFormation !== undefined) m.nb_heures_formation = n.nbHeuresFormation;
  if (n.dureeMois !== undefined) m.duree_mois = n.dureeMois;
  if (n.dureeJours !== undefined) m.duree_jours = n.dureeJours;
  if (n.totalJoursAnnee1Theorique !== undefined) m.total_jours_annee_1_theorique = n.totalJoursAnnee1Theorique;
  if (n.totalJoursAnnee2Theorique !== undefined) m.total_jours_annee_2_theorique = n.totalJoursAnnee2Theorique;
  if (n.repasTotal !== undefined) m.repas_total = n.repasTotal;
  if (n.repasAnnee1 !== undefined) m.repas_annee_1 = n.repasAnnee1;
  if (n.repasAnnee2 !== undefined) m.repas_annee_2 = n.repasAnnee2;
  if (n.montantRepasAnnee1 !== undefined) m.montant_repas_annee_1 = n.montantRepasAnnee1;
  if (n.montantRepasAnnee2 !== undefined) m.montant_repas_annee_2 = n.montantRepasAnnee2;
  if (n.fpe !== undefined) m.fpe = n.fpe;
  if (n.coutHoraire !== undefined) m.cout_horaire = n.coutHoraire;
  if (n.actif !== undefined) m.actif = n.actif;
  return m;
}

export async function chargerNpec(): Promise<Npec[]> {
  const { data, error } = await supabase
    .from('npec')
    .select('*')
    .eq('actif', true)
    .order('code_rncp', { ascending: true });
  if (error) { console.error('[chargerNpec]', error); return []; }
  return (data || []).map(dbToNpec);
}

export async function chercherNpecParRncp(codeRncp: string): Promise<Npec | null> {
  if (!codeRncp) return null;
  const normalized = codeRncp.toUpperCase().replace(/\s+/g, '');
  const { data, error } = await supabase
    .from('npec')
    .select('*')
    .ilike('code_rncp', `%${normalized.replace('RNCP', '')}%`)
    .limit(1);
  if (error) { console.error('[chercherNpecParRncp]', error); return null; }
  return data && data.length > 0 ? dbToNpec(data[0]) : null;
}

export async function creerNpec(n: Partial<Npec>): Promise<Npec | null> {
  const { data, error } = await supabase
    .from('npec')
    .insert([npecToDb(n)])
    .select()
    .single();
  if (error) { console.error('[creerNpec]', error); return null; }
  return dbToNpec(data);
}

export async function modifierNpec(id: string, n: Partial<Npec>): Promise<boolean> {
  const { error } = await supabase
    .from('npec')
    .update(npecToDb(n))
    .eq('id', id);
  if (error) { console.error('[modifierNpec]', error); return false; }
  return true;
}

export async function supprimerNpec(id: string): Promise<boolean> {
  const { error } = await supabase.from('npec').delete().eq('id', id);
  if (error) { console.error('[supprimerNpec]', error); return false; }
  return true;
}