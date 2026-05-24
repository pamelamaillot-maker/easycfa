'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfRupture from './PdfRupture';
import { assemblerDonneesRupture } from '../lib/donneesRupture';

type Props = {
  apprenant: any;
  motif: string;
  dateRupture: string;
  maintienFormation: string;
  emailTuteur?: string;
  expediteur?: string;
  signature?: string;
  nomFichier: string;
  entreprise?: any;
};

export default function BoutonPdfRupture({ apprenant, motif, emailTuteur, nomFichier, entreprise }: Props) {
  const nomApprenant = `${apprenant.prenom || ''} ${apprenant.nom || ''}`.trim();
  const dest = emailTuteur ?? 'pedagogie@pamoi.re';
  const sujet = encodeURIComponent("Formulaire de résiliation du contrat d'apprentissage — " + nomApprenant);
  const corps = encodeURIComponent(
    "Madame, Monsieur,\n\n" +
    "Veuillez trouver ci-joint le formulaire de résiliation du contrat d'apprentissage de " + nomApprenant + ".\n\n" +
    "Nous vous remercions de bien vouloir le compléter, le signer et nous le retourner dans les meilleurs délais à l'adresse : pedagogie@pamoi.re\n\n" +
    "Cordialement,\nPAM OI Formation\n0693 55 64 92"
  );
  const mailHref = "https://mail.google.com/mail/?view=cm&to=" + dest + "&su=" + sujet + "&body=" + corps;

  const donnees = assemblerDonneesRupture(apprenant, motif, entreprise);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <PDFDownloadLink
          document={<PdfRupture donnees={donnees} />}
          fileName={nomFichier}
          style={{
            backgroundColor: '#e53e3e',
            color: 'white',
            borderRadius: 8,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          {({ loading }) => loading ? '⏳ Génération...' : '📄 Télécharger formulaire rupture'}
        </PDFDownloadLink>

        
          <a href={mailHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: '#3a5bc7', color: 'white', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
        >
          ✉️ Envoyer par email
        </a>
      </div>
      <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>
        💡 Téléchargez le PDF rempli avec les vraies données puis joignez-le à l'email Gmail.
      </div>
    </div>
  );
}