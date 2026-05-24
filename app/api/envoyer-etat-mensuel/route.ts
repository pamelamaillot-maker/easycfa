import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const MODE_TEST = true;
const EMAIL_TEST = 'pamelamaillot@pamoi.re';
const EXPEDITEUR = 'PAM OI Formation <onboarding@resend.dev>';

export async function POST(request: NextRequest) {
  try {
    const { emailEntreprise, nomEntreprise, apprenantNom, apprenantPrenom, mois, pdfBase64, pdfNom } = await request.json();

    if (!emailEntreprise) {
      return NextResponse.json({ success: false, error: 'Email entreprise manquant' }, { status: 400 });
    }
    if (!pdfBase64) {
      return NextResponse.json({ success: false, error: 'PDF manquant' }, { status: 400 });
    }

    const destinataire = MODE_TEST ? EMAIL_TEST : emailEntreprise;

    const corpsHtml = `
      <div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #006B68; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 18px;">PAM OI Formation</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <p>Bonjour,</p>
          <p>
            Veuillez trouver ci-joint l'état de présence de <strong>${apprenantPrenom} ${apprenantNom}</strong> pour le mois de <strong>${mois}</strong>.
          </p>
          <p>Ce document est destiné au traitement de la paie de votre apprenti(e).</p>
          <p>Cordialement,</p>
          <p><strong>PAM OI Formation</strong><br/>
            1 Chemin Dubuisson — 97436 Saint-Leu<br/>
            📧 pedagogie@pamoi.re — 📞 06 93 55 64 97
          </p>
          ${MODE_TEST ? `<div style="margin-top: 20px; padding: 10px; background: #fef6e4; border-left: 4px solid #C8A23A; font-size: 12px;">
            ⚠️ MODE TEST — Cet email aurait dû être envoyé à : <strong>${emailEntreprise}</strong> (${nomEntreprise})
          </div>` : ''}
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: EXPEDITEUR,
      to: destinataire,
      subject: `État de présence ${apprenantPrenom} ${apprenantNom} — ${mois}`,
      html: corpsHtml,
      attachments: [
        {
          filename: pdfNom,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error('[envoyer-etat-mensuel] Erreur Resend:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`[envoyer-etat-mensuel] Email envoyé ✅ à ${destinataire} (id: ${data?.id})`);
    return NextResponse.json({ success: true, emailId: data?.id });

  } catch (e: any) {
    console.error('[envoyer-etat-mensuel] Erreur:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}