// app/api/etats-presence/route.ts
// Actions de l'équipe sur les états de présence (réservé aux utilisateurs connectés) :
//   { action: 'importer',  id, pdfBase64 }        → PDF signé (sign.plus) → ASSIDUITE + tableau
//   { action: 'regenerer', id }                   → recalcule et remplace le PDF à signer
//   { action: 'dossier',   apprenantId, lien }    → mémorise le dossier ASSIDUITE de l'apprenant
//   { action: 'generer_mois', annee, mois }       → rattrapage : génère les états manquants du mois

import { NextRequest, NextResponse } from 'next/server';
import { genererEtatsSession, importerEtatSigne, supabaseAdmin } from '../../../lib/genererEtatsPresence';
import { idDepuisLienDrive } from '../../../lib/googleCompteService';
import { aujourdhuiReunion, dernierJourFormationDuMois, lireDateFr } from '../../../lib/etatPresenceCalcul';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const sb = supabaseAdmin();
  const jeton = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: user } = jeton ? await sb.auth.getUser(jeton) : { data: { user: null } };
  if (!user?.user) return NextResponse.json({ success: false, error: 'Non connecté' }, { status: 401 });
  const auteur = user.user.email || user.user.id;

  try {
    const corps = await request.json();

    if (corps.action === 'importer') {
      const pdf = Buffer.from(String(corps.pdfBase64 || ''), 'base64');
      if (pdf.length < 100 || pdf.subarray(0, 4).toString() !== '%PDF') {
        return NextResponse.json({ success: false, error: 'Le fichier n’est pas un PDF' }, { status: 400 });
      }
      const r = await importerEtatSigne(String(corps.id), pdf, auteur);
      return NextResponse.json({ success: r.ok, detail: r.detail });
    }

    if (corps.action === 'dossier') {
      const id = idDepuisLienDrive(String(corps.lien || ''));
      if (!id) return NextResponse.json({ success: false, error: 'Lien vide' }, { status: 400 });
      const { error } = await sb.from('apprenants').update({ dossierAssiduiteDriveId: id }).eq('id', corps.apprenantId);
      if (!error) {
        await sb.from('etats_presence').update({ erreur: null })
          .eq('apprenantId', corps.apprenantId).like('erreur', '%ASSIDUITE%');
      }
      return NextResponse.json({ success: !error, error: error?.message });
    }

    // Rattrapage : toutes les sessions en cours dont le dernier jour du mois est passé
    if (corps.action === 'generer_mois') {
      const annee = Number(corps.annee), mois = Number(corps.mois);
      const auj = lireDateFr(aujourdhuiReunion())!;
      const cleAuj = auj.annee * 10000 + auj.mois * 100 + auj.jour;
      const { data: sessions } = await sb.from('sessions').select('id,numero,planning').eq('statut', 'En cours');
      const bilan: Record<string, number> = { ok: 0, erreur: 0, deja_signe: 0, existant: 0 };
      for (const s of sessions || []) {
        const dernier = lireDateFr(dernierJourFormationDuMois(s.planning as any, annee, mois));
        if (!dernier || dernier.annee * 10000 + dernier.mois * 100 + dernier.jour > cleAuj) continue;
        const r = await genererEtatsSession({ session: s, annee, mois, seulementManquants: true, origine: request.nextUrl.origin });
        r.forEach(x => { bilan[x.statut] = (bilan[x.statut] || 0) + 1; });
      }
      return NextResponse.json({ success: true, bilan });
    }

    if (corps.action === 'regenerer') {
      const { data: etat } = await sb.from('etats_presence').select('*').eq('id', corps.id).single();
      if (!etat) return NextResponse.json({ success: false, error: 'État introuvable' }, { status: 404 });
      const { data: session } = await sb.from('sessions').select('id,numero').eq('numero', etat.sessionNumero).maybeSingle();
      if (!session) return NextResponse.json({ success: false, error: `Session ${etat.sessionNumero} introuvable` }, { status: 404 });
      const r = await genererEtatsSession({
        session, annee: etat.annee, mois: etat.mois, forcer: true,
        apprenantId: etat.apprenantId, origine: request.nextUrl.origin,
      });
      return NextResponse.json({ success: r[0]?.statut === 'ok', resultat: r[0] });
    }

    return NextResponse.json({ success: false, error: 'Action inconnue' }, { status: 400 });
  } catch (e: any) {
    console.error('[etats-presence]', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
