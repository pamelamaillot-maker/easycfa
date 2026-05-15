'use client';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfCR from './PdfCR';
type Props = { donnees: Record<string, string>; nomFichier: string };
export default function BoutonPdfCR({ donnees, nomFichier }: Props) {
  return (
    <PDFDownloadLink document={<PdfCR donnees={donnees} />} fileName={nomFichier}
      style={{ backgroundColor: '#006B68', color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
      {({ loading }) => loading ? '⏳ Génération...' : '⬇ Télécharger PDF'}
    </PDFDownloadLink>
  );
}