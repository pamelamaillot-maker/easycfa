'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfAEF from './PdfAEF';

type Props = {
  donnees: Record<string, string>;
  nomFichier: string;
};

export default function BoutonPdfAEF({ donnees, nomFichier }: Props) {
  return (
    <PDFDownloadLink
      document={<PdfAEF donnees={donnees} />}
      fileName={nomFichier}
      style={{
        backgroundColor: '#006B68',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '9px 16px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {({ loading }) => loading ? '⏳ Génération...' : '📄 Générer AEF'}
    </PDFDownloadLink>
  );
}