// lib/conflitsResponsables.ts
// Règle DEETS : le responsable de session, son suppléant et le surveillant
// ne doivent jamais avoir été formateurs du groupe évalué.
// Sources des formateurs du groupe : planning des sessions de formation,
// feuilles d'émargement, fiches d'intervention.

import { normaliserNom } from './calculBpfCadreF';
import type { ResponsableSession } from '../data/responsablesSessionSupabase';

export type SourceFormateur = 'planning' | 'émargement' | 'intervention';

export type FormateurDuGroupe = {
  nom: string;               // tel qu'écrit dans la source
  formateurId?: string;
  source: SourceFormateur;
  date?: string;             // première date trouvée
  sessionNumero?: string;
};

export type Conflit = {
  role: 'titulaire' | 'suppleant' | 'surveillant';
  personne: string;          // « Prénom NOM »
  preuve: FormateurDuGroupe;
};

export type ResultatControle = {
  sessionsFormationIds: string[];
  formateurs: FormateurDuGroupe[];
  conflits: Conflit[];
  verifiable: boolean;       // faux si aucun groupe de formation n'a pu être retrouvé
};

/** Clé de comparaison indépendante de l'ordre prénom / nom et des accents */
function cleNom(texte?: string | null): string {
  return normaliserNom(texte).split(' ').filter(Boolean).sort().join(' ');
}

/** Retrouve les sessions de formation des candidats d'une session d'examen */
export function sessionsDuGroupe(examen: any, apprenants: any[], sessionsFormation: any[]): string[] {
  const ids = new Set<string>();
  if (examen?.sessionFormationId) ids.add(String(examen.sessionFormationId));
  const candidatsIds = new Set<string>(
    (examen?.candidats ?? []).map((c: any) => c?.apprenantId).filter(Boolean).map(String),
  );
  for (const a of apprenants) {
    if (candidatsIds.has(String(a.id)) && a.sessionId) ids.add(String(a.sessionId));
  }
  for (const s of sessionsFormation) {
    if ((s.apprenantIds ?? []).some((id: any) => candidatsIds.has(String(id)))) ids.add(String(s.id));
  }
  return [...ids];
}

/** Liste dédoublonnée des formateurs ayant formé ces sessions */
export function formateursDuGroupe(
  sessionIds: string[],
  sessionsFormation: any[],
  emargements: any[],
  interventions: any[],
): FormateurDuGroupe[] {
  const ids = new Set(sessionIds);
  const vus = new Map<string, FormateurDuGroupe>();
  const ajouter = (f: FormateurDuGroupe) => {
    const cle = f.formateurId ? 'id:' + f.formateurId : 'nom:' + cleNom(f.nom);
    if (!cleNom(f.nom) && !f.formateurId) return;
    if (!vus.has(cle)) vus.set(cle, f);
  };

  for (const s of sessionsFormation) {
    if (!ids.has(String(s.id))) continue;
    for (const p of (s.planning ?? [])) {
      if (p?.type === 'examen') continue;
      if (p?.formateurNom || p?.formateurId) {
        ajouter({ nom: p.formateurNom ?? '', formateurId: p.formateurId, source: 'planning', date: p.date, sessionNumero: s.numero });
      }
    }
  }
  for (const e of emargements) {
    const liees = [e.sessionId, ...(e.sessionIds ?? [])].filter(Boolean).map(String);
    if (!liees.some(id => ids.has(id))) continue;
    for (const dj of (e.demiJournees ?? [])) {
      if (dj?.formateur) ajouter({ nom: dj.formateur, source: 'émargement', date: e.date, sessionNumero: e.sessionNumero });
    }
  }
  for (const i of interventions) {
    if (!ids.has(String(i.sessionId))) continue;
    if (i.formateurNom || i.formateurId) {
      ajouter({ nom: i.formateurNom ?? '', formateurId: i.formateurId, source: 'intervention', date: i.date, sessionNumero: i.sessionNumero });
    }
  }
  return [...vus.values()];
}

/** Compare les personnes désignées avec les formateurs du groupe */
export function controlerConflits(
  examen: any,
  responsables: ResponsableSession[],
  apprenants: any[],
  sessionsFormation: any[],
  emargements: any[],
  interventions: any[],
): ResultatControle {
  const sessionIds = sessionsDuGroupe(examen, apprenants, sessionsFormation);
  const formateurs = formateursDuGroupe(sessionIds, sessionsFormation, emargements, interventions);
  const designations: { role: Conflit['role']; id?: string | null }[] = [
    { role: 'titulaire', id: examen?.responsableTitulaireId },
    { role: 'suppleant', id: examen?.responsableSuppleantId },
    { role: 'surveillant', id: examen?.surveillantId },
  ];
  const conflits: Conflit[] = [];
  for (const d of designations) {
    const r = responsables.find(x => x.id === d.id);
    if (!r) continue;
    const cleR = cleNom(`${r.prenom} ${r.nom}`);
    const preuve = formateurs.find(f =>
      (r.formateurId && f.formateurId === r.formateurId) || (cleR && cleNom(f.nom) === cleR));
    if (preuve) conflits.push({ role: d.role, personne: `${r.prenom} ${r.nom}`, preuve });
  }
  return { sessionsFormationIds: sessionIds, formateurs, conflits, verifiable: sessionIds.length > 0 };
}

export const LIBELLE_ROLE_COURT: Record<Conflit['role'], string> = {
  titulaire: 'responsable de session',
  suppleant: 'responsable suppléant',
  surveillant: 'surveillant',
};
