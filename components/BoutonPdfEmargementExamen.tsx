'use client';

// components/BoutonPdfEmargementExamen.tsx
// Prépare les données puis propose le téléchargement du PDF d'émargement.
// Les identifiants d'anonymat sont générés dans l'ordre des candidats inscrits.

import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfEmargementExamen, { type DonneesEmargementExamen } from './PdfEmargementExamen';
import { epreuvesAEmarger, identifiantCandidat, dureeTotale } from '../lib/emargementsExamen';
import { referentielParSigle } from '../lib/referentielsTP';

type Props = {
  session: any;
  situationsTitre?: { id: string; label: string; duree: string; applicable: boolean }[];
};

export default function BoutonPdfEmargementExamen({ session, situationsTitre }: Props) {
  const sigle = session?.formation ?? '';
  const ref = referentielParSigle(sigle);

  const epreuves = epreuvesAEmarger(
    sigle,
    session?.typeSession,
    (session?.ccpVises ?? [])[0],
    session?.avecEntretienFinal,
    situationsTitre,
  );

  const candidats = (session?.candidats ?? []).map((c: any, i: number) => ({
    identifiant: identifiantCandidat(sigle, i + 1),
    nom: c.nom ?? '',
    prenom: c.prenom ?? '',
  }));

  const donnees: DonneesEmargementExamen = {
    formationSigle: sigle,
    formationLabel: ref?.intitule ?? sigle,
    codeTitre: ref?.codeTitre ?? '',
    typeSession: session?.typeSession ?? 'titre',
    ccpVise: (session?.ccpVises ?? [])[0],
    numeroCeres: session?.numeroCERES ?? '',
    dateDebut: session?.dateDebut ?? '',
    dateFin: session?.dateFin ?? '',
    lieu: session?.lieu ?? '',
    responsableSession: `${session?.responsablePrenom ?? ''} ${session?.responsableNom ?? ''}`.trim(),
    candidats,
    jures: (session?.jures ?? []).map((j: any) => ({ nom: j.nom ?? '', prenom: j.prenom ?? '' })),
    epreuves,
    dureeTotale: dureeTotale(epreuves),
  };

  const nomFichier = `Emargement_${sigle}_${(session?.numeroCERES || 'session')}_${(session?.dateDebut ?? '').replace(/\//g, '-')}.pdf`;

  if (epreuves.length === 0) {
    return (
      <span style={{ fontSize: '11px', color: '#C8A23A', fontWeight: '600' }}>
        ⚠️ Durées d&apos;épreuve non renseignées pour ce TP — feuilles non générables.
      </span>
    );
  }

  if (candidats.length === 0) {
    return (
      <span style={{ fontSize: '11px', color: '#C8A23A', fontWeight: '600' }}>
        ⚠️ Aucun candidat inscrit — ajoutez les candidats avant de générer les feuilles.
      </span>
    );
  }

  return (
    <PDFDownloadLink
      document={<PdfEmargementExamen donnees={donnees} />}
      fileName={nomFichier}
      style={{
        backgroundColor: '#006B68',
        color: 'white',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {({ loading }) => loading
        ? '⏳ Génération...'
        : `⬇ Feuilles d'émargement (${epreuves.length + 2} pages)`}
    </PDFDownloadLink>
  );
}
