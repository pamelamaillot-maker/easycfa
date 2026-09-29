'use client';

// components/BlocConvention.tsx
// Heures, taux horaire et TVA d'une convention HORS APPRENTISSAGE
// (Transition Pro, CPF, Région, France Travail…).
//
// POURQUOI UN BLOC À PART
// Un dossier d'apprentissage se facture au NPEC, par échéances calculées sur
// la durée du contrat. Une convention hors apprentissage se facture au RÉEL :
// chaque mois, le CFA déclare les heures effectivement suivies et facture
// heures × taux horaire. Les deux logiques n'ont pas les mêmes données.
//
// Ce bloc n'apparaît donc que lorsque le financeur n'est pas un OPCO.
//
// SOURCE DES VALEURS
// Elles figurent sur la décision de prise en charge du financeur. Pour
// Transition Pro Réunion : « Durée de la formation prise en charge »,
// « Heures de formation théorique », « Heures de stage pratique »,
// « Montant pris en charge », « soit un taux horaire de ».
//
// ⚠️ SEULES LES HEURES THÉORIQUES SE FACTURENT
// Les heures de stage pratique sont déclarées sur l'attestation mensuelle
// (colonne 2 du tableau), mais elles ne sont pas payées au CFA.
// C'est bien H1 = heures théoriques qui multiplie le taux horaire.
//
// ⚠️ HT ET TVA
// Le formulaire Transition Pro parle de « taux horaire TTC » et de « montant
// demandé TTC ». Dans les faits, le montant de la décision est HT et la TVA
// s'ajoute : la formation professionnelle continue est taxée à 8,5 % à
// La Réunion. Confirmé par la pratique — une facture d'août 2026 de 155,47 € HT
// a été réglée 168,68 € TTC deux jours après son dépôt.
// L'apprentissage, lui, est exonéré : le champ TVA y reste vide.
//
// LE CONTRÔLE D'ÉCART
// Les financeurs arrondissent le taux horaire affiché. Exemple réel :
// 10 572,45 € pour 476 h donne 22,2110 €, imprimé « 22,21 € ».
// Facturer 476 × 22,21 aboutit à 10 571,96 €, soit 49 centimes de moins que
// le montant accordé. L'écart est invisible mois par mois et bloque le solde.
// Le bloc l'affiche donc dès la saisie, plutôt que de le laisser apparaître
// à la dernière facture.

import ChampEcheance from './ChampEcheance';
import { categorieDe, libelleCategorie } from '../lib/financeurs';

const DORE = '#C8A23A';
const VERT = '#006B68';

const CHAMPS = [
  { label: 'Heures théoriques (H1)', champ: 'heuresTheoriques' },
  { label: 'Heures stage pratique', champ: 'heuresStagePratique' },
  { label: 'Taux horaire HT', champ: 'tauxHoraire' },
  { label: 'TVA (%)', champ: 'tauxTva' },
];

interface Props {
  apc: any;
  /** Même signature que la fonction maj() de la page : (champ, valeur). */
  onValider: (champ: string, valeur: any) => void;
}

export default function BlocConvention({ apc, onValider }: Props) {
  const categorie = categorieDe(apc?.opco);

  // Dossier d'apprentissage, ou financeur inconnu : ce bloc ne s'applique pas.
  if (!categorie || categorie === 'opco') return null;

  const heures = Number(apc?.heuresTheoriques) || 0;
  const taux = Number(apc?.tauxHoraire) || 0;
  const tva = Number(apc?.tauxTva) || 0;
  const accorde = Number(apc?.coutPedagoAccorde) || 0;

  // Le montant accordé et le taux sont HT : le contrôle compare donc du HT.
  const calculeHt = Math.round(heures * taux * 100) / 100;
  const calculeTtc = Math.round(calculeHt * (1 + tva / 100) * 100) / 100;
  const ecart = Math.round((accorde - calculeHt) * 100) / 100;

  const complet = heures > 0 && taux > 0 && accorde > 0;
  const ecartSignificatif = complet && Math.abs(ecart) >= 0.01;
  const tvaManquante = heures > 0 && taux > 0 && !apc?.tauxTva;

  const euros = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      style={{
        backgroundColor: '#fef6e4',
        border: `1px solid ${DORE}`,
        borderRadius: '8px',
        padding: '12px',
        marginTop: '12px',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a5c00', textTransform: 'uppercase', marginBottom: '2px' }}>
        📄 Convention {libelleCategorie(categorie)} — heures prises en charge
      </div>
      <div style={{ fontSize: '10px', color: '#7a5c00', marginBottom: '8px', fontStyle: 'italic' }}>
        Facturation au réel : heures théoriques réalisées × taux horaire, chaque mois.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
        {CHAMPS.map(f => (
          <ChampEcheance
            key={f.champ}
            label={f.label}
            type="montant"
            valeur={apc?.[f.champ]}
            onValider={val => onValider(f.champ, val)}
          />
        ))}
      </div>

      {tvaManquante && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 10px',
            borderRadius: '6px',
            backgroundColor: '#fdecea',
            fontSize: '11px',
            color: '#a12',
            lineHeight: 1.5,
          }}
        >
          <strong>TVA non renseignée.</strong> La formation professionnelle continue est
          soumise à TVA — 8,5 % à La Réunion. Sans ce taux, les montants facturés seront
          calculés hors taxe et les factures seront incomplètes.
        </div>
      )}

      {complet && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 10px',
            borderRadius: '6px',
            backgroundColor: ecartSignificatif ? '#fdecea' : '#e6f4f1',
            fontSize: '11px',
            color: ecartSignificatif ? '#a12' : VERT,
            lineHeight: 1.6,
          }}
        >
          <div>
            <strong>{euros(heures)} h × {euros(taux)} € = {euros(calculeHt)} € HT</strong>
            {tva > 0 && <> · soit <strong>{euros(calculeTtc)} € TTC</strong> à {euros(tva)} %</>}
          </div>

          {ecartSignificatif ? (
            <div style={{ marginTop: '4px' }}>
              Le montant accordé est de {euros(accorde)} € HT, soit un écart de {euros(ecart)} €.
              Le financeur a arrondi le taux affiché. À régulariser sur la dernière facture,
              sans quoi le solde restera bloqué.
            </div>
          ) : (
            <div style={{ marginTop: '4px' }}>Conforme au montant accordé.</div>
          )}
        </div>
      )}
    </div>
  );
}
