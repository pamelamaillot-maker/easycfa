import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

// Domaine pamoi.re vérifié dans Resend → on peut envoyer depuis une vraie adresse @pamoi.re
const EMAIL_EXPEDITEUR = 'PAM OI Formation <pedagogie@pamoi.re>';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertes } = body as {
      alertes: {
        emailEntreprise: string;
        emailApprenant?: string | null;
        sujet: string;
        corps: string;
        apprenantNom: string;
      }[];
    };

    if (!Array.isArray(alertes) || alertes.length === 0) {
      return NextResponse.json({ success: false, error: 'Aucune alerte à envoyer' }, { status: 400 });
    }

    const resultats: { apprenantNom: string; success: boolean; error?: string; emailId?: string }[] = [];

    for (const a of alertes) {
      if (!a.emailEntreprise) {
        resultats.push({ apprenantNom: a.apprenantNom, success: false, error: 'Email entreprise manquant' });
        continue;
      }
      try {
        const { data, error } = await resend.emails.send({
          from: EMAIL_EXPEDITEUR,
          to: a.emailEntreprise,
          cc: a.emailApprenant ? [a.emailApprenant] : undefined,
          subject: a.sujet,
          text: a.corps,
          html: a.corps.replace(/\n/g, '<br>'),
        });
        if (error) {
          console.error(`[Resend alerte ${a.apprenantNom}] Erreur:`, error);
          resultats.push({ apprenantNom: a.apprenantNom, success: false, error: error.message });
        } else {
          console.log(`[Resend alerte ${a.apprenantNom}] Envoyé:`, data?.id);
          resultats.push({ apprenantNom: a.apprenantNom, success: true, emailId: data?.id });
        }
      } catch (e: any) {
        console.error(`[Resend alerte ${a.apprenantNom}] Exception:`, e);
        resultats.push({ apprenantNom: a.apprenantNom, success: false, error: e.message || 'Erreur envoi' });
      }
    }

    const nbReussis = resultats.filter(r => r.success).length;
    return NextResponse.json({ success: nbReussis > 0, resultats, nbReussis, nbTotal: alertes.length });
  } catch (e: any) {
    console.error('[API envoyer-alertes-absence] Erreur:', e);
    return NextResponse.json({ success: false, error: e.message || 'Erreur serveur' }, { status: 500 });
  }
}