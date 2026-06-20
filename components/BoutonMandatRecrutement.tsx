'use client';

import React from 'react';
import { Document, Page, View, Text, Image as PdfImage, pdf } from '@react-pdf/renderer';

type DonneesMandat = {
  entrepriseNom?: string;
  entrepriseAdresse?: string;
  entrepriseSiret?: string;
};

const VERT = '#006B68';
const GRIS_BORD = '#cccccc';
const GRIS_LABEL = '#555555';

const s = {
  page: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 34, fontSize: 8.5, color: '#1a1a1a', fontFamily: 'Helvetica' as const },
  titre: { fontSize: 13, fontFamily: 'Helvetica-Bold' as const, textAlign: 'center' as const, marginBottom: 14 },
  sousTitre: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' as const, color: VERT, textAlign: 'center' as const, marginBottom: 8 },
  bandeau: { backgroundColor: VERT, color: 'white', fontFamily: 'Helvetica-Bold' as const, fontSize: 9.5, textAlign: 'center' as const, paddingVertical: 5, marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row' as const, borderTop: `1px solid ${GRIS_BORD}`, borderLeft: `1px solid ${GRIS_BORD}`, borderRight: `1px solid ${GRIS_BORD}` },
  rowLast: { borderBottom: `1px solid ${GRIS_BORD}` },
  cellLabel: { width: 120, padding: 5, color: GRIS_LABEL, borderRight: `1px solid ${GRIS_BORD}`, backgroundColor: '#fafafa' },
  cellValue: { flex: 1, padding: 5 },
  caseCarre: { width: 9, height: 9, border: `1px solid ${GRIS_LABEL}`, marginRight: 4 },
  ligneCases: { flexDirection: 'row' as const, alignItems: 'center' as const, flexWrap: 'wrap' as const, gap: 4 },
  pied: { position: 'absolute' as const, bottom: 18, left: 34, right: 34, textAlign: 'center' as const, fontSize: 7, color: '#999', borderTop: `1px solid ${GRIS_BORD}`, paddingTop: 5 },
};

function Entete() {
  return (
    <View style={{ marginBottom: 6 }}>
      <PdfImage src="/logo-pamoi.png" style={{ width: 70, marginBottom: 6 }} />
      <View style={{ borderBottom: `1.5px solid ${VERT}`, marginBottom: 12 }} />
    </View>
  );
}

