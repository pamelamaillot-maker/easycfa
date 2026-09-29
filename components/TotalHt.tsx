'use client';

// components/TotalHt.tsx
// Ventilation hors taxe des totaux d'un echeancier, pour les conventions
// hors apprentissage.
//
// POURQUOI
// La barre de totaux sert au suivi de tresorerie : elle affiche ce qui entre
// reellement sur le compte, donc du TTC. Mais la TVA est collectee pour le
// compte de l'Etat : elle transite sans jamais devenir un produit.
// Le chiffre d'affaires, lui, se lit hors taxe.
//
// Les deux lectures sont legitimes et ne doivent pas se remplacer l'une
// l'autre. Cette ligne ajoute la seconde sans retirer la premiere.
//
// CE QUI EST STOCKE, CE QUI EST CALCULE
// Les montants enregistres (montantPrevu, montantPaye) restent TTC : ce sont
// les sommes portees sur les factures. Le HT est recalcule a l'affichage,
// jamais enregistre - un montant derive stocke finit toujours par diverger
// de sa source.
//
// L'APPRENTISSAGE EST EXONERE
// Le champ tauxTva y reste vide, et cette ligne ne s'affiche pas.

interface Props {
  /** L'APC de l'echeancier - porte le taux de TVA de la convention. */
  apc: any;
  /** Les echeances de cet APC. */
  echeances: any[];
}

export default function TotalHt({ apc, echeances }: Props) {
  const tva = Number(apc?.tauxTva) || 0;

  // Pas de TVA : apprentissage, ou convention dont le taux n'est pas renseigne.
  if (tva <= 0) return null;
  if (!Array.isArray(echeances) || echeances.length === 0) return null;

  const ttcPrevu = echeances.reduce((s, e) => s + (Number(e?.montantPrevu) || 0), 0);
  const ttcEncaisse = echeances.reduce((s, e) => s + (Number(e?.montantPaye) || 0), 0);
  if (ttcPrevu <= 0 && ttcEncaisse <= 0) return null;

  const horsTaxe = (n: number) => Math.round((n / (1 + tva / 100)) * 100) / 100;

  const prevuHt = horsTaxe(ttcPrevu);
  const encaisseHt = horsTaxe(ttcEncaisse);

  const euros = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  const tauxAffiche = tva.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

  return (
    <div
      style={{
        // Occupe toute la largeur de la grille a quatre colonnes.
        gridColumn: '1 / -1',
        marginTop: '8px',
        paddingTop: '6px',
        borderTop: '1px solid rgba(255,255,255,0.25)',
        textAlign: 'center',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 1.5,
      }}
    >
      Hors taxe — prévu <strong style={{ color: 'white' }}>{euros(prevuHt)}</strong>
      {' · '}encaissé <strong style={{ color: '#86efac' }}>{euros(encaisseHt)}</strong>
      <span style={{ color: 'rgba(255,255,255,0.6)' }}>
        {' — '}TVA {tauxAffiche} % non comprise, hors chiffre d'affaires
      </span>
    </div>
  );
}
