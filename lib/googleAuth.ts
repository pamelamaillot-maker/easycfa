import { google } from 'googleapis';

// lib/googleAuth.ts
// Autorisation Google (Docs + Drive) pour la generation des livrets.
//
// LE PARAMETRE `state`
// Google renvoie l'utilisateur a une adresse fixe, declaree dans la console
// Google Cloud. Sans precaution, tout le monde atterrit donc au meme endroit,
// quelle que soit la page de depart.
//
// Le parametre `state` existe pour cela : Google le transporte sans y toucher
// et le restitue tel quel a la route de retour, qui peut alors ramener la
// personne d'ou elle venait.
//
// ⚠️ `state` vient du navigateur : il n'est pas digne de confiance. La route
// de retour doit verifier qu'il s'agit bien d'un chemin interne avant de
// rediriger, sans quoi un lien forge pourrait envoyer vos utilisateurs vers
// un site tiers en passant par EasyCFA.

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * URL d'autorisation Google.
 * @param retour chemin interne ou ramener l'utilisateur apres autorisation,
 *               par exemple '/apprenants/RIVCH_039'. Facultatif.
 */
export function getAuthUrl(retour?: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive',
    ],
    ...(retour ? { state: retour } : {}),
  });
}

export function getOAuth2Client(accessToken: string, refreshToken: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return oauth2Client;
}

export { oauth2Client };