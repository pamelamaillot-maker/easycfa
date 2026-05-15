'use client';

import React, { useState } from 'react';
import { COLORS } from '../lib/constants';
import { useAcces } from '../lib/useAcces';

interface BoutonSupprimerProps {
  /** Type d'entité à supprimer (apprenant, entreprise, formateur, etc.) */
  type: 'apprenant' | 'entreprise' | 'formateur' | 'session' | 'emargement' | 'intervention' | 'examen' | 'apc';
  /** ID de l'entité à supprimer */
  id: string;
  /** Libellé de l'entité (ex: "MAILLOT Paméla") pour la confirmation */
  libelle: string;
  /** Fonction appelée pour effectuer la suppression réelle (côté parent) */
  onSupprimer: () => void;
  /** Libellé optionnel du bouton (par défaut : "🗑️ Supprimer définitivement") */
  labelBouton?: string;
  /** Taille : 'normal' (par défaut) ou 'compact' (pour les listes) */
  taille?: 'normal' | 'compact';
}

const LABELS_TYPE: Record<BoutonSupprimerProps['type'], string> = {
  apprenant: "l'apprenant",
  entreprise: "l'entreprise",
  formateur: "le formateur",
  session: "la session",
  emargement: "la feuille d'émargement",
  intervention: "la fiche d'intervention",
  examen: "l'examen",
  apc: "le contrat APC France Compétences",
};

/**
 * Bouton de suppression sécurisé.
 *
 * - Visible UNIQUEMENT pour les utilisateurs ayant `peutSupprimer === true`
 *   (= rôle admin uniquement, configuré dans lib/useAcces.ts)
 * - Demande une DOUBLE confirmation :
 *   1. Cliquer sur le bouton ouvre une modale
 *   2. L'utilisateur doit taper "SUPPRIMER" pour confirmer
 * - Trace l'action dans `easycfa_acces_historique` (qui, quand, quoi)
 *   pour traçabilité Qualiopi/RGPD
 */
