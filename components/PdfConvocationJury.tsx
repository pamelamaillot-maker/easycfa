'use client';

// components/PdfConvocationJury.tsx
// Convocation d'un membre du jury à une session d'examen de titre professionnel.
//
// Réf. arrêté du 22 décembre 2015 : le jury est composé au minimum de deux
// professionnels habilités, en activité ou l'ayant quittée depuis moins de
// cinq ans, justifiant d'au moins trois ans d'expérience dans le métier visé.
//
// Le délai de convocation de 31 jours est une RÈGLE INTERNE à PAM OI :
// il n'est pas fixé par les textes consultés.

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { EpreuveEmargement } from '../lib/emargementsExamen';

const S = StyleSheet.create({
  page: { paddingTop: 35, paddingBottom: 50, paddingHorizontal: 45, fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 60, height: 44, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 7.5, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  titleBlock: { alignItems: 'center', marginVertical: 14 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontSize: 9, color: '#C8A23A', marginTop: 3, textAlign: 'center' },
  alertBox: { backgroundColor: '#fef6e4', padding: '8 12', borderRadius: 3, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#C8A23A' },
  alertText: { fontSize: 8.5, color: '#7a5c00', fontFamily: 'Helvetica-Bold' },
  sectionBg: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginTop: 10, marginBottom: 6, backgroundColor: '#EAF4F3', padding: '3 8', borderRadius: 2 },
  box: { backgroundColor: '#f9f9f9', padding: 8, borderRadius: 3, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 3 },
  lbl: { fontSize: 8.5, color: '#555', width: 150 },
  val: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#006B68', padding: '4 6' },
  th: { fontSize: 8, color: 'white', fontFamily: 'Helvetica-Bold' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', padding: '5 6' },
  trAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#f5f5f5', padding: '5 6' },
  bullet: { fontSize: 8.5, marginBottom: 4, marginLeft: 8, lineHeight: 1.4 },
  sigBlock: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  sigZone: { width: '45%' },
  sigLbl: { fontSize: 8, color: '#555', marginBottom: 2 },
  sigLine: { marginTop: 32, borderBottomWidth: 1, borderBottomColor: '#999' },
  footer: { position: 'absolute', bottom: 16, left: 45, right: 45, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 4, fontSize: 6.5, color: '#888', textAlign: 'center' },
  mention: { marginTop: 8, fontSize: 6.5, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
});

export interface DonneesConvocationJury {
  jure: { nom: string; prenom: string; qualite?: string; email?: string; telephone?: string };
  autresJures: { nom: string; prenom: string; qualite?: string }[];
  formationLabel: string;
  formationSigle: string;
  codeTitre: string;
  typeSession: string;          // 'titre' | 'ccp'
  ccpVise?: string;
  numeroCeres: string;
  dateDebut: string;
  dateFin: string;
  heureConvocation: string;
  lieu: string;
  responsableSession: string;
  nbCandidats: number;
  epreuves: EpreuveEmargement[];
  dureeTotale: string;
}

export default function PdfConvocationJury({ donnees: d }: { donnees: DonneesConvocationJury }) {
  const dateGeneration = new Date().toLocaleDateString('fr-FR');
  const cerisManquant = !d.numeroCeres || d.numeroCeres.trim() === '';

  return (
    <Document>
      <Page size="A4" style={S.page}>

        <View style={S.header}>
          <Image style={S.logo} src="/logo-pamoi.png" />
          <View>
            <Text style={S.headerTitle}>PAM OI Formation</Text>
            <Text style={S.headerRight}>1 Chemin Dubuisson – 97436 Saint-Leu</Text>
            <Text style={S.headerRight}>SIRET : 881 279 392 00016 – UAI : 9741871R</Text>
            <Text style={S.headerRight}>pedagogie@pamoi.re – 0693 55 64 97</Text>
          </View>
        </View>

        <View style={S.titleBlock}>
          <Text style={S.title}>Convocation — membre du jury</Text>
          <Text style={S.subtitle}>
            Titre Professionnel — {d.formationLabel} ({d.codeTitre})
          </Text>
        </View>

        {cerisManquant && (
          <View style={S.alertBox}>
            <Text style={S.alertText}>⚠️ Numéro de session CERES en attente — à compléter avant envoi au juré</Text>
          </View>
        )}

        {/* Destinataire */}
        <Text style={S.sectionBg}>Destinataire</Text>
        <View style={S.box}>
          <View style={S.row}><Text style={S.lbl}>Nom et prénom :</Text><Text style={S.val}>{(d.jure.nom ?? '').toUpperCase()} {d.jure.prenom ?? ''}</Text></View>
          {d.jure.qualite && <View style={S.row}><Text style={S.lbl}>Qualité :</Text><Text style={S.val}>{d.jure.qualite}</Text></View>}
          {d.jure.email && <View style={S.row}><Text style={S.lbl}>Email :</Text><Text style={S.val}>{d.jure.email}</Text></View>}
          {d.jure.telephone && <View style={S.row}><Text style={S.lbl}>Téléphone :</Text><Text style={S.val}>{d.jure.telephone}</Text></View>}
        </View>

        {/* Objet de la mission */}
        <Text style={S.sectionBg}>Objet de la mission</Text>
        <View style={S.box}>
          <Text style={{ fontSize: 8.5, lineHeight: 1.6, color: '#333' }}>
            Vous êtes convoqué(e) en qualité de membre du jury pour la session d&apos;examen du
            titre professionnel <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.formationLabel}</Text>
            {d.typeSession === 'ccp' && d.ccpVise
              ? <Text> — session CCP portant sur le <Text style={{ fontFamily: 'Helvetica-Bold' }}>{d.ccpVise}</Text></Text>
              : <Text> — session titre (parcours complet)</Text>}
            . Votre mission consiste à évaluer les candidats au regard du référentiel d&apos;évaluation
            du titre, à conduire les entretiens prévus, à délibérer collégialement et à signer le
            procès-verbal de la session.
          </Text>
        </View>

        {/* Session */}
        <Text style={S.sectionBg}>Session d&apos;examen</Text>
        <View style={S.box}>
          <View style={S.row}><Text style={S.lbl}>Numéro de session CERES :</Text><Text style={[S.val, { color: cerisManquant ? '#e53e3e' : '#006B68' }]}>{d.numeroCeres || 'En attente CERES'}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Dates de la session :</Text><Text style={S.val}>{d.dateDebut}{d.dateFin ? ` → ${d.dateFin}` : ''}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Heure de présence :</Text><Text style={S.val}>{d.heureConvocation || 'À préciser'}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Lieu :</Text><Text style={S.val}>{d.lieu}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Candidats à évaluer :</Text><Text style={S.val}>{d.nbCandidats}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Responsable de session :</Text><Text style={S.val}>{d.responsableSession || '—'}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Certificateur :</Text><Text style={S.val}>Ministère du Travail — DEETS La Réunion</Text></View>
        </View>

        {/* Épreuves */}
        <Text style={S.sectionBg}>Épreuves de la session</Text>
        <View style={S.tableHeader}>
          <Text style={[S.th, { flex: 1 }]}>Épreuve</Text>
          <Text style={[S.th, { width: 70, textAlign: 'center' }]}>Durée</Text>
        </View>
        {d.epreuves.map((e, i) => (
          <View key={e.cle} style={i % 2 === 0 ? S.tr : S.trAlt}>
            <Text style={{ fontSize: 8.5, flex: 1 }}>• {e.libelle}</Text>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', width: 70, textAlign: 'center', color: '#006B68' }}>{e.duree}</Text>
          </View>
        ))}
        <Text style={{ fontSize: 8, color: '#555', marginTop: 5, fontStyle: 'italic' }}>
          Durée totale par candidat : {d.dureeTotale} — à multiplier par le nombre de candidats
          pour les épreuves à passage individuel.
        </Text>

        {/* Composition du jury */}
        {d.autresJures.length > 0 && (
          <>
            <Text style={S.sectionBg}>Composition du jury</Text>
            <View style={S.tableHeader}>
              <Text style={[S.th, { width: 120 }]}>Nom</Text>
              <Text style={[S.th, { width: 100 }]}>Prénom</Text>
              <Text style={[S.th, { flex: 1 }]}>Qualité</Text>
            </View>
            {[d.jure, ...d.autresJures].map((j, i) => (
              <View key={i} style={i % 2 === 0 ? S.tr : S.trAlt}>
                <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', width: 120 }}>{(j.nom ?? '').toUpperCase()}</Text>
                <Text style={{ fontSize: 8.5, width: 100 }}>{j.prenom ?? ''}</Text>
                <Text style={{ fontSize: 8.5, flex: 1 }}>{j.qualite ?? '—'}</Text>
              </View>
            ))}
          </>
        )}

        {/* Obligations */}
        <Text style={S.sectionBg}>Vos obligations en qualité de membre du jury</Text>
        <Text style={S.bullet}>• Évaluer chaque candidat au seul regard du référentiel d&apos;évaluation du titre, sans tenir compte d&apos;éléments extérieurs à la session.</Text>
        <Text style={S.bullet}>• Respecter la stricte confidentialité des sujets, des productions des candidats et des délibérations.</Text>
        <Text style={S.bullet}>• Signaler au responsable de session tout lien personnel, familial ou professionnel avec un candidat, susceptible de mettre en cause votre impartialité.</Text>
        <Text style={S.bullet}>• Émarger la feuille de présence pour chaque journée de présence effective.</Text>
        <Text style={S.bullet}>• Participer à la délibération collégiale et signer le procès-verbal de la session.</Text>
        <Text style={S.bullet}>• Restituer au responsable de session l&apos;ensemble des documents remis en fin de session.</Text>

        {/* Rappel réglementaire */}
        <View style={{ marginTop: 10, padding: '8 10', backgroundColor: '#EAF4F3', borderRadius: 3 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 3 }}>Cadre réglementaire</Text>
          <Text style={{ fontSize: 8, color: '#333', lineHeight: 1.5 }}>
            Arrêté du 22 décembre 2015 relatif aux conditions de délivrance du titre professionnel.
            Le jury est composé au minimum de deux professionnels habilités par le représentant
            territorial du ministère chargé de l&apos;emploi, en activité ou l&apos;ayant quittée depuis
            moins de cinq ans, et justifiant d&apos;au moins trois ans d&apos;expérience dans le métier visé.
          </Text>
        </View>

        {/* Empêchement */}
        <View style={{ marginTop: 8, padding: '8 10', backgroundColor: '#fde8e8', borderRadius: 3 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#c53030', marginBottom: 3 }}>⚠️ En cas d&apos;empêchement</Text>
          <Text style={{ fontSize: 8, color: '#c53030', lineHeight: 1.5 }}>
            Le jury ne peut siéger avec moins de deux membres. Prévenez immédiatement le responsable
            de session à pedagogie@pamoi.re ou au 0693 55 64 97 : la session devrait être reportée,
            au préjudice des candidats.
          </Text>
        </View>

        {/* Signatures */}
        <View style={S.sigBlock}>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Signature et cachet du centre organisateur</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Paméla MAILLOT — Directrice PAM OI</Text>
            <View style={S.sigLine} />
          </View>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Accusé de réception du membre du jury</Text>
            <Text style={{ fontSize: 8, color: '#888' }}>Signature précédée de « Lu et approuvé »</Text>
            <View style={S.sigLine} />
          </View>
        </View>

        <Text style={{ fontSize: 7.5, color: '#888', marginTop: 8, fontStyle: 'italic' }}>
          Document généré le {dateGeneration} — convocation à conserver et à présenter le jour de la session
        </Text>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A</Text>
      </Page>
    </Document>
  );
}
