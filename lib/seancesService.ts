// lib/seancesService.ts
// Service pour charger "Mes séances" du formateur connecté
// en parcourant le planning des sessions Supabase

import { supabase } from './supabaseClient';

// ────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────

export type MaSeance = {
  // Date au format DD/MM/YYYY
  date: string;
  // Jour textuel (Lundi, Mardi, ...)
  jour: string;
  // Type de séance
  type: 'cours' | 'revision' | 'examen';
  // Semaine pédagogique
  semaine?: number;
  // Module pédagogique éventuel (ex: "AT2/CP6")
  module?: string;

  // Infos session enrichies
  sessionId: string;
  sessionNumero: string;
  formation: string;
  salle: string;

  // Si une feuille d'émargement existe déjà pour cette date + session
  feuilleEmargementId?: string;
};

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

// Convertit une date "DD/MM/YYYY" en Date JS (00:00 locale)
function parseFr(date: string): Date | null {
  const parts = date.split('/');
  if (parts.length !== 3) return null;
  const j = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const a = parseInt(parts[2], 10);
  if (isNaN(j) || isNaN(m) || isNaN(a)) return null;
  return new Date(a, m - 1, j);
}

// Retourne le nom du jour de la semaine pour une date "DD/MM/YYYY"
function jourSemaine(date: string): string {
  const d = parseFr(date);
  if (!d) return '';
  return ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][d.getDay()];
}

// ────────────────────────────────────────────────────────────────
// CHARGEMENT — Sessions où le formateur intervient
// ────────────────────────────────────────────────────────────────

