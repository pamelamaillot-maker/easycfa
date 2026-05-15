import { NextResponse } from 'next/server';
import { getAuthUrl } from '../../../../lib/googleAuth';

export async function GET() {
  const authUrl = getAuthUrl();
  return NextResponse.redirect(authUrl);
}