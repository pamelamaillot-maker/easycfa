'use client';

import { useState } from 'react';
import { MODELES } from '../../../data/mockDocumentTemplates';
import { COLORS } from '../../../lib/constants';
import Card from '../../../components/Card';

const FAMILLES_MODELES = ['Tous', 'Apprenti', 'Entreprise', 'Présence', 'Formateur', 'Qualiopi'];

const FAMILLE_STYLE: Record<string, { bg: string; color: string }> = {
  'Apprenti':   { bg: '#e6f4f1', color: '#006B68' },
  'Entreprise': { bg: '#fef6e4', color: '#C8A23A' },
  'Présence':   { bg: '#f0f4ff', color: '#3a5bc7' },
  'Formateur':  { bg: '#f5f0ff', color: '#7c3aed' },
  'Qualiopi':   { bg: '#fde8e8', color: '#e53e3e' },
};

const STATUT_MODELE: Record<string, { bg: string; color: string }> = {
  'Prêt':         { bg: '#e6f4f1', color: '#006B68' },
  'À compléter':  { bg: '#fef6e4', color: '#C8A23A' },
  'À valider':    { bg: '#fde8e8', color: '#e53e3e' },
};

const FORMAT_STYLE: Record<string, { bg: string; color: string }> = {
  'PDF':  { bg: '#fde8e8', color: '#e53e3e' },
  'Word': { bg: '#f0f4ff', color: '#3a5bc7' },
  'HTML': { bg: '#e6f4f1', color: '#006B68' },
};

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

