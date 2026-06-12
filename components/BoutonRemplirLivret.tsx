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
        setErreur('__AUTH__'); // marqueur spécial : on affiche l'encadré "reconnexion Google"
        return;
      }

      if (data.success) {
        console.log(`[Livret] Document rempli : ${data.message}`);
        setLienGenere(data.lienDoc);
      } else {
        // Erreur renvoyée par l'API (template, permission Drive, quota...)
        setErreur(data.error || `Erreur API (statut ${res.status})`);
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

      {/* Encadré erreur — distingue "Google déconnecté" d'une erreur technique */}
      {erreur === '__AUTH__' && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          minWidth: 340,
          padding: '14px 16px',
          backgroundColor: '#fff8e1',
          border: '2px solid #C8A23A',
          borderRadius: 10,
          boxShadow: '0 4px 16px rgba(200,162,58,0.25)',
          zIndex: 10,
        }}>
          <div style={{ fontSize: 13, color: '#7a5c00', fontWeight: 700, marginBottom: 6 }}>
            🔑 Connexion Google expirée
          </div>
          <div style={{ fontSize: 12, color: '#7a5c00', marginBottom: 10, lineHeight: 1.5 }}>
            La connexion à Google Docs a expiré. Reconnectez-vous, puis relancez la génération du livret.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            
              <a href="/api/auth/google" style={{ backgroundColor: '#006B68', color: 'white', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Reconnecter Google</a>
            <button
              onClick={() => setErreur(null)}
              style={{ backgroundColor: 'white', color: '#7a5c00', border: '1.5px solid #C8A23A', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {erreur && erreur !== '__AUTH__' && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          minWidth: 340,
          padding: '12px 14px',
          backgroundColor: '#fde8e8',
          border: '2px solid #e53e3e',
          borderRadius: 10,
          zIndex: 10,
        }}>
          <div style={{ fontSize: 13, color: '#e53e3e', fontWeight: 700, marginBottom: 4 }}>
            ⚠️ Le livret n'a pas pu être généré
          </div>
          <div style={{ fontSize: 12, color: '#7a1a1a', marginBottom: 8, lineHeight: 1.5 }}>
            {erreur}
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 8, fontStyle: 'italic' }}>
            Si le problème persiste alors que Google est connecté, réessayez dans quelques secondes (l'API Google Docs peut être momentanément lente).
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={generer}
              style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              🔄 Réessayer
            </button>
            <button
              onClick={() => setErreur(null)}
              style={{ backgroundColor: 'white', color: '#e53e3e', border: '1.5px solid #e53e3e', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}