'use client';

// components/PdfDossierControle.tsx
// Dossier de contrôle DEETS d'une session d'examen TP : toutes les preuves sur un seul PDF.

import { Document, Page, Text, View, Image, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

export type DonneesDossierControle = {
  formation: string;
  formationLabel: string;
  numeroTitre: string;
  typeSession: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  statut: string;
  numeroCERES: string;
  dateCreationCERES: string;
  responsables: { role: string; nom: string }[];
  responsablesSaisisCeres: boolean;
  controleFormateurs: { conforme: boolean; verifiable: boolean; formateurs: string[]; conflits: string[] };
  jury: { conforme: boolean; points: { niveau: string; texte: string }[]; jures: { nom: string; habilitation: string; nonLien: string }[] };
  candidats: { nom: string; entreprise: string; dossiers: string; decision: string }[];
  checklist: { phase: string; libelle: string; ok: boolean; detail: string }[];
  pv: { libelle: string; valeur: string }[];
  pieces: { libelle: string; nom: string }[];
  journal: { le: string; par: string; texte: string }[];
  genereLe: string;
  generePar: string;
};

const V = '#006B68';
const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#222' },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: V, paddingBottom: 8, marginBottom: 10 },
  titre: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: V },
  sousTitre: { fontSize: 10, color: '#555', marginTop: 2 },
  section: { marginBottom: 10 },
  h2: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: V, backgroundColor: '#EAF4F3', padding: 4, marginBottom: 4 },
  ligne: { flexDirection: 'row', paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  cle: { width: 150, color: '#666' },
  val: { flex: 1 },
  ok: { color: '#16a34a', fontFamily: 'Helvetica-Bold' },
  ko: { color: '#c53030', fontFamily: 'Helvetica-Bold' },
  orange: { color: '#b45309' },
  petit: { fontSize: 7.5, color: '#777' },
  pied: { position: 'absolute', bottom: 16, left: 32, right: 32, fontSize: 7, color: '#999', flexDirection: 'row', justifyContent: 'space-between' },
});

function Ligne({ k, v, etat }: { k: string; v: string; etat?: boolean }) {
  return (
    <View style={s.ligne}>
      <Text style={s.cle}>{k}</Text>
      <Text style={[s.val, etat === undefined ? {} : etat ? s.ok : s.ko]}>{v || '—'}</Text>
    </View>
  );
}

