'use client';

// components/ChampEcheance.tsx
// Champ de saisie pour l'échéancier de la page Facturation OPCO.
//
// PROBLÈME CORRIGÉ
// Les champs de l'échéancier écrivaient dans Supabase à CHAQUE FRAPPE :
//   onChange={ev => majEch(e.id, champ, parseFloat(ev.target.value))}
// Deux conséquences :
//   1. Les décimales étaient impossibles à saisir. En tapant « 3144, »,
//      parseFloat renvoyait 3144 et la virgule disparaissait avant qu'on
//      puisse taper la décimale.
//   2. Une date de dix caractères déclenchait dix requêtes réseau et dix
//      rendus de la page, d'où la lenteur et le curseur qui saute.
//
// PRINCIPE RETENU
// La frappe reste LOCALE. L'écriture en base n'a lieu qu'à la sortie du champ
// (onBlur) ou sur la touche Entrée, et uniquement si la valeur a changé.
//
// FORMAT DES DATES
// Toutes les dates de l'échéancier sont stockées en JJ/MM/AAAA — c'est le
// format lu par le reste de la page (calculs d'échéance à 30 jours,
// ventilations par mois, alertes J-3). Ne pas passer en ISO ici sans
// reprendre ces calculs.

import { useEffect, useState } from 'react';

export type TypeChamp = 'text' | 'montant' | 'date';

// ---------------------------------------------------------------------------
// DATES
// ---------------------------------------------------------------------------

/** Insère les barres obliques au fil de la frappe : 28042026 -> 28/04/2026 */
function masqueDate(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, '').slice(0, 8);
  if (chiffres.length <= 2) return chiffres;
  if (chiffres.length <= 4) return `${chiffres.slice(0, 2)}/${chiffres.slice(2)}`;
  return `${chiffres.slice(0, 2)}/${chiffres.slice(2, 4)}/${chiffres.slice(4)}`;
}

/** 'JJ/MM/AAAA' -> 'AAAA-MM-JJ' pour alimenter le sélecteur de calendrier. */
function versIso(fr: string): string {
  const m = (fr ?? '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

/** 'AAAA-MM-JJ' -> 'JJ/MM/AAAA' au retour du sélecteur de calendrier. */
function depuisIso(iso: string): string {
  const m = (iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/**
 * Accepte une date déjà en JJ/MM/AAAA, ou en ISO AAAA-MM-JJ (format hérité
 * de la fiche apprenant), et renvoie toujours du JJ/MM/AAAA.
 * La conversion se fait à l'affichage : la valeur en base est réécrite au
 * format français dès la première modification du champ.
 */
function normaliserDateFR(valeur: any): string {
  const v = String(valeur ?? '').trim();
  if (!v) return '';
  return depuisIso(v.slice(0, 10)) || v;
}

/** Vrai si la date est complète et plausible. Vide = accepté (champ optionnel). */
function dateValide(fr: string): boolean {
  if (!fr) return true;
  const m = fr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const j = Number(m[1]), mo = Number(m[2]), a = Number(m[3]);
  if (mo < 1 || mo > 12 || j < 1 || j > 31 || a < 1900 || a > 2100) return false;
  const d = new Date(a, mo - 1, j);
  return d.getDate() === j && d.getMonth() === mo - 1;
}

// ---------------------------------------------------------------------------
// MONTANTS
// ---------------------------------------------------------------------------

/** Affiche un nombre avec la virgule française, sans séparateur de milliers. */
function montantVersTexte(valeur: number | undefined | null): string {
  if (valeur === undefined || valeur === null || valeur === 0) return valeur === 0 ? '0' : '';
  return String(valeur).replace('.', ',');
}

/** Accepte virgule ET point. Renvoie null si la saisie n'est pas un nombre. */
function texteVersMontant(texte: string): number | null {
  const t = (texte ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (t === '') return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// COMPOSANT
// ---------------------------------------------------------------------------

interface Props {
  label: string;
  type: TypeChamp;
  valeur: any;
  /** Appelé UNIQUEMENT à la sortie du champ, et seulement si la valeur change. */
  onValider: (valeur: any) => void;
  /** Champ calculé automatiquement (échéance à 30 jours) : lecture seule. */
  lectureSeule?: boolean;
}

const styleBase: React.CSSProperties = {
  border: '1.5px solid #e0e0e0',
  borderRadius: '8px',
  padding: '5px 7px',
  fontSize: '11px',
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: 'white',
};

export default function ChampEcheance({ label, type, valeur, onValider, lectureSeule }: Props) {
  const valeurInitiale =
    type === 'montant' ? montantVersTexte(valeur)
    : type === 'date' ? normaliserDateFR(valeur)
    : String(valeur ?? '');

  const [saisie, setSaisie] = useState(valeurInitiale);
  const [focus, setFocus] = useState(false);

  // Resynchronise si la valeur change à l'extérieur (régénération d'échéancier,
  // calcul automatique de l'échéance à 30 jours…), sauf pendant la frappe.
  useEffect(() => {
    if (!focus) setSaisie(valeurInitiale);
  }, [valeurInitiale, focus]);

  const invalide = type === 'date' && saisie !== '' && !dateValide(saisie);

  function valider() {
    setFocus(false);

    if (type === 'montant') {
      const n = texteVersMontant(saisie);
      if (n === null) { setSaisie(valeurInitiale); return; }   // saisie illisible : on annule
      if (n !== (valeur ?? 0)) onValider(n);
      setSaisie(montantVersTexte(n));
      return;
    }

    if (type === 'date') {
      if (!dateValide(saisie)) { setSaisie(valeurInitiale); return; }  // date incomplète : on annule
      if (saisie !== (valeur ?? '')) onValider(saisie);
      return;
    }

    if (saisie !== (valeur ?? '')) onValider(saisie);
  }

  function changer(v: string) {
    if (type === 'date') setSaisie(masqueDate(v));
    else setSaisie(v);
  }

  return (
    <div>
      <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
        {label}
      </label>

      <div style={{ display: 'flex', gap: '3px' }}>
        <input
          type="text"
          inputMode={type === 'montant' ? 'decimal' : type === 'date' ? 'numeric' : 'text'}
          value={saisie}
          readOnly={lectureSeule}
          placeholder={type === 'date' ? 'JJ/MM/AAAA' : undefined}
          onFocus={() => setFocus(true)}
          onChange={ev => changer(ev.target.value)}
          onBlur={valider}
          onKeyDown={ev => {
            if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur();
            if (ev.key === 'Escape') { setSaisie(valeurInitiale); (ev.target as HTMLInputElement).blur(); }
          }}
          style={{
            ...styleBase,
            flex: 1,
            borderColor: invalide ? '#e53e3e' : '#e0e0e0',
            backgroundColor: lectureSeule ? '#f5f5f5' : 'white',
            color: lectureSeule ? '#888' : 'inherit',
            textAlign: type === 'montant' ? 'right' : 'left',
          }}
        />

        {/* Sélecteur de calendrier, en complément de la frappe clavier. */}
        {type === 'date' && !lectureSeule && (
          <input
            type="date"
            value={versIso(saisie)}
            onChange={ev => {
              const fr = depuisIso(ev.target.value);
              setSaisie(fr);
              if (fr && fr !== (valeur ?? '')) onValider(fr);
            }}
            title="Ouvrir le calendrier"
            style={{
              width: '26px',
              border: '1.5px solid #e0e0e0',
              borderRadius: '8px',
              padding: '2px',
              cursor: 'pointer',
              backgroundColor: 'white',
              flexShrink: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
