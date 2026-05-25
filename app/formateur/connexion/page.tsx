'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../../../lib/UserContext';
import { COLORS } from '../../../lib/constants';

export default function FormateurConnexion() {
  const { connecter } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [afficherMdp, setAfficherMdp] = useState(false);

  const [afficherReset, setAfficherReset] = useState(false);
  const [emailReset, setEmailReset] = useState('');
  const [resetEnvoye, setResetEnvoye] = useState(false);
  const [resetEnCours, setResetEnCours] = useState(false);
  const [erreurReset, setErreurReset] = useState('');

  async function handleConnexion() {
    setChargement(true);
    setErreur('');
    const res = await connecter(email, motDePasse);
    if (res.ok) {
      router.push('/formateur');
    } else {
      setErreur(res.erreur || 'Email ou mot de passe incorrect.');
      setChargement(false);
    }
  }

  async function handleDemandeReset() {
    setResetEnCours(true);
    setErreurReset('');
    try {
      const res = await fetch('/api/formateur/demande-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailReset.trim() }),
      });
      if (res.ok || res.status === 404) {
        setResetEnvoye(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErreurReset(data.erreur || 'Erreur lors de l\'envoi. Réessayez.');
      }
    } catch {
      setErreurReset('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setResetEnCours(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 40, width: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ backgroundColor: COLORS.primary, borderRadius: 12, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>
            👨‍🏫
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary, marginBottom: 4 }}>
            Espace Formateur
          </h1>
          <p style={{ fontSize: 13, color: '#888' }}>EasyCFA — PAM OI Formation</p>
        </div>

        {!afficherReset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                onKeyDown={e => e.key === 'Enter' && handleConnexion()}
                style={{ border: `1.5px solid ${email ? COLORS.primary : '#e0e0e0'}`, borderRadius: 8, padding: '11px 14px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={afficherMdp ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={e => setMotDePasse(e.target.value)}
                  placeholder="••••••••••"
                  onKeyDown={e => e.key === 'Enter' && handleConnexion()}
                  style={{ border: `1.5px solid ${motDePasse ? COLORS.primary : '#e0e0e0'}`, borderRadius: 8, padding: '11px 40px 11px 14px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                />
                <button
                  onClick={() => setAfficherMdp(!afficherMdp)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888' }}
                >
                  {afficherMdp ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {erreur && (
              <div style={{ backgroundColor: '#fde8e8', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e53e3e', fontWeight: 600 }}>
                ⚠️ {erreur}
              </div>
            )}

            <button
              onClick={handleConnexion}
              disabled={chargement || !email || !motDePasse}
              style={{ backgroundColor: chargement || !email || !motDePasse ? '#ccc' : COLORS.primary, color: 'white', border: 'none', borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 700, cursor: chargement || !email || !motDePasse ? 'not-allowed' : 'pointer', marginTop: 4 }}
            >
              {chargement ? '⏳ Connexion en cours...' : '🔐 Se connecter'}
            </button>

            <button
              onClick={() => { setAfficherReset(true); setEmailReset(email); }}
              style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', padding: 4 }}
            >
              🔑 Mot de passe oublié ?
            </button>
          </div>
        )}

        {afficherReset && !resetEnvoye && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
              Saisissez votre adresse email pour recevoir un lien de réinitialisation.
            </div>

            <div>
              <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>Adresse email</label>
              <input
                type="email"
                value={emailReset}
                onChange={e => setEmailReset(e.target.value)}
                placeholder="votre@email.fr"
                onKeyDown={e => e.key === 'Enter' && emailReset && handleDemandeReset()}
                style={{ border: `1.5px solid ${emailReset ? COLORS.primary : '#e0e0e0'}`, borderRadius: 8, padding: '11px 14px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {erreurReset && (
              <div style={{ backgroundColor: '#fde8e8', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e53e3e', fontWeight: 600 }}>
                ⚠️ {erreurReset}
              </div>
            )}

            <button
              onClick={handleDemandeReset}
              disabled={resetEnCours || !emailReset}
              style={{ backgroundColor: resetEnCours || !emailReset ? '#ccc' : COLORS.primary, color: 'white', border: 'none', borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 700, cursor: resetEnCours || !emailReset ? 'not-allowed' : 'pointer' }}
            >
              {resetEnCours ? '⏳ Envoi en cours...' : '📩 Envoyer le lien'}
            </button>

            <button
              onClick={() => { setAfficherReset(false); setErreurReset(''); }}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', padding: 4 }}
            >
              ← Retour à la connexion
            </button>
          </div>
        )}

        {afficherReset && resetEnvoye && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36 }}>📬</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
              Si cette adresse correspond à un compte formateur, un lien de réinitialisation vient d'être envoyé.<br /><br />
              <strong>Vérifiez votre boîte mail</strong> (et vos spams).
            </div>
            <button
              onClick={() => { setAfficherReset(false); setResetEnvoye(false); setEmailReset(''); }}
              style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: 8, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              ← Retour à la connexion
            </button>
          </div>
        )}

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
            Vous êtes administratif, pédagogique ou comptable ?
          </div>
          <Link href="/login" style={{ fontSize: 13, color: COLORS.primary, fontWeight: 600, textDecoration: 'none' }}>
            🔐 Espace équipe administrative →
          </Link>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: '#ccc' }}>
          EasyCFA v1.0 — PAM GROUPE © 2025
        </div>
      </div>
    </div>
  );
}