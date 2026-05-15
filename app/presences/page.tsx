'use client';

import { useState } from 'react';
import { PRESENCE_DOCUMENTS, CHECKLIST, TYPE_DOCUMENTS } from '../../data/mockPresenceDocuments';
import { COLORS } from '../../lib/constants';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';

const btnPrimary: React.CSSProperties = {
  backgroundColor: COLORS.primary, color: 'white', border: 'none',
  borderRadius: '8px', padding: '9px 16px', fontSize: '13px',
  fontWeight: '600', cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  backgroundColor: 'white', color: COLORS.primary,
  border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px',
  padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  border: '1.5px solid #e0e0e0', borderRadius: '8px',
  padding: '8px 12px', fontSize: '13px', width: '100%',
  color: COLORS.text, backgroundColor: 'white',
};

const STATUT_DOC: Record<string, { bg: string; color: string }> = {
  'Généré':       { bg: '#e6f4f1', color: '#006B68' },
  'À contrôler':  { bg: '#fef6e4', color: '#C8A23A' },
  'Bloquant':     { bg: '#fde8e8', color: '#e53e3e' },
};

const STATUT_SIG: Record<string, { bg: string; color: string }> = {
  'Signé':      { bg: '#b8ddd9', color: '#004744' },
  'À envoyer':  { bg: '#fef6e4', color: '#C8A23A' },
  'Non envoyé': { bg: '#f0f0f0', color: '#888888' },
};

const CHECKLIST_STATUT: Record<string, { bg: string; color: string }> = {
  'OK':           { bg: '#e6f4f1', color: '#006B68' },
  'À contrôler':  { bg: '#fef6e4', color: '#C8A23A' },
  'Bloquant':     { bg: '#fde8e8', color: '#e53e3e' },
};

export default function Presences() {
  const [genere, setGenere] = useState(false);

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
            Génération des états de présence
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
            Générez, contrôlez et suivez les documents de présence des sessions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button style={btnPrimary}>Générer états mensuels</button>
          <button style={btnSecondary}>Feuilles collectives</button>
          <button style={btnSecondary}>Exporter registre</button>
          <button style={btnSecondary}>Préparer signatures</button>
        </div>
      </div>

      {/* Types de documents */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Choisir le type de document
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {TYPE_DOCUMENTS.map((doc, i) => (
            <div key={i} style={{ border: `1.5px solid #e0e0e0`, borderRadius: '10px', padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = COLORS.primary)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e0e0')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: COLORS.text }}>{doc.titre}</div>
                <span style={{ backgroundColor: COLORS.background, color: COLORS.primary, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                  {doc.badge}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '12px', lineHeight: '1.5' }}>
                {doc.description}
              </div>
              <button style={{ ...btnPrimary, padding: '6px 14px', fontSize: '12px', width: '100%' }}>
                Choisir
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Paramètres + Contrôle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

        {/* Paramètres */}
        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
            Paramètres de génération
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Session', value: 'SC-2025-06 — Secrétaire Comptable' },
              { label: 'Mois', value: 'Mai 2026' },
              { label: 'Date journée', value: '06/05/2026' },
              { label: 'Apprenant', value: 'Tous les apprenants' },
            ].map((champ) => (
              <div key={champ.label}>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  {champ.label}
                </label>
                <input style={inputStyle} defaultValue={champ.value} readOnly />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              {['Inclure les absences', 'Générer PDF', 'Préparer signature'].map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: COLORS.primary }} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </Card>

        {/* Contrôle avant génération */}
        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
            Contrôle avant génération
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CHECKLIST.map((item, i) => {
              const isOK = item.statut === 'OK';
              const isControler = item.statut === 'À contrôler';
              const sc = isOK
                ? { bg: '#e6f4f1', color: '#006B68' }
                : isControler
                ? { bg: '#fef6e4', color: '#C8A23A' }
                : { bg: '#f0f0f0', color: '#555' };
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: sc.bg, borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: COLORS.text }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: sc.color }}>
                    {isOK ? '✅ OK' : isControler ? '⚠ À contrôler' : item.statut}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Simulation génération */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Simulation de génération
        </h2>
        {!genere ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', marginBottom: '16px' }}>
              Vérifiez les paramètres et le contrôle, puis lancez la génération.
            </p>
            <button style={{ ...btnPrimary, padding: '12px 32px', fontSize: '15px' }} onClick={() => setGenere(true)}>
              🚀 Lancer la génération
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Documents générés', value: '6', color: COLORS.primary },
              { label: 'PDF créés', value: '6', color: COLORS.primary },
              { label: 'Documents à envoyer', value: '6', color: COLORS.secondary },
              { label: 'Alertes', value: '2', color: COLORS.secondary },
            ].map((s) => (
              <div key={s.label} style={{ backgroundColor: COLORS.background, borderRadius: '10px', padding: '20px', borderTop: `4px solid ${s.color}` }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tableau documents */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Documents générés
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                {['Apprenant', 'Document', 'Mois', 'Version', 'Statut', 'Signature', 'PDF', 'Actions'].map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRESENCE_DOCUMENTS.map((doc) => {
                const ss = STATUT_DOC[doc.statut] ?? { bg: '#f0f0f0', color: '#888' };
                const sg = STATUT_SIG[doc.signature] ?? { bg: '#f0f0f0', color: '#888' };
                const signe = doc.signature === 'Signé';
                return (
                  <tr key={doc.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>{doc.apprenant}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{doc.document}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{doc.mois}</td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: COLORS.primary }}>{doc.version}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: ss.bg, color: ss.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {doc.statut}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: sg.bg, color: sg.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {doc.signature}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        Ouvrir
                      </button>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {signe ? (
                          <span style={{ backgroundColor: '#f0f0f0', color: '#888', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                            🔒 Verrouillé
                          </span>
                        ) : (
                          <>
                            <button style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                              Préparer
                            </button>
                            <button style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                              Envoyé
                            </button>
                            <button style={{ backgroundColor: '#e6f4f1', color: '#004744', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                              Signé
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Règles documentaires */}
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Règles documentaires
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            '🔒 Un document signé ne doit jamais être écrasé.',
            '📋 Toute correction crée une nouvelle version.',
            '🗂 Chaque document est enregistré dans le registre documentaire.',
            '✅ Les documents peuvent servir de preuves Qualiopi.',
            '🏷 La mention "Document généré avec EasyCFA — solution éditée par PAM GROUPE" doit apparaître sur les documents.',
          ].map((regle, i) => (
            <div key={i} style={{ padding: '10px 16px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '13px', color: COLORS.text, lineHeight: '1.5' }}>
              {regle}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}