'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 45, paddingHorizontal: 40, fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 60, height: 44, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 7.5, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  titleBlock: { alignItems: 'center', marginVertical: 12 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontSize: 9, color: '#C8A23A', marginTop: 3 },
  infoBox: { backgroundColor: '#EAF4F3', padding: 8, borderRadius: 3, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 3 },
  lbl: { fontSize: 8, color: '#555', width: 130 },
  val: { fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: '#EAF4F3', padding: '8 10', borderRadius: 4, alignItems: 'center' },
  statVal: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#006B68' },
  statLbl: { fontSize: 7, color: '#666', marginTop: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#006B68', padding: '4 6' },
  tableHeaderCell: { fontSize: 7.5, color: 'white', fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', minHeight: 22 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#f9f9f9', minHeight: 22 },
  sigBlock: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sigZone: { width: '30%' },
  sigLbl: { fontSize: 7.5, color: '#555', marginBottom: 2 },
  sigLine: { marginTop: 30, borderBottomWidth: 1, borderBottomColor: '#999' },
  footer: { position: 'absolute', bottom: 16, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 5, fontSize: 6.5, color: '#888', textAlign: 'center' },
  mention: { marginTop: 6, fontSize: 6.5, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
  alertBox: { backgroundColor: '#fef6e4', padding: '6 10', borderRadius: 4, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#C8A23A' },
});

type Seance = {
  date: string;
  demiJournee: string;
  theme: string;
  statut: string;
  heures: number;
  heureArrivee?: string;
  justificatif: boolean;
};

type Props = {
  apprenant: { nom: string; prenom: string; email: string };
  entreprise: { nom: string; email: string; tuteur: string };
  formation: string;
  session: string;
  mois: string;
  heuresPrevues: number;
  heuresRealisees: number;
  heuresAbsence: number;
  tauxPresence: number;
  tauxAbsence: number;
  seances: Seance[];
};

export default function PdfEtatPresenceMensuel({ apprenant, entreprise, formation, session, mois, heuresPrevues, heuresRealisees, heuresAbsence, tauxPresence, tauxAbsence, seances }: Props) {
  const absencesInjustifiees = seances.filter(s => (s.statut === 'Absent' || s.statut === 'Retard') && !s.justificatif);

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* En-tête */}
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.headerRight}>1 Chemin Dubuisson – 97436 Saint-Leu</Text>
            <Text style={S.headerRight}>SIRET : 881 279 392 00016</Text>
            <Text style={S.headerRight}>pedagogie@pamoi.re – 0693 55 64 92</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={S.titleBlock}>
          <Text style={S.title}>État de présence mensuel</Text>
          <Text style={S.subtitle}>{mois} — {formation}</Text>
        </View>

        {/* Infos apprenant */}
        <View style={S.infoBox}>
          <View style={S.row}><Text style={S.lbl}>Apprenant :</Text><Text style={S.val}>{apprenant.prenom} {apprenant.nom}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Formation :</Text><Text style={S.val}>{formation}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Session :</Text><Text style={S.val}>{session}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Mois :</Text><Text style={S.val}>{mois}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Entreprise :</Text><Text style={S.val}>{entreprise.nom}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Tuteur :</Text><Text style={S.val}>{entreprise.tuteur}</Text></View>
        </View>

        {/* Stats */}
        <View style={S.statsRow}>
          <View style={S.statBox}>
            <Text style={S.statVal}>{heuresPrevues}h</Text>
            <Text style={S.statLbl}>Heures prévues</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: '#006B68' }]}>{heuresRealisees}h</Text>
            <Text style={S.statLbl}>Heures réalisées</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: heuresAbsence > 0 ? '#e53e3e' : '#006B68' }]}>{heuresAbsence}h</Text>
            <Text style={S.statLbl}>Heures absence</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: tauxPresence >= 90 ? '#006B68' : tauxPresence >= 75 ? '#C8A23A' : '#e53e3e' }]}>{tauxPresence}%</Text>
            <Text style={S.statLbl}>Taux présence</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: tauxAbsence > 10 ? '#e53e3e' : '#006B68' }]}>{tauxAbsence}%</Text>
            <Text style={S.statLbl}>Taux absence</Text>
          </View>
        </View>

        {/* Alerte absences injustifiées */}
        {absencesInjustifiees.length > 0 && (
          <View style={S.alertBox}>
            <Text style={{ fontSize: 8, color: '#7a5c00', fontFamily: 'Helvetica-Bold' }}>
              ⚠ {absencesInjustifiees.length} absence(s)/retard(s) sans justificatif — considéré(s) comme injustifié(s)
            </Text>
          </View>
        )}

        {/* Tableau séances */}
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { width: 70 }]}>Date</Text>
          <Text style={[S.tableHeaderCell, { width: 70 }]}>Demi-journée</Text>
          <Text style={[S.tableHeaderCell, { flex: 1 }]}>Thème</Text>
          <Text style={[S.tableHeaderCell, { width: 80 }]}>Statut</Text>
          <Text style={[S.tableHeaderCell, { width: 55 }]}>H. arrivée</Text>
          <Text style={[S.tableHeaderCell, { width: 45 }]}>Heures</Text>
          <Text style={[S.tableHeaderCell, { width: 60 }]}>Justificatif</Text>
        </View>

        {seances.map((s, i) => (
          <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={{ fontSize: 8, width: 70, padding: '5 6', borderRightWidth: 1, borderRightColor: '#e0e0e0' }}>{s.date}</Text>
            <Text style={{ fontSize: 8, width: 70, padding: '5 6', borderRightWidth: 1, borderRightColor: '#e0e0e0', textAlign: 'center' }}>{s.demiJournee}</Text>
            <Text style={{ fontSize: 7.5, flex: 1, padding: '5 6', borderRightWidth: 1, borderRightColor: '#e0e0e0' }}>{s.theme}</Text>
            <Text style={{ fontSize: 8, width: 80, padding: '5 6', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e0e0e0', fontFamily: 'Helvetica-Bold', color: s.statut === 'Présent' ? '#006B68' : s.statut === 'Absent' ? '#e53e3e' : '#C8A23A' }}>
              {s.statut}
            </Text>
            <Text style={{ fontSize: 8, width: 55, padding: '5 6', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e0e0e0' }}>{s.heureArrivee ?? '—'}</Text>
            <Text style={{ fontSize: 8, width: 45, padding: '5 6', textAlign: 'center', fontFamily: 'Helvetica-Bold', borderRightWidth: 1, borderRightColor: '#e0e0e0', color: s.heures > 0 ? '#006B68' : '#e53e3e' }}>{s.heures}h</Text>
            <Text style={{ fontSize: 8, width: 60, padding: '5 6', textAlign: 'center', color: s.justificatif ? '#006B68' : s.statut === 'Présent' ? '#aaa' : '#e53e3e', fontFamily: 'Helvetica-Bold' }}>
              {s.statut === 'Présent' ? '—' : s.justificatif ? 'Reçu' : 'Manquant'}
            </Text>
          </View>
        ))}

        {/* Signatures */}
        <View style={S.sigBlock}>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Signature de l'apprenant</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{apprenant.prenom} {apprenant.nom}</Text>
            <View style={S.sigLine} />
          </View>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Signature du tuteur entreprise</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{entreprise.tuteur}</Text>
            <View style={S.sigLine} />
          </View>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Visa PAM OI Formation</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Paméla MAILLOT</Text>
            <View style={S.sigLine} />
          </View>
        </View>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A</Text>
      </Page>
    </Document>
  );
}