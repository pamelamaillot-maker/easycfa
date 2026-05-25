import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

// ============================================================
// GET /api/admin/propositions
// ============================================================
export async function GET(req: NextRequest) {
  try {
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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, actif')
      .eq('id', user.id)
      .maybeSingle();

    console.log('[propositions GET] user.id:', user.id);
    console.log('[propositions GET] profile:', profile);
    console.log('[propositions GET] profileError:', profileError);

    if (!profile || !profile.actif || !['admin', 'pedagogique'].includes(profile.role)) {
      console.log('[propositions GET] ACCES REFUSE — profile:', profile);
      return NextResponse.json({ erreur: 'Accès refusé.' }, { status: 403 });
    }

    const url = new URL(req.url);
    const statut = url.searchParams.get('statut') || 'en_attente';

    let query = supabaseAdmin
      .from('formateurs_propositions')
      .select('*')
      .order('dateProposition', { ascending: false });

    if (statut !== 'all') {
      query = query.eq('statut', statut);
    }

    const { data: propositions, error: propError } = await query;
    if (propError) {
      console.error('[propositions GET] Erreur :', propError);
      return NextResponse.json({ erreur: 'Erreur lecture propositions.' }, { status: 500 });
    }

    const formateurIds = Array.from(new Set((propositions || []).map(p => p.formateurId)));
    let formateursMap: Record<string, any> = {};

    if (formateurIds.length > 0) {
      const { data: formateurs } = await supabaseAdmin
        .from('formateurs')
        .select('id, nom, prenom, email')
        .in('id', formateurIds);
      (formateurs || []).forEach(f => { formateursMap[f.id] = f; });
    }

    const propositionsEnrichies = (propositions || []).map(p => ({
      ...p,
      formateur: formateursMap[p.formateurId] || null,
    }));

    return NextResponse.json({ propositions: propositionsEnrichies });
  } catch (err) {
    console.error('[propositions GET] Exception :', err);
    return NextResponse.json({ erreur: 'Erreur serveur.' }, { status: 500 });
  }
}