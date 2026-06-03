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
        const corpsHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#EAF4F3; font-family:Arial, Helvetica, sans-serif; color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EAF4F3; padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- En-tête vert avec logo -->
        <tr><td style="background-color:#006B68; padding:20px 28px;" align="left">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><div style="background-color:#ffffff; border-radius:8px; padding:6px; display:inline-block;"><img src="https://easycfa-three.vercel.app/logo-pamoi.png" alt="PAM OI" width="44" height="44" style="display:block; border:0;"></div></td>
            <td style="vertical-align:middle; padding-left:14px;">
              <div style="color:#ffffff; font-size:18px; font-weight:bold;">PAM OI Formation</div>
              <div style="color:#C8A23A; font-size:12px; font-weight:bold; letter-spacing:0.5px;">Centre de Formation d'Apprentis</div>
            </td>
          </tr></table>
        </td></tr>
        <!-- Corps -->
        <tr><td style="padding:28px;">
          <div style="font-size:14px; line-height:1.7; color:#1a1a1a; white-space:pre-line;">${a.corps}</div>
        </td></tr>
        <!-- Bande or de séparation -->
        <tr><td style="height:4px; background-color:#C8A23A;"></td></tr>
        <!-- Pied de page -->
        <tr><td style="padding:16px 28px; background-color:#f7f9f9;">
          <div style="font-size:11px; color:#888; line-height:1.5;">
            PAM OI Formation — 1 Chemin Dubuisson, 97436 Saint-Leu<br>
            pedagogie@pamoi.re — 0693 55 64 92<br>
            <span style="color:#aaa;">Message envoyé automatiquement par EasyCFA</span>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

        const { data, error } = await resend.emails.send({
          from: EMAIL_EXPEDITEUR,
          to: a.emailEntreprise,
          cc: a.emailApprenant ? [a.emailApprenant] : undefined,
          subject: a.sujet,
          text: a.corps,
          html: corpsHtml,
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