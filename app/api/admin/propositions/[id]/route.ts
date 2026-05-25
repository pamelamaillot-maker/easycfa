import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: propositionId } = await params;

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ erreur: 'Non authentifié.' }, { status: 401 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ erreur: 'Token invalide.' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, actif')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !profile.actif || !['admin', 'pedagogique'].includes(profile.role)) {
      return NextResponse.json({ erreur: 'Accès refusé.' }, { status: 403 });
    }

    const body = await req.json();
    const action = body.action;
    const motif = (body.motif || '').trim();

    if (action !== 'valider' && action !== 'refuser') {
      return NextResponse.json({ erreur: 'Action invalide.' }, { status: 400 });
    }
    if (action === 'refuser' && !motif) {
      return NextResponse.json({ erreur: 'Un motif est requis pour refuser.' }, { status: 400 });
    }

    const { data: proposition, error: propError } = await supabaseAdmin
      .from('formateurs_propositions')
      .select('*')
      .eq('id', propositionId)
      .maybeSingle();

    if (propError || !proposition) {
      return NextResponse.json({ erreur: 'Proposition introuvable.' }, { status: 404 });
    }
    if (proposition.statut !== 'en_attente') {
      return NextResponse.json({ erreur: 'Cette proposition a déjà été traitée.' }, { status: 400 });
    }

    if (action === 'valider') {
      const patch = {
        ...proposition.champsModifies,
        dateModification: new Date().toISOString(),
      };
      const { error: updateError } = await supabaseAdmin
        .from('formateurs')
        .update(patch)
        .eq('id', proposition.formateurId);

      if (updateError) {
        console.error('[propositions PATCH] Erreur update formateur :', updateError);
        return NextResponse.json({ erreur: 'Erreur lors de l\'application des modifications.' }, { status: 500 });
      }
    }

    const updateProp: any = {
      statut: action === 'valider' ? 'validee' : 'refusee',
      validePar: user.id,
      dateValidation: new Date().toISOString(),
    };
    if (action === 'refuser') {
      updateProp.motifRefus = motif;
    }

    const { error: propUpdateError } = await supabaseAdmin
      .from('formateurs_propositions')
      .update(updateProp)
      .eq('id', propositionId);

    if (propUpdateError) {
      console.error('[propositions PATCH] Erreur update proposition :', propUpdateError);
      return NextResponse.json({ erreur: 'Erreur lors de la mise à jour de la proposition.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[propositions PATCH] Exception :', err);
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 });
  }
}