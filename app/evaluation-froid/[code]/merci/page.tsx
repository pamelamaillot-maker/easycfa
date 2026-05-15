'use client';

// app/evaluation-froid/[code]/page.tsx
// Page PUBLIQUE remplie par les anciens apprentis - Évaluation à froid 6 mois
// Indicateur 30 Qualiopi - CFA PAM OI Formation

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  EvaluationFroid,
  CRITERES_EVAL_FROID,
  CleCritereEvalFroid,
  LIBELLES_NOTES_FROID,
  LIBELLES_SITUATION,
  SituationPro,
  envoyerEvaluationFroid,
} from '../../../data/evaluationsFroid';

const COLORS = {
  primary: '#006B68',
  secondary: '#C8A23A',
  background: '#EAF4F3',
  text: '#1a1a1a',
  textMuted: '#666',
};

export default function PageEvalFroid({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = React.use(params);
  const router = useRouter();

  const [notes, setNotes] = useState<Record<CleCritereEvalFroid, number>>({
    note_mise_pratique: 0,
    note_impact_poste: 0,
    note_acquisition: 0,
    note_recommandation: 0,
    note_pertinence: 0,
  });

  const [situationPro, setSituationPro] = useState<SituationPro | ''>('');
  const [posteActuel, setPosteActuel] = useState('');
  const [entrepriseActuelle, setEntrepriseActuelle] = useState('');
  const [diplomeObtenu, setDiplomeObtenu] = useState<boolean | null>(null);

  const [acquisUtiles, setAcquisUtiles] = useState('');
  const [manquesRessentis, setManquesRessentis] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [nomFacultatif, setNomFacultatif] = useState('');

  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function setNote(cle: CleCritereEvalFroid, valeur: number) {
    setNotes((p) => ({ ...p, [cle]: valeur }));
  }

  const toutesNotesRemplies = CRITERES_EVAL_FROID.every(
    (c) => notes[c.cle] >= 1 && notes[c.cle] <= 5
  );

  const peutEnvoyer = toutesNotesRemplies && situationPro !== '' && diplomeObtenu !== null;

  async function handleSubmit() {
    if (!peutEnvoyer) {
      setErreur('Merci de remplir tous les champs obligatoires (notes, situation pro, diplôme).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErreur(null);
    setEnvoiEnCours(true);

    const payload: Omit<EvaluationFroid, 'id' | 'date_reponse'> = {
      session_code: code,
      apprenti_nom: nomFacultatif.trim() || null,
      situation_pro: situationPro as SituationPro,
      poste_actuel: posteActuel.trim() || undefined,
      entreprise_actuelle: entrepriseActuelle.trim() || undefined,
      diplome_obtenu: diplomeObtenu!,
      ...notes,
      acquis_utiles: acquisUtiles.trim() || undefined,
      manques_ressentis: manquesRessentis.trim() || undefined,
      suggestions: suggestions.trim() || undefined,
      user_agent: navigator.userAgent,
    };

    const result = await envoyerEvaluationFroid(payload);
    setEnvoiEnCours(false);

    if (result.success) {
      router.push(`/evaluation-froid/${code}/merci`);
    } else {
      setErreur('Erreur lors de l\'envoi. ' + (result.error || '') + '\nRéessayez.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background, padding: '20px 12px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', paddingBottom: '20px', borderBottom: `3px solid ${COLORS.secondary}`, marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: COLORS.primary, marginBottom: '6px' }}>
            ❄️ Évaluation à froid (6 mois)
          </h1>
          <p style={{ fontSize: '13px', color: COLORS.textMuted }}>
            PAM OI Formation · CFA La Réunion
          </p>
          <p style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '8px', fontStyle: 'italic' }}>
            6 mois après votre formation, votre retour d'expérience est précieux.
            <br />
            Quelques minutes seulement — votre nom est <strong>facultatif</strong>.
          </p>
        </div>

        {/* Erreur */}
        {erreur && (
          <div style={{ backgroundColor: '#fde8e8', border: '2px solid #dc2626', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', color: '#991b1b', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
            ⚠️ {erreur}
          </div>
        )}

        {/* SECTION 1 : SITUATION ACTUELLE */}
        <Section titre="📊 Votre situation actuelle" obligatoire>
          <div style={{ marginBottom: '14px' }}>
            <Label>Votre situation aujourd'hui *</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(Object.keys(LIBELLES_SITUATION) as SituationPro[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSituationPro(s)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: situationPro === s ? `2px solid ${COLORS.primary}` : '1.5px solid #e0e0e0',
                    backgroundColor: situationPro === s ? COLORS.background : 'white',
                    color: COLORS.text,
                    fontSize: '13px',
                    fontWeight: situationPro === s ? '700' : '500',
                    cursor: 'pointer',
                  }}
                >
                  {LIBELLES_SITUATION[s]}
                </button>
              ))}
            </div>
          </div>

          {(situationPro === 'emploi_cdi' || situationPro === 'emploi_cdd') && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <Label>Poste actuel</Label>
                <Input value={posteActuel} onChange={setPosteActuel} placeholder="Ex : Secrétaire comptable" />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <Label>Entreprise actuelle</Label>
                <Input value={entrepriseActuelle} onChange={setEntrepriseActuelle} placeholder="Ex : SARL DUPONT" />
              </div>
            </>
          )}

          <div>
            <Label>Avez-vous obtenu votre titre / diplôme ? *</Label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDiplomeObtenu(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: diplomeObtenu === true ? `2px solid #16a34a` : '1.5px solid #e0e0e0',
                  backgroundColor: diplomeObtenu === true ? '#dcfce7' : 'white',
                  color: diplomeObtenu === true ? '#15803d' : COLORS.text,
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                ✅ Oui
              </button>
              <button
                type="button"
                onClick={() => setDiplomeObtenu(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: diplomeObtenu === false ? `2px solid #dc2626` : '1.5px solid #e0e0e0',
                  backgroundColor: diplomeObtenu === false ? '#fde8e8' : 'white',
                  color: diplomeObtenu === false ? '#991b1b' : COLORS.text,
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                ❌ Non / En attente
              </button>
            </div>
          </div>
        </Section>

        {/* SECTION 2 : NOTES */}
        <Section titre="📊 Notez chaque critère de 1 à 5" obligatoire>
          {CRITERES_EVAL_FROID.map((critere) => (
            <div key={critere.cle} style={{ backgroundColor: '#fafafa', border: '1.5px solid #e0e0e0', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.text, marginBottom: '2px' }}>
                  {critere.label}
                </div>
                <div style={{ fontSize: '11px', color: COLORS.textMuted }}>
                  {critere.description}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                        border: actif ? `2px solid ${COLORS.primary}` : '1.5px solid #e0e0e0',
                        backgroundColor: actif ? COLORS.primary : 'white',
                        color: actif ? 'white' : COLORS.text,
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '16px',
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              {notes[critere.cle] > 0 && (
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', fontWeight: '600', color: COLORS.primary }}>
                  {LIBELLES_NOTES_FROID[notes[critere.cle]]}
                </div>
              )}
            </div>
          ))}
        </Section>

        {/* SECTION 3 : COMMENTAIRES */}
        <Section titre="💬 Vos commentaires (avec 6 mois de recul)">
          <ChampLibre label="💪 Quels acquis vous ont été les plus utiles ?" value={acquisUtiles} onChange={setAcquisUtiles} placeholder="Ce que la formation vous a apporté concrètement..." />
          <ChampLibre label="🎯 Manques ressentis sur le terrain" value={manquesRessentis} onChange={setManquesRessentis} placeholder="Ce que vous auriez aimé apprendre en plus..." />
          <ChampLibre label="💡 Suggestions pour les futurs apprentis" value={suggestions} onChange={setSuggestions} placeholder="Vos conseils, idées d'amélioration..." />
        </Section>

        {/* Nom facultatif */}
        <div style={{ backgroundColor: COLORS.background, border: `1.5px solid ${COLORS.primary}`, borderRadius: '12px', padding: '14px', marginBottom: '24px' }}>
          <Label style={{ color: COLORS.primary }}>🙋 Votre nom (facultatif)</Label>
          <p style={{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '8px' }}>
            Vous pouvez rester anonyme. Donner votre nom nous permet de vous recontacter si besoin.
          </p>
          <Input value={nomFacultatif} onChange={setNomFacultatif} placeholder="Prénom Nom (optionnel)" />
        </div>

        {/* Bouton envoyer */}
        <button
          onClick={handleSubmit}
          disabled={envoiEnCours || !peutEnvoyer}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: envoiEnCours || !peutEnvoyer ? '#ccc' : COLORS.primary,
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            cursor: envoiEnCours || !peutEnvoyer ? 'not-allowed' : 'pointer',
            boxShadow: envoiEnCours || !peutEnvoyer ? 'none' : '0 4px 12px rgba(0, 107, 104, 0.3)',
          }}
        >
          {envoiEnCours ? '⏳ Envoi en cours...' : peutEnvoyer ? '✅ Envoyer mon évaluation' : '📝 Complétez tous les champs obligatoires *'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '11px', color: COLORS.textMuted, marginTop: '20px', fontStyle: 'italic' }}>
          🛡️ Démarche qualité Qualiopi · Indicateur 30 (suivi à froid)
          <br />
          Vos réponses sont confidentielles.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

function Section({ titre, obligatoire, children }: { titre: string; obligatoire?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
        {titre}
        {obligatoire && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
      </h2>
      {children}
    </div>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '6px', ...style }}>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
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
  );
}

function ChampLibre({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <Label>{label}</Label>
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
