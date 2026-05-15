import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client } from '../../../../../lib/googleAuth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const response = NextResponse.redirect(new URL('/documents/generation', request.url));
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