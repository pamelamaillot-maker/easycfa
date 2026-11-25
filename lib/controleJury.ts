// lib/controleJury.ts
// Règles DEETS du jury d'une session d'examen TP :
// - au moins 2 jurés confirmés ;
// - session TP complet : au moins 1 juré habilité sur le TP (valide à la date de la session),
//   le second peut être habilité sur un autre TP dont les CCP correspondent (vérification manuelle) ;
// - session CCP (rattrapage) : tous les jurés habilités sur le TP ;
// - déclaration de non-lien signée pour chaque juré ;
// - aucun juré ne travaille dans l'entreprise d'un candidat.

import { cleJure, type Jure } from '../data/juresSupabase';

export type Habilitation = { titre: string; dateFin?: string | null };

export type PointJury = { niveau: 'rouge' | 'orange'; texte: string };

export type EtatJure = {
  jureId: string;
  nomComplet: string;
  repertoire?: Jure & { habilitations?: Habilitation[] };
  habiliteTP: 'valide' | 'date_inconnue' | 'expiree' | 'non';
  autresTitres: string[];          // habilitations valides sur d'autres TP
  besoinCorrespondance: boolean;   // 2e juré habilité sur un autre TP : case à cocher
};

export type ResultatJury = { conforme: boolean; points: PointJury[]; jures: EtatJure[] };

function dateIso(d?: string | null): string | null {
  if (!d) return null;
  const t = String(d);
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const a = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${a}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return null;
}

function normEntreprise(s?: string | null): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    .replace(/\b(SARL|SAS|SASU|EURL|SA|SCI|ETS|STE)\b/g, '').replace(/[^A-Z0-9]/g, '');
}

function etatHabilitation(habs: Habilitation[], titre: string, dateSession: string | null): EtatJure['habiliteTP'] {
  const h = habs.find(x => x.titre === titre);
  if (!h) return 'non';
  const fin = dateIso(h.dateFin);
  if (!fin) return 'date_inconnue';
  if (dateSession && fin < dateSession) return 'expiree';
  return 'valide';
}

export function controlerJury(session: any, repertoire: (Jure & { habilitations?: Habilitation[] })[]): ResultatJury {
  const points: PointJury[] = [];
  const titre: string = session?.formation ?? '';
  const parCcp = session?.typeSession === 'ccp';
  const dateSession = dateIso(session?.dateDebut);
  const confirmes = (session?.jures ?? []).filter((j: any) => j?.confirme);

  const jures: EtatJure[] = confirmes.map((j: any) => {
    const rep = repertoire.find(r => cleJure(r.nom, r.prenom) === cleJure(j.nom ?? '', j.prenom ?? ''));
    const habs: Habilitation[] = Array.isArray(rep?.habilitations) ? rep!.habilitations! : [];
    const autres = habs.filter(h => h.titre !== titre && etatHabilitation(habs, h.titre, dateSession) !== 'expiree').map(h => h.titre);
    return {
      jureId: j.id,
      nomComplet: `${j.prenom ?? ''} ${j.nom ?? ''}`.trim(),
      repertoire: rep,
      habiliteTP: etatHabilitation(habs, titre, dateSession),
      autresTitres: autres,
      besoinCorrespondance: false,
    };
  });

  // 1. Nombre de jurés
  if (confirmes.length < 2) {
    points.push({ niveau: 'rouge', texte: `${confirmes.length} juré(s) confirmé(s) : il en faut au moins 2.` });
  }

  // 2. Habilitations
  const surTP = jures.filter(j => j.habiliteTP === 'valide' || j.habiliteTP === 'date_inconnue');
  if (parCcp) {
    for (const j of jures) {
      if (j.habiliteTP === 'non') points.push({ niveau: 'rouge', texte: `${j.nomComplet} n'est pas habilité(e) ${titre} : obligatoire pour une session CCP.` });
    }
  } else {
    if (jures.length > 0 && surTP.length === 0) {
      points.push({ niveau: 'rouge', texte: `Aucun juré habilité ${titre} : au moins un est obligatoire.` });
    }
    for (const j of jures) {
      if (j.habiliteTP === 'non') {
        if (j.autresTitres.length > 0 && surTP.length > 0) {
          j.besoinCorrespondance = true;
          const s = (session?.jures ?? []).find((x: any) => x.id === j.jureId);
          if (!s?.correspondanceVerifiee) {
            points.push({ niveau: 'orange', texte: `${j.nomComplet} est habilité(e) ${j.autresTitres.join(', ')} : vérifier la correspondance des CCP avec le TP ${titre}.` });
          }
        } else if (surTP.length > 0) {
          points.push({ niveau: 'rouge', texte: `${j.nomComplet} n'a aucune habilitation utilisable pour cette session.` });
        }
      }
    }
  }
  for (const j of jures) {
    if (j.habiliteTP === 'expiree') points.push({ niveau: 'rouge', texte: `Habilitation ${titre} de ${j.nomComplet} expirée à la date de la session.` });
    if (j.habiliteTP === 'date_inconnue') points.push({ niveau: 'orange', texte: `Date de validité de l'habilitation ${titre} de ${j.nomComplet} à saisir (répertoire des jurés).` });
    if (!j.repertoire) points.push({ niveau: 'orange', texte: `${j.nomComplet} est absent(e) du répertoire des jurés : habilitations inconnues.` });
  }

  // 3. Déclaration de non-lien
  for (const j of confirmes) {
    if (!j.nonLienSigne) points.push({ niveau: 'orange', texte: `Déclaration de non-lien de ${j.prenom ?? ''} ${j.nom ?? ''} non signée.` });
    else if (!j.nonLienUrl) points.push({ niveau: 'orange', texte: `Déclaration de non-lien de ${j.prenom ?? ''} ${j.nom ?? ''} : pièce jointe manquante.` });
  }

  // 4. Lien avec l'entreprise d'un candidat
  for (const j of jures) {
    const ent = normEntreprise(j.repertoire?.entreprise);
    if (!ent) continue;
    const c = (session?.candidats ?? []).find((c: any) => normEntreprise(c.entreprise) === ent);
    if (c) points.push({ niveau: 'rouge', texte: `${j.nomComplet} travaille chez ${j.repertoire?.entreprise}, entreprise de ${c.prenom ?? ''} ${c.nom ?? ''}.` });
  }

  return { conforme: !points.some(p => p.niveau === 'rouge') && confirmes.length >= 2, points, jures };
}
