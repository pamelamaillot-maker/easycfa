'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Utilisateur, UTILISATEURS } from '../data/mockUtilisateurs';

type UserContextType = {
  utilisateur: Utilisateur | null;
  connecter: (email: string, motDePasse: string) => boolean;
  deconnecter: () => void;
  mettreAJour: (data: Partial<Utilisateur>) => void;
};

const UserContext = createContext<UserContextType>({
  utilisateur: null,
  connecter: () => false,
  deconnecter: () => {},
  mettreAJour: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(UTILISATEURS);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('easycfa_user') || localStorage.getItem('easycfa_user');
      if (saved) setUtilisateur(JSON.parse(saved));
    } catch {}
  }, []);

  function connecter(email: string, motDePasse: string): boolean {
    const u = utilisateurs.find(u => u.email === email && u.motDePasse === motDePasse && u.actif);
    if (u) {
      setUtilisateur(u);
      sessionStorage.setItem('easycfa_user', JSON.stringify(u));
      localStorage.setItem('easycfa_user', JSON.stringify(u));
      return true;
    }
    return false;
  }

  function deconnecter() {
    setUtilisateur(null);
    sessionStorage.removeItem('easycfa_user');
    localStorage.removeItem('easycfa_user');
  }

  function mettreAJour(data: Partial<Utilisateur>) {
    if (!utilisateur) return;
    const updated = { ...utilisateur, ...data };
    setUtilisateur(updated);
    sessionStorage.setItem('easycfa_user', JSON.stringify(updated));
    localStorage.setItem('easycfa_user', JSON.stringify(updated));
    setUtilisateurs(prev => prev.map(u => u.id === updated.id ? updated : u));
  }

  return (
    <UserContext.Provider value={{ utilisateur, connecter, deconnecter, mettreAJour }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}