'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfEtatPresenceMensuel from './PdfEtatPresenceMensuel';

type Seance = {
  date: string; demiJournee: string; theme: string;
  statut: string; heures: number; heureArrivee?: string; justificatif: boolean;
};

type Props = {
  apprenant: { nom: string; prenom: string; email: string };
  entreprise: { nom: string; email: string; tuteur: string };
  formation: string; session: string; mois: string;
  heuresPrevues: number; heuresRealisees: number; heuresAbsence: number;
  tauxPresence: number; tauxAbsence: number;
  seances: Seance[];
  nomFichier: string;
};

export default function BoutonPdfEtatMensuel(props: Props) {
  const { nomFichier, ...rest } = props;
  return (
    <PDFDownloadLink
      document={<PdfEtatPresenceMensuel {...rest} />}
      fileName={nomFichier}
      style={{ backgroundColor: '#C8A23A', color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
    >
      {({ loading }) => loading ? '⏳ Génération...' : '⬇ État mensuel PDF'}
    </PDFDownloadLink>
  );
}