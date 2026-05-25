'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '../../lib/UserContext';
import { COLORS } from '../../lib/constants';

// Routes publiques formateur (accessibles sans connexion)
const ROUTES_PUBLIQUES = ['/formateur/connexion', '/formateur/reset'];

export default function FormateurLayout({ children }: { children: React.ReactNode }) {
  const { utilisateur, chargement } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const estRoutePublique = ROUTES_PUBLIQUES.some(r => pathname === r || pathname.startsWith(r + '/'));

  useEffect(() => {
    if (chargement) return;

    // Route privée /formateur/* sans utilisateur → /login (page commune, choix produit)
    if (!utilisateur && !estRoutePublique) {
      router.push('/login');
      return;
    }

    // Utilisateur connecté qui n'est PAS formateur sur une route privée → /
    if (utilisateur && !estRoutePublique && utilisateur.role !== 'formateur') {
      router.push('/');
      return;
    }

    // Formateur déjà connecté qui arrive sur /formateur/connexion → dashboard
    if (utilisateur && utilisateur.role === 'formateur' && pathname === '/formateur/connexion') {
      router.push('/formateur');
      return;
    }
  }, [utilisateur, chargement, pathname, estRoutePublique, router]);

  // Spinner pendant le chargement de la session Supabase
  if (chargement) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: COLORS.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: COLORS.primary, fontWeight: 600 }}>⏳ Chargement...</div>
      </div>
    );
  }

  // Routes publiques : on rend directement le contenu (pas de sidebar)
  if (estRoutePublique) {
    return <>{children}</>;
  }

  // Routes privées : utilisateur doit être un formateur
  if (!utilisateur || utilisateur.role !== 'formateur') {
    return null;
  }

  // Sidebar formateur (épurée, sera enrichie en Phase 4)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: COLORS.background }}>
      <aside style={{ width: 240, minHeight: '100vh', backgroundColor: COLORS.primary, color: 'white', padding: '24px 16px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ color: COLORS.secondary, fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>
            Easy<span style={{ color: 'white' }}>CFA</span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Espace Formateur</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Phase 4 remplira ces liens — pour l'instant placeholders */}
          <div style={{ padding: '8px 12px', fontSize: 13, opacity: 0.5 }}>🏠 Tableau de bord</div>
          <div style={{ padding: '8px 12px', fontSize: 13, opacity: 0.5 }}>📅 Mes séances</div>
          <div style={{ padding: '8px 12px', fontSize: 13, opacity: 0.5 }}>📝 Fiches d'intervention</div>
          <div style={{ padding: '8px 12px', fontSize: 13, opacity: 0.5 }}>📚 Historique</div>
          <div style={{ padding: '8px 12px', fontSize: 13, opacity: 0.5 }}>📁 Ressources</div>
          <div style={{ padding: '8px 12px', fontSize: 13, opacity: 0.5 }}>👤 Mon profil</div>
        </nav>

        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, fontSize: 11, opacity: 0.6 }}>
          {utilisateur.prenom} {utilisateur.nom}<br />
          <span style={{ fontSize: 10 }}>Formateur</span>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}