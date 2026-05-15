'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  EvaluationEntreprise,
  CRITERES_EVAL_ENTREPRISE,
  CleCritereEvalEntreprise,
  LIBELLES_NOTES_ENT,
  LIBELLES_EMBAUCHE,
  EmbaucheEnvisagee,
  envoyerEvaluationEntreprise,
} from '../../../data/evaluationsEntreprise';

const COLORS = {
  primary: '#006B68',
  secondary: '#C8A23A',
  background: '#EAF4F3',
  text: '#1a1a1a',
  textMuted: '#666',
};

export default function PageEvalEntreprise({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = React.use(params);
  const router = useRouter();

  const [maNom, setMaNom] = useState('');
  const [maFonction, setMaFonction] = useState('');
  const [entrepriseNom, setEntrepriseNom] = useState('');
  const [entrepriseSiret, setEntrepriseSiret] = useState('');

  const [apprentiNom, setApprentiNom] = useState('');
  const [apprentiPrenom, setApprentiPrenom] = useState('');
  const [formation, setFormation] = useState('');

  const [notes, setNotes] = useState<Record<CleCritereEvalEntreprise, number>>({
    note_savoir_faire: 0,
    note_savoir_etre: 0,
    note_acquisition: 0,
    note_communication: 0,
    note_satisfaction: 0,
  });

  const [pointsForts, setPointsForts] = useState('');
  const [axesProgression, setAxesProgression] = useState('');
  const [suggestionsCfa, setSuggestionsCfa] = useState('');

  const [embauche, setEmbauche] = useState<EmbaucheEnvisagee | ''>('');
  const [commentaireEmbauche, setCommentaireEmbauche] = useState('');

  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function setNote(cle: CleCritereEvalEntreprise, v: number) {
    setNotes((p) => ({ ...p, [cle]: v }));
  }

  const toutesNotesRemplies = CRITERES_EVAL_ENTREPRISE.every(
    (c) => notes[c.cle] >= 1 && notes[c.cle] <= 5
  );

  const peutEnvoyer =
    toutesNotesRemplies &&
    maNom.trim() !== '' &&
    entrepriseNom.trim() !== '' &&
    apprentiNom.trim() !== '';

  async function handleSubmit() {
    if (!peutEnvoyer) {
      setErreur('Merci de remplir tous les champs obligatoires (*) et de noter tous les critères.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErreur(null);
    setEnvoiEnCours(true);

    const payload: Omit<EvaluationEntreprise, 'id' | 'date_reponse'> = {
      session_code: code,
      ma_nom: maNom.trim(),
      ma_fonction: maFonction.trim() || undefined,
      entreprise_nom: entrepriseNom.trim(),
      entreprise_siret: entrepriseSiret.trim() || undefined,
      apprenti_nom: apprentiNom.trim(),
      apprenti_prenom: apprentiPrenom.trim() || undefined,
      formation: formation.trim() || undefined,
      ...notes,
      points_forts: pointsForts.trim() || undefined,
      axes_progression: axesProgression.trim() || undefined,
      suggestions_cfa: suggestionsCfa.trim() || undefined,
      embauche_envisagee: embauche || undefined,
      commentaire_embauche: commentaireEmbauche.trim() || undefined,
      user_agent: navigator.userAgent,
    };

    const result = await envoyerEvaluationEntreprise(payload);
    setEnvoiEnCours(false);

    if (result.success) {
      router.push(`/evaluation-entreprise/${code}/merci`);
    } else {
      setErreur('Erreur lors de l\'envoi. ' + (result.error || '') + '\nRéessayez.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background, padding: '20px 12px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

        <div style={{ textAlign: 'center', paddingBottom: '20px', borderBottom: `3px solid ${COLORS.secondary}`, marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: COLORS.primary, marginBottom: '6px' }}>
            🏢 Évaluation entreprise / Maître d'apprentissage
          </h1>
          <p style={{ fontSize: '13px', color: COLORS.textMuted }}>
            PAM OI Formation · CFA La Réunion
          </p>
          <p style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '8px', fontStyle: 'italic' }}>
            Votre retour nous aide à <strong>améliorer la qualité de nos formations</strong>
            <br />
            et à mieux préparer nos apprentis aux exigences du métier.
          </p>
        </div>

        {erreur && (
          <div style={{ backgroundColor: '#fde8e8', border: '2px solid #dc2626', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', color: '#991b1b', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
            ⚠️ {erreur}
          </div>
        )}

        <Section titre="👤 Vous êtes" obligatoire>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <Label>Nom du Maître d'apprentissage *</Label>
              <Input value={maNom} onChange={setMaNom} placeholder="Ex : Marie DUPONT" />
            </div>
            <div>
              <Label>Fonction</Label>
              <Input value={maFonction} onChange={setMaFonction} placeholder="Ex : Responsable comptable" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div>
              <Label>Entreprise *</Label>
              <Input value={entrepriseNom} onChange={setEntrepriseNom} placeholder="Ex : SARL DURAND" />
            </div>
            <div>
              <Label>N° SIRET</Label>
              <Input value={entrepriseSiret} onChange={setEntrepriseSiret} placeholder="14 chiffres" />
            </div>
          </div>
        </Section>

        <Section titre="🎓 Apprenti évalué" obligatoire>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <Label>Nom *</Label>
              <Input value={apprentiNom} onChange={setApprentiNom} placeholder="Ex : MARTIN" />
            </div>
            <div>
              <Label>Prénom</Label>
              <Input value={apprentiPrenom} onChange={setApprentiPrenom} placeholder="Ex : Lucas" />
            </div>
          </div>
          <Label>Formation suivie</Label>
          <Input value={formation} onChange={setFormation} placeholder="Ex : Secrétaire Comptable" />
        </Section>

        <Section titre="📊 Notez chaque critère de 1 à 5" obligatoire>
          {CRITERES_EVAL_ENTREPRISE.map((critere) => (
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
                        flex: '1 1 50px', minWidth: '50px', padding: '12px 4px', borderRadius: '8px',
                        border: actif ? `2px solid ${COLORS.primary}` : '1.5px solid #e0e0e0',
                        backgroundColor: actif ? COLORS.primary : 'white',
                        color: actif ? 'white' : COLORS.text,
                        cursor: 'pointer', fontWeight: '700', fontSize: '16px',
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              {notes[critere.cle] > 0 && (
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', fontWeight: '600', color: COLORS.primary }}>
                  {LIBELLES_NOTES_ENT[notes[critere.cle]]}
                </div>
              )}
            </div>
          ))}
        </Section>

        <Section titre="💬 Vos commentaires sur l'apprenti">
          <ChampLibre label="💪 Points forts de l'apprenti" value={pointsForts} onChange={setPointsForts} placeholder="Qualités, compétences remarquées..." />
          <ChampLibre label="🎯 Axes de progression" value={axesProgression} onChange={setAxesProgression} placeholder="Points à travailler, compétences à renforcer..." />
          <ChampLibre label="💡 Suggestions pour améliorer la formation" value={suggestionsCfa} onChange={setSuggestionsCfa} placeholder="Ce qui pourrait être ajouté/modifié dans la formation au CFA..." />
        </Section>

        <Section titre="🔁 Embauche envisagée après la formation ?">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {(Object.keys(LIBELLES_EMBAUCHE) as EmbaucheEnvisagee[]).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmbauche(e)}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: '8px',
                  border: embauche === e ? `2px solid ${COLORS.primary}` : '1.5px solid #e0e0e0',
                  backgroundColor: embauche === e ? COLORS.background : 'white',
                  color: COLORS.text, fontSize: '13px',
                  fontWeight: embauche === e ? '700' : '500', cursor: 'pointer',
                }}
              >
                {LIBELLES_EMBAUCHE[e]}
              </button>
            ))}
          </div>
          {embauche && (
            <ChampLibre label="Commentaire (optionnel)" value={commentaireEmbauche} onChange={setCommentaireEmbauche} placeholder="Précisions sur votre projet d'embauche..." />
          )}
        </Section>

        <button
          onClick={handleSubmit}
          disabled={envoiEnCours || !peutEnvoyer}
          style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
            backgroundColor: envoiEnCours || !peutEnvoyer ? '#ccc' : COLORS.primary,
            color: 'white', fontSize: '16px', fontWeight: '700',
            cursor: envoiEnCours || !peutEnvoyer ? 'not-allowed' : 'pointer',
            boxShadow: envoiEnCours || !peutEnvoyer ? 'none' : '0 4px 12px rgba(0, 107, 104, 0.3)',
          }}
        >
          {envoiEnCours ? '⏳ Envoi...' : peutEnvoyer ? '✅ Envoyer mon évaluation' : '📝 Complétez les champs obligatoires *'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '11px', color: COLORS.textMuted, marginTop: '20px', fontStyle: 'italic' }}>
          🛡️ Indicateur 13 Qualiopi · Recueil de l'avis des entreprises
          <br />
          Vos réponses sont confidentielles et destinées exclusivement au CFA PAM OI Formation.
        </p>
      </div>
    </div>
  );
}

function Section({ titre, obligatoire, children }: { titre: string; obligatoire?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
        {titre}{obligatoire && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
      </h2>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: COLORS.text, marginBottom: '6px' }}>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white' }}
    />
  );
}

function ChampLibre({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <Label>{label}</Label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', backgroundColor: 'white' }}
      />
    </div>
  );
}