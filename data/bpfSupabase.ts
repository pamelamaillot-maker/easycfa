// data/bpfSupabase.ts
// CRUD Supabase pour les déclarations BPF

import { supabase } from '../lib/supabaseClient';

export type BPFDeclaration = {
  id: string;
  exerciceDebut: string;
  exerciceFin: string;
  anneeBPF: number;
  dateLimiteTeletransmission?: string;
  teletransmis: boolean;
  dateTeletransmission?: string | null;
  numeroAccuseReception?: string | null;
  pdfCerfaNom?: string | null;
  pdfCerfaUrl?: string | null;
  pdfCerfaCheminStorage?: string | null;
  totalProduits?: number | null;
  totalCharges?: number | null;
  salairesFormateurs?: number | null;
  honoraires?: number | null;
  notes?: string | null;
  dateCreation?: string;
  dateModification?: string;
};

async function getAuthHeaders(): Promise<HeadersInit | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Charge toutes les déclarations BPF, triées par année décroissante */
export async function chargerBPFs(): Promise<BPFDeclaration[]> {
  const headers = await getAuthHeaders();
  if (!headers) {
    console.warn('[bpfSupabase] Pas de session, retour [].');
    return [];
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/bpf_declarations?select=*&order=anneeBPF.desc`,
      { headers },
    );
    if (!res.ok) {
      console.error('[bpfSupabase] Erreur chargement :', res.status, await res.text());
      return [];
    }
    return await res.json();
  } catch (e) {
    console.error('[bpfSupabase] Exception chargement :', e);
    return [];
  }
}

/** Sauvegarde un BPF (upsert : crée ou met à jour) */
export async function sauvegarderBPF(bpf: BPFDeclaration): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Non authentifié' };

  try {
    const payload = {
      ...bpf,
      dateModification: new Date().toISOString(),
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bpf_declarations`, {
      method: 'POST',
      headers: {
        ...headers,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[bpfSupabase] Erreur sauvegarde :', res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[bpfSupabase] Exception sauvegarde :', e);
    return { success: false, error: e?.message || String(e) };
  }
}

/** Calcule les jours restants avant échéance — null si pas de date */
export function joursAvantEcheance(bpf: BPFDeclaration): number | null {
  if (!bpf.dateLimiteTeletransmission) return null;
  const p = bpf.dateLimiteTeletransmission.split('/');
  if (p.length !== 3) return null;
  const j = parseInt(p[0]);
  const m = parseInt(p[1]);
  let a = parseInt(p[2]);
  if (a < 100) a += 2000;
  if (isNaN(j) || isNaN(m) || isNaN(a)) return null;
  const d = new Date(a, m - 1, j);
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - aujourdhui.getTime()) / 86400000);
}

/** Retourne le BPF en retard (ou proche d'échéance) le plus prioritaire */
export function getBPFEnAlerte(bpfs: BPFDeclaration[]): BPFDeclaration | null {
  const enAttente = bpfs.filter(b => !b.teletransmis);
  if (enAttente.length === 0) return null;
  // Le plus urgent = celui avec dateLimite la plus proche (ou dépassée)
  enAttente.sort((a, b) => {
    const jA = joursAvantEcheance(a) ?? 999;
    const jB = joursAvantEcheance(b) ?? 999;
    return jA - jB;
  });
  return enAttente[0];
}