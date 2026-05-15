'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import PdfCheckBox from './PdfCheckBox';

const S = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 55, paddingHorizontal: 50, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 70, height: 52, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 8, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  titleBlock: { alignItems: 'center', marginVertical: 20 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', letterSpacing: 1 },
  p: { fontSize: 9.5, lineHeight: 1.7, marginBottom: 8, color: '#1a1a1a' },
  bold: { fontFamily: 'Helvetica-Bold' },
  box: { backgroundColor: '#EAF4F3', padding: 10, borderRadius: 3, marginBottom: 10 },
  checkRow: { marginBottom: 4 },
  sigZone: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  sigBlock: { width: '55%' },
  sigLbl: { fontSize: 8.5, color: '#555', marginBottom: 2 },
  sigName: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  sigLine: { marginTop: 40, borderBottomWidth: 1, borderBottomColor: '#999' },
  footer: { position: 'absolute', bottom: 18, left: 50, right: 50, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 5, fontSize: 7, color: '#888', textAlign: 'center' },
  mention: { marginTop: 10, fontSize: 7, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
  fn: { fontSize: 7, color: '#888', fontStyle: 'italic', marginTop: 3, lineHeight: 1.4 },
});

type Props = { donnees: Record<string, string> };

export default function PdfCR({ donnees: d }: Props) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View style={{ alignItems: 'center' }}>
            <Image style={{ width: 60, height: 52, objectFit: 'contain' }} src="/logo-ministere-travail.png" />
            <Text style={{ fontSize: 7, color: '#555', textAlign: 'center', marginTop: 2 }}>Ministère du Travail</Text>
          </View>
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.headerRight}>1 Chemin Dubuisson – 97436 Saint-Leu</Text>
            <Text style={S.headerRight}>SIRET : 881 279 392 00016 – NAF : 8559A</Text>
            <Text style={S.headerRight}>Tél : 0693 55 64 92 – pamelamaillot@pamoi.re</Text>
          </View>
        </View>

        <View style={S.titleBlock}>
          <Text style={S.title}>Certificat de Réalisation</Text>
        </View>

        <Text style={S.p}>
          Je soussigné(e) <Text style={S.bold}>{d.CFA_DIRECTRICE}</Text>, représentant légal du dispensateur de l'action concourant au développement des compétences <Text style={S.bold}>{d.CFA_RAISON_SOCIALE}</Text>.
        </Text>

        <Text style={S.p}>
          Atteste que : <Text style={S.bold}>{d.APPRENANT_CIVILITE} {d.APPRENANT_NOM_COMPLET}</Text>, salarié(e) de l'entreprise <Text style={S.bold}>{d.ENTREPRISE_RAISON_SOCIALE}</Text>
        </Text>

        <Text style={S.p}>
          a suivi l'action : <Text style={S.bold}>{d.FORMATION_LIBELLE}</Text>
        </Text>

        <View style={S.box}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>Nature de l'action concourant au développement des compétences :</Text>
          <PdfCheckBox label="action de formation" />
          <PdfCheckBox label="bilan de compétences" />
          <PdfCheckBox label="action de VAE" />
          <PdfCheckBox label="action de formation par apprentissage" checked={true} />
        </View>

        <Text style={S.p}>
          qui s'est déroulée du <Text style={S.bold}>{d.CR_DATE_DEBUT}</Text> au <Text style={S.bold}>{d.CR_DATE_FIN}</Text>
        </Text>

        <Text style={S.p}>
          pour une durée de <Text style={S.bold}>{d.CR_DUREE_HEURES}</Text>.{'\n'}
          <Text style={{ fontSize: 8, color: '#666', fontStyle: 'italic' }}>(nombre d'heures réalisées ou, s'agissant d'une formation par apprentissage, nombre de mois réalisés)²</Text>
        </Text>

        <Text style={[S.p, { marginTop: 10 }]}>
          Sans préjudice des délais imposés par les règles fiscales, comptables ou commerciales, je m'engage à conserver l'ensemble des pièces justificatives qui ont permis d'établir le présent certificat pendant une durée de 3 ans à compter de la fin de l'année du dernier paiement. En cas de cofinancement des fonds européens la durée de conservation est étendue conformément aux obligations conventionnelles spécifiques.
        </Text>

        <Text style={[S.p, { marginTop: 10 }]}>
          Fait à : <Text style={S.bold}>{d.CR_LIEU_SIGNATURE}</Text>{'          '}Le : <Text style={S.bold}>{d.DATE_SIGNATURE_DOC}</Text>
        </Text>

        <View style={S.sigZone}>
          <View style={S.sigBlock}>
            <Text style={S.sigLbl}>Signature du responsable du dispensateur de formation</Text>
            <Text style={S.sigName}>{d.CFA_DIRECTRICE}, {d.CR_SIGNATAIRE_QUALITE}</Text>
            <View style={S.sigLine} />
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={S.fn}>¹ Lorsque l'action est mise en œuvre dans le cadre d'un projet de transition professionnelle, le certificat de réalisation doit être transmis mensuellement.</Text>
          <Text style={S.fn}>² Dans le cadre des formations à distance prendre en compte la réalisation des activités pédagogiques et le temps estimé pour les réaliser.</Text>
        </View>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A – RCS Saint-Pierre de La Réunion – SASU au capital de 500€</Text>
      </Page>
    </Document>
  );
}