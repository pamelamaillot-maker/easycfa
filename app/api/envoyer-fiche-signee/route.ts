import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

// TEST : tant que pamoi.re n'est pas vérifié dans Resend, on envoie à l'email du compte Resend
// PROD : changer pour 'pedagogie@pamoi.re' une fois le domaine vérifié
const EMAIL_DESTINATAIRE = 'pamelamaillot@pamoi.re';
const EMAIL_EXPEDITEUR = 'EasyCFA <onboarding@resend.dev>'; // TODO: remplacer par noreply@pamoi.re quand le domaine est vérifié dans Resend

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      formateurNom,
      formation,
      date,
      jour,
      pdfEmargementBase64,
      pdfEmargementNom,
      pdfFicheBase64,
      pdfFicheNom,
    } = body;

    if (!pdfEmargementBase64 || !pdfFicheBase64) {
      return NextResponse.json({ success: false, error: 'PDFs manquants' }, { status: 400 });
    }

    const sujet = `[EasyCFA] Fiche intervention signée — ${formation} — ${date}`;
    const corps = `
Bonjour,

Une fiche d'intervention pédagogique a été signée électroniquement par le formateur.

Détails :
- Formateur : ${formateurNom}
- Formation : ${formation}
- Date : ${jour} ${date}

Pièces jointes :
1. ${pdfEmargementNom} — Feuille d'émargement
2. ${pdfFicheNom} — Fiche d'intervention pédagogique signée

Action requise : importer ces deux documents sur sign.plus pour signature électronique du responsable pédagogique.

Cordialement,
EasyCFA — Système automatique
PAM OI Formation
    `.trim();

    const corpsHtml = corps.replace(/\n/g, '<br>');

    const { data, error } = await resend.emails.send({
      from: EMAIL_EXPEDITEUR,
      to: EMAIL_DESTINATAIRE,
      subject: sujet,
      text: corps,
      html: corpsHtml,
      attachments: [
        {
          filename: pdfEmargementNom,
          content: pdfEmargementBase64,
        },
        {
          filename: pdfFicheNom,
          content: pdfFicheBase64,
        },
      ],
    });

    if (error) {
      console.error('[Resend] Erreur envoi:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('[Resend] Email envoyé:', data?.id);
    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (e: any) {
    console.error('[API envoyer-fiche-signee] Erreur:', e);
    return NextResponse.json({ success: false, error: e.message || 'Erreur serveur' }, { status: 500 });
  }
}