'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import Sidebar from '../components/Sidebar';
import { UserProvider, useUser } from '../lib/UserContext';
import { useAcces } from '../lib/useAcces';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

function AppContent({ children }: { children: React.ReactNode }) {
  const { utilisateur, chargement } = useUser();
  const { aAcces, estFormateur } = useAcces();
  const router = useRouter();
  const pathname = usePathname();
  const estPageLogin = pathname === '/login';
  const estParcours = pathname.startsWith('/parcours/');
  // Toutes les routes /formateur/* sont gérées par app/formateur/layout.tsx
  // ET /emargement quand l'utilisateur est un formateur (Phase 4.b-bis : sidebar formateur visible)
  const estRouteFormateurPure = pathname === '/formateur' || pathname.startsWith('/formateur/');
  const estEmargementFormateur = !!utilisateur && utilisateur.role === 'formateur' && pathname === '/emargement';
  const estRouteFormateur = estRouteFormateurPure || estEmargementFormateur;

  useEffect(() => {
    if (chargement) return;
    if (estParcours) return; // page publique apprenti : pas de redirection
    if (estRouteFormateur) return; // déléguer à FormateurLayout

    if (!utilisateur && !estPageLogin) {
      // Si on est dans le contexte formateur, on reste dans cet univers
      const venaitFormateur = pathname.startsWith('/formateur');
      router.push(venaitFormateur ? '/formateur/connexion' : '/login');
      return;
    }

    // 🚨 SÉCURITÉ : un formateur ne doit JAMAIS être dans l'espace admin
    // SAUF sur quelques routes partagées explicitement autorisées
    const ROUTES_PARTAGEES_FORMATEUR: string[] = ['/emargement'];
    const estRoutePartagee = ROUTES_PARTAGEES_FORMATEUR.includes(pathname);
    if (utilisateur && utilisateur.role === 'formateur' && !estPageLogin && !estRoutePartagee) {
      router.push('/formateur');
      return;
    }

    if (utilisateur && estPageLogin) {
      router.push('/');
      return;
    }

    if (utilisateur && !estPageLogin && !aAcces(pathname)) {
      router.push('/');
    }
  }, [utilisateur, pathname, chargement, estRouteFormateur, estPageLogin, router]);

  // Routes formateur : on laisse FormateurLayout gérer
  if (estRouteFormateur) return <>{children}</>;

  if (estParcours) return <>{children}</>; // pas de sidebar, pas d'auth
  if (estPageLogin) return <>{children}</>;

  // Attendre que la session Supabase soit chargée
  if (chargement) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EAF4F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '14px', color: '#006B68', fontWeight: '600' }}>⏳ Chargement...</div>
    </div>
  );

  if (!utilisateur) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#EAF4F3' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <UserProvider>
          <AppContent>{children}</AppContent>
        </UserProvider>
      </body>
    </html>
  );
}