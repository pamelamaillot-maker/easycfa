'use client';

import { useEffect, useState } from 'react';
import { chargerApprentis } from '@/data/apprentisSupabase';

export default function TestSupabase() {
  const [status, setStatus] = useState('Test en cours...');
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    chargerApprentis()
      .then((res) => {
        setData(res);
        setStatus(`✅ Connexion OK — ${res.length} apprenti(s) dans la table`);
      })
      .catch((e) => {
        setError(String(e?.message || e));
        setStatus('❌ Erreur connexion');
      });
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#006B68' }}>Test Supabase — table apprentis</h1>
      <p><strong>Statut :</strong> {status}</p>
      {error && (
        <pre style={{ background: '#fee', padding: 12, color: '#900' }}>
          {error}
        </pre>
      )}
      <pre style={{ background: '#EAF4F3', padding: 12 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}