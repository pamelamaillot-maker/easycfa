'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a', backgroundColor: '#fff' },
  bandeau: { backgroundColor: '#006B68', padding: '30 50', marginBottom: 0 },
  bandeauTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: 'white', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
  bandeauSub: { fontSize: 12, color: '#C8A23A', fontFamily: 'Helvetica-Bold' },
  body: { padding: '30 50' },
  logo: { width: 90, height: 66, objectFit: 'contain', marginBottom: 20 },
  formation: { backgroundColor: '#EAF4F3', padding: 16, borderRadius: 4, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#C8A23A' },
  formationTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 4 },
  formationSub: { fontSize: 10, color: '#555' },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', marginBottom: 5 },
  lbl: { fontSize: 9, color: '#888', width: 130, textTransform: 'uppercase' },
  val: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', flex: 1, color: '#1a1a1a' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e0e0e0', marginVertical: 12 },
  sigZone: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  sigBlock: { width: '45%' },
  sigLbl: { fontSize: 8.5, color: '#555', marginBottom: 4 },
  sigLine: { marginTop: 40, borderBottomWidth: 1, borderBottomColor: '#999' },
  footer: { backgroundColor: '#006B68', padding: '10 50', position: 'absolute', bottom: 0, left: 0, right: 0 },
  footerText: { fontSize: 7, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.5 },
  mention: { fontSize: 7, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontStyle: 'italic', marginTop: 3 },
});

type Props = {
  donnees: Record<string, string>;
  formationLibelle: string;
};

export default function PdfLivret({ donnees: d, formationLibelle }: Props) {
  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Bandeau vert */}
        <View style={S.bandeau}>
          <Text style={S.bandeauTitle}>Livret d'apprentissage</Text>
          <Text style={S.bandeauSub}>Centre de Formation d'Apprentis PAM OI</Text>
        </View>

        <View style={S.body}>
          {/* Logo */}
          <Image style={S.logo} src="/logo-pamoi.png" />

          {/* Formation */}
          <View style={S.formation}>
            <Text style={S.formationTitle}>UNITÉ DE FORMATION D'APPRENTIS</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#006B68', marginTop: 2 }}>{formationLibelle || d.FORMATION_LIBELLE}</Text>
          </View>

          {/* Apprenti */}
          <Text style={S.sectionTitle}>Apprenti(e)</Text>
          <View style={S.row}><Text style={S.lbl}>Nom</Text><Text style={S.val}>{d.APPRENANT_NOM}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Prénom</Text><Text style={S.val}>{d.APPRENANT_PRENOM}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Date de naissance</Text><Text style={S.val}>{d.APPRENANT_DATE_NAISSANCE}</Text></View>

          <View style={S.divider} />

          {/* Entreprise */}
          <Text style={S.sectionTitle}>Entreprise</Text>
          <View style={S.row}><Text style={S.lbl}>Raison sociale</Text><Text style={S.val}>{d.ENTREPRISE_RAISON_SOCIALE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Maître d'apprentissage</Text><Text style={S.val}>{d.MAITRE_APPRENTISSAGE_NOM_COMPLET}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Téléphone</Text><Text style={S.val}>{d.MAITRE_APPRENTISSAGE_TELEPHONE}</Text></View>

          <View style={S.divider} />

          {/* Contrat */}
          <Text style={S.sectionTitle}>Contrat d'apprentissage</Text>
          <View style={S.row}><Text style={S.lbl}>Début</Text><Text style={S.val}>{d.DATE_DEBUT_CONTRAT}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Fin</Text><Text style={S.val}>{d.DATE_FIN_CONTRAT}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Volume horaire</Text><Text style={S.val}>{d.VOLUME_HORAIRE_TOTAL} heures</Text></View>

          <View style={S.divider} />

          {/* CFA */}
          <Text style={S.sectionTitle}>Centre de Formation PAM OI</Text>
          <View style={S.row}><Text style={S.lbl}>Adresse</Text><Text style={S.val}>1 Chemin Dubuisson – 97436 Saint-Leu</Text></View>
          <View style={S.row}><Text style={S.lbl}>Directrice</Text><Text style={S.val}>Madame Gaëlle MAILLOT – 0693 55 64 92</Text></View>
          <View style={S.row}><Text style={S.lbl}>Resp. pédagogique</Text><Text style={S.val}>Madame Betty REBOUL – 0693 55 64 97</Text></View>

          {/* Signatures */}
          <View style={S.sigZone}>
            <View style={S.sigBlock}>
              <Text style={S.sigLbl}>Signature de l'apprenti(e)</Text>
              <View style={S.sigLine} />
            </View>
            <View style={S.sigBlock}>
              <Text style={S.sigLbl}>Signature de la Direction du CFA</Text>
              <View style={S.sigLine} />
            </View>
          </View>
        </View>

        {/* Pied de page vert */}
        <View style={S.footer}>
          <Text style={S.footerText}>PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – APE : 8559A</Text>
          <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        </View>

      </Page>
    </Document>
  );
}