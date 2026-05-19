'use client';

import { useState } from 'react';
import { migrerSessionsDepuisLocalStorage, chargerSessions } from '../../data/sessionsSupabase';

export default function MigrationSessions() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const ajouterLog = (msg: string) =>
    setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const verifier = async () => {
    try {
      const data = await chargerSessions();
      setCount(data.length);
      ajouterLog(`📊 Supabase contient ${data.length} session(s)`);
    } catch (e: any) {
      ajouterLog(`❌ Erreur lecture : ${e?.message || e}`);
    }
  };

  const lancerMigration = async () => {
    if (!confirm('Migrer les sessions du localStorage vers Supabase ?')) return;
    setRunning(true);
    setLog([]);

    try {
      const raw = localStorage.getItem('easycfa_sessions_v2');
      if (!raw) {
        ajouterLog('❌ Aucune donnée trouvée dans easycfa_sessions_v2');
        setRunning(false);
        return;
      }

      const sessions = JSON.parse(raw);
      ajouterLog(`📦 ${sessions.length} session(s) trouvée(s) en localStorage`);

      const res = await migrerSessionsDepuisLocalStorage(sessions);
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
      <h1 style={{ color: '#006B68' }}>Migration sessions → Supabase</h1>
      <p style={{ background: '#fff3cd', padding: 12, borderLeft: '4px solid #C8A23A' }}>
        ⚠️ Outil ponctuel. À utiliser une seule fois pour importer les sessions du localStorage.
      </p>

      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <button
          onClick={lancerMigration}
          disabled={running}
          style={{
            background: '#006B68',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: 4,
            cursor: running ? 'not-allowed' : 'pointer',
            opacity: running ? 0.6 : 1,
          }}
        >
          {running ? '⏳ Migration en cours...' : '🚀 Lancer la migration'}
        </button>

        <button
          onClick={verifier}
          style={{
            background: '#C8A23A',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          🔍 Vérifier Supabase
        </button>
      </div>

      {count !== null && (
        <p><strong>Total Supabase :</strong> {count} session(s)</p>
      )}

      <pre style={{ background: '#EAF4F3', padding: 12, fontSize: 13, maxHeight: 400, overflow: 'auto' }}>
        {log.length === 0 ? 'En attente...' : log.join('\n')}
      </pre>
    </div>
  );
}