export default function ModelesDocuments() {
  const [famille, setFamille] = useState('Tous');
  const [modeleSelectionne, setModeleSelectionne] = useState<string | null>(null);
  const [simApprenant, setSimApprenant] = useState('Léa PAYET');
  const [simSession, setSimSession] = useState('SC-2025-06');
  const [simEntreprise, setSimEntreprise] = useState('Entreprise A');
  const [simType, setSimType] = useState('Livret d\'apprentissage');
  const [simResultat, setSimResultat] = useState(false);

  const filtres = MODELES.filter(m => famille === 'Tous' || m.famille === famille);
  const modele = modeleSelectionne ? MODELES.find(m => m.id === modeleSelectionne) : null;

  const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: COLORS.text, backgroundColor: 'white', width: '100%' };

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <a href="/documents" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>← Retour au registre</a>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px', marginTop: '8px' }}>
            Modèles de documents
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
            Gérez les modèles de génération EasyCFA avec champs dynamiques.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnPrimary}>+ Nouveau modèle</button>
          <button style={btnSecondary}>Importer modèle Word</button>
        </div>
      </div>

      {/* Info champs dynamiques */}
      <div style={{ padding: '16px', backgroundColor: COLORS.backgroundGold, borderRadius: '10px', borderLeft: `4px solid ${COLORS.secondary}`, marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.secondary, marginBottom: '6px' }}>
          ⚡ Champs dynamiques EasyCFA
        </div>
        <p style={{ fontSize: '13px', color: '#5a4000', marginBottom: '8px' }}>
          Les modèles utilisent des variables automatiquement remplacées par les données réelles lors de la génération.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {['{{apprenant.nom}}', '{{apprenant.prenom}}', '{{session.id}}', '{{formation.intitule}}', '{{entreprise.raison_sociale}}', '{{tuteur.nom}}', '{{date_debut_formation}}', '{{date_fin_formation}}', '{{heures_realisees}}', '{{taux_presence}}'].map((v) => (
            <code key={v} style={{ backgroundColor: 'white', color: COLORS.primary, padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace', border: `1px solid ${COLORS.primary}` }}>
              {v}
            </code>
          ))}
        </div>
      </div>

      {/* Filtres famille */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {FAMILLES_MODELES.map((f) => (
          <button key={f} onClick={() => setFamille(f)} style={{
            backgroundColor: famille === f ? COLORS.primary : 'white',
            color: famille === f ? 'white' : COLORS.primary,
            border: `1.5px solid ${COLORS.primary}`,
            borderRadius: '20px', padding: '6px 16px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>
            {f === 'Tous' ? `Tous (${MODELES.length})` : `${f} (${MODELES.filter(m => m.famille === f).length})`}
          </button>
        ))}
      </div>

      {/* Grille des modèles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {filtres.map((m) => {
          const sf = FAMILLE_STYLE[m.famille] ?? { bg: '#f0f0f0', color: '#888' };
          const ss = STATUT_MODELE[m.statut] ?? { bg: '#f0f0f0', color: '#888' };
          const sf2 = FORMAT_STYLE[m.format] ?? { bg: '#f0f0f0', color: '#888' };
          const estSelectionne = modeleSelectionne === m.id;
          return (
            <div key={m.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: estSelectionne ? `0 0 0 2px ${COLORS.primary}` : '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onClick={() => setModeleSelectionne(estSelectionne ? null : m.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ backgroundColor: sf.bg, color: sf.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{m.famille}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ backgroundColor: ss.bg, color: ss.color, padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{m.statut}</span>
                  <span style={{ backgroundColor: sf2.bg, color: sf2.color, padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{m.format}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.text, marginBottom: '6px' }}>{m.nom}</div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '12px', lineHeight: '1.5' }}>{m.description}</div>
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '12px' }}>Mis à jour le {m.derniereMaj}</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button onClick={(e) => { e.stopPropagation(); setModeleSelectionne(m.id); }} style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                  Voir détail
                </button>
                <a href={m.lien ?? '/documents/apercu'} onClick={(e) => e.stopPropagation()} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' }}>
                  Générer
                </a>
                <button onClick={(e) => e.stopPropagation()} style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                  Modifier
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Détail modèle sélectionné */}
      {modele && (
        <Card style={{ marginBottom: '24px', borderTop: `4px solid ${COLORS.primary}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
              Détail — {modele.nom}
            </h2>
            <button onClick={() => setModeleSelectionne(null)} style={{ backgroundColor: '#f0f0f0', color: '#888', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
              Fermer ✕
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '10px' }}>Données nécessaires</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {modele.donneesNecessaires.map((d, i) => (
                  <div key={i} style={{ fontSize: '13px', color: COLORS.text, padding: '4px 8px', backgroundColor: COLORS.background, borderRadius: '6px' }}>
                    ✓ {d}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '10px' }}>Champs dynamiques</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {modele.champsVariables.map((v, i) => (
                  <code key={i} style={{ backgroundColor: '#f0f4ff', color: '#3a5bc7', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace', border: '1px solid #c7d7ff' }}>
                    {v}
                  </code>
                ))}
              </div>
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: COLORS.background, borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: COLORS.textMuted, lineHeight: '1.6' }}>
                  Ces champs seront automatiquement remplacés par les données réelles lors de la génération du document.
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Simulation de génération */}
      <Card style={{ marginBottom: '24px', borderTop: `4px solid ${COLORS.secondary}` }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Simulation de génération
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Type de document</label>
            <select style={{ ...inputStyle }} value={simType} onChange={(e) => { setSimType(e.target.value); setSimResultat(false); }}>
              {MODELES.map(m => <option key={m.id} value={m.nom}>{m.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Apprenant</label>
            <select style={inputStyle} value={simApprenant} onChange={(e) => { setSimApprenant(e.target.value); setSimResultat(false); }}>
              <option>Léa PAYET</option>
              <option>Noah RIVIERE</option>
              <option>Emma HOARAU</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Session</label>
            <select style={inputStyle} value={simSession} onChange={(e) => { setSimSession(e.target.value); setSimResultat(false); }}>
              <option>SC-2025-06</option>
              <option>AD-2026-01</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Entreprise</label>
            <select style={inputStyle} value={simEntreprise} onChange={(e) => { setSimEntreprise(e.target.value); setSimResultat(false); }}>
              <option>Entreprise A</option>
              <option>Entreprise B</option>
              <option>Entreprise C</option>
            </select>
          </div>
        </div>
        <button style={{ ...btnPrimary, padding: '12px 32px', fontSize: '14px' }} onClick={() => setSimResultat(true)}>
          🚀 Générer avec données fictives
        </button>

        {simResultat && (
          <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#e6f4f1', borderRadius: '10px', border: `2px solid ${COLORS.primary}` }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
              ✅ Document généré avec succès (simulation)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Document', value: simType },
                { label: 'Apprenant', value: simApprenant },
                { label: 'Session', value: simSession },
                { label: 'Entreprise', value: simEntreprise },
              ].map((info) => (
                <div key={info.label} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>{info.label}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: COLORS.text }}>{info.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Statut : Généré</span>
              <span style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Version : V1</span>
              <button style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Ouvrir</button>
              <button style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Télécharger</button>
              <button style={{ backgroundColor: '#f0f4ff', color: '#3a5bc7', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✍️ Marquer à signer</button>
            </div>
            <div style={{ marginTop: '12px', fontSize: '11px', color: COLORS.textMuted, fontStyle: 'italic' }}>
              Document généré avec EasyCFA — solution éditée par PAM GROUPE
            </div>
          </div>
        )}
      </Card>

      {/* Règles de génération */}
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Règles de génération EasyCFA
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            '📋 Chaque document généré est enregistré dans le registre documentaire.',
            '🔢 Chaque document doit avoir un numéro de version.',
            '🔒 Un document signé ne peut jamais être écrasé.',
            '📝 Toute correction crée automatiquement une nouvelle version.',
            '🔗 Chaque document est rattaché à un apprenant, une entreprise, une session ou un formateur.',
            '🏷 Mention obligatoire : "Document généré avec EasyCFA — solution éditée par PAM GROUPE".',
            '🔐 Les documents sensibles sont signalés avec un badge Accès restreint.',
            '✍️ Les documents à signer ont les statuts : À faire signer / Envoyé / Signé / Archivé.',
          ].map((r, i) => (
            <div key={i} style={{ padding: '10px 14px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '13px', color: COLORS.text }}>
              {r}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}