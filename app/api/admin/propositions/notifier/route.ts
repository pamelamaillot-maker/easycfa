import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;

const EXPEDITEUR = 'EasyCFA <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const DESTINATAIRE_PAMA = 'pamelamaillot@pamoi.re';

export async function POST(req: NextRequest) {
  try {
    const { propositionId } = await req.json();

    if (!propositionId) {
      return NextResponse.json({ erreur: 'propositionId manquant.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: proposition, error: propError } = await supabaseAdmin
      .from('formateurs_propositions')
      .select('*')
      .eq('id', propositionId)
      .maybeSingle();

    if (propError || !proposition) {
      console.error('[notifier] Proposition introuvable :', propositionId);
      return NextResponse.json({ erreur: 'Proposition introuvable.' }, { status: 404 });
    }

    const { data: formateur } = await supabaseAdmin
      .from('formateurs')
      .select('id, nom, prenom, email')
      .eq('id', proposition.formateurId)
      .maybeSingle();

    if (!formateur) {
      console.error('[notifier] Formateur introuvable :', proposition.formateurId);
      return NextResponse.json({ erreur: 'Formateur introuvable.' }, { status: 404 });
    }

    const champsListe = Object.entries(proposition.champsModifies || {})
      .map(([cle, valeur]) => {
        let valeurAffichee: string;
        if (Array.isArray(valeur)) {
          valeurAffichee = valeur.join(', ');
        } else if (typeof valeur === 'object' && valeur !== null) {
          valeurAffichee = JSON.stringify(valeur);
        } else {
          valeurAffichee = String(valeur ?? '');
        }
        return `<li><strong>${cle}</strong> : ${valeurAffichee || '<em>(vide)</em>'}</li>`;
      })
      .join('');

    const resend = new Resend(RESEND_API_KEY);

    const { error: mailError } = await resend.emails.send({
      from: EXPEDITEUR,
      to: DESTINATAIRE_PAMA,
      subject: `Nouvelle proposition de modification — ${formateur.prenom} ${formateur.nom}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
          <div style="text-align: center; padding: 16px 0 24px;">
            <div style="font-size: 22px; font-weight: 800; color: #006B68;">
              Easy<span style="color: #C8A23A;">CFA</span>
            </div>
            <div style="font-size: 12px; color: #888; margin-top: 4px;">PAM OI Formation</div>
          </div>
          <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 28px;">
            <h2 style="color: #006B68; font-size: 18px; margin: 0 0 12px;">
              📝 Nouvelle proposition à valider
            </h2>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
              <strong>${formateur.prenom} ${formateur.nom}</strong> (${formateur.email || 'email non renseigné'})
              vient de soumettre une demande de modification de sa fiche formateur.
            </p>
            <div style="background: #f7f9f9; border-left: 3px solid #006B68; padding: 14px 18px; margin: 16px 0; border-radius: 6px;">
              <div style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">
                Champs proposés
              </div>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7;">
                ${champsListe}
              </ul>
            </div>
            ${proposition.notesFormateur ? `
              <div style="background: #fff8e1; border-left: 3px solid #C8A23A; padding: 14px 18px; margin: 16px 0; border-radius: 6px;">
                <div style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px;">
                  Note du formateur
                </div>
                <div style="font-size: 13px; font-style: italic; color: #555;">
                  « ${proposition.notesFormateur} »
                </div>
              </div>
            ` : ''}
            <div style="text-align: center; margin: 24px 0 8px;">
              <a href="${APP_URL}/formateurs/propositions"
                 style="background: #006B68; color: white; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                ✅ Examiner la proposition
              </a>
            </div>
          </div>
          <div style="text-align: center; font-size: 11px; color: #aaa; margin-top: 20px;">
            EasyCFA — CFA PAM OI Formation — Saint-Leu, La Réunion
          </div>
        </div>
      `,
    });

    if (mailError) {
      console.error('[notifier] Erreur Resend :', mailError);
      return NextResponse.json({ erreur: 'Erreur d\'envoi du mail.' }, { status: 500 });
    }

    console.log('[notifier] Mail envoyé à PAMA pour proposition', propositionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notifier] Exception :', err);
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 });
  }
}