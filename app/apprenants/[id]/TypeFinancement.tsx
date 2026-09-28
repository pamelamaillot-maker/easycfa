'use client';

// app/apprenants/[id]/TypeFinancement.tsx
// Sélection du type de financement d'un apprenant.
//
// POURQUOI CE CHAMP EXISTE
// Jusqu'en 2026, PAM OI ne faisait que de l'apprentissage. Depuis la convention
// Transition Pro, des apprenants suivent le même parcours pédagogique sans être
// sous contrat d'apprentissage. Ils partagent les sessions, les émargements et
// le livret de certification, mais PAS les déclarations.
//
// CE QUE CE CHAMP COMMANDE
//   - SIFA et France Compétences : réservés à l'apprentissage, les autres types
//     en sont exclus (voir estApprentissage dans lib/financeurs.ts) ;
//   - BPF : la personne compte, mais sur une autre ligne du cadre F-1 ;
//   - taux de réussite : ventilés par type, jamais agrégés entre eux
//     (voir lib/tauxReussite.ts).
//
// Un apprenant sans valeur est réputé en apprentissage : c'était le seul cas
// avant 2026.

import { useState } from 'react';
import { TYPES_FINANCEMENT, estApprentissage } from '../../../lib/financeurs';
import { modifierApprenti } from '../../../data/apprentisSupabase';

const VERT = '#006B68';
const DORE = '#C8A23A';
const ROUGE = '#c53030';

interface Props {
  apprenantId: string;
  typeFinancement?: string;
  peutModifier?: boolean;
  /** Appelé après enregistrement réussi, pour rafraîchir la fiche. */
  onEnregistre?: (type: string) => void;
}

export default function TypeFinancement({
  apprenantId,
  typeFinancement,
  peutModifier = true,
  onEnregistre,
}: Props) {
  const valeur = typeFinancement || 'apprentissage';
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const info = TYPES_FINANCEMENT.find(t => t.cle === valeur);
  const apprentissage = estApprentissage(valeur);

  async function changer(nouveau: string) {
    if (nouveau === valeur) return;
    setErreur(null);
    setEnregistrement(true);
    const res = await modifierApprenti(apprenantId, { typeFinancement: nouveau } as any);
    setEnregistrement(false);
    if (!res.success) {
      setErreur(res.error || 'Erreur lors de l’enregistrement.');
      return;
    }
    onEnregistre?.(nouveau);
  }

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '260px' }}>
        <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
          Type de financement
        </label>

        {peutModifier ? (
          <select
            value={valeur}
            disabled={enregistrement}
            onChange={e => changer(e.target.value)}
            style={{
              width: '100%',
              border: '1.5px solid #e0e0e0',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              backgroundColor: 'white',
              boxSizing: 'border-box',
            }}
          >
            {TYPES_FINANCEMENT.map(t => (
              <option key={t.cle} value={t.cle}>{t.libelle}</option>
            ))}
          </select>
        ) : (
          <div style={{ fontSize: '13px', fontWeight: 700 }}>{info?.libelle ?? valeur}</div>
        )}

        {enregistrement && (
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>
            Enregistrement…
          </div>
        )}
        {erreur && (
          <div style={{ fontSize: '11px', color: ROUGE, marginTop: '4px' }}>{erreur}</div>
        )}
      </div>

      {/* Conséquences déclaratives, affichées pour éviter toute surprise en contrôle. */}
      <div
        style={{
          flex: 1,
          minWidth: '260px',
          backgroundColor: apprentissage ? '#e6f4f1' : '#fef6e4',
          border: `1px solid ${apprentissage ? VERT : DORE}`,
          borderRadius: '8px',
          padding: '10px 12px',
          fontSize: '11px',
          color: apprentissage ? VERT : '#7a5c00',
          lineHeight: 1.5,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>
          {apprentissage ? 'Compté dans les déclarations apprentissage' : 'Exclu des déclarations apprentissage'}
        </div>
        <div>
          SIFA et France Compétences : {apprentissage ? 'inclus' : 'non concerné'}.
        </div>
        <div>
          BPF, cadre F-1 : {info?.ligneBpfF1 ?? '—'}.
        </div>
      </div>
    </div>
  );
}
