'use client';

import React, { useState, useEffect } from 'react';
import { FORMATEURS, SESSIONS_FORMATEURS } from '../../../data/mockData';
import Badge from '../../../components/Badge';
import Card from '../../../components/Card';
import { COLORS } from '../../../lib/constants';
import { useAcces } from '../../../lib/useAcces';
import {
  EvaluationFormateur,
  CRITERES_FORMATEUR,
  CleCritere,
  LIBELLE_NOTE,
  STATUT_EVAL_STYLE,
  StatutEvaluation,
  chargerEvaluationsFormateur,
  chargerEvaluationFormateurAnnee,
  sauvegarderEvaluation,
  supprimerEvaluation,
  creerEvaluationVide,
  calculerNoteMoyenne,
  couleurNote,
  dateIsoToFr,
  dateFrToIso,
} from '../../../data/mockEvaluations';
import CardFormationsContinues from '../../../components/CardFormationsContinues';

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };

// ============================================================================
// COMPOSANT : Formulaire d'évaluation annuelle d'un formateur
// ============================================================================

function FormulaireEvaluation({
  evaluation,
  onSave,
  onCancel,
  utilisateur,
}: {
  evaluation: EvaluationFormateur;
  onSave: (e: EvaluationFormateur) => void;
  onCancel: () => void;
  utilisateur: any;
}) {
  const [form, setForm] = useState<EvaluationFormateur>(evaluation);

  // Pré-remplir évaluateur si vide
  React.useEffect(() => {
    if (!form.evaluateur && utilisateur) {
      setForm(p => ({ ...p, evaluateur: `${utilisateur.prenom ?? ''} ${utilisateur.nom ?? ''}`.trim() }));
    }
    if (!form.dateEvaluation) {
      setForm(p => ({ ...p, dateEvaluation: new Date().toISOString().slice(0, 10) }));
    }
  }, []);

  function setCritere(cle: CleCritere, champ: 'note' | 'commentaire', valeur: any) {
    setForm(prev => ({
      ...prev,
      criteres: {
        ...prev.criteres,
        [cle]: {
          ...prev.criteres[cle],
          [champ]: valeur,
        },
      },
    }));
  }

  const noteMoyenne = calculerNoteMoyenne(form);
  const categories = [...new Set(CRITERES_FORMATEUR.map(c => c.categorie))];

  return (
    <div style={{ backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '20px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
        ✏️ Évaluation annuelle {form.annee} — {form.formateurNom}
      </h3>

      {/* Métadonnées */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px', padding: '12px', backgroundColor: 'white', borderRadius: '8px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>📅 Date évaluation *</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              style={{ ...inputStyle, flex: 1 }}
              value={form.dateEvaluation ? dateIsoToFr(form.dateEvaluation) : ''}
              placeholder="JJ/MM/AAAA"
              onChange={e => {
                const v = e.target.value;
                if (v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                  setForm(p => ({ ...p, dateEvaluation: dateFrToIso(v) }));
                } else if (v === '') {
                  setForm(p => ({ ...p, dateEvaluation: '' }));
                } else {
                  setForm(p => ({ ...p, dateEvaluation: v }));
                }
              }}
            />
            <input
              type="date"
              style={{ width: '40px', border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '4px', cursor: 'pointer', backgroundColor: 'white' }}
              value={form.dateEvaluation && form.dateEvaluation.match(/^\d{4}-\d{2}-\d{2}$/) ? form.dateEvaluation : ''}
              onChange={e => setForm(p => ({ ...p, dateEvaluation: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>👤 Évaluateur *</label>
          <input style={inputStyle} value={form.evaluateur} onChange={e => setForm(p => ({ ...p, evaluateur: e.target.value }))} placeholder="Paméla MAILLOT" />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Année</label>
          <input style={{ ...inputStyle, backgroundColor: '#f0f0f0' }} value={form.annee} readOnly />
        </div>
      </div>

      {/* Note moyenne en temps réel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fef6e4', borderRadius: '8px', marginBottom: '20px', border: '2px solid #C8A23A' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#7a5c00' }}>
          🌟 Note moyenne calculée :
        </span>
        <span style={{ fontSize: '24px', fontWeight: '800', color: couleurNote(noteMoyenne) }}>
          {noteMoyenne > 0 ? `${noteMoyenne} / 5` : '— Pas encore noté'}
        </span>
      </div>

      {/* Critères groupés par catégorie */}
      {categories.map(cat => {
        const criteresCategorie = CRITERES_FORMATEUR.filter(c => c.categorie === cat);
        const couleurCat = criteresCategorie[0].couleurCategorie;
        return (
          <div key={cat} style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: couleurCat, marginBottom: '10px', paddingBottom: '6px', borderBottom: `2px solid ${couleurCat}` }}>
              {cat}
            </h4>
            {criteresCategorie.map(crit => {
              const c = form.criteres[crit.cle];
              return (
                <div key={crit.cle} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text, flex: 1 }}>{crit.label}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCritere(crit.cle, 'note', n)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            border: c.note === n ? `2px solid ${couleurCat}` : '1.5px solid #e0e0e0',
                            backgroundColor: c.note === n ? couleurCat : 'white',
                            color: c.note === n ? 'white' : '#666',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                      {c.note > 0 && (
                        <button
                          type="button"
                          onClick={() => setCritere(crit.cle, 'note', 0)}
                          style={{
                            backgroundColor: 'white',
                            border: '1.5px solid #ccc',
                            borderRadius: '6px',
                            padding: '0 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            color: '#888',
                          }}
                          title="Effacer la note"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  {c.note > 0 && (
                    <div style={{ fontSize: '11px', color: couleurNote(c.note), fontWeight: '600', marginBottom: '6px' }}>
                      {LIBELLE_NOTE[c.note]}
                    </div>
                  )}
                  <input
                    type="text"
                    style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                    value={c.commentaire ?? ''}
                    onChange={e => setCritere(crit.cle, 'commentaire', e.target.value)}
                    placeholder="Commentaire (optionnel)"
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Synthèse libre */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>📝 Synthèse de l'évaluation</h4>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>💬 Appréciation globale</label>
          <textarea
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            value={form.appreciationGlobale}
            onChange={e => setForm(p => ({ ...p, appreciationGlobale: e.target.value }))}
            placeholder="Synthèse libre de l'année..."
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>💪 Points forts</label>
          <textarea
            style={{ ...inputStyle, minHeight: '50px', resize: 'vertical' }}
            value={form.pointsForts}
            onChange={e => setForm(p => ({ ...p, pointsForts: e.target.value }))}
            placeholder="Ce qui est particulièrement apprécié..."
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>🎯 Axes d'amélioration</label>
          <textarea
            style={{ ...inputStyle, minHeight: '50px', resize: 'vertical' }}
            value={form.axesAmelioration}
            onChange={e => setForm(p => ({ ...p, axesAmelioration: e.target.value }))}
            placeholder="Points à travailler..."
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>📋 Plan d'amélioration</label>
          <textarea
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            value={form.planAmelioration}
            onChange={e => setForm(p => ({ ...p, planAmelioration: e.target.value }))}
            placeholder="Actions concrètes : formations, accompagnement, objectifs..."
          />
        </div>
      </div>

      {/* Date entretien (optionnelle à ce stade) */}
      <div style={{ backgroundColor: '#e0e7ff', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
        <label style={{ fontSize: '11px', color: '#1e40af', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>📅 Date prévue de l'entretien avec le formateur (optionnel)</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            style={{ ...inputStyle, flex: 1 }}
            value={form.dateEntretien ? dateIsoToFr(form.dateEntretien) : ''}
            placeholder="JJ/MM/AAAA"
            onChange={e => {
              const v = e.target.value;
              if (v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                setForm(p => ({ ...p, dateEntretien: dateFrToIso(v) }));
              } else if (v === '') {
                setForm(p => ({ ...p, dateEntretien: '' }));
              } else {
                setForm(p => ({ ...p, dateEntretien: v }));
              }
            }}
          />
          <input
            type="date"
            style={{ width: '40px', border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '4px', cursor: 'pointer', backgroundColor: 'white' }}
            value={form.dateEntretien && form.dateEntretien.match(/^\d{4}-\d{2}-\d{2}$/) ? form.dateEntretien : ''}
            onChange={e => setForm(p => ({ ...p, dateEntretien: e.target.value }))}
          />
        </div>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnSecondary}>Annuler</button>
        <button
          onClick={() => onSave({ ...form, statut: 'brouillon' })}
          style={{ ...btnSecondary, color: '#7a5c00', borderColor: '#C8A23A' }}
        >
          💾 Enregistrer brouillon
        </button>
        <button
          onClick={() => onSave({ ...form, statut: 'finalisee' })}
          disabled={!form.dateEvaluation || !form.evaluateur}
          style={{
            ...btnPrimary,
            backgroundColor: (form.dateEvaluation && form.evaluateur) ? '#15803d' : '#ccc',
            cursor: (form.dateEvaluation && form.evaluateur) ? 'pointer' : 'not-allowed',
          }}
        >
          ✅ Finaliser l'évaluation
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT : Affichage d'une évaluation existante (lecture)
// ============================================================================

function AffichageEvaluation({
  evaluation,
  onEdit,
  onDelete,
  onSignedUpload,
  onSignedDelete,
  peutEvaluer,
}: {
  evaluation: EvaluationFormateur;
  onEdit: () => void;
  onDelete: () => void;
  onSignedUpload: (file: File) => void;
  onSignedDelete: () => void;
  peutEvaluer: boolean;
}) {
  const statutStyle = STATUT_EVAL_STYLE[evaluation.statut];

  return (
    <div style={{
      backgroundColor: 'white',
      border: `2px solid ${statutStyle.color}`,
      borderRadius: '12px',
      padding: '18px',
      marginBottom: '12px',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.text, marginBottom: '4px' }}>
            Évaluation {evaluation.annee}
          </h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ backgroundColor: statutStyle.bg, color: statutStyle.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
              {statutStyle.emoji} {statutStyle.label}
            </span>
            {evaluation.confidentielle && (
              <span style={{ backgroundColor: '#fde8e8', color: '#c53030', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                🔒 Confidentielle
              </span>
            )}
            <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
              {evaluation.dateEvaluation ? dateIsoToFr(evaluation.dateEvaluation) : '—'} par {evaluation.evaluateur || '—'}
            </span>
          </div>
        </div>
        {/* Note moyenne */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>Note moyenne</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: couleurNote(evaluation.noteMoyenne) }}>
            {evaluation.noteMoyenne > 0 ? `${evaluation.noteMoyenne}/5` : '—'}
          </div>
        </div>
      </div>

      {/* Tableau des critères */}
      <div style={{ backgroundColor: '#fafafa', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>Détail des notes</h4>
        {CRITERES_FORMATEUR.map(crit => {
          const c = evaluation.criteres[crit.cle];
          return (
            <div key={crit.cle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '12px' }}>
              <span style={{ color: '#555', flex: 1 }}>{crit.label}</span>
              {c.note > 0 ? (
                <span style={{ fontWeight: '700', color: couleurNote(c.note), marginLeft: '8px' }}>
                  {c.note}/5
                </span>
              ) : (
                <span style={{ color: '#ccc', marginLeft: '8px' }}>—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Synthèse */}
      {(evaluation.appreciationGlobale || evaluation.pointsForts || evaluation.axesAmelioration || evaluation.planAmelioration) && (
        <div style={{ backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          {evaluation.appreciationGlobale && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px', color: '#666' }}>💬 Appréciation :</strong>
              <div style={{ fontSize: '13px', color: COLORS.text, marginTop: '4px', whiteSpace: 'pre-wrap' }}>{evaluation.appreciationGlobale}</div>
            </div>
          )}
          {evaluation.pointsForts && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px', color: '#15803d' }}>💪 Points forts :</strong>
              <div style={{ fontSize: '13px', color: COLORS.text, marginTop: '4px', whiteSpace: 'pre-wrap' }}>{evaluation.pointsForts}</div>
            </div>
          )}
          {evaluation.axesAmelioration && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px', color: '#C8A23A' }}>🎯 Axes d'amélioration :</strong>
              <div style={{ fontSize: '13px', color: COLORS.text, marginTop: '4px', whiteSpace: 'pre-wrap' }}>{evaluation.axesAmelioration}</div>
            </div>
          )}
          {evaluation.planAmelioration && (
            <div>
              <strong style={{ fontSize: '12px', color: '#7c3aed' }}>📋 Plan d'amélioration :</strong>
              <div style={{ fontSize: '13px', color: COLORS.text, marginTop: '4px', whiteSpace: 'pre-wrap' }}>{evaluation.planAmelioration}</div>
            </div>
          )}
        </div>
      )}

      {/* Date entretien */}
      {evaluation.dateEntretien && (
        <div style={{ fontSize: '12px', color: '#1e40af', backgroundColor: '#e0e7ff', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>
          📅 Entretien prévu le {dateIsoToFr(evaluation.dateEntretien)}
        </div>
      )}

      {/* Évaluation signée (PDF) — visible uniquement si finalisée */}
      {(evaluation.statut === 'finalisee' || evaluation.statut === 'signee') && (
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: evaluation.signatureFormateur ? '#dbeafe' : '#fffbf0', borderRadius: '8px', border: `1.5px solid ${evaluation.signatureFormateur ? '#1e40af' : '#C8A23A'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '22px' }}>{evaluation.signatureFormateur ? '✍️' : '📝'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: evaluation.signatureFormateur ? '#1e40af' : '#7a5c00' }}>
                Évaluation signée par le formateur
              </div>
              {evaluation.signatureFormateur ? (
                <div style={{ fontSize: '12px', color: '#1e40af', marginTop: '4px', fontWeight: '600' }}>
                  📄 {evaluation.signatureFormateur.nom} ({evaluation.signatureFormateur.taille})
                  <span style={{ fontWeight: '400', fontStyle: 'italic', marginLeft: '6px' }}>
                    — Importé le {new Date(evaluation.signatureFormateur.dateImport).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  Importe ici le PDF signé après l'entretien (PDF, JPG, PNG)
                </div>
              )}
            </div>
            {peutEvaluer && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <label style={{
                  backgroundColor: evaluation.signatureFormateur ? 'white' : COLORS.primary,
                  color: evaluation.signatureFormateur ? COLORS.primary : 'white',
                  border: evaluation.signatureFormateur ? `1.5px solid ${COLORS.primary}` : 'none',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>
                  {evaluation.signatureFormateur ? '🔄 Remplacer' : '⬆ Importer'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) onSignedUpload(f);
                  }} />
                </label>
                {evaluation.signatureFormateur && (
                  <button onClick={onSignedDelete} style={{ backgroundColor: 'white', color: '#c53030', border: '1.5px solid #c53030', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {peutEvaluer && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button onClick={onEdit} style={btnSecondary}>✏️ Modifier</button>
          <button onClick={onDelete} style={{ backgroundColor: 'white', color: '#c53030', border: '1.5px solid #c53030', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            🗑️ Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function FicheFormateur({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const formateur = FORMATEURS.find(f => f.id === Number(id));
  const sessions = SESSIONS_FORMATEURS[id] ?? [];

  const { utilisateur, estAdmin } = useAcces();
  // ✅ Seule PAMA (admin) peut évaluer (confidentiel)
  const peutEvaluer = estAdmin;

  const [evaluations, setEvaluations] = useState<EvaluationFormateur[]>([]);
  const [evaluationEnEdition, setEvaluationEnEdition] = useState<EvaluationFormateur | null>(null);

  useEffect(() => {
    if (id) {
      setEvaluations(chargerEvaluationsFormateur(id));
    }
  }, [id]);

  function rechargerEvaluations() {
    setEvaluations(chargerEvaluationsFormateur(id));
  }

  function nouvelleEvaluation() {
    if (!formateur) return;
    const annee = new Date().getFullYear();

    // Vérifier qu'il n'y a pas déjà une évaluation pour cette année
    const existante = chargerEvaluationFormateurAnnee(id, annee);
    if (existante) {
      alert(`Une évaluation pour ${annee} existe déjà. Tu peux la modifier.`);
      setEvaluationEnEdition(existante);
      return;
    }

    const nouvelle = creerEvaluationVide(id, `${formateur.prenom} ${formateur.nom}`, annee);
    setEvaluationEnEdition(nouvelle);
  }

  function modifierEvaluation(evaluation: EvaluationFormateur) {
    setEvaluationEnEdition(evaluation);
  }

  function annulerEdition() {
    setEvaluationEnEdition(null);
  }

  function sauvegarderEvaluationLocale(evaluation: EvaluationFormateur) {
    sauvegarderEvaluation(evaluation, utilisateur);
    rechargerEvaluations();
    setEvaluationEnEdition(null);
  }

  function supprimerEvaluationLocale(evaluation: EvaluationFormateur) {
    if (!confirm(`Supprimer l'évaluation ${evaluation.annee} de ${evaluation.formateurNom} ? Cette action est irréversible.`)) return;
    supprimerEvaluation(evaluation.id);
    rechargerEvaluations();
  }

  function uploadSignature(evaluation: EvaluationFormateur, fichier: File) {
    const taille = fichier.size > 1024 * 1024 ? `${(fichier.size / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(fichier.size / 1024)} Ko`;
    const updated: EvaluationFormateur = {
      ...evaluation,
      signatureFormateur: { nom: fichier.name, taille, dateImport: new Date().toISOString() },
      statut: 'signee',
    };
    sauvegarderEvaluation(updated, utilisateur);
    rechargerEvaluations();
  }

  function supprimerSignature(evaluation: EvaluationFormateur) {
    if (!confirm('Supprimer le PDF signé importé ?')) return;
    const updated: EvaluationFormateur = {
      ...evaluation,
      signatureFormateur: undefined,
      statut: 'finalisee',
    };
    sauvegarderEvaluation(updated, utilisateur);
    rechargerEvaluations();
  }

  if (!formateur) return <div style={{ padding: '32px', color: COLORS.primary }}>Formateur introuvable.</div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <a href="/formateurs" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
          ← Retour aux formateurs
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: COLORS.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: COLORS.primary }}>
            {formateur.prenom[0]}{formateur.nom[0]}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary }}>{formateur.prenom} {formateur.nom}</h1>
            <div style={{ color: COLORS.secondary, fontWeight: '600', fontSize: '14px' }}>{formateur.specialite}</div>
          </div>
          <Badge statut={formateur.statut} />
        </div>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Coordonnées</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[
            { label: 'Email', value: formateur.email },
            { label: 'Téléphone', value: formateur.telephone },
          ].map((info) => (
            <div key={info.label} style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>{info.label}</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: COLORS.text }}>{info.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ====================================================================== */}
      {/* 📊 ÉVALUATION ANNUELLE QUALIOPI — NOUVEAU                             */}
      {/* ====================================================================== */}
      <Card style={{ marginBottom: '24px', borderTop: `4px solid ${COLORS.secondary}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: COLORS.primary, marginBottom: '4px' }}>
              📊 Évaluation annuelle Qualiopi
            </h2>
            <p style={{ fontSize: '12px', color: COLORS.textMuted }}>
              🛡️ Indicateur 22 (Critère 5) — Évaluation des compétences des intervenants — 🔒 Confidentielle
            </p>
          </div>
          {peutEvaluer && !evaluationEnEdition && (
            <button onClick={nouvelleEvaluation} style={btnPrimary}>
              + Nouvelle évaluation
            </button>
          )}
        </div>

        {!peutEvaluer && (
          <div style={{ padding: '12px 14px', backgroundColor: '#fef6e4', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#7a5c00', borderLeft: '4px solid #C8A23A' }}>
            🔒 <strong>Accès restreint</strong> — Seule la direction (PAMA) peut accéder à ces évaluations confidentielles.
          </div>
        )}

        {peutEvaluer && evaluationEnEdition && (
          <FormulaireEvaluation
            evaluation={evaluationEnEdition}
            onSave={sauvegarderEvaluationLocale}
            onCancel={annulerEdition}
            utilisateur={utilisateur}
          />
        )}

        {peutEvaluer && !evaluationEnEdition && evaluations.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px', fontStyle: 'italic', backgroundColor: COLORS.background, borderRadius: '8px' }}>
            Aucune évaluation enregistrée pour ce formateur.
            <br />
            Clique sur <strong>"+ Nouvelle évaluation"</strong> pour créer la première.
          </div>
        )}

        {peutEvaluer && !evaluationEnEdition && evaluations.length > 0 && (
          <div>
            {evaluations.map(evaluation => (
              <AffichageEvaluation
                key={evaluation.id}
                evaluation={evaluation}
                onEdit={() => modifierEvaluation(evaluation)}
                onDelete={() => supprimerEvaluationLocale(evaluation)}
                onSignedUpload={(f) => uploadSignature(evaluation, f)}
                onSignedDelete={() => supprimerSignature(evaluation)}
                peutEvaluer={peutEvaluer}
              />
            ))}
          </div>
        )}
      </Card>

      {/* ====================================================================== */}
      {/* 📈 FORMATIONS CONTINUES — Indicateur 22 Qualiopi                       */}
      {/* ====================================================================== */}
      <Card style={{ marginBottom: '24px', borderTop: `4px solid ${COLORS.secondary}` }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: COLORS.primary, marginBottom: '4px' }}>
            📈 Formations continues du formateur
          </h2>
          <p style={{ fontSize: '12px', color: COLORS.textMuted }}>
            🛡️ Indicateur 22 (Critère 5) — Traçabilité des formations, certifications et veille professionnelle
          </p>
        </div>

        {!peutEvaluer && (
          <div style={{ padding: '12px 14px', backgroundColor: '#fef6e4', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#7a5c00', borderLeft: '4px solid #C8A23A' }}>
            🔒 <strong>Accès restreint</strong> — Seule la direction (PAMA) peut ajouter ou modifier les formations.
          </div>
        )}

        <CardFormationsContinues
          formateurId={id}
          formateurNom={`${formateur.prenom} ${formateur.nom}`}
          peutEditer={peutEvaluer}
          utilisateur={utilisateur}
        />
      </Card>

      {/* Sessions assignées */}
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Sessions assignées ({sessions.length})
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              {['Formation', 'Période', 'Statut'].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>{s.nom}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: COLORS.textMuted }}>{s.periode}</td>
                <td style={{ padding: '12px' }}><Badge statut={s.statut} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
