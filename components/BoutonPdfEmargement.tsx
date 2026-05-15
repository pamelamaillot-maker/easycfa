'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfEmargement from './PdfEmargement';
import type { FeuilleEmargement, DemiJournee } from '../data/mockEmargement';

type Props = {
  feuille: FeuilleEmargement;
  demiJournee: DemiJournee;
  nomFichier: string;
};

export default function BoutonPdfEmargement({ feuille, demiJournee, nomFichier }: Props) {
  return (
    <PDFDownloadLink
      document={<PdfEmargement feuille={feuille} demiJournee={demiJournee} />}
      fileName={nomFichier}
      style={{
        backgroundColor: '#006B68',
        color: 'white',
        borderRadius: '8px',
        padding: '9px 16px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {({ loading }) => loading ? '⏳ Génération...' : '⬇ Télécharger PDF émargement'}
    </PDFDownloadLink>
  );
}