function DocDossier({ d }: { d: DonneesDossierControle }) {
  const phases = ['Avant la session', 'Jour de la session', 'Après la session'];
  return (
    <Document title={`Dossier de contrôle DEETS - ${d.formation} ${d.dateDebut}`} author="CFA PAM OI Formation">
      <Page size="A4" style={s.page}>
        <View style={s.entete} fixed>
          <View>
            <Text style={s.titre}>Dossier de contrôle — session d'examen</Text>
            <Text style={s.sousTitre}>{d.formationLabel} ({d.numeroTitre}) — {d.typeSession}</Text>
            <Text style={s.sousTitre}>Du {d.dateDebut} au {d.dateFin} — CERES n° {d.numeroCERES || '—'}</Text>
          </View>
          <Image src="/logo-pamoi-PNG.png" style={{ width: 70 }} />
        </View>

        <View style={s.section}>
          <Text style={s.h2}>1. Identification de la session</Text>
          <Ligne k="Organisme" v="CFA PAM OI Formation — SIRET 881 279 392 00024" />
          <Ligne k="Lieu" v={d.lieu} />
          <Ligne k="Session CERES" v={d.numeroCERES ? `n° ${d.numeroCERES} créée le ${d.dateCreationCERES}` : 'non renseignée'} etat={!!d.numeroCERES && !!d.dateCreationCERES} />
          <Ligne k="Statut" v={d.statut} />
        </View>

        <View style={s.section}>
          <Text style={s.h2}>2. Responsables de session</Text>
          {d.responsables.map((r, i) => <Ligne key={i} k={r.role} v={r.nom} etat={r.role.startsWith('Responsable de session') ? !!r.nom : undefined} />)}
          <Ligne k="Déclaration dans CERES" v={d.responsablesSaisisCeres ? 'Responsable et suppléant saisis dans CERES' : 'Non confirmée'} etat={d.responsablesSaisisCeres} />
          <Ligne k="Contrôle formateurs du groupe" etat={d.controleFormateurs.conforme}
            v={!d.controleFormateurs.verifiable ? 'Non vérifiable (candidats non reliés)' : d.controleFormateurs.conforme ? `Aucun conflit — formateurs vérifiés : ${d.controleFormateurs.formateurs.join(', ') || '—'}` : d.controleFormateurs.conflits.join(' / ')} />
        </View>

        <View style={s.section}>
          <Text style={s.h2}>3. Jury</Text>
          <Ligne k="Conformité" v={d.jury.conforme ? 'Jury conforme' : 'Non conforme'} etat={d.jury.conforme} />
          {d.jury.jures.map((j, i) => (
            <View key={i} style={s.ligne}>
              <Text style={s.cle}>{j.nom}</Text>
              <Text style={s.val}>{j.habilitation} — Non-lien : {j.nonLien}</Text>
            </View>
          ))}
          {d.jury.points.map((p, i) => <Text key={i} style={p.niveau === 'rouge' ? s.ko : s.orange}>• {p.texte}</Text>)}
        </View>

        <View style={s.section} wrap={false}>
          <Text style={s.h2}>4. Candidats ({d.candidats.length})</Text>
          {d.candidats.map((c, i) => (
            <View key={i} style={s.ligne}>
              <Text style={s.cle}>{c.nom}</Text>
              <Text style={s.val}>{c.entreprise || '—'} — {c.dossiers} — Décision : {c.decision || 'à délibérer'}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>5. Checklist réglementaire</Text>
          {phases.map(ph => (
            <View key={ph} style={{ marginBottom: 4 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 2 }}>{ph}</Text>
              {d.checklist.filter(p => p.phase === ph).map((p, i) => (
                <View key={i} style={s.ligne} wrap={false}>
                  <Text style={[{ width: 14 }, p.ok ? s.ok : s.ko]}>{p.ok ? 'OK' : '—'}</Text>
                  <Text style={s.val}>{p.libelle}{p.detail ? `  (${p.detail})` : ''}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={s.section} wrap={false}>
          <Text style={s.h2}>6. Procès-verbal et résultats</Text>
          {d.pv.map((p, i) => <Ligne key={i} k={p.libelle} v={p.valeur} etat={!!p.valeur} />)}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>7. Pièces archivées dans EasyCFA</Text>
          {d.pieces.length === 0 ? <Text style={s.petit}>Aucune pièce archivée.</Text> :
            d.pieces.map((p, i) => <Ligne key={i} k={p.libelle} v={p.nom} />)}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>8. Journal des modifications ({d.journal.length})</Text>
          {d.journal.length === 0 ? <Text style={s.petit}>Aucune modification journalisée (journal actif depuis le 25/11/2026).</Text> :
            d.journal.map((j, i) => (
              <View key={i} style={s.ligne} wrap={false}>
                <Text style={{ width: 95, color: '#666' }}>{j.le}</Text>
                <Text style={{ width: 130, color: '#666' }}>{j.par}</Text>
                <Text style={s.val}>{j.texte}</Text>
              </View>
            ))}
        </View>

        <View style={s.pied} fixed>
          <Text>Généré le {d.genereLe} par {d.generePar} — EasyCFA</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export default function BoutonDossierControle({ donnees, style }: { donnees: DonneesDossierControle; style?: any }) {
  const nom = `Dossier controle DEETS - ${donnees.formation} - ${donnees.dateDebut.replace(/\//g, '.')}.pdf`;
  return (
    <PDFDownloadLink document={<DocDossier d={donnees} />} fileName={nom} style={{ textDecoration: 'none', ...style }}>
      {({ loading }) => (loading ? '⏳ Préparation du dossier…' : '📁 Dossier de contrôle DEETS')}
    </PDFDownloadLink>
  );
}
