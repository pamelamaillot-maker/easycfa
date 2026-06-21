'use client';

import React from 'react';
import { Document, Page, View, Text, Image as PdfImage, pdf } from '@react-pdf/renderer';

const LIBELLES_FORMATION: Record<string, string> = {
  'SC': 'Titre professionnel Secrétaire Comptable',
  'ARH': 'Titre professionnel Assistant(e) en Ressources Humaines',
  'AD': 'Titre professionnel Assistant(e) de Direction',
  'GCF': 'Titre professionnel Gestionnaire Comptable et Fiscal',
  'CATL': "Titre professionnel Chargé(e) d'Accueil Touristique et de Loisirs",
  'EC': 'Titre professionnel Employé(e) Commercial(e)',
  'CV': 'Titre professionnel Conseiller(ère) de Vente',
  'FPA': "Titre professionnel Formateur(trice) Professionnel(le) d'Adultes",
};

const VERT = '#006B68';
const OR = '#C8A23A';
const GRIS_BORD = '#cccccc';

const s = {
  page: { paddingTop: 28, paddingBottom: 40, paddingHorizontal: 38, fontSize: 9.5, color: '#1a1a1a', fontFamily: 'Helvetica' as const, lineHeight: 1.4 },
  titre: { fontSize: 14, fontFamily: 'Helvetica-Bold' as const, textAlign: 'center' as const, marginBottom: 4 },
  sousTitre: { fontSize: 9, textAlign: 'center' as const, color: '#555', marginBottom: 16, fontStyle: 'italic' as const },
  ligneChamp: { flexDirection: 'row' as const, marginBottom: 8, alignItems: 'flex-start' as const },
  labelChamp: { width: 175, fontFamily: 'Helvetica-Bold' as const },
  valeurChamp: { flex: 1, borderBottom: `1px solid ${GRIS_BORD}`, paddingBottom: 2, minHeight: 12 },
  question: { fontFamily: 'Helvetica-Bold' as const, marginTop: 12, marginBottom: 6 },
  ligneCase: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 4, marginLeft: 12 },
  caseVide: { width: 10, height: 10, border: `1.2px solid #333`, marginRight: 7 },
  caseCochee: { width: 10, height: 10, border: `1.2px solid ${VERT}`, backgroundColor: VERT, marginRight: 7, color: 'white', fontSize: 8, textAlign: 'center' as const, fontFamily: 'Helvetica-Bold' as const },
  reponse: { fontFamily: 'Helvetica-Bold' as const, color: VERT },
  precision: { marginLeft: 12, marginTop: 3, padding: 6, backgroundColor: '#f5f5f5', borderRadius: 3, fontStyle: 'italic' as const },
  consentement: { marginTop: 14, padding: 9, border: `1.5px solid ${VERT}`, backgroundColor: '#EAF4F3' },
  rgpd: { fontSize: 7.5, color: '#555', fontStyle: 'italic' as const, marginTop: 6, lineHeight: 1.35 },
};

// Case cochée (✓) ou vide selon l'état
function CaseEtat({ children, cochee }: { children: string; cochee: boolean }) {
  return (
    <View style={s.ligneCase}>
      {cochee ? <Text style={s.caseCochee}>X</Text> : <View style={s.caseVide} />}
      <Text style={cochee ? { fontFamily: 'Helvetica-Bold' } : {}}>{children}</Text>
    </View>
  );
}

