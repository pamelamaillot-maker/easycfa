'use client';

// components/CardEvaluationsFroid.tsx
// Dashboard ADMIN du module Évaluations à froid 6 mois
// CFA PAM OI Formation - Indicateur 30 Qualiopi

import React, { useState, useEffect } from 'react';
import {
  EvaluationFroid,
  CRITERES_EVAL_FROID,
  LIBELLES_SITUATION,
  SituationPro,
  chargerEvaluationsFroidSession,
  calculerStatsFroid,
  couleurNote,
  getOrCreateCodeSessionFroid,
} from '../data/evaluationsFroid';

const COLORS = {
  primary: '#006B68',
  secondary: '#C8A23A',
  background: '#EAF4F3',
  text: '#1a1a1a',
  textMuted: '#666',
};

interface Props {
  sessionId: string;
  sessionNom?: string;
  apprenantIds?: string[];
}

export default function CardEvaluationsFroid({
  sessionId,
  sessionNom,
  apprenantIds = [],
}: Props) {
  const [code, setCode] = useState<string>('');
  const [evaluations, setEvaluations] = useState<EvaluationFroid[]>([]);
  const [loading, setLoading] = useState(true);
  const [lienCopie, setLienCopie] = useState(false);
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    const c = getOrCreateCodeSessionFroid(sessionId);
    setCode(c);
    setOrigin(window.location.origin);
    chargerEvaluations(c);
  }, [sessionId]);

  async function chargerEvaluations(c: string) {
    setLoading(true);
    const data = await chargerEvaluationsFroidSession(c);
    setEvaluations(data);
    setLoading(false);
  }

  function rafraichir() {
    if (code) chargerEvaluations(code);
  }

  const lienComplet = origin ? `${origin}/evaluation-froid/${code}` : '';

  function copierLien() {
    navigator.clipboard.writeText(lienComplet);
    setLienCopie(true);
    setTimeout(() => setLienCopie(false), 2000);
  }

  const stats = calculerStatsFroid(evaluations);
  const tauxReponse = apprenantIds.length > 0
    ? Math.round((stats.nbReponses / apprenantIds.length) * 100)
    : 0;

  return (
    <div>
      {/* LIEN PUBLIC */}
      <div style={{ backgroundColor: COLORS.background, border: `2px solid ${COLORS.primary}`, borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: COLORS.primary, marginBottom: '8px' }}>
          🔗 Lien à envoyer 6 mois après la fin de formation
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={lienComplet}
            readOnly
            style={{ flex: 1, minWidth: '250px', border: '1.5px solid #e0e0e0', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', backgroundColor: 'white', fontFamily: 'monospace' }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button onClick={copierLien} style={{ backgroundColor: lienCopie ? '#16a34a' : COLORS.primary, color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            {lienCopie ? '✅ Copié !' : '📋 Copier'}
          </button>
          <a href={lienComplet} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
            👁 Aperçu
          </a>
        </div>

        <p style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '8px', fontStyle: 'italic' }}>
          💡 À envoyer 6 mois après la fin de session aux anciens apprentis (email, WhatsApp...).
        </p>
      </div>

      {/* STATS GLOBALES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
        <StatBox label="Réponses" value={String(stats.nbReponses)} color={COLORS.primary} />
        <StatBox
          label="Taux emploi"
          value={`${stats.tauxEmploi}%`}
          color={stats.tauxEmploi >= 70 ? '#16a34a' : stats.tauxEmploi >= 40 ? COLORS.secondary : '#ea580c'}
        />
        <StatBox
          label="Taux diplôme"
          value={`${stats.tauxDiplome}%`}
          color={stats.tauxDiplome >= 80 ? '#16a34a' : stats.tauxDiplome >= 50 ? COLORS.secondary : '#ea580c'}
        />
        <StatBox
          label="Note globale"
          value={stats.moyenneGlobale > 0 ? `${stats.moyenneGlobale}/5` : '—'}
          color={couleurNote(stats.moyenneGlobale)}
        />
      </div>

      {/* RAFRAICHIR */}
      <div style={{ marginBottom: '16px' }}>
        <button onClick={rafraichir} disabled={loading} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? '⏳ Chargement...' : '🔄 Rafraîchir'}
        </button>
      </div>

      {/* RÉPARTITION SITUATION PRO */}
      {stats.nbReponses > 0 && (
        <div style={{ backgroundColor: '#fafafa', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
            📊 Situation professionnelle des anciens apprentis
          </h3>
          {(Object.keys(LIBELLES_SITUATION) as SituationPro[]).map((s) => {
            const nb = stats.repartitionSituation[s];
            if (nb === 0) return null;
            const pct = Math.round((nb / stats.nbReponses) * 100);
            return (
              <div key={s} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>{LIBELLES_SITUATION[s]}</span>
                  <span style={{ fontWeight: '700', color: COLORS.primary }}>{nb} ({pct}%)</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: COLORS.primary }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MOYENNES PAR CRITÈRE */}
      {stats.nbReponses > 0 && (
        <div style={{ backgroundColor: '#fafafa', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
            📊 Moyennes par critère
          </h3>
          {CRITERES_EVAL_FROID.map((c) => {
            const moy = stats.moyennes[c.cle];
            const pct = (moy / 5) * 100;
            return (
              <div key={c.cle} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: COLORS.text, fontWeight: '600' }}>{c.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: couleurNote(moy) }}>
                    {moy.toFixed(1)} / 5
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: couleurNote(moy), transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RÉPONSES DÉTAILLÉES */}
      {stats.nbReponses === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: COLORS.textMuted, fontStyle: 'italic', backgroundColor: '#fafafa', borderRadius: '12px', border: '1.5px dashed #ccc' }}>
          ❄️ Aucune réponse à froid pour le moment.
          <br />
          <span style={{ fontSize: '12px' }}>
            À envoyer 6 mois après la fin de session.
          </span>
        </div>
      ) : (
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
            💬 Réponses détaillées ({stats.nbReponses})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {evaluations.map((e) => (
              <CarteReponseFroid key={e.id} evaluation={e} />
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

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ backgroundColor: 'white', border: '1.5px solid #e0e0e0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: '600' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: '800', color, marginTop: '2px' }}>{value}</div>
    </div>
  );
}

function CarteReponseFroid({ evaluation }: { evaluation: EvaluationFroid }) {
  const date = evaluation.date_reponse
    ? new Date(evaluation.date_reponse).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

  const noteMoy = (
    evaluation.note_mise_pratique +
    evaluation.note_impact_poste +
    evaluation.note_acquisition +
    evaluation.note_recommandation +
    evaluation.note_pertinence
  ) / 5;

  return (
    <div style={{ backgroundColor: 'white', border: `1.5px solid ${couleurNote(noteMoy)}`, borderRadius: '10px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.text }}>
            {evaluation.apprenti_nom || '👤 Anonyme'}
          </div>
          <div style={{ fontSize: '11px', color: COLORS.textMuted }}>
            📅 {date}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: couleurNote(noteMoy) }}>
            {noteMoy.toFixed(1)}/5
          </div>
        </div>
      </div>

      {/* Situation pro */}
      {evaluation.situation_pro && (
        <div style={{ backgroundColor: COLORS.background, padding: '8px 12px', borderRadius: '8px', marginBottom: '10px', fontSize: '12px', color: COLORS.primary, fontWeight: '600' }}>
          {LIBELLES_SITUATION[evaluation.situation_pro]}
          {evaluation.poste_actuel && <span style={{ fontWeight: '400' }}> · {evaluation.poste_actuel}</span>}
          {evaluation.entreprise_actuelle && <span style={{ fontWeight: '400' }}> chez {evaluation.entreprise_actuelle}</span>}
          <br />
          <span style={{ fontSize: '11px', fontWeight: '600', color: evaluation.diplome_obtenu ? '#15803d' : '#991b1b' }}>
            {evaluation.diplome_obtenu ? '✅ Diplôme obtenu' : '❌ Diplôme non obtenu / en attente'}
          </span>
        </div>
      )}

      {/* Notes détaillées */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '10px', fontSize: '11px' }}>
        {CRITERES_EVAL_FROID.map((c) => {
          const note = (evaluation as any)[c.cle] as number;
          return (
            <div
              key={c.cle}
              style={{ backgroundColor: '#fafafa', padding: '6px 4px', borderRadius: '6px', textAlign: 'center', border: `1px solid ${couleurNote(note)}40` }}
              title={c.label}
            >
              <div style={{ fontSize: '10px', color: COLORS.textMuted }}>
                {c.label.split(' ')[0]}
              </div>
              <div style={{ fontWeight: '800', color: couleurNote(note), fontSize: '14px' }}>
                {note}/5
              </div>
            </div>
          );
        })}
      </div>

      {/* Commentaires */}
      {(evaluation.acquis_utiles || evaluation.manques_ressentis || evaluation.suggestions) && (
        <div style={{ backgroundColor: '#fafafa', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: COLORS.text }}>
          {evaluation.acquis_utiles && (
            <div style={{ marginBottom: '6px' }}>
              <strong style={{ color: '#16a34a' }}>💪 Acquis utiles :</strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: '2px' }}>{evaluation.acquis_utiles}</div>
            </div>
          )}
          {evaluation.manques_ressentis && (
            <div style={{ marginBottom: '6px' }}>
              <strong style={{ color: COLORS.secondary }}>🎯 Manques :</strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: '2px' }}>{evaluation.manques_ressentis}</div>
            </div>
          )}
          {evaluation.suggestions && (
            <div>
              <strong style={{ color: '#7c3aed' }}>💡 Suggestions :</strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: '2px' }}>{evaluation.suggestions}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
