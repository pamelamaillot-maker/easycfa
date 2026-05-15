'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#EAF4F3',
  },
  logo: {
    width: 80,
    height: 60,
    objectFit: 'contain',
  },
  headerRight: {
    textAlign: 'right',
    fontSize: 9,
    color: '#555',
    lineHeight: 1.6,
  },
  headerRightTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#006B68',
    marginBottom: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#006B68',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#C8A23A',
  },
  body: {
    marginTop: 16,
    lineHeight: 1.8,
    fontSize: 11,
  },
  paragraph: {
    marginBottom: 12,
    lineHeight: 1.8,
  },
  signatureZone: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  signatureLine: {
    marginTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    fontSize: 8,
    color: '#888',
    textAlign: 'center',
  },
  mention: {
    marginTop: 8,
    fontSize: 8,
    color: '#aaa',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

type Props = {
  donnees: Record<string, string>;
};

export default function PdfAEF({ donnees }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* En-tête */}
        <View style={styles.header}>
          <Image style={styles.logo} src="/logo-pamoi.png" />
          <View style={styles.headerRight}>
            <Text style={styles.headerRightTitle}>PAM OI Formation</Text>
            <Text>1 Chemin Dubuisson – 97436 Saint-Leu</Text>
            <Text>SIRET : 881 279 392 00016</Text>
            <Text>Tél : 0693 55 64 92</Text>
            <Text>pamelamaillot@pamoi.re</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Attestation d'Entrée en Formation</Text>
        </View>

        {/* Corps */}
        <View style={styles.body}>
          <Text style={styles.paragraph}>
            Je soussignée Mme {donnees.CFA_DIRECTRICE}, directrice du centre de formation {donnees.CFA_RAISON_SOCIALE}, {donnees.CFA_SIRET} atteste que :
          </Text>
          <Text style={styles.paragraph}>
            {donnees.APPRENANT_CIVILITE} {donnees.APPRENANT_NOM_COMPLET} est bien inscrit(e) dans notre établissement depuis le {donnees.DATE_DEBUT_FORMATION} et prépare une formation en apprentissage de {donnees.FORMATION_LIBELLE}, dont le certificateur est le Ministère du Travail du Plein Emploi et de l'Insertion.
          </Text>
          <Text style={styles.paragraph}>
            Cette attestation a été délivrée à l'intéressé pour servir et faire valoir ce que de droit.
          </Text>
        </View>

        {/* Zone signature */}
        <View style={styles.signatureZone}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Fait à Saint-Leu, le</Text>
            <Text style={styles.signatureName}>{donnees.DATE_SIGNATURE_DOC}</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Signature de la directrice</Text>
            <Text style={styles.signatureName}>{donnees.CFA_DIRECTRICE}</Text>
            <Text style={{ fontSize: 10, color: '#888' }}>Directrice</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* Mention */}
        <Text style={styles.mention}>
          Document généré avec EasyCFA — solution éditée par PAM GROUPE
        </Text>

        {/* Pied de page */}
        <Text style={styles.footer}>
          PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A – RCS Saint-Pierre de La Réunion
        </Text>

      </Page>
    </Document>
  );
}