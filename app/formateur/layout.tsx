'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../../lib/UserContext';
import { COLORS } from '../../lib/constants';

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
    if (utilisateur && !estRoutePublique && utilisateur.role !== 'formateur') {
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

  if (!utilisateur || utilisateur.role !== 'formateur') {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: COLORS.background }}>

      {/* SIDEBAR FORMATEUR */}
      <aside style={{ width: 240, minHeight: '100vh', backgroundColor: COLORS.primary, display: 'flex', flexDirection: 'column' }}>

        {/* En-tête : Logo + nom espace */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
          <img src="/logo-pamoi.png" alt="PAM OI" style={{ height: 48, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <div style={{ marginTop: 8 }}>
            <div style={{ color: COLORS.secondary, fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>
              Easy<span style={{ color: 'white' }}>CFA</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>Espace Formateur</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '14px 0', overflowY: 'auto' }}>
          {MENU_ITEMS.map((item) => {
            const isActive = estItemActif(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 20px',
                  fontSize: 13,
                  borderLeft: isActive ? `3px solid ${COLORS.secondary}` : '3px solid transparent',
                  color: isActive ? COLORS.secondary : 'rgba(255,255,255,0.85)',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Pied de sidebar : utilisateur + déconnexion */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ backgroundColor: COLORS.secondary, color: 'white', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {(utilisateur.prenom?.[0] || '') + (utilisateur.nom?.[0] || '')}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {utilisateur.prenom} {utilisateur.nom}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Formateur</div>
            </div>
          </div>
          <button
            onClick={handleDeconnecter}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: 7,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🚪 Se déconnecter
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {children}
      </main>

    </div>
  );
}