'use client';

import { useState } from 'react';
import { DOCUMENTS, DOCUMENTS_STATS } from '../../data/mockDocuments';
import { COLORS } from '../../lib/constants';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';

const FAMILLES = ['Tous', 'Apprenti', 'Entreprise', 'Formateur', 'EasyCFA'];

const STATUT_DOC: Record<string, { bg: string; color: string }> = {
  'Disponible':     { bg: '#e6f4f1', color: '#006B68' },
  'À importer':     { bg: '#fde8e8', color: '#e53e3e' },
  'À contrôler':    { bg: '#fef6e4', color: '#C8A23A' },
  'À faire signer': { bg: '#f0f4ff', color: '#3a5bc7' },
  'À envoyer':      { bg: '#fef6e4', color: '#C8A23A' },
  'Envoyé':         { bg: '#e6f4f1', color: '#006B68' },
  'Signé':          { bg: '#b8ddd9', color: '#004744' },
  'Expiré':         { bg: '#fde8e8', color: '#e53e3e' },
  'Archivé':        { bg: '#f0f0f0', color: '#888888' },
};

const SENSIBILITE_STYLE: Record<string, { bg: string; color: string }> = {
  'Normal':        { bg: '#f0f0f0', color: '#555' },
  'Sensible':      { bg: '#fef6e4', color: '#C8A23A' },
  'Très sensible': { bg: '#fde8e8', color: '#e53e3e' },
};

const FAMILLE_STYLE: Record<string, { bg: string; color: string }> = {
  'Apprenti':  { bg: '#e6f4f1', color: '#006B68' },
  'Entreprise':{ bg: '#fef6e4', color: '#C8A23A' },
  'Formateur': { bg: '#f0f4ff', color: '#3a5bc7' },
  'EasyCFA':   { bg: '#f0f0f0', color: '#555' },
};

const ORIGINE_STYLE: Record<string, { bg: string; color: string }> = {
  'Importé':             { bg: '#f0f0f0', color: '#555' },
  'Généré par EasyCFA':  { bg: '#e6f4f1', color: '#006B68' },
};

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: COLORS.text, backgroundColor: 'white', width: '100%' };

