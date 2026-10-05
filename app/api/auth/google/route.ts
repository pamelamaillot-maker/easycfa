import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '../../../../lib/googleAuth';

// app/api/auth/google/route.ts
// Depart vers l'autorisation Google.
//
// La page appelante peut indiquer ou elle souhaite revenir :
//   /api/auth/google?retour=/apprenants/RIVCH_039
// Sans ce parametre, le comportement reste celui d'avant.

export async function GET(request: NextRequest) {
  const retour = request.nextUrl.searchParams.get('retour') ?? undefined;
  return NextResponse.redirect(getAuthUrl(retour));
}