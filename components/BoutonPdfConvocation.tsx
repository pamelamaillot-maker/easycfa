'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfConvocation from './PdfConvocation';

type Epreuve = { libelle: string; duree: string };
type Jure = { nom: string; prenom: string; qualite: string };

type Props = {
  candidat: { nom: string; prenom: string; dateNaissance: string; email: string };
  formation: string;
  formationId: string;
  typeCandidature: string;
  ccpsPassés: string[];
  dateExamen: string;
  heureConvocation: string;
  lieu: string;
  numeroSession: string;
  jury: Jure[];
  epreuves: Epreuve[];
  documentsAApporter: string[];
  nomFichier: string;
};

export default function BoutonPdfConvocation(props: Props) {
  const { nomFichier, ...rest } = props;
  return (
    <PDFDownloadLink
      document={<PdfConvocation {...rest} />}
      fileName={nomFichier}
      style={{ backgroundColor: '#006B68', color: 'white', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
    >
      {({ loading }) => loading ? '⏳...' : '📄 Convocation PDF'}
    </PDFDownloadLink>
  );
}