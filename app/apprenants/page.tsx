'use client';

import { useState, useEffect } from 'react';
import { APPRENANTS_REELS } from '../../data/mockApprenants_reels';
import { COLORS } from '../../lib/constants';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';

function getStatut(a: any): { code: string; label: string; bg: string; color: string } {
  if (a.statut === 'P2S') return { code: 'P2S', label: 'P2S', bg: '#fef6e4', color: '#C8A23A' };
  if (a.statut === 'En cours') return { code: 'CA', label: 'CA', bg: '#e6f4f1', color: '#006B68' };
  if (a.statut === 'Terminé') return { code: 'Terminé', label: 'TERMINÉ', bg: '#dcfce7', color: '#16a34a' };
  if (a.statut === 'Rupture') {
    if (a.maintienFormation === 'OUI') return { code: 'MEF', label: 'RUPTURE MEF', bg: '#f5f0ff', color: '#7c3aed' };
    return { code: 'FMEF', label: 'RUPTURE FMEF', bg: '#fde8e8', color: '#e53e3e' };
  }
  return { code: 'CA', label: 'CA', bg: '#e6f4f1', color: '#006B68' };
}

function estArchive(a: any): boolean {
  // Archivé manuellement
  if (a.archive === true) return true;
  // Archivé automatiquement après 1 mois RUPTURE FMEF
  if (a.statut !== 'Rupture' || a.maintienFormation === 'OUI') return false;
  if (!a.dateRupture) return false;
  try {
    const parts = a.dateRupture.split('/');
    if (parts.length !== 3) return false;
    const dateRupture = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    const unMoisApres = new Date(dateRupture);
    unMoisApres.setMonth(unMoisApres.getMonth() + 1);
    return new Date() > unMoisApres;
  } catch { return false; }
}

