'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfDroitImage from './PdfDroitImage';

type Props = {
  donnees: Record<string, string>;
  nomFichier: string;
};

export default function BoutonPdfDroitImage({ donnees, nomFichier }: Props) {
  return (
    <PDFDownloadLink
      document={<PdfDroitImage donnees={donnees} />}
      fileName={nomFichier}
      style={{
        backgroundColor: '#3a5bc7',
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
      {({ loading }) => loading ? '⏳ Génération...' : '📸 Droit à l\'image'}
    </PDFDownloadLink>
  );
}