function SyntheseDoc({ a }: { a: any }) {
  const champ = (v?: string) => (v && String(v).trim()) ? String(v) : '';
  const nomComplet = `${champ(a.prenom)} ${champ(a.nom)}`.trim();
  const formation = LIBELLES_FORMATION[a.formation] || champ(a.formation);
  const dates = [champ(a.dateDebutFormation), champ(a.dateFinFormation)].filter(Boolean).join('  au  ');
  const dateEdition = new Date().toLocaleDateString('fr-FR');

  const am = a.amenagementRqth || {};
  const aides: string[] = Array.isArray(am.aidesHumaines) ? am.aidesHumaines : [];
  const amenagements: string[] = Array.isArray(am.amenagementsFormation) ? am.amenagementsFormation : [];
  const coche = (liste: string[], v: string) => liste.includes(v);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfImage src="/logo-pamoi.png" style={{ width: 66, marginBottom: 10 }} />

        <Text style={s.titre}>FICHE DE SYNTHÈSE — SITUATION DE HANDICAP (RQTH)</Text>
        <Text style={s.sousTitre}>Synthèse des besoins particuliers recueillis — Document interne PAM OI Formation</Text>

        {/* En-tête */}
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Date d'édition</Text><Text style={s.valeurChamp}>{dateEdition}</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Intitulé de la formation</Text><Text style={s.valeurChamp}>{formation}</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Lieu de la formation</Text><Text style={s.valeurChamp}>PAM OI Formation — 1 Chemin Dubuisson, 97436 Saint-Leu</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Dates début et fin de formation</Text><Text style={s.valeurChamp}>{dates}</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Nom et Prénom</Text><Text style={s.valeurChamp}>{nomComplet}</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>RQTH</Text><Text style={s.valeurChamp}>{champ(a.rqth) === 'EN_COURS' ? 'En cours de démarche' : champ(a.rqth)}</Text></View>

        {/* Accompagnement humain */}
        <Text style={s.question}>Besoin d'un accompagnement humain ?</Text>
        <CaseEtat cochee={am.accompagnementHumain === 'Oui'}>Oui</CaseEtat>
        <CaseEtat cochee={am.accompagnementHumain === 'Non'}>Non</CaseEtat>

        {am.accompagnementHumain === 'Oui' && (
          <>
            <Text style={{ marginTop: 8, marginLeft: 12, fontFamily: 'Helvetica-Bold' }}>Aides nécessaires :</Text>
            <CaseEtat cochee={coche(aides, 'Interprète en langue des signes')}>Interprète en langue des signes</CaseEtat>
            <CaseEtat cochee={coche(aides, 'Interface de communication')}>Interface de communication</CaseEtat>
            <CaseEtat cochee={coche(aides, 'Auxiliaire de vie')}>Auxiliaire de vie</CaseEtat>
            <CaseEtat cochee={coche(aides, 'Tierce personne')}>Tierce personne</CaseEtat>
            {champ(am.accompagnementHumainDetail) !== '' && (
              <Text style={s.precision}>Précisions : {am.accompagnementHumainDetail}</Text>
            )}
          </>
        )}

        {/* Aménagement formation */}
        <Text style={s.question}>Besoin d'un aménagement de la formation ?</Text>
        <CaseEtat cochee={coche(amenagements, 'Fractionnement')}>Fractionnement</CaseEtat>
        <CaseEtat cochee={coche(amenagements, 'Pauses')}>Pauses</CaseEtat>
        <CaseEtat cochee={coche(amenagements, 'Horaires aménagés')}>Horaires aménagés</CaseEtat>
        <CaseEtat cochee={coche(amenagements, 'Autre')}>Autre</CaseEtat>
        {coche(amenagements, 'Autre') && champ(am.amenagementsFormationDetail) !== '' && (
          <Text style={s.precision}>Précisions : {am.amenagementsFormationDetail}</Text>
        )}

        {/* Adaptation supports */}
        <Text style={s.question}>Besoin d'adaptation des supports de cours ?</Text>
        <CaseEtat cochee={am.adaptationSupports === 'Oui'}>Oui</CaseEtat>
        <CaseEtat cochee={am.adaptationSupports === 'Non'}>Non</CaseEtat>
        {am.adaptationSupports === 'Oui' && champ(am.adaptationSupportsDetail) !== '' && (
          <Text style={s.precision}>Précisions : {am.adaptationSupportsDetail}</Text>
        )}

        {/* Consentement + RGPD — insécable */}
        <View style={s.consentement} wrap={false}>
          <Text>
            Je soussigné(e) {nomComplet || '……………………………………'} atteste que les besoins recensés ci-dessus correspondent à ma situation et autorise PAM OI Formation à les utiliser pour adapter mon parcours de formation.
          </Text>
          <Text style={s.rgpd}>
            Mention RGPD : les données recueillies sont traitées par PAM OI Formation aux seules fins d'adaptation pédagogique liée à la situation de handicap. Elles sont confidentielles, conservées pour la durée de la formation et accessibles uniquement au Référent Handicap. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression en contactant pedagogie@pamoi.re.
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
            <Text>Fait à : ............................</Text>
            <Text>Le : ....................</Text>
          </View>
          <Text style={{ marginTop: 12 }}>Signature :</Text>
          <View style={{ height: 50, border: `1px solid ${VERT}`, marginTop: 4 }} />
        </View>
      </Page>
    </Document>
  );
}

export default function BoutonFicheSyntheseRQTH({ apprenant, nomFichier, style }: { apprenant: any; nomFichier: string; style?: React.CSSProperties }) {
  const [enCours, setEnCours] = React.useState(false);

  async function generer() {
    try {
      setEnCours(true);
      const blob = await pdf(<SyntheseDoc a={apprenant} />).toBlob();
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = nomFichier;
      lien.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[FicheSyntheseRQTH] Erreur génération PDF :', e);
      alert('⚠️ Erreur lors de la génération de la fiche de synthèse. Voir la console (F12).');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button onClick={generer} disabled={enCours} style={style ?? { backgroundColor: OR, color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: enCours ? 'wait' : 'pointer' }}>
      {enCours ? '⏳ Génération…' : '📋 Fiche de synthèse remplie'}
    </button>
  );
}