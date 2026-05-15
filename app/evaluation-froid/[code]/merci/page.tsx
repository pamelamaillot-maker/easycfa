'use client';

import React from 'react';

const COLORS = {
  primary: '#006B68',
  secondary: '#C8A23A',
  background: '#EAF4F3',
  text: '#1a1a1a',
  textMuted: '#666',
};

export default function PageMerci() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background, padding: '20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '500px', width: '100%', backgroundColor: 'white', borderRadius: '16px', padding: '40px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🙏</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: COLORS.primary, marginBottom: '12px' }}>
          Merci pour votre retour !
        </h1>
        <p style={{ fontSize: '15px', color: COLORS.text, marginBottom: '20px', lineHeight: '1.5' }}>
          Votre témoignage 6 mois après la formation est précieux.
          <br />
          Il nous aide à <strong>améliorer continuellement</strong> nos parcours pédagogiques pour les futurs apprentis.
        </p>

        <div style={{ backgroundColor: COLORS.background, border: `2px solid ${COLORS.secondary}`, borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '13px', color: COLORS.primary, fontWeight: '600' }}>
          ❄️ Évaluation à froid · Indicateur 30 Qualiopi
          <br />
          <span style={{ fontWeight: '400', fontSize: '12px', color: COLORS.textMuted }}>
            Démarche qualité — Suivi à 6 mois
          </span>
        </div>

        <div style={{ paddingTop: '20px', borderTop: '1px solid #e0e0e0', fontSize: '12px', color: COLORS.textMuted }}>
          <strong style={{ color: COLORS.primary }}>PAM OI Formation</strong>
          <br />
          CFA La Réunion
          <br />
          <span style={{ fontSize: '11px', fontStyle: 'italic' }}>
            Bonne continuation dans votre parcours professionnel ! 🚀
          </span>
        </div>
      </div>
    </div>
  );
}