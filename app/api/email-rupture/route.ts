import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join } from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { destinataire, expediteur, nomApprenant, signature } = await req.json();

    // Lire le PDF depuis public/modeles
    const pdfPath = join(process.cwd(), 'public', 'modeles', 'Formulaire_Rupture.pdf');
    const pdfBuffer = readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['pamelamaillot@pamoi.re'],
      reply_to: expediteur ?? 'pedagogie@pamoi.re',
      subject: `Formulaire de résiliation du contrat d'apprentissage — ${nomApprenant}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px;">
          <div style="background-color: #006B68; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 16px;">PAM OI Formation</h2>
            <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">1 Chemin Dubuisson – 97436 Saint-Leu</p>
          </div>
          <div style="padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Madame, Monsieur,</p>
            <p>Veuillez trouver ci-joint le formulaire de résiliation du contrat d'apprentissage de <strong>${nomApprenant}</strong>.</p>
            <p>Nous vous remercions de bien vouloir :</p>
            <ol>
              <li>Compléter les informations manquantes</li>
              <li>Cocher le motif de rupture correspondant</li>
              <li>Faire signer toutes les parties concernées</li>
              <li>Nous retourner le document signé à <a href="mailto:pedagogie@pamoi.re">pedagogie@pamoi.re</a></li>
            </ol>
            <p>Pour toute question, n'hésitez pas à nous contacter.</p>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #C8A23A; font-size: 13px; color: #555; white-space: pre-line;">
              ${signature ?? 'PAM OI Formation\npedagogie@pamoi.re\n06 93 55 64 97'}
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Rupture_${nomApprenant.replace(/ /g, '_')}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
  }
}