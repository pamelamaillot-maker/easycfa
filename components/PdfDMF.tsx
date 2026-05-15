'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import PdfCheckBox from './PdfCheckBox';

const S = StyleSheet.create({
  page: { paddingTop: 35, paddingBottom: 50, paddingHorizontal: 45, fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 65, height: 48, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 7.5, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  titleBlock: { alignItems: 'center', marginVertical: 14 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', letterSpacing: 1 },
  sectionBg: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#006B68', marginTop: 10, marginBottom: 5, backgroundColor: '#EAF4F3', padding: '3 6', borderRadius: 2 },
  row: { flexDirection: 'row', marginBottom: 3 },
  lbl: { fontSize: 8.5, color: '#555', width: 130 },
  val: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', flex: 1 },
  p: { fontSize: 8.5, lineHeight: 1.6, marginBottom: 5 },
  box: { backgroundColor: '#EAF4F3', padding: 8, borderRadius: 2, marginBottom: 8 },
  sigZone: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sigBlock: { width: '45%' },
  sigLbl: { fontSize: 8, color: '#555', marginBottom: 2 },
  sigLine: { marginTop: 32, borderBottomWidth: 1, borderBottomColor: '#999' },
  footer: { position: 'absolute', bottom: 16, left: 45, right: 45, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 4, fontSize: 6.5, color: '#888', textAlign: 'center' },
  mention: { marginTop: 8, fontSize: 6.5, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
});

type Props = { donnees: Record<string, string> };

export default function PdfDMF({ donnees: d }: Props) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.headerRight}>1 Chemin Dubuisson – 97436 Saint-Leu</Text>
            <Text style={S.headerRight}>SIRET : 881 279 392 00016 – UAI : 9741871R</Text>
            <Text style={S.headerRight}>Tél : 0693 55 64 92 – pamelamaillot@pamoi.re</Text>
          </View>
        </View>

        <View style={S.titleBlock}>
          <Text style={S.title}>Déclaration de maintien en formation</Text>
        </View>

        <View style={S.box}>
          <View style={S.row}><Text style={S.lbl}>Apprenti(e) :</Text><Text style={S.val}>{d.APPRENANT_NOM_COMPLET}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Entreprise :</Text><Text style={S.val}>{d.ENTREPRISE_RAISON_SOCIALE}</Text></View>
        </View>

        {/* CFA */}
        <Text style={S.sectionBg}>CFA</Text>
        <View style={{ marginBottom: 8 }}>
          <View style={S.row}><Text style={S.lbl}>Raison sociale :</Text><Text style={S.val}>{d.CFA_RAISON_SOCIALE}</Text><Text style={[S.lbl, { width: 60 }]}>UAI :</Text><Text style={S.val}>9741871R</Text></View>
          <View style={S.row}><Text style={S.lbl}>Directrice :</Text><Text style={S.val}>{d.CFA_DIRECTRICE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Adresse :</Text><Text style={S.val}>{d.LIEU_FORMATION}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Téléphone :</Text><Text style={S.val}>{d.CFA_TELEPHONE}</Text><Text style={[S.lbl, { width: 40 }]}>Mail :</Text><Text style={S.val}>pamelamaillot@pamoi.re</Text></View>
        </View>

        {/* Apprenti */}
        <Text style={S.sectionBg}>Apprenti(e)</Text>
        <View style={{ marginBottom: 8 }}>
          <View style={S.row}><Text style={S.lbl}>NOM :</Text><Text style={S.val}>{d.APPRENANT_NOM}</Text><Text style={[S.lbl, { width: 60 }]}>Prénom :</Text><Text style={S.val}>{d.APPRENANT_PRENOM}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Né(e) le :</Text><Text style={S.val}>{d.APPRENANT_DATE_NAISSANCE}</Text><Text style={[S.lbl, { width: 30 }]}>À :</Text><Text style={S.val}>{d.APPRENANT_LIEU_NAISSANCE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Adresse :</Text><Text style={S.val}>{d.APPRENANT_ADRESSE} {d.APPRENANT_CP} {d.APPRENANT_VILLE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Téléphone :</Text><Text style={S.val}>{d.APPRENANT_TELEPHONE}</Text><Text style={[S.lbl, { width: 60 }]}>Email :</Text><Text style={S.val}>{d.APPRENANT_EMAIL}</Text></View>
        </View>

        {/* Représentant légal */}
        <Text style={S.sectionBg}>Représentant légal</Text>
        <View style={{ marginBottom: 8 }}>
          <View style={S.row}><Text style={S.lbl}>NOM :</Text><Text style={S.val}>{d.REPRESENTANT_LEGAL_NOM}</Text><Text style={[S.lbl, { width: 60 }]}>Prénom :</Text><Text style={S.val}>{d.REPRESENTANT_LEGAL_PRENOM}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Lien avec l'apprenti :</Text><Text style={S.val}>{d.REPRESENTANT_LEGAL_LIEN}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Adresse :</Text><Text style={S.val}>{d.REPRESENTANT_LEGAL_ADRESSE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Téléphone :</Text><Text style={S.val}>{d.REPRESENTANT_LEGAL_TELEPHONE}</Text><Text style={[S.lbl, { width: 60 }]}>Email :</Text><Text style={S.val}>{d.REPRESENTANT_LEGAL_EMAIL}</Text></View>
        </View>

        {/* Employeur */}
        <Text style={S.sectionBg}>Employeur</Text>
        <View style={{ marginBottom: 8 }}>
          <View style={S.row}><Text style={S.lbl}>Raison sociale :</Text><Text style={S.val}>{d.ENTREPRISE_RAISON_SOCIALE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>SIRET :</Text><Text style={S.val}>{d.ENTREPRISE_SIRET}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Activité principale :</Text><Text style={S.val}>{d.ENTREPRISE_ACTIVITE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Adresse :</Text><Text style={S.val}>{d.ENTREPRISE_ADRESSE} {d.ENTREPRISE_CP} {d.ENTREPRISE_VILLE}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Maître d'apprentissage :</Text><Text style={S.val}>{d.MAITRE_APPRENTISSAGE_NOM_COMPLET}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Téléphone :</Text><Text style={S.val}>{d.MAITRE_APPRENTISSAGE_TELEPHONE}</Text><Text style={[S.lbl, { width: 40 }]}>Email :</Text><Text style={S.val}>{d.MAITRE_APPRENTISSAGE_EMAIL}</Text></View>
        </View>

        {/* Contrat */}
        <Text style={S.sectionBg}>Contrat d'apprentissage</Text>
        <View style={{ marginBottom: 8 }}>
          <View style={S.row}><Text style={S.lbl}>Début :</Text><Text style={S.val}>{d.DATE_DEBUT_CONTRAT}</Text><Text style={[S.lbl, { width: 80 }]}>Fin prévisionnelle :</Text><Text style={S.val}>{d.DATE_FIN_CONTRAT}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Durée :</Text><Text style={S.val}>{d.DUREE_FORMATION} mois</Text></View>
          <View style={S.row}><Text style={S.lbl}>N° d'enregistrement :</Text><Text style={S.val}>{d.N_DECA || '…………………………'}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Date de rupture :</Text><Text style={S.val}>{d.DATE_RUPTURE_CONTRAT || '…………………………'}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Formation suivie :</Text><Text style={S.val}>{d.FORMATION_LIBELLE}</Text></View>
        </View>

        {/* Déclaration */}
        <Text style={S.sectionBg}>Déclaration de maintien en formation</Text>
        <View style={{ marginBottom: 6 }}>
          <PdfCheckBox label="Oui" />
          <PdfCheckBox label="Non" />
          <View style={S.row}>
            <Text style={S.lbl}>Date de déclaration ASP effective :</Text>
            <Text style={S.val}>{d.DATE_RUPTURE_CONTRAT || '…………………………'}</Text>
          </View>
          <View style={S.row}>
            <Text style={S.lbl}>Date limite de maintien ({'<'}6 mois) :</Text>
            <Text style={S.val}>{d.DATE_FIN_MAINTIEN || '…………………………'}</Text>
          </View>
        </View>

        {/* Fin de maintien */}
        <Text style={S.sectionBg}>Fin de maintien en formation</Text>
        <View style={{ marginBottom: 8 }}>
          <View style={S.row}><Text style={S.lbl}>Date effective de fin :</Text><Text style={S.val}>…………………………</Text></View>
          <Text style={{ fontSize: 8.5, marginBottom: 4 }}>Motif de fin de maintien en formation :</Text>
          <PdfCheckBox label="Délai de 6 mois atteint" />
          <PdfCheckBox label="Décision de l'apprenant" />
          <PdfCheckBox label="Signature d'un nouveau contrat d'apprentissage" />
          <PdfCheckBox label="Autre – précisez : ………………………………………………………" />
        </View>

        <Text style={[S.p, { marginTop: 8 }]}>Fait à Saint-Leu, le ………………………………</Text>

        <View style={S.sigZone}>
          <View style={S.sigBlock}>
            <Text style={S.sigLbl}>Signature du stagiaire</Text>
            <View style={S.sigLine} />
          </View>
          <View style={S.sigBlock}>
            <Text style={S.sigLbl}>Signature du CFA</Text>
            <View style={S.sigLine} />
          </View>
        </View>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>PAM OI Formation – 38 B Rue des Canneliers 97436 Saint-Leu – SIRET : 881 279 392 00016 – APE : 8559A – SASU au capital de 500€ – RCS 881 279 392 Saint-Pierre de La Réunion – Tél : 0693 55 64 92 – contact@pamoi.re</Text>
      </Page>
    </Document>
  );
}