'use client';

import { useState } from 'react';
import { migrerApcsDepuisLocalStorage, chargerApcs } from '../../data/apcsSupabase';

export default function MigrationApcs() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState<{ apcs: number; echeances: number } | null>(null);

  const ajouterLog = (msg: string) =>
    setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const verifier = async () => {
    try {
      const data = await chargerApcs();
      const totalEch = data.reduce((sum, a) => sum + (a.echeances?.length || 0), 0);
      setCount({ apcs: data.length, echeances: totalEch });
      ajouterLog(`📊 Supabase contient ${data.length} APC(s) et ${totalEch} échéance(s)`);
    } catch (e: any) {
      ajouterLog(`❌ Erreur lecture : ${e?.message || e}`);
    }
  };

  const lancerMigration = async () => {
    if (!confirm('Migrer les APCs et leurs échéances vers Supabase ?\n\nCela peut prendre quelques secondes.')) return;
    setRunning(true);
    setLog([]);
    try {
      const raw = localStorage.getItem('easycfa_apcs_v2');
      if (!raw) {
        ajouterLog('❌ Aucune donnée trouvée dans easycfa_apcs_v2');
        setRunning(false);
        return;
      }
      const apcs = JSON.parse(raw);
      const totalEch = apcs.reduce((s: number, a: any) => s + (a.echeances?.length || 0), 0);
      ajouterLog(`📦 ${apcs.length} APC(s) trouvés avec ${totalEch} échéance(s) en localStorage`);

      const res = await migrerApcsDepuisLocalStorage(apcs);
      ajouterLog(`✅ Migration terminée — ${res.success} APC(s) / ${res.totalEcheances} échéance(s)`);
      if (res.erreurs.length > 0) ajouterLog(`⚠️ Erreurs : ${JSON.stringify(res.erreurs)}`);
      if (res.ignores.length > 0) ajouterLog(`ℹ️ Ignorés : ${JSON.stringify(res.ignores)}`);

      await verifier();
    } catch (e: any) {
      ajouterLog(`❌ Erreur : ${e?.message || e}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 900 }}>
      <h1 style={{ color: '#006B68' }}>Migration APCs + Échéances → Supabase</h1>
      <p style={{ background: '#fff3cd', padding: 12, borderLeft: '4px solid #C8A23A' }}>
        ⚠️ Migration en 2 tables relationnelles (apcs + echeances).
        Compte tenu du volume (46 APCs + 252 échéances), prévoir 20-40 secondes.
      </p>

      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <button onClick={lancerMigration} disabled={running} style={{ background: '#006B68', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1 }}>
          {running ? '⏳ En cours...' : '🚀 Lancer la migration'}
        </button>
        <button onClick={verifier} style={{ background: '#C8A23A', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          🔍 Vérifier Supabase
        </button>
      </div>

      {count !== null && (
        <p>
          <strong>Total Supabase :</strong> {count.apcs} APC(s) — {count.echeances} échéance(s)
        </p>
      )}

      <pre style={{ background: '#EAF4F3', padding: 12, fontSize: 13, maxHeight: 400, overflow: 'auto' }}>
        {log.length === 0 ? 'En attente...' : log.join('\n')}
      </pre>
    </div>
  );
}