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
const GRIS_BORD = '#cccccc';

const s = {
  page: { paddingTop: 28, paddingBottom: 40, paddingHorizontal: 38, fontSize: 9.5, color: '#1a1a1a', fontFamily: 'Helvetica' as const, lineHeight: 1.4 },
  titre: { fontSize: 14, fontFamily: 'Helvetica-Bold' as const, textAlign: 'center' as const, marginBottom: 4 },
  sousTitre: { fontSize: 9.5, textAlign: 'center' as const, color: '#555', marginBottom: 16, fontStyle: 'italic' as const },
  ligneChamp: { flexDirection: 'row' as const, marginBottom: 9, alignItems: 'flex-start' as const },
  labelChamp: { width: 175, fontFamily: 'Helvetica-Bold' as const },
  valeurChamp: { flex: 1, borderBottom: `1px solid ${GRIS_BORD}`, paddingBottom: 2, minHeight: 12 },
  question: { fontFamily: 'Helvetica-Bold' as const, marginTop: 12, marginBottom: 6 },
  ligneCase: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 4, marginLeft: 12 },
  caseCarre: { width: 10, height: 10, border: `1.2px solid #333`, marginRight: 7 },
  zoneTexte: { border: `1px solid ${GRIS_BORD}`, minHeight: 50, marginTop: 4, marginLeft: 12 },
  consentement: { marginTop: 18, padding: 10, border: `1.5px solid ${VERT}`, backgroundColor: '#EAF4F3' },
  rgpd: { fontSize: 7.5, color: '#555', fontStyle: 'italic' as const, marginTop: 6, lineHeight: 1.35 },
};

function Case({ children }: { children: string }) {
  return (
    <View style={s.ligneCase}>
      <View style={s.caseCarre} />
      <Text>{children}</Text>
    </View>
  );
}

function PSHDoc({ a }: { a: any }) {
  const champ = (v?: string) => (v && String(v).trim()) ? String(v) : '';
  const nomComplet = `${champ(a.prenom)} ${champ(a.nom)}`.trim();
  const formation = LIBELLES_FORMATION[a.formation] || champ(a.formation);
  const dates = [champ(a.dateDebutFormation), champ(a.dateFinFormation)].filter(Boolean).join('  →  ');
  const dateEnvoi = new Date().toLocaleDateString('fr-FR');

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfImage src="/logo-pamoi.png" style={{ width: 66, marginBottom: 10 }} />

        <Text style={s.titre}>QUESTIONNAIRE D'ACCUEIL D'UNE PERSONNE EN SITUATION DE HANDICAP</Text>
        <Text style={s.sousTitre}>Ce questionnaire vous est transmis pour évaluer vos besoins particuliers.</Text>

        {/* En-tête pré-rempli */}
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Date d'envoi du questionnaire</Text><Text style={s.valeurChamp}>{dateEnvoi}</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Intitulé de la formation</Text><Text style={s.valeurChamp}>{formation}</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Lieu de la formation</Text><Text style={s.valeurChamp}>PAM OI Formation — 1 Chemin Dubuisson, 97436 Saint-Leu</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Dates début et fin de formation</Text><Text style={s.valeurChamp}>{dates}</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Nom et Prénom</Text><Text style={s.valeurChamp}>{nomComplet}</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Email</Text><Text style={s.valeurChamp}>{champ(a.email)}</Text></View>
        <View style={s.ligneChamp}><Text style={s.labelChamp}>Numéro de téléphone</Text><Text style={s.valeurChamp}>{champ(a.telephone)}</Text></View>

        {/* Corps vierge */}
        <Text style={s.question}>Avez-vous besoin d'un accompagnement humain ?</Text>
        <Case>Oui</Case>
        <Case>Non</Case>

        <Text style={s.question}>Si oui, quelle aide vous est nécessaire ?</Text>
        <Case>Interprète en langue des signes</Case>
        <Case>Interface de communication</Case>
        <Case>Auxiliaire de vie</Case>
        <Case>Tierce personne</Case>

        <Text style={s.question}>Avez-vous besoin d'un aménagement de la formation ?</Text>
        <Case>Fractionnement</Case>
        <Case>Pauses</Case>
        <Case>Horaires aménagés</Case>
        <Case>Autre</Case>

        <Text style={s.question}>Avez-vous besoin d'adaptation des supports de cours ?</Text>
        <Case>Oui</Case>
        <Case>Non</Case>
        <Text style={{ marginTop: 6, marginLeft: 12 }}>Si oui, lesquels ?</Text>
        <View style={s.zoneTexte} />

        {/* Consentement + RGPD */}
        <View style={s.consentement}>
          <Text>
            Je soussigné(e) {nomComplet || '……………………………………'} atteste avoir pris connaissance de ce questionnaire et autorise PAM OI Formation à utiliser ces informations pour adapter mon parcours de formation.
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

export default function BoutonQuestionnairePSH({ apprenant, nomFichier, style }: { apprenant: any; nomFichier: string; style?: React.CSSProperties }) {
  const [enCours, setEnCours] = React.useState(false);

  async function generer() {
    try {
      setEnCours(true);
      const blob = await pdf(<PSHDoc a={apprenant} />).toBlob();
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = nomFichier;
      lien.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[QuestionnairePSH] Erreur génération PDF :', e);
      alert('⚠️ Erreur lors de la génération du questionnaire. Voir la console (F12).');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button onClick={generer} disabled={enCours} style={style ?? { backgroundColor: VERT, color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: enCours ? 'wait' : 'pointer' }}>
      {enCours ? '⏳ Génération…' : '📄 Générer le questionnaire PSH'}
    </button>
  );
}