// lib/googleCompteService.ts
// Accès Google « sans personne connectée », pour les tâches automatiques (cron).
//
// Compte de service Google Cloud + délégation au niveau du domaine pamoi.re :
// le compte de service agit AU NOM de GOOGLE_COMPTE_DELEGUE (ex. pedagogie@pamoi.re),
// donc les PDF déposés appartiennent à ce compte et utilisent son espace Drive.
//
// Variables d'environnement (Vercel + .env.local) :
//   GOOGLE_SA_EMAIL          adresse du compte de service (…@….iam.gserviceaccount.com)
//   GOOGLE_SA_PRIVATE_KEY    clé privée du JSON (avec les \n)
//   GOOGLE_COMPTE_DELEGUE    pedagogie@pamoi.re
//   GOOGLE_SHEET_ASSIDUITE_ID     identifiant du tableau Google Sheets
//   GOOGLE_SHEET_ASSIDUITE_ONGLET nom exact de l'onglet, ex. « Gestion Assiduité 2026 »
//   GOOGLE_DOSSIER_A_SIGNER_ID    dossier Drive « États de présence à signer »

import { google, drive_v3, sheets_v4 } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
];

/**
 * Remet la clé privée au format PEM, quelle que soit la façon dont elle a été collée
 * dans Vercel : avec ou sans guillemets, avec des \n littéraux, des espaces à la place
 * des retours à la ligne, ou même le fichier JSON entier.
 */
function normaliserCle(brute: string): string {
  let k = (brute || '').trim();
  if (k.startsWith('{')) {
    try { k = JSON.parse(k).private_key || ''; } catch { /* on continue avec le texte brut */ }
  }
  k = k.replace(/^["']+|["',]+$/g, '').replace(/\\n/g, '\n');
  const m = k.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
  if (!m) return k;
  const corps = m[1].replace(/[^A-Za-z0-9+/=]/g, '');
  const lignes = corps.match(/.{1,64}/g) || [];
  return `-----BEGIN PRIVATE KEY-----\n${lignes.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

function auth() {
  const email = process.env.GOOGLE_SA_EMAIL;
  const key = normaliserCle(process.env.GOOGLE_SA_PRIVATE_KEY || '');
  if (!email || !key) throw new Error('Compte de service Google non configuré (GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY)');
  return new google.auth.JWT({ email, key, scopes: SCOPES, subject: process.env.GOOGLE_COMPTE_DELEGUE });
}

export function driveService(): drive_v3.Drive {
  return google.drive({ version: 'v3', auth: auth() });
}

export function sheetsService(): sheets_v4.Sheets {
  return google.sheets({ version: 'v4', auth: auth() });
}

const DOSSIER = 'application/vnd.google-apps.folder';
const echapper = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const normaliser = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

/**
 * Cherche le dossier ASSIDUITE d'un apprenant : dossier dont le nom contient NOM et Prénom,
 * puis ASSIDUITE dans ce dossier ou un sous-dossier (ex. « DOCS IMPORTANTS »).
 * Renvoie l'identifiant, ou null si introuvable ou ambigu (plusieurs candidats).
 */
export async function trouverDossierAssiduite(nom: string, prenom: string): Promise<string | null> {
  const drive = driveService();
  const premierPrenom = (prenom || '').split(/[\s-]/)[0];
  const res = await drive.files.list({
    q: `mimeType='${DOSSIER}' and name contains '${echapper(nom)}' and trashed=false`,
    fields: 'files(id,name)',
    pageSize: 50,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const candidats = (res.data.files || []).filter(f => {
    const n = normaliser(f.name || '');
    return n.includes(normaliser(nom)) && n.includes(normaliser(premierPrenom));
  });

  const trouves: string[] = [];
  for (const c of candidats) {
    const enfants = await drive.files.list({
      q: `'${c.id}' in parents and mimeType='${DOSSIER}' and trashed=false`,
      fields: 'files(id,name)',
      pageSize: 50,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const e of enfants.data.files || []) {
      if (normaliser(e.name || '') === 'ASSIDUITE') { trouves.push(e.id!); continue; }
      const petitsEnfants = await drive.files.list({
        q: `'${e.id}' in parents and mimeType='${DOSSIER}' and name='ASSIDUITE' and trashed=false`,
        fields: 'files(id)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      for (const pe of petitsEnfants.data.files || []) trouves.push(pe.id!);
    }
  }
  return trouves.length === 1 ? trouves[0] : null;
}

/** Extrait l'identifiant d'un lien de dossier Drive collé par l'équipe (ou renvoie la saisie). */
export function idDepuisLienDrive(saisie: string): string {
  const m = saisie.match(/folders\/([A-Za-z0-9_-]+)/) || saisie.match(/[?&]id=([A-Za-z0-9_-]+)/);
  return m ? m[1] : saisie.trim();
}

/** Dépose (ou remplace, si un fichier du même nom existe déjà) un PDF dans un dossier Drive. */
export async function deposerPdf(dossierId: string, nomFichier: string, contenu: Buffer): Promise<{ id: string; url: string }> {
  const drive = driveService();
  const existant = await drive.files.list({
    q: `'${dossierId}' in parents and name='${echapper(nomFichier)}' and trashed=false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const media = { mimeType: 'application/pdf', body: Readable.from(contenu) };
  const idExistant = existant.data.files?.[0]?.id;

  const res = idExistant
    ? await drive.files.update({ fileId: idExistant, media, fields: 'id,webViewLink', supportsAllDrives: true })
    : await drive.files.create({
        requestBody: { name: nomFichier, parents: [dossierId], mimeType: 'application/pdf' },
        media,
        fields: 'id,webViewLink',
        supportsAllDrives: true,
      });
  return { id: res.data.id!, url: res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view` };
}

/** Sous-dossier « AAAA-MM » du dossier « États de présence à signer » (créé au besoin). */
export async function dossierASigner(annee: number, mois: number): Promise<string> {
  const racine = process.env.GOOGLE_DOSSIER_A_SIGNER_ID;
  if (!racine) throw new Error('GOOGLE_DOSSIER_A_SIGNER_ID non configuré');
  const nom = `${annee}-${String(mois).padStart(2, '0')}`;
  const drive = driveService();
  const res = await drive.files.list({
    q: `'${racine}' in parents and mimeType='${DOSSIER}' and name='${nom}' and trashed=false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  if (res.data.files?.[0]?.id) return res.data.files[0].id;
  const cree = await drive.files.create({
    requestBody: { name: nom, parents: [racine], mimeType: DOSSIER },
    fields: 'id',
    supportsAllDrives: true,
  });
  return cree.data.id!;
}

// ---------------------------------------------------------------------------
// Tableau « Gestion Assiduité » : X cliquable dans la colonne du mois,
// bloc « Etats de présence … pour les entreprises ».
// ---------------------------------------------------------------------------

type CacheOnglet = { sheetId: number; lignes: string[][] };

export async function lireOngletAssiduite(): Promise<CacheOnglet> {
  const id = process.env.GOOGLE_SHEET_ASSIDUITE_ID;
  const onglet = process.env.GOOGLE_SHEET_ASSIDUITE_ONGLET;
  if (!id || !onglet) throw new Error('GOOGLE_SHEET_ASSIDUITE_ID / _ONGLET non configurés');
  const sheets = sheetsService();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id, fields: 'sheets.properties' });
  const feuille = meta.data.sheets?.find(s => s.properties?.title === onglet);
  if (!feuille) throw new Error(`Onglet « ${onglet} » introuvable dans le tableau`);
  const val = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `'${onglet}'!A1:CZ600` });
  return { sheetId: feuille.properties!.sheetId!, lignes: (val.data.values || []) as string[][] };
}

