'use client';

import { COLORS } from '../../../lib/constants';
import Card from '../../../components/Card';
import dynamic from 'next/dynamic';

const BoutonPdfEtatMensuel = dynamic(() => import('../../../components/BoutonPdfEtatMensuel'), { ssr: false });

const APPRENANTS_MENSUEL = [
  {
    apprenant: { nom: 'PAYET', prenom: 'Léa', email: 'lea.payet@email.fr' },
    entreprise: { nom: 'Entreprise A', email: 'contact@entreprise-a.fr', tuteur: 'M. Dupont' },
    formation: 'Secrétaire Comptable', session: 'SC-2025-06', mois: 'Mai 2026',
    heuresPrevues: 14, heuresRealisees: 14, heuresAbsence: 0,
    tauxPresence: 100, tauxAbsence: 0,
    seances: [
      { date: '06/05/2026', demiJournee: 'Matin', theme: 'Accueil administratif', statut: 'Présent', heures: 3.5, justificatif: false },
      { date: '06/05/2026', demiJournee: 'Après-midi', theme: 'Dossier apprenant', statut: 'Présent', heures: 3.5, justificatif: false },
      { date: '13/05/2026', demiJournee: 'Matin', theme: 'Excel professionnel', statut: 'Présent', heures: 3.5, justificatif: false },
      { date: '13/05/2026', demiJournee: 'Après-midi', theme: 'Tableau de suivi', statut: 'Présent', heures: 3.5, justificatif: false },
    ],
  },
  {
    apprenant: { nom: 'HOARAU', prenom: 'Emma', email: 'emma.hoarau@email.fr' },
    entreprise: { nom: 'Entreprise B', email: 'contact@entreprise-b.fr', tuteur: 'Mme Robert' },
    formation: 'Secrétaire Comptable', session: 'SC-2025-06', mois: 'Mai 2026',
    heuresPrevues: 14, heuresRealisees: 10.25, heuresAbsence: 3.75,
    tauxPresence: 73, tauxAbsence: 27,
    seances: [
      { date: '06/05/2026', demiJournee: 'Matin', theme: 'Accueil administratif', statut: 'Retard', heures: 2.75, heureArrivee: '09:15', justificatif: false },
      { date: '06/05/2026', demiJournee: 'Après-midi', theme: 'Dossier apprenant', statut: 'Présent', heures: 3.5, justificatif: false },
      { date: '13/05/2026', demiJournee: 'Matin', theme: 'Excel professionnel', statut: 'Présent', heures: 3.5, justificatif: false },
      { date: '13/05/2026', demiJournee: 'Après-midi', theme: 'Tableau de suivi', statut: 'Présent', heures: 3.5, justificatif: false },
    ],
  },
  {
    apprenant: { nom: 'TECHER', prenom: 'Lucas', email: 'lucas.techer@email.fr' },
    entreprise: { nom: 'Entreprise C', email: 'contact@entreprise-c.fr', tuteur: 'M. Fontaine' },
    formation: 'Secrétaire Comptable', session: 'SC-2025-06', mois: 'Mai 2026',
    heuresPrevues: 14, heuresRealisees: 10.5, heuresAbsence: 3.5,
    tauxPresence: 75, tauxAbsence: 25,
    seances: [
      { date: '06/05/2026', demiJournee: 'Matin', theme: 'Accueil administratif', statut: 'Absent', heures: 0, justificatif: false },
      { date: '06/05/2026', demiJournee: 'Après-midi', theme: 'Dossier apprenant', statut: 'Présent', heures: 3.5, justificatif: false },
      { date: '13/05/2026', demiJournee: 'Matin', theme: 'Excel professionnel', statut: 'Présent', heures: 3.5, justificatif: false },
      { date: '13/05/2026', demiJournee: 'Après-midi', theme: 'Tableau de suivi', statut: 'Présent', heures: 3.5, justificatif: false },
    ],
  },
  {
    apprenant: { nom: 'RIVIERE', prenom: 'Noah', email: 'noah.riviere@email.fr' },
    entreprise: { nom: 'Entreprise E', email: 'contact@entreprise-e.fr', tuteur: 'M. Morel' },
    formation: 'Secrétaire Comptable', session: 'SC-2025-06', mois: 'Mai 2026',
    heuresPrevues: 14, heuresRealisees: 14, heuresAbsence: 0,
    tauxPresence: 100, tauxAbsence: 0,
    seances: [
      { date: '06/05/2026', demiJournee: 'Matin', theme: 'Accueil administratif', statut: 'Présent', heures: 3.5, justificatif: false },
      { date: '06/05/2026', demiJournee: 'Après-midi', theme: 'Dossier apprenant', statut: 'Présent', heures: 3.5, justificatif: false },
      { date: '13/05/2026', demiJournee: 'Matin', theme: 'Excel professionnel', statut: 'Présent', heures: 3.5, justificatif: false },
      { date: '13/05/2026', demiJournee: 'Après-midi', theme: 'Tableau de suivi', statut: 'Présent', heures: 3.5, justificatif: false },
    ],
  },
];

export default function RecapMensuel() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <a href="/emargement" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>← Retour émargement</a>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px', marginTop: '8px' }}>
            États de présence mensuels
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
            Mai 2026 — Secrétaire Comptable — Session SC-2025-06
          </p>
        </div>
      </div>

      {/* Récapitulatif */}
      <Card style={{ marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              {['Apprenant', 'Entreprise', 'H. prévues', 'H. réalisées', 'H. absence', 'Taux présence', 'Alerte', 'PDF'].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {APPRENANTS_MENSUEL.map((a, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700' }}>{a.apprenant.prenom} {a.apprenant.nom}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{a.entreprise.nom}</td>
                <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center' }}>{a.heuresPrevues}h</td>
                <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: COLORS.primary, textAlign: 'center' }}>{a.heuresRealisees}h</td>
                <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: a.heuresAbsence > 0 ? '#e53e3e' : COLORS.textMuted, textAlign: 'center' }}>{a.heuresAbsence}h</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ backgroundColor: a.tauxPresence >= 90 ? '#e6f4f1' : a.tauxPresence >= 75 ? '#fef6e4' : '#fde8e8', color: a.tauxPresence >= 90 ? '#006B68' : a.tauxPresence >= 75 ? '#C8A23A' : '#e53e3e', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                    {a.tauxPresence}%
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {a.tauxAbsence > 10
                    ? <span style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>⚠ Taux élevé</span>
                    : <span style={{ color: '#aaa', fontSize: '12px' }}>OK</span>
                  }
                </td>
                <td style={{ padding: '12px' }}>
                  <BoutonPdfEtatMensuel
                    {...a}
                    nomFichier={`Etat_Presence_${a.apprenant.nom}_${a.mois.replace(/\s/g, '_')}.pdf`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ padding: '12px 16px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic' }}>
        💡 Les états de présence sont générés automatiquement à partir des feuilles d'émargement validées. Ils sont à envoyer aux entreprises avant le 5 du mois suivant.
      </div>
    </div>
  );
}