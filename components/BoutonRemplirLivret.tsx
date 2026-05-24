'use client';

import { useState } from 'react';
import { TEMPLATES_LIVRET, assemblerDonneesLivret } from '../lib/donneesLivret';

type Props = {
  apprenant: any;
  entreprise: any | null;
  npec: any | null;
};

export default function BoutonRemplirLivret({ apprenant, entreprise, npec }: Props) {
  const [loading, setLoading] = useState(false);
  const [lienGenere, setLienGenere] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const tpl = TEMPLATES_LIVRET[apprenant.formation];

  if (!tpl) {
    return (
      <button
        disabled
        title={`Aucun template de livret pour la formation '${apprenant.formation}'`}
        style={{ backgroundColor: '#ccc', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed' }}
      >
        📓 Livret indisponible ({apprenant.formation})
      </button>
    );
  }

  async function generer() {
    setLoading(true);
    setErreur(null);
    setLienGenere(null);
    try {
      const donnees = assemblerDonneesLivret(apprenant, entreprise, npec);
      console.log('[Livret] donnees envoyées :', donnees);

      const res = await fetch('/api/docs/remplir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: tpl.templateId, donnees }),
      });
      const data = await res.json();

      if (data.authRequired) {
        alert('Authentification Google requise. Redirection...');
        window.location.href = '/api/auth/google';
        return;
      }

      if (data.success) {
        console.log(`[Livret] Document rempli : ${data.message}`);
        setLienGenere(data.lienDoc);
      } else {
        setErreur(data.error || 'Erreur inconnue');
      }
    } catch (e: any) {
      setErreur(`Erreur réseau : ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'inline-block', position: 'relative' }}>
      <button
        onClick={generer}
        disabled={loading}
        style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? '⏳ Génération en cours (≈10s)...' : '📓 Générer Livret rempli'}
      </button>

      {/* Encadré vert avec lien quand prêt */}
      {lienGenere && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          minWidth: 320,
          padding: '12px 14px',
          backgroundColor: '#e6f4f1',
          border: '2px solid #006B68',
          borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,107,104,0.2)',
          zIndex: 10,
        }}>
          <div style={{ fontSize: 13, color: '#006B68', fontWeight: 700, marginBottom: 8 }}>
            ✅ Livret généré avec succès !
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            
            <a href={lienGenere}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: '#006B68', color: 'white', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              📓 Ouvrir le Livret
            </a>
            <button
              onClick={() => setLienGenere(null)}
              style={{ backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Encadré erreur */}
      {erreur && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          minWidth: 320,
          padding: '12px 14px',
          backgroundColor: '#fde8e8',
          border: '2px solid #e53e3e',
          borderRadius: 10,
          zIndex: 10,
        }}>
          <div style={{ fontSize: 13, color: '#e53e3e', fontWeight: 700, marginBottom: 4 }}>
            ⚠️ Erreur
          </div>
          <div style={{ fontSize: 12, color: '#7a1a1a' }}>{erreur}</div>
          <button
            onClick={() => setErreur(null)}
            style={{ marginTop: 8, backgroundColor: 'white', color: '#e53e3e', border: '1.5px solid #e53e3e', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}