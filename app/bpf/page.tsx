'use client';

import { useState, useEffect } from 'react';
import { HEURES_FORMATEURS, SESSIONS_BPF, DONNEES_FINANCIERES_MANUELLES, TAUX_HORAIRES_FORMATEURS } from '../../data/mockBPF';
import { COLORS } from '../../lib/constants';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import {
  type BPFDeclaration,
  chargerBPFs,
  sauvegarderBPF,
  joursAvantEcheance,
  getBPFEnAlerte,
} from '../../data/bpfSupabase';

const ONGLETS = ['Tableau de bord', 'Formations & Apprenants', 'Formateurs & Coûts', 'Données financières', 'Export BPF', 'Déclarations & Télétransmission'];

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', color: COLORS.text, backgroundColor: 'white' };

function InfoRow({ label, value, auto }: { label: string; value: string; auto?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {auto && <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>Auto</span>}
        <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>{value}</span>
      </div>
    </div>
  );
}

export default function BPF() {
  const [onglet, setOnglet] = useState(0);
  const [donneesFinancieres, setDonneesFinancieres] = useState(DONNEES_FINANCIERES_MANUELLES);

  // ===== Chargement des déclarations BPF =====
  const [bpfs, setBpfs] = useState<BPFDeclaration[]>([]);
  const [bpfLoading, setBpfLoading] = useState(true);
  const [bpfMessage, setBpfMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    chargerBPFs().then((data) => {
      setBpfs(data);
      setBpfLoading(false);
      console.log('[BPF] Chargés :', data.length, 'déclarations');
    });
  }, []);

  const bpfEnAlerte = getBPFEnAlerte(bpfs);
  const joursRestants = bpfEnAlerte ? joursAvantEcheance(bpfEnAlerte) : null;

  // Calculs automatiques
  const totalApprenants = SESSIONS_BPF.reduce((acc, s) => acc + s.nbInscrits, 0);
  const totalSortants = SESSIONS_BPF.reduce((acc, s) => acc + s.nbSortants, 0);
  const totalObtentions = SESSIONS_BPF.reduce((acc, s) => acc + s.nbObtention, 0);
  const totalHeuresPrevues = SESSIONS_BPF.reduce((acc, s) => acc + s.heuresPrevues, 0);
  const totalHeuresRealisees = SESSIONS_BPF.reduce((acc, s) => acc + s.heuresRealisees, 0);
  const tauxObtentionGlobal = Math.round((totalObtentions / totalSortants) * 100);
  const tauxRuptureGlobal = Math.round(SESSIONS_BPF.reduce((acc, s) => acc + s.tauxRupture, 0) / SESSIONS_BPF.length);

  // Calcul coûts formateurs automatique
  const coutFormateurs = HEURES_FORMATEURS.reduce((acc, f) => {
    if (f.type === 'Salarié') return acc;
    const heuresP = f.sessions.reduce((a, s) => a + s.heuresPresentiel, 0);
    const heuresD = f.sessions.reduce((a, s) => a + s.heuresDistanciel, 0);
    return acc + (heuresP * TAUX_HORAIRES_FORMATEURS.presentiel) + (heuresD * TAUX_HORAIRES_FORMATEURS.distanciel);
  }, 0);

  const totalProduits = Object.values(donneesFinancieres.produits).reduce((a, b) => a + b, 0);
  const totalChargesHorsFormateurs = Object.values(donneesFinancieres.charges).reduce((a, b) => a + b, 0);
  const totalCharges = totalChargesHorsFormateurs + coutFormateurs;
  const resultat = totalProduits - totalCharges;

  function updateFinancier(categorie: 'produits' | 'charges', champ: string, valeur: number) {
    setDonneesFinancieres(prev => ({
      ...prev,
      [categorie]: { ...prev[categorie], [champ]: valeur },
    }));
  }

  return (
    <div>
      {/* ===== BANDEAU D'ALERTE BPF ===== */}
      {bpfEnAlerte && (
        <div style={{
          backgroundColor: joursRestants !== null && joursRestants < 0 ? '#fde8e8' : joursRestants !== null && joursRestants <= 7 ? '#fde8e8' : '#fef6e4',
          borderLeft: `4px solid ${joursRestants !== null && joursRestants <= 7 ? '#e53e3e' : COLORS.secondary}`,
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>
              {joursRestants !== null && joursRestants < 0 ? '🚨' : joursRestants !== null && joursRestants <= 7 ? '⚠️' : '📋'}
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: joursRestants !== null && joursRestants <= 7 ? '#c53030' : '#7a5c00', marginBottom: '2px' }}>
                {joursRestants !== null && joursRestants < 0
                  ? `BPF ${bpfEnAlerte.anneeBPF} EN RETARD — ${Math.abs(joursRestants)} jour${Math.abs(joursRestants) > 1 ? 's' : ''} de dépassement`
                  : `BPF ${bpfEnAlerte.anneeBPF} à télétransmettre — J-${joursRestants}`}
              </div>
              <div style={{ fontSize: '12px', color: '#5a4000' }}>
                Exercice du {bpfEnAlerte.exerciceDebut} au {bpfEnAlerte.exerciceFin} —
                Échéance : <strong>{bpfEnAlerte.dateLimiteTeletransmission}</strong> —
                À télétransmettre sur monactiviteformation.emploi.gouv.fr
              </div>
            </div>
          </div>
          <button
            onClick={() => setOnglet(5)}
            style={{
              backgroundColor: joursRestants !== null && joursRestants <= 7 ? '#e53e3e' : COLORS.secondary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✅ Cocher comme télétransmis
          </button>
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
            Bilan Pédagogique et Financier
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
            Année {donneesFinancieres.annee} — PAM OI Formation — Données automatiques + saisie manuelle
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnPrimary}>⬇ Exporter BPF</button>
          <button style={btnSecondary}>📊 Aperçu complet</button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `2px solid ${COLORS.background}` }}>
        {ONGLETS.map((o, i) => (
          <button key={o} onClick={() => setOnglet(i)} style={{
            backgroundColor: 'transparent', border: 'none', padding: '10px 20px',
            fontSize: '14px', fontWeight: onglet === i ? '700' : '500',
            color: onglet === i ? COLORS.primary : COLORS.textMuted,
            borderBottom: onglet === i ? `3px solid ${COLORS.primary}` : '3px solid transparent',
            cursor: 'pointer', marginBottom: '-2px',
          }}>
            {o}
          </button>
        ))}
      </div>

      {/* ===== ONGLET 1 — Tableau de bord ===== */}
      {onglet === 0 && (
        <div>
          {/* Légende */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>🟢 Auto — calculé automatiquement par EasyCFA</span>
            <span style={{ backgroundColor: '#fef6e4', color: '#C8A23A', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>✏️ Manuel — à saisir</span>
          </div>

          {/* Stats automatiques */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard label="Total apprenants" value={String(totalApprenants)} color={COLORS.primary} />
            <StatCard label="Heures réalisées" value={`${totalHeuresRealisees}h`} color={COLORS.primary} />
            <StatCard label="Taux d'obtention global" value={`${tauxObtentionGlobal}%`} color={COLORS.primary} />
            <StatCard label="Coût formateurs (Auto)" value={`${coutFormateurs.toLocaleString('fr-FR')} €`} color={COLORS.secondary} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Données pédagogiques auto */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Données pédagogiques</h2>
                <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>🟢 Auto</span>
              </div>
              <InfoRow label="Nombre de formations" value={String(SESSIONS_BPF.length)} auto />
              <InfoRow label="Nombre d'apprenants inscrits" value={String(totalApprenants)} auto />
              <InfoRow label="Nombre de sortants" value={String(totalSortants)} auto />
              <InfoRow label="Nombre d'obtentions" value={String(totalObtentions)} auto />
              <InfoRow label="Taux d'obtention global" value={`${tauxObtentionGlobal}%`} auto />
              <InfoRow label="Taux de rupture moyen" value={`${tauxRuptureGlobal}%`} auto />
              <InfoRow label="Heures prévues total" value={`${totalHeuresPrevues}h`} auto />
              <InfoRow label="Heures réalisées total" value={`${totalHeuresRealisees}h`} auto />
              <InfoRow label="Nombre de formateurs" value={String(HEURES_FORMATEURS.length)} auto />
            </Card>

            {/* Synthèse financière */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Synthèse financière</h2>
              </div>
              <InfoRow label="Total produits" value={`${totalProduits.toLocaleString('fr-FR')} €`} />
              <InfoRow label="Coût formateurs indépendants" value={`${coutFormateurs.toLocaleString('fr-FR')} €`} auto />
              <InfoRow label="Autres charges" value={`${totalChargesHorsFormateurs.toLocaleString('fr-FR')} €`} />
              <InfoRow label="Total charges" value={`${totalCharges.toLocaleString('fr-FR')} €`} />
              <div style={{ marginTop: '12px', padding: '14px', backgroundColor: resultat >= 0 ? '#e6f4f1' : '#fde8e8', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Résultat</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: resultat >= 0 ? COLORS.primary : '#e53e3e' }}>
                  {resultat >= 0 ? '+' : ''}{resultat.toLocaleString('fr-FR')} €
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ===== ONGLET 2 — Formations & Apprenants ===== */}
      {onglet === 1 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>Formations et apprenants</h2>
            <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>🟢 Calculé automatiquement</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                {['Formation', 'Niveau', 'Inscrits', 'Sortants', 'Obtentions', 'Taux obtention', 'H. prévues', 'H. réalisées', 'Taux présence', 'Taux rupture', 'Modalité'].map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SESSIONS_BPF.map((s) => {
                const tauxObt = Math.round((s.nbObtention / s.nbSortants) * 100);
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', color: COLORS.primary }}>{s.formation}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{s.niveau}</td>
                    <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center', fontWeight: '600' }}>{s.nbInscrits}</td>
                    <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center' }}>{s.nbSortants}</td>
                    <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center', color: COLORS.primary, fontWeight: '600' }}>{s.nbObtention}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: tauxObt >= 80 ? '#e6f4f1' : tauxObt >= 60 ? '#fef6e4' : '#fde8e8', color: tauxObt >= 80 ? '#006B68' : tauxObt >= 60 ? '#C8A23A' : '#e53e3e', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                        {tauxObt}%
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', textAlign: 'center', color: COLORS.textMuted }}>{s.heuresPrevues}h</td>
                    <td style={{ padding: '10px', fontSize: '12px', textAlign: 'center', fontWeight: '600', color: COLORS.primary }}>{s.heuresRealisees}h</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{ color: s.tauxPresence >= 90 ? COLORS.primary : COLORS.secondary, fontWeight: '700', fontSize: '13px' }}>{s.tauxPresence}%</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{ color: s.tauxRupture > 10 ? '#e53e3e' : COLORS.primary, fontWeight: '700', fontSize: '13px' }}>{s.tauxRupture}%</span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{s.modalite}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${COLORS.primary}`, backgroundColor: COLORS.background }}>
                <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', color: COLORS.primary }} colSpan={2}>TOTAL</td>
                <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>{totalApprenants}</td>
                <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>{totalSortants}</td>
                <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', textAlign: 'center', color: COLORS.primary }}>{totalObtentions}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{tauxObtentionGlobal}%</span>
                </td>
                <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>{totalHeuresPrevues}h</td>
                <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', textAlign: 'center', color: COLORS.primary }}>{totalHeuresRealisees}h</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}

      {/* ===== ONGLET 3 — Formateurs & Coûts ===== */}
      {onglet === 2 && (
        <div>
          <div style={{ padding: '12px 16px', backgroundColor: COLORS.backgroundGold, borderRadius: '8px', marginBottom: '16px', borderLeft: `4px solid ${COLORS.secondary}` }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.secondary, marginBottom: '2px' }}>
              ⚡ Calcul automatique des coûts formateurs
            </div>
            <div style={{ fontSize: '12px', color: '#5a4000' }}>
              Présentiel : {TAUX_HORAIRES_FORMATEURS.presentiel} €/h — Distanciel : {TAUX_HORAIRES_FORMATEURS.distanciel} €/h — Formateurs salariés : coût non comptabilisé ici
            </div>
          </div>

          <Card style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>Heures et coûts par formateur</h2>
              <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>🟢 Calculé automatiquement</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                  {['Formateur', 'Type', 'Sessions', 'H. présentiel', 'H. distanciel', 'Total heures', 'Coût présentiel', 'Coût distanciel', 'Coût total'].map((col) => (
                    <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEURES_FORMATEURS.map((f) => {
                  const totalP = f.sessions.reduce((a, s) => a + s.heuresPresentiel, 0);
                  const totalD = f.sessions.reduce((a, s) => a + s.heuresDistanciel, 0);
                  const totalH = totalP + totalD;
                  const coutP = f.type === 'Indépendant' ? totalP * TAUX_HORAIRES_FORMATEURS.presentiel : 0;
                  const coutD = f.type === 'Indépendant' ? totalD * TAUX_HORAIRES_FORMATEURS.distanciel : 0;
                  const coutTotal = coutP + coutD;
                  return (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700' }}>{f.nom}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ backgroundColor: f.type === 'Salarié' ? '#f0f4ff' : '#fef6e4', color: f.type === 'Salarié' ? '#3a5bc7' : COLORS.secondary, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                          {f.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>
                        {f.sessions.map(s => s.session).join(', ')}
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center', color: COLORS.primary, fontWeight: '600' }}>{totalP}h</td>
                      <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center', color: '#3a5bc7', fontWeight: '600' }}>{totalD}h</td>
                      <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center', fontWeight: '700' }}>{totalH}h</td>
                      <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center', color: f.type === 'Salarié' ? '#aaa' : COLORS.text }}>
                        {f.type === 'Indépendant' ? `${coutP.toLocaleString('fr-FR')} €` : '—'}
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center', color: f.type === 'Salarié' ? '#aaa' : COLORS.text }}>
                        {f.type === 'Indépendant' ? `${coutD.toLocaleString('fr-FR')} €` : '—'}
                      </td>
                      <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center', fontWeight: '800', color: f.type === 'Salarié' ? '#aaa' : COLORS.primary }}>
                        {f.type === 'Indépendant' ? `${coutTotal.toLocaleString('fr-FR')} €` : 'Salarié'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${COLORS.primary}`, backgroundColor: COLORS.background }}>
                  <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', color: COLORS.primary }} colSpan={5}>TOTAL COÛT FORMATEURS INDÉPENDANTS</td>
                  <td colSpan={3}></td>
                  <td style={{ padding: '10px', fontSize: '16px', fontWeight: '800', color: COLORS.primary, textAlign: 'center' }}>
                    {coutFormateurs.toLocaleString('fr-FR')} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>

          {/* Détail par session */}
          <Card>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
              Détail heures par session
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                  {['Formateur', 'Session', 'Formation', 'H. présentiel', 'H. distanciel', 'Coût'].map((col) => (
                    <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEURES_FORMATEURS.flatMap(f =>
                  f.sessions.map((s, i) => {
                    const cout = f.type === 'Indépendant'
                      ? (s.heuresPresentiel * TAUX_HORAIRES_FORMATEURS.presentiel) + (s.heuresDistanciel * TAUX_HORAIRES_FORMATEURS.distanciel)
                      : 0;
                    return (
                      <tr key={`${f.id}-${i}`} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: '10px', fontSize: '13px', fontWeight: '600' }}>{f.nom}</td>
                        <td style={{ padding: '10px', fontSize: '12px', color: COLORS.primary, fontWeight: '600' }}>{s.session}</td>
                        <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{s.formation}</td>
                        <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center', color: COLORS.primary, fontWeight: '600' }}>{s.heuresPresentiel}h</td>
                        <td style={{ padding: '10px', fontSize: '13px', textAlign: 'center', color: '#3a5bc7', fontWeight: '600' }}>{s.heuresDistanciel}h</td>
                        <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', color: f.type === 'Salarié' ? '#aaa' : COLORS.primary }}>
                          {f.type === 'Indépendant' ? `${cout.toLocaleString('fr-FR')} €` : 'Salarié'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ===== ONGLET 4 — Données financières manuelles ===== */}
      {onglet === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Produits */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Produits</h2>
              <span style={{ backgroundColor: '#fef6e4', color: '#C8A23A', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>✏️ Saisie manuelle</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'financementOPCO', label: 'Financement OPCO' },
                { key: 'financementRegion', label: 'Financement Région' },
                { key: 'financementAutres', label: 'Autres financements publics' },
                { key: 'autresProduits', label: 'Autres produits' },
              ].map((champ) => (
                <div key={champ.key}>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>{champ.label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      style={inputStyle}
                      type="number"
                      value={(donneesFinancieres.produits as any)[champ.key]}
                      onChange={(e) => updateFinancier('produits', champ.key, Number(e.target.value))}
                    />
                    <span style={{ fontSize: '13px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>€</span>
                  </div>
                </div>
              ))}
              <div style={{ padding: '12px', backgroundColor: COLORS.background, borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary }}>Total produits</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: COLORS.primary }}>{totalProduits.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
          </Card>

          {/* Charges */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Charges</h2>
            </div>

            {/* Coût formateurs auto */}
            <div style={{ padding: '12px', backgroundColor: '#e6f4f1', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: COLORS.primary }}>🟢 Coût formateurs indépendants</div>
                <div style={{ fontSize: '11px', color: '#555' }}>Calculé automatiquement par EasyCFA</div>
              </div>
              <span style={{ fontSize: '15px', fontWeight: '800', color: COLORS.primary }}>{coutFormateurs.toLocaleString('fr-FR')} €</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'loyerLocaux', label: 'Loyer et charges locaux' },
                { key: 'materielPedagogique', label: 'Matériel pédagogique' },
                { key: 'fraisAdministratifs', label: 'Frais administratifs' },
                { key: 'autresCharges', label: 'Autres charges' },
              ].map((champ) => (
                <div key={champ.key}>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    {champ.label} <span style={{ color: COLORS.secondary }}>(manuel)</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      style={inputStyle}
                      type="number"
                      value={(donneesFinancieres.charges as any)[champ.key]}
                      onChange={(e) => updateFinancier('charges', champ.key, Number(e.target.value))}
                    />
                    <span style={{ fontSize: '13px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>€</span>
                  </div>
                </div>
              ))}
              <div style={{ padding: '12px', backgroundColor: COLORS.background, borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary }}>Total charges</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: COLORS.primary }}>{totalCharges.toLocaleString('fr-FR')} €</span>
              </div>
            </div>

            {/* Résultat */}
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: resultat >= 0 ? '#e6f4f1' : '#fde8e8', borderRadius: '8px', borderTop: `4px solid ${resultat >= 0 ? COLORS.primary : '#e53e3e'}` }}>
              <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Résultat net</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: resultat >= 0 ? COLORS.primary : '#e53e3e' }}>
                {resultat >= 0 ? '+' : ''}{resultat.toLocaleString('fr-FR')} €
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===== ONGLET 6 — Déclarations & Télétransmission ===== */}
      {onglet === 5 && (
        <div>
          {bpfLoading && (
            <Card><p style={{ color: COLORS.textMuted }}>Chargement des déclarations…</p></Card>
          )}

          {!bpfLoading && bpfMessage && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: bpfMessage.type === 'success' ? '#e6f4f1' : '#fde8e8',
              color: bpfMessage.type === 'success' ? '#006B68' : '#c53030',
              fontSize: '13px',
              fontWeight: '600',
            }}>
              {bpfMessage.text}
            </div>
          )}

          {!bpfLoading && bpfs.length === 0 && (
            <Card>
              <p style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                Aucune déclaration BPF enregistrée. Contactez le support pour initialiser les données historiques.
              </p>
            </Card>
          )}

          {!bpfLoading && bpfs.map((bpf) => {
            const jours = joursAvantEcheance(bpf);
            const enRetard = jours !== null && jours < 0 && !bpf.teletransmis;
            const urgent = jours !== null && jours <= 7 && jours >= 0 && !bpf.teletransmis;

            return (
              <Card key={bpf.id} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                      BPF {bpf.anneeBPF}
                    </h2>
                    <p style={{ fontSize: '12px', color: COLORS.textMuted }}>
                      Exercice du {bpf.exerciceDebut} au {bpf.exerciceFin}
                    </p>
                  </div>
                  <div>
                    {bpf.teletransmis ? (
                      <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                        ✅ Télétransmis le {bpf.dateTeletransmission}
                      </span>
                    ) : enRetard ? (
                      <span style={{ backgroundColor: '#fde8e8', color: '#c53030', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                        🚨 En retard ({Math.abs(jours!)} j)
                      </span>
                    ) : urgent ? (
                      <span style={{ backgroundColor: '#fde8e8', color: '#c53030', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                        ⚠️ Urgent (J-{jours})
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#fef6e4', color: '#7a5c00', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                        ⏳ En attente (J-{jours})
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <InfoRow label="Date limite légale" value={bpf.dateLimiteTeletransmission || '—'} />
                  <InfoRow label="Numéro accusé réception" value={bpf.numeroAccuseReception || '—'} />
                  <InfoRow label="Total produits" value={bpf.totalProduits ? `${bpf.totalProduits.toLocaleString('fr-FR')} €` : '—'} />
                  <InfoRow label="Total charges" value={bpf.totalCharges ? `${bpf.totalCharges.toLocaleString('fr-FR')} €` : '—'} />
                </div>

                {!bpf.teletransmis && (
                  <div style={{ padding: '14px', backgroundColor: COLORS.background, borderRadius: '8px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '10px' }}>
                      ✅ Marquer comme télétransmis
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          Date télétransmission (JJ/MM/AAAA)
                        </label>
                        <input
                          id={`date-${bpf.id}`}
                          style={inputStyle}
                          type="text"
                          placeholder="ex : 28/05/2026"
                          defaultValue={new Date().toLocaleDateString('fr-FR')}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          N° accusé réception
                        </label>
                        <input
                          id={`num-${bpf.id}`}
                          style={inputStyle}
                          type="text"
                          placeholder="ex : 04973425197"
                        />
                      </div>
                      <button
                        style={btnPrimary}
                        onClick={async () => {
                          const dateEl = document.getElementById(`date-${bpf.id}`) as HTMLInputElement;
                          const numEl = document.getElementById(`num-${bpf.id}`) as HTMLInputElement;
                          if (!dateEl.value) {
                            setBpfMessage({ type: 'error', text: 'La date de télétransmission est obligatoire.' });
                            return;
                          }
                          const r = await sauvegarderBPF({
                            ...bpf,
                            teletransmis: true,
                            dateTeletransmission: dateEl.value,
                            numeroAccuseReception: numEl.value || null,
                          });
                          if (r.success) {
                            setBpfMessage({ type: 'success', text: `BPF ${bpf.anneeBPF} marqué comme télétransmis ✅` });
                            const data = await chargerBPFs();
                            setBpfs(data);
                          } else {
                            setBpfMessage({ type: 'error', text: `Erreur : ${r.error}` });
                          }
                        }}
                      >
                        ✅ Valider
                      </button>
                    </div>
                  </div>
                )}

                {bpf.notes && (
                  <div style={{ padding: '10px 12px', backgroundColor: '#f8f8f8', borderRadius: '6px', fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic' }}>
                    📝 {bpf.notes}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== ONGLET 5 — Export BPF ===== */}
      {onglet === 4 && (
        <div>
          <Card style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
              Données prêtes pour le formulaire BPF officiel
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { section: 'Identification', items: [
                  { label: 'Raison sociale', value: 'PAM OI Formation', auto: false },
                  { label: 'SIRET', value: '881 279 392 00016', auto: false },
                  { label: 'NDA', value: '04973425197', auto: false },
                  { label: 'Année', value: String(donneesFinancieres.annee), auto: false },
                ]},
                { section: 'Activité formation', items: [
                  { label: 'Nb stagiaires / apprentis', value: String(totalApprenants), auto: true },
                  { label: 'Nb heures stagiaires', value: `${totalHeuresRealisees}h`, auto: true },
                  { label: 'Nb actions de formation', value: String(SESSIONS_BPF.length), auto: true },
                  { label: 'Nb formateurs', value: String(HEURES_FORMATEURS.length), auto: true },
                ]},
                { section: 'Résultats', items: [
                  { label: 'Taux d\'obtention global', value: `${tauxObtentionGlobal}%`, auto: true },
                  { label: 'Taux de rupture moyen', value: `${tauxRuptureGlobal}%`, auto: true },
                  { label: 'Nb sorties en emploi', value: 'À compléter', auto: false },
                  { label: 'Taux insertion professionnelle', value: 'À compléter', auto: false },
                ]},
                { section: 'Financier', items: [
                  { label: 'Total produits', value: `${totalProduits.toLocaleString('fr-FR')} €`, auto: false },
                  { label: 'Coût formateurs', value: `${coutFormateurs.toLocaleString('fr-FR')} €`, auto: true },
                  { label: 'Total charges', value: `${totalCharges.toLocaleString('fr-FR')} €`, auto: false },
                  { label: 'Résultat', value: `${resultat.toLocaleString('fr-FR')} €`, auto: false },
                ]},
              ].map((section) => (
                <div key={section.section} style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {section.section}
                  </div>
                  {section.items.map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #e0e0e0' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.auto && <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: '600' }}>Auto</span>}
                        <span style={{ fontSize: '13px', fontWeight: '700', color: item.value === 'À compléter' ? COLORS.secondary : COLORS.text }}>
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
              Export et transmission
            </h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button style={btnPrimary}>⬇ Exporter en PDF</button>
              <button style={btnSecondary}>⬇ Exporter en Excel</button>
              <button style={btnSecondary}>📋 Copier les données BPF</button>
            </div>
            <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#fef6e4', borderRadius: '8px', fontSize: '12px', color: '#7a5c00' }}>
              💡 Les données marquées "Auto" sont calculées directement depuis EasyCFA. Les données "À compléter" doivent être saisies manuellement dans le formulaire officiel DREETS.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}