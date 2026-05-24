'use client';

import { useState } from 'react';
import { REFERENTIEL_FORMATIONS } from '../../../../data/mockData';
import { COLORS } from '../../../../lib/constants';
import Card from '../../../../components/Card';
import { chargerNpec, creerNpec, modifierNpec, type Npec } from '../../../../data/npecSupabase';

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

function parseDureeMois(duree: string): number {
  if (!duree) return 0;
  const m = duree.match(/(\d+)\s*mois/i);
  return m ? parseInt(m[1]) : 0;
}

export default function ImportReferentielNpec() {
  const [log, setLog] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [termine, setTermine] = useState(false);

  // Filtre les versions actives uniquement (pas les archives)
  const formationsActives = (REFERENTIEL_FORMATIONS as any[]).filter(f => !f.archive);

  async function importer() {
    setEnCours(true);
    setLog([]);
    setTermine(false);

    const existants = await chargerNpec();
    const existantsParRncp = new Map(existants.map(n => [n.codeRncp.toUpperCase().replace(/\s+/g, ''), n]));

    let created = 0, updated = 0;
    const logs: string[] = [];

    for (const f of formationsActives) {
      const rncpNorm = (f.rncp || '').toUpperCase().replace(/\s+/g, '');
      const existant = existantsParRncp.get(rncpNorm);

      const baseData: Partial<Npec> = {
        codeInterne: f.id,
        codeDiplome: f.codeDiplome || '',
        codeRncp: f.rncp || '',
        intitule: f.intitule || '',
        nbHeuresFormation: f.volumeHoraireCFA || 0,
        dureeMois: parseDureeMois(f.dureeContrat),
        actif: true,
      };

      if (existant && existant.id) {
        await modifierNpec(existant.id, baseData);
        updated++;
        logs.push(`🔄 Mis à jour : ${f.rncp} — ${f.intitule.substring(0, 50)}...`);
      } else {
        await creerNpec({
          ...baseData,
          montantNpecAnnuel: 0,
          coutMensuel: 0,
          coutHoraire: 0,
          repasAnnee1: 0,
          repasAnnee2: 0,
          montantRepasAnnee1: 0,
          montantRepasAnnee2: 0,
          fpe: 0,
        });
        created++;
        logs.push(`➕ Créé : ${f.rncp} — ${f.intitule.substring(0, 50)}... (données financières à compléter)`);
      }
      setLog([...logs]);
    }

    logs.push('');
    logs.push(`═══════════════════════════════════`);
    logs.push(`✅ Terminé : ${created} créé(s), ${updated} mis à jour`);
    setLog([...logs]);
    setEnCours(false);
    setTermine(true);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/npec" style={{ color: COLORS.primary, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← Retour au référentiel NPEC</a>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary, marginTop: 8, marginBottom: 4 }}>
          Import depuis REFERENTIEL_FORMATIONS
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>
          Pré-remplit la table NPEC avec les données partagées du référentiel formations
        </p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: COLORS.primary, marginBottom: 12 }}>
          📋 Aperçu des formations à importer ({formationsActives.length})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {formationsActives.map(f => (
            <div key={f.id} style={{ padding: '8px 12px', backgroundColor: COLORS.background, borderRadius: 6, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: COLORS.primary }}>{f.id} — {f.rncp}</div>
              <div style={{ color: '#555', fontSize: 11 }}>{f.intitule}</div>
              <div style={{ color: '#888', fontSize: 10, marginTop: 2 }}>
                Code diplôme : {f.codeDiplome} · {f.volumeHoraireCFA}h · {f.dureeContrat}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: 12, backgroundColor: '#fff8e1', borderLeft: '4px solid #C8A23A', borderRadius: 6, marginBottom: 16 }}>
          <strong style={{ color: '#7a5c00', fontSize: 13 }}>⚠️ Ce que fait l'import :</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 12, color: '#5a4000', lineHeight: 1.6 }}>
            <li>Crée une ligne NPEC pour chaque formation ACTIVE (les archivées sont ignorées)</li>
            <li>Pré-remplit : code interne (SC, GCF...), code diplôme, code RNCP, intitulé, heures CFA, durée mois</li>
            <li>Si une ligne existe déjà pour ce RNCP : mise à jour, <strong>conservation des valeurs financières</strong></li>
            <li>Les valeurs financières (NPEC annuel, coût mensuel, repas, FPE) sont à compléter sur <a href="/admin/npec" style={{ color: COLORS.primary, fontWeight: 600 }}>/admin/npec</a></li>
          </ul>
        </div>

        <button
          onClick={importer}
          disabled={enCours}
          style={{ ...btnPrimary, opacity: enCours ? 0.6 : 1, cursor: enCours ? 'wait' : 'pointer' }}
        >
          {enCours ? '⏳ Import en cours...' : `🚀 Lancer l'import (${formationsActives.length} formations)`}
        </button>
      </Card>

      {log.length > 0 && (
        <Card>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: COLORS.primary, marginBottom: 12 }}>📜 Journal de l'import</h2>
          <div style={{
            backgroundColor: '#1a1a1a', color: '#a0e0a0', borderRadius: 6, padding: 12,
            fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, maxHeight: 400, overflowY: 'auto',
          }}>
            {log.map((l, i) => (
              <div key={i}>{l || '\u00A0'}</div>
            ))}
          </div>
          {termine && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <a href="/admin/npec" style={{ ...btnPrimary, textDecoration: 'none' as any, display: 'inline-block' }}>→ Voir la table NPEC</a>
              <a href="/documents/convention" style={{ ...btnSecondary, textDecoration: 'none' as any, display: 'inline-block' }}>→ Tester sur la Convention</a>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}