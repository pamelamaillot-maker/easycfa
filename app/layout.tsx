'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import Sidebar from '../components/Sidebar';
import { UserProvider, useUser } from '../lib/UserContext';
import { useAcces } from '../lib/useAcces';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

function AppContent({ children }: { children: React.ReactNode }) {
  const { utilisateur } = useUser();
  const { aAcces, estFormateur } = useAcces();
  const router = useRouter();
  const pathname = usePathname();
  const estPageLogin = pathname === '/login';
  const [pret, setPret] = useState(false);

  useEffect(() => {
    // Attendre que le localStorage soit lu
    const timer = setTimeout(() => setPret(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!pret) return;
    if (!utilisateur && !estPageLogin) {
      router.push('/login');
      return;
    }
    if (utilisateur && estPageLogin) {
      router.push('/');
      return;
    }
    if (utilisateur && !estPageLogin && !aAcces(pathname)) {
      if (estFormateur) {
        router.push('/emargement');
      } else {
        router.push('/');
      }
    }
  }, [utilisateur, pathname, pret]);

  if (estPageLogin) return <>{children}</>;

  // Attendre que la session soit chargée
  if (!pret) return (
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