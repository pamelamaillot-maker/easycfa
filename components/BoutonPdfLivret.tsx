'use client';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfLivret from './PdfLivret';
type Props = { donnees: Record<string, string>; nomFichier: string; formationLibelle: string };
export default function BoutonPdfLivret({ donnees, nomFichier, formationLibelle }: Props) {
  return (
    <PDFDownloadLink document={<PdfLivret donnees={donnees} formationLibelle={formationLibelle} />} fileName={nomFichier}
      style={{ backgroundColor: '#006B68', color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
      {({ loading }) => loading ? '⏳ Génération...' : '⬇ Télécharger PDF'}
    </PDFDownloadLink>
  );
}