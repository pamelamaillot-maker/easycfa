'use client';

import React from 'react';
import { Document, Page, View, Text, Image as PdfImage, pdf } from '@react-pdf/renderer';

// Planning d'une session en PDF (onglet Planning de la page Sessions).

type LignePlanning = {
  date: string;
  type: 'cours' | 'revision' | 'examen';
  semaine: number;
  formateurNom?: string;
  module?: string;
};

type SessionPlanning = {
  numero: string;
  formation: string;
  dateDebut: string;
  dateFin: string;
  salle?: string;
  apprenantIds?: string[];
  planning: LignePlanning[];
};

const VERT = '#006B68';
const DORE = '#C8A23A';
const GRIS_BORD = '#cccccc';

const TYPE_LIBELLE: Record<string, string> = { cours: 'Cours', revision: 'Révisions', examen: 'Examen' };
const TYPE_COULEUR: Record<string, string> = { cours: '#ffffff', revision: '#ede9fe', examen: '#e0f2fe' };
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HEURES_PAR_JOUR = 7;

function jourSemaine(dateFR: string): string {
  const p = (dateFR || '').split('/');
  if (p.length !== 3) return '';
  const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  return isNaN(d.getTime()) ? '' : JOURS[d.getDay()];
}

function valeurDate(dateFR: string): number {
  const p = (dateFR || '').split('/');
  if (p.length !== 3) return 0;
  return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime() || 0;
}

const s = {
  page: { paddingTop: 26, paddingBottom: 40, paddingHorizontal: 30, fontSize: 8.5, color: '#1a1a1a', fontFamily: 'Helvetica' as const },
  titre: { fontSize: 14, fontFamily: 'Helvetica-Bold' as const, color: VERT, marginBottom: 2 },
  sousTitre: { fontSize: 10, fontFamily: 'Helvetica-Bold' as const, marginBottom: 10 },
  infos: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, backgroundColor: '#EAF4F3', padding: 8, marginBottom: 10, gap: 14 },
  ligne: { flexDirection: 'row' as const, borderBottom: `1px solid ${GRIS_BORD}`, minHeight: 16, alignItems: 'center' as const },
  entete: { flexDirection: 'row' as const, backgroundColor: VERT, color: 'white', fontFamily: 'Helvetica-Bold' as const, minHeight: 18, alignItems: 'center' as const },
  cDate: { width: 62, paddingHorizontal: 4 },
  cJour: { width: 58, paddingHorizontal: 4 },
  cType: { width: 58, paddingHorizontal: 4 },
  cForm: { width: 112, paddingHorizontal: 4 },
  cMod: { flex: 1, paddingHorizontal: 4 },
  cSem: { width: 34, paddingHorizontal: 4, textAlign: 'center' as const },
  cH: { width: 40, paddingHorizontal: 4, textAlign: 'right' as const },
  pied: { position: 'absolute' as const, bottom: 16, left: 30, right: 30, flexDirection: 'row' as const, justifyContent: 'space-between' as const, fontSize: 7, color: '#999', borderTop: `1px solid ${DORE}`, paddingTop: 4 },
};

function PlanningDoc({ session, libelleFormation }: { session: SessionPlanning; libelleFormation: string }) {
  const lignes = [...(session.planning || [])].sort((a, b) => valeurDate(a.date) - valeurDate(b.date));
  const nb = (t: string) => lignes.filter(l => l.type === t).length;
  const edite = new Date().toLocaleDateString('fr-FR');

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View fixed style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: `1.5px solid ${VERT}`, paddingBottom: 6 }}>
          <PdfImage src="/logo-pamoi.png" style={{ width: 60 }} />
          <Text style={{ fontSize: 8, color: '#666' }}>PAM OI Formation — 1 Chemin Dubuisson 97436 Saint-Leu</Text>
        </View>

        <Text style={s.titre}>Planning de formation — Session {session.numero}</Text>
        <Text style={s.sousTitre}>TP {libelleFormation} ({session.formation})</Text>

        <View style={s.infos}>
          <Text>Du <Text style={{ fontFamily: 'Helvetica-Bold' }}>{session.dateDebut || '—'}</Text> au <Text style={{ fontFamily: 'Helvetica-Bold' }}>{session.dateFin || '—'}</Text></Text>
          {session.salle ? <Text>Salle : {session.salle}</Text> : null}
          <Text>{nb('cours')} j. de cours · {nb('revision')} j. de révisions · {nb('examen')} j. d'examen</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>Total : {lignes.length * HEURES_PAR_JOUR} h</Text>
        </View>

        <View style={s.entete} fixed>
          <Text style={s.cDate}>Date</Text>
          <Text style={s.cJour}>Jour</Text>
          <Text style={s.cType}>Type</Text>
          <Text style={s.cForm}>Formateur</Text>
          <Text style={s.cMod}>Module / Thème</Text>
          <Text style={s.cSem}>Sem.</Text>
          <Text style={s.cH}>Heures</Text>
        </View>
        {lignes.map((l, i) => (
          <View key={i} style={{ ...s.ligne, backgroundColor: TYPE_COULEUR[l.type] || '#ffffff' }} wrap={false}>
            <Text style={{ ...s.cDate, fontFamily: 'Helvetica-Bold' }}>{l.date}</Text>
            <Text style={s.cJour}>{jourSemaine(l.date)}</Text>
            <Text style={s.cType}>{TYPE_LIBELLE[l.type] || l.type}</Text>
            <Text style={s.cForm}>{l.formateurNom || ''}</Text>
            <Text style={s.cMod}>{l.module || ''}</Text>
            <Text style={s.cSem}>{l.semaine || ''}</Text>
            <Text style={s.cH}>{HEURES_PAR_JOUR} h</Text>
          </View>
        ))}

        <View fixed style={s.pied}>
          <Text>Planning susceptible d'évoluer — édité le {edite}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export default function BoutonPlanningSession({ session, libelleFormation, style }: { session: SessionPlanning; libelleFormation: string; style?: React.CSSProperties }) {
  const [enCours, setEnCours] = React.useState(false);

  async function telecharger() {
    if (!session.planning || session.planning.length === 0) {
      alert('Aucune date dans le planning de cette session.');
      return;
    }
    try {
      setEnCours(true);
      const blob = await pdf(<PlanningDoc session={session} libelleFormation={libelleFormation} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Planning_${session.formation}_${String(session.numero || '').replace(/[^\w-]/g, '_')}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('[PlanningSession] Erreur génération PDF :', e);
      alert('⚠️ Erreur lors de la génération du planning. Voir la console (F12).');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button onClick={telecharger} disabled={enCours} style={style}>
      {enCours ? '⏳ Génération…' : '📄 Télécharger le planning'}
    </button>
  );
}
