'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page: { paddingTop: 35, paddingBottom: 50, paddingHorizontal: 45, fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 60, height: 44, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 7.5, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  titleBlock: { alignItems: 'center', marginVertical: 14 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontSize: 9, color: '#C8A23A', marginTop: 3 },
  alertBox: { backgroundColor: '#fef6e4', padding: '8 12', borderRadius: 3, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#C8A23A' },
  alertText: { fontSize: 8.5, color: '#7a5c00', fontFamily: 'Helvetica-Bold' },
  sectionBg: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginTop: 10, marginBottom: 6, backgroundColor: '#EAF4F3', padding: '3 8', borderRadius: 2 },
  box: { backgroundColor: '#f9f9f9', padding: 8, borderRadius: 3, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 3 },
  lbl: { fontSize: 8.5, color: '#555', width: 140 },
  val: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#006B68', padding: '4 6' },
  tableHeaderCell: { fontSize: 8, color: 'white', fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', padding: '5 6' },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#f5f5f5', padding: '5 6' },
  bullet: { fontSize: 8.5, marginBottom: 4, marginLeft: 8 },
  sigBlock: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sigZone: { width: '45%' },
  sigLbl: { fontSize: 8, color: '#555', marginBottom: 2 },
  sigLine: { marginTop: 35, borderBottomWidth: 1, borderBottomColor: '#999' },
  footer: { position: 'absolute', bottom: 16, left: 45, right: 45, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 4, fontSize: 6.5, color: '#888', textAlign: 'center' },
  mention: { marginTop: 8, fontSize: 6.5, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
});

type Epreuve = { libelle: string; duree: string };
type Jure = { nom: string; prenom: string; qualite: string };

type Props = {
  candidat: { nom: string; prenom: string; dateNaissance: string; email: string };
  formation: string;
  formationId: string;
  typeCandidature: string;
  ccpsPassés: string[];
  dateExamen: string;
  heureConvocation: string;
  lieu: string;
  numeroSession: string;
  jury: Jure[];
  epreuves: Epreuve[];
  documentsAApporter: string[];
};

export default function PdfConvocation({ candidat, formation, formationId, typeCandidature, ccpsPassés, dateExamen, heureConvocation, lieu, numeroSession, jury, epreuves, documentsAApporter }: Props) {
  const dateGeneration = new Date().toLocaleDateString('fr-FR');
  const epreuvesActives = epreuves.filter(e => e.duree !== 'Sans objet');

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* En-tête */}
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.headerRight}>1 Chemin Dubuisson – 97436 Saint-Leu</Text>
            <Text style={S.headerRight}>SIRET : 881 279 392 00016 – UAI : 9741871R</Text>
            <Text style={S.headerRight}>pedagogie@pamoi.re – 0693 55 64 97</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={S.titleBlock}>
          <Text style={S.title}>Convocation à l'examen</Text>
          <Text style={S.subtitle}>Titre Professionnel — {formation}</Text>
        </View>

        {/* Alerte si numéro CERES manquant */}
        {(!numeroSession || numeroSession === 'En attente CERES') && (
          <View style={S.alertBox}>
            <Text style={S.alertText}>⚠️ Numéro de session CERES en attente — À compléter avant envoi au candidat</Text>
          </View>
        )}

        {/* Candidat */}
        <Text style={S.sectionBg}>Candidat(e)</Text>
        <View style={S.box}>
          <View style={S.row}><Text style={S.lbl}>Nom et prénom :</Text><Text style={S.val}>{candidat.prenom} {candidat.nom}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Date de naissance :</Text><Text style={S.val}>{candidat.dateNaissance}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Email :</Text><Text style={S.val}>{candidat.email}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Formation :</Text><Text style={S.val}>{formation} ({formationId})</Text></View>
          <View style={S.row}><Text style={S.lbl}>Type de candidature :</Text><Text style={S.val}>{typeCandidature}</Text></View>
          {ccpsPassés.length > 0 && ccpsPassés.length < 3 && (
            <View style={S.row}><Text style={S.lbl}>CCP(s) à passer :</Text><Text style={S.val}>{ccpsPassés.join(', ')}</Text></View>
          )}
        </View>

        {/* Session */}
        <Text style={S.sectionBg}>Session d'examen</Text>
        <View style={S.box}>
          <View style={S.row}><Text style={S.lbl}>Numéro de session CERES :</Text><Text style={[S.val, { color: (!numeroSession || numeroSession === 'En attente CERES') ? '#e53e3e' : '#006B68' }]}>{numeroSession || 'En attente CERES'}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Date de l'examen :</Text><Text style={S.val}>{dateExamen}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Heure de convocation :</Text><Text style={S.val}>{heureConvocation}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Lieu :</Text><Text style={S.val}>{lieu}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Certificateur :</Text><Text style={S.val}>Ministère du Travail du Plein Emploi et de l'Insertion — DEETS La Réunion</Text></View>
        </View>

        {/* Jury */}
        <Text style={S.sectionBg}>Composition du jury</Text>
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { width: 120 }]}>Nom</Text>
          <Text style={[S.tableHeaderCell, { width: 100 }]}>Prénom</Text>
          <Text style={[S.tableHeaderCell, { flex: 1 }]}>Qualité</Text>
        </View>
        {jury.map((j, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', width: 120 }}>{j.nom}</Text>
            <Text style={{ fontSize: 8.5, width: 100 }}>{j.prenom}</Text>
            <Text style={{ fontSize: 8.5, flex: 1 }}>{j.qualite}</Text>
          </View>
        ))}

        {/* Épreuves */}
        <Text style={S.sectionBg}>Épreuves — {formation}</Text>
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { flex: 1 }]}>Épreuve</Text>
          <Text style={[S.tableHeaderCell, { width: 70, textAlign: 'center' }]}>Durée</Text>
        </View>
        {epreuvesActives.map((e, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ fontSize: 8.5, flex: 1 }}>• {e.libelle}</Text>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', width: 70, textAlign: 'center', color: '#006B68' }}>{e.duree}</Text>
          </View>
        ))}

        {/* Documents à apporter */}
        <Text style={S.sectionBg}>Documents obligatoires à apporter le jour de l'examen</Text>
        {documentsAApporter.map((doc, i) => (
          <Text key={i} style={S.bullet}>• {doc}</Text>
        ))}

        {/* Note importante */}
        <View style={{ marginTop: 10, padding: '8 10', backgroundColor: '#fde8e8', borderRadius: 3 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#c53030', marginBottom: 3 }}>⚠️ Important</Text>
          <Text style={{ fontSize: 8, color: '#c53030' }}>Tout candidat se présentant sans pièce d'identité valide ou sans dossier professionnel complet pourra être refusé à l'examen. En cas d'empêchement, contacter immédiatement pedagogie@pamoi.re.</Text>
        </View>

        {/* Signatures */}
        <View style={S.sigBlock}>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Signature et cachet du CFA</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Paméla MAILLOT — Directrice PAM OI</Text>
            <View style={S.sigLine} />
          </View>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Accusé de réception du/de la candidat(e)</Text>
            <Text style={{ fontSize: 8, color: '#888' }}>Signature précédée de "Lu et approuvé"</Text>
            <View style={S.sigLine} />
          </View>
        </View>

        <Text style={{ fontSize: 7.5, color: '#888', marginTop: 8, fontStyle: 'italic' }}>
          Document généré le {dateGeneration} — Convocation à conserver et à présenter le jour de l'examen
        </Text>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A</Text>
      </Page>
    </Document>
  );
}