'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfDMF from './PdfDMF';

type Props = {
  donnees: Record<string, string>;
  nomFichier: string;
};

export default function BoutonGenerationDMF({ donnees, nomFichier }: Props) {
  return (
    <PDFDownloadLink
      document={<PdfDMF donnees={donnees} />}
      fileName={nomFichier}
      style={{
        backgroundColor: '#7c3aed',
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
      {({ loading }) => loading ? '⏳ Génération...' : '📜 Générer DMF (Maintien)'}
    </PDFDownloadLink>
  );
}