export default function BoutonSupprimer({
  type,
  id,
  libelle,
  onSupprimer,
  labelBouton,
  taille = 'normal',
}: BoutonSupprimerProps) {
  const { utilisateur, peutSupprimer } = useAcces();
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');

  // ⛔ Si l'utilisateur n'a pas le droit de supprimer, on ne rend RIEN
  // (bouton totalement invisible pour les non-admins)
  if (!peutSupprimer) return null;

  function fermerModale() {
    setModaleOuverte(false);
    setConfirmation('');
    setErreur('');
  }

  function confirmerSuppression() {
    if (confirmation.trim().toUpperCase() !== 'SUPPRIMER') {
      setErreur('⚠️ Tape exactement "SUPPRIMER" en majuscules pour confirmer.');
      return;
    }

    try {
      // 1. Tracer l'action dans l'historique (pour Qualiopi/RGPD)
      const historique = JSON.parse(localStorage.getItem('easycfa_acces_historique') || '[]');
      historique.push({
        date: new Date().toISOString(),
        action: 'SUPPRESSION',
        type,
        id,
        libelle,
        utilisateur: utilisateur?.identifiant ?? 'inconnu',
        nomUtilisateur: utilisateur ? `${utilisateur.prenom ?? ''} ${utilisateur.nom ?? ''}`.trim() : 'inconnu',
      });
      localStorage.setItem('easycfa_acces_historique', JSON.stringify(historique));
    } catch (err) {
      console.error('Erreur traçage historique:', err);
      // On n'empêche pas la suppression si le traçage échoue
    }

    // 2. Appeler la fonction de suppression du parent
    onSupprimer();

    // 3. Fermer la modale
    fermerModale();
  }

  // === Bouton compact (pour les tableaux/listes) ===
  if (taille === 'compact') {
    return (
      <>
        <button
          onClick={() => setModaleOuverte(true)}
          style={{
            backgroundColor: '#fde8e8',
            color: '#c53030',
            border: '1px solid #fbb6b6',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
          title={`Supprimer ${LABELS_TYPE[type]} (admin uniquement)`}
        >
          🗑️
        </button>
        {modaleOuverte && (
          <ModaleConfirmation
            type={type}
            libelle={libelle}
            confirmation={confirmation}
            setConfirmation={setConfirmation}
            erreur={erreur}
            onAnnuler={fermerModale}
            onConfirmer={confirmerSuppression}
          />
        )}
      </>
    );
  }

  // === Bouton normal (pour les fiches détail) ===
  return (
    <>
      <button
        onClick={() => setModaleOuverte(true)}
        style={{
          backgroundColor: 'white',
          color: '#c53030',
          border: '1.5px solid #c53030',
          borderRadius: '8px',
          padding: '9px 16px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
        title="Suppression définitive — Admin uniquement"
      >
        {labelBouton ?? '🗑️ Supprimer définitivement'}
      </button>

      {modaleOuverte && (
        <ModaleConfirmation
          type={type}
          libelle={libelle}
          confirmation={confirmation}
          setConfirmation={setConfirmation}
          erreur={erreur}
          onAnnuler={fermerModale}
          onConfirmer={confirmerSuppression}
        />
      )}
    </>
  );
}

// ============================================================================
// MODALE DE CONFIRMATION
// ============================================================================

function ModaleConfirmation({
  type,
  libelle,
  confirmation,
  setConfirmation,
  erreur,
  onAnnuler,
  onConfirmer,
}: {
  type: BoutonSupprimerProps['type'];
  libelle: string;
  confirmation: string;
  setConfirmation: (v: string) => void;
  erreur: string;
  onAnnuler: () => void;
  onConfirmer: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onAnnuler}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '28px',
          width: '520px',
          maxWidth: '92vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          borderTop: '4px solid #c53030',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#c53030', marginBottom: '12px' }}>
          ⚠️ Suppression définitive
        </h2>

        <div style={{ backgroundColor: '#fef6e4', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', border: '1.5px solid #C8A23A' }}>
          <div style={{ fontSize: '13px', color: '#7a5c00', fontWeight: '600', marginBottom: '6px' }}>
            🛡️ Conformité Qualiopi / RGPD / DEETS
          </div>
          <div style={{ fontSize: '12px', color: '#555' }}>
            La suppression est <strong>irréversible</strong>. Toutes les données associées seront définitivement perdues.
            Vérifie que tu ne supprimes pas une fiche réelle nécessaire à un audit ou un contrôle.
          </div>
        </div>

        <p style={{ fontSize: '14px', color: '#333', marginBottom: '16px' }}>
          Tu es sur le point de supprimer <strong>{LABELS_TYPE[type]}</strong> :
        </p>

        <div style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', fontSize: '14px', fontWeight: '700', color: COLORS.text }}>
          🗂️ {libelle}
        </div>

        <p style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
          Pour confirmer, tape exactement <strong style={{ color: '#c53030' }}>SUPPRIMER</strong> dans le champ ci-dessous :
        </p>

        <input
          type="text"
          value={confirmation}
          onChange={e => setConfirmation(e.target.value)}
          autoFocus
          placeholder="Tape SUPPRIMER"
          style={{
            width: '100%',
            border: `1.5px solid ${erreur ? '#c53030' : '#e0e0e0'}`,
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            boxSizing: 'border-box',
            marginBottom: '8px',
          }}
        />

        {erreur && (
          <div style={{ fontSize: '12px', color: '#c53030', fontWeight: '600', marginBottom: '12px' }}>
            {erreur}
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginBottom: '20px' }}>
          💡 Cette action sera tracée dans l'historique d'accès (qui, quand, quoi).
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onAnnuler}
            style={{
              backgroundColor: 'white',
              color: '#555',
              border: '1.5px solid #ccc',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirmer}
            disabled={confirmation.trim().toUpperCase() !== 'SUPPRIMER'}
            style={{
              backgroundColor: confirmation.trim().toUpperCase() === 'SUPPRIMER' ? '#c53030' : '#f0f0f0',
              color: confirmation.trim().toUpperCase() === 'SUPPRIMER' ? 'white' : '#aaa',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: confirmation.trim().toUpperCase() === 'SUPPRIMER' ? 'pointer' : 'not-allowed',
            }}
          >
            🗑️ Confirmer la suppression
          </button>
        </div>
      </div>
    </div>
  );
}
