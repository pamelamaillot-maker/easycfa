'use client';

import { useState, useEffect } from 'react';
import { COLORS } from '../../../lib/constants';
import Card from '../../../components/Card';
import {
  chargerNpec,
  creerNpec,
  modifierNpec,
  supprimerNpec,
  type Npec,
} from '../../../data/npecSupabase';

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnDanger: React.CSSProperties = { backgroundColor: '#fff', color: '#c00', border: '1.5px solid #c00', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', color: COLORS.text, backgroundColor: 'white' };
const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 };

const VIDE: Partial<Npec> = {
  codeRncp: '', intitule: '',
  montantNpecAnnuel: 0, coutMensuel: 0, nbHeuresFormation: 0,
  dureeMois: 0, dureeJours: 0,
  totalJoursAnnee1Theorique: 0, totalJoursAnnee2Theorique: 0,
  repasTotal: 0, repasAnnee1: 0, repasAnnee2: 0,
  montantRepasAnnee1: 0, montantRepasAnnee2: 0,
  fpe: 0, coutHoraire: 0,
};

export default function AdminNpecPage() {
  const [liste, setListe] = useState<Npec[]>([]);
  const [chargement, setChargement] = useState(true);
  const [editing, setEditing] = useState<Partial<Npec> | null>(null);
  const [filtre, setFiltre] = useState('');

  async function recharger() {
    setChargement(true);
    const data = await chargerNpec();
    setListe(data);
    setChargement(false);
  }

  useEffect(() => { recharger(); }, []);

  async function sauvegarder() {
    if (!editing) return;
    if (!editing.codeRncp || !editing.intitule) {
      alert('Code RNCP et Intitulé obligatoires');
      return;
    }
    if (editing.id) {
      await modifierNpec(editing.id, editing);
    } else {
      await creerNpec(editing);
    }
    setEditing(null);
    await recharger();
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer cette ligne NPEC ?')) return;
    await supprimerNpec(id);
    await recharger();
  }

  const filtree = liste.filter(n => {
    const q = filtre.toLowerCase();
    return !q || n.codeRncp.toLowerCase().includes(q) || n.intitule.toLowerCase().includes(q);
  });

  function setChamp<K extends keyof Npec>(k: K, v: Npec[K]) {
    setEditing(prev => prev ? { ...prev, [k]: v } : prev);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary, marginBottom: 4 }}>
            Référentiel NPEC
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: 14 }}>
            Niveaux de Prise En Charge OPCO par certification (RNCP)
          </p>
        </div>
        <button style={btnPrimary} onClick={() => setEditing({ ...VIDE })}>+ Nouvelle entrée</button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <input
            style={{ ...inputStyle, maxWidth: 400 }}
            placeholder="Rechercher par code RNCP ou intitulé..."
            value={filtre}
            onChange={e => setFiltre(e.target.value)}
          />
        </div>

        {chargement ? (
          <div style={{ padding: 32, textAlign: 'center', color: COLORS.textMuted }}>Chargement...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: COLORS.background, textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px', fontWeight: 700, color: COLORS.primary }}>Code RNCP</th>
                  <th style={{ padding: '10px 8px', fontWeight: 700, color: COLORS.primary }}>Intitulé</th>
                  <th style={{ padding: '10px 8px', fontWeight: 700, color: COLORS.primary, textAlign: 'right' }}>NPEC annuel</th>
                  <th style={{ padding: '10px 8px', fontWeight: 700, color: COLORS.primary, textAlign: 'right' }}>Heures</th>
                  <th style={{ padding: '10px 8px', fontWeight: 700, color: COLORS.primary, textAlign: 'right' }}>Durée</th>
                  <th style={{ padding: '10px 8px', fontWeight: 700, color: COLORS.primary, textAlign: 'right' }}>Repas A1/A2</th>
                  <th style={{ padding: '10px 8px', fontWeight: 700, color: COLORS.primary, textAlign: 'right' }}>FPE</th>
                  <th style={{ padding: '10px 8px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtree.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: COLORS.textMuted }}>Aucune entrée NPEC. Cliquez sur "+ Nouvelle entrée" pour démarrer.</td></tr>
                )}
                {filtree.map(n => (
                  <tr key={n.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: COLORS.primary }}>{n.codeRncp}</td>
                    <td style={{ padding: '10px 8px' }}>{n.intitule}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{n.montantNpecAnnuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{n.nbHeuresFormation}h</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{n.dureeMois} mois</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{n.repasAnnee1}/{n.repasAnnee2}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{n.fpe ? `${n.fpe.toFixed(2)} €` : '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button style={{ ...btnSecondary, padding: '6px 12px', fontSize: 12, marginRight: 6 }} onClick={() => setEditing({ ...n })}>Éditer</button>
                      <button style={btnDanger} onClick={() => n.id && supprimer(n.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal d'édition */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
             onClick={() => setEditing(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, maxWidth: 800, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
               onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.primary, marginBottom: 16 }}>
              {editing.id ? 'Modifier' : 'Nouvelle entrée'} NPEC
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Code RNCP *</label>
                <input style={inputStyle} value={editing.codeRncp || ''} onChange={e => setChamp('codeRncp', e.target.value)} placeholder="RNCP37688" />
              </div>
              <div>
                <label style={labelStyle}>Intitulé certification *</label>
                <input style={inputStyle} value={editing.intitule || ''} onChange={e => setChamp('intitule', e.target.value)} placeholder="CAP Petite Enfance" />
              </div>
            </div>

            <h3 style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginTop: 16, marginBottom: 8, borderBottom: `1px solid ${COLORS.background}`, paddingBottom: 4 }}>Financement OPCO</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>NPEC annuel (€)</label><input type="number" step="0.01" style={inputStyle} value={editing.montantNpecAnnuel || 0} onChange={e => setChamp('montantNpecAnnuel', Number(e.target.value))} /></div>
              <div><label style={labelStyle}>Coût mensuel (€)</label><input type="number" step="0.01" style={inputStyle} value={editing.coutMensuel || 0} onChange={e => setChamp('coutMensuel', Number(e.target.value))} /></div>
              <div><label style={labelStyle}>Coût horaire (€)</label><input type="number" step="0.01" style={inputStyle} value={editing.coutHoraire || 0} onChange={e => setChamp('coutHoraire', Number(e.target.value))} /></div>
            </div>

            <h3 style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginTop: 16, marginBottom: 8, borderBottom: `1px solid ${COLORS.background}`, paddingBottom: 4 }}>Durée formation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Nb heures</label><input type="number" style={inputStyle} value={editing.nbHeuresFormation || 0} onChange={e => setChamp('nbHeuresFormation', Number(e.target.value))} /></div>
              <div><label style={labelStyle}>Durée (mois)</label><input type="number" style={inputStyle} value={editing.dureeMois || 0} onChange={e => setChamp('dureeMois', Number(e.target.value))} /></div>
              <div><label style={labelStyle}>Durée (jours)</label><input type="number" style={inputStyle} value={editing.dureeJours || 0} onChange={e => setChamp('dureeJours', Number(e.target.value))} /></div>
              <div><label style={labelStyle}>FPE (€)</label><input type="number" step="0.01" style={inputStyle} value={editing.fpe || 0} onChange={e => setChamp('fpe', Number(e.target.value))} /></div>
            </div>

            <h3 style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginTop: 16, marginBottom: 8, borderBottom: `1px solid ${COLORS.background}`, paddingBottom: 4 }}>Repas (frais annexes)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Total repas</label><input type="number" style={inputStyle} value={editing.repasTotal || 0} onChange={e => setChamp('repasTotal', Number(e.target.value))} /></div>
              <div><label style={labelStyle}>Repas Année 1</label><input type="number" style={inputStyle} value={editing.repasAnnee1 || 0} onChange={e => setChamp('repasAnnee1', Number(e.target.value))} /></div>
              <div><label style={labelStyle}>Repas Année 2</label><input type="number" style={inputStyle} value={editing.repasAnnee2 || 0} onChange={e => setChamp('repasAnnee2', Number(e.target.value))} /></div>
              <div><label style={labelStyle}>Montant repas A1 (€)</label><input type="number" step="0.01" style={inputStyle} value={editing.montantRepasAnnee1 || 0} onChange={e => setChamp('montantRepasAnnee1', Number(e.target.value))} /></div>
              <div><label style={labelStyle}>Montant repas A2 (€)</label><input type="number" step="0.01" style={inputStyle} value={editing.montantRepasAnnee2 || 0} onChange={e => setChamp('montantRepasAnnee2', Number(e.target.value))} /></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.background}` }}>
              <button style={btnSecondary} onClick={() => setEditing(null)}>Annuler</button>
              <button style={btnPrimary} onClick={sauvegarder}>💾 Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}