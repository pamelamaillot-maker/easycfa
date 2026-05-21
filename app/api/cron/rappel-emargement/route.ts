import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const EMAIL_EXPEDITEUR = 'EasyCFA <onboarding@resend.dev>'; // TODO: noreply@pamoi.re après vérif domaine
const BERE_EMAIL = 'pedagogie@pamoi.re';
// En mode test (domaine non vérifié), Resend n'envoie qu'à l'email du compte → on bascule sur PAMA pour tester
const MODE_TEST = true;
const EMAIL_TEST = 'pamelamaillot@pamoi.re';

function dateAujourdhuiFr(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const aaaa = d.getFullYear();
  return `${dd}/${mm}/${aaaa}`;
}

export async function GET(request: NextRequest) {
  // Vérification optionnelle du secret Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dateJour = dateAujourdhuiFr();
    console.log(`[Cron rappel-emargement] Démarrage pour le ${dateJour}`);

    // 1. Récupérer les feuilles du jour
    const { data: feuilles, error: errFeuilles } = await supabase
      .from('emargements')
      .select('*')
      .eq('date', dateJour);

    if (errFeuilles) {
      console.error('[Cron] Erreur Supabase feuilles:', errFeuilles);
      return NextResponse.json({ error: errFeuilles.message }, { status: 500 });
    }

    if (!feuilles || feuilles.length === 0) {
      console.log('[Cron] Aucune feuille pour aujourd\'hui — rien à faire');
      return NextResponse.json({ success: true, message: 'Aucune feuille aujourd\'hui', dateJour });
    }

    // 2. Récupérer les fiches d'intervention du jour
    const { data: fiches } = await supabase
      .from('interventions')
      .select('*')
      .eq('date', dateJour);

    // 3. Récupérer les formateurs (pour leurs emails)
    const formateursLocaux: any[] = [];
    try {
      const { data: formateurs } = await supabase.from('formateurs').select('*');
      if (formateurs) formateursLocaux.push(...formateurs);
    } catch {}

    // 4. Pour chaque feuille, vérifier les manques et envoyer un rappel
    const rappelsEnvoyes: any[] = [];
    const erreurs: any[] = [];

    for (const feuille of feuilles) {
      // Trouver le formateur (par nom dans la première demi-journée)
      const nomFormateur = feuille.demiJournees?.[0]?.formateur;
      const formateur = formateursLocaux.find(f =>
        `${f.prenom} ${f.nom}` === nomFormateur ||
        `${f.nom} ${f.prenom}` === nomFormateur,
      );

      if (!formateur?.email) {
        erreurs.push({ feuille: feuille.id, raison: `Formateur sans email: ${nomFormateur}` });
        continue;
      }

      // Diagnostiquer les manques
      const manques: string[] = [];
      const djMatin = feuille.demiJournees?.find((d: any) => d.type === 'Matin');
      const djAprem = feuille.demiJournees?.find((d: any) => d.type === 'Après-midi');

      if (djMatin && !djMatin.valide) {
        const nonSaisis = djMatin.presences?.filter((p: any) => p.statut === 'Non saisi').length || 0;
        manques.push(`🌅 Matin non validé (${nonSaisis} présence(s) non saisie(s))`);
      }
      if (djAprem && !djAprem.valide) {
        const nonSaisis = djAprem.presences?.filter((p: any) => p.statut === 'Non saisi').length || 0;
        manques.push(`🌇 Après-midi non validé (${nonSaisis} présence(s) non saisie(s))`);
      }

      const fiche = fiches?.find((f: any) => f.id === feuille.id || f.formateurId === formateur.id);
      if (!fiche?.dateSignature) {
        manques.push(`📝 Fiche d'intervention pédagogique non signée`);
      }

      if (manques.length === 0) continue; // tout est OK pour cette feuille

      // Envoyer le rappel
      const sujet = `[EasyCFA] ⏰ Rappel — Émargement à finaliser pour aujourd'hui ${dateJour}`;
      const corps = `
Bonjour ${formateur.prenom},

Il est 15h15. Nous constatons que les éléments suivants ne sont pas encore complets pour ta session du jour :

${manques.map(m => '• ' + m).join('\n')}

Session : ${feuille.formation} — ${feuille.jour} ${feuille.date}
Salle : ${feuille.salle}

Merci de te connecter à EasyCFA dès que possible pour finaliser :
👉 https://easycfa-three.vercel.app/emargement

Pour rappel, conformément à nos exigences Qualiopi :
- La saisie des présences doit être finalisée avant 15h15 (matin) et 17h00 (après-midi)
- La fiche d'intervention pédagogique doit être signée en fin de journée

Si tu rencontres un problème, contacte BERE : pedagogie@pamoi.re

Cordialement,
EasyCFA — Système automatique
PAM OI Formation
      `.trim();

      const corpsHtml = corps.replace(/\n/g, '<br>');
      const destinataire = MODE_TEST ? EMAIL_TEST : formateur.email;
      const copies = MODE_TEST ? [] : [BERE_EMAIL];

      const { data: emailData, error: errMail } = await resend.emails.send({
        from: EMAIL_EXPEDITEUR,
        to: destinataire,
        cc: copies,
        subject: sujet,
        text: corps,
        html: corpsHtml,
      });

      if (errMail) {
        erreurs.push({ feuille: feuille.id, formateur: formateur.email, raison: errMail.message });
        console.error(`[Cron] Erreur envoi ${formateur.email}:`, errMail);
      } else {
        rappelsEnvoyes.push({ feuille: feuille.id, formateur: formateur.email, emailId: emailData?.id, manques });
        console.log(`[Cron] Rappel envoyé à ${formateur.email} (${manques.length} manque(s))`);
      }
    }

    return NextResponse.json({
      success: true,
      dateJour,
      feuillesAnalysees: feuilles.length,
      rappelsEnvoyes: rappelsEnvoyes.length,
      erreurs: erreurs.length,
      details: { rappelsEnvoyes, erreurs },
    });
  } catch (e: any) {
    console.error('[Cron rappel-emargement] Erreur:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}