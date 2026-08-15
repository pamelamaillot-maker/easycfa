'use client';

// components/GestionEvaluationsEnseignements.tsx
// Indicateur 33 du RNQ — dispositif d'évaluation des contenus et enseignements
// par les apprentis, distinct de l'enquête de satisfaction globale.
//
// L'indicateur n'est satisfait que si les résultats sont PARTAGÉS avec les
// équipes pédagogiques et débouchent sur des ACTIONS D'AMÉLIORATION.
// La synthèse n'est donc pas un confort : c'est la preuve attendue en audit.

import { useEffect, useState } from 'react';
import Card from './Card';
import {
  chargerEvaluationsEnseignements,
  creerEvaluationEnseignement,
  envoyerEvaluation,
  cloturerEvaluation,
  analyserEvaluation,
  supprimerEvaluationEnseignement,
  genererIdEvaluation,
  tauxReponse,
  type EvaluationEnseignement,
} from '../data/evaluationsEnseignementsSupabase';
import {
  CRITERES_EVALUATION,
  detailParCritere,
  moyenneGlobale,
  couleurMoyenne,
} from '../lib/criteresEvaluation';

const C = { primary: '#006B68', or: '#C8A23A', fond: '#EAF4F3', rouge: '#e53e3e' };

const btnP: React.CSSProperties = { backgroundColor: C.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '7px 13px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' };
const btnS: React.CSSProperties = { backgroundColor: 'white', color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: '8px', padding: '7px 13px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' };
const champ: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };

const LIBELLE_STATUT: Record<string, { texte: string; bg: string; couleur: string }> = {
  brouillon: { texte: '📝 Brouillon', bg: '#f0f0f0', couleur: '#888' },
  envoyee: { texte: '📨 En cours', bg: '#fef6e4', couleur: C.or },
  cloturee: { texte: '🔒 Clôturée', bg: '#e6f4f1', couleur: C.primary },
  analysee: { texte: '✅ Analysée', bg: '#dcfce7', couleur: '#16a34a' },
};

/** Proposition de campagne déduite des interventions. */
interface Proposition {
  cle: string;
  formation: string;
  activiteType: string;
  formateurId: string;
  formateurNom: string;
  numerosSessions: string[];
  dateDebut: string;   // JJ/MM/AAAA
  dateFin: string;
  nbInterventions: number;
}

