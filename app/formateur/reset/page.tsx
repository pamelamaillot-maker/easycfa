'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { COLORS } from '../../../lib/constants';

export default function FormateurReset() {
  const router = useRouter();

  const [verification, setVerification] = useState(true);
  const [tokenValide, setTokenValide] = useState(false);
  const [erreurInitiale, setErreurInitiale] = useState('');

  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseConfirme, setMotDePasseConfirme] = useState('');
  const [afficherMdp, setAfficherMdp] = useState(false);
  const [erreur, setErreur] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [succes, setSucces] = useState(false);

  // Au montage : on lit le token depuis le fragment URL (#access_token=...&refresh_token=...&type=recovery)
  // Supabase l'envoie en fragment (pas en query) pour des raisons de sécurité (jamais loggé côté serveur).
  useEffect(() => {
    (async () => {
      try {
        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token')) {
          setErreurInitiale('Lien invalide ou expiré. Demandez un nouveau lien.');
          setVerification(false);
          return;
        }

        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (type !== 'recovery' || !accessToken || !refreshToken) {
          setErreurInitiale('Lien invalide. Demandez un nouveau lien.');
          setVerification(false);
          return;
        }

        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          setErreurInitiale('Lien expiré. Demandez un nouveau lien.');
          setVerification(false);
          return;
        }

        // On nettoie le fragment de l'URL pour ne pas laisser le token visible
        window.history.replaceState(null, '', window.location.pathname);

        setTokenValide(true);
        setVerification(false);
      } catch {
        setErreurInitiale('Erreur lors de la vérification du lien.');
        setVerification(false);
      }
    })();
  }, []);

  async function handleEnregistrer() {
    setErreur('');

    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (motDePasse !== motDePasseConfirme) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setEnregistrement(true);
    const { error } = await supabase.auth.updateUser({ password: motDePasse });

    if (error) {
      setErreur(error.message || 'Erreur lors de l\'enregistrement. Réessayez.');
      setEnregistrement(false);
      return;
    }

    // On déconnecte la session de récupération (pour forcer un vrai login propre)
    await supabase.auth.signOut();
    setSucces(true);
    setEnregistrement(false);

    // Redirection automatique vers /formateur/connexion après 3 secondes
    setTimeout(() => router.push('/formateur/connexion'), 3000);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 40, width: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ backgroundColor: COLORS.primary, borderRadius: 12, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>
            🔑
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary, marginBottom: 4 }}>
            Nouveau mot de passe
          </h1>
          <p style={{ fontSize: 13, color: '#888' }}>EasyCFA — Espace Formateur</p>
        </div>

        {/* Vue : vérification du token */}
        {verification && (
          <div style={{ textAlign: 'center', padding: 24, color: COLORS.primary, fontSize: 14, fontWeight: 600 }}>
            ⏳ Vérification du lien...
          </div>
        )}

        {/* Vue : token invalide ou expiré */}
        {!verification && !tokenValide && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36 }}>⚠️</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
              {erreurInitiale}
            </div>
            <Link href="/formateur/connexion" style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: 8, padding: '13px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
              ← Retour à la connexion
            </Link>
          </div>
        )}

        {/* Vue : succès */}
        {tokenValide && succes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36 }}>✅</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
              Votre mot de passe a bien été enregistré.<br />
              Vous allez être redirigé vers la page de connexion...
            </div>
          </div>
        )}

        {/* Vue : saisie du nouveau mot de passe */}
        {tokenValide && !succes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
              Choisissez un mot de passe fort (8 caractères minimum).
            </div>

            <div>
              <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={afficherMdp ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={e => setMotDePasse(e.target.value)}
                  placeholder="••••••••••"
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

            <div>
              <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>Confirmer le mot de passe</label>
              <input
                type={afficherMdp ? 'text' : 'password'}
                value={motDePasseConfirme}
                onChange={e => setMotDePasseConfirme(e.target.value)}