'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import PdfCheckBox from './PdfCheckBox';

const S = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 70, paddingHorizontal: 45, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 65, height: 50, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 8, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginVertical: 14 },
  intro: { fontSize: 10, marginBottom: 4, lineHeight: 1.5 },
  bold: { fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#006B68', backgroundColor: '#EAF4F3', padding: '4 8', marginTop: 12, marginBottom: 6 },
  row: { flexDirection: 'row', marginBottom: 4, fontSize: 9.5 },
  label: { fontFamily: 'Helvetica-Bold' },
  checkRow: { marginBottom: 4 },
  sigZone: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 10 },
  sigBlock: { width: '45%' },
  sigLbl: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 30 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: '#999', marginTop: 4 },
  footer: { position: 'absolute', bottom: 20, left: 45, right: 45, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 5, fontSize: 7, color: '#888', textAlign: 'center', lineHeight: 1.4 },
  mention: { marginTop: 12, fontSize: 7, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
});

type Props = { donnees: Record<string, string> };

export default function PdfDMF({ donnees: d }: Props) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* En-tête */}
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.headerRight}>38 B Rue des Canneliers – 97436 Saint-Leu</Text>
            <Text style={S.headerRight}>SIRET : 881 279 392 00016 – APE : 8559A</Text>
            <Text style={S.headerRight}>UAI : 9741871R</Text>
            <Text style={S.headerRight}>Tél : 0693 55 64 92 – pamelamaillot@pamoi.re</Text>
          </View>
        </View>

        {/* Titre */}
        <Text style={S.title}>Déclaration de maintien en formation</Text>

        {/* Récap apprenti / entreprise */}
        <Text style={S.intro}>
          Apprenti(e) : <Text style={S.bold}>{d.APPRENANT_NOM_COMPLET}</Text>
        </Text>
        <Text style={S.intro}>
          Entreprise : <Text style={S.bold}>{d.ENTREPRISE_RAISON_SOCIALE}</Text>
        </Text>

        {/* === CFA === */}
        <Text style={S.sectionTitle}>CFA</Text>
        <Text style={S.row}><Text style={S.label}>Raison sociale : </Text>{d.CFA_RAISON_SOCIALE}     <Text style={S.label}>UAI : </Text>9741871R</Text>
        <Text style={S.row}><Text style={S.label}>Directrice : </Text>{d.CFA_DIRECTRICE}</Text>
        <Text style={S.row}><Text style={S.label}>Adresse : </Text>{d.LIEU_FORMATION}</Text>
        <Text style={S.row}><Text style={S.label}>Téléphone : </Text>{d.CFA_TELEPHONE}     <Text style={S.label}>Mail : </Text>{d.CFA_EMAIL}</Text>

        {/* === APPRENTI === */}
        <Text style={S.sectionTitle}>Apprenti(e)</Text>
        <Text style={S.row}><Text style={S.label}>NOM : </Text>{d.APPRENANT_NOM}     <Text style={S.label}>Prénom : </Text>{d.APPRENANT_PRENOM}</Text>
        <Text style={S.row}><Text style={S.label}>Né(e) le : </Text>{d.APPRENANT_DATE_NAISSANCE}     <Text style={S.label}>À : </Text>{d.APPRENANT_LIEU_NAISSANCE}</Text>
        <Text style={S.row}><Text style={S.label}>Adresse : </Text>{d.APPRENANT_ADRESSE} {d.APPRENANT_CP} {d.APPRENANT_VILLE}</Text>
        <Text style={S.row}><Text style={S.label}>Téléphone : </Text>{d.APPRENANT_TELEPHONE}     <Text style={S.label}>Adresse électronique : </Text>{d.APPRENANT_EMAIL}</Text>

        {/* === REPRÉSENTANT LÉGAL (si mineur) === */}
        {(d.REPRESENTANT_LEGAL_NOM || d.REPRESENTANT_LEGAL_PRENOM) && (
          <>
            <Text style={S.sectionTitle}>Représentant légal</Text>
            <Text style={S.row}><Text style={S.label}>NOM : </Text>{d.REPRESENTANT_LEGAL_NOM}     <Text style={S.label}>Prénom : </Text>{d.REPRESENTANT_LEGAL_PRENOM}</Text>
            <Text style={S.row}><Text style={S.label}>Lien avec l'apprenti(e) : </Text>{d.REPRESENTANT_LEGAL_LIEN}</Text>
            <Text style={S.row}><Text style={S.label}>Adresse (si différente) : </Text>{d.REPRESENTANT_LEGAL_ADRESSE}</Text>
            <Text style={S.row}><Text style={S.label}>Téléphone : </Text>{d.REPRESENTANT_LEGAL_TELEPHONE}     <Text style={S.label}>Email : </Text>{d.REPRESENTANT_LEGAL_EMAIL}</Text>
          </>
        )}

        {/* === EMPLOYEUR === */}
        <Text style={S.sectionTitle}>Employeur</Text>
        <Text style={S.row}><Text style={S.label}>Raison sociale : </Text>{d.ENTREPRISE_RAISON_SOCIALE}</Text>
        <Text style={S.row}><Text style={S.label}>SIRET : </Text>{d.ENTREPRISE_SIRET}</Text>
        <Text style={S.row}><Text style={S.label}>Activité principale : </Text>{d.ENTREPRISE_ACTIVITE}</Text>
        <Text style={S.row}><Text style={S.label}>Adresse : </Text>{d.ENTREPRISE_ADRESSE} {d.ENTREPRISE_CP} {d.ENTREPRISE_VILLE}</Text>
        <Text style={S.row}><Text style={S.label}>Nom du maître d'apprentissage : </Text>{d.MAITRE_APPRENTISSAGE_NOM_COMPLET}</Text>
        <Text style={S.row}><Text style={S.label}>Téléphone : </Text>{d.MAITRE_APPRENTISSAGE_TELEPHONE}     <Text style={S.label}>Email : </Text>{d.MAITRE_APPRENTISSAGE_EMAIL}</Text>

        {/* === CONTRAT === */}
        <Text style={S.sectionTitle}>Contrat d'apprentissage</Text>
        <Text style={S.row}><Text style={S.label}>Début : </Text>{d.DATE_DEBUT_CONTRAT}     <Text style={S.label}>Fin prévisionnelle : </Text>{d.DATE_FIN_CONTRAT}</Text>
        <Text style={S.row}><Text style={S.label}>Durée : </Text>{d.DUREE_FORMATION} mois</Text>
        <Text style={S.row}><Text style={S.label}>N° d'enregistrement : </Text>{d.N_DECA}</Text>
        <Text style={S.row}><Text style={S.label}>Date de rupture du contrat : </Text>{d.DATE_RUPTURE_CONTRAT}</Text>
        <Text style={S.row}><Text style={S.label}>Formation suivie : </Text>{d.FORMATION_LIBELLE}</Text>

        {/* === DÉCLARATION DE MAINTIEN === */}
        {/* Cases volontairement vides : l'apprenti(e) indique son choix, coché à la main */}
        <Text style={S.sectionTitle}>Déclaration de maintien en formation</Text>
        <View style={S.checkRow}><PdfCheckBox label="Oui" checked={false} /></View>
        <View style={S.checkRow}><PdfCheckBox label="Non" checked={false} /></View>
        <Text style={[S.row, { marginTop: 6 }]}><Text style={S.label}>Date de déclaration ASP effective : </Text>{d.DATE_RUPTURE_CONTRAT}</Text>
        <Text style={S.row}><Text style={S.label}>Date limite de maintien en formation (≤ 6 mois) : </Text>{d.DATE_FIN_MAINTIEN}</Text>

        {/* === FIN DE MAINTIEN === */}
        <Text style={S.sectionTitle}>Fin de maintien en formation</Text>
        <Text style={S.row}><Text style={S.label}>Date effective de fin de maintien : </Text>{d.DATE_FIN_MAINTIEN_EFFECTIVE || '_______________'}</Text>
        <Text style={[S.row, { marginTop: 4 }]}><Text style={S.label}>Motif de fin de maintien en formation :</Text></Text>
        <View style={S.checkRow}><PdfCheckBox label="Délai de 6 mois atteint" checked={d.MOTIF_FIN_MAINTIEN === 'DELAI_6_MOIS'} /></View>
        <View style={S.checkRow}><PdfCheckBox label="Décision de l'apprenant" checked={d.MOTIF_FIN_MAINTIEN === 'DECISION_APPRENANT'} /></View>
        <View style={S.checkRow}><PdfCheckBox label="Signature d'un nouveau contrat d'apprentissage" checked={d.MOTIF_FIN_MAINTIEN === 'NOUVEAU_CONTRAT'} /></View>
        <View style={S.checkRow}><PdfCheckBox label={`Autre : ${d.MOTIF_FIN_AUTRE || '_______________'}`} checked={d.MOTIF_FIN_MAINTIEN === 'AUTRE'} /></View>

        {/* === SIGNATURES === */}
        <Text style={{ marginTop: 16, fontSize: 10 }}>Fait à <Text style={S.bold}>Saint-Leu</Text>, le <Text style={S.bold}>{d.DATE_SIGNATURE_DOC}</Text></Text>

        <View style={S.sigZone}>
          <View style={S.sigBlock}>
            <Text style={S.sigLbl}>Signature de l'apprenti(e)</Text>
            <View style={S.sigLine} />
          </View>
          <View style={S.sigBlock}>
            <Text style={S.sigLbl}>Signature du CFA</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{d.CFA_DIRECTRICE}</Text>
            <View style={S.sigLine} />
          </View>
        </View>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>
          PAM OI Formation – 38 B Rue des Canneliers 97436 Saint-Leu – SIRET : 881 279 392 00016 – APE : 8559A{'\n'}
          SASU au capital de 500€ – RCS 881 279 392 Saint-Pierre de la Réunion – Tél : 0693 55 64 92 – contact@pamoi.re – https://www.pamoi.re
        </Text>
      </Page>
    </Document>
  );
}