/**
 * Écrit « X » avec le lien du PDF dans la cellule (apprenant × mois).
 * Le cache évite de relire l'onglet pour chaque apprenant d'un même lot.
 */
export async function ecrireLienDansTableau(
  cache: CacheOnglet,
  apprenant: { nom: string; prenom: string },
  annee: number,
  mois: number,
  url: string
): Promise<{ ok: boolean; raison?: string }> {
  const n = (s: string) => normaliser(s).replace(/[^A-Z]/g, '');
  const nAvecChiffres = (s: string) => normaliser(s).replace(/[^A-Z0-9]/g, '');
  const { lignes, sheetId } = cache;

  const iEntete = lignes.findIndex(l => l.some(c => n(c) === 'NOMDELAPPRENTI'));
  if (iEntete < 0) return { ok: false, raison: 'ligne d’en-tête « Nom de l’apprenti » introuvable' };
  const entete = lignes[iEntete];
  const colNom = entete.findIndex(c => n(c) === 'NOMDELAPPRENTI');
  const colPrenom = entete.findIndex(c => n(c) === 'PRENOMDELAPPRENTI');

  // Début du bloc « Etats de présence AAAA pour les entreprises » de la bonne année,
  // sur une ligne au-dessus de l'en-tête (cellules fusionnées)
  let colDebut = -1;
  for (let i = iEntete - 1; i >= 0 && colDebut < 0; i--) {
    colDebut = (lignes[i] || []).findIndex(c => nAvecChiffres(c).startsWith(`ETATSDEPRESENCE${annee}`));
  }
  if (colDebut < 0) return { ok: false, raison: `bloc « Etats de présence ${annee} » introuvable dans l’onglet` };

  const cible = n(apprenant.nom);
  const prenom1 = n((apprenant.prenom || '').split(/[\s-]/)[0]);
  const iLigne = lignes.findIndex((l, i) => i > iEntete && n(l[colNom] || '') === cible && n(l[colPrenom] || '').startsWith(prenom1));
  if (iLigne < 0) return { ok: false, raison: `${apprenant.prenom} ${apprenant.nom} absent(e) du tableau` };

  await sheetsService().spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ASSIDUITE_ID!,
    requestBody: {
      requests: [{
        updateCells: {
          range: { sheetId, startRowIndex: iLigne, endRowIndex: iLigne + 1, startColumnIndex: colDebut + mois - 1, endColumnIndex: colDebut + mois },
          rows: [{ values: [{ userEnteredValue: { stringValue: 'X' }, textFormatRuns: [{ startIndex: 0, format: { link: { uri: url } } }] }] }],
          fields: 'userEnteredValue,textFormatRuns',
        },
      }],
    },
  });
  return { ok: true };
}
