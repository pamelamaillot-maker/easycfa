'use client';

import { useState } from 'react';
import { migrerEntretiensDepuisLocalStorage, chargerEntretiens } from '../../data/entretiensSupabase';

export default function MigrationEntretiens() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const ajouterLog = (msg: string) =>
    setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const verifier = async () => {
    try {
      const data = await chargerEntretiens();
      setCount(data.length);
      ajouterLog(`📊 Supabase contient ${data.length} entretien(s)`);
    } catch (e: any) {
      ajouterLog(`❌ Erreur lecture : ${e?.message || e}`);
    }
  };

  const lancerMigration = async () => {
    if (!confirm('Migrer les entretiens du localStorage vers Supabase ?')) return;
    setRunning(true);
    setLog([]);
    try {
      const raw = localStorage.getItem('easycfa_entretiens_v1');
      if (!raw) {
        ajouterLog('❌ Aucune donnée trouvée dans easycfa_entretiens_v1');
        setRunning(false);
        return;
      }
      const entretiens = JSON.parse(raw);
      ajouterLog(`📦 ${entretiens.length} entretien(s) trouvé(s) en localStorage`);

      const res = await migrerEntretiensDepuisLocalStorage(entretiens);
      ajouterLog(`✅ Migration terminée — ${res.success}/${entretiens.length}`);
      if (res.erreurs.length > 0) {
        ajouterLog(`⚠️ ${res.erreurs.length} erreur(s) :`);
        res.erreurs.slice(0, 5).forEach(e => ajouterLog(`  - ${e}`));
        if (res.erreurs.length > 5) ajouterLog(`  ... et ${res.erreurs.length - 5} autres`);
      }
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
      <h1 style={{ color: '#006B68' }}>Migration entretiens → Supabase</h1>
      <p style={{ background: '#fff3cd', padding: 12, borderLeft: '4px solid #C8A23A' }}>
        ⚠️ La clé localStorage est `easycfa_entretiens_v1`. La table est `entretiens` (FK vers apprenants avec cascade).
      </p>

      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <button onClick={lancerMigration} disabled={running} style={{ background: '#006B68', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1 }}>
          {running ? '⏳ En cours...' : '🚀 Lancer la migration'}
        </button>
        <button onClick={verifier} style={{ background: '#C8A23A', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          🔍 Vérifier Supabase
        </button>
      </div>

      {count !== null && <p><strong>Total Supabase :</strong> {count} entretien(s)</p>}

      <pre style={{ background: '#EAF4F3', padding: 12, fontSize: 13, maxHeight: 400, overflow: 'auto' }}>
        {log.length === 0 ? 'En attente...' : log.join('\n')}
      </pre>
    </div>
  );
}