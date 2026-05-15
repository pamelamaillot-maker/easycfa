'use client';

// components/CardEvaluationsChaud.tsx
// Dashboard ADMIN du module Évaluations à chaud (4ème onglet session)
// CFA PAM OI Formation - Indicateurs 30/31 Qualiopi

import React, { useState, useEffect } from 'react';
import {
  EvaluationChaud,
  CRITERES_EVAL_CHAUD,
  chargerEvaluationsSession,
  calculerStats,
  couleurNote,
  getOrCreateCodeSession,
} from '../data/evaluationsChaud';

const COLORS = {
  primary: '#006B68',
  secondary: '#C8A23A',
  background: '#EAF4F3',
  text: '#1a1a1a',
  textMuted: '#666',
};

interface Props {
  sessionId: string;
  sessionNom: string;
  apprenantIds: string[];
}

export default function CardEvaluationsChaud({
  sessionId,
  sessionNom,
  apprenantIds,
}: Props) {
  const [code, setCode] = useState<string>('');
  const [evaluations, setEvaluations] = useState<EvaluationChaud[]>([]);
  const [loading, setLoading] = useState(true);
  const [lienCopie, setLienCopie] = useState(false);
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    // Générer/récupérer le code unique de la session
    const c = getOrCreateCodeSession(sessionId);
    setCode(c);

    // Récupérer l'URL de base (localhost en dev, easycfa.vercel.app en prod)
    setOrigin(window.location.origin);

    // Charger les évaluations depuis Supabase
    chargerEvaluations(c);
  }, [sessionId]);

  async function chargerEvaluations(c: string) {
    setLoading(true);
    const data = await chargerEvaluationsSession(c);
    setEvaluations(data);
    setLoading(false);
  }

  function rafraichir() {
    if (code) chargerEvaluations(code);
  }

  const lienComplet = origin ? `${origin}/evaluation/${code}` : '';

  function copierLien() {
    navigator.clipboard.writeText(lienComplet);
    setLienCopie(true);
    setTimeout(() => setLienCopie(false), 2000);
  }

  const stats = calculerStats(evaluations);
  const tauxReponse = apprenantIds.length > 0
    ? Math.round((stats.nbReponses / apprenantIds.length) * 100)
    : 0;

  return (
    <div>
      {/* ============ ZONE 1 : LIEN PUBLIC ============ */}
      <div
        style={{
          backgroundColor: COLORS.background,
          border: `2px solid ${COLORS.primary}`,
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: COLORS.primary,
            marginBottom: '8px',
          }}
        >
          🔗 Lien public pour les apprentis
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            value={lienComplet}
            readOnly
            style={{
              flex: 1,
              minWidth: '250px',
              border: '1.5px solid #e0e0e0',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              backgroundColor: 'white',
              color: COLORS.text,
              fontFamily: 'monospace',
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={copierLien}
            style={{
              backgroundColor: lienCopie ? '#16a34a' : COLORS.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {lienCopie ? '✅ Copié !' : '📋 Copier'}
          </button>
          <a
            href={lienComplet}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: 'white',
              color: COLORS.primary,
              border: `1.5px solid ${COLORS.primary}`,
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: '600',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            👁 Aperçu
          </a>
        </div>

        <p
          style={{
            fontSize: '11px',
            color: COLORS.textMuted,
            marginTop: '8px',
            fontStyle: 'italic',
          }}
        >
          💡 Partagez ce lien avec vos apprentis (email, WhatsApp, QR code...).
          Les réponses arrivent en temps réel ci-dessous.
        </p>
      </div>

      {/* ============ ZONE 2 : STATS GLOBALES ============ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <StatBox
          label="Réponses"
          value={String(stats.nbReponses)}
          color={COLORS.primary}
        />
        <StatBox
          label="Apprentis"
          value={String(apprenantIds.length)}
          color={COLORS.secondary}
        />
        <StatBox
          label="Taux"
          value={`${tauxReponse}%`}
          color={tauxReponse >= 70 ? '#16a34a' : tauxReponse >= 40 ? COLORS.secondary : '#ea580c'}
        />
        <StatBox
          label="Note globale"
          value={stats.moyenneGlobale > 0 ? `${stats.moyenneGlobale}/5` : '—'}
          color={couleurNote(stats.moyenneGlobale)}
        />
      </div>

      {/* ============ ZONE 3 : ACTIONS ============ */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={rafraichir}
          disabled={loading}
          style={{
            backgroundColor: 'white',
            color: COLORS.primary,
            border: `1.5px solid ${COLORS.primary}`,
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? '⏳ Chargement...' : '🔄 Rafraîchir'}
        </button>
      </div>

      {/* ============ ZONE 4 : MOYENNES PAR CRITÈRE ============ */}
      {stats.nbReponses > 0 && (
        <div
          style={{
            backgroundColor: '#fafafa',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #e0e0e0',
          }}
        >
          <h3
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: COLORS.primary,
              marginBottom: '12px',
            }}
          >
            📊 Moyennes par critère
          </h3>

          {CRITERES_EVAL_CHAUD.map((c) => {
            const moy = stats.moyennes[c.cle];
            const pourcent = (moy / 5) * 100;
            return (
              <div key={c.cle} style={{ marginBottom: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: COLORS.text, fontWeight: '600' }}>
                    {c.label}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: couleurNote(moy),
                    }}
                  >
                    {moy.toFixed(1)} / 5
                  </span>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pourcent}%`,
                      backgroundColor: couleurNote(moy),
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============ ZONE 5 : RÉPONSES DÉTAILLÉES ============ */}
      {stats.nbReponses === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: COLORS.textMuted,
            fontStyle: 'italic',
            backgroundColor: '#fafafa',
            borderRadius: '12px',
            border: '1.5px dashed #ccc',
          }}
        >
          📭 Aucune réponse pour le moment.
          <br />
          <span style={{ fontSize: '12px' }}>
            Partagez le lien ci-dessus avec vos apprentis.
          </span>
        </div>
      ) : (
        <div>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: COLORS.primary,
              marginBottom: '12px',
            }}
          >
            💬 Réponses détaillées ({stats.nbReponses})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {evaluations.map((e) => (
              <CarteReponse key={e.id} evaluation={e} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1.5px solid #e0e0e0',
        borderRadius: '10px',
        padding: '12px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          fontWeight: '600',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: '800',
          color,
          marginTop: '2px',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CarteReponse({ evaluation }: { evaluation: EvaluationChaud }) {
  const date = evaluation.date_reponse
    ? new Date(evaluation.date_reponse).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const noteMoy =
    (evaluation.note_pedagogie +
      evaluation.note_contenu +
      evaluation.note_organisation +
      evaluation.note_objectifs +
      evaluation.note_satisfaction) /
    5;

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: `1.5px solid ${couleurNote(noteMoy)}`,
        borderRadius: '10px',
        padding: '14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '10px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.text }}>
            {evaluation.apprenti_nom || '👤 Anonyme'}
          </div>
          <div style={{ fontSize: '11px', color: COLORS.textMuted }}>
            📅 {date}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: '800',
              color: couleurNote(noteMoy),
            }}
          >
            {noteMoy.toFixed(1)}/5
          </div>
        </div>
      </div>

      {/* Notes détaillées */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '4px',
          marginBottom: '10px',
          fontSize: '11px',
        }}
      >
        {CRITERES_EVAL_CHAUD.map((c) => {
          const note = (evaluation as any)[c.cle] as number;
          return (
            <div
              key={c.cle}
              style={{
                backgroundColor: '#fafafa',
                padding: '6px 4px',
                borderRadius: '6px',
                textAlign: 'center',
                border: `1px solid ${couleurNote(note)}40`,
              }}
              title={c.label}
            >
              <div style={{ fontSize: '10px', color: COLORS.textMuted }}>
                {c.label.replace(/[^\u{1F300}-\u{1F9FF}]/gu, '').trim() || c.cle.slice(5, 9)}
              </div>
              <div
                style={{
                  fontWeight: '800',
                  color: couleurNote(note),
                  fontSize: '14px',
                }}
              >
                {note}/5
              </div>
            </div>
          );
        })}
      </div>

      {/* Commentaires */}
      {(evaluation.points_forts || evaluation.points_ameliorer || evaluation.suggestions) && (
        <div
          style={{
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            color: COLORS.text,
          }}
        >
          {evaluation.points_forts && (
            <div style={{ marginBottom: '6px' }}>
              <strong style={{ color: '#16a34a' }}>💪 Points forts :</strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: '2px' }}>
                {evaluation.points_forts}
              </div>
            </div>
          )}
          {evaluation.points_ameliorer && (
            <div style={{ marginBottom: '6px' }}>
              <strong style={{ color: COLORS.secondary }}>🎯 À améliorer :</strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: '2px' }}>
                {evaluation.points_ameliorer}
              </div>
            </div>
          )}
          {evaluation.suggestions && (
            <div>
              <strong style={{ color: '#7c3aed' }}>💡 Suggestions :</strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: '2px' }}>
                {evaluation.suggestions}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
