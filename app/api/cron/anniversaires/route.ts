import { NextResponse } from 'next/server';

// Route exécutée par le cron Vercel chaque matin.
// Lit les apprenants depuis Supabase (clé serveur — pas de blocage User-Agent ici),
// détecte les anniversaires du jour (fuseau Réunion) et envoie un mail via Resend.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EXPEDITEUR = "L'équipe PAM OI <pamelamaillot@pamoi.re>";

// Construit le HTML du mail (couleurs PAM OI, ton tutoyé)
function construireHtml(prenom: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
    <div style="background-color: #006B68; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎂 Joyeux anniversaire ${prenom} !</h1>
    </div>
    <div style="padding: 28px; background-color: #EAF4F3; border-radius: 0 0 12px 12px;">
      <p style="font-size: 16px; line-height: 1.6;">Bonjour ${prenom},</p>
      <p style="font-size: 16px; line-height: 1.6;">
        Toute l'équipe de <strong style="color: #006B68;">PAM OI Formation</strong> tient à te souhaiter un très <strong>joyeux anniversaire</strong> ! 🎉
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Nous te souhaitons une belle journée, pleine de joie et de bonheur, entourée de ceux qui comptent pour toi. 🌟
      </p>
      <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">
        Avec toute notre affection,<br>
        <strong style="color: #006B68;">Toute l'équipe PAM OI</strong>
      </p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #C8A23A; text-align: center;">
        <p style="font-size: 13px; color: #006B68; font-weight: bold; margin: 0;">Ensemble, nous irons plus loin</p>
      </div>
    </div>
  </div>`;
}

function construireTexte(prenom: string): string {
  return `Bonjour ${prenom},

Toute l'équipe de PAM OI Formation tient à te souhaiter un très joyeux anniversaire !

Nous te souhaitons une belle journée, pleine de joie et de bonheur.

Avec toute notre affection,
Toute l'équipe PAM OI

Ensemble, nous irons plus loin`;
}

export async function GET(request: Request) {
  // 1. Protection : seul le cron (ou un appel autorisé) peut déclencher l'envoi
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!SUPABASE_URL || !SUPABASE_SECRET || !RESEND_API_KEY) {
    return NextResponse.json({ error: 'Variables d\'environnement manquantes' }, { status: 500 });
  }

  // 2. Lecture des apprenants depuis Supabase (côté serveur, pas de blocage navigateur)
  let apprenants: any[] = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/apprenants?select=id,nom,prenom,email,dateNaissance`,
      {
        headers: {
          apikey: SUPABASE_SECRET,
          Authorization: `Bearer ${SUPABASE_SECRET}`,
        },
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `Erreur Supabase ${res.status}`, detail: txt }, { status: 500 });
    }
    apprenants = await res.json();
  } catch (e: any) {
    return NextResponse.json({ error: 'Échec lecture Supabase', detail: e.message }, { status: 500 });
  }

  // 3. Date du jour au fuseau Réunion, format JJ/MM
  const maintenant = new Date();
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Indian/Reunion', day: '2-digit', month: '2-digit',
  });
  const aujourdhui = formatter.format(maintenant); // ex. "16/06"

  // 4. Filtre les anniversaires du jour + déduplication par email
  const dejaEnvoyes = new Set<string>();
  const envois: { prenom: string; email: string }[] = [];

  for (const a of apprenants) {
    if (!a.dateNaissance || !a.email) continue;
    const parts = String(a.dateNaissance).split('/');
    if (parts.length !== 3) continue;
    const jourMois = `${parts[0]}/${parts[1]}`;
    if (jourMois !== aujourdhui) continue;

    const cle = String(a.email).trim().toLowerCase();
    if (dejaEnvoyes.has(cle)) continue;
    dejaEnvoyes.add(cle);
    envois.push({ prenom: a.prenom || '', email: a.email });
  }

  // 5. Envoi via Resend
  const resultats: any[] = [];
  for (const envoi of envois) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EXPEDITEUR,
          to: envoi.email,
          subject: `🎉 Joyeux anniversaire ${envoi.prenom} !`,
          html: construireHtml(envoi.prenom),
          text: construireTexte(envoi.prenom),
        }),
      });
      const data = await res.json();
      resultats.push({ email: envoi.email, ok: res.ok, id: data?.id, erreur: res.ok ? undefined : data });
    } catch (e: any) {
      resultats.push({ email: envoi.email, ok: false, erreur: e.message });
    }
  }

  return NextResponse.json({
    date: aujourdhui,
    apprenantsCharges: apprenants.length,
    anniversaires: envois.length,
    resultats,
  });
}