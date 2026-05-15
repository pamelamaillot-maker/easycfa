'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page: { paddingTop: 20, paddingBottom: 30, paddingHorizontal: 30, fontFamily: 'Helvetica', fontSize: 8, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#006B68' },
  headerTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006B68' },
  headerSub: { fontSize: 7, color: '#555', marginTop: 1 },
  headerRight: { textAlign: 'right', fontSize: 7, color: '#555' },
  titre: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center', textTransform: 'uppercase', color: '#006B68', marginBottom: 2, textDecoration: 'underline' },
  titreSub: { fontSize: 7, textAlign: 'center', color: '#555', marginBottom: 8 },
  tableauHeader: { backgroundColor: '#006B68', padding: '4 6' },
  tableauHeaderText: { color: 'white', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  tableauRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#aaa', borderLeftWidth: 0.5, borderLeftColor: '#aaa', borderRightWidth: 0.5, borderRightColor: '#aaa' },
  tableauRowAlt: { flexDirection: 'row', backgroundColor: '#EAF4F3', borderBottomWidth: 0.5, borderBottomColor: '#aaa', borderLeftWidth: 0.5, borderLeftColor: '#aaa', borderRightWidth: 0.5, borderRightColor: '#aaa' },
  tableauLabel: { width: 180, padding: '3 6', borderRightWidth: 0.5, borderRightColor: '#aaa', fontSize: 7.5, color: '#555' },
  tableauValue: { flex: 1, padding: '3 6', fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  sectionTitle: { backgroundColor: '#006B68', padding: '4 6', marginTop: 6 },
  sectionTitleText: { color: 'white', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  motifTitre: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginTop: 8, marginBottom: 4, color: '#006B68' },
  motifRow: { flexDirection: 'row', marginBottom: 2.5, alignItems: 'flex-start' },
  checkbox: { width: 8, height: 8, borderWidth: 1, borderColor: '#006B68', marginRight: 5, marginTop: 1, flexShrink: 0 },
  checkboxChecked: { fontSize: 7, color: '#006B68', fontFamily: 'Helvetica-Bold' },
  motifText: { flex: 1, fontSize: 7, lineHeight: 1.3 },
  dateEffetBox: { borderWidth: 1, borderColor: '#006B68', backgroundColor: '#EAF4F3', padding: '5 8', marginTop: 6, marginBottom: 4, borderRadius: 2 },
  dateEffetLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#006B68' },
  dateEffetValue: { fontSize: 8, marginTop: 2, fontFamily: 'Helvetica-Bold' },
  question: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginTop: 6, marginBottom: 3, color: '#006B68' },
  choixRow: { flexDirection: 'row', gap: 30, marginBottom: 4 },
  choixItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nouveauContrat: { marginTop: 4, fontSize: 7.5, backgroundColor: '#EAF4F3', padding: '5 8', borderRadius: 2, borderLeftWidth: 2, borderLeftColor: '#C8A23A' },
  nouveauContratLigne: { marginBottom: 3, paddingBottom: 2, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  faitA: { marginTop: 8, fontSize: 7.5, color: '#333' },
  barreOr: { height: 2, backgroundColor: '#C8A23A', marginTop: 8, marginBottom: 6, borderRadius: 1 },
  sigBlock: { flexDirection: 'row', justifyContent: 'space-between' },
  sigZone: { width: '30%' },
  sigLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 3, color: '#006B68' },
  sigBox: { borderWidth: 1, borderColor: '#006B68', height: 40, borderRadius: 2, backgroundColor: '#EAF4F3' },
  footer: { position: 'absolute', bottom: 10, left: 30, right: 30, borderTopWidth: 0.5, borderTopColor: '#C8A23A', paddingTop: 3, fontSize: 6.5, color: '#888', textAlign: 'center' },
  mention: { fontSize: 6, color: '#aaa', textAlign: 'center', marginTop: 3 },
});

