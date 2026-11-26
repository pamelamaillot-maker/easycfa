// lib/genererEtatsPresence.ts — CÔTÉ SERVEUR UNIQUEMENT
//
// Circuit :
//  1. genererEtatsSession  (cron, le soir du dernier jour de formation du mois)
//     calcul → PDF → dossier Drive « États de présence à signer / AAAA-MM » → statut a_signer
//  2. L'équipe envoie les PDF sur sign.plus (apprenant, tuteur, PAM OI).
//  3. importerEtatSigne  (l'équipe importe le PDF signé dans EasyCFA)
//     → dossier ASSIDUITE de l'apprenant → X cliquable dans le tableau → statut signe

import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';
import PdfEtatPresenceMensuel from '../components/PdfEtatPresenceMensuel';
import type { Emargement } from '../data/emargementsSupabase';
import { calculerEtatsDuMois, feuilleDeLaSession, nomFichierEtat } from './etatPresenceCalcul';
import { trouverDossierAssiduite, deposerPdf, dossierASigner, lireOngletAssiduite, ecrireLienDansTableau } from './googleCompteService';

export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type ResultatGeneration = {
  apprenant: string;
  statut: 'ok' | 'erreur' | 'deja_signe' | 'existant';
  detail?: string;
};

/** Retrouve (et mémorise sur la fiche) le dossier ASSIDUITE de l'apprenant. */
async function dossierAssiduiteDe(sb: ReturnType<typeof supabaseAdmin>, fiche: any): Promise<string | null> {
  if (fiche.dossierAssiduiteDriveId) return fiche.dossierAssiduiteDriveId;
  const id = await trouverDossierAssiduite(fiche.nom || '', fiche.prenom || '');
  if (id) await sb.from('apprenants').update({ dossierAssiduiteDriveId: id }).eq('id', fiche.id);
  return id;
}

export async function genererEtatsSession(opts: {
  session: { id: string; numero?: string | null };
  annee: number;
  mois: number;
  /** true = régénère aussi les états déjà signés (rattrapage manuel) */
  forcer?: boolean;
  /** limite à un seul apprenant (bouton « Régénérer » d'une ligne) */
  apprenantId?: string;
  /** true = ne génère que les états absents ou en erreur (reprise après coupure) */
  seulementManquants?: boolean;
  /** adresse du site, pour le logo du PDF */
  origine: string;
}): Promise<ResultatGeneration[]> {
  const sb = supabaseAdmin();
  const mm = String(opts.mois).padStart(2, '0');

  const { data: feuilles, error } = await sb.from('emargements').select('*').like('date', `%/${mm}/${opts.annee}`);
  if (error) throw new Error(`Lecture émargements : ${error.message}`);
  const feuillesSession = ((feuilles || []) as Emargement[]).filter(f => feuilleDeLaSession(f, opts.session));

  let etats = calculerEtatsDuMois(feuillesSession, opts.annee, opts.mois);
  if (opts.apprenantId) etats = etats.filter(e => e.apprenantId === opts.apprenantId);
  if (etats.length === 0) return [];

  const ids = etats.map(e => e.apprenantId);
  const [{ data: apprenants }, { data: existants }] = await Promise.all([
    sb.from('apprenants').select('id,nom,prenom,entreprise,"tuteurNom","tuteurPrenom","dossierAssiduiteDriveId"').in('id', ids),
    sb.from('etats_presence').select('id,statut').in('id', ids.map(id => `${id}_${opts.annee}-${mm}`)),
  ]);

  const dossierBrouillons = await dossierASigner(opts.annee, opts.mois);
  const resultats: ResultatGeneration[] = [];

  for (const etat of etats) {
    const idEtat = `${etat.apprenantId}_${opts.annee}-${mm}`;
    const libelle = `${etat.prenom} ${etat.nom}`;
    const deja = (existants || []).find((x: any) => x.id === idEtat);
    if (deja?.statut === 'signe' && !opts.forcer) {
      resultats.push({ apprenant: libelle, statut: 'deja_signe' });
      continue;
    }
    if (deja && deja.statut !== 'erreur' && opts.seulementManquants) {
      resultats.push({ apprenant: libelle, statut: 'existant' });
      continue;
    }

    const fiche: any = (apprenants || []).find((a: any) => a.id === etat.apprenantId) || { id: etat.apprenantId, nom: etat.nom, prenom: etat.prenom };
    const nomEntreprise = fiche.entreprise || etat.entreprise;
    const tuteur = [fiche.tuteurPrenom, fiche.tuteurNom].filter(Boolean).join(' ');
    const nomFichier = nomFichierEtat(etat.nom, etat.prenom, opts.annee, opts.mois);

    const ligne: Record<string, any> = {
      id: idEtat,
      apprenantId: etat.apprenantId,
      annee: opts.annee,
      mois: opts.mois,
      sessionNumero: etat.session,
      entreprise: nomEntreprise,
      heuresPrevues: etat.heuresPrevues,
      heuresRealisees: etat.heuresRealisees,
      heuresAbsence: etat.heuresAbsence,
      tauxPresence: etat.tauxPresence,
      seancesNonSaisies: etat.seancesNonSaisies,
      nomFichier,
      statut: 'a_signer',
      erreur: null,
      dateGeneration: new Date().toISOString(),
      driveFileId: null,
      driveUrl: null,
      lienSheets: false,
      dateImportSigne: null,
      importePar: null,
    };

    try {
      const pdf = await renderToBuffer(
        createElement(PdfEtatPresenceMensuel, {
          apprenant: { nom: etat.nom, prenom: etat.prenom, email: etat.emailApprenant },
          entreprise: { nom: nomEntreprise, email: '', tuteur },
          formation: etat.formation,
          session: etat.session,
          mois: etat.mois,
          heuresPrevues: etat.heuresPrevues,
          heuresRealisees: etat.heuresRealisees,
          heuresAbsence: etat.heuresAbsence,
          tauxPresence: etat.tauxPresence,
          tauxAbsence: etat.tauxAbsence,
          seances: etat.seances,
          logoSrc: `${opts.origine}/logo-pamoi.png`,
        }) as any
      );
      const brouillon = await deposerPdf(dossierBrouillons, nomFichier, pdf);
      ligne.brouillonUrl = brouillon.url;

      // Vérifié dès maintenant pour que l'équipe corrige avant l'import du signé
      const dossier = await dossierAssiduiteDe(sb, fiche);
      if (!dossier) ligne.erreur = 'Dossier Drive ASSIDUITE introuvable — collez son lien ci-dessous';

      resultats.push({ apprenant: libelle, statut: 'ok', detail: ligne.erreur || undefined });
    } catch (e: any) {
      ligne.statut = 'erreur';
      ligne.erreur = e.message;
      resultats.push({ apprenant: libelle, statut: 'erreur', detail: e.message });
    }

    const { error: errUpsert } = await sb.from('etats_presence').upsert(ligne);
    if (errUpsert) console.error('[etats-presence] upsert', idEtat, errUpsert.message);
  }

  return resultats;
}