function isoDepuisFr(fr: string): string | null {
  const p = (fr ?? '').split('/');
  if (p.length !== 3) return null;
  const a = p[2].length === 2 ? '20' + p[2] : p[2];
  return `${a}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
}

function triDate(fr: string): number {
  const iso = isoDepuisFr(fr);
  return iso ? parseInt(iso.replace(/-/g, '')) : 0;
}

export default function GestionEvaluationsEnseignements({
  interventions = [],
  sessions = [],
  apprenants = [],
  analysePar = '',
}: {
  interventions?: any[];
  sessions?: any[];
  apprenants?: any[];
  analysePar?: string;
}) {
  const [campagnes, setCampagnes] = useState<EvaluationEnseignement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [synthese, setSynthese] = useState('');
  const [actions, setActions] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function recharger() {
    const liste = await chargerEvaluationsEnseignements();
    console.log(`[Ind.33] ${liste.length} campagne(s) chargée(s) depuis Supabase ✅`);
    setCampagnes(liste);
    setChargement(false);
  }

  useEffect(() => { recharger(); }, []);

  // ── Apprentis actifs d'un ensemble de sessions ──
  // Statuts retenus : « En cours » et « P2S ». Exclus : « Terminé », « Rupture ».
  function compterApprentisActifs(numeros: string[]): number {
    const ids = new Set<string>();
    for (const num of numeros) {
      const s = sessions.find(x => x.numero === num);
      for (const id of (s?.apprenantIds ?? [])) ids.add(String(id));
    }
    let n = 0;
    for (const id of ids) {
      const a = apprenants.find(x => String(x.id) === id);
      if (!a || a.archive === true) continue;
      if (a.statut === 'En cours' || a.statut === 'P2S') n++;
    }
    return n;
  }

  // ── Propositions déduites des interventions ──
  const propositions: Proposition[] = (() => {
    const agrege = new Map<string, Proposition>();
    for (const i of interventions) {
      const formateurId = i.formateurId ?? '';
      const at = i.activiteType ?? '';
      if (!formateurId || !at) continue;

      // sessionNumero peut regrouper plusieurs sessions : « A + B + C »
      const numeros = String(i.sessionNumero ?? '').split('+').map((s: string) => s.trim()).filter(Boolean);
      const formation = numeros[0]?.split('-')[0] ?? (i.formationLabel ?? '');
      const cle = `${formateurId}|${at}|${numeros.slice().sort().join('+')}`;

      const e = agrege.get(cle) ?? {
        cle, formation, activiteType: at, formateurId,
        formateurNom: i.formateurNom ?? '',
        numerosSessions: numeros,
        dateDebut: i.date ?? '', dateFin: i.date ?? '',
        nbInterventions: 0,
      };
      e.nbInterventions += 1;
      if (i.date && triDate(i.date) < triDate(e.dateDebut)) e.dateDebut = i.date;
      if (i.date && triDate(i.date) > triDate(e.dateFin)) e.dateFin = i.date;
      agrege.set(cle, e);
    }

    // On écarte celles dont la campagne existe déjà.
    const dejaFaites = new Set(campagnes.map(c =>
      `${c.formateurId}|${c.activiteType}|${(c.sessionIds ?? []).slice().sort().join('+')}`));

    return Array.from(agrege.values())
      .filter(p => !dejaFaites.has(`${p.formateurId}|${p.activiteType}|${p.numerosSessions.slice().sort().join('+')}`))
      .sort((a, b) => triDate(b.dateFin) - triDate(a.dateFin));
  })();

  async function creerDepuisProposition(p: Proposition) {
    setEnCours(true);
    setMessage(null);
    const r = await creerEvaluationEnseignement({
      id: genererIdEvaluation(p.numerosSessions[0] ?? p.formation, p.activiteType),
      sessionId: p.numerosSessions[0],
      sessionIds: p.numerosSessions,
      formation: p.formation,
      activiteType: p.activiteType,
      formateurId: p.formateurId,
      formateurNom: p.formateurNom,
      datePeriodeDebut: isoDepuisFr(p.dateDebut),
      datePeriodeFin: isoDepuisFr(p.dateFin),
      nbApprenantsAttendus: compterApprentisActifs(p.numerosSessions),
    });
    setEnCours(false);
    if (!r.success) { setMessage('❌ ' + r.error); return; }
    setMessage(`✅ Campagne créée pour ${p.formateurNom} — ${p.activiteType}.`);
    await recharger();
  }

  async function action(fn: () => Promise<{ success: boolean; error?: string }>, ok: string) {
    setEnCours(true); setMessage(null);
    const r = await fn();
    setEnCours(false);
    if (!r.success) { setMessage('❌ ' + r.error); return; }
    setMessage(ok);
    await recharger();
  }

  const lien = (c: EvaluationEnseignement) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/eval-enseignements/${c.jeton ?? ''}`;

  if (chargement) {
    return <Card><div style={{ textAlign: 'center', color: C.primary, fontWeight: 600, padding: '20px' }}>⏳ Chargement…</div></Card>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Rappel réglementaire */}
      <div style={{ backgroundColor: C.fond, border: `1px solid ${C.primary}`, borderRadius: '10px', padding: '12px 14px', fontSize: '11px', lineHeight: 1.6, color: '#333' }}>
        <strong style={{ color: C.primary }}>⚖️ Indicateur 33 du RNQ.</strong> Dispositif d&apos;évaluation des contenus
        et des enseignements par les apprentis, <strong>distinct de l&apos;enquête de satisfaction globale</strong>.
        L&apos;indicateur n&apos;est satisfait que si les résultats sont partagés avec les équipes pédagogiques et
        débouchent sur des actions d&apos;amélioration : la synthèse est la preuve attendue en audit.
        Décret n° 2026-728 du 1<sup>er</sup> août 2026, en vigueur au 1<sup>er</sup> novembre 2026.
      </div>

      {message && (
        <div style={{ backgroundColor: message.startsWith('❌') ? '#fde8e8' : '#e6f4f1', border: `1px solid ${message.startsWith('❌') ? C.rouge : C.primary}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#333' }}>
          {message}
          <button onClick={() => setMessage(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Propositions */}
      <Card>
        <div style={{ fontSize: '13px', fontWeight: 800, color: C.primary, marginBottom: '4px' }}>
          💡 Campagnes à créer ({propositions.length})
        </div>
        <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px', fontStyle: 'italic' }}>
          Déduites de vos fiches d&apos;intervention : une campagne par formateur et par activité type.
          Le regroupement de sessions est repris tel quel — une intervention collective couvre tous ses apprentis.
        </div>
        {propositions.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', padding: '8px 0' }}>
            Aucune nouvelle campagne à créer : toutes les interventions saisies ont déjà la leur.
          </div>
        ) : propositions.map(p => {
          const nb = compterApprentisActifs(p.numerosSessions);
          return (
            <div key={p.cle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '9px 11px', borderRadius: '8px', backgroundColor: '#fafafa', border: '1px solid #e0e0e0', marginBottom: '6px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: C.primary }}>
                  {p.formation} · {p.activiteType} — {p.formateurNom}
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                  {p.numerosSessions.join(' · ')} — {p.nbInterventions} intervention(s), du {p.dateDebut} au {p.dateFin}
                </div>
                <div style={{ fontSize: '10px', color: nb > 0 ? '#666' : C.rouge, fontWeight: nb > 0 ? 400 : 700, marginTop: '2px' }}>
                  👥 {nb} apprenti(s) actif(s) — En cours et P2S
                  {nb > 0 && nb < 4 && <span style={{ color: C.or, fontWeight: 700 }}> · ⚠️ groupe restreint : l&apos;anonymat est fragile</span>}
                </div>
              </div>
              <button onClick={() => creerDepuisProposition(p)} disabled={enCours} style={{ ...btnP, opacity: enCours ? 0.5 : 1 }}>
                + Créer la campagne
              </button>
            </div>
          );
        })}
      </Card>

      {/* Campagnes */}
      <Card>
        <div style={{ fontSize: '13px', fontWeight: 800, color: C.primary, marginBottom: '10px' }}>
          📋 Campagnes ({campagnes.length})
        </div>
        {campagnes.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>Aucune campagne pour le moment.</div>
        ) : campagnes.map(c => {
          const st = LIBELLE_STATUT[c.statut ?? 'brouillon'] ?? LIBELLE_STATUT.brouillon;
          const taux = tauxReponse(c);
          const estOuverte = ouverte === c.id;
          const reponses = c.reponses ?? [];
          const moyenne = moyenneGlobale(reponses);

          return (
            <div key={c.id} style={{ border: `1px solid ${estOuverte ? C.primary : '#e0e0e0'}`, borderRadius: '10px', padding: '11px 13px', marginBottom: '8px', backgroundColor: estOuverte ? C.fond : 'white' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 280px', cursor: 'pointer' }} onClick={() => { setOuverte(estOuverte ? null : (c.id ?? null)); setSynthese(c.synthese ?? ''); setActions(c.actionsAmelioration ?? ''); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.primary }}>
                      {c.formation} · {c.activiteType} — {c.formateurNom}
                    </span>
                    <span style={{ backgroundColor: st.bg, color: st.couleur, padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700 }}>
                      {st.texte}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                    {(c.sessionIds ?? []).join(' · ')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: taux >= 50 ? C.primary : C.or }}>{taux} %</div>
                  <div style={{ fontSize: '9px', color: '#888' }}>{c.nbReponses ?? 0}/{c.nbApprenantsAttendus ?? 0} réponses</div>
                </div>
              </div>

              {estOuverte && (
                <div style={{ marginTop: '11px', paddingTop: '11px', borderTop: '1px dashed #d0e8e6' }}>

                  {/* Lien de diffusion */}
                  {c.statut === 'envoyee' && c.jeton && (
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '9px 11px', marginBottom: '10px', border: '1px solid #e0e0e0' }}>
                      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                        🔗 Lien à diffuser aux apprentis
                      </div>
                      <div style={{ display: 'flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input readOnly value={lien(c)} style={{ ...champ, flex: '1 1 300px', fontSize: '11px', backgroundColor: '#fafafa' }} onFocus={e => e.currentTarget.select()} />
                        <button onClick={() => { navigator.clipboard?.writeText(lien(c)); setMessage('✅ Lien copié.'); }} style={btnS}>📋 Copier</button>
                      </div>
                      <div style={{ fontSize: '10px', color: '#888', marginTop: '5px', fontStyle: 'italic' }}>
                        Le même lien pour tous : il identifie la campagne, jamais le répondant.
                      </div>
                    </div>
                  )}

                  {/* Résultats */}
                  {reponses.length > 0 && (
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '9px 11px', marginBottom: '10px', border: '1px solid #e0e0e0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                        <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>📊 Résultats</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: couleurMoyenne(moyenne) }}>
                          Moyenne {moyenne ?? '—'}/5
                        </span>
                      </div>
                      {detailParCritere(reponses).map(d => (
                        <div key={d.cle} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', padding: '2px 0' }}>
                          <span style={{ flex: '1 1 200px', color: '#555' }}>{d.libelle}</span>
                          <div style={{ backgroundColor: '#e0e0e0', borderRadius: '4px', height: '5px', flex: '0 0 80px' }}>
                            <div style={{ height: '5px', borderRadius: '4px', width: `${((d.moyenne ?? 0) / 5) * 100}%`, backgroundColor: couleurMoyenne(d.moyenne) }} />
                          </div>
                          <span style={{ flex: '0 0 40px', textAlign: 'right', fontWeight: 800, color: couleurMoyenne(d.moyenne) }}>
                            {d.moyenne ?? '—'}
                          </span>
                        </div>
                      ))}
                      <div style={{ fontSize: '10px', color: '#888', marginTop: '6px', fontStyle: 'italic' }}>
                        Critères classés du plus faible au plus élevé : les premiers appellent une action d&apos;amélioration.
                      </div>

                      {/* Champs libres */}
                      {reponses.some(r => r.pointsForts || r.pointsAmeliorer) && (
                        <div style={{ marginTop: '9px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                          {reponses.map((r, i) => (
                            (r.pointsForts || r.pointsAmeliorer) && (
                              <div key={i} style={{ fontSize: '11px', marginBottom: '5px', color: '#444' }}>
                                {r.pointsForts && <div>💪 {r.pointsForts}</div>}
                                {r.pointsAmeliorer && <div>🎯 {r.pointsAmeliorer}</div>}
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Synthèse et actions */}
                  {(c.statut === 'cloturee' || c.statut === 'analysee') && (
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '9px 11px', marginBottom: '10px', border: `1px solid ${c.statut === 'analysee' ? '#16a34a' : C.or}` }}>
                      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>
                        📝 Synthèse partagée avec l&apos;équipe pédagogique
                      </div>
                      <textarea rows={3} value={synthese} onChange={e => setSynthese(e.target.value)}
                        placeholder="Ce que les réponses font ressortir, points forts et points de vigilance…"
                        style={{ ...champ, fontFamily: 'inherit', resize: 'vertical', marginBottom: '8px' }} />
                      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>
                        🎯 Actions d&apos;amélioration décidées
                      </div>
                      <textarea rows={3} value={actions} onChange={e => setActions(e.target.value)}
                        placeholder="Ce qui sera modifié, par qui et pour quand…"
                        style={{ ...champ, fontFamily: 'inherit', resize: 'vertical' }} />
                      <div style={{ fontSize: '10px', color: C.or, marginTop: '6px', fontStyle: 'italic' }}>
                        ⚠️ Sans synthèse ni action, l&apos;indicateur 33 n&apos;est pas satisfait, même avec un taux de réponse élevé.
                      </div>
                    </div>
                  )}

                  {/* Boutons */}
                  <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                    {c.statut === 'brouillon' && (
                      <button onClick={() => action(() => envoyerEvaluation(c.id!), '✅ Campagne ouverte : le lien est actif.')} disabled={enCours} style={btnP}>
                        📨 Ouvrir la campagne
                      </button>
                    )}
                    {c.statut === 'envoyee' && (
                      <button onClick={() => action(() => cloturerEvaluation(c.id!), '✅ Campagne clôturée.')} disabled={enCours} style={btnS}>
                        🔒 Clôturer
                      </button>
                    )}
                    {(c.statut === 'cloturee' || c.statut === 'analysee') && (
                      <button
                        onClick={() => action(() => analyserEvaluation(c.id!, synthese, actions, analysePar), '✅ Synthèse et actions enregistrées.')}
                        disabled={enCours || !synthese.trim() || !actions.trim()}
                        style={{ ...btnP, opacity: (!synthese.trim() || !actions.trim()) ? 0.5 : 1 }}
                      >
                        ✅ Enregistrer la synthèse
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('Supprimer cette campagne et toutes ses réponses ?')) action(() => supprimerEvaluationEnseignement(c.id!), '✅ Campagne supprimée.'); }}
                      style={{ backgroundColor: '#fde8e8', color: C.rouge, border: 'none', borderRadius: '8px', padding: '7px 13px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}
                    >
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
