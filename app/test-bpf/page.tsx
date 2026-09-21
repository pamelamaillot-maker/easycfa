'use client';

// app/test-bpf/page.tsx
// PAGE TEMPORAIRE — à supprimer après validation du cadre F.
// Vérifie que calculerCadreF() compte correctement les apprentis réels
// et met en évidence les doublons de saisie à corriger en base.

import { useState } from 'react';
import { calculerCadreF, estErreurCadreF, type CadreF } from '../../lib/calculBpfCadreF';

const VERT = '#006B68';
const DORE = '#C8A23A';
const FOND = '#EAF4F3';
const ROUGE = '#e53e3e';

const inputStyle: React.CSSProperties = {
  border: '1.5px solid #e0e0e0',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  width: '160px',
  backgroundColor: 'white',
};

const btnStyle: React.CSSProperties = {
  backgroundColor: VERT,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '9px 18px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const thStyle: React.CSSProperties = {
  padding: '8px',
  textAlign: 'left',
  fontWeight: 600,
  color: VERT,
};

const tdStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #eee',
};

function Carte({ valeur, libelle, couleur }: { valeur: number | string; libelle: string; couleur: string }) {
  return (
    <div style={{ backgroundColor: FOND, borderRadius: '10px', padding: '16px 20px', minWidth: '150px' }}>
      <div style={{ fontSize: '30px', fontWeight: 700, color: couleur, lineHeight: 1.1 }}>{valeur}</div>
      <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{libelle}</div>
    </div>
  );
}