/** Range le PDF signé dans ASSIDUITE, écrit le lien dans le tableau, passe l'état à « signé ». */
export async function importerEtatSigne(idEtat: string, pdfSigne: Buffer, auteur: string): Promise<{ ok: boolean; detail?: string }> {
  const sb = supabaseAdmin();
  const { data: etat } = await sb.from('etats_presence').select('*').eq('id', idEtat).single();
  if (!etat) return { ok: false, detail: 'État introuvable' };
  const { data: fiche } = await sb.from('apprenants').select('id,nom,prenom,"dossierAssiduiteDriveId"').eq('id', etat.apprenantId).single();
  if (!fiche) return { ok: false, detail: 'Apprenant introuvable' };

  const dossier = await dossierAssiduiteDe(sb, fiche);
  if (!dossier) {
    await sb.from('etats_presence').update({ erreur: 'Dossier Drive ASSIDUITE introuvable — collez son lien ci-dessous' }).eq('id', idEtat);
    return { ok: false, detail: 'Dossier ASSIDUITE introuvable' };
  }

  const fichier = await deposerPdf(dossier, etat.nomFichier, pdfSigne);
  const maj: Record<string, any> = {
    statut: 'signe', driveFileId: fichier.id, driveUrl: fichier.url,
    dateImportSigne: new Date().toISOString(), importePar: auteur, erreur: null, lienSheets: false,
  };
  try {
    const onglet = await lireOngletAssiduite();
    const r = await ecrireLienDansTableau(onglet, { nom: fiche.nom, prenom: fiche.prenom }, etat.annee, etat.mois, fichier.url);
    maj.lienSheets = r.ok;
    if (!r.ok) maj.erreur = `Tableau : ${r.raison}`;
  } catch (e: any) {
    maj.erreur = `Tableau : ${e.message}`;
  }
  await sb.from('etats_presence').update(maj).eq('id', idEtat);
  return { ok: true, detail: maj.erreur || undefined };
}
