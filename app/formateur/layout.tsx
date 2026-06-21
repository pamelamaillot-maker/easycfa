'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../../lib/UserContext';
import { COLORS } from '../../lib/constants';
import SidebarFormateur from '../../components/SidebarFormateur';

const ROUTES_PUBLIQUES = ['/formateur/connexion', '/formateur/reset'];

type MenuItem = {
  label: string;
  href: string;
  icon: string;
};

const MENU_ITEMS: MenuItem[] = [
  { label: 'Tableau de bord', href: '/formateur', icon: '🏠' },
  { label: 'Mes séances', href: '/formateur/seances', icon: '📅' },
  { label: "Fiches d'intervention", href: '/formateur/fiches', icon: '📝' },
  { label: 'Historique', href: '/formateur/historique', icon: '📚' },
  { label: 'Ressources', href: '/formateur/ressources', icon: '📁' },
  { label: 'Mon profil', href: '/formateur/profil', icon: '👤' },
];

export default function FormateurLayout({ children }: { children: React.ReactNode }) {
  const { utilisateur, chargement, deconnecter } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const estRoutePublique = ROUTES_PUBLIQUES.some((r) => pathname === r || pathname.startsWith(r + '/'));

  useEffect(() => {
    if (chargement) return;
    if (!utilisateur && !estRoutePublique) {
      router.push('/formateur/connexion');
      return;
    }
    if (utilisateur && !estRoutePublique && utilisateur.role !== 'formateur' && !utilisateur.formateurId) {
      router.push('/');
      return;
    }
    if (utilisateur && utilisateur.role === 'formateur' && pathname === '/formateur/connexion') {
      router.push('/formateur');
      return;
    }
  }, [utilisateur, chargement, pathname, estRoutePublique, router]);

  async function handleDeconnecter() {
    await deconnecter();
    router.push('/formateur/connexion');
  }

  function estItemActif(href: string): boolean {
    if (href === '/formateur') return pathname === '/formateur';
    return pathname === href || pathname.startsWith(href + '/');
  }

  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: COLORS.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, color: COLORS.primary, fontWeight: 600 }}>⏳ Chargement...</div>
      </div>
    );
  }

  if (estRoutePublique) {
    return <>{children}</>;
  }

  if (!utilisateur || (utilisateur.role !== 'formateur' && !utilisateur.formateurId)) {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: COLORS.background }}>

      {/* SIDEBAR FORMATEUR */}
      <SidebarFormateur />

      {/* CONTENU PRINCIPAL */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {children}
      </main>

    </div>
  );
}