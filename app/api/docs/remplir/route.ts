import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { oauth2Client } from '../../../../lib/googleAuth';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Non authentifié', authRequired: true }, { status: 401 });
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const { docId, donnees } = await request.json();

    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Copier le document pour ne pas modifier l'original
    const copie = await drive.files.copy({
      fileId: docId,
      requestBody: {
        name: `EasyCFA_${donnees.APPRENANT_NOM_COMPLET}_${new Date().toLocaleDateString('fr-FR')}`,
      },
    });

    const newDocId = copie.data.id!;

    // Récupérer le document copié
    const doc = await docs.documents.get({ documentId: newDocId });
    const content = doc.data.body?.content ?? [];

    // Construire les remplacements
    const requests = Object.entries(donnees)
      .filter(([, valeur]) => valeur && valeur.trim() !== '')
      .map(([cle, valeur]) => ({
        replaceAllText: {
          containsText: {
            text: `{{${cle}}}`,
            matchCase: true,
          },
          replaceText: valeur,
        },
      }));

    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId: newDocId,
        requestBody: { requests },
      });
    }

    // Retourner le lien du document rempli
    const lienDoc = `https://docs.google.com/document/d/${newDocId}/edit`;

    return NextResponse.json({
      success: true,
      lienDoc,
      docId: newDocId,
      message: `Document rempli avec ${requests.length} champs`,
    });

  } catch (error: any) {
    console.error('Erreur remplissage Google Docs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}