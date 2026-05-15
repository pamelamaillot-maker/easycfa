'use client';

import { useState } from 'react';
import { assemblerDonnees } from '../../../lib/documentData';
import { COLORS } from '../../../lib/constants';
import Card from '../../../components/Card';
import dynamic from 'next/dynamic';
import { LIVRETS } from '../../../data/mockLivrets';

const BoutonPdfCR = dynamic(() => import('../../../components/BoutonPdfCR'), { ssr: false });
const BoutonPdfDMF = dynamic(() => import('../../../components/BoutonPdfDMF'), { ssr: false });
const BoutonPdfLivret = dynamic(() => import('../../../components/BoutonPdfLivret'), { ssr: false });

const DOCUMENTS_LIST = [
  { id: 'cr', label: 'Certificat de Réalisation', famille: 'Apprenti' },
  { id: 'dmf', label: 'Déclaration de Maintien en Formation', famille: 'Apprenti' },
  { id: 'livret', label: 'Page de garde Livret apprentissage', famille: 'Apprenti' },
];

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', color: COLORS.text, backgroundColor: 'white' };

export default function Generation() {
  const [docId, setDocId] = useState('cr');
  const [apprenantId, setApprenantId] = useState('lea-payet');
  const [entrepriseId, setEntrepriseId] = useState('entreprise-a');
  const [dateSignature, setDateSignature] = useState(new Date().toLocaleDateString('fr-FR'));
  const [nDeca, setNDeca] = useState('');
  const [dateRupture, setDateRupture] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [crDebut, setCrDebut] = useState('01/05/2026');
  const [crFin, setCrFin] = useState('30/04/2027');
  const [crDuree, setCrDuree] = useState('12 mois');
  const [formationLivret, setFormationLivret] = useState('SC');
  const [afficher, setAfficher] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleLien, setGoogleLien] = useState<string | null>(null);
  const [googleErreur, setGoogleErreur] = useState<string | null>(null);

  const formationLabel = LIVRETS.find(f => f.id === formationLivret)?.label ?? '';
  const lienDocs = LIVRETS.find(f => f.id === formationLivret)?.lienDocs ?? '#';

  const donnees = assemblerDonnees(apprenantId, entrepriseId, {
    DATE_SIGNATURE_DOC: dateSignature,
    N_DECA: nDeca,
    DATE_RUPTURE_CONTRAT: dateRupture,
    DATE_FIN_MAINTIEN: dateFin,
    CR_DATE_DEBUT: crDebut,
    CR_DATE_FIN: crFin,
    CR_DUREE_HEURES: crDuree,
    CR_LIEU_SIGNATURE: 'Saint-Leu',
    CR_SIGNATAIRE_QUALITE: 'Directrice',
  });

  const docActuel = DOCUMENTS_LIST.find(d => d.id === docId);
  const nomFichier = `${docActuel?.label.replace(/\s/g, '_')}_${donnees.APPRENANT_NOM}_${dateSignature.replace(/\//g, '-')}.pdf`;

  async function remplirGoogleDoc(lienDoc: string) {
    setGoogleLoading(true);
    setGoogleErreur(null);
    setGoogleLien(null);

    const googleDocId = lienDoc.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (!googleDocId) {
      setGoogleErreur('Lien Google Doc invalide');
      setGoogleLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/docs/remplir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: googleDocId, donnees }),
      });

      const data = await response.json();

      if (data.authRequired) {
        window.location.href = '/api/auth/google';
        return;
      }

      if (data.success) {
        setGoogleLien(data.lienDoc);
      } else {
        setGoogleErreur(data.error ?? 'Erreur inconnue');
      }
    } catch {
      setGoogleErreur('Erreur de connexion');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <a href="/documents/modeles" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>← Retour aux modèles</a>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px', marginTop: '8px' }}>Génération de documents</h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Certificat de Réalisation · Déclaration de Maintien · Livrets apprentissage</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

        {/* Panneau gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Paramètres</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Type de document</label>
                <select style={inputStyle} value={docId} onChange={(e) => { setDocId(e.target.value); setAfficher(false); }}>
                  {DOCUMENTS_LIST.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>

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
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date de signature</label>
                <input style={inputStyle} value={dateSignature} onChange={(e) => { setDateSignature(e.target.value); setAfficher(false); }} />
              </div>

              {docId === 'cr' && (
                <>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Période — début</label>
                    <input style={inputStyle} value={crDebut} onChange={(e) => { setCrDebut(e.target.value); setAfficher(false); }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Période — fin</label>
                    <input style={inputStyle} value={crFin} onChange={(e) => { setCrFin(e.target.value); setAfficher(false); }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Durée réalisée</label>
                    <input style={inputStyle} value={crDuree} onChange={(e) => { setCrDuree(e.target.value); setAfficher(false); }} placeholder="Ex : 12 mois ou 490 heures" />
                  </div>
                </>
              )}

              {docId === 'dmf' && (
                <>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>N° DECA <span style={{ color: COLORS.secondary }}>(manuel)</span></label>
                    <input style={inputStyle} value={nDeca} onChange={(e) => { setNDeca(e.target.value); setAfficher(false); }} placeholder="Ex : 974-25-00123" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date de rupture du contrat</label>
                    <input style={inputStyle} value={dateRupture} onChange={(e) => { setDateRupture(e.target.value); setAfficher(false); }} placeholder="Ex : 15/05/2026" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date limite de maintien</label>
                    <input style={inputStyle} value={dateFin} onChange={(e) => { setDateFin(e.target.value); setAfficher(false); }} placeholder="Ex : 15/11/2026" />
                  </div>
                </>
              )}

              {docId === 'livret' && (
                <div>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Formation (livret)</label>
                  <select style={inputStyle} value={formationLivret} onChange={(e) => { setFormationLivret(e.target.value); setAfficher(false); }}>
                    {LIVRETS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
              )}

              <button style={{ ...btnPrimary, textAlign: 'center' }} onClick={() => setAfficher(true)}>
                👁 Générer l'aperçu
              </button>
            </div>
          </Card>
        </div>

        {/* Panneau droit */}
        <div>
          {!afficher ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: COLORS.primary }}>Aperçu du document</div>
                <div style={{ fontSize: '14px', marginBottom: '24px' }}>Choisissez un document et cliquez sur "Générer l'aperçu"</div>
                <button style={btnPrimary} onClick={() => setAfficher(true)}>👁 Générer l'aperçu</button>
              </div>
            </Card>
          ) : (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${COLORS.background}` }}>
                <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                  {docActuel?.label}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>V1</span>
                  <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>Simulation</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '32px', fontFamily: 'Georgia, serif', fontSize: '13px', lineHeight: '1.8', color: '#1a1a1a', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #EAF4F3' }}>
                  <img src="/logo-pamoi.png" alt="PAM OI" style={{ height: '60px', objectFit: 'contain' }} />
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#555' }}>
                    <div style={{ fontWeight: '700', color: '#006B68' }}>PAM OI Formation</div>
                    <div>1 Chemin Dubuisson – 97436 Saint-Leu</div>
                    <div>SIRET : 881 279 392 00016</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#006B68', textTransform: 'uppercase', borderBottom: '2px solid #C8A23A', paddingBottom: '6px', display: 'inline-block' }}>
                    {docActuel?.label}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Apprenant', value: donnees.APPRENANT_NOM_COMPLET },
                    { label: 'Entreprise', value: donnees.ENTREPRISE_RAISON_SOCIALE },
                    { label: 'Formation', value: docId === 'livret' ? formationLabel : donnees.FORMATION_LIBELLE },
                    { label: 'Date', value: dateSignature },
                  ].map((info) => (
                    <div key={info.label} style={{ backgroundColor: '#EAF4F3', borderRadius: '6px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px' }}>{info.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>{info.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '16px', fontSize: '11px', color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
                  Cliquez sur "Télécharger PDF" pour obtenir le document complet
                </div>
              </div>

              <div style={{ marginTop: '8px', padding: '8px 16px', backgroundColor: COLORS.background, borderRadius: '6px', fontSize: '11px', color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
                Document généré avec EasyCFA — solution éditée par PAM GROUPE
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {docId === 'cr' && <BoutonPdfCR donnees={donnees} nomFichier={nomFichier} />}
                {docId === 'dmf' && <BoutonPdfDMF donnees={donnees} nomFichier={nomFichier} />}
                {docId === 'livret' && (
                  <>
                    <BoutonPdfLivret donnees={donnees} nomFichier={nomFichier} formationLibelle={formationLabel} />
                    <button
                      onClick={() => remplirGoogleDoc(lienDocs)}
                      disabled={googleLoading}
                      style={{ backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {googleLoading ? '⏳ Remplissage en cours...' : '📝 Remplir et ouvrir dans Google Docs'}
                    </button>
                  </>
                )}
                <button style={btnSecondary}>📧 Envoyer par email</button>
                <button style={btnSecondary}>✍️ Préparer signature</button>
              </div>

              {googleLien && (
                <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#e6f4f1', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#006B68', fontWeight: '600' }}>✅ Document rempli avec succès !</span>
                  <a href={googleLien} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#006B68', color: 'white', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                    Ouvrir le document
                  </a>
                </div>
              )}

              {googleErreur && (
                <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#fde8e8', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#e53e3e', fontWeight: '600' }}>⚠️ {googleErreur}</span>
                </div>
              )}

            </Card>
          )}
        </div>
      </div>
    </div>
  );
}