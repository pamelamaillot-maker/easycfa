'use client';
import { SESSIONS, APPRENANTS } from '../../../data/mockData';
import Badge from '../../../components/Badge';
import Card from '../../../components/Card';
import { COLORS } from '../../../lib/constants';
import React, { use } from 'react';

export default function FicheSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = SESSIONS.find(s => s.id === Number(id));
  const apprenants = APPRENANTS[id] ?? [];

  if (!session) return <div style={{ padding: '32px', color: COLORS.primary }}>Session introuvable.</div>;

  const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' };
  const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' };

  return (
    <div>
      {/* En-tête */}
      <div style={{ marginBottom: '24px' }}>
        <a href="/sessions" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
          ← Retour aux sessions
        </a>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary }}>{session.nom}</h1>
            <Badge statut={session.statut} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href="/emargement" style={btnPrimary}>📋 Feuille émargement</a>
            <a href="/documents/generation" style={btnPrimary}>📄 Générer documents</a>
            <a href="/documents/convention" style={btnSecondary}>📄 Convention</a>
          </div>
        </div>
      </div>

      {/* Informations générales */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Informations générales
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          {[
            { label: 'Date de début', value: session.debut },
            { label: 'Date de fin', value: session.fin },
            { label: 'Formateur', value: session.formateur },
            { label: 'Salle', value: session.salle },
          ].map((info) => (
            <div key={info.label} style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>{info.label}</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: COLORS.text }}>{info.value}</div>
            </div>
          ))}
        </div>

        {/* Stats session */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Apprenants inscrits', value: String(apprenants.length), color: COLORS.primary },
            { label: 'Taux de présence', value: '92%', color: COLORS.primary },
            { label: 'Documents générés', value: '4', color: COLORS.secondary },
            { label: 'Alertes en cours', value: '1', color: '#e53e3e' },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Apprenants */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
            Apprenants inscrits ({apprenants.length})
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/apprenants" style={btnPrimary}>+ Ajouter un apprenant</a>
            <span style={btnSecondary}>⬇ Exporter liste</span>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              {['#', 'Nom', 'Prénom', 'Entreprise', 'Contrat', 'Présence', 'Documents', ''].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apprenants.length > 0 ? apprenants.map((a, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: '12px', fontSize: '13px', color: '#aaa' }}>{i + 1}</td>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700' }}>{a.nom}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: COLORS.textMuted }}>{a.prenom}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>—</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>Signé</span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>92%</span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>3/5</span>
                </td>
                <td style={{ padding: '12px' }}>
                  <a href={`/apprenants/${a.nom?.toLowerCase().replace(/\s/g, '-')}`} style={{ color: COLORS.primary, fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                    Voir →
                  </a>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px' }}>
                  Aucun apprenant inscrit dans cette session.{' '}
                  <a href="/apprenants" style={{ color: COLORS.primary, fontWeight: '600' }}>Ajouter un apprenant</a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Actions rapides */}
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Actions rapides
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: '📋 Feuille d\'émargement', desc: 'Générer et télécharger', href: '/emargement', color: COLORS.primary },
            { label: '📄 Convention de formation', desc: 'Générer le PDF', href: '/documents/convention', color: COLORS.primary },
            { label: '📄 Certificat de réalisation', desc: 'Générer le PDF', href: '/documents/generation', color: COLORS.primary },
            { label: '📚 Livrets apprentissage', desc: 'Remplir dans Google Docs', href: '/documents/generation', color: '#4285F4' },
            { label: '📊 État de présence mensuel', desc: 'Générer pour les entreprises', href: '/emargement/mensuel', color: COLORS.secondary },
            { label: '🎓 Résultats Qualiopi', desc: 'Voir les indicateurs', href: '/qualiopi', color: COLORS.primary },
          ].map((action) => (
            <a key={action.label} href={action.href} style={{ backgroundColor: COLORS.background, borderRadius: '10px', padding: '16px', textDecoration: 'none', display: 'block', borderLeft: `4px solid ${action.color}` }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: action.color, marginBottom: '4px' }}>{action.label}</div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted }}>{action.desc}</div>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}