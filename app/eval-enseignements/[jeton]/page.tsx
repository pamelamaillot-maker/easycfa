'use client';

// app/evaluation/[jeton]/page.tsx
// Questionnaire anonyme d'évaluation des enseignements — indicateur 33 du RNQ.
//
// Page PUBLIQUE : accessible sans authentification, par un lien contenant un
// jeton aléatoire. Le jeton identifie la CAMPAGNE, jamais le répondant.
// Aucun identifiant d'apprenti n'est demandé, transmis ni stocké :
// l'anonymat est structurel, pas déclaratif.
//
// Conséquence assumée : un apprenti peut techniquement répondre deux fois.
// On ne peut l'empêcher sans identifier le répondant — l'anonymat prime.

import { useEffect, useState } from 'react';
import { use } from 'react';
import {
  chargerEvaluationParJeton,
  repondreParJeton,
} from '../../../data/evaluationsEnseignementsSupabase';
import {
  CRITERES_EVALUATION,
  ECHELLE_NOTES,
  CHAMPS_LIBRES,
} from '../../../lib/criteresEvaluation';

const COULEURS = { primary: '#006B68', or: '#C8A23A', fond: '#EAF4F3' };

type Campagne = {
  id: string; formation: string; activiteType: string; formateurNom: string;
  datePeriodeDebut: string; datePeriodeFin: string; statut: string;
};