export default function Documents() {
  const [famille, setFamille] = useState('Tous');
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [filtreOrigine, setFiltreOrigine] = useState('Tous');

  const filtres = DOCUMENTS.filter((d) => {
    const matchFamille = famille === 'Tous' || d.famille === famille;
    const matchStatut = filtreStatut === 'Tous' || d.statut === filtreStatut;
    const matchOrigine = filtreOrigine === 'Tous' || d.origine === filtreOrigine;
    const matchRecherche = recherche === '' ||
      d.type.toLowerCase().includes(recherche.toLowerCase()) ||
      d.concerne.toLowerCase().includes(recherche.toLowerCase()) ||
      d.apprenant.toLowerCase().includes(recherche.toLowerCase()) ||
      d.entreprise.toLowerCase().includes(recherche.toLowerCase()) ||
      d.formateur.toLowerCase().includes(recherche.toLowerCase());
    return matchFamille && matchStatut && matchOrigine && matchRecherche;
  });

  const nbExpires = filtres.filter(d => d.statut === 'Expiré').length;
  const nbRestreint = filtres.filter(d => d.acceRestreint).length;
  const nbAImporter = filtres.filter(d => d.statut === 'À importer').length;
  const nbASigner = filtres.filter(d => d.statut === 'À faire signer').length;

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
            Registre documentaire
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
            Centralisez, contrôlez et suivez tous les documents EasyCFA par famille.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href="/documents/apercu" style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
            📄 Générer AEF
          </a>
          <a href="/documents/convention" style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
            📄 Générer Convention
          </a>
          <a href="/documents/generation" style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
            📄 CR / DMF / Livrets
          </a>
          <a href="/documents/modeles" style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
            Voir les modèles
          </a>
          <button style={btnSecondary}>Importer un document signé</button>
          <button style={btnSecondary}>Exporter le registre</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {DOCUMENTS_STATS.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Alertes */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {nbExpires > 0 && (
          <div style={{ flex: 1, padding: '12px 16px', backgroundColor: '#fde8e8', borderRadius: '8px', borderLeft: '4px solid #e53e3e', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span style={{ fontSize: '13px', color: '#c53030', fontWeight: '600' }}>{nbExpires} document(s) expiré(s)</span>
          </div>
        )}
        {nbAImporter > 0 && (
          <div style={{ flex: 1, padding: '12px 16px', backgroundColor: '#fef6e4', borderRadius: '8px', borderLeft: `4px solid ${COLORS.secondary}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📥</span>
            <span style={{ fontSize: '13px', color: '#7a5c00', fontWeight: '600' }}>{nbAImporter} document(s) à importer</span>
          </div>
        )}
        {nbASigner > 0 && (
          <div style={{ flex: 1, padding: '12px 16px', backgroundColor: '#f0f4ff', borderRadius: '8px', borderLeft: '4px solid #3a5bc7', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✍️</span>
            <span style={{ fontSize: '13px', color: '#3a5bc7', fontWeight: '600' }}>{nbASigner} document(s) à faire signer</span>
          </div>
        )}
        {nbRestreint > 0 && (
          <div style={{ flex: 1, padding: '12px 16px', backgroundColor: '#f0f0f0', borderRadius: '8px', borderLeft: '4px solid #888', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔒</span>
            <span style={{ fontSize: '13px', color: '#555', fontWeight: '600' }}>{nbRestreint} document(s) à accès restreint</span>
          </div>
        )}
      </div>

      {/* Filtres famille */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {FAMILLES.map((f) => (
          <button key={f} onClick={() => setFamille(f)} style={{
            backgroundColor: famille === f ? COLORS.primary : 'white',
            color: famille === f ? 'white' : COLORS.primary,
            border: `1.5px solid ${COLORS.primary}`,
            borderRadius: '20px', padding: '6px 18px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>
            {f === 'Tous' ? `Tous (${DOCUMENTS.length})` : `${f} (${DOCUMENTS.filter(d => d.famille === f).length})`}
          </button>
        ))}
      </div>

      {/* Filtres avancés */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <input style={inputStyle} placeholder="🔍 Rechercher type, personne, entreprise..."
            value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          <select style={inputStyle} value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
            <option value="Tous">Tous les statuts</option>
            {['Disponible', 'À importer', 'À contrôler', 'À faire signer', 'À envoyer', 'Envoyé', 'Signé', 'Expiré', 'Archivé'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select style={inputStyle} value={filtreOrigine} onChange={(e) => setFiltreOrigine(e.target.value)}>
            <option value="Tous">Toutes les origines</option>
            <option value="Importé">Importé</option>
            <option value="Généré par EasyCFA">Généré par EasyCFA</option>
          </select>
          <select style={inputStyle}>
            <option>Toutes les sessions</option>
            <option>SC-2025-06</option>
            <option>AD-2026-01</option>
          </select>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
            Documents ({filtres.length})
          </h2>
          <span style={{ fontSize: '13px', color: COLORS.textMuted }}>
            {filtres.filter(d => d.statut === 'Signé').length} signés · {filtres.filter(d => d.origine === 'Généré par EasyCFA').length} générés par EasyCFA
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                {['Famille', 'Type de document', 'Concerne', 'Apprenant', 'Entreprise', 'Formateur', 'Session', 'Période', 'Origine', 'Statut', 'Ajout', 'Signature', 'Validité', 'Ver.', 'Sensibilité', 'Actions'].map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 8px', fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtres.map((doc) => {
                const ss = STATUT_DOC[doc.statut] ?? { bg: '#f0f0f0', color: '#888' };
                const sf = FAMILLE_STYLE[doc.famille] ?? { bg: '#f0f0f0', color: '#888' };
                const sn = SENSIBILITE_STYLE[doc.sensibilite] ?? { bg: '#f0f0f0', color: '#888' };
                const so = ORIGINE_STYLE[doc.origine] ?? { bg: '#f0f0f0', color: '#888' };
                const estSigne = doc.statut === 'Signé';
                const estAImporter = doc.statut === 'À importer';
                return (
                  <tr key={doc.id} style={{ borderBottom: `1px solid ${COLORS.border}`, backgroundColor: doc.acceRestreint ? '#fffbf0' : 'white' }}>
                    <td style={{ padding: '8px' }}>
                      <span style={{ backgroundColor: sf.bg, color: sf.color, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {doc.famille}
                      </span>
                    </td>
                    <td style={{ padding: '8px', fontSize: '12px', fontWeight: '600', minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {doc.acceRestreint && <span title="Accès restreint" style={{ fontSize: '12px' }}>🔒</span>}
                        {doc.type}
                      </div>
                    </td>
                    <td style={{ padding: '8px', fontSize: '12px', color: COLORS.text, fontWeight: '500', whiteSpace: 'nowrap' }}>{doc.concerne}</td>
                    <td style={{ padding: '8px', fontSize: '11px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>{doc.apprenant !== '-' ? doc.apprenant : ''}</td>
                    <td style={{ padding: '8px', fontSize: '11px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>{doc.entreprise !== '-' ? doc.entreprise : ''}</td>
                    <td style={{ padding: '8px', fontSize: '11px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>{doc.formateur !== '-' ? doc.formateur : ''}</td>
                    <td style={{ padding: '8px', fontSize: '11px', color: COLORS.primary, fontWeight: '600', whiteSpace: 'nowrap' }}>{doc.session !== '-' ? doc.session : ''}</td>
                    <td style={{ padding: '8px', fontSize: '11px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>{doc.periode}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ backgroundColor: so.bg, color: so.color, padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {doc.origine === 'Généré par EasyCFA' ? '⚡ EasyCFA' : '📥 Importé'}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ backgroundColor: ss.bg, color: ss.color, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {doc.statut}
                      </span>
                    </td>
                    <td style={{ padding: '8px', fontSize: '11px', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>{doc.dateAjout}</td>
                    <td style={{ padding: '8px', fontSize: '11px', color: doc.dateSignature !== '-' ? '#004744' : COLORS.textMuted, fontWeight: doc.dateSignature !== '-' ? '600' : '400', whiteSpace: 'nowrap' }}>{doc.dateSignature}</td>
                    <td style={{ padding: '8px', fontSize: '11px', color: doc.statut === 'Expiré' ? '#e53e3e' : COLORS.textMuted, fontWeight: doc.statut === 'Expiré' ? '700' : '400', whiteSpace: 'nowrap' }}>{doc.dateValidite}</td>
                    <td style={{ padding: '8px', fontSize: '11px', color: COLORS.primary, fontWeight: '600' }}>{doc.version}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ backgroundColor: sn.bg, color: sn.color, padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {doc.sensibilite}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'nowrap' }}>
                        {estAImporter ? (
                          <label style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '5px', padding: '3px 7px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-block' }}>
                            📥 Importer
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                              const f = ev.target.files?.[0];
                              if (f) alert('✅ Document importé : ' + f.name);
                            }} />
                          </label>
                        ) : (
                          <button onClick={() => window.open('/documents/apercu?doc=' + doc.id, '_blank')} style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '5px', padding: '3px 7px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>
                            🔍 Ouvrir
                          </button>
                        )}
                        {estSigne ? (
                          <span style={{ backgroundColor: '#f0f0f0', color: '#888', padding: '3px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                            🔒 Verrouillé
                          </span>
                        ) : (
                          <>
                            {!estAImporter && (
                              <button style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, border: 'none', borderRadius: '5px', padding: '3px 7px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                + Version
                              </button>
                            )}
                            {doc.statut === 'À faire signer' && (
                              <button onClick={() => {
                                const dest = doc.apprenant !== '-' ? '' : doc.entreprise !== '-' ? '' : '';
                                const sujet = encodeURIComponent("Document à signer — " + doc.type + " — PAM OI Formation");
                                const corps = encodeURIComponent(
                                  "Madame, Monsieur,\n\n" +
                                  "Veuillez trouver ci-joint le document suivant à signer :\n\n" +
                                  "📄 " + doc.type + "\n" +
                                  "Concerne : " + doc.concerne + "\n" +
                                  "Formation : " + doc.formation + "\n\n" +
                                  "Merci de le signer et nous le retourner à : pedagogie@pamoi.re\n\n" +
                                  "Cordialement,\nPAM OI Formation\npedagogie@pamoi.re\n06 93 55 64 97"
                                );
                                window.open("https://mail.google.com/mail/?view=cm&to=" + dest + "&su=" + sujet + "&body=" + corps, '_blank');
                              }} style={{ backgroundColor: '#f0f4ff', color: '#3a5bc7', border: 'none', borderRadius: '5px', padding: '3px 7px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                ✍️ Envoyer pour signature
                              </button>
                            )}
                            {(doc.statut === 'Disponible' || doc.statut === 'À envoyer') && (
                              <button onClick={() => {
                                const sujet = encodeURIComponent("Document — " + doc.type + " — PAM OI Formation");
                                const corps = encodeURIComponent("Madame, Monsieur,\n\nVeuillez trouver ci-joint : " + doc.type + "\n\nCordialement,\nPAM OI Formation");
                                window.open("https://mail.google.com/mail/?view=cm&su=" + sujet + "&body=" + corps, '_blank');
                              }} style={{ backgroundColor: '#e6f4f1', color: '#004744', border: 'none', borderRadius: '5px', padding: '3px 7px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                ✉️ Envoyer
                              </button>
                            )}
                            {!estAImporter && (
                              <button style={{ backgroundColor: '#f0f0f0', color: '#888', border: 'none', borderRadius: '5px', padding: '3px 7px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>
                                Archiver
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Règles documentaires */}
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: COLORS.background, borderRadius: '8px', borderLeft: `4px solid ${COLORS.primary}` }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '8px' }}>
            Règles documentaires EasyCFA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {[
              '🔒 Un document signé ne peut jamais être écrasé.',
              '📋 Toute correction crée automatiquement une nouvelle version.',
              '🗂 Chaque document est enregistré dans ce registre.',
              '✅ Les documents peuvent servir de preuves Qualiopi.',
              '🔐 Les documents sensibles sont marqués accès restreint.',
              '🏷 Mention obligatoire sur tous les documents générés : "Document généré avec EasyCFA — solution éditée par PAM GROUPE".',
            ].map((r, i) => (
              <div key={i} style={{ fontSize: '12px', color: COLORS.textMuted, padding: '4px 0' }}>{r}</div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}