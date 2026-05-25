import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// ⚠️ NE JAMAIS exposer cette clé côté client. Utilisée uniquement ici.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;

// Expéditeur cohérent avec les autres mails techniques de l'app
const EXPEDITEUR = 'EasyCFA <onboarding@resend.dev>';

// URL publique de l'app (utilisée pour construire le lien de redirection après clic)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ erreur: 'Email manquant.' }, { status: 400 });
    }

    const emailNormalise = email.trim().toLowerCase();

    // 1. Client Supabase Admin (avec la clé SECRET, jamais côté browser)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Vérifier que l'email correspond bien à un formateur (sécurité métier)
    // On ne renvoie volontairement pas de 404 distinct pour éviter l'énumération d'emails.
    const { data: profil, error: profilError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, actif, prenom, nom')
      .eq('email', emailNormalise)
      .maybeSingle();

    // Si pas trouvé OU pas formateur OU désactivé : on retourne 200 quand même (anti-énumération)
    // mais on n'envoie aucun mail. Le front affichera quand même le message rassurant.
    if (profilError || !profil || profil.role !== 'formateur' || !profil.actif) {
      console.log('[demande-reset] Email non éligible :', emailNormalise, '— pas d\'envoi.');
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 3. Générer un lien de recovery via l'admin Supabase
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: emailNormalise,
      options: {
        redirectTo: `${APP_URL}/formateur/reset`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[demande-reset] Erreur générer lien :', linkError);
      return NextResponse.json({ erreur: 'Erreur serveur, réessayez plus tard.' }, { status: 500 });
    }

    const lienReset = linkData.properties.action_link;

    // 4. Envoyer l'email via Resend, branding PAM OI
    const resend = new Resend(RESEND_API_KEY);
    const prenom = profil.prenom || 'Formateur';

    const { error: mailError } = await resend.emails.send({
      from: EXPEDITEUR,
      to: emailNormalise,
      subject: 'Réinitialisation de votre mot de passe — EasyCFA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #333;">
          <div style="text-align: center; padding: 24px 0 32px;">
            <div style="font-size: 22px; font-weight: 800; color: #006B68;">
              Easy<span style="color: #C8A23A;">CFA</span>
            </div>
            <div style="font-size: 12px; color: #888; margin-top: 4px;">PAM OI Formation</div>
          </div>

          <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 32px;">
            <h2 style="color: #006B68; font-size: 20px; margin: 0 0 16px;">Bonjour ${prenom},</h2>

            <p style="line-height: 1.6; font-size: 14px;">
              Vous avez demandé la réinitialisation de votre mot de passe pour votre espace formateur EasyCFA.
            </p>

            <p style="line-height: 1.6; font-size: 14px;">
              Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${lienReset}" style="background: #006B68; color: white; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                🔑 Définir mon mot de passe
              </a>
            </div>

            <p style="font-size: 12px; color: #888; line-height: 1.6;">
              Ce lien est valable <strong>1 heure</strong>. Au-delà, demandez-en un nouveau depuis la page de connexion.
            </p>

            <p style="font-size: 12px; color: #888; line-height: 1.6; margin-top: 16px;">
              Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe actuel reste inchangé.
            </p>
          </div>

          <div style="text-align: center; font-size: 11px; color: #aaa; margin-top: 24px;">
            EasyCFA — CFA PAM OI Formation — Saint-Leu, La Réunion
          </div>
        </div>
      `,
    });

    if (mailError) {
      console.error('[demande-reset] Erreur envoi Resend :', mailError);
      return NextResponse.json({ erreur: 'Erreur d\'envoi du mail. Réessayez.' }, { status: 500 });
    }

    console.log('[demande-reset] Mail envoyé à', emailNormalise);
    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (err) {
    console.error('[demande-reset] Exception :', err);
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 });
  }
}