function formaterDate(iso?: string): string {
  if (!iso) return '';
  const p = iso.slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

export default function PageEvaluation({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = use(params);

  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [chargement, setChargement] = useState(true);
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [libres, setLibres] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dejaRepondu, setDejaRepondu] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await chargerEvaluationParJeton(jeton);
      setCampagne(c as Campagne | null);
      setChargement(false);
      // Marquage local : décourage le double envoi sans identifier personne.
      try {
        if (localStorage.getItem(`eval_repondu_${jeton}`)) setDejaRepondu(true);
      } catch { /* navigation privée : on laisse passer */ }
    })();
  }, [jeton]);

  const tousNotes = CRITERES_EVALUATION.every(c => notes[c.cle]);

  async function envoyer() {
    setErreur(null);
    if (!tousNotes) { setErreur('Merci de répondre à tous les critères avant de valider.'); return; }
    setEnvoi(true);
    const r = await repondreParJeton(jeton, {
      dateReponse: new Date().toISOString(),
      notes,
      pointsForts: libres.pointsForts,
      pointsAmeliorer: libres.pointsAmeliorer,
    });
    setEnvoi(false);
    if (!r.success) { setErreur(r.error ?? 'Envoi impossible.'); return; }
    try { localStorage.setItem(`eval_repondu_${jeton}`, '1'); } catch { /* ignore */ }
    setEnvoye(true);
  }

  const Cadre = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: '100vh', backgroundColor: COULEURS.fond, padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>{children}</div>
    </div>
  );

  const Carte = ({ children }: { children: React.ReactNode }) => (
    <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      {children}
    </div>
  );

  if (chargement) {
    return <Cadre><Carte><div style={{ textAlign: 'center', color: COULEURS.primary, fontWeight: 600 }}>⏳ Chargement…</div></Carte></Cadre>;
  }

  if (!campagne) {
    return (
      <Cadre>
        <Carte>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: COULEURS.primary, marginBottom: '8px' }}>
              Questionnaire indisponible
            </h1>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6 }}>
              Ce lien n&apos;est plus valable, ou la période de réponse est close.
              Rapprochez-vous de votre centre de formation si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
            </p>
          </div>
        </Carte>
      </Cadre>
    );
  }

  if (envoye) {
    return (
      <Cadre>
        <Carte>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '38px', marginBottom: '10px' }}>✅</div>
            <h1 style={{ fontSize: '19px', fontWeight: 800, color: COULEURS.primary, marginBottom: '10px' }}>
              Merci pour votre réponse
            </h1>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6 }}>
              Votre avis a bien été enregistré, de façon totalement anonyme.
              Il sera analysé avec l&apos;équipe pédagogique pour améliorer la formation.
            </p>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '16px', fontStyle: 'italic' }}>
              Ensemble, nous irons plus loin.
            </p>
          </div>
        </Carte>
      </Cadre>
    );
  }

  return (
    <Cadre>
      {/* En-tête */}
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: COULEURS.primary }}>PAM OI Formation</div>
        <div style={{ fontSize: '12px', color: COULEURS.or, marginTop: '2px' }}>Ensemble, nous irons plus loin</div>
      </div>

      <Carte>
        <h1 style={{ fontSize: '18px', fontWeight: 800, color: COULEURS.primary, marginBottom: '6px' }}>
          Votre avis sur les enseignements
        </h1>
        <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, marginBottom: '14px' }}>
          Ce questionnaire porte sur la période de formation qui vient de s&apos;achever.
          Vos réponses sont <strong>anonymes</strong> : ni votre nom ni aucune donnée permettant
          de vous identifier n&apos;est enregistré. Elles sont analysées de façon collective.
        </p>

        <div style={{ backgroundColor: COULEURS.fond, borderRadius: '10px', padding: '12px 14px', fontSize: '13px', lineHeight: 1.7 }}>
          <div><strong>Formation :</strong> {campagne.formation}</div>
          <div><strong>Activité type :</strong> {campagne.activiteType}</div>
          <div><strong>Formateur :</strong> {campagne.formateurNom}</div>
          {(campagne.datePeriodeDebut || campagne.datePeriodeFin) && (
            <div><strong>Période :</strong> {formaterDate(campagne.datePeriodeDebut)} → {formaterDate(campagne.datePeriodeFin)}</div>
          )}
        </div>
      </Carte>

      {dejaRepondu && (
        <div style={{ backgroundColor: '#fef6e4', border: `1px solid ${COULEURS.or}`, borderRadius: '10px', padding: '12px 14px', marginTop: '14px', fontSize: '13px', color: '#8a6d1f' }}>
          ℹ️ Une réponse a déjà été envoyée depuis cet appareil. Vous pouvez répondre à nouveau,
          mais cela fausserait les résultats.
        </div>
      )}

      {/* Critères */}
      <div style={{ marginTop: '14px' }}>
        <Carte>
          {CRITERES_EVALUATION.map((critere, idx) => (
            <div key={critere.cle} style={{ marginBottom: idx === CRITERES_EVALUATION.length - 1 ? 0 : '22px', paddingBottom: idx === CRITERES_EVALUATION.length - 1 ? 0 : '18px', borderBottom: idx === CRITERES_EVALUATION.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#222', marginBottom: '3px' }}>
                {idx + 1}. {critere.libelle}
              </div>
              {critere.aide && (
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px', lineHeight: 1.5 }}>{critere.aide}</div>
              )}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ECHELLE_NOTES.map(n => {
                  const actif = notes[critere.cle] === n.valeur;
                  return (
                    <button
                      key={n.valeur}
                      onClick={() => setNotes(p => ({ ...p, [critere.cle]: n.valeur }))}
                      style={{
                        flex: '1 1 100px', minWidth: '90px', padding: '10px 6px', borderRadius: '10px',
                        border: `2px solid ${actif ? COULEURS.primary : '#e0e0e0'}`,
                        backgroundColor: actif ? COULEURS.primary : 'white',
                        color: actif ? 'white' : '#555',
                        fontSize: '12px', fontWeight: actif ? 700 : 500, cursor: 'pointer', lineHeight: 1.3,
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{n.valeur}</div>
                      <div style={{ fontSize: '10px', marginTop: '2px' }}>{n.libelle}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </Carte>
      </div>

      {/* Champs libres */}
      <div style={{ marginTop: '14px' }}>
        <Carte>
          {CHAMPS_LIBRES.map(champ => (
            <div key={champ.cle} style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: '#222', display: 'block', marginBottom: '6px' }}>
                {champ.libelle}
              </label>
              <textarea
                rows={3}
                value={libres[champ.cle] ?? ''}
                onChange={e => setLibres(p => ({ ...p, [champ.cle]: e.target.value }))}
                placeholder="Facultatif"
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e0e0e0', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          ))}
          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
            Évitez d&apos;écrire votre nom ou celui d&apos;un camarade : ces champs sont lus tels quels
            par l&apos;équipe pédagogique.
          </div>
        </Carte>
      </div>

      {erreur && (
        <div style={{ backgroundColor: '#fde8e8', border: '1px solid #e53e3e', borderRadius: '10px', padding: '12px 14px', marginTop: '14px', fontSize: '13px', color: '#c53030', fontWeight: 600 }}>
          ⚠️ {erreur}
        </div>
      )}

      <button
        onClick={envoyer}
        disabled={envoi}
        style={{
          width: '100%', marginTop: '16px', padding: '15px', borderRadius: '12px', border: 'none',
          backgroundColor: tousNotes ? COULEURS.primary : '#b8ccca',
          color: 'white', fontSize: '15px', fontWeight: 700,
          cursor: envoi ? 'wait' : 'pointer',
        }}
      >
        {envoi ? '⏳ Envoi en cours…' : '✅ Envoyer ma réponse'}
      </button>

      <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '14px', lineHeight: 1.6 }}>
        Aucune donnée personnelle n&apos;est collectée. Les réponses sont conservées de façon
        agrégée et servent uniquement à l&apos;amélioration de la formation.
      </p>
      <p style={{ fontSize: '10px', color: '#aaa', textAlign: 'center', marginTop: '6px', marginBottom: '20px' }}>
        EasyCFA — solution éditée par PAM GROUPE
      </p>
    </Cadre>
  );
}
