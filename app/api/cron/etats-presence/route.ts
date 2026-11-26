// app/api/cron/etats-presence/route.ts
// Tous les soirs (19h, heure de La Réunion) : pour chaque session en cours dont
// c'est aujourd'hui le dernier jour de formation du mois, génère les états de
// présence (PDF + Drive + tableau) et les met « à valider » dans EasyCFA.
//
// Rattrapage manuel possible : /api/cron/etats-presence?date=27/11/2026
// (avec l'en-tête Authorization: Bearer CRON_SECRET).

import { NextRequest, NextResponse } from 'next/server';
import { aujourdhuiReunion, dernierJourFormationDuMois, lireDateFr } from '../../../../lib/etatPresenceCalcul';
import { genererEtatsSession, supabaseAdmin } from '../../../../lib/genererEtatsPresence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dateJour = request.nextUrl.searchParams.get('date') || aujourdhuiReunion();
  const d = lireDateFr(dateJour);
  if (!d) return NextResponse.json({ error: `Date invalide : ${dateJour}` }, { status: 400 });

  const { data: sessions, error } = await supabaseAdmin().from('sessions').select('id,numero,planning,statut').eq('statut', 'En cours');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const concernees = (sessions || []).filter(s => dernierJourFormationDuMois(s.planning as any, d.annee, d.mois) === dateJour);
  console.log(`[Cron etats-presence] ${dateJour} — ${concernees.length} session(s) en fin de mois`);

  const rapport: Record<string, any> = {};
  for (const s of concernees) {
    try {
      rapport[s.numero || s.id] = await genererEtatsSession({
        session: { id: s.id, numero: s.numero },
        annee: d.annee,
        mois: d.mois,
        seulementManquants: true,
        origine: request.nextUrl.origin,
      });
    } catch (e: any) {
      rapport[s.numero || s.id] = { erreur: e.message };
    }
  }

  console.log('[Cron etats-presence] rapport', JSON.stringify(rapport));
  return NextResponse.json({ success: true, dateJour, sessions: concernees.map(s => s.numero), rapport });
}
