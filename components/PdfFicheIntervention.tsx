'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { FicheIntervention } from '../data/mockInterventions';

const S = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 45, paddingHorizontal: 40, fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#EAF4F3' },
  logo: { width: 60, height: 44, objectFit: 'contain' },
  headerRight: { textAlign: 'right', fontSize: 7.5, color: '#555', lineHeight: 1.5 },
  headerTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#006B68', marginBottom: 2 },
  titleBlock: { alignItems: 'center', marginVertical: 12 },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#006B68', textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontSize: 9, color: '#C8A23A', marginTop: 3 },
  qualiopiBadge: { fontSize: 7, color: '#555', marginTop: 3, fontStyle: 'italic' },
  infoBox: { backgroundColor: '#EAF4F3', padding: 8, borderRadius: 3, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 3 },
  lbl: { fontSize: 8, color: '#555', width: 120 },
  val: { fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#006B68', marginTop: 12, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: '#C8A23A' },
  champBlock: { marginBottom: 8 },
  champLabel: { fontSize: 7.5, color: '#888', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 2 },
  champValue: { fontSize: 9, color: '#1a1a1a', backgroundColor: '#fafafa', padding: '5 7', borderRadius: 3, minHeight: 14, borderLeftWidth: 2, borderLeftColor: '#006B68' },
  inlineRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  inlineCol: { flex: 1 },
  incidentRow: { flexDirection: 'row', backgroundColor: '#fef6e4', padding: '4 6', borderRadius: 3, marginBottom: 3, alignItems: 'center' },
  absenceRow: { flexDirection: 'row', backgroundColor: '#fde8e8', padding: '4 6', borderRadius: 3, marginBottom: 3, alignItems: 'center' },
  incNom: { fontSize: 8, fontFamily: 'Helvetica-Bold', width: 110 },
  incInfo: { fontSize: 7.5, color: '#555', width: 80 },
  incMotif: { fontSize: 7.5, flex: 1, fontStyle: 'italic' },
  signatureBox: { marginTop: 14, padding: 10, backgroundColor: '#dcfce7', borderRadius: 4, borderWidth: 1.5, borderColor: '#16a34a' },
  signatureTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#15803d', marginBottom: 5 },
  signatureText: { fontSize: 8.5, color: '#15803d', marginBottom: 3 },
  certif: { fontSize: 8, color: '#15803d', fontStyle: 'italic', marginTop: 4 },
  footer: { position: 'absolute', bottom: 16, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 5, fontSize: 6.5, color: '#888', textAlign: 'center' },
  mention: { marginTop: 6, fontSize: 6.5, color: '#aaa', textAlign: 'center', fontStyle: 'italic' },
});

type Props = {
  fiche: FicheIntervention;
};

