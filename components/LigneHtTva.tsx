'use client';

// components/LigneHtTva.tsx
// Ventilation HT / TVA d'une échéance, pour les conventions hors apprentissage.
//
// POURQUOI
// La TVA est collectée pour le compte de l'État : elle transite par le compte
// bancaire du CFA mais n'est pas un produit. Elle n'entre ni dans le chiffre
// d'affaires, ni dans le cadre C du BPF, ni dans le compte de résultat.
// Une échéance affichée en TTC seul masque donc la part réellement acquise.
//
// Exemple réel — Transition Pro, août 2026 :
//   168,68 € encaissés  =  155,47 € de produit  +  13,21 € de TVA à reverser.
// Le CA du mois est 155,47 €, pas 168,68 €.
//
// CE QUI EST STOCKÉ, CE QUI EST CALCULÉ
// Les montants saisis (montantPrevu, montantPaye) restent TTC : ce sont les
// sommes qui figurent sur la facture et qui transitent réellement.
// Le HT et la TVA sont recalculés à l'affichage, jamais enregistrés — un
// montant dérivé stocké finit toujours par diverger de sa source.
//
// L'APPRENTISSAGE EST EXONÉRÉ
// Le champ tauxTva y reste vide, et ce composant ne s'affiche pas.

const VERT = '#006B68';

interface Props {
  /** L'APC de l'échéance — porte le taux de TVA de la convention. */
  apc: any;
  /** L'échéance à ventiler. */
  echeance: any;
}

export default function LigneHtTva({ apc, echeance }: Props) {
  const tva = Number(apc?.tauxTva) || 0;

  // Pas de TVA : apprentissage, ou convention dont le taux n'est pas renseigné.
  if (tva <= 0) return null;

  const prevu = Number(echeance?.montantPrevu) || 0;
  const paye = Number(echeance?.montantPaye) || 0;

  // Le payé prime dès qu'il existe : c'est le montant réellement acquis.
  const encaisse = paye > 0;
  const ttc = encaisse ? paye : prevu;
  if (ttc <= 0) return null;

  const ht = Math.round((ttc / (1 + tva / 100)) * 100) / 100;
  const montantTva = Math.round((ttc - ht) * 100) / 100;

  const euros = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  const tauxAffiche = tva.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

  return (
    <div
      style={{
        padding: '6px 10px',
        backgroundColor: '#f7f7f7',
        borderTop: '1px dashed #ddd',
        fontSize: '11px',
        color: '#555',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <span>
        {encaisse ? 'Encaissé' : 'Prévu'} : <strong>{euros(ttc)}</strong> TTC
      </span>
      <span>
        dont produit HT : <strong style={{ color: VERT }}>{euros(ht)}</strong>
      </span>
      <span style={{ color: '#888' }}>
        TVA {tauxAffiche} % : {euros(montantTva)} — à reverser, hors CA
      </span>
    </div>
  );
}