const MOTIFS = [
  { id: 'unilateral', label: "Rupture unilatérale de l'employeur ou de l'apprenti pendant les 45 premiers jours en emploi, consécutifs ou non (art. L.6222-18, al.1)" },
  { id: 'commun', label: "Rupture d'un commun accord entre l'apprenti et l'employeur (art. L.6222-18, al.2)" },
  { id: 'force_majeure', label: "Rupture en cas de force majeure — licenciement (art. L.6222-18, al.3)" },
  { id: 'faute_grave', label: "Rupture en cas de faute grave de l'apprenti — licenciement (art. L.6222-18, al.3)" },
  { id: 'inaptitude', label: "Rupture en cas d'inaptitude de l'apprenti constatée par le médecin du travail (art. L.6222-18, al.3)" },
  { id: 'deces', label: "Rupture en cas de décès de l'employeur maître d'apprentissage en entreprise unipersonnelle (art. L.6222-18, al.3)" },
  { id: 'initiative', label: "Rupture à l'initiative de l'apprenti après préavis et sollicitation du médiateur consulaire (art. L.6222-18, al.4)" },
  { id: 'liquidation', label: "Rupture en cas de liquidation judiciaire de l'employeur sans maintien de l'activité (art. L.6222-18, al.5)" },
  { id: 'exclusion', label: "Rupture en cas d'exclusion définitive de l'apprenti par le CFA (art. L.6222-18-1)" },
  { id: 'diplome', label: "Rupture en cas d'obtention du diplôme — fin du contrat à l'initiative de l'apprenti (art. L.6222-19)" },
  { id: 'administratif', label: "Rupture par décision administrative — risque d'atteinte à la santé ou l'intégrité de l'apprenti (art. L.6222-24 et L.6222-25)" },
];

type Props = {
  apprenant: {
    nom: string; prenom: string; dateNaissance: string;
    dateDebutContrat: string; dateFinContrat: string;
    numeroDECA?: string; numeroDossierOPCO?: string;
    entreprise: string; siret?: string;
    representantNom?: string; representantPrenom?: string;
  };
  motif: string;
  dateRupture: string;
  maintienFormation: string;
  dateFinMaintien?: string;
  nouveauContrat?: { date: string; entreprise: string; siret: string; idcc: string; opco: string };
};

