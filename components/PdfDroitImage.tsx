'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import PdfCheckBox from './PdfCheckBox';

const S = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 50, paddingHorizontal: 45, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a', backgroundColor: '#fff' },
  // En-tête
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, paddingBottom: 6, borderBottomWidth: 0 },
  logo: { width: 65, height: 50, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 8.5, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  // Titre
  titleZone: { borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#C8A23A', paddingVertical: 6, marginTop: 0, marginBottom: 4 },
  title: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1 },
  annee: { fontSize: 9, color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: 2, marginBottom: 4 },
  // Section title (bandeau teal)
  bandeau: { backgroundColor: '#006B68', padding: '8 12', marginTop: 8, marginBottom: 0 },
  bandeauText: { color: 'white', fontSize: 11, fontFamily: 'Helvetica-Bold', textAlign: 'center', letterSpacing: 0.5 },
  // Table identité
  table: { borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 8 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tableRowLast: { flexDirection: 'row' },
  tableLabel: { width: '32%', backgroundColor: '#f4f4f4', padding: '8 10', fontSize: 9.5, fontFamily: 'Helvetica' },
  tableValue: { flex: 1, padding: '8 10', fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68' },
  // Bloc mineur
  blocMineur: { backgroundColor: '#fff8e1', borderWidth: 1.5, borderColor: '#C8A23A', borderRadius: 4, padding: 10, marginBottom: 10 },
  blocMineurTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#7a5c00', marginBottom: 5 },
  // Texte objet
  texteObjet: { fontSize: 10, lineHeight: 1.5, textAlign: 'center', marginVertical: 8, paddingHorizontal: 30 },
  // Supports
  supportsTitre: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006B68', marginTop: 8, marginBottom: 6 },
  checkRow: { marginBottom: 4, paddingLeft: 4 },
  // Conditions
  conditions: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4, padding: 10, marginTop: 8 },
  conditionsTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 5 },
  conditionItem: { fontSize: 9, marginBottom: 2, lineHeight: 1.4 },
  // RGPD
  rgpdBox: { backgroundColor: '#fde8e8', borderWidth: 1, borderColor: '#e53e3e', borderRadius: 4, padding: 8, marginTop: 6 },
  rgpdText: { fontSize: 8.5, color: '#7a1a1a', lineHeight: 1.4, fontFamily: 'Helvetica-Bold' },
  // Signatures — deux zones côte à côte
  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  signatureCol: { width: '48%' },
  signatureTitre: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 1 },
  signatureSubtitle: { fontSize: 7.5, color: '#666', fontStyle: 'italic', marginBottom: 3 },
  signatureBox: { borderWidth: 1.5, borderColor: '#006B68', borderRadius: 4, height: 44, marginTop: 2 },
  // Mention
  mention: { marginTop: 12, fontSize: 7.5, color: '#888', textAlign: 'center', fontStyle: 'italic' },
  // Footer
  footer: { position: 'absolute', bottom: 24, left: 45, right: 45, borderTopWidth: 2, borderTopColor: '#C8A23A', paddingTop: 4, fontSize: 7, color: '#888', textAlign: 'center', lineHeight: 1.4 },
});

type Props = { donnees: Record<string, string> };

