'use client';

// components/PdfEmargementExamen.tsx
// Feuilles d'émargement d'une session d'examen — un seul PDF, plusieurs pages :
//   1. une page par épreuve (signature des candidats)
//   2. une page jury (dates et heures à compléter à la main)
//   3. le tableau de correspondance identifiants / noms
//
// Réf. DTE : « attribuez un identifiant à chaque candidat. Établissez un
// tableau de correspondance que vous remettrez au jury pour les entretiens. »
// Réf. arrêté du 22 décembre 2015, art. 6 : le jury comporte au minimum
// deux membres habilités.

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { EpreuveEmargement } from '../lib/emargementsExamen';

const S = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 45, paddingHorizontal: 38, fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 9, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 60, height: 44, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 7.5, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  titleBlock: { alignItems: 'center', marginVertical: 10 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontSize: 9, color: '#C8A23A', marginTop: 3, textAlign: 'center' },
  infoBox: { backgroundColor: '#EAF4F3', padding: 8, borderRadius: 3, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 3 },
  lbl: { fontSize: 8, color: '#555', width: 130 },
  val: { fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#006B68', padding: '5 6' },
  th: { fontSize: 7.5, color: 'white', fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', minHeight: 34 },
  trAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#f9f9f9', minHeight: 34 },
  cellId: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#006B68', width: 90, padding: '9 6', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellNom: { fontSize: 8.5, flex: 1, padding: '9 6', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellH: { width: 62, padding: '9 6', borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  cellSig: { width: 150, padding: '9 6' },
  footer: { position: 'absolute', bottom: 16, left: 38, right: 38, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 5, fontSize: 6.5, color: '#888', textAlign: 'center' },
  mention: { marginTop: 6, fontSize: 6.5, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
  sigBlock: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  sigZone: { width: '46%' },
  sigLbl: { fontSize: 7.5, color: '#555', marginBottom: 2 },
  sigLine: { marginTop: 32, borderBottomWidth: 1, borderBottomColor: '#999' },
  avert: { marginTop: 10, fontSize: 7, color: '#888', fontStyle: 'italic' },
});

export interface CandidatEmargement {
  identifiant: string;
  nom: string;
  prenom: string;
}

export interface JureEmargement {
  nom: string;
  prenom: string;
}

export interface DonneesEmargementExamen {
  formationSigle: string;
  formationLabel: string;
  codeTitre: string;          // ex. TP-01293m04
  typeSession: string;        // 'titre' | 'ccp'
  ccpVise?: string;
  numeroCeres: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  responsableSession: string;
  candidats: CandidatEmargement[];
  jures: JureEmargement[];
  epreuves: EpreuveEmargement[];
  dureeTotale: string;
}

function EnTete({ d }: { d: DonneesEmargementExamen }) {
  return (
    <View style={S.header}>
      <Image style={S.logo} src="/logo-pamoi.png" />
      <View>
        <Text style={S.headerTitle}>PAM OI Formation</Text>
        <Text style={S.headerRight}>1 Chemin Dubuisson – 97436 Saint-Leu</Text>
        <Text style={S.headerRight}>SIRET : 881 279 392 00016 – UAI : 9741871R</Text>
        <Text style={S.headerRight}>Session CERES n° {d.numeroCeres || '—'}</Text>
      </View>
    </View>
  );
}

function PiedDePage() {
  return (
    <>
      <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
      <Text style={S.footer}>PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A</Text>
    </>
  );
}

function BlocInfos({ d, epreuve }: { d: DonneesEmargementExamen; epreuve?: EpreuveEmargement }) {
  return (
    <View style={S.infoBox}>
      <View style={S.row}><Text style={S.lbl}>Titre professionnel :</Text><Text style={S.val}>{d.formationLabel} ({d.codeTitre})</Text></View>
      <View style={S.row}><Text style={S.lbl}>Type de session :</Text><Text style={S.val}>{d.typeSession === 'ccp' ? `Session CCP — ${d.ccpVise ?? ''}` : 'Session titre (TP complet)'}</Text></View>
      <View style={S.row}><Text style={S.lbl}>N° session CERES :</Text><Text style={S.val}>{d.numeroCeres || '—'}</Text></View>
      <View style={S.row}><Text style={S.lbl}>Période de session :</Text><Text style={S.val}>{d.dateDebut} {d.dateFin ? `→ ${d.dateFin}` : ''}</Text></View>
      <View style={S.row}><Text style={S.lbl}>Lieu :</Text><Text style={S.val}>{d.lieu}</Text></View>
      <View style={S.row}><Text style={S.lbl}>Responsable de session :</Text><Text style={S.val}>{d.responsableSession || '—'}</Text></View>
      {epreuve && (
        <>
          <View style={S.row}><Text style={S.lbl}>Épreuve :</Text><Text style={S.val}>{epreuve.libelle}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Durée réglementaire :</Text><Text style={S.val}>{epreuve.duree}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Date de l&apos;épreuve :</Text><Text style={S.val}>............................................</Text></View>
        </>
      )}
    </View>
  );
}

export default function PdfEmargementExamen({ donnees: d }: { donnees: DonneesEmargementExamen }) {
  return (
    <Document>

      {/* ── UNE PAGE PAR ÉPREUVE ── */}
      {d.epreuves.map(ep => (
        <Page key={ep.cle} size="A4" style={S.page}>
          <EnTete d={d} />

          <View style={S.titleBlock}>
            <Text style={S.title}>Feuille d&apos;émargement — candidats</Text>
            <Text style={S.subtitle}>{ep.libelle} — durée {ep.duree}</Text>
          </View>

          <BlocInfos d={d} epreuve={ep} />

          <View style={S.tableHeader}>
            <Text style={[S.th, { width: 90 }]}>N° candidat</Text>
            <Text style={[S.th, { flex: 1 }]}>Nom et prénom</Text>
            {ep.avecPlage ? (
              <>
                <Text style={[S.th, { width: 62 }]}>Heure début</Text>
                <Text style={[S.th, { width: 62 }]}>Heure fin</Text>
              </>
            ) : (
              <Text style={[S.th, { width: 124 }]}>Heure de passage</Text>
            )}
            <Text style={[S.th, { width: 150 }]}>Signature</Text>
          </View>

          {d.candidats.map((c, i) => (
            <View key={c.identifiant} style={i % 2 === 0 ? S.tr : S.trAlt}>
              <Text style={S.cellId}>{c.identifiant}</Text>
              <Text style={S.cellNom}>{c.nom.toUpperCase()} {c.prenom}</Text>
              {ep.avecPlage ? (
                <>
                  <Text style={S.cellH}></Text>
                  <Text style={S.cellH}></Text>
                </>
              ) : (
                <Text style={[S.cellH, { width: 124 }]}></Text>
              )}
              <Text style={S.cellSig}></Text>
            </View>
          ))}

          <Text style={S.avert}>
            {ep.avecPlage
              ? "Épreuve collective : l'heure de début est celle portée sur la convocation du candidat. L'heure de fin est relevée à la remise des travaux."
              : "Passage individuel devant le jury : les heures sont renseignées au moment du passage. L'ordre de passage est déterminé par le responsable de session."}
          </Text>

          <View style={S.sigBlock}>
            <View style={{ width: '31%' }}>
              <Text style={S.sigLbl}>Visa du responsable de session</Text>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{d.responsableSession || '—'}</Text>
              <View style={S.sigLine} />
            </View>
            {Array.from({ length: 2 }).map((_, i) => {
              const j = d.jures[i];
              return (
                <View key={i} style={{ width: '31%' }}>
                  <Text style={S.sigLbl}>Membre du jury {i + 1}</Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>
                    {j ? `${(j.nom ?? '').toUpperCase()} ${j.prenom ?? ''}` : '—'}
                  </Text>
                  <View style={S.sigLine} />
                </View>
              );
            })}
          </View>

          <PiedDePage />
        </Page>
      ))}

      {/* ── PAGE JURY ── */}
      <Page size="A4" style={S.page}>
        <EnTete d={d} />

        <View style={S.titleBlock}>
          <Text style={S.title}>Feuille d&apos;émargement — jury</Text>
          <Text style={S.subtitle}>Signature par jour de présence</Text>
        </View>

        <BlocInfos d={d} />

        <View style={S.infoBox}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 4 }}>
            Épreuves de la session
          </Text>
          {d.epreuves.map(ep => (
            <Text key={ep.cle} style={{ fontSize: 8, color: '#333', marginBottom: 2 }}>
              • {ep.libelle} — {ep.duree}
            </Text>
          ))}
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#006B68', marginTop: 4 }}>
            Durée totale de l&apos;épreuve par candidat : {d.dureeTotale}
          </Text>
        </View>

        <View style={S.tableHeader}>
          <Text style={[S.th, { width: 30 }]}>N°</Text>
          <Text style={[S.th, { flex: 1 }]}>Nom et prénom du juré</Text>
          <Text style={[S.th, { width: 70 }]}>Date</Text>
          <Text style={[S.th, { width: 62 }]}>Arrivée</Text>
          <Text style={[S.th, { width: 62 }]}>Départ</Text>
          <Text style={[S.th, { width: 130 }]}>Signature</Text>
        </View>

        {Array.from({ length: Math.max(2, d.jures.length) }).map((_, i) => {
          const j = d.jures[i];
          return (
            <View key={i} style={i % 2 === 0 ? S.tr : S.trAlt}>
              <Text style={[S.cellId, { width: 30 }]}>{i + 1}</Text>
              <Text style={S.cellNom}>{j ? `${(j.nom ?? '').toUpperCase()} ${j.prenom ?? ''}` : ''}</Text>
              <Text style={[S.cellH, { width: 70 }]}></Text>
              <Text style={S.cellH}></Text>
              <Text style={S.cellH}></Text>
              <Text style={[S.cellSig, { width: 130 }]}></Text>
            </View>
          );
        })}

        {/* Lignes vierges : le jury signe par jour de présence */}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v${i}`} style={i % 2 === 0 ? S.trAlt : S.tr}>
            <Text style={[S.cellId, { width: 30 }]}></Text>
            <Text style={S.cellNom}></Text>
            <Text style={[S.cellH, { width: 70 }]}></Text>
            <Text style={S.cellH}></Text>
            <Text style={S.cellH}></Text>
            <Text style={[S.cellSig, { width: 130 }]}></Text>
          </View>
        ))}

        <Text style={S.avert}>
          Le jury est composé au minimum de deux membres habilités (arrêté du 22 décembre 2015, art. 6).
          Chaque juré signe pour chaque jour de présence : reporter la date sur la ligne correspondante.
        </Text>

        <View style={S.sigBlock}>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Visa du responsable de session</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{d.responsableSession || '—'}</Text>
            <View style={S.sigLine} />
          </View>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Visa de la directrice</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Paméla MAILLOT</Text>
            <View style={S.sigLine} />
          </View>
        </View>

        <PiedDePage />
      </Page>

      {/* ── TABLEAU DE CORRESPONDANCE ── */}
      <Page size="A4" style={S.page}>
        <EnTete d={d} />

        <View style={S.titleBlock}>
          <Text style={S.title}>Tableau de correspondance des candidats</Text>
          <Text style={S.subtitle}>Document confidentiel — à remettre au jury pour les entretiens</Text>
        </View>

        <BlocInfos d={d} />

        <View style={S.tableHeader}>
          <Text style={[S.th, { width: 120 }]}>N° identifiant</Text>
          <Text style={[S.th, { flex: 1 }]}>Nom et prénom du candidat</Text>
        </View>

        {d.candidats.map((c, i) => (
          <View key={c.identifiant} style={i % 2 === 0 ? S.tr : S.trAlt}>
            <Text style={[S.cellId, { width: 120 }]}>{c.identifiant}</Text>
            <Text style={S.cellNom}>{c.nom.toUpperCase()} {c.prenom}</Text>
          </View>
        ))}

        <Text style={S.avert}>
          L&apos;identifiant se compose du sigle du titre, de la référence du poste de travail et du rang
          du candidat. Il garantit l&apos;anonymat des productions écrites jusqu&apos;à la correction.
        </Text>

        <View style={S.sigBlock}>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Établi par le responsable de session</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{d.responsableSession || '—'}</Text>
            <View style={S.sigLine} />
          </View>
          <View style={S.sigZone}>
            <Text style={S.sigLbl}>Remis au jury le</Text>
            <Text style={{ fontSize: 8, color: '#888' }}>Date : ....................</Text>
            <View style={S.sigLine} />
          </View>
        </View>

        <PiedDePage />
      </Page>
    </Document>
  );
}
