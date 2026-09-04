'use client';

// app/apprenants/[id]/FinEffectiveContrat.tsx
// Saisie de la date de fin effective d'un contrat rompu, et de son origine.
//
// POURQUOI CE CHAMP EST SAISI ET NON DÉDUIT
// La date de fin effective peut provenir de trois pièces différentes :
// le formulaire de rupture signé, la fin de maintien en formation (DFMF),
// ou la signature d'un nouveau contrat. Aucune règle automatique ne peut
// trancher : c'est une lecture de dossier.
//
// POURQUOI L'ORIGINE EST TRACÉE
// En contrôle DREETS ou en audit Qualiopi, une date contestée doit pouvoir
// être rattachée à la pièce qui la justifie. Le champ `origineDateFinEffective`
// évite d'avoir à rouvrir le dossier pour s'en souvenir.
//
// USAGE BPF
// Cette date prime sur `dateFinContrat` dans le calcul du cadre F
// (voir lib/calculBpfCadreF.ts, fonction finRetenue).

import { useState } from 'react';
import { modifierApprenti } from '../../../data/apprentisSupabase';

const VERT = '#006B68';
const DORE = '#C8A23A';
const ROUGE = '#c53030';

// ---------------------------------------------------------------------------
// ORIGINES POSSIBLES
// ---------------------------------------------------------------------------

export const ORIGINES_FIN_EFFECTIVE: { code: string; libelle: string }[] = [
  { code: 'formulaire_rupture', libelle: 'Formulaire de rupture signé' },
  { code: 'fin_maintien', libelle: 'Fin de maintien en formation (DFMF)' },
  { code: 'nouveau_contrat', libelle: 'Signature d\u2019un nouveau contrat' },
  { code: 'autre', libelle: 'Autre source' },
];

export function libelleOrigine(code?: string): string {
  if (!code) return '';
  return ORIGINES_FIN_EFFECTIVE.find(o => o.code === code)?.libelle ?? code;
}

// ---------------------------------------------------------------------------
// DATES
// ---------------------------------------------------------------------------

/** 'AAAA-MM-JJ' -> 'JJ/MM/AAAA' pour l'affichage. */
function afficherDateFR(iso?: string): string {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return String(iso);
}

/** Valeur acceptée par <input type="date"> : 'AAAA-MM-JJ'. */
function pourInputDate(valeur?: string): string {
  if (!valeur) return '';
  const iso = String(valeur).match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const fr = String(valeur).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`;
  return '';
}

// ---------------------------------------------------------------------------
// COMPOSANT
// ---------------------------------------------------------------------------

interface Props {
  apprenantId: string;
  dateRuptureEffective?: string;
  origineDateFinEffective?: string;
  peutModifier?: boolean;
  /** Appelé après enregistrement réussi, pour rafraîchir la fiche. */
  onEnregistre?: (date: string, origine: string) => void;
}

export default function FinEffectiveContrat({
  apprenantId,
  dateRuptureEffective,
  origineDateFinEffective,
  peutModifier = true,
  onEnregistre,
}: Props) {
  const [edition, setEdition] = useState(false);
  const [date, setDate] = useState(pourInputDate(dateRuptureEffective));
  const [origine, setOrigine] = useState(origineDateFinEffective ?? '');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const renseignee = Boolean(dateRuptureEffective);

  async function enregistrer() {
    setErreur(null);

    if (!date) {
      setErreur('Indiquez une date de fin effective.');
      return;
    }
    if (!origine) {
      setErreur('Indiquez d\u2019où provient cette date.');
      return;
    }

    setEnregistrement(true);
    const res = await modifierApprenti(apprenantId, {
      dateRuptureEffective: date,
      origineDateFinEffective: origine,
    } as any);
    setEnregistrement(false);

    if (!res.success) {
      setErreur(res.error || 'Erreur lors de l\u2019enregistrement.');
      return;
    }

    setEdition(false);
    onEnregistre?.(date, origine);
  }

  function annuler() {
    setDate(pourInputDate(dateRuptureEffective));
    setOrigine(origineDateFinEffective ?? '');
    setErreur(null);
    setEdition(false);
  }

  // --- Mode lecture --------------------------------------------------------
  if (!edition) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '10px' }}>
        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
          Fin effective du contrat
        </div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: renseignee ? ROUGE : DORE }}>
          {renseignee ? afficherDateFR(dateRuptureEffective) : '\u26A0\uFE0F À renseigner'}
        </div>

        {renseignee && origineDateFinEffective && (
          <div style={{ fontSize: '10px', color: '#888', marginTop: '3px', fontStyle: 'italic' }}>
            {libelleOrigine(origineDateFinEffective)}
          </div>
        )}

        {peutModifier && (
          <button
            onClick={() => setEdition(true)}
            style={{
              marginTop: '6px',
              backgroundColor: 'transparent',
              color: VERT,
              border: 'none',
              padding: 0,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {renseignee ? 'Modifier' : 'Renseigner'}
          </button>
        )}
      </div>
    );
  }

  // --- Mode édition --------------------------------------------------------
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '10px', border: `1.5px solid ${VERT}` }}>
      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '6px' }}>
        Fin effective du contrat
      </div>

      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        style={{
          width: '100%',
          border: '1.5px solid #e0e0e0',
          borderRadius: '6px',
          padding: '5px 8px',
          fontSize: '12px',
          marginBottom: '6px',
          boxSizing: 'border-box',
        }}
      />

      <select
        value={origine}
        onChange={e => setOrigine(e.target.value)}
        style={{
          width: '100%',
          border: '1.5px solid #e0e0e0',
          borderRadius: '6px',
          padding: '5px 8px',
          fontSize: '12px',
          marginBottom: '6px',
          backgroundColor: 'white',
          boxSizing: 'border-box',
        }}
      >
        <option value="">— D&apos;où vient cette date ? —</option>
        {ORIGINES_FIN_EFFECTIVE.map(o => (
          <option key={o.code} value={o.code}>{o.libelle}</option>
        ))}
      </select>

      {erreur && (
        <div style={{ fontSize: '11px', color: ROUGE, marginBottom: '6px' }}>{erreur}</div>
      )}

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={enregistrer}
          disabled={enregistrement}
          style={{
            backgroundColor: VERT,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: enregistrement ? 'default' : 'pointer',
            opacity: enregistrement ? 0.6 : 1,
          }}
        >
          {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          onClick={annuler}
          disabled={enregistrement}
          style={{
            backgroundColor: 'white',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
