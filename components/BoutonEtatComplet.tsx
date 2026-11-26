'use client';

// components/BoutonEtatComplet.tsx
// État de présence sur toute la formation (du premier au dernier jour émargé).
// Le PDF n'est calculé qu'au clic, pour ne pas alourdir la page.

import { useState } from 'react';
import type { Emargement } from '../data/emargementsSupabase';
import { calculerEtatComplet } from '../lib/etatPresenceCalcul';

type Props = {
  feuilles: Emargement[];
  apprenantId: string;
  entreprise: { nom: string; email: string; tuteur: string };
  session: string;
};

export default function BoutonEtatComplet({ feuilles, apprenantId, entreprise, session }: Props) {
  const [enCours, setEnCours] = useState(false);

  async function telecharger() {
    const etat = calculerEtatComplet(feuilles, apprenantId);
    if (!etat) { alert('Aucun émargement trouvé pour cet apprenant.'); return; }
    setEnCours(true);
    try {
      const [{ pdf }, { createElement }, { default: PdfEtatPresenceMensuel }] = await Promise.all([
        import('@react-pdf/renderer'), import('react'), import('./PdfEtatPresenceMensuel'),
      ]);
      const blob = await pdf(createElement(PdfEtatPresenceMensuel, {
        apprenant: { nom: etat.nom, prenom: etat.prenom, email: etat.emailApprenant },
        entreprise,
        formation: etat.formation,
        session: session || etat.session,
        mois: etat.mois,
        titre: 'État de présence — formation complète',
        heuresPrevues: etat.heuresPrevues,
        heuresRealisees: etat.heuresRealisees,
        heuresAbsence: etat.heuresAbsence,
        tauxPresence: etat.tauxPresence,
        tauxAbsence: etat.tauxAbsence,
        seances: etat.seances,
      }) as any).toBlob();
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `Etat_Presence_COMPLET_${etat.nom}_${etat.prenom}.pdf`.replace(/\s+/g, '_');
      lien.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button onClick={telecharger} disabled={enCours} title="Du premier au dernier jour de formation émargé"
      style={{ backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: enCours ? 'wait' : 'pointer', marginTop: 6, display: 'block' }}>
      {enCours ? '⏳ Génération…' : '⬇ État complet'}
    </button>
  );
}