function MandatDoc({ d }: { d: DonneesMandat }) {
  const champ = (v?: string) => (v && String(v).trim()) ? String(v) : '';
  return (
    <Document>
      {/* ===== PAGE 1 ===== */}
      <Page size="A4" style={s.page}>
        <Entete />
        <Text style={s.titre}>Mandat de recrutement et dépôt d'une offre d'emploi en alternance</Text>
        <Text style={s.sousTitre}>ORGANISME DE FORMATION / CFA : PAM OI — certifié QUALIOPI n°154312-3</Text>

        {/* Bloc CFA */}
        <View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Adresse :</Text>
            <Text style={s.cellValue}>1 Chemin Dubuisson 97436 St Leu</Text>
            <Text style={{ ...s.cellLabel, borderLeft: `1px solid ${GRIS_BORD}` }}>Siret :</Text>
            <Text style={s.cellValue}>881 279 392 00016</Text>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Mail :</Text>
            <Text style={s.cellValue}>pedagogie@pamoi.re</Text>
            <Text style={{ ...s.cellLabel, borderLeft: `1px solid ${GRIS_BORD}` }}>Tel :</Text>
            <Text style={s.cellValue}>0693 55 64 97</Text>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>N° UAI :</Text>
            <Text style={s.cellValue}>9741871R</Text>
            <Text style={{ ...s.cellLabel, borderLeft: `1px solid ${GRIS_BORD}` }}>N° NDA :</Text>
            <Text style={s.cellValue}>04973425197</Text>
          </View>
          <View style={{ ...s.row, ...s.rowLast }}>
            <Text style={s.cellLabel}>Représenté par :</Text>
            <Text style={s.cellValue}>MAILLOT Paméla</Text>
          </View>
        </View>

        <Text style={s.bandeau}>OFFRE D'EMPLOI</Text>

        {/* Bloc offre */}
        <View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Poste :</Text>
            <Text style={s.cellValue}> </Text>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Secteur d'activité :</Text>
            <Text style={s.cellValue}> </Text>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Expérience :</Text>
            <View style={{ ...s.cellValue, ...s.ligneCases }}>
              <View style={s.caseCarre} /><Text>Débutant accepté</Text>
              <View style={{ width: 16 }} />
              <View style={s.caseCarre} /><Text>Expérience exigée : _______ an(s)</Text>
            </View>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Missions confiées en lien avec la formation choisie :</Text>
            <Text style={{ ...s.cellValue, minHeight: 90 }}> </Text>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Lieu de travail :</Text>
            <Text style={s.cellValue}> </Text>
          </View>
          <View style={{ ...s.row, ...s.rowLast }}>
            <Text style={s.cellLabel}>Type de contrat :</Text>
            <View style={{ ...s.cellValue, ...s.ligneCases }}>
              <View style={s.caseCarre} /><Text>CDI</Text>
              <View style={{ width: 16 }} />
              <View style={s.caseCarre} /><Text>CDD</Text>
              <View style={{ width: 16 }} />
              <Text>Durée : _______</Text>
            </View>
          </View>
        </View>

        <Text style={s.pied}>Page 1 | 2</Text>
      </Page>

      {/* ===== PAGE 2 ===== */}
      <Page size="A4" style={s.page}>
        <Entete />

        {/* Bloc nature contrat */}
        <View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Nature du contrat :</Text>
            <View style={{ ...s.cellValue, ...s.ligneCases }}>
              <View style={s.caseCarre} /><Text>Apprentissage</Text>
              <View style={{ width: 16 }} />
              <View style={s.caseCarre} /><Text>Contrat de professionnalisation</Text>
              <View style={{ width: 16 }} />
              <View style={s.caseCarre} /><Text>Droit commun</Text>
            </View>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Date d'embauche prévue :</Text>
            <Text style={s.cellValue}> </Text>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Nb de poste(s) :</Text>
            <Text style={s.cellValue}> </Text>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Diplôme préparé :</Text>
            <Text style={s.cellValue}> </Text>
          </View>
          <View style={{ ...s.row, ...s.rowLast }}>
            <Text style={s.cellLabel}>Niveau du diplôme :</Text>
            <Text style={s.cellValue}> </Text>
          </View>
        </View>

        <Text style={s.bandeau}>RECRUTEUR FINAL</Text>

        {/* Bloc recruteur final — PRÉ-REMPLI */}
        <View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Raison sociale :</Text>
            <Text style={s.cellValue}>{champ(d.entrepriseNom)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>Adresse du siège :</Text>
            <Text style={s.cellValue}>{champ(d.entrepriseAdresse)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.cellLabel}>SIRET :</Text>
            <Text style={s.cellValue}>{champ(d.entrepriseSiret)}</Text>
          </View>
          <View style={{ ...s.row, ...s.rowLast }}>
            <Text style={s.cellLabel}>URSSAF :</Text>
            <Text style={s.cellValue}> </Text>
          </View>
        </View>

        {/* Mandatement */}
        <Text style={{ marginTop: 16, lineHeight: 1.5 }}>
          Je soussigné(e) ............................................................... mandate l'organisme de formation PAM OI à gérer l'offre d'emploi citée ci-dessus, au nom et pour le compte de l'entreprise.
        </Text>
        <Text style={{ marginTop: 10 }}>Mandat valable jusqu'au : ...............................</Text>

        {/* Encadré France Travail */}
        <View style={{ marginTop: 14, padding: 10, border: `1.5px solid ${VERT}`, backgroundColor: '#EAF4F3' }}>
          <Text style={{ color: VERT, fontFamily: 'Helvetica-Bold', textAlign: 'center', lineHeight: 1.5 }}>
            Dans la description de l'offre d'emploi, France Travail ne citera pas le nom de l'entreprise et précisera que la formation sera dispensée par l'organisme de formation cité ci-dessus.
          </Text>
        </View>

        {/* Signatures */}
        <View style={{ flexDirection: 'row', marginTop: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 8 }}>Recruteur final</Text>
            <Text style={{ marginBottom: 6 }}>Date : ............    Fait à : ............</Text>
            <Text style={{ marginTop: 10, marginBottom: 4 }}>Signature :</Text>
            <View style={{ height: 64, border: `1px solid ${VERT}` }} />
          </View>
          <View style={{ width: 24 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 8 }}>Organisme de formation</Text>
            <Text style={{ marginBottom: 6 }}>Date : ............    Fait à : ............</Text>
            <Text style={{ marginTop: 10, marginBottom: 4 }}>Signature :</Text>
            <View style={{ height: 64, border: `1px solid ${VERT}` }} />
          </View>
        </View>

        <Text style={s.pied}>Page 2 | 2</Text>
      </Page>
    </Document>
  );
}

export default function BoutonMandatRecrutement({ donnees, nomFichier, style }: { donnees: DonneesMandat; nomFichier: string; style?: React.CSSProperties }) {
  const [enCours, setEnCours] = React.useState(false);

  async function generer() {
    try {
      setEnCours(true);
      const blob = await pdf(<MandatDoc d={donnees} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomFichier;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[MandatRecrutement] Erreur génération PDF :', e);
      alert('⚠️ Erreur lors de la génération du mandat. Voir la console (F12).');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button onClick={generer} disabled={enCours} style={style ?? { backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: enCours ? 'wait' : 'pointer' }}>
      {enCours ? '⏳ Génération…' : '📄 Télécharger mandat'}
    </button>
  );
}