export default function PdfDroitImage({ donnees: d }: Props) {
  const estMineur = d.EST_MINEUR === 'OUI';

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
          <Text style={S.title}>Autorisation de droit à l'image</Text>
        </View>
        <Text style={S.annee}>Année de formation {d.ANNEE_FORMATION || '—'}</Text>

        {/* === IDENTITÉ === */}
        <View style={S.bandeau}><Text style={S.bandeauText}>IDENTITÉ DU SIGNATAIRE</Text></View>
        <View style={S.table}>
          <View style={S.tableRow}>
            <Text style={S.tableLabel}>Nom et Prénom</Text>
            <Text style={S.tableValue}>{d.APPRENANT_NOM_COMPLET || ''}</Text>
          </View>
          <View style={S.tableRow}>
            <Text style={S.tableLabel}>Date de naissance</Text>
            <Text style={S.tableValue}>{d.APPRENANT_DATE_NAISSANCE || ''}</Text>
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

        {/* === REPRÉSENTANT LÉGAL (si mineur) === */}
        {estMineur && (
          <View style={S.blocMineur}>
            <Text style={S.blocMineurTitle}>Si mineur(e) — Représentant légal :</Text>
            <Text style={{ fontSize: 9 }}>
              Nom et Prénom : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.REPRESENTANT_NOM_COMPLET || '_______________________________'}</Text>
              {'     '}Lien : <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.REPRESENTANT_LIEN || '___________________'}</Text>
            </Text>
          </View>
        )}

        {/* === OBJET === */}
        <View style={S.bandeau}><Text style={S.bandeauText}>OBJET DE L'AUTORISATION</Text></View>
        <Text style={S.texteObjet}>
          Je soussigné(e), autorise <Text style={{ fontFamily: 'Helvetica-Bold' }}>PAM OI Formation</Text> à utiliser mon image (photographies, vidéos, enregistrements) réalisée(s) dans le cadre des activités pédagogiques, évènements et communications de l'organisme de formation.
        </Text>

        {/* === SUPPORTS === */}
        <Text style={S.supportsTitre}>Cette autorisation porte sur les supports suivants :</Text>
        <View style={S.checkRow}><PdfCheckBox label="Site internet et réseaux sociaux de PAM OI (Facebook, Instagram, LinkedIn...)" checked={true} /></View>
        <View style={S.checkRow}><PdfCheckBox label="Supports de communication (plaquettes, affiches, présentations...)" checked={true} /></View>
        <View style={S.checkRow}><PdfCheckBox label="Reportages et documentaires pédagogiques" checked={true} /></View>
        <View style={S.checkRow}><PdfCheckBox label="Communications internes et externes de PAM OI Formation" checked={true} /></View>

        {/* === CONDITIONS === */}
        <View style={S.conditions}>
          <Text style={S.conditionsTitle}>Durée et conditions :</Text>
          <Text style={S.conditionItem}>• Cette autorisation est valable pour toute la durée de la formation et 5 ans après son terme.</Text>
          <Text style={S.conditionItem}>• Elle est consentie à titre gratuit, sans contrepartie financière.</Text>
          <Text style={S.conditionItem}>• Elle peut être révoquée à tout moment par écrit à : pedagogie@pamoi.re</Text>
        </View>

        {/* === RGPD === */}
        <View style={S.rgpdBox}>
          <Text style={S.rgpdText}>
            ■ Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits : pedagogie@pamoi.re
          </Text>
        </View>

        {/* === SIGNATURE === */}
        <Text style={{ marginTop: 12, fontSize: 10 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>Fait à : </Text>{d.LIEU_SIGNATURE || 'Saint-Leu'}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>     Le : </Text>{d.DATE_SIGNATURE || ''}
        </Text>

        <View style={S.signaturesRow}>
          <View style={S.signatureCol}>
            <Text style={S.signatureTitre}>Signature de l'apprenant(e)</Text>
            <Text style={S.signatureSubtitle}>Précédée de "Lu et approuvé"</Text>
            <View style={S.signatureBox} />
          </View>
          <View style={S.signatureCol}>
            <Text style={S.signatureTitre}>Représentant légal / tuteur</Text>
            <Text style={S.signatureSubtitle}>{estMineur ? 'Obligatoire — apprenant(e) mineur(e)' : 'Si applicable (protection juridique)'}</Text>
            <View style={S.signatureBox} />
          </View>
        </View>

        <View style={S.footer} fixed>
          <Text>Document à conserver dans le dossier de l'apprenant(e) — Généré avec EasyCFA — PAM GROUPE</Text>
          <Text>PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – NDA : 04973425197 – SIRET : 881 279 392 00016</Text>
        </View>
      </Page>
    </Document>
  );
}