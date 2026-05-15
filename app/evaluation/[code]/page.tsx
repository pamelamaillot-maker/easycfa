'use client';

// app/evaluation/[code]/page.tsx
// Page PUBLIQUE remplie par les apprentis - Évaluation à chaud
// Indicateurs 30/31 Qualiopi - CFA PAM OI Formation
// Aucune connexion requise

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  EvaluationChaud,
  CRITERES_EVAL_CHAUD,
  CleCritereEvalChaud,
  LIBELLES_NOTES,
  envoyerEvaluation,
} from '../../../data/evaluationsChaud';

const COLORS = {
  primary: '#006B68',
  secondary: '#C8A23A',
  background: '#EAF4F3',
  text: '#1a1a1a',
  textMuted: '#666',
};

export default function PageEvaluationApprenti({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = React.use(params);
  const router = useRouter();

  // État du formulaire
  const [notes, setNotes] = useState<Record<CleCritereEvalChaud, number>>({
    note_pedagogie: 0,
    note_contenu: 0,
    note_organisation: 0,
    note_objectifs: 0,
    note_satisfaction: 0,
  });

  const [pointsForts, setPointsForts] = useState('');
  const [pointsAmeliorer, setPointsAmeliorer] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [nomFacultatif, setNomFacultatif] = useState('');

  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Info session (extraite du code - lisible pour rassurer l'apprenti)
  const [sessionInfo, setSessionInfo] = useState<{
    nom?: string;
    formateur?: string;
  }>({});

  useEffect(() => {
    // On pourrait charger les infos de session depuis Supabase ici
    // Pour l'instant, on affiche juste le code
  }, [code]);

  function setNote(cle: CleCritereEvalChaud, valeur: number) {
    setNotes((p) => ({ ...p, [cle]: valeur }));
  }

  const toutesNotesRemplies = CRITERES_EVAL_CHAUD.every(
    (c) => notes[c.cle] >= 1 && notes[c.cle] <= 5
  );

  async function handleSubmit() {
    if (!toutesNotesRemplies) {
      setErreur('Merci de noter tous les critères avant d\'envoyer.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErreur(null);
    setEnvoiEnCours(true);

    const payload: Omit<EvaluationChaud, 'id' | 'date_reponse'> = {
      session_code: code,
      apprenti_nom: nomFacultatif.trim() || null,
      ...notes,
      points_forts: pointsForts.trim() || undefined,
      points_ameliorer: pointsAmeliorer.trim() || undefined,
      suggestions: suggestions.trim() || undefined,
      user_agent: navigator.userAgent,
    };

    const result = await envoyerEvaluation(payload);

    setEnvoiEnCours(false);

    if (result.success) {
      router.push(`/evaluation/${code}/merci`);
    } else {
      setErreur(
        'Une erreur est survenue lors de l\'envoi. ' +
        (result.error || '') +
        '\nVérifiez votre connexion et réessayez.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: COLORS.background,
        padding: '20px 12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* En-tête */}
        <div
          style={{
            textAlign: 'center',
            paddingBottom: '20px',
            borderBottom: `3px solid ${COLORS.secondary}`,
            marginBottom: '24px',
          }}
        >
          <h1
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: COLORS.primary,
              marginBottom: '6px',
            }}
          >
            🌡️ Évaluation de votre formation
          </h1>
          <p style={{ fontSize: '13px', color: COLORS.textMuted }}>
            PAM OI Formation · CFA La Réunion
          </p>
          <p
            style={{
              fontSize: '12px',
              color: COLORS.textMuted,
              marginTop: '8px',
              fontStyle: 'italic',
            }}
          >
            Votre avis nous aide à améliorer la qualité de nos formations.
            <br />
            Ce questionnaire est <strong>anonyme</strong> (sauf si vous souhaitez donner votre nom).
          </p>
        </div>

        {/* Erreur */}
        {erreur && (
          <div
            style={{
              backgroundColor: '#fde8e8',
              border: '2px solid #dc2626',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '20px',
              color: '#991b1b',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
            }}
          >
            ⚠️ {erreur}
          </div>
        )}

        {/* Critères de notation */}
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: '700',
              color: COLORS.primary,
              marginBottom: '12px',
            }}
          >
            📊 Notez chaque critère de 1 à 5
          </h2>

          {CRITERES_EVAL_CHAUD.map((critere) => (
            <div
              key={critere.cle}
              style={{
                backgroundColor: '#fafafa',
                border: '1.5px solid #e0e0e0',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '12px',
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: COLORS.text,
                    marginBottom: '2px',
                  }}
                >
                  {critere.label}
                </div>
                <div style={{ fontSize: '11px', color: COLORS.textMuted }}>
                  {critere.description}
                </div>
              </div>

              {/* Boutons étoiles 1-5 */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {[1, 2, 3, 4, 5].map((n) => {
                  const actif = notes[critere.cle] === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNote(critere.cle, n)}
                      style={{
                        flex: '1 1 50px',
                        minWidth: '50px',
                        padding: '12px 4px',
                        borderRadius: '8px',
                        border: actif
                          ? `2px solid ${COLORS.primary}`
                          : '1.5px solid #e0e0e0',
                        backgroundColor: actif ? COLORS.primary : 'white',
                        color: actif ? 'white' : COLORS.text,
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '16px',
                        transition: 'all 0.15s',
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              {/* Libellé note sélectionnée */}
              {notes[critere.cle] > 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: COLORS.primary,
                  }}
                >
                  {LIBELLES_NOTES[notes[critere.cle]]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Commentaires libres */}
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: '700',
              color: COLORS.primary,
              marginBottom: '12px',
            }}
          >
            💬 Vos commentaires
          </h2>

          <ChampLibre
            label="💪 Points forts de la formation"
            value={pointsForts}
            onChange={setPointsForts}
            placeholder="Ce qui vous a particulièrement plu..."
          />

          <ChampLibre
            label="🎯 Points à améliorer"
            value={pointsAmeliorer}
            onChange={setPointsAmeliorer}
            placeholder="Ce qui pourrait être mieux selon vous..."
          />

          <ChampLibre
            label="💡 Suggestions"
            value={suggestions}
            onChange={setSuggestions}
            placeholder="Vos idées pour les prochaines sessions..."
          />
        </div>

        {/* Nom facultatif */}
        <div
          style={{
            backgroundColor: COLORS.background,
            border: `1.5px solid ${COLORS.primary}`,
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '24px',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: COLORS.primary,
              marginBottom: '6px',
            }}
          >
            🙋 Votre nom (facultatif)
          </label>
          <p style={{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '8px' }}>
            Le questionnaire est anonyme par défaut. Vous pouvez laisser votre nom si vous le souhaitez.
          </p>
          <input
            type="text"
            value={nomFacultatif}
            onChange={(e) => setNomFacultatif(e.target.value)}
            placeholder="Prénom Nom (optionnel)"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              border: '1.5px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white',
            }}
          />
        </div>

        {/* Bouton envoyer */}
        <button
          onClick={handleSubmit}
          disabled={envoiEnCours || !toutesNotesRemplies}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor:
              envoiEnCours || !toutesNotesRemplies ? '#ccc' : COLORS.primary,
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            cursor:
              envoiEnCours || !toutesNotesRemplies ? 'not-allowed' : 'pointer',
            boxShadow:
              envoiEnCours || !toutesNotesRemplies
                ? 'none'
                : '0 4px 12px rgba(0, 107, 104, 0.3)',
            transition: 'all 0.2s',
          }}
        >
          {envoiEnCours
            ? '⏳ Envoi en cours...'
            : toutesNotesRemplies
              ? '✅ Envoyer mon évaluation'
              : `📝 Notez tous les critères (${
                  CRITERES_EVAL_CHAUD.filter((c) => notes[c.cle] === 0).length
                } restants)`}
        </button>

        {/* Pied de page */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: COLORS.textMuted,
            marginTop: '20px',
            fontStyle: 'italic',
          }}
        >
          🛡️ Vos réponses sont collectées dans le cadre de la démarche qualité Qualiopi (Indicateurs 30/31).
          <br />
          Aucune donnée personnelle n'est conservée sans votre accord.
        </p>
      </div>
    </div>
  );
}

// =========================================================================
// SOUS-COMPOSANT : Champ libre (textarea)
// =========================================================================

function ChampLibre({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: COLORS.text,
          marginBottom: '4px',
        }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 12px',
          border: '1.5px solid #e0e0e0',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
          backgroundColor: 'white',
        }}
      />
    </div>
  );
}
