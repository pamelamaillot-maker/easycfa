'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '../lib/UserContext';
import { useAcces } from '../lib/useAcces';
import { COLORS } from '../lib/constants';

type MenuItem = {
  label: string;
  href: string;
  icon: string;
};

type Categorie = {
  titre: string;
  items: MenuItem[];
};

const CATEGORIES: Categorie[] = [
  {
    titre: 'ADMINISTRATIF',
    items: [
      { label: 'Apprenants', href: '/apprenants', icon: '🎓' },
      { label: 'Entreprises', href: '/entreprises', icon: '🏢' },
      { label: 'Formateurs', href: '/formateurs', icon: '👨‍🏫' },
      { label: 'Recrutement', href: '/recrutement', icon: '🎯' },
    ],
  },
  {
    titre: 'PÉDAGOGIE',
    items: [
      { label: 'Formations', href: '/formations', icon: '📚' },
      { label: 'Sessions', href: '/sessions', icon: '📅' },
      { label: 'Planning', href: '/planning', icon: '🗓️' },
      { label: 'Examens', href: '/examens', icon: '🏆' },
    ],
  },
  {
    titre: 'ASSIDUITÉS',
    items: [
      { label: 'Émargement', href: '/emargement', icon: '✍️' },
      { label: 'Présences', href: '/presences', icon: '📋' },
    ],
  },
  {
    titre: 'CONFORMITÉS',
    items: [
      { label: 'Qualiopi', href: '/qualiopi', icon: '🏅' },
      { label: 'France Compétences', href: '/france-competences', icon: '🇫🇷' },
      { label: 'SIFA', href: '/sifa', icon: '📊' },
      { label: 'BPF', href: '/bpf', icon: '📑' },
      { label: 'Documents', href: '/documents', icon: '📄' },
    ],
  },
  {
    titre: 'COMPTABILITÉ',
    items: [
      { label: 'Facturation OPCO', href: '/precomptabilite', icon: '💰' },
      { label: 'OPCO', href: '/opco', icon: '🏦' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { utilisateur, deconnecter } = useUser();
  const { aAcces } = useAcces();

  function handleDeconnecter() {
    deconnecter();
    router.push('/login');
  }

  function estItemActif(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  function renderItem(item: MenuItem, indente = true) {
    const accessible = aAcces(item.href);
    const isActive = estItemActif(item.href);

    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: indente ? '9px 20px 9px 32px' : '11px 20px',
      fontSize: '13px',
      borderLeft: isActive ? '3px solid var(--secondary)' : '3px solid transparent',
      textDecoration: 'none',
    };

    if (!accessible) {
      return (
        <div
          key={item.href}
          title="Accès non autorisé pour votre rôle"
          style={{
            ...baseStyle,
            color: 'rgba(255,255,255,0.35)',
            cursor: 'not-allowed',
            opacity: 0.7,
            backgroundColor: 'transparent',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </span>
          <span style={{ fontSize: '11px' }}>🔒</span>
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        style={{
          ...baseStyle,
          color: isActive ? 'var(--secondary)' : 'rgba(255,255,255,0.85)',
          backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
          fontWeight: isActive ? '600' : '400',
        }}
      >
        <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <aside style={{ width: '240px', minHeight: '100vh', backgroundColor: 'var(--primary)', display: 'flex', flexDirection: 'column', padding: '0' }}>

      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <img src="/logo-pamoi.png" alt="PAM OI" style={{ height: '52px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--secondary)', fontSize: '16px', fontWeight: '800', letterSpacing: '1px' }}>
            Easy<span style={{ color: 'white' }}>CFA</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>PAM OI Formation</div>
        </div>
      </div>

      <nav style={{ padding: '12px 0', flex: 1, overflowY: 'auto' }}>
        {renderItem({ label: 'Tableau de bord', href: '/', icon: '🏠' }, false)}

        {CATEGORIES.map(cat => (
          <div key={cat.titre} style={{ marginTop: '14px' }}>
            <div
              style={{
                padding: '6px 20px 4px 20px',
                fontSize: '10px',
                fontWeight: '800',
                letterSpacing: '1.2px',
                color: 'var(--secondary)',
                textTransform: 'uppercase',
                opacity: 0.85,
              }}
            >
              {cat.titre}
            </div>
            {cat.items.map(item => renderItem(item, true))}
          </div>
        ))}

        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '8px' }}>
          {renderItem({ label: 'Paramètres', href: '/parametres', icon: '⚙️' }, false)}
        </div>

      </nav>

      {utilisateur && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ backgroundColor: 'var(--secondary)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
              {utilisateur.avatar}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {utilisateur.prenom} {utilisateur.nom}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{utilisateur.fonction}</div>
            </div>
          </div>
          <button
            onClick={handleDeconnecter}
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            🚪 Se déconnecter
          </button>
        </div>
      )}

      {!utilisateur && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', fontSize: '11px', textAlign: 'center' }}>
          EasyCFA v1.0 — PAM OI
        </div>
      )}
    </aside>
  );
}
