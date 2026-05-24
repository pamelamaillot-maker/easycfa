'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import PdfCheckBox from './PdfCheckBox';
import { MOTIFS_SORTIE_ANTICIPEE } from '../lib/donneesSortieAnticipee';

const S = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 50, paddingHorizontal: 45, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, paddingBottom: 6 },
  logo: { width: 60, height: 48, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 8.5, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  titleZone: { borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#ea580c', paddingVertical: 8, marginVertical: 8 },
  title: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#ea580c', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1 },
  intro: { fontSize: 9, color: '#666', fontStyle: 'italic', textAlign: 'center', marginBottom: 10 },

  bandeau: { backgroundColor: '#006B68', padding: '6 12', marginTop: 8, marginBottom: 0 },
  bandeauText: { color: 'white', fontSize: 11, fontFamily: 'Helvetica-Bold', textAlign: 'center', letterSpacing: 0.5 },
  // Table
  table: { borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 8 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tableRowLast: { flexDirection: 'row' },
  tableLabel: { width: '35%', backgroundColor: '#f4f4f4', padding: '7 10', fontSize: 9.5 },
  tableValue: { flex: 1, padding: '7 10', fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68' },

  // Sortie
  motifTitre: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006B68', marginTop: 8, marginBottom: 4 },
  checkRow: { marginBottom: 3, paddingLeft: 4 },
  // Commentaire
  commentBox: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4, padding: 8, marginTop: 6, minHeight: 40, backgroundColor: '#fafafa' },
  commentLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#666', marginBottom: 3 },
  // Décharge
  dechargeBox: { backgroundColor: '#fff8e1', borderWidth: 1.5, borderColor: '#C8A23A', borderRadius: 4, padding: 10, marginTop: 8 },
  dechargeTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#7a5c00', marginBottom: 4 },
  dechargeText: { fontSize: 9, lineHeight: 1.5, color: '#5a4000' },
  // Signature
  sigZone: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  sigBlock: { width: '45%' },
  sigTitre: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  sigSubtitle: { fontSize: 8, color: '#666', fontStyle: 'italic', marginBottom: 4 },
  sigBox: { borderWidth: 1.5, borderColor: '#006B68', borderRadius: 4, height: 60 },
  // Footer
  footer: { position: 'absolute', bottom: 22, left: 45, right: 45, borderTopWidth: 2, borderTopColor: '#ea580c', paddingTop: 4, fontSize: 7, color: '#888', textAlign: 'center', lineHeight: 1.4 },
  footerLine1: { fontStyle: 'italic', marginBottom: 2 },
});

type Props = { donnees: Record<string, string> };

export default function PdfSortieAnticipee({ donnees: d }: Props) {
  const motifCle = d.MOTIF_CLE || '';

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* En-tête */}
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.headerRight}>1 Chemin Dubuisson — 97436 Saint-Leu</Text>
            <Text style={S.headerRight}>pedagogie@pamoi.re — 06 93 55 64 97</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={S.titleZone}>
          <Text style={S.title}>Attestation de Sortie Anticipée</Text>
        </View>
        <Text style={S.intro}>Décharge de responsabilité du CFA pour absence partielle d'une journée de formation</Text>

        {/* === Identité === */}
        <View style={S.bandeau}><Text style={S.bandeauText}>IDENTITÉ DE L'APPRENANT(E)</Text></View>
        <View style={S.table}>
          <View style={S.tableRow}>
            <Text style={S.tableLabel}>Nom et Prénom</Text>
            <Text style={S.tableValue}>{d.APPRENANT_NOM_COMPLET || ''}</Text>
          </View>
          <View style={S.tableRow}>
            <Text style={S.tableLabel}>Formation suivie</Text>
            <Text style={S.tableValue}>{d.FORMATION_LIBELLE || ''}</Text>
          </View>
          <View style={S.tableRowLast}>
            <Text style={S.tableLabel}>Entreprise d'accueil</Text>
            <Text style={S.tableValue}>{d.ENTREPRISE_RAISON_SOCIALE || ''}</Text>
          </View>
        </View>

        {/* === Sortie === */}
        <View style={S.bandeau}><Text style={S.bandeauText}>DÉTAIL DE LA SORTIE ANTICIPÉE</Text></View>
        <View style={S.table}>
          <View style={S.tableRow}>
            <Text style={S.tableLabel}>Date de la sortie</Text>
            <Text style={S.tableValue}>{d.DATE_SORTIE || ''}</Text>
          </View>
          <View style={S.tableRowLast}>
            <Text style={S.tableLabel}>Heure de sortie</Text>
            <Text style={S.tableValue}>{d.HEURE_SORTIE || ''}</Text>
          </View>
        </View>

        {/* === Motif === */}
        <Text style={S.motifTitre}>Motif de la sortie anticipée :</Text>
        {MOTIFS_SORTIE_ANTICIPEE.map(m => (
          <View key={m.cle} style={S.checkRow}>
            <PdfCheckBox label={m.label} checked={motifCle === m.cle} />
          </View>
        ))}

        {/* === Commentaire libre === */}
        {d.COMMENTAIRE && (
          <View style={S.commentBox}>
            <Text style={S.commentLabel}>Précisions :</Text>
            <Text style={{ fontSize: 9.5 }}>{d.COMMENTAIRE}</Text>
          </View>
        )}

        {/* === Décharge === */}
        <View style={S.dechargeBox}>
          <Text style={S.dechargeTitle}>⚠ DÉCHARGE DE RESPONSABILITÉ</Text>
          <Text style={S.dechargeText}>
            Je soussigné(e), <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.APPRENANT_NOM_COMPLET}</Text>, demande à quitter le centre de formation PAM OI Formation le <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_SORTIE}</Text> à <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.HEURE_SORTIE}</Text> pour le motif mentionné ci-dessus.
            {'\n\n'}
            Je reconnais qu'à compter de l'heure indiquée, je quitte le CFA sous ma propre responsabilité (ou celle de mon représentant légal si mineur(e)). Le CFA PAM OI Formation est <Text style={{ fontFamily: 'Helvetica-Bold' }}>déchargé de toute responsabilité</Text> concernant tout incident, accident ou dommage pouvant survenir après cette heure.
            {'\n\n'}
            L'employeur est informé par copie de ce document.
          </Text>
        </View>

        {/* === Signatures === */}
        <View style={S.sigZone}>
          <View style={S.sigBlock}>
            <Text style={S.sigTitre}>Signature de l'apprenant(e)</Text>
            <Text style={S.sigSubtitle}>(ou représentant légal si mineur(e))</Text>
            <View style={S.sigBox} />
          </View>
          <View style={S.sigBlock}>
            <Text style={S.sigTitre}>Signature du CFA</Text>
            <Text style={S.sigSubtitle}>{d.CFA_DIRECTRICE}, Directrice</Text>
            <View style={S.sigBox} />
          </View>
        </View>

        <Text style={{ marginTop: 10, fontSize: 9, textAlign: 'right' }}>
          Fait à <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.LIEU_SIGNATURE || 'Saint-Leu'}</Text>, le <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.DATE_SIGNATURE || ''}</Text>
        </Text>

        {/* === Footer === */}
        <View style={S.footer} fixed>
          <Text style={S.footerLine1}>Document à conserver dans le dossier de l'apprenant(e) — Copie envoyée à l'employeur — Généré avec EasyCFA — PAM GROUPE</Text>
          <Text>PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – NDA : 04973425197 – SIRET : 881 279 392 00016</Text>
        </View>
      </Page>
    </Document>
  );
}