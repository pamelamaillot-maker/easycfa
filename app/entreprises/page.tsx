'use client';

import { useState, useRef } from 'react';
import { ENTREPRISES_REELS } from '../../data/mockEntreprises_reels';
import { COLORS } from '../../lib/constants';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: COLORS.text, backgroundColor: 'white' };

const ALERTE_E: Record<string, { bg: string; color: string }> = {
  'OK': { bg: '#e6f4f1', color: '#006B68' },
  'Email tuteur manquant': { bg: '#fef6e4', color: '#C8A23A' },
  'Documents à transmettre': { bg: '#fde8e8', color: '#e53e3e' },
};

export default function Entreprises() {
  const [alertesContactes, setAlertesContacts] = useState<string[]>([]);
  const [afficherAlertes, setAfficherAlertes] = useState(false);
  const [importOk, setImportOk] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [rechercheTuteur, setRechercheTuteur] = useState('');
  const [filtreOpco, setFiltreOpco] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function exporter() {
    const headers = ['Raison sociale', 'SIRET', 'Code APE', 'Adresse', 'Ville', 'Email', 'Téléphone', 'IDCC', 'OPCO', 'Tuteur Nom', 'Tuteur Prénom', 'Tuteur Email', 'Tuteur Téléphone'];
    const rows = ENTREPRISES_REELS.map(e => [
      e.raisonSociale, e.siret, e.codeApe, e.adresse, e.ville, e.email, e.telephone,
      e.idcc, e.opco, e.tuteurNom, e.tuteurPrenom, e.tuteurEmail, e.tuteurTelephone,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Entreprises_PAM_OI_' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-') + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function controlerContacts() {
    const alertes: string[] = [];
    ENTREPRISES_REELS.forEach(e => {
      if (!e.tuteurEmail) alertes.push(`⚠️ ${e.raisonSociale} — Email tuteur manquant`);
      if (!e.tuteurTelephone) alertes.push(`⚠️ ${e.raisonSociale} — Téléphone tuteur manquant`);
      if (!e.idcc || e.idcc === '9999') alertes.push(`⚠️ ${e.raisonSociale} — IDCC à vérifier (${e.idcc})`);
      if (!e.opco) alertes.push(`⚠️ ${e.raisonSociale} — OPCO manquant`);
      if (!e.facturationEmail) alertes.push(`⚠️ ${e.raisonSociale} — Email facturation manquant`);
    });
    setAlertesContacts(alertes);
    setAfficherAlertes(true);
  }

  return (
    <div>
      {importOk && (
        <div style={{ padding: '12px 16px', backgroundColor: '#e6f4f1', border: '2px solid #006B68', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          ✅ Fichier importé — Pour intégrer les nouvelles données, envoyez le fichier à l'administrateur EasyCFA.
        </div>
      )}

      {afficherAlertes && (
        <Card style={{ marginBottom: '16px', border: '2px solid #C8A23A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.secondary }}>🔍 Contrôle des contacts — {alertesContactes.length} anomalie(s)</h2>
            <button onClick={() => setAfficherAlertes(false)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>✕ Fermer</button>
          </div>
          {alertesContactes.length === 0 ? (
            <div style={{ color: COLORS.primary, fontWeight: '600', fontSize: '14px' }}>✅ Tous les contacts sont complets !</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
              {alertesContactes.map((a, i) => (
                <div key={i} style={{ padding: '8px 12px', backgroundColor: '#fffbf0', borderRadius: '6px', fontSize: '13px', color: '#7a5c00', borderLeft: '3px solid #C8A23A' }}>{a}</div>
              ))}
            </div>
          )}
        </Card>
      )}<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>Entreprises</h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Suivez les entreprises d'accueil, tuteurs, apprentis rattachés et documents associés.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href="/entreprises/nouvelle" style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
            + Ajouter une entreprise
          </a>
          <label style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }}>
            📥 Importer entreprises
            <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={() => { setImportOk(true); setTimeout(() => setImportOk(false), 3000); }} />
          </label>
          <button onClick={exporter} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            📤 Exporter CSV
          </button>
          <button onClick={controlerContacts} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            🔍 Contrôler les contacts
          </button>
        </div>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher entreprise, ville..."
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input
              value={rechercheTuteur}
              onChange={e => setRechercheTuteur(e.target.value)}
              placeholder="Rechercher tuteur..."
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
          </div>
          <select value={filtreOpco} onChange={e => setFiltreOpco(e.target.value)} style={inputStyle}>
            <option value="">Tous les OPCO</option>
            {[...new Set(ENTREPRISES_REELS.map(e => e.opco).filter(Boolean))].sort().map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {(recherche || rechercheTuteur || filtreOpco) && (
            <button onClick={() => { setRecherche(''); setRechercheTuteur(''); setFiltreOpco(''); }} style={{ backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', padding: '9px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
  { label: 'Total entreprises', value: ENTREPRISES_REELS.length, color: COLORS.primary },
  { label: 'OPCO différents', value: new Set(ENTREPRISES_REELS.map(e => e.opco)).size, color: COLORS.secondary },
].map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Liste des entreprises ({ENTREPRISES_REELS.length})
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                {['Entreprise', 'SIRET', 'Contact principal', 'Email', 'Téléphone', 'Apprentis', 'Tuteurs', 'Statut', 'Alertes', 'Actions'].map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ENTREPRISES_REELS.filter(e => {
  const matchRecherche = !recherche || e.raisonSociale.toLowerCase().includes(recherche.toLowerCase()) || e.ville.toLowerCase().includes(recherche.toLowerCase()) || e.siret.includes(recherche);
  const matchTuteur = !rechercheTuteur || (e.tuteurNom + ' ' + e.tuteurPrenom).toLowerCase().includes(rechercheTuteur.toLowerCase());
  const matchOpco = !filtreOpco || e.opco === filtreOpco;
  return matchRecherche && matchTuteur && matchOpco;
}).map((e) => {
                return (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '10px', fontSize: '14px', fontWeight: '700' }}>{e.raisonSociale}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{e.siret}</td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>{e.tuteurNom} {e.tuteurPrenom}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{e.email}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{e.telephone}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{e.opco}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{e.idcc}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Active</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ backgroundColor: '#f0f0f0', color: '#888', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>—</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <a href={`/entreprises/${e.id}`} style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' }}>Voir →</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}