'use client';

import { useState, useEffect } from 'react';
import { STATS, SESSIONS } from '../data/mockData';
import { ENTREPRISES_REELS } from '../data/mockEntreprises_reels';
import { APPRENANTS_REELS } from '../data/mockApprenants_reels';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import { COLORS } from '../lib/constants';

export default function Dashboard() {
  const prochaines = SESSIONS.filter(s => s.statut !== 'Terminée').slice(0, 4);
  const [mandats, setMandats] = useState<any[]>([]);

  useEffect(() => {
    const liste: any[] = [];
    ENTREPRISES_REELS.forEach(e => {
      const mandat = localStorage.getItem('entreprise_mandat_' + e.id);
      if (mandat) {
        const m = JSON.parse(mandat);
        liste.push({ entreprise: e.raisonSociale, ...m });
      }
    });
    setMandats(liste);
  }, []);

  const apprentisParEntreprise = (rs: string) =>
    APPRENANTS_REELS.filter(a => a.entreprise === rs && a.statut === 'En cours');

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Bienvenue sur EasyCFA — PAM OI" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {STATS.map((s) => <StatCard key={s.label} {...s} />)}
      </div>
      
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Prochaines sessions
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              {['Formation', 'Date', 'Formateur', 'Salle', 'Statut'].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prochaines.map((s) => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{s.nom}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: COLORS.textMuted }}>{s.debut}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: COLORS.textMuted }}>{s.formateur}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  <span style={{ backgroundColor: COLORS.background, color: COLORS.primary, padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    {s.salle}
                  </span>
                </td>
                <td style={{ padding: '12px' }}><Badge statut={s.statut} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}