export default function Apprenants() {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [filtreFormation, setFiltreFormation] = useState('Toutes');

  const [apprenantsMerges, setApprenantsMerges] = useState(APPRENANTS_REELS);

  useEffect(() => {
    const merges = APPRENANTS_REELS.map(a => {
      try {
        const saved = localStorage.getItem('apprenant_' + a.id);
        if (saved) return { ...a, ...JSON.parse(saved) };
      } catch {}
      return a;
    });
    setApprenantsMerges(merges);
  }, []);

  const actifs = apprenantsMerges.filter(a => !estArchive(a));
  const archives = apprenantsMerges.filter(a => estArchive(a));
  const formations = [...new Set(APPRENANTS_REELS.map(a => a.formation))].sort();

  const actifsFiltres = actifs.filter(a => {
    const s = getStatut(a);
    const matchRecherche = recherche === '' ||
      a.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      a.prenom.toLowerCase().includes(recherche.toLowerCase()) ||
      (a.entreprise ?? '').toLowerCase().includes(recherche.toLowerCase()) ||
      (a.email ?? '').toLowerCase().includes(recherche.toLowerCase());
    const matchStatut = filtreStatut === 'Tous' || s.code === filtreStatut;
    const matchFormation = filtreFormation === 'Toutes' || a.formation === filtreFormation;
    return matchRecherche && matchStatut && matchFormation;
  });

  const stats = [
    { label: 'Total actifs', value: actifs.length, bg: COLORS.primary },
    { label: 'CA', value: actifs.filter(a => a.statut === 'En cours').length, bg: '#006B68' },
    { label: 'P2S', value: actifs.filter(a => a.statut === 'P2S').length, bg: '#C8A23A' },
    { label: 'Rupture MEF', value: actifs.filter(a => a.statut === 'Rupture' && a.maintienFormation === 'OUI').length, bg: '#7c3aed' },
    { label: 'Rupture FMEF', value: actifs.filter(a => a.statut === 'Rupture' && a.maintienFormation !== 'OUI').length, bg: '#e53e3e' },
    { label: 'Terminés', value: apprenantsMerges.filter(a => a.statut === 'Terminé').length, bg: '#16a34a' },
    { label: 'Archivés', value: archives.length, bg: '#888' },
  ];

  return (
    <div>
      <PageHeader
        title="Apprenants"
        subtitle={`${actifsFiltres.length} apprenants affichés — ${archives.length} archivés`}
        />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'flex-end' }}>
        <a href="/apprenants/nouveau?statut=CA" style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
          + Nouvel apprenant (CA)
        </a>
        <a href="/apprenants/nouveau?statut=P2S" style={{ backgroundColor: COLORS.secondary, color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
          + Stagiaire P2S
        </a>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `4px solid ${s.bg}`, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: s.bg }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Barre de recherche et filtres */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par nom, prénom, entreprise, email..."
            style={{ width: '100%', border: `1.5px solid ${recherche ? COLORS.primary : '#e0e0e0'}`, borderRadius: '8px', padding: '10px 12px 10px 38px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: 'white' }}
          />
          {recherche && (
            <button onClick={() => setRecherche('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#888' }}>✕</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { code: 'Tous', label: 'Tous' },
            { code: 'CA', label: 'CA' },
            { code: 'P2S', label: 'P2S' },
            { code: 'MEF', label: 'Rupture MEF' },
            { code: 'FMEF', label: 'Rupture FMEF' },
            { code: 'Terminé', label: 'Terminés' },
          ].map((f) => (
            <button key={f.code} onClick={() => setFiltreStatut(f.code)} style={{ backgroundColor: filtreStatut === f.code ? COLORS.primary : 'white', color: filtreStatut === f.code ? 'white' : COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '20px', padding: '5px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={filtreFormation}
          onChange={e => setFiltreFormation(e.target.value)}
          style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer' }}
        >
          <option value="Toutes">Toutes les formations</option>
          {formations.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {(recherche || filtreStatut !== 'Tous' || filtreFormation !== 'Toutes') && (
          <button onClick={() => { setRecherche(''); setFiltreStatut('Tous'); setFiltreFormation('Toutes'); }} style={{ backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', padding: '9px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau actifs */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Apprenants actifs ({actifsFiltres.length}{actifsFiltres.length !== actifs.length ? ` sur ${actifs.length}` : ''})
        </h2>

        {actifsFiltres.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px', fontStyle: 'italic' }}>
            Aucun apprenant ne correspond à votre recherche.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                {['Nom', 'Prénom', 'Formation', 'Entreprise', 'Statut', ''].map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actifsFiltres.map((a) => {
                const s = getStatut(a);
                return (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700', color: COLORS.text }}>{a.nom}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: COLORS.text }}>{a.prenom}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: COLORS.background, color: COLORS.primary, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{a.formation}</span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: a.entreprise ? COLORS.text : '#ccc', fontStyle: a.entreprise ? 'normal' : 'italic' }}>
                      {a.entreprise || 'Non renseignée'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <a href={`/apprenants/${a.id}`} style={{ backgroundColor: COLORS.background, color: COLORS.primary, borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                        Voir →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Tableau archivés */}
      {archives.length > 0 && (
        <Card>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#888', marginBottom: '16px' }}>
            🗄️ Archivés — RUPTURE FMEF + 1 mois ({archives.length})
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                {['Nom', 'Prénom', 'Formation', 'Entreprise', 'Date rupture', ''].map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {archives.map((a) => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${COLORS.border}`, opacity: 0.6 }}>
                  <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700', color: '#888' }}>{a.nom}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#888' }}>{a.prenom}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: '#f0f0f0', color: '#888', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{a.formation}</span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#aaa' }}>{a.entreprise || '—'}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#aaa' }}>{a.dateRupture || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <a href={`/apprenants/${a.id}`} style={{ backgroundColor: '#f0f0f0', color: '#888', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                        Voir →
                      </a>
                      <button
                        onClick={() => {
                          const updated = { ...a, statut: 'En cours', dateRupture: '', maintienFormation: '' };
                          localStorage.setItem('apprenant_' + a.id, JSON.stringify(updated));
                          setApprenantsMerges(prev => prev.map(ap => ap.id === a.id ? updated : ap));
                        }}
                        style={{ backgroundColor: '#e6f4f1', color: '#006B68', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        ♻️ Réactiver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}