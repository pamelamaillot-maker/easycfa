'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { FeuilleEmargement, DemiJournee } from '../data/mockEmargement';

const S = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 45, paddingHorizontal: 40, fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 60, height: 44, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 7.5, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  titleBlock: { alignItems: 'center', marginVertical: 12 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontSize: 9, color: '#C8A23A', marginTop: 3 },
  infoBox: { backgroundColor: '#EAF4F3', padding: 8, borderRadius: 3, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 3 },
  lbl: { fontSize: 8, color: '#555', width: 120 },
  val: { fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#006B68', padding: '4 6', marginBottom: 0 },
  tableHeaderCell: { fontSize: 7.5, color: 'white', fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', minHeight: 28 },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#f9f9f9', minHeight: 28 },
  cellNom: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', width: 130, padding: '6 6', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellEntreprise: { fontSize: 8, color: '#555', width: 100, padding: '6 6', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellStatut: { fontSize: 8, width: 80, padding: '6 6', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellHeure: { fontSize: 8, width: 70, padding: '6 6', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellHeures: { fontSize: 8, fontFamily: 'Helvetica-Bold', width: 55, padding: '6 6', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellSignature: { flex: 1, padding: '6 6' },
  footer: { position: 'absolute', bottom: 16, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 5, fontSize: 6.5, color: '#888', textAlign: 'center' },
  mention: { marginTop: 6, fontSize: 6.5, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
  sigBlock: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sigZone: { width: '30%' },
  sigLbl: { fontSize: 7.5, color: '#555', marginBottom: 2 },
  sigLine: { marginTop: 30, borderBottomWidth: 1, borderBottomColor: '#999' },
});

const STATUT_ICON: Record<string, string> = {
  'Présent': '✓',
  'Absent': '✗',
  'Retard': '⚠',
  'Absent justifié': 'AJ',
  'Non saisi': '—',
};

type Props = {
  feuille: FeuilleEmargement;
  demiJournee: DemiJournee;
};

export default function PdfEmargement({ feuille, demiJournee: dj }: Props) {
  const nbPresents = dj.presences.filter(p => p.statut === 'Présent').length;
  const nbAbsents = dj.presences.filter(p => p.statut === 'Absent' || p.statut === 'Absent justifié').length;
  const nbRetards = dj.presences.filter(p => p.statut === 'Retard').length;

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
            <Text style={S.headerRight}>Tél : 0693 55 64 92 – pedagogie@pamoi.re</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={S.titleBlock}>
          <Text style={S.title}>Feuille d'émargement</Text>
          <Text style={S.subtitle}>{dj.type} — {feuille.jour} {feuille.date}</Text>
        </View>

        {/* Infos séance */}
        <View style={S.infoBox}>
          <View style={S.row}><Text style={S.lbl}>Formation :</Text><Text style={S.val}>{feuille.formation}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Session :</Text><Text style={S.val}>{feuille.sessionId}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Date :</Text><Text style={S.val}>{feuille.jour} {feuille.date}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Demi-journée :</Text><Text style={S.val}>{dj.type} — {dj.heureDebut} à {dj.heureFin} ({dj.heures}h)</Text></View>
          <View style={S.row}><Text style={S.lbl}>Formateur :</Text><Text style={S.val}>{dj.formateur}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Thème :</Text><Text style={S.val}>{dj.theme}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Modalité :</Text><Text style={S.val}>{dj.modalite}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Salle :</Text><Text style={S.val}>{feuille.salle}</Text></View>
        </View>

        {/* Tableau émargement */}
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { width: 130 }]}>Apprenant</Text>
          <Text style={[S.tableHeaderCell, { width: 100 }]}>Entreprise</Text>
          <Text style={[S.tableHeaderCell, { width: 80 }]}>Statut</Text>
          <Text style={[S.tableHeaderCell, { width: 70 }]}>Heure arrivée</Text>
          <Text style={[S.tableHeaderCell, { width: 55 }]}>Heures</Text>
          <Text style={[S.tableHeaderCell, { flex: 1 }]}>Signature apprenti</Text>
        </View>

        {dj.presences.map((p, i) => (
          <View key={p.apprenantId} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={S.cellNom}>{p.prenom} {p.nom}</Text>
            <Text style={S.cellEntreprise}>{p.entreprise}</Text>
            <Text style={[S.cellStatut, {
              color: p.statut === 'Présent' ? '#006B68' : p.statut === 'Absent' ? '#e53e3e' : p.statut === 'Retard' ? '#C8A23A' : '#888',
              fontFamily: 'Helvetica-Bold',
            }]}>
              {STATUT_ICON[p.statut]} {p.statut}
            </Text>
            <Text style={S.cellHeure}>{p.heureArrivee ?? '—'}</Text>
            <Text style={[S.cellHeures, { color: p.heuresComptees > 0 ? '#006B68' : '#e53e3e' }]}>
              {p.heuresComptees}h
            </Text>
            <Text style={S.cellSignature}></Text>
          </View>
        ))}

        {/* Récapitulatif */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          {[
            { label: 'Présents', value: nbPresents, color: '#006B68' },
            { label: 'Absents', value: nbAbsents, color: '#e53e3e' },
            { label: 'Retards', value: nbRetards, color: '#C8A23A' },
            { label: 'Total apprenants', value: dj.presences.length, color: '#555' },
          ].map((s) => (
            <View key={s.label} style={{ backgroundColor: '#EAF4F3', padding: '6 10', borderRadius: 4, alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 7, color: '#666', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Signatures */}
        <View style={S.sigBlock}>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Signature du formateur</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{dj.formateur}</Text>
            <View style={S.sigLine} />
          </View>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Visa du responsable pédagogique</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Betty REBOUL</Text>
            <View style={S.sigLine} />
          </View>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Visa de la directrice</Text>
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