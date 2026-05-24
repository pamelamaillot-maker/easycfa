'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function TestAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Au mount : vérifier si déjà connecté
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await chargerProfil(session.user.id);
      }
    })();

    // Listener changement d'état auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth event]', event, session?.user?.email);
      if (session?.user) {
        setUser(session.user);
        await chargerProfil(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function chargerProfil(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('[Profil] Erreur:', error);
      setErreur(`Erreur chargement profil : ${error.message}`);
      return;
    }
    setProfile(data);
    console.log('[Profil] Chargé:', data);
  }

  async function seConnecter(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErreur(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErreur(`Échec connexion : ${error.message}`);
      console.error('[SignIn]', error);
    } else {
      setMessage('✅ Connexion réussie');
      console.log('[SignIn] OK', data.user?.email);
    }
    setLoading(false);
  }

  async function seDeconnecter() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[SignOut]', e);
    }
    // Reset manuel immédiat
    setUser(null);
    setProfile(null);
    setEmail('');
    setPassword('');
    setMessage('👋 Déconnecté');
    setLoading(false);
    // Hard reload pour vider tout cache résiduel
    setTimeout(() => window.location.reload(), 300);
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 22, color: '#006B68', marginBottom: 4 }}>🧪 Test Supabase Auth</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>Page de validation Phase 1 — à supprimer après tests</p>

      {user ? (
        <div style={{ padding: 20, backgroundColor: '#e6f4f1', border: '2px solid #006B68', borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#006B68', marginBottom: 10 }}>✅ Connecté(e)</div>
          <div style={{ fontSize: 12, marginBottom: 4 }}><strong>UID :</strong> {user.id}</div>
          <div style={{ fontSize: 12, marginBottom: 4 }}><strong>Email :</strong> {user.email}</div>
          <div style={{ fontSize: 12, marginBottom: 12 }}><strong>Email confirmé :</strong> {user.email_confirmed_at ? '✅' : '❌'}</div>

          {profile ? (
            <div style={{ marginTop: 12, padding: 12, backgroundColor: 'white', borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#006B68', marginBottom: 6 }}>📋 Profil EasyCFA</div>
              <div style={{ fontSize: 12 }}><strong>Nom :</strong> {profile.nom} {profile.prenom}</div>
              <div style={{ fontSize: 12 }}><strong>Rôle :</strong> {profile.role}</div>
              {profile.formateurId && <div style={{ fontSize: 12 }}><strong>FormateurId :</strong> {profile.formateurId}</div>}
              <div style={{ fontSize: 12 }}><strong>Actif :</strong> {profile.actif ? '✅' : '❌'}</div>
            </div>
          ) : (
            <div style={{ marginTop: 12, padding: 12, backgroundColor: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#7a1a1a' }}>
              ⚠️ Aucun profil trouvé dans la table profiles (RLS bloque peut-être ?)
            </div>
          )}

          <button
            onClick={seDeconnecter}
            disabled={loading}
            style={{ marginTop: 14, backgroundColor: '#c00', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            🚪 Se déconnecter
          </button>
        </div>
      ) : (
        <form onSubmit={seConnecter} style={{ padding: 20, border: '1.5px solid #e0e0e0', borderRadius: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '9px 12px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>MOT DE PASSE</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '9px 12px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', width: '100%' }}
          >
            {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
          </button>
        </form>
      )}

      {message && (
        <div style={{ marginTop: 12, padding: 10, backgroundColor: '#e6f4f1', borderRadius: 8, fontSize: 13, color: '#006B68', fontWeight: 600 }}>
          {message}
        </div>
      )}
      {erreur && (
        <div style={{ marginTop: 12, padding: 10, backgroundColor: '#fde8e8', borderRadius: 8, fontSize: 13, color: '#c00', fontWeight: 600 }}>
          ❌ {erreur}
        </div>
      )}
    </div>
  );
}