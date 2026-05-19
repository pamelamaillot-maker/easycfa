'use client';

import { useState } from 'react';
import { migrerEntreprisesDepuisLocalStorage, chargerEntreprises } from '../../data/entreprisesSupabase';
import { ENTREPRISES_REELS } from '../../data/mockEntreprises_reels';

export default function MigrationEntreprises() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const ajouterLog = (msg: string) =>
    setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const verifier = async () => {
    try {
      const data = await chargerEntreprises();
      setCount(data.length);
      ajouterLog(`📊 Supabase contient ${data.length} entreprise(s)`);
    } catch (e: any) {
      ajouterLog(`❌ Erreur lecture : ${e?.message || e}`);
    }
  };

  const lancerMigration = async () => {
    if (!confirm('Migrer les entreprises (mock + localStorage) vers Supabase ?')) return;
    setRunning(true);
    setLog([]);
    try {
      // 1. Mock seed (47 entreprises)
      const seed = (ENTREPRISES_REELS as any[]) || [];
      ajouterLog(`📦 ${seed.length} entreprise(s) trouvée(s) dans le mock seed`);

      // 2. localStorage persisté (les nouvelles)
      let persistees: any[] = [];
      try {
        const raw = localStorage.getItem('easycfa_entreprises_v2');
        if (raw) persistees = JSON.parse(raw);
      } catch {}
      ajouterLog(`📦 ${persistees.length} entreprise(s) trouvée(s) dans localStorage`);

      // 3. Fusion (priorité au localStorage si même id)
      const map = new Map<string, any>();
      seed.forEach((e: any) => map.set(e.id, e));
      persistees.forEach((e: any) => map.set(e.id, e)); // écrase si existe
      const toutes = Array.from(map.values());
      ajouterLog(`🔀 ${toutes.length} entreprise(s) après dédoublonnage`);

      const res = await migrerEntreprisesDepuisLocalStorage(toutes);
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
      <h1 style={{ color: '#006B68' }}>Migration entreprises → Supabase</h1>
      <p style={{ background: '#fff3cd', padding: 12, borderLeft: '4px solid #C8A23A' }}>
        ⚠️ Migre les entreprises du mock seed (47) + du localStorage (PAMOI persisté).
      </p>

      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <button onClick={lancerMigration} disabled={running} style={{ background: '#006B68', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1 }}>
          {running ? '⏳ En cours...' : '🚀 Lancer la migration'}
        </button>
        <button onClick={verifier} style={{ background: '#C8A23A', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          🔍 Vérifier Supabase
        </button>
      </div>

      {count !== null && <p><strong>Total Supabase :</strong> {count} entreprise(s)</p>}

      <pre style={{ background: '#EAF4F3', padding: 12, fontSize: 13, maxHeight: 400, overflow: 'auto' }}>
        {log.length === 0 ? 'En attente...' : log.join('\n')}
      </pre>
    </div>
  );
}