export default function PdfRupture({ apprenant, motif, dateRupture, maintienFormation, dateFinMaintien, nouveauContrat }: Props) {
  const dateGeneration = new Date().toLocaleDateString('fr-FR');

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* En-tête */}
        <View style={S.header}>
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.headerSub}>1 Chemin Dubuisson – 97436 Saint-Leu</Text>
            <Text style={S.headerSub}>NDA : 04973425197 – SIRET : 881 279 392 00016</Text>
            <Text style={S.headerSub}>pedagogie@pamoi.re – 0693 55 64 97</Text>
          </View>
          <View>
            <Text style={S.headerRight}>Généré le {dateGeneration}</Text>
            <Text style={S.headerRight}>Qualiopi n° 51971543-3</Text>
          </View>
        </View>

        {/* Titre */}
        <Text style={S.titre}>Formulaire de résiliation du contrat d'apprentissage</Text>
        <Text style={S.titreSub}>Certificateur : Ministère du Travail du Plein Emploi et de l'Insertion</Text>

        {/* Contrat */}
        <View style={S.tableauHeader}><Text style={S.tableauHeaderText}>Le contrat d'apprentissage</Text></View>
        <View style={S.tableauRow}>
          <Text style={S.tableauLabel}>Date de début de contrat</Text>
          <Text style={S.tableauValue}>{apprenant.dateDebutContrat || '—'}</Text>
        </View>
        <View style={S.tableauRowAlt}>
          <Text style={S.tableauLabel}>Date de fin de contrat prévue</Text>
          <Text style={S.tableauValue}>{apprenant.dateFinContrat || '—'}</Text>
        </View>
        <View style={S.tableauRow}>
          <Text style={S.tableauLabel}>Enregistré par l'OPCO sous le numéro</Text>
          <Text style={S.tableauValue}>{apprenant.numeroDossierOPCO || apprenant.numeroDECA || '—'}</Text>
        </View>

        {/* Employeur */}
        <View style={S.sectionTitle}><Text style={S.sectionTitleText}>L'employeur</Text></View>
        <View style={S.tableauRow}>
          <Text style={S.tableauLabel}>Entreprise</Text>
          <Text style={S.tableauValue}>{apprenant.entreprise || '—'}</Text>
        </View>
        <View style={S.tableauRowAlt}>
          <Text style={S.tableauLabel}>N° SIRET</Text>
          <Text style={S.tableauValue}>{apprenant.siret || '—'}</Text>
        </View>

        {/* Apprenti */}
        <View style={S.sectionTitle}><Text style={S.sectionTitleText}>L'apprenti</Text></View>
        <View style={S.tableauRow}>
          <Text style={S.tableauLabel}>Prénom et Nom</Text>
          <Text style={S.tableauValue}>{apprenant.prenom} {apprenant.nom}</Text>
        </View>
        <View style={S.tableauRowAlt}>
          <Text style={S.tableauLabel}>Date de naissance</Text>
          <Text style={S.tableauValue}>{apprenant.dateNaissance || '—'}</Text>
        </View>

        {/* Représentant légal */}
        <View style={S.sectionTitle}><Text style={S.sectionTitleText}>Le représentant légal de l'apprenti mineur</Text></View>
        <View style={S.tableauRow}>
          <Text style={S.tableauLabel}>Prénom et Nom</Text>
          <Text style={S.tableauValue}>{apprenant.representantPrenom && apprenant.representantNom ? apprenant.representantPrenom + ' ' + apprenant.representantNom : '—'}</Text>
        </View>

        {/* Motifs */}
        <Text style={S.motifTitre}>Cocher obligatoirement la case correspondant au motif de la rupture</Text>
        {MOTIFS.map((m) => (
          <View key={m.id} style={S.motifRow}>
            <View style={S.checkbox}>
              {motif === m.id && <Text style={S.checkboxChecked}>✓</Text>}
            </View>
            <Text style={S.motifText}>{m.label}</Text>
          </View>
        ))}

        {/* Date d'effet */}
        <View style={S.dateEffetBox}>
          <Text style={S.dateEffetLabel}>Date d'effet de la rupture :</Text>
          <Text style={S.dateEffetValue}>{dateRupture || '_______________________________________________'}</Text>
        </View>

        {/* Poursuite formation */}
        <Text style={S.question}>L'apprenti poursuit-il sa formation en CFA après la rupture de son contrat d'apprentissage ?</Text>
        <View style={S.choixRow}>
          <View style={S.choixItem}>
            <View style={S.checkbox}>{maintienFormation === 'OUI' && <Text style={S.checkboxChecked}>✓</Text>}</View>
            <Text style={{ fontSize: 8 }}>OUI</Text>
          </View>
          <View style={S.choixItem}>
            <View style={S.checkbox}>{maintienFormation === 'NON' && <Text style={S.checkboxChecked}>✓</Text>}</View>
            <Text style={{ fontSize: 8 }}>NON  —  Date de sortie : {maintienFormation === 'NON' ? (dateFinMaintien || '_______________') : ''}</Text>
          </View>
        </View>

        {/* Nouveau contrat */}
        <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginTop: 4, marginBottom: 3, color: '#006B68' }}>
          Si l'apprenti signe un nouveau contrat dans une autre entreprise :
        </Text>
        <View style={S.nouveauContrat}>
          <Text style={S.nouveauContratLigne}>Signature d'un nouveau contrat en date du : {nouveauContrat?.date || ''}</Text>
          <Text style={S.nouveauContratLigne}>Avec l'entreprise (Raison sociale) : {nouveauContrat?.entreprise || ''}</Text>
          <Text style={S.nouveauContratLigne}>Siret et IDCC : {nouveauContrat?.siret || ''}{nouveauContrat?.idcc ? ' — IDCC : ' + nouveauContrat.idcc : ''}</Text>
          <Text>Nouvel Opco compétent : {nouveauContrat?.opco || ''}</Text>
        </View>

        {/* Fait à */}
        <View style={S.faitA}>
          <Text>Fait à : Saint-Leu    Le : {dateGeneration}</Text>
        </View>

        {/* Barre dorée */}
        <View style={S.barreOr} />

        {/* Signatures */}
        <View style={S.sigBlock}>
          <View style={S.sigZone}>
            <Text style={S.sigLabel}>L'employeur :</Text>
            <View style={S.sigBox} />
          </View>
          <View style={S.sigZone}>
            <Text style={S.sigLabel}>L'apprenti :</Text>
            <View style={S.sigBox} />
          </View>
          <View style={S.sigZone}>
            <Text style={S.sigLabel}>Le représentant légal :</Text>
            <View style={S.sigBox} />
          </View>
        </View>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – NDA : 04973425197 – SIRET : 881 279 392 00016 – Qualiopi n° 51971543-3</Text>
      </Page>
    </Document>
  );
}