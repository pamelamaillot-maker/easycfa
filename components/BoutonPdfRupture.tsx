'use client';

import React from 'react';

type Props = {
  apprenant: any;
  motif: string;
  dateRupture: string;
  maintienFormation: string;
  emailTuteur?: string;
  expediteur?: string;
  signature?: string;
  nomFichier: string;
};

export default function BoutonPdfRupture({ apprenant, emailTuteur, nomFichier }: Props) {
  const nomApprenant = apprenant.prenom + ' ' + apprenant.nom;
  const dest = emailTuteur ?? 'pedagogie@pamoi.re';
  const sujet = encodeURIComponent("Formulaire de résiliation du contrat d'apprentissage — " + nomApprenant);
  const corps = encodeURIComponent(
    "Madame, Monsieur,\n\n" +
    "Veuillez trouver ci-joint le formulaire de résiliation du contrat d'apprentissage de " + nomApprenant + ".\n\n" +
    "Nous vous remercions de bien vouloir le compléter, le signer et nous le retourner dans les meilleurs délais à l'adresse : pedagogie@pamoi.re\n\n" +
    "Cordialement,\nPAM OI Formation\n06 93 55 64 97"
  );
  const mailHref = "https://mail.google.com/mail/?view=cm&to=" + dest + "&su=" + sujet + "&body=" + corps;

  function telecharger() {
    const a = document.createElement('a');
    a.href = '/modeles/Formulaire_Rupture.pdf';
    a.download = nomFichier;
    a.click();
  }

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
    React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
      React.createElement('button', {
        onClick: telecharger,
        style: { backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }
      }, '📄 Télécharger formulaire rupture'),
      React.createElement('a', {
        href: mailHref,
        target: '_blank',
        rel: 'noopener noreferrer',
        style: { backgroundColor: '#3a5bc7', color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }
      }, '✉️ Envoyer par email')
    ),
    React.createElement('div', {
      style: { fontSize: '11px', color: '#888', fontStyle: 'italic' }
    }, "💡 Téléchargez le formulaire puis joignez-le manuellement à l'email Gmail")
  );
}