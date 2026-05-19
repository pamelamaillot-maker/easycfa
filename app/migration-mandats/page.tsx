'use client';

import { useState } from 'react';
import { migrerMandatsDepuisLocalStorage, chargerMandats } from '../../data/mandatsSupabase';

export default function MigrationMandats() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const ajouterLog = (msg: string) =>
    setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const verifier = async () => {
    try {
      const data = await chargerMandats();
      setCount(data.length);
      ajouterLog(`📊 Supabase contient ${data.length} mandat(s)`);
    } catch (e: any) {
      ajouterLog(`❌ Erreur lecture : ${e?.message || e}`);
    }
  };

  const lancerMigration = async () => {
    if (!confirm('Migrer les mandats du localStorage vers Supabase ?')) return;
    setRunning(true);
    setLog([]);
    try {
      const raw = localStorage.getItem('easycfa_mandats');
      if (!raw) {
        ajouterLog('❌ Aucune donnée trouvée dans easycfa_mandats');
        setRunning(false);
        return;
      }
      const mandats = JSON.parse(raw);
      ajouterLog(`📦 ${mandats.length} mandat(s) trouvé(s) en localStorage`);
      const res = await migrerMandatsDepuisLocalStorage(mandats);
      ajouterLog(`✅ Migration terminée`);
      ajouterLog(`Résultat : ${JSON.stringify(res)}`);
      await verifier();
    } catch (e: any) {
      ajouterLog(`❌ Erreur : ${e?.message || e}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 900 }}>
      <h1 style={{ color: '#006B68' }}>Migration mandats → Supabase</h1>
      <p style={{ background: '#fff3cd', padding: 12, borderLeft: '4px solid #C8A23A' }}>
        ⚠️ Outil ponctuel.
      </p>

      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <button onClick={lancerMigration} disabled={running} style={{ background: '#006B68', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1 }}>
          {running ? '⏳ En cours...' : '🚀 Lancer la migration'}
        </button>
        <button onClick={verifier} style={{ background: '#C8A23A', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          🔍 Vérifier Supabase
        </button>
      </div>

      {count !== null && <p><strong>Total Supabase :</strong> {count} mandat(s)</p>}

      <pre style={{ background: '#EAF4F3', padding: 12, fontSize: 13, maxHeight: 400, overflow: 'auto' }}>
        {log.length === 0 ? 'En attente...' : log.join('\n')}
      </pre>
    </div>
  );
}