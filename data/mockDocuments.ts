export type Document = {
  id: number;
  famille: 'Apprenti' | 'Entreprise' | 'Formateur' | 'EasyCFA';
  type: string;
  concerne: string;
  apprenant: string;
  entreprise: string;
  formateur: string;
  session: string;
  formation: string;
  periode: string;
  origine: 'Importé' | 'Généré par EasyCFA';
  statut: 'À importer' | 'Disponible' | 'À contrôler' | 'À faire signer' | 'Envoyé' | 'Signé' | 'Expiré' | 'Archivé';
  dateAjout: string;
  dateSignature: string;
  dateValidite: string;
  version: string;
  sensibilite: 'Normal' | 'Sensible' | 'Très sensible';
  acceRestreint: boolean;
};

export const DOCUMENTS: Document[] = [];

export const DOCUMENTS_STATS = [
  { label: 'Total documents', value: '0', color: '#006B68' },
  { label: 'Disponibles', value: '0', color: '#006B68' },
  { label: 'À importer', value: '0', color: '#C8A23A' },
  { label: 'À faire signer', value: '0', color: '#C8A23A' },
  { label: 'Expirés', value: '0', color: '#e53e3e' },
  { label: 'Accès restreint', value: '0', color: '#e53e3e' },
];