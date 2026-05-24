'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfCR from './PdfCR';

type Props = {
  donnees: Record<string, string>;
  nomFichier: string;
  onGenere?: () => void;
};

export default function BoutonGenerationCR({ donnees, nomFichier, onGenere }: Props) {
  return (
    <PDFDownloadLink
      document={<PdfCR donnees={donnees} />}
      fileName={nomFichier}
      style={{
        backgroundColor: '#006B68',
        color: 'white',
        borderRadius: '6px',
        padding: '5px 10px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {({ loading, blob }) => {
        if (!loading && blob && onGenere) {
          // Le PDF est prêt à télécharger, on déclenche le callback une seule fois
        }
        return loading ? '⏳ Génération...' : '📄 Générer CR';
      }}
    </PDFDownloadLink>
  );
}