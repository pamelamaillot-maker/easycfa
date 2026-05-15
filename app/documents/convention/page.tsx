'use client';

import { useState } from 'react';
import { assemblerDonnees } from '../../../lib/documentData';
import { COLORS } from '../../../lib/constants';
import Card from '../../../components/Card';
import dynamic from 'next/dynamic';

const BoutonPdfCF = dynamic(() => import('../../../components/BoutonPdfCF'), { ssr: false });

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', color: COLORS.text, backgroundColor: 'white' };

export default function ApercuCF() {
  const [apprenantId, setApprenantId] = useState('lea-payet');
  const [entrepriseId, setEntrepriseId] = useState('entreprise-a');
  const [nDeca, setNDeca] = useState('');
  const [lieuSignature, setLieuSignature] = useState('Saint-Leu');
  const [dateSignature, setDateSignature] = useState(new Date().toLocaleDateString('fr-FR'));
  const [rncpCode, setRncpCode] = useState('RNCP37688');
  const [afficher, setAfficher] = useState(false);

  const donnees = assemblerDonnees(apprenantId, entrepriseId, {
    N_DECA: nDeca,
    DATE_SIGNATURE_DOC: dateSignature,
    LIEU_SIGNATURE_DOC: lieuSignature,
    RNCP_CODE: rncpCode,
  });

  return (
    <div>
      {/* En-tête page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <a href="/documents" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>← Retour au registre</a>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px', marginTop: '8px' }}>
            Convention de Formation
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Par apprentissage — Prévisualisation et génération PDF</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnPrimary} onClick={() => setAfficher(true)}>👁 Prévisualiser</button>
          {afficher && (
            <BoutonPdfCF
              donnees={donnees}
              nomFichier={`CF_${donnees.ENTREPRISE_RAISON_SOCIALE}_${donnees.APPRENANT_NOM}_${donnees.DATE_SIGNATURE_DOC.replace(/\//g, '-')}.pdf`}
            />
          )}
          <button style={btnSecondary}>✍️ Préparer signature</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

        {/* Panneau gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Paramètres</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Apprenant</label>
                <select style={inputStyle} value={apprenantId} onChange={(e) => { setApprenantId(e.target.value); setAfficher(false); }}>
                  <option value="lea-payet">Léa PAYET</option>
                  <option value="noah-riviere">Noah RIVIERE</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Entreprise</label>
                <select style={inputStyle} value={entrepriseId} onChange={(e) => { setEntrepriseId(e.target.value); setAfficher(false); }}>
                  <option value="entreprise-a">Entreprise A</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Code RNCP</label>
                <input style={inputStyle} value={rncpCode} onChange={(e) => { setRncpCode(e.target.value); setAfficher(false); }} placeholder="Ex : RNCP37688" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Lieu de signature</label>
                <input style={inputStyle} value={lieuSignature} onChange={(e) => { setLieuSignature(e.target.value); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date de signature</label>
                <input style={inputStyle} value={dateSignature} onChange={(e) => { setDateSignature(e.target.value); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>N° DECA <span style={{ color: COLORS.secondary }}>(manuel)</span></label>
                <input style={inputStyle} placeholder="Ex : 974-25-00123" value={nDeca} onChange={(e) => { setNDeca(e.target.value); setAfficher(false); }} />
              </div>
              <button style={{ ...btnPrimary, textAlign: 'center' }} onClick={() => setAfficher(true)}>
                👁 Générer l'aperçu
              </button>
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>Données utilisées</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
              {Object.entries(donnees).filter(([, v]) => v !== '').map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: COLORS.background, borderRadius: '6px', gap: '8px' }}>
                  <code style={{ fontSize: '10px', color: COLORS.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{`{{${k}}}`}</code>
                  <span style={{ fontSize: '11px', color: COLORS.text, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Panneau droit */}
        <div>
          {!afficher ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: COLORS.primary }}>Aperçu de la Convention</div>
                <div style={{ fontSize: '14px', marginBottom: '24px' }}>Choisissez un apprenant et cliquez sur "Générer l'aperçu"</div>
                <button style={btnPrimary} onClick={() => setAfficher(true)}>👁 Générer l'aperçu</button>
              </div>
            </Card>
          ) : (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${COLORS.background}` }}>
                <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Convention de Formation</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>4 pages</span>
                  <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>Simulation</span>
                </div>
              </div>

              {/* Aperçu visuel */}
              <div style={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '32px', fontFamily: 'Georgia, serif', fontSize: '13px', lineHeight: '1.8', color: '#1a1a1a' }}>
                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #EAF4F3' }}>
                  <img src="/logo-pamoi.png" alt="PAM OI" style={{ height: '70px', objectFit: 'contain' }} />
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#555', lineHeight: '1.8' }}>
                    <div style={{ fontWeight: '700', color: '#006B68', fontSize: '13px' }}>PAM OI Formation</div>
                    <div>1 Chemin Dubuisson – 97436 Saint-Leu</div>
                    <div>SIRET : 881 279 392 00016 – NDA : 04973425197</div>
                    <div>Qualiopi n° 51971543-3</div>
                  </div>
                </div>

                {/* Titre */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#006B68', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #C8A23A', paddingBottom: '6px', display: 'inline-block' }}>
                    Convention de Formation
                  </div>
                  <div style={{ fontSize: '13px', color: '#C8A23A', marginTop: '4px' }}>Par apprentissage</div>
                </div>

                {/* Résumé */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>Le CFA</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>PAM OI Formation</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Représentée par Mme MAILLOT Gaëlle</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Directrice & référente handicap</div>
                  </div>
                  <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>L'Entreprise</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>{donnees.ENTREPRISE_RAISON_SOCIALE}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Représentée par {donnees.DIRIGEANT_NOM_COMPLET}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>OPCO : {donnees.OPCO}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>Formation</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>{donnees.FORMATION_LIBELLE}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Apprenant : {donnees.APPRENANT_NOM_COMPLET}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Du {donnees.DATE_DEBUT_FORMATION} au {donnees.DATE_FIN_FORMATION} – {donnees.VOLUME_HORAIRE_TOTAL} heures</div>
                </div>

                <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '16px' }}>
                  Document complet sur 4 pages — cliquez sur "Télécharger PDF" pour obtenir la version complète
                </div>

                {/* Pied de page */}
                <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #e0e0e0', fontSize: '10px', color: '#888', textAlign: 'center' }}>
                  PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A
                </div>
              </div>

              <div style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: COLORS.background, borderRadius: '6px', fontSize: '11px', color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
                Document généré avec EasyCFA — solution éditée par PAM GROUPE
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <BoutonPdfCF
                  donnees={donnees}
                  nomFichier={`CF_${donnees.ENTREPRISE_RAISON_SOCIALE}_${donnees.APPRENANT_NOM}_${donnees.DATE_SIGNATURE_DOC.replace(/\//g, '-')}.pdf`}
                />
                <button style={btnSecondary}>📧 Envoyer par email</button>
                <button style={btnPrimary}>✍️ Préparer signature</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}