export default function TestBpf() {
  const [debut, setDebut] = useState('30/12/2024');
  const [fin, setFin] = useState('29/12/2025');
  const [resultat, setResultat] = useState<CadreF | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function lancer() {
    setChargement(true);
    setErreur(null);
    setResultat(null);
    const r = await calculerCadreF(debut, fin);
    if (estErreurCadreF(r)) {
      setErreur(r.erreur);
    } else {
      setResultat(r);
      console.log('[Test cadre F]', r);
    }
    setChargement(false);
  }

  return (
    <div style={{ padding: '32px', fontFamily: 'system-ui, sans-serif', maxWidth: '1150px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: VERT, marginBottom: '4px' }}>
        Test — Cadre F du BPF
      </h1>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>
        Page temporaire de vérification. À supprimer une fois le calcul validé.
      </p>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Début d&apos;exercice
          </label>
          <input style={inputStyle} value={debut} onChange={e => setDebut(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Fin d&apos;exercice
          </label>
          <input style={inputStyle} value={fin} onChange={e => setFin(e.target.value)} />
        </div>
        <button style={btnStyle} onClick={lancer} disabled={chargement}>
          {chargement ? 'Calcul en cours…' : 'Calculer'}
        </button>
      </div>

      {erreur && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fdecea', border: `1px solid ${ROUGE}`, borderRadius: '8px', color: '#a12', fontSize: '13px', marginBottom: '20px' }}>
          {erreur}
        </div>
      )}

      {resultat && (
        <>
          <div style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>
            Exercice du {resultat.exerciceDebut} au {resultat.exerciceFin}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <Carte valeur={resultat.apprentisNombre} libelle="apprentis — ligne F-1.b" couleur={VERT} />
            <Carte valeur={resultat.contratsNombre} libelle="lignes de contrat en base" couleur="#555" />
            <Carte
              valeur={resultat.doublons.length}
              libelle="personnes en double"
              couleur={resultat.doublons.length > 0 ? DORE : VERT}
            />
          </div>

          {/* ---------------- DOUBLONS ---------------- */}
          {resultat.doublons.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: VERT, marginBottom: '4px' }}>
                Personnes présentes plusieurs fois
              </h2>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                Comptées une seule fois dans le cadre F. À vérifier en base : un chevauchement
                de dates signale généralement une erreur de saisie.
              </p>

              {resultat.doublons.map((d, i) => (
                <div
                  key={i}
                  style={{
                    border: `1.5px solid ${d.chevauchement ? ROUGE : DORE}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    marginBottom: '12px',
                    backgroundColor: d.chevauchement ? '#fdecea' : '#fef6e4',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#333', marginBottom: '2px' }}>
                    {d.nom} {d.prenom}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                    Né(e) le {d.dateNaissance || '— date manquante —'} · {d.contrats.length} contrats
                    {d.chevauchement && (
                      <strong style={{ color: ROUGE }}> · dates qui se chevauchent</strong>
                    )}
                  </div>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Formation</th>
                        <th style={thStyle}>Début</th>
                        <th style={thStyle}>Fin</th>
                        <th style={thStyle}>Statut</th>
                        <th style={thStyle}>Identifiant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.contrats.map(c => (
                        <tr key={c.id}>
                          <td style={tdStyle}>{c.formation}</td>
                          <td style={tdStyle}>{c.dateDebutContrat}</td>
                          <td style={tdStyle}>{c.dateFinContrat}</td>
                          <td style={tdStyle}>{c.statut}</td>
                          <td style={{ ...tdStyle, color: '#999', fontFamily: 'monospace' }}>{c.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* ---------------- VENTILATION ---------------- */}
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: VERT, marginBottom: '10px' }}>
            Ventilation par niveau (cadre F-3)
          </h2>
          <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '420px', marginBottom: '28px', fontSize: '13px' }}>
            <tbody>
              {resultat.parNiveau.map(l => (
                <tr key={l.niveau}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>{l.libelle}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'right', fontWeight: 700 }}>
                    {l.nombre}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>Total</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: VERT }}>
                  {resultat.parNiveau.reduce((s, l) => s + l.nombre, 0)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ---------------- ALERTES ---------------- */}
          {resultat.sansDateNaissance.length > 0 && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fef6e4', border: `1px solid ${DORE}`, borderRadius: '8px', fontSize: '13px', color: '#7a5c00', marginBottom: '20px' }}>
              <strong>Date de naissance manquante</strong> — rapprochement fait sur nom et prénom seuls :
              <ul style={{ margin: '8px 0 0 18px' }}>
                {resultat.sansDateNaissance.map(n => <li key={n}>{n}</li>)}
              </ul>
            </div>
          )}

          {resultat.formationsInconnues.length > 0 && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fef6e4', border: `1px solid ${DORE}`, borderRadius: '8px', fontSize: '13px', color: '#7a5c00', marginBottom: '20px' }}>
              <strong>Formations non reconnues</strong> — ces apprentis ne sont ventilés dans aucun niveau :
              <ul style={{ margin: '8px 0 0 18px' }}>
                {resultat.formationsInconnues.map(f => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}

          {/* ---------------- DÉTAIL ---------------- */}
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: VERT, marginBottom: '10px' }}>
            Détail nominatif ({resultat.detail.length} personnes)
          </h2>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: FOND }}>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Prénom</th>
                <th style={thStyle}>Naissance</th>
                <th style={thStyle}>Formation</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Niveau</th>
                <th style={thStyle}>Début contrat</th>
                <th style={thStyle}>Fin contrat</th>
                <th style={thStyle}>Statut</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Contrats</th>
              </tr>
            </thead>
            <tbody>
              {resultat.detail.map(d => (
                <tr key={d.id} style={{ backgroundColor: d.nbContrats > 1 ? '#fef6e4' : 'transparent' }}>
                  <td style={tdStyle}>{d.nom}</td>
                  <td style={tdStyle}>{d.prenom}</td>
                  <td style={tdStyle}>{d.dateNaissance}</td>
                  <td style={tdStyle}>
                    {d.formation}
                    {d.formationsMultiples && (
                      <span style={{ color: DORE, fontWeight: 700 }} title="Formations différentes entre les contrats"> ⚠</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: d.niveau ? '#333' : ROUGE, fontWeight: d.niveau ? 400 : 700 }}>
                    {d.niveau ?? '?'}
                  </td>
                  <td style={tdStyle}>{d.dateDebutContrat}</td>
                  <td style={tdStyle}>{d.dateFinContrat}</td>
                  <td style={tdStyle}>{d.statut}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: d.nbContrats > 1 ? 700 : 400 }}>
                    {d.nbContrats}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
