// data/sessionsExamenSupabase.ts
// Module API Supabase pour les tables 'sessions_examen' et 'candidats_examen'.
//
// ⚠️ NE PAS CONFONDRE avec data/examensSupabase.ts, qui gère la table 'examens'
// (workflow CERES, DTE, jurés, PV, émargements — résultats par situation
// d'évaluation MSP/ET/QAP/EF). Le présent module gère le grain CCP :
// réussite partielle, livret de certification, délai de représentation.
// Les deux coexistent tant que la fusion n'a pas été décidée.
//
// Réf. arrêté du 22 décembre 2015 modifié : session titre / session CCP / session CCS,
// entretien final en fin de dernière session d'un parcours par capitalisation,
// délai d'un an pour se représenter après réussite partielle ou échec.

import { supabase } from '../lib/supabaseClient';
import type { EtatCcp } from '../lib/referentielsTP';
import { dateLimiteRepresentation, ccpsDuTP } from '../lib/referentielsTP';

export type TypeSession = 'titre' | 'ccp' | 'ccs';
export type StatutSessionExamen = 'planifiee' | 'declaree' | 'realisee' | 'delibree' | 'archivee';
export type TypeCandidature = 'formation' | 'vae' | 'capitalisation';
export type DecisionJury = 'titre_obtenu' | 'titre_partiel' | 'ajourne' | 'absent';
export type OrdrePassageMode = 'tirage_au_sort' | 'choix_candidats' | 'ordre_alphabetique';

export interface MembreJury {
  nom: string;
  prenom: string;
  qualite: string;
  telephone?: string;
  email?: string;
}

export interface SessionExamen {
  id: string;
  formationSigle: string;
  typeSession?: TypeSession;
  numeroCeres?: string;
  dateExamen?: string | null;        // ISO
  heureConvocation?: string;
  lieu?: string;
  ccpVises?: string[];               // ['CCP2','CCP3']
  avecEntretienFinal?: boolean;
  ordrePassageMode?: OrdrePassageMode;
  jury?: MembreJury[];
  responsableSession?: string;
  agrementId?: string;
  statut?: StatutSessionExamen;
  dateDeliberation?: string | null;
  dateDeclarationDeets?: string | null;
  notes?: string;
  dateCreation?: string;
  dateModification?: string;
}

export interface CandidatExamen {
  id: string;
  sessionExamenId: string;
  apprenantId: string;
  typeCandidature?: TypeCandidature;
  ccpsPresentes?: string[];
  resultats?: Record<string, EtatCcp>;
  entretienFinalPasse?: boolean;
  decisionJury?: DecisionJury;
  dateDeliberation?: string | null;
  dateLimiteRepresentation?: string | null;
  numeroLivretCertification?: string;
  ordrePassage?: number;
  heurePassage?: string;
  amenagementHandicap?: Record<string, any>;
  documentsRemis?: string[];
  observations?: string;
  dateCreation?: string;
  dateModification?: string;
}

const CHAMPS_VALIDES_SESSION = new Set<string>([
  'id', 'formationSigle', 'typeSession', 'numeroCeres',
  'dateExamen', 'heureConvocation', 'lieu', 'ccpVises',
  'avecEntretienFinal', 'ordrePassageMode', 'jury',
  'responsableSession', 'agrementId', 'statut',
  'dateDeliberation', 'dateDeclarationDeets', 'notes',
  'dateCreation', 'dateModification',
]);

const CHAMPS_VALIDES_CANDIDAT = new Set<string>([
  'id', 'sessionExamenId', 'apprenantId', 'typeCandidature',
  'ccpsPresentes', 'resultats', 'entretienFinalPasse',
  'decisionJury', 'dateDeliberation', 'dateLimiteRepresentation',
  'numeroLivretCertification', 'ordrePassage', 'heurePassage',
  'amenagementHandicap', 'documentsRemis', 'observations',
  'dateCreation', 'dateModification',
]);

// Colonnes 'date' : une chaîne vide fait échouer Postgres.
const CHAMPS_DATE_SESSION = ['dateExamen', 'dateDeliberation', 'dateDeclarationDeets'];
const CHAMPS_DATE_CANDIDAT = ['dateDeliberation', 'dateLimiteRepresentation'];

function nettoyer(raw: any, champsValides: Set<string>, champsDate: string[]): any {
  const out: any = {};
  for (const [k, v] of Object.entries(raw)) {
    if (champsValides.has(k)) out[k] = v;
  }
  for (const c of champsDate) {
    if (out[c] === '' || out[c] === undefined) out[c] = null;
  }
  return out;
}

