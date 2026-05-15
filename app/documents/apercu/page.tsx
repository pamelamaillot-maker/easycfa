'use client';

import { useState } from 'react';
import { assemblerDonnees } from '../../../lib/documentData';
import { remplirModele, champsManquants } from '../../../lib/templateEngine';
import { COLORS } from '../../../lib/constants';
import Card from '../../../components/Card';
import dynamic from 'next/dynamic';

const BoutonPdfAEF = dynamic(() => import('../../../components/BoutonPdfAEF'), { ssr: false });

const MODELE_AEF = `Je soussignée Mme {{CFA_DIRECTRICE}}, directrice du centre de formation {{CFA_RAISON_SOCIALE}}, {{CFA_SIRET}} atteste que :

{{APPRENANT_CIVILITE}} {{APPRENANT_NOM_COMPLET}} est bien inscrit(e) dans notre établissement depuis le {{DATE_DEBUT_FORMATION}} et prépare une formation en apprentissage de {{FORMATION_LIBELLE}}, dont le certificateur est le Ministère du Travail du Plein Emploi et de l'Insertion.

Cette attestation a été délivrée à l'intéressé pour servir et faire valoir ce que de droit.


Fait à Saint-Leu, le {{DATE_SIGNATURE_DOC}}
{{CFA_DIRECTRICE}}
Directrice`;

const btnPrimary: React.CSSProperties = {
  backgroundColor: COLORS.primary, color: 'white', border: 'none',
  borderRadius: '8px', padding: '9px 16px', fontSize: '13px',
  fontWeight: '600', cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  backgroundColor: 'white', color: COLORS.primary,
  border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px',
  padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
};
const inputStyle: React.CSSProperties = {
  border: '1.5px solid #e0e0e0', borderRadius: '8px',
  padding: '8px 12px', fontSize: '13px', width: '100%',
  color: COLORS.text, backgroundColor: 'white',
};

export default function ApercuAEF() {
  const [apprenantId, setApprenantId] = useState('lea-payet');
  const [entrepriseId, setEntrepriseId] = useState('entreprise-a');
  const [nDeca, setNDeca] = useState('');
  const [dateSignature, setDateSignature] = useState(
    new Date().toLocaleDateString('fr-FR')
  );
  const [afficher, setAfficher] = useState(false);

  const donnees = assemblerDonnees(apprenantId, entrepriseId, {
    N_DECA: nDeca,
    DATE_SIGNATURE_DOC: dateSignature,
  });

  const documentRempli = remplirModele(MODELE_AEF, donnees);
  const manquants = champsManquants(MODELE_AEF, donnees);

  return (
    <div>
      {/* En-tête page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <a href="/documents" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
            ← Retour au registre
          </a>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px', marginTop: '8px' }}>
            Attestation d'Entrée en Formation
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
            Prévisualisation et génération avec données EasyCFA
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnPrimary} onClick={() => setAfficher(true)}>👁 Prévisualiser</button>
          <button style={btnSecondary}>⬇ Télécharger PDF</button>
          <button style={btnSecondary}>✍️ Préparer signature</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

        {/* Panneau gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
              Paramètres de génération
            </h2>
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
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date de signature</label>
                <input style={inputStyle} value={dateSignature} onChange={(e) => { setDateSignature(e.target.value); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  N° DECA <span style={{ color: COLORS.secondary }}>(manuel)</span>
                </label>
                <input style={inputStyle} placeholder="Ex : 974-25-00123" value={nDeca} onChange={(e) => { setNDeca(e.target.value); setAfficher(false); }} />
              </div>
              <button style={{ ...btnPrimary, textAlign: 'center' }} onClick={() => setAfficher(true)}>
                👁 Générer l'aperçu
              </button>
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: manquants.length > 0 ? '#C8A23A' : COLORS.primary, marginBottom: '12px' }}>
              {manquants.length > 0 ? `⚠ ${manquants.length} champ(s) vide(s)` : '✅ Tous les champs sont remplis'}
            </h2>
            {manquants.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {manquants.map((m) => (
                  <div key={m} style={{ backgroundColor: '#fef6e4', color: '#7a5c00', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {`{{${m}}}`}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: COLORS.textMuted }}>Le document est prêt à être généré.</div>
            )}
          </Card>

          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
              Données utilisées
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
              {Object.entries(donnees).filter(([, v]) => v !== '').map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: COLORS.background, borderRadius: '6px', gap: '8px' }}>
                  <code style={{ fontSize: '10px', color: COLORS.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{`{{${k}}}`}</code>
                  <span style={{ fontSize: '11px', color: COLORS.text, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Panneau droit — Prévisualisation */}
        <div>
          {!afficher ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: COLORS.primary }}>
                  Aperçu du document
                </div>
                <div style={{ fontSize: '14px', marginBottom: '24px' }}>
                  Choisissez un apprenant et cliquez sur "Générer l'aperçu"
                </div>
                <button style={btnPrimary} onClick={() => setAfficher(true)}>👁 Générer l'aperçu</button>
              </div>
            </Card>
          ) : (
            <Card>
              {/* Badge statut */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${COLORS.background}` }}>
                <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                  Attestation d'Entrée en Formation
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>V1</span>
                  <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>Simulation</span>
                </div>
              </div>

              {/* Document */}
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '40px',
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                lineHeight: '1.8',
                color: '#1a1a1a',
                minHeight: '500px',
              }}>
                {/* En-tête avec logo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #EAF4F3' }}>
                  <img src="/logo-pamoi.png" alt="PAM OI Formation" style={{ height: '80px', objectFit: 'contain' }} />
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#555', lineHeight: '1.8' }}>
                    <div style={{ fontWeight: '700', color: '#006B68', fontSize: '14px' }}>PAM OI Formation</div>
                    <div>1 Chemin Dubuisson – 97436 Saint-Leu</div>
                    <div>SIRET : 881 279 392 00016</div>
                    <div>Tél : 0693 55 64 92</div>
                    <div>pamelamaillot@pamoi.re</div>
                  </div>
                </div>

                {/* Titre centré */}
                <div style={{ textAlign: 'center', margin: '24px 0 32px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#006B68', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '2px solid #C8A23A', paddingBottom: '8px', display: 'inline-block' }}>
                    Attestation d'Entrée en Formation
                  </div>
                </div>

                {/* Corps du document — propre */}
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '2' }}>
                  {documentRempli}
                </div>

                {/* Pied de page */}
                <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #e0e0e0', fontSize: '11px', color: '#888', textAlign: 'center' }}>
                  PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A
                </div>
              </div>

              {/* Mention EasyCFA */}
              <div style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: COLORS.background, borderRadius: '6px', fontSize: '11px', color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
                Document généré avec EasyCFA — solution éditée par PAM GROUPE
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <BoutonPdfAEF
                  donnees={donnees}
                  nomFichier={`AEF_${donnees.APPRENANT_NOM}_${donnees.APPRENANT_PRENOM}_${donnees.DATE_SIGNATURE_DOC.replace(/\//g, '-')}.pdf`}
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