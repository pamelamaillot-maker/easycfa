// lib/etatPresenceCalcul.ts
// Calcul de l'état de présence mensuel d'un apprenant, à partir des feuilles
// d'émargement. Mêmes règles que la page /emargement/mensuel, sans React :
// utilisable côté serveur (cron) comme côté client.

import type { Emargement } from '../data/emargementsSupabase';

export const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export type SeanceEtat = {
  date: string;
  demiJournee: string;
  theme: string;
  statut: string;
  heures: number;
  heureArrivee?: string;
  justificatif: boolean;
};

export type EtatPresenceCalcule = {
  apprenantId: string;
  nom: string;
  prenom: string;
  emailApprenant: string;
  entreprise: string;
  emailEntreprise: string;
  formation: string;
  session: string;
  mois: string; // « Novembre 2026 »
  heuresPrevues: number;
  heuresRealisees: number;
  heuresAbsence: number;
  tauxPresence: number;
  tauxAbsence: number;
  seancesNonSaisies: number;
  seances: SeanceEtat[];
};

/** "JJ/MM/AAAA" → { jour, mois, annee } */
export function lireDateFr(date: string | undefined | null): { jour: number; mois: number; annee: number } | null {
  if (!date) return null;
  const p = date.split('/');
  if (p.length !== 3) return null;
  const jour = parseInt(p[0], 10);
  const mois = parseInt(p[1], 10);
  const annee = parseInt(p[2], 10);
  if (isNaN(jour) || isNaN(mois) || isNaN(annee)) return null;
  return { jour, mois, annee };
}

const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Date du jour à La Réunion (UTC+4), au format JJ/MM/AAAA. */
export function aujourdhuiReunion(): string {
  const d = new Date(Date.now() + 4 * 3600 * 1000);
  const jj = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${jj}/${mm}/${d.getUTCFullYear()}`;
}

/**
 * Dernier jour de formation d'une session pour un mois donné, d'après son planning
 * (cours, révision, examen). Renvoie "JJ/MM/AAAA" ou null si aucun jour ce mois-ci.
 */
export function dernierJourFormationDuMois(
  planning: Array<{ date?: string; type?: string }> | null | undefined,
  annee: number,
  mois: number
): string | null {
  let meilleur: { jour: number; date: string } | null = null;
  for (const j of planning || []) {
    const d = lireDateFr(j.date);
    if (!d || d.annee !== annee || d.mois !== mois) continue;
    if (!meilleur || d.jour > meilleur.jour) meilleur = { jour: d.jour, date: j.date! };
  }
  return meilleur ? meilleur.date : null;
}

/** La feuille appartient-elle à la session (numéro ou id, y compris feuilles fusionnées) ? */
export function feuilleDeLaSession(f: Emargement, session: { id: string; numero?: string | null }): boolean {
  if (session.numero && f.sessionNumero === session.numero) return true;
  if (f.sessionId === session.id) return true;
  return Array.isArray(f.sessionIds) && f.sessionIds.includes(session.id);
}

/**
 * Calcule les états de présence du mois pour les apprenants présents sur les feuilles fournies.
 * @param feuilles feuilles d'émargement (déjà filtrées sur la session si besoin)
 */
export function calculerEtatsDuMois(feuilles: Emargement[], annee: number, mois: number): EtatPresenceCalcule[] {
  const parApprenant = new Map<string, EtatPresenceCalcule>();
  const libelleMois = `${MOIS_NOMS[mois - 1]} ${annee}`;

  const duMois = feuilles
    .filter(f => {
      const d = lireDateFr(f.date);
      return !!d && d.mois === mois && d.annee === annee;
    })
    .sort((a, b) => (lireDateFr(a.date)!.jour - lireDateFr(b.date)!.jour));

  for (const feuille of duMois) {
    for (const dj of feuille.demiJournees || []) {
      for (const p of dj.presences || []) {
        if (!p.apprenantId) continue;
        let e = parApprenant.get(p.apprenantId);
        if (!e) {
          e = {
            apprenantId: p.apprenantId,
            nom: p.nom || '',
            prenom: p.prenom || '',
            emailApprenant: p.emailApprenant || '',
            entreprise: p.entreprise || '',
            emailEntreprise: p.emailEntreprise || '',
            formation: feuille.formation || '',
            session: feuille.sessionNumero || '',
            mois: libelleMois,
            heuresPrevues: 0,
            heuresRealisees: 0,
            heuresAbsence: 0,
            tauxPresence: 0,
            tauxAbsence: 0,
            seancesNonSaisies: 0,
            seances: [],
          };
          parApprenant.set(p.apprenantId, e);
        }
        const prevues = dj.heures || 0;
        const reelles = p.heuresComptees || 0;
        e.heuresPrevues += prevues;
        e.heuresRealisees += reelles;
        if (p.statut === 'Absent' || p.statut === 'Retard') e.heuresAbsence += prevues - reelles;
        if (!p.statut) e.seancesNonSaisies += 1;
        e.seances.push({
          date: feuille.date || '',
          demiJournee: dj.type || '',
          theme: dj.theme || '',
          statut: p.statut || 'Non saisi',
          heures: reelles,
          heureArrivee: p.heureArrivee,
          justificatif: !!p.justificatifRecu,
        });
      }
    }
  }

  const liste = Array.from(parApprenant.values());
  for (const e of liste) {
    e.heuresPrevues = arrondi(e.heuresPrevues);
    e.heuresRealisees = arrondi(e.heuresRealisees);
    e.heuresAbsence = arrondi(e.heuresAbsence);
    e.tauxPresence = e.heuresPrevues > 0 ? Math.round((e.heuresRealisees / e.heuresPrevues) * 100) : 0;
    e.tauxAbsence = 100 - e.tauxPresence;
  }
  return liste.sort((a, b) => a.nom.localeCompare(b.nom));
}

/** Nom de fichier triable et facile à retrouver dans Drive. */
export function nomFichierEtat(nom: string, prenom: string, annee: number, mois: number): string {
  const propre = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9-]+/g, '_').replace(/^_|_$/g, '');
  return `Etat_Presence_${propre(nom).toUpperCase()}_${propre(prenom)}_${annee}-${String(mois).padStart(2, '0')}.pdf`;
}
