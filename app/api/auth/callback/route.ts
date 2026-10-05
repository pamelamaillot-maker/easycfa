import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client } from '../../../../lib/googleAuth';

// app/api/auth/callback/route.ts
// Retour de Google apres autorisation.

/** Page de repli quand aucune provenance n'a ete transmise. */
const PAGE_PAR_DEFAUT = '/documents/generation';

/**
 * Le `state` revient du navigateur : il peut avoir ete forge.
 * On n'accepte qu'un chemin interne — commencant par une seule barre
 * oblique. '//evil.com' et 'https://evil.com' sont des adresses externes
 * et sont donc refusees.
 */
function destinationSure(state: string | null): string {
  if (!state) return PAGE_PAR_DEFAUT;
  if (!state.startsWith('/')) return PAGE_PAR_DEFAUT;
  if (state.startsWith('//')) return PAGE_PAR_DEFAUT;
  return state;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const destination = destinationSure(searchParams.get('state'));
    const response = NextResponse.redirect(new URL(destination, request.url));

    response.cookies.set('google_access_token', tokens.access_token ?? '', {
      httpOnly: true,
      secure: false,
      maxAge: 3600,
    });
    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 24 * 3600,
      });
    }
    return response;
  } catch (error) {
    console.error('Erreur OAuth:', error);
    return NextResponse.json({ error: 'Erreur authentification' }, { status: 500 });
  }
}