export default function PdfFicheIntervention({ fiche }: Props) {
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
          <Text style={S.title}>Fiche d'intervention pédagogique</Text>
          <Text style={S.subtitle}>{fiche.jour} {fiche.date}</Text>
          <Text style={S.qualiopiBadge}>Document Qualiopi — Indicateurs 11, 19, 22, 23</Text>
        </View>

        {/* Infos séance */}
        <View style={S.infoBox}>
          <View style={S.row}><Text style={S.lbl}>Formation :</Text><Text style={S.val}>{fiche.formationLabel}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Session :</Text><Text style={S.val}>{fiche.sessionNumero || '—'}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Date :</Text><Text style={S.val}>{fiche.jour} {fiche.date}</Text></View>
          <View style={S.row}><Text style={S.lbl}>Formateur :</Text><Text style={S.val}>{fiche.formateurNom}</Text></View>
        </View>

        {/* Section 1 — Identification pédagogique */}
        <Text style={S.sectionTitle}>1. Identification pédagogique</Text>
        <View style={S.inlineRow}>
          <View style={S.inlineCol}>
            <Text style={S.champLabel}>Activité Type</Text>
            <Text style={S.champValue}>{fiche.activiteType || '—'}</Text>
          </View>
          <View style={S.inlineCol}>
            <Text style={S.champLabel}>Compétence</Text>
            <Text style={S.champValue}>{fiche.competence || '—'}</Text>
          </View>
          <View style={S.inlineCol}>
            <Text style={S.champLabel}>Séance</Text>
            <Text style={S.champValue}>{fiche.seance || '—'}</Text>
          </View>
        </View>

        {/* Section 2 — Contenu pédagogique */}
        <Text style={S.sectionTitle}>2. Contenu pédagogique</Text>

        <View style={S.champBlock}>
          <Text style={S.champLabel}>Objectifs de la séance</Text>
          <Text style={S.champValue}>{fiche.objectifsSeance || '—'}</Text>
        </View>

        <View style={S.champBlock}>
          <Text style={S.champLabel}>Contenus vus durant la séance</Text>
          <Text style={S.champValue}>{fiche.contenusVus || '—'}</Text>
        </View>

        <View style={S.inlineRow}>
          <View style={S.inlineCol}>
            <Text style={S.champLabel}>Évaluation réalisée</Text>
            <Text style={S.champValue}>{fiche.evaluationRealisee || '—'}</Text>
          </View>
          <View style={{ flex: 2 }}>
            <Text style={S.champLabel}>Format de l'évaluation</Text>
            <Text style={S.champValue}>{fiche.formatEvaluation || '—'}</Text>
          </View>
        </View>

        <View style={S.champBlock}>
          <Text style={S.champLabel}>Outils utilisés</Text>
          <Text style={S.champValue}>{fiche.outils || '—'}</Text>
        </View>

        {fiche.ressourcesUrl && (
          <View style={S.champBlock}>
            <Text style={S.champLabel}>Ressources de synthèse (URL)</Text>
            <Text style={S.champValue}>{fiche.ressourcesUrl}</Text>
          </View>
        )}

        {fiche.lienDistanciel && (
          <View style={S.champBlock}>
            <Text style={S.champLabel}>Lien distanciel</Text>
            <Text style={S.champValue}>{fiche.lienDistanciel}</Text>
          </View>
        )}

        {fiche.difficultes && (
          <View style={S.champBlock}>
            <Text style={S.champLabel}>Difficultés rencontrées</Text>
            <Text style={S.champValue}>{fiche.difficultes}</Text>
          </View>
        )}

        {/* Section 3 — Incidents */}
        <Text style={S.sectionTitle}>3. Retards et absences</Text>

        <Text style={[S.champLabel, { marginTop: 4 }]}>Retards ({fiche.retards.length})</Text>
        {fiche.retards.length === 0 ? (
          <Text style={{ fontSize: 8, color: '#888', fontStyle: 'italic', marginBottom: 6 }}>Aucun retard</Text>
        ) : (
          fiche.retards.map((r, i) => (
            <View key={i} style={S.incidentRow}>
              <Text style={S.incNom}>{r.prenom} {r.nom}</Text>
              <Text style={S.incInfo}>Arrivée {r.heureArrivee || '—'}</Text>
              <Text style={S.incInfo}>Durée {r.duree || '—'}</Text>
              <Text style={S.incMotif}>{r.motif || 'Aucun motif'}</Text>
            </View>
          ))
        )}

        <Text style={[S.champLabel, { marginTop: 6 }]}>Absences ({fiche.absences.length})</Text>
        {fiche.absences.length === 0 ? (
          <Text style={{ fontSize: 8, color: '#888', fontStyle: 'italic', marginBottom: 6 }}>Aucune absence</Text>
        ) : (
          fiche.absences.map((a, i) => (
            <View key={i} style={S.absenceRow}>
              <Text style={S.incNom}>{a.prenom} {a.nom}</Text>
              <Text style={S.incMotif}>{a.motif || 'Aucun motif annoncé'}</Text>
              <Text style={{ fontSize: 7.5, color: '#555', fontStyle: 'italic' }}>
                {(a as any).justificatifNom ? `Justificatif : ${(a as any).justificatifNom}` : 'Pas de justificatif'}
              </Text>
            </View>
          ))
        )}

        {/* Section 4 — Signature */}
        <View style={S.signatureBox}>
          <Text style={S.signatureTitle}>✓ Signature électronique du formateur</Text>
          <Text style={S.signatureText}>Signataire : {fiche.formateurNom}</Text>
          {fiche.dateSignature && (
            <Text style={S.signatureText}>
              Signé le {new Date(fiche.dateSignature).toLocaleDateString('fr-FR')} à {fiche.heureSignature || ''}
            </Text>
          )}
          <Text style={S.certif}>
            Le formateur certifie sur l'honneur l'exactitude des informations renseignées dans cette fiche
            d'intervention pédagogique pour la journée du {fiche.date}.
          </Text>
        </View>

        <Text style={S.mention}>Document généré avec EasyCFA — solution éditée par PAM GROUPE</Text>
        <Text style={S.footer}>PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A</Text>
      </Page>
    </Document>
  );
}