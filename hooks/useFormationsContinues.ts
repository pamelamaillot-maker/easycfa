// hooks/useFormationsContinues.ts
// Persistance localStorage pour le module Indicateur 22
// CFA PAM OI Formation

import { useState, useEffect, useCallback } from 'react';
import { FormationContinue } from '../types/formationContinue';

const STORAGE_KEY = 'easycfa_formations_continues_v1';

function loadFromStorage(): FormationContinue[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Erreur lecture localStorage formations continues:', e);
    return [];
  }
}

function saveToStorage(formations: FormationContinue[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formations));
  } catch (e) {
    // Quota dépassé (probable avec beaucoup de PDF en base64)
    console.error('Erreur sauvegarde localStorage:', e);
    alert(
      "⚠️ Espace de stockage saturé.\n" +
      "Astuce : exportez vos données en PDF puis supprimez les justificatifs anciens.\n" +
      "Vous pouvez aussi utiliser Sauvegarder/Restaurer (JSON) depuis les Paramètres."
    );
    throw e;
  }
}

export function useFormationsContinues(formateurId?: string) {
  const [formations, setFormations] = useState<FormationContinue[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFormations(loadFromStorage());
    setLoaded(true);
  }, []);

  // Filtre par formateur si demandé
  const formationsFiltrees = formateurId
    ? formations.filter((f) => f.formateurId === formateurId)
    : formations;

  const ajouter = useCallback((nouvelle: Omit<FormationContinue, 'id' | 'dateCreation' | 'dateModification'>) => {
    const now = new Date().toISOString();
    const f: FormationContinue = {
      ...nouvelle,
      id: `fc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      dateCreation: now,
      dateModification: now,
    };
    setFormations((prev) => {
      const next = [...prev, f];
      saveToStorage(next);
      return next;
    });
    return f;
  }, []);

  const modifier = useCallback((id: string, patch: Partial<FormationContinue>) => {
    setFormations((prev) => {
      const next = prev.map((f) =>
        f.id === id
          ? { ...f, ...patch, id: f.id, dateModification: new Date().toISOString() }
          : f
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  const supprimer = useCallback((id: string) => {
    setFormations((prev) => {
      const next = prev.filter((f) => f.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const supprimerJustificatif = useCallback((id: string) => {
    setFormations((prev) => {
      const next = prev.map((f) =>
        f.id === id
          ? { ...f, justificatif: undefined, dateModification: new Date().toISOString() }
          : f
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  return {
    formations: formationsFiltrees,
    toutesFormations: formations,
    loaded,
    ajouter,
    modifier,
    supprimer,
    supprimerJustificatif,
  };
}
