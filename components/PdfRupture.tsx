'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import PdfCheckBox from './PdfCheckBox';
import { MOTIFS_RUPTURE_LISTE } from '../lib/donneesRupture';

const S = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 60, paddingHorizontal: 45, fontFamily: 'Helvetica', fontSize: 9.5, color: '#1a1a1a', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 60, height: 48, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 8, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', textAlign: 'center', marginVertical: 10 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#006B68', backgroundColor: '#EAF4F3', padding: '4 8', marginTop: 8, marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3, paddingHorizontal: 4 },
  label: { fontFamily: 'Helvetica-Bold' },
  value: { fontFamily: 'Helvetica-Bold', color: '#006B68' },
  motifIntro: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 4 },
  motifRow: { marginBottom: 2, paddingLeft: 4 },
  sigZone: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 6 },
  sigBlock: { width: '32%', borderTopWidth: 1, borderTopColor: '#999', paddingTop: 4 },
  sigLbl: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 18, left: 45, right: 45, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 5, fontSize: 7, color: '#888', textAlign: 'center', lineHeight: 1.4 },
  mention: { marginTop: 8, fontSize: 7, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
});

type Props = { donnees: Record<string, string> };

export default function PdfRupture({ donnees: d }: Props) {
  const motifCle = d.MOTIF_CLE || '';

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* En-tête */}
        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.headerRight}>1 Chemin Dubuisson – 97436 Saint-Leu</Text>
            <Text style={S.headerRight}>SIRET : 881 279 392 00016 – APE : 8559A</Text>
            <Text style={S.headerRight}>Tél : 0693 55 64 92 – pamelamaillot@pamoi.re</Text>
          </View>
        </View>

        <Text style={S.title}>Formulaire de résiliation du contrat d'apprentissage</Text>

        {/* === Contrat === */}
        <Text style={S.sectionTitle}>Le contrat d'apprentissage</Text>
        <View style={S.row}><Text style={S.label}>Date de début de contrat</Text><Text style={S.value}>{d.DATE_DEBUT_CONTRAT || '—'}</Text></View>
        <View style={S.row}><Text style={S.label}>Date de fin de contrat prévue</Text><Text style={S.value}>{d.DATE_FIN_CONTRAT || '—'}</Text></View>
        <View style={S.row}><Text style={S.label}>Enregistré par l'OPCO sous le numéro</Text><Text style={S.value}>{d.NUMERO_OPCO || '—'}</Text></View>

        {/* === Employeur === */}
        <Text style={S.sectionTitle}>L'employeur</Text>
        <View style={S.row}><Text style={S.label}>Entreprise</Text><Text style={S.value}>{d.ENTREPRISE_RAISON_SOCIALE || '—'}</Text></View>
        <View style={S.row}><Text style={S.label}>N° SIRET</Text><Text style={S.value}>{d.ENTREPRISE_SIRET || '—'}</Text></View>

        {/* === Apprenti === */}
        <Text style={S.sectionTitle}>L'apprenti</Text>
        <View style={S.row}><Text style={S.label}>Prénom et Nom</Text><Text style={S.value}>{d.APPRENANT_NOM_COMPLET || '—'}</Text></View>
        <View style={S.row}><Text style={S.label}>Date de naissance</Text><Text style={S.value}>{d.APPRENANT_DATE_NAISSANCE || '—'}</Text></View>

        {/* === Représentant légal (mineur) === */}
        <Text style={S.sectionTitle}>Le représentant légal de l'apprenti mineur</Text>
        <View style={S.row}><Text style={S.label}>Prénom et Nom</Text><Text style={S.value}>{d.REPRESENTANT_NOM_COMPLET || '—'}</Text></View>

        {/* === Motif === */}
        <Text style={S.motifIntro}>Cocher obligatoirement la case correspondant au motif de la rupture</Text>
        {MOTIFS_RUPTURE_LISTE.map(m => (
          <View key={m.cle} style={S.motifRow}>
            <PdfCheckBox label={m.label} checked={motifCle === m.cle} />
          </View>
        ))}

        <Text style={{ marginTop: 8, fontSize: 10 }}>
          <Text style={S.label}>Date d'effet de la rupture : </Text>
          <Text style={S.value}>{d.DATE_RUPTURE || '—'}</Text>
        </Text>

        {/* === Maintien === */}
        <Text style={[S.motifIntro, { marginTop: 8 }]}>L'apprenti poursuit-il sa formation en CFA après la rupture de son contrat d'apprentissage ?</Text>
        <View style={S.motifRow}><PdfCheckBox label="OUI" checked={d.MAINTIEN === 'OUI'} /></View>
        <View style={S.motifRow}>
          <PdfCheckBox label={`NON → Date de sortie de la formation : ${d.DATE_SORTIE || '_______________'}`} checked={d.MAINTIEN === 'NON'} />
        </View>

        {/* === Nouveau contrat === */}
        <Text style={[S.motifIntro, { marginTop: 8 }]}>Si l'apprenti signe un nouveau contrat dans une autre entreprise, merci de nous fournir les informations suivantes :</Text>
        <Text style={{ fontSize: 9.5, marginBottom: 3 }}>Signature d'un nouveau contrat d'apprentissage en date du : _______________</Text>
        <Text style={{ fontSize: 9.5, marginBottom: 3 }}>Avec l'entreprise (Raison sociale) : _______________</Text>
        <Text style={{ fontSize: 9.5, marginBottom: 3 }}>Siret et IDCC : _______________   Nouvel OPCO compétent : _______________</Text>

        {/* === Lieu/Date === */}
        <Text style={{ marginTop: 12, fontSize: 10 }}>
          <Text style={S.label}>Fait à : </Text><Text style={S.value}>{d.LIEU_SIGNATURE || 'Saint-Leu'}</Text>
          <Text style={S.label}>     Le : </Text><Text style={S.value}>{d.DATE_SIGNATURE || ''}</Text>
        </Text>

        {/* === Signatures === */}
        <View style={S.sigZone}>
          <View style={S.sigBlock}><Text style={S.sigLbl}>L'employeur</Text></View>
          <View style={S.sigBlock}><Text style={S.sigLbl}>L'apprenti</Text></View>
          <View style={S.sigBlock}><Text style={S.sigLbl}>Le représentant légal</Text></View>
        </View>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>
          PAM OI Formation – 1 Chemin Dubuisson 97436 Saint-Leu – SIRET : 881 279 392 00016 – APE : 8559A{'\n'}
          SASU au capital de 500€ – RCS 881 279 392 Saint-Pierre de la Réunion – Tél : 0693 55 64 92 – contact@pamoi.re
        </Text>
      </Page>
    </Document>
  );
}