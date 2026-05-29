'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { COLORS } from '../../lib/constants';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Vérifier qu'on a bien un token valide à l'arrivée
  useEffect(() => {
    const checkSession = async () => {
      // Supabase gère automatiquement le token via le fragment d'URL (#access_token=...)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setSessionReady(true);
        setMessage({ type: 'info', text: 'Choisissez votre nouveau mot de passe ci-dessous.' });
      } else {
        // Attendre un peu au cas où Supabase est en train de traiter le token
        setTimeout(async () => {
          const { data: { session: session2 } } = await supabase.auth.getSession();
          if (session2) {
            setSessionReady(true);
            setMessage({ type: 'info', text: 'Choisissez votre nouveau mot de passe ci-dessous.' });
          } else {
            setMessage({
              type: 'error',
              text: 'Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation à l\'administratrice.',
            });
          }
        }, 1500);
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', text: `Erreur : ${error.message}` });
      setLoading(false);
      return;
    }

    setMessage({
      type: 'success',
      text: '✅ Mot de passe mis à jour avec succès ! Redirection vers la connexion…',
    });

    // Se déconnecter pour forcer une vraie connexion avec le nouveau mdp
    await supabase.auth.signOut();

    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: COLORS.background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
        width: '100%',
        maxWidth: '440px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: COLORS.primary,
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            marginBottom: '12px',
          }}>
            🎓
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: COLORS.primary, marginBottom: '4px' }}>
            EasyCFA
          </h1>
          <p style={{ fontSize: '13px', color: COLORS.textMuted }}>
            🔑 Réinitialisation du mot de passe
          </p>
        </div>

        {/* Message d'info / erreur / succès */}
        {message && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: message.type === 'success' ? '#e6f4f1' : message.type === 'error' ? '#fde8e8' : '#fef6e4',
            color: message.type === 'success' ? '#006B68' : message.type === 'error' ? '#c53030' : '#7a5c00',
            fontSize: '13px',
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {message.text}
          </div>
        )}

        {/* Formulaire */}
        {sessionReady && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '11px',
                color: '#888',
                textTransform: 'uppercase',
                fontWeight: '700',
                display: 'block',
                marginBottom: '6px',
              }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
                style={{
                  width: '100%',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '14px',
                  color: COLORS.text,
                  backgroundColor: 'white',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '11px',
                color: '#888',
                textTransform: 'uppercase',
                fontWeight: '700',
                display: 'block',
                marginBottom: '6px',
              }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le même mot de passe"
                required
                minLength={8}
                style={{
                  width: '100%',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '14px',
                  color: COLORS.text,
                  backgroundColor: 'white',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#999' : COLORS.primary,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Mise à jour…' : '🔑 Valider mon nouveau mot de passe'}
            </button>
          </form>
        )}

        {/* Lien retour login */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a
            href="/login"
            style={{
              fontSize: '13px',
              color: COLORS.primary,
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            &larr; Retour à la connexion
          </a>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: `1px solid ${COLORS.border}`,
          textAlign: 'center',
          fontSize: '11px',
          color: '#aaa',
        }}>
          EasyCFA v1.0 — PAM GROUPE © 2025
        </div>
      </div>
    </div>
  );
}