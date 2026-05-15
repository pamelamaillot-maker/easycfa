import { useUser } from './UserContext';
import { ACCES_PAR_ROLE as ACCES_DEFAUT } from '../data/mockUtilisateurs';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'easycfa_acces_par_role';

// Helper : récupère la config d'accès depuis localStorage ou fallback sur la config par défaut
export function getAccesParRole(): Record<string, string[]> {
  if (typeof window === 'undefined') return ACCES_DEFAUT;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Sécurité : on s'assure que l'admin garde toujours tout, sinon on tombe sur le défaut
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.admin)) {
        return parsed;
      }
    }
  } catch {}
  return ACCES_DEFAUT;
}

// Helper : sauvegarde la config d'accès
export function setAccesParRole(config: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  // Sécurité : l'admin doit toujours tout avoir, on force au cas où
  const safeConfig = { ...config, admin: ACCES_DEFAUT.admin };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConfig));
  // On dispatch un événement pour que les autres composants se mettent à jour
  window.dispatchEvent(new Event('easycfa_acces_change'));
}

export function resetAccesParRole() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('easycfa_acces_change'));
}

/**
 * ✅ NOUVEAU — Trace une action sensible dans l'historique pour conformité Qualiopi/RGPD/DEETS.
 *
 * Utilise cette fonction depuis n'importe quel composant pour tracer :
 * - Suppressions (apprenants, entreprises, formateurs, etc.)
 * - Modifications critiques (contrats, ruptures, etc.)
 * - Toute action engageant le CFA
 *
 * L'historique est consultable via la clé localStorage `easycfa_acces_historique`.
 *
 * Exemple d'usage :
 *   tracerAction('SUPPRESSION', 'apprenant', 'MAIPA_001', 'MAILLOT Paméla', utilisateur);
 */
export function tracerAction(
  action: string,
  type: string,
  id: string,
  libelle: string,
  utilisateur: { identifiant?: string; nom?: string; prenom?: string } | null | undefined,
) {
  if (typeof window === 'undefined') return;
  try {
    const historique = JSON.parse(localStorage.getItem('easycfa_acces_historique') || '[]');
    historique.push({
      date: new Date().toISOString(),
      action,
      type,
      id,
      libelle,
      utilisateur: utilisateur?.identifiant ?? 'inconnu',
      nomUtilisateur: utilisateur ? `${utilisateur.prenom ?? ''} ${utilisateur.nom ?? ''}`.trim() : 'inconnu',
    });
    localStorage.setItem('easycfa_acces_historique', JSON.stringify(historique));
  } catch (err) {
    console.error('Erreur traçage historique:', err);
  }
}

export function useAcces() {
  const { utilisateur } = useUser();
  const role = utilisateur?.role ?? 'lecteur';
  const [accesConfig, setAccesConfig] = useState<Record<string, string[]>>(() => getAccesParRole());

  useEffect(() => {
    function handler() {
      setAccesConfig(getAccesParRole());
    }
    window.addEventListener('easycfa_acces_change', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('easycfa_acces_change', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const accesPages = accesConfig[role] ?? ['/'];

  return {
    estAdmin: role === 'admin',
    estPedagogique: role === 'pedagogique' || role === 'admin',
    estComptable: role === 'comptable' || role === 'admin',
    estFormateur: role === 'formateur',
    estLecteur: role === 'lecteur',
    peutModifier: role === 'admin' || role === 'pedagogique' || role === 'comptable',
    // ✅ NOUVEAU — Suppression réservée à l'admin (= PAMA uniquement)
    // Garde-fou métier : Qualiopi/DEETS imposent une responsabilité claire
    // sur les données du CFA. Une seule personne autorisée à supprimer
    // évite les fausses manipulations par les collaborateurs.
    peutSupprimer: role === 'admin',
    peutAccederQualiopi: role === 'admin',
    peutAccederBPF: accesPages.includes('/bpf'),
    peutAccederFacturation: accesPages.includes('/precomptabilite'),
    peutGererUtilisateurs: role === 'admin',
    aAcces: (page: string) => accesPages.some(p => page === p || page.startsWith(p + '/') || page.startsWith(p)),
    utilisateur,
    role,
  };
}
