'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../lib/UserContext';
import { COLORS } from '../../lib/constants';

export default function Login() {
  const { connecter } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [afficherMdp, setAfficherMdp] = useState(false);

  async function handleSubmit() {
    setChargement(true);
    setErreur('');
    const res = await connecter(email, motDePasse);
    if (res.ok) {
      router.push('/');
    } else {
      setErreur(res.erreur || "Email ou mot de passe incorrect. Contactez l'administrateur.");
      setChargement(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', width: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ backgroundColor: COLORS.primary, borderRadius: '12px', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '28px' }}>
            🎓
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: COLORS.primary, marginBottom: '4px' }}>EasyCFA</h1>
          <p style={{ fontSize: '13px', color: '#888' }}>PAM OI Formation — Espace de connexion</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@pamoi.re"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ border: `1.5px solid ${email ? COLORS.primary : '#e0e0e0'}`, borderRadius: '8px', padding: '11px 14px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={afficherMdp ? 'text' : 'password'}
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)}
                placeholder="••••••••••"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ border: `1.5px solid ${motDePasse ? COLORS.primary : '#e0e0e0'}`, borderRadius: '8px', padding: '11px 40px 11px 14px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
              />
              <button
                onClick={() => setAfficherMdp(!afficherMdp)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#888' }}
              >
                {afficherMdp ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {erreur && (
            <div style={{ backgroundColor: '#fde8e8', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e53e3e', fontWeight: '600' }}>
              ⚠️ {erreur}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={chargement || !email || !motDePasse}
            style={{ backgroundColor: chargement || !email || !motDePasse ? '#ccc' : COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: chargement || !email || !motDePasse ? 'not-allowed' : 'pointer', marginTop: '8px' }}
          >
            {chargement ? '⏳ Connexion en cours...' : '🔐 Se connecter'}
          </button>
        </div>

        <div style={{ marginTop: '24px', padding: '14px', backgroundColor: COLORS.background, borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>
            🔒 Mot de passe oublié ? Contactez l'administratrice
          </div>
          <div style={{ fontSize: '12px', color: COLORS.primary, fontWeight: '600', marginTop: '4px' }}>
            pamelamaillot@pamoi.re — 06 93 55 64 92
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#ccc' }}>
          EasyCFA v1.0 — PAM GROUPE © 2025
        </div>
      </div>
    </div>
  );
}