export async function chargerMesSeances(formateurId: string): Promise<MaSeance[]> {
  if (!formateurId) return [];

  // 1. Récupérer le token Supabase pour fetch direct
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn('[seancesService] Pas de session Supabase active');
    return [];
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 2. Charger toutes les sessions actives ou à venir
  let sessions: any[] = [];
  try {
    const res = await fetch(`${url}/rest/v1/sessions?select=id,numero,formation,planning,salle&statut=neq.Archivé`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    if (!res.ok) {
      console.error('[seancesService] Erreur fetch sessions :', res.status);
      return [];
    }
    sessions = await res.json();
  } catch (e) {
    console.error('[seancesService] Exception fetch sessions :', e);
    return [];
  }

  // 3. Charger toutes les feuilles d'émargement (pour faire le lien session+date → feuille)
  let feuilles: any[] = [];
  try {
    const res = await fetch(`${url}/rest/v1/emargements?select=id,date,sessionIds,sessionId`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    if (res.ok) {
      feuilles = await res.json();
    }
  } catch (e) {
    console.warn('[seancesService] Erreur chargement feuilles (non bloquant) :', e);
  }

  // 4. Parcourir les sessions et extraire les entrées planning où ce formateur intervient
  const seances: MaSeance[] = [];

  sessions.forEach((s: any) => {
    if (!Array.isArray(s.planning)) return;

    s.planning.forEach((p: any) => {
      // On garde seulement les entrées où ce formateur est affecté
      if (p.formateurId !== formateurId) return;

      // Chercher s'il existe une feuille d'émargement pour cette session + date
      const feuilleMatch = feuilles.find((f: any) => {
        if (f.date !== p.date) return false;
        const ids = Array.isArray(f.sessionIds) ? f.sessionIds : [f.sessionId].filter(Boolean);
        return ids.includes(s.id);
      });

      seances.push({
        date: p.date,
        jour: jourSemaine(p.date),
        type: p.type,
        semaine: p.semaine,
        module: p.module,
        sessionId: s.id,
        sessionNumero: s.numero,
        formation: s.formation,
        salle: s.salle || 'À définir',
        feuilleEmargementId: feuilleMatch?.id,
      });
    });
  });

  // 5. Trier par date croissante
  seances.sort((a, b) => {
    const dA = parseFr(a.date)?.getTime() ?? 0;
    const dB = parseFr(b.date)?.getTime() ?? 0;
    return dA - dB;
  });

  console.log(`[seancesService] ${seances.length} séances trouvées pour formateur ${formateurId}`);
  return seances;
}

// ────────────────────────────────────────────────────────────────
// CHARGEMENT — IDs des feuilles d'émargement que le formateur peut voir
// (Utilisé sur /emargement pour filtrer les feuilles côté formateur)
// ────────────────────────────────────────────────────────────────

export async function chargerIdsFeuillesAccessibles(formateurId: string): Promise<string[]> {
  const seances = await chargerMesSeances(formateurId);
  const ids = seances
    .map(s => s.feuilleEmargementId)
    .filter((id): id is string => !!id);
  return Array.from(new Set(ids));
}

// ────────────────────────────────────────────────────────────────
// FILTRAGE TEMPOREL
// ────────────────────────────────────────────────────────────────

export type FiltreTemps = 'aujourd_hui' | 'a_venir' | 'passees' | 'toutes';

export function filtrerParTemps<T extends { date: string }>(seances: T[], filtre: FiltreTemps): T[] {
  const maintenant = new Date();
  const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());

  return seances.filter(s => {
    const d = parseFr(s.date);
    if (!d) return false;

    switch (filtre) {
      case 'aujourd_hui':
        return d.getTime() === aujourdhui.getTime();
      case 'a_venir':
        return d.getTime() >= aujourdhui.getTime();
      case 'passees':
        return d.getTime() < aujourdhui.getTime();
      case 'toutes':
      default:
        return true;
    }
  });
}
// ────────────────────────────────────────────────────────────────
// CHARGEMENT — Feuilles du formateur (1 feuille = 1 carte)
// Regroupe les séances partageant la même feuille. Les séances sans
// feuille générée ne sont pas affichées (le formateur ne voit que ce
// que l'administration a généré).
// ────────────────────────────────────────────────────────────────

export type MaFeuille = {
  feuilleId?: string;
  date: string;
  jour: string;
  type: 'cours' | 'revision' | 'examen';
  formation: string;
  salle: string;
  semaine?: number;
  module?: string;
  sessionNumeros: string[]; // toutes les sessions couvertes par la feuille
};

export async function chargerMesFeuilles(formateurId: string): Promise<MaFeuille[]> {
  const seances = await chargerMesSeances(formateurId);
  const cartes: MaFeuille[] = [];
  const parFeuille = new Map<string, MaFeuille>();

  for (const s of seances) {
    if (s.feuilleEmargementId) {
      // Séance couverte par une feuille → on regroupe (1 feuille = 1 carte)
      const existante = parFeuille.get(s.feuilleEmargementId);
      if (existante) {
        if (!existante.sessionNumeros.includes(s.sessionNumero)) {
          existante.sessionNumeros.push(s.sessionNumero);
        }
      } else {
        const carte: MaFeuille = {
          feuilleId: s.feuilleEmargementId,
          date: s.date,
          jour: s.jour,
          type: s.type,
          formation: s.formation,
          salle: s.salle,
          semaine: s.semaine,
          module: s.module,
          sessionNumeros: [s.sessionNumero],
        };
        parFeuille.set(s.feuilleEmargementId, carte);
        cartes.push(carte);
      }
    } else {
      // Séance planifiée sans feuille encore générée → aperçu (pas d'émargement)
      cartes.push({
        feuilleId: undefined,
        date: s.date,
        jour: s.jour,
        type: s.type,
        formation: s.formation,
        salle: s.salle,
        semaine: s.semaine,
        module: s.module,
        sessionNumeros: [s.sessionNumero],
      });
    }
  }

  return cartes.sort((a, b) => {
    const dA = parseFr(a.date)?.getTime() ?? 0;
    const dB = parseFr(b.date)?.getTime() ?? 0;
    return dA - dB;
  });
}