export function genererIdSessionExamen(sigle: string, type: TypeSession, dateIso: string): string {
  const d = (dateIso || '').replace(/-/g, '');
  return `EXAM_${sigle}_${type.toUpperCase()}_${d}_${Date.now().toString().slice(-5)}`;
}

export function genererIdCandidatExamen(sessionExamenId: string, apprenantId: string): string {
  return `CAND_${sessionExamenId}_${apprenantId}`;
}

// ---------------------------------------------------------------------------
// SESSIONS D'EXAMEN
// ---------------------------------------------------------------------------

export async function chargerSessionsExamen(): Promise<SessionExamen[]> {
  try {
    const { data, error } = await supabase
      .from('sessions_examen')
      .select('*')
      .order('dateExamen', { ascending: false });
    if (error) { console.error('Erreur Supabase chargerSessionsExamen:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerSessionsExamen:', e); return []; }
}

export async function chargerSessionExamen(id: string): Promise<SessionExamen | null> {
  try {
    const { data, error } = await supabase
      .from('sessions_examen')
      .select('*')
      .eq('id', id)
      .limit(1);
    if (error) { console.error('Erreur Supabase chargerSessionExamen:', error); return null; }
    return data && data.length > 0 ? data[0] : null;
  } catch (e) { console.error('Erreur réseau chargerSessionExamen:', e); return null; }
}

export async function creerSessionExamen(session: SessionExamen): Promise<{ success: boolean; error?: string }> {
  try {
    const maintenant = new Date().toISOString();
    const enr = nettoyer({
      typeSession: 'titre',
      statut: 'planifiee',
      ccpVises: [],
      jury: [],
      avecEntretienFinal: false,
      ...session,
      dateCreation: session.dateCreation || maintenant,
      dateModification: maintenant,
    }, CHAMPS_VALIDES_SESSION, CHAMPS_DATE_SESSION);
    const { error } = await supabase.from('sessions_examen').upsert([enr]);
    if (error) { console.error('Erreur Supabase creerSessionExamen:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau creerSessionExamen:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function modifierSessionExamen(
  id: string, modifications: Partial<SessionExamen>
): Promise<{ success: boolean; error?: string }> {
  try {
    const mods = nettoyer({ ...modifications, dateModification: new Date().toISOString() },
      CHAMPS_VALIDES_SESSION, CHAMPS_DATE_SESSION);
    delete mods.id;
    const { error } = await supabase.from('sessions_examen').update(mods).eq('id', id);
    if (error) { console.error('Erreur Supabase modifierSessionExamen:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau modifierSessionExamen:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function supprimerSessionExamen(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('sessions_examen').delete().eq('id', id);
    if (error) { console.error('Erreur Supabase supprimerSessionExamen:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau supprimerSessionExamen:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

// ---------------------------------------------------------------------------
// CANDIDATS
// ---------------------------------------------------------------------------

export async function chargerCandidatsSession(sessionExamenId: string): Promise<CandidatExamen[]> {
  try {
    const { data, error } = await supabase
      .from('candidats_examen')
      .select('*')
      .eq('sessionExamenId', sessionExamenId)
      .order('ordrePassage', { ascending: true });
    if (error) { console.error('Erreur Supabase chargerCandidatsSession:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerCandidatsSession:', e); return []; }
}

/**
 * Toutes les participations d'un apprenant, toutes sessions confondues.
 * C'est la base du livret de certification.
 */
export async function chargerParcoursApprenant(apprenantId: string): Promise<CandidatExamen[]> {
  try {
    const { data, error } = await supabase
      .from('candidats_examen')
      .select('*')
      .eq('apprenantId', apprenantId)
      .order('dateDeliberation', { ascending: true });
    if (error) { console.error('Erreur Supabase chargerParcoursApprenant:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerParcoursApprenant:', e); return []; }
}

export async function inscrireCandidat(candidat: CandidatExamen): Promise<{ success: boolean; error?: string }> {
  try {
    const maintenant = new Date().toISOString();
    const enr = nettoyer({
      typeCandidature: 'formation',
      ccpsPresentes: [],
      resultats: {},
      entretienFinalPasse: false,
      documentsRemis: [],
      ...candidat,
      dateCreation: candidat.dateCreation || maintenant,
      dateModification: maintenant,
    }, CHAMPS_VALIDES_CANDIDAT, CHAMPS_DATE_CANDIDAT);
    const { error } = await supabase.from('candidats_examen').upsert([enr]);
    if (error) { console.error('Erreur Supabase inscrireCandidat:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau inscrireCandidat:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function modifierCandidat(
  id: string, modifications: Partial<CandidatExamen>
): Promise<{ success: boolean; error?: string }> {
  try {
    const mods = nettoyer({ ...modifications, dateModification: new Date().toISOString() },
      CHAMPS_VALIDES_CANDIDAT, CHAMPS_DATE_CANDIDAT);
    delete mods.id;
    delete mods.sessionExamenId;
    delete mods.apprenantId;
    const { error } = await supabase.from('candidats_examen').update(mods).eq('id', id);
    if (error) { console.error('Erreur Supabase modifierCandidat:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau modifierCandidat:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

export async function retirerCandidat(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('candidats_examen').delete().eq('id', id);
    if (error) { console.error('Erreur Supabase retirerCandidat:', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) { console.error('Erreur réseau retirerCandidat:', e); return { success: false, error: e.message || 'Erreur réseau' }; }
}

/**
 * Enregistre la délibération du jury pour un candidat.
 * La date limite de représentation est calculée automatiquement
 * dès lors que le titre n'est pas obtenu.
 */
export async function enregistrerDeliberation(
  id: string,
  resultats: Record<string, EtatCcp>,
  decisionJury: DecisionJury,
  dateDeliberationIso: string,
  entretienFinalPasse = false
): Promise<{ success: boolean; error?: string }> {
  const limite = decisionJury === 'titre_obtenu'
    ? null
    : dateLimiteRepresentation(dateDeliberationIso);
  return modifierCandidat(id, {
    resultats,
    decisionJury,
    dateDeliberation: dateDeliberationIso,
    dateLimiteRepresentation: limite,
    entretienFinalPasse,
  });
}

// ---------------------------------------------------------------------------
// LIVRET DE CERTIFICATION (calculé, non stocké)
// ---------------------------------------------------------------------------

export interface LivretCertification {
  apprenantId: string;
  formationSigle: string;
  etats: Record<string, EtatCcp>;
  ccpsObtenus: string[];
  ccpsManquants: string[];
  titreObtenu: boolean;
  dateLimiteRepresentation: string | null;
  nbSessions: number;
}

/**
 * Reconstitue le livret de certification à partir de toutes les
 * participations de l'apprenant. Un CCP obtenu l'est définitivement :
 * une fois 'obtenu', aucune session ultérieure ne peut le dégrader.
 */
export function construireLivret(
  apprenantId: string,
  formationSigle: string,
  participations: CandidatExamen[]
): LivretCertification {
  const etats: Record<string, EtatCcp> = {};
  for (const ccp of ccpsDuTP(formationSigle)) etats[ccp.code] = 'non_presente';

  // Ordre chronologique : la dernière délibération prime, sauf pour un CCP déjà obtenu.
  const triees = [...participations].sort((a, b) =>
    (a.dateDeliberation || '').localeCompare(b.dateDeliberation || ''));

  let titreObtenu = false;
  let limite: string | null = null;

  for (const p of triees) {
    for (const [code, etat] of Object.entries(p.resultats || {})) {
      if (etats[code] === 'obtenu') continue; // acquis définitif
      etats[code] = etat as EtatCcp;
    }
    if (p.decisionJury === 'titre_obtenu') titreObtenu = true;
    limite = p.dateLimiteRepresentation ?? limite;
  }

  const ccps = ccpsDuTP(formationSigle);
  const obtenus = ccps.filter(c => etats[c.code] === 'obtenu').map(c => c.code);
  const manquants = ccps.filter(c => etats[c.code] !== 'obtenu').map(c => c.code);

  return {
    apprenantId,
    formationSigle,
    etats,
    ccpsObtenus: obtenus,
    ccpsManquants: manquants,
    titreObtenu,
    dateLimiteRepresentation: titreObtenu ? null : limite,
    nbSessions: participations.length,
  };
}

/**
 * Candidats en réussite partielle dont la date limite de représentation
 * n'est pas dépassée. Alimente la liste de vigilance.
 */
export async function chargerReussitesPartielles(): Promise<CandidatExamen[]> {
  try {
    const { data, error } = await supabase
      .from('candidats_examen')
      .select('*')
      .in('decisionJury', ['titre_partiel', 'ajourne'])
      .not('dateLimiteRepresentation', 'is', null)
      .order('dateLimiteRepresentation', { ascending: true });
    if (error) { console.error('Erreur Supabase chargerReussitesPartielles:', error); return []; }
    return data || [];
  } catch (e) { console.error('Erreur réseau chargerReussitesPartielles:', e); return []; }
}