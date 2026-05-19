'use client';

import { useState, useEffect } from 'react';
import { COLORS } from '../../lib/constants';
import { 
  chargerFormateurs as chargerFormateursSupabase,
  creerFormateur as creerFormateurSupabase,
  modifierFormateur,
  supprimerFormateur as supprimerFormateurSupabase,
} from '../../data/formateursSupabase';
import Card from '../../components/Card';
import { useAcces } from '../../lib/useAcces';
import {
  EvaluationFormateur,
  CRITERES_FORMATEUR,
  CleCritere,
  LIBELLE_NOTE,
  STATUT_EVAL_STYLE,
  chargerEvaluationsFormateur,
  chargerEvaluationFormateurAnnee,
  sauvegarderEvaluation,
  supprimerEvaluation,
  creerEvaluationVide,
  calculerNoteMoyenne,
  couleurNote,
  dateIsoToFr,
  dateFrToIso,
} from '../../data/mockEvaluations';
import BoutonPdfEvaluation from '../../components/BoutonPdfEvaluation';
import CardFormationsContinues from '../../components/CardFormationsContinues';

const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };
const btnPrimary: React.CSSProperties = { backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

const FORMATIONS_CODES = ['SC', 'ARH', 'AD', 'GCF', 'CATL', 'EC', 'CV', 'FPA'];

type PieceJustificative = { nom: string; date: string };

type Intervention = {
  id: string;
  date: string;
  formation: string;
  module: string;
  heures: number;
  type: 'presentiel' | 'distanciel';
  emargement: string;
  sessionId: string;
};

type SuiviMensuel = {
  mois: string;
  heuresPresence: number;
  heuresDistanciel: number;
  montantDu: number;
  facture: string;
  dateFacture: string;
  datePaiement: string;
};

type Formateur = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  siret: string;
  nda: string;
  specialites: string[];
  statut: 'Actif' | 'Inactif' | 'Archivé';
  notes: string;
  interventions: Intervention[];
  suiviMensuel: SuiviMensuel[];
  pieces: {
    cni: PieceJustificative | null;
    cv: PieceJustificative | null;
    kbis: PieceJustificative | null;
    recepisse_nda: PieceJustificative | null;
    attestation: PieceJustificative | null;
    rc_pro: PieceJustificative | null;
    rib: PieceJustificative | null;
    contrat_prestation: PieceJustificative | null;
  };
};

const PIECES_CONFIG = [
  { id: 'cni', label: 'Pièce d\'identité valide', detail: 'CNI recto/verso ou passeport en cours de validité', obligatoire: true },
  { id: 'cv', label: 'CV à jour', detail: 'Curriculum vitae actualisé', obligatoire: true },
  { id: 'kbis', label: 'Extrait KBIS', detail: 'Moins de 3 mois', obligatoire: true },
  { id: 'recepisse_nda', label: 'Récépissé NDA', detail: 'Numéro de déclaration d\'activité', obligatoire: true },
  { id: 'attestation', label: 'Attestation', detail: 'Attestation de compétences ou diplôme', obligatoire: true },
  { id: 'rc_pro', label: 'RC Professionnelle', detail: 'Responsabilité civile professionnelle en cours de validité', obligatoire: true },
  { id: 'rib', label: 'RIB', detail: 'Relevé d\'identité bancaire pour paiement des prestations', obligatoire: true },
  { id: 'contrat_prestation', label: 'Contrat de prestation annuel', detail: 'Contrat signé par les deux parties pour l\'année en cours', obligatoire: true },
];

// ============================================================================
// COMPOSANT : Formulaire de saisie de l'appréciation
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

  useEffect(() => {
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
      criteres: { ...prev.criteres, [cle]: { ...prev.criteres[cle], [champ]: valeur } },
    }));
  }

  const noteMoyenne = calculerNoteMoyenne(form);
  const categories = [...new Set(CRITERES_FORMATEUR.map(c => c.categorie))];

  return (
    <div style={{ backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '16px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68', marginBottom: '12px' }}>
        ✏️ Saisie de l'appréciation {form.annee} — {form.formateurNom}
      </h4>

      <div style={{ padding: '10px 12px', backgroundColor: '#e0f2fe', borderRadius: '8px', marginBottom: '14px', fontSize: '11px', color: '#0c5274', borderLeft: '4px solid #0891b2' }}>
        💡 <strong>Saisis ici les notes données par le formateur</strong> dans son questionnaire papier rempli. Tu peux aussi laisser des cases vides si le formateur n'a pas répondu à tous les points.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', padding: '10px', backgroundColor: 'white', borderRadius: '8px' }}>
        <div>
          <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>📅 Date du retour formateur *</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="text"
              style={{ ...inputStyle, flex: 1, fontSize: '12px' }}
              value={form.dateEvaluation ? dateIsoToFr(form.dateEvaluation) : ''}
              placeholder="JJ/MM/AAAA"
              onChange={e => {
                const v = e.target.value;
                if (v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                  setForm(p => ({ ...p, dateEvaluation: dateFrToIso(v) }));
                } else {
                  setForm(p => ({ ...p, dateEvaluation: v === '' ? '' : v }));
                }
              }}
            />
            <input
              type="date"
              style={{ width: '36px', border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '4px', cursor: 'pointer', backgroundColor: 'white' }}
              value={form.dateEvaluation && form.dateEvaluation.match(/^\d{4}-\d{2}-\d{2}$/) ? form.dateEvaluation : ''}
              onChange={e => setForm(p => ({ ...p, dateEvaluation: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>👤 Saisi par</label>
          <input style={{ ...inputStyle, fontSize: '12px' }} value={form.evaluateur} onChange={e => setForm(p => ({ ...p, evaluateur: e.target.value }))} placeholder="Paméla MAILLOT" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#fef6e4', borderRadius: '8px', marginBottom: '16px', border: '2px solid #C8A23A' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#7a5c00' }}>🌟 Note moyenne donnée par le formateur :</span>
        <span style={{ fontSize: '22px', fontWeight: '800', color: couleurNote(noteMoyenne) }}>
          {noteMoyenne > 0 ? `${noteMoyenne}/5` : '—'}
        </span>
      </div>

      {categories.map(cat => {
        const criteresCategorie = CRITERES_FORMATEUR.filter(c => c.categorie === cat);
        const couleurCat = criteresCategorie[0].couleurCategorie;
        return (
          <div key={cat} style={{ marginBottom: '16px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: '700', color: couleurCat, marginBottom: '8px', paddingBottom: '4px', borderBottom: `2px solid ${couleurCat}` }}>
              {cat}
            </h5>
            {criteresCategorie.map(crit => {
              const c = form.criteres[crit.cle];
              return (
                <div key={crit.cle} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '10px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#333', flex: 1, minWidth: '180px' }}>{crit.label}</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCritere(crit.cle, 'note', n)}
                          style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            border: c.note === n ? `2px solid ${couleurCat}` : '1.5px solid #e0e0e0',
                            backgroundColor: c.note === n ? couleurCat : 'white',
                            color: c.note === n ? 'white' : '#666',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                          }}
                        >{n}</button>
                      ))}
                      {c.note > 0 && (
                        <button
                          type="button"
                          onClick={() => setCritere(crit.cle, 'note', 0)}
                          style={{ backgroundColor: 'white', border: '1.5px solid #ccc', borderRadius: '6px', padding: '0 6px', fontSize: '10px', cursor: 'pointer', color: '#888' }}
                          title="Effacer la note"
                        >✕</button>
                      )}
                    </div>
                  </div>
                  {c.note > 0 && (
                    <div style={{ fontSize: '10px', color: couleurNote(c.note), fontWeight: '600', marginBottom: '4px' }}>
                      {LIBELLE_NOTE[c.note]}
                    </div>
                  )}
                  <input
                    type="text"
                    style={{ ...inputStyle, fontSize: '11px', padding: '5px 8px' }}
                    value={c.commentaire ?? ''}
                    onChange={e => setCritere(crit.cle, 'commentaire', e.target.value)}
                    placeholder="Commentaire du formateur (optionnel)"
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
        <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#006B68', marginBottom: '10px' }}>📝 Retour détaillé du formateur</h5>
        {[
          { label: '💪 Ce qui fonctionne bien', champ: 'pointsForts' as const, placeholder: 'Selon le formateur, ce qui est positif à PAM OI...' },
          { label: '🎯 Ce qui pourrait être amélioré', champ: 'axesAmelioration' as const, placeholder: 'Points à travailler selon le formateur...' },
          { label: '💡 Suggestions concrètes', champ: 'suggestions' as const, placeholder: 'Suggestions d\'amélioration faites par le formateur...' },
        ].map(c => (
          <div key={c.champ} style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>{c.label}</label>
            <textarea
              style={{ ...inputStyle, minHeight: '50px', resize: 'vertical', fontSize: '12px' }}
              value={form[c.champ]}
              onChange={e => setForm(p => ({ ...p, [c.champ]: e.target.value }))}
              placeholder={c.placeholder}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button onClick={onCancel} style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px' }}>Annuler</button>
        <button onClick={() => onSave({ ...form, statut: 'brouillon' })} style={{ ...btnSecondary, color: '#7a5c00', borderColor: '#C8A23A', padding: '6px 12px', fontSize: '12px' }}>
          💾 Brouillon
        </button>
        <button
          onClick={() => onSave({ ...form, statut: 'finalisee' })}
          disabled={!form.dateEvaluation || !form.evaluateur}
          style={{ ...btnPrimary, backgroundColor: (form.dateEvaluation && form.evaluateur) ? '#15803d' : '#ccc', cursor: (form.dateEvaluation && form.evaluateur) ? 'pointer' : 'not-allowed', padding: '6px 12px', fontSize: '12px' }}
        >
          ✅ Finaliser
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT : Affichage d'une appréciation existante
// ============================================================================

function AffichageEvaluation({
  evaluation,
  specialites,
  onEdit,
  onDelete,
  onSignedUpload,
  onSignedDelete,
  peutEvaluer,
}: {
  evaluation: EvaluationFormateur;
  specialites: string[];
  onEdit: () => void;
  onDelete: () => void;
  onSignedUpload: (file: File) => void;
  onSignedDelete: () => void;
  peutEvaluer: boolean;
}) {
  const statutStyle = STATUT_EVAL_STYLE[evaluation.statut];

  return (
    <div style={{ backgroundColor: 'white', border: `2px solid ${statutStyle.color}`, borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#333', marginBottom: '4px' }}>
            Appréciation {evaluation.annee}
          </h4>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ backgroundColor: statutStyle.bg, color: statutStyle.color, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>
              {statutStyle.emoji} {statutStyle.label}
            </span>
            <span style={{ backgroundColor: '#fde8e8', color: '#c53030', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>
              🔒 Confidentielle
            </span>
            <span style={{ fontSize: '11px', color: '#888' }}>
              {evaluation.dateEvaluation ? dateIsoToFr(evaluation.dateEvaluation) : '—'} • saisi par {evaluation.evaluateur || '—'}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>Note CFA</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: couleurNote(evaluation.noteMoyenne) }}>
            {evaluation.noteMoyenne > 0 ? `${evaluation.noteMoyenne}/5` : '—'}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#fafafa', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
        <h5 style={{ fontSize: '10px', fontWeight: '700', color: '#666', marginBottom: '6px', textTransform: 'uppercase' }}>Notes données par le formateur</h5>
        {CRITERES_FORMATEUR.map(crit => {
          const c = evaluation.criteres[crit.cle];
          return (
            <div key={crit.cle} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11px' }}>
              <span style={{ color: '#555', flex: 1 }}>{crit.label}</span>
              {c.note > 0 ? (
                <span style={{ fontWeight: '700', color: couleurNote(c.note), marginLeft: '8px' }}>{c.note}/5</span>
              ) : (
                <span style={{ color: '#ccc', marginLeft: '8px' }}>—</span>
              )}
            </div>
          );
        })}
      </div>

      {(evaluation.pointsForts || evaluation.axesAmelioration || evaluation.suggestions) && (
        <div style={{ backgroundColor: '#f9f9f9', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
          {evaluation.pointsForts && (
            <div style={{ marginBottom: '6px' }}>
              <strong style={{ fontSize: '11px', color: '#15803d' }}>💪 Ce qui fonctionne :</strong>{' '}
              <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{evaluation.pointsForts}</div>
            </div>
          )}
          {evaluation.axesAmelioration && (
            <div style={{ marginBottom: '6px' }}>
              <strong style={{ fontSize: '11px', color: '#C8A23A' }}>🎯 À améliorer :</strong>{' '}
              <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{evaluation.axesAmelioration}</div>
            </div>
          )}
          {evaluation.suggestions && (
            <div>
              <strong style={{ fontSize: '11px', color: '#7c3aed' }}>💡 Suggestions :</strong>{' '}
              <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{evaluation.suggestions}</div>
            </div>
          )}
        </div>
      )}

      {/* Zone import questionnaire signé */}
      <div style={{ padding: '10px', backgroundColor: evaluation.signatureFormateur ? '#dbeafe' : '#fffbf0', borderRadius: '8px', border: `1.5px solid ${evaluation.signatureFormateur ? '#1e40af' : '#C8A23A'}`, marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '20px' }}>{evaluation.signatureFormateur ? '✍️' : '📝'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: evaluation.signatureFormateur ? '#1e40af' : '#7a5c00' }}>
              Questionnaire papier signé par le formateur
            </div>
            {evaluation.signatureFormateur ? (
              <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '2px', fontWeight: '600' }}>
                📄 {evaluation.signatureFormateur.nom} ({evaluation.signatureFormateur.taille})
              </div>
            ) : (
              <div style={{ fontSize: '10px', color: '#888' }}>
                📥 Importe ici le scan du questionnaire papier rempli par le formateur
              </div>
            )}
          </div>
          {peutEvaluer && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <label style={{ backgroundColor: evaluation.signatureFormateur ? 'white' : '#006B68', color: evaluation.signatureFormateur ? '#006B68' : 'white', border: evaluation.signatureFormateur ? '1.5px solid #006B68' : 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                {evaluation.signatureFormateur ? '🔄' : '⬆ Importer scan'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) onSignedUpload(f);
                }} />
              </label>
              {evaluation.signatureFormateur && (
                <button onClick={onSignedDelete} style={{ backgroundColor: 'white', color: '#c53030', border: '1.5px solid #c53030', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {peutEvaluer && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <BoutonPdfEvaluation evaluation={evaluation} specialites={specialites} vierge={true} label="📄 Questionnaire vierge" />
          <BoutonPdfEvaluation evaluation={evaluation} specialites={specialites} vierge={false} label="📊 PDF rempli" />
          <button onClick={onEdit} style={{ ...btnSecondary, padding: '6px 12px', fontSize: '11px' }}>✏️ Modifier</button>
          <button onClick={onDelete} style={{ backgroundColor: 'white', color: '#c53030', border: '1.5px solid #c53030', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>🗑️ Supprimer</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function Formateurs() {
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [selectionne, setSelectionne] = useState<Formateur | null>(null);
  const [modale, setModale] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [form, setForm] = useState<Partial<Formateur>>({ statut: 'Actif', specialites: [], pieces: { cni: null, cv: null, kbis: null, recepisse_nda: null, attestation: null, rc_pro: null, rib: null, contrat_prestation: null } });
  const [ongletFormateur, setOngletFormateur] = useState('pieces');

  const { utilisateur, estAdmin } = useAcces();
  const peutEvaluer = estAdmin;
  const [evaluations, setEvaluations] = useState<EvaluationFormateur[]>([]);
  const [evaluationEnEdition, setEvaluationEnEdition] = useState<EvaluationFormateur | null>(null);

  useEffect(() => {
    if (selectionne) {
      setEvaluations(chargerEvaluationsFormateur(selectionne.id));
      setEvaluationEnEdition(null);
    } else {
      setEvaluations([]);
      setEvaluationEnEdition(null);
    }
  }, [selectionne?.id]);

  useEffect(() => {
    (async () => {
      try {
        const fromSupabase = await chargerFormateursSupabase();
        if (fromSupabase.length > 0) {
          console.log(`[Formateurs] ${fromSupabase.length} formateurs chargés depuis Supabase ✅`);
          setFormateurs(fromSupabase as any[]);
          return;
        }
        console.warn('[Formateurs] Supabase vide, fallback localStorage');
      } catch (e) {
        console.error('[Formateurs] Erreur Supabase, fallback localStorage', e);
      }
      // Fallback localStorage
      try {
        const saved = localStorage.getItem('easycfa_formateurs');
        if (saved) setFormateurs(JSON.parse(saved));
      } catch {}
    })();
  }, []);

  function sauvegarder(liste: Formateur[]) {
    // 1. UI immédiate + localStorage en miroir
    setFormateurs(liste);
    localStorage.setItem('easycfa_formateurs', JSON.stringify(liste));
    // 2. Supabase : on délègue aux fonctions spécifiques (creer/modifier/supprimer)
    //    qui sont appelées en amont. Ici on ne fait QUE le miroir local.
  }

  async function creerFormateur() {
    if (!form.nom || !form.prenom) return;
    const nouveau: Formateur = {
      id: Date.now().toString(),
      nom: form.nom ?? '',
      prenom: form.prenom ?? '',
      telephone: form.telephone ?? '',
      email: form.email ?? '',
      siret: form.siret ?? '',
      nda: form.nda ?? '',
      specialites: form.specialites ?? [],
      statut: form.statut as any ?? 'Actif',
      notes: form.notes ?? '',
      interventions: [],
      suiviMensuel: [],
      pieces: form.pieces ?? { cni: null, cv: null, kbis: null, recepisse_nda: null, attestation: null, rc_pro: null, rib: null, contrat_prestation: null },
    };
    // Supabase d'abord
    const res = await creerFormateurSupabase(nouveau as any);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[Formateurs] ${nouveau.id} créé dans Supabase ✅`);
    // localStorage + UI
    sauvegarder([...formateurs, nouveau]);
    setModale(false);
    setForm({ statut: 'Actif', specialites: [], pieces: { cni: null, cv: null, kbis: null, recepisse_nda: null, attestation: null, rc_pro: null } });
    setSelectionne(nouveau);
  }

  async function mettreAJour(champ: string, valeur: any) {
    if (!selectionne) return;
    const updated = { ...selectionne, [champ]: valeur };
    // Supabase d'abord (uniquement le champ modifié)
    const res = await modifierFormateur(selectionne.id, { [champ]: valeur } as any);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[Formateurs ${selectionne.id}] ${champ} mis à jour dans Supabase ✅`);
    // UI + localStorage
    setSelectionne(updated);
    sauvegarder(formateurs.map(f => f.id === updated.id ? updated : f));
  }

  function importerPiece(pieceId: string, fichier: File) {
    if (!selectionne) return;
    const piece = { nom: fichier.name, date: new Date().toLocaleDateString('fr-FR') };
    const updated = { ...selectionne, pieces: { ...selectionne.pieces, [pieceId]: piece } };
    setSelectionne(updated);
    sauvegarder(formateurs.map(f => f.id === updated.id ? updated : f));
  }

  async function supprimerFormateur(id: string) {
    if (!confirm('Supprimer ce formateur ?')) return;
    // Supabase d'abord
    const res = await supprimerFormateurSupabase(id);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[Formateurs ${id}] Supprimé de Supabase ✅`);
    // UI + localStorage
    sauvegarder(formateurs.filter(f => f.id !== id));
    if (selectionne?.id === id) setSelectionne(null);
  }

  function rechargerEvaluations() {
    if (selectionne) setEvaluations(chargerEvaluationsFormateur(selectionne.id));
  }

  function nouvelleEvaluation() {
    if (!selectionne) return;
    const annee = new Date().getFullYear();
    const existante = chargerEvaluationFormateurAnnee(selectionne.id, annee);
    if (existante) {
      alert(`Une appréciation pour ${annee} existe déjà. Tu peux la modifier.`);
      setEvaluationEnEdition(existante);
      return;
    }
    const nouvelle = creerEvaluationVide(selectionne.id, `${selectionne.prenom} ${selectionne.nom}`, annee);
    setEvaluationEnEdition(nouvelle);
  }

  function sauvegarderEvaluationLocale(evaluation: EvaluationFormateur) {
    sauvegarderEvaluation(evaluation, utilisateur);
    rechargerEvaluations();
    setEvaluationEnEdition(null);
  }

  function supprimerEvaluationLocale(evaluation: EvaluationFormateur) {
    if (!confirm(`Supprimer l'appréciation ${evaluation.annee} ? Cette action est irréversible.`)) return;
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
    if (!confirm('Supprimer le scan du questionnaire signé ?')) return;
    const updated: EvaluationFormateur = {
      ...evaluation,
      signatureFormateur: undefined,
      statut: 'finalisee',
    };
    sauvegarderEvaluation(updated, utilisateur);
    rechargerEvaluations();
  }

  /**
   * Génère un questionnaire vierge directement, sans devoir créer une évaluation au préalable.
   * Utile pour préparer l'envoi initial au formateur.
   */
  async function telechargerQuestionnaireVierge() {
    if (!selectionne) return;
    const annee = new Date().getFullYear();
    let evaluation = chargerEvaluationFormateurAnnee(selectionne.id, annee);
    if (!evaluation) {
      // Crée temporairement une évaluation vide juste pour générer le PDF
      evaluation = creerEvaluationVide(selectionne.id, `${selectionne.prenom} ${selectionne.nom}`, annee);
    }

    // Import dynamique pour éviter de charger jsPDF au démarrage
    const { default: jsPDF } = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default;

    // On simule un clic sur BoutonPdfEvaluation via un état temporaire
    // Plus simple : utiliser le composant directement avec une evaluation temporaire
    // → Le bouton est déjà disponible dans AffichageEvaluation pour les évaluations existantes.
    // Pour le cas "pas encore d'évaluation", on crée une eval vide et on génère.
    sauvegarderEvaluation(evaluation, utilisateur);
    rechargerEvaluations();
    setEvaluationEnEdition(evaluation);
  }

  const formateursFiltres = formateurs.filter(f => {
    const matchStatut = filtreStatut === 'Tous' || f.statut === filtreStatut;
    const matchRecherche = !recherche || (f.nom + ' ' + f.prenom + ' ' + f.email + ' ' + f.specialites.join(' ')).toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchRecherche;
  });

  const nbPiecesOk = (f: Formateur) => PIECES_CONFIG.filter(p => f.pieces[p.id as keyof typeof f.pieces]).length;
  const dossierComplet = (f: Formateur) => nbPiecesOk(f) === PIECES_CONFIG.length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#006B68', marginBottom: '4px' }}>👨‍🏫 Formateurs</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>{formateurs.filter(f => f.statut === 'Actif').length} actif(s) — {formateurs.length} au total</p>
        </div>
        <button onClick={() => setModale(true)} style={btnPrimary}>+ Nouveau formateur</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: formateurs.length, color: '#006B68' },
          { label: 'Actifs', value: formateurs.filter(f => f.statut === 'Actif').length, color: '#16a34a' },
          { label: 'Dossiers complets', value: formateurs.filter(f => dossierComplet(f)).length, color: '#0891b2' },
          { label: 'Dossiers incomplets', value: formateurs.filter(f => !dossierComplet(f) && f.statut === 'Actif').length, color: '#C8A23A' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center', borderTop: '4px solid ' + s.color }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher..." style={{ ...inputStyle, paddingLeft: '32px' }} />
          </div>
          {['Tous', 'Actif', 'Inactif', 'Archivé'].map(s => (
            <button key={s} onClick={() => setFiltreStatut(s)} style={{ ...btnSecondary, backgroundColor: filtreStatut === s ? '#006B68' : 'white', color: filtreStatut === s ? 'white' : '#006B68', padding: '6px 14px', fontSize: '12px' }}>
              {s}
            </button>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: selectionne ? '1fr 1fr' : '1fr', gap: '24px' }}>

        <Card>
          {formateursFiltres.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
              {formateurs.length === 0 ? 'Aucun formateur — cliquez sur "+ Nouveau formateur"' : 'Aucun résultat'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {formateursFiltres.map(f => {
                const complet = dossierComplet(f);
                const nbOk = nbPiecesOk(f);
                const isOpen = selectionne?.id === f.id;
                const statutColor = f.statut === 'Actif' ? '#16a34a' : f.statut === 'Inactif' ? '#C8A23A' : '#888';
                const statutBg = f.statut === 'Actif' ? '#dcfce7' : f.statut === 'Inactif' ? '#fef6e4' : '#f0f0f0';
                return (
                  <div key={f.id} onClick={() => { setSelectionne(isOpen ? null : f); setModeEdition(false); }} style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid ' + (isOpen ? '#006B68' : '#e0e0e0'), backgroundColor: isOpen ? '#EAF4F3' : 'white', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#EAF4F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#006B68', flexShrink: 0 }}>
                          {f.prenom[0]}{f.nom[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>{f.prenom} {f.nom}</div>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{f.email}</div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {f.specialites.map(s => (
                              <span key={s} style={{ backgroundColor: '#EAF4F3', color: '#006B68', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: '600' }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ backgroundColor: statutBg, color: statutColor, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>{f.statut}</span>
                        <span style={{ fontSize: '10px', color: complet ? '#16a34a' : '#C8A23A', fontWeight: '600' }}>
                          {complet ? '✅ Dossier complet' : `📎 ${nbOk}/${PIECES_CONFIG.length} pièces`}
                        </span>
                        <button onClick={e => { e.stopPropagation(); supprimerFormateur(f.id); }} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {selectionne && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#EAF4F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#006B68' }}>
                    {selectionne.prenom[0]}{selectionne.nom[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#006B68' }}>{selectionne.prenom} {selectionne.nom}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{selectionne.specialites.join(' • ')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setModeEdition(!modeEdition)} style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px', backgroundColor: modeEdition ? '#006B68' : 'white', color: modeEdition ? 'white' : '#006B68' }}>
                    {modeEdition ? '✏️ Édition...' : '✏️ Modifier'}
                  </button>
                  {modeEdition && (
                    <button onClick={() => setModeEdition(false)} style={{ ...btnPrimary, padding: '6px 12px', fontSize: '12px' }}>✅ OK</button>
                  )}
                  <button onClick={() => setSelectionne(null)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Statut</label>
                <select value={selectionne.statut} onChange={e => mettreAJour('statut', e.target.value)} style={inputStyle}>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="Archivé">Archivé</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                {[
                  { label: 'Nom', champ: 'nom' },
                  { label: 'Prénom', champ: 'prenom' },
                  { label: 'Téléphone', champ: 'telephone' },
                  { label: 'Email', champ: 'email' },
                  { label: 'N° SIRET', champ: 'siret' },
                  { label: 'N° NDA', champ: 'nda' },
                ].map(f => (
                  <div key={f.champ}>
                    <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '2px' }}>{f.label}</label>
                    {modeEdition ? (
                      <input style={inputStyle} value={(selectionne as any)[f.champ] ?? ''} onChange={e => mettreAJour(f.champ, e.target.value)} />
                    ) : (
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', padding: '6px 0' }}>{(selectionne as any)[f.champ] || '—'}</div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Formations dispensées</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {FORMATIONS_CODES.map(code => {
                    const actif = selectionne.specialites.includes(code);
                    return (
                      <button key={code} onClick={() => {
                        if (!modeEdition) return;
                        const updated = actif ? selectionne.specialites.filter(s => s !== code) : [...selectionne.specialites, code];
                        mettreAJour('specialites', updated);
                      }} style={{ backgroundColor: actif ? '#006B68' : '#f0f0f0', color: actif ? 'white' : '#555', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: modeEdition ? 'pointer' : 'default' }}>
                        {code}
                      </button>
                    );
                  })}
                </div>
                {modeEdition && <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>Cliquez pour activer/désactiver</div>}
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Notes</label>
                {modeEdition ? (
                  <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={selectionne.notes ?? ''} onChange={e => mettreAJour('notes', e.target.value)} />
                ) : (
                  <div style={{ fontSize: '12px', color: '#555', padding: '6px 0' }}>{selectionne.notes || '—'}</div>
                )}
              </div>
            </Card>

            <Card style={{ padding: '0' }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #EAF4F3', overflowX: 'auto' }}>
                {[
                  { id: 'interventions', label: '📅 Interventions' },
                  { id: 'suivi', label: '📊 Suivi mensuel' },
                  { id: 'pieces', label: '📎 Pièces justificatives' },
                  { id: 'evaluation', label: '💬 Appréciation formateur' },
                  { id: 'formations_continues', label: '📈 Formations continues' },
                ].map(o => (
                  <button key={o.id} onClick={() => setOngletFormateur(o.id)} style={{ flex: 1, padding: '12px 8px', fontSize: '11px', fontWeight: '600', border: 'none', borderBottom: ongletFormateur === o.id ? '3px solid #006B68' : '3px solid transparent', backgroundColor: 'white', color: ongletFormateur === o.id ? '#006B68' : '#888', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {o.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '16px' }}>
              {ongletFormateur === 'interventions' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>Sessions animées</h3>
                    <button onClick={() => {
                      const nouv: Intervention = { id: Date.now().toString(), date: '', formation: '', module: '', heures: 0, type: 'presentiel', emargement: '', sessionId: '' };
                      mettreAJour('interventions', [...(selectionne.interventions || []), nouv]);
                    }} style={{ ...btnPrimary, padding: '5px 10px', fontSize: '11px' }}>+ Ajouter</button>
                  </div>
                  {(selectionne.interventions || []).length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>Aucune intervention enregistrée</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(selectionne.interventions || []).map(iv => {
                        const tarif = iv.type === 'presentiel' ? 30 : 18;
                        const montant = iv.heures * tarif;
                        return (
                          <div key={iv.id} style={{ backgroundColor: '#fafafa', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                              {[
                                { label: 'Date', champ: 'date', type: 'text', placeholder: 'JJ/MM/AAAA' },
                                { label: 'Formation', champ: 'formation', type: 'select' },
                                { label: 'Module/CCP', champ: 'module', type: 'text', placeholder: 'ex: CCP1 - Comptabilité' },
                              ].map(f => (
                                <div key={f.champ}>
                                  <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>{f.label}</label>
                                  {f.type === 'select' ? (
                                    <select style={{ ...inputStyle, fontSize: '11px', padding: '4px 6px' }} value={iv[f.champ as keyof Intervention] as string} onChange={e => {
                                      const updated = (selectionne.interventions || []).map(i => i.id === iv.id ? { ...i, [f.champ]: e.target.value } : i);
                                      mettreAJour('interventions', updated);
                                    }}>
                                      <option value="">Choisir...</option>
                                      {selectionne.specialites.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  ) : (
                                    <input type="text" placeholder={f.placeholder} style={{ ...inputStyle, fontSize: '11px', padding: '4px 6px' }} value={iv[f.champ as keyof Intervention] as string} onChange={e => {
                                      const updated = (selectionne.interventions || []).map(i => i.id === iv.id ? { ...i, [f.champ]: e.target.value } : i);
                                      mettreAJour('interventions', updated);
                                    }} />
                                  )}
                                </div>
                              ))}
                              <div>
                                <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Nb heures</label>
                                <input type="number" step="0.5" style={{ ...inputStyle, fontSize: '11px', padding: '4px 6px' }} value={iv.heures} onChange={e => {
                                  const updated = (selectionne.interventions || []).map(i => i.id === iv.id ? { ...i, heures: parseFloat(e.target.value) || 0 } : i);
                                  mettreAJour('interventions', updated);
                                }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Type</label>
                                <select style={{ ...inputStyle, fontSize: '11px', padding: '4px 6px' }} value={iv.type} onChange={e => {
                                  const updated = (selectionne.interventions || []).map(i => i.id === iv.id ? { ...i, type: e.target.value as any } : i);
                                  mettreAJour('interventions', updated);
                                }}>
                                  <option value="presentiel">Présentiel — 30€/h</option>
                                  <option value="distanciel">Distanciel — 18€/h</option>
                                </select>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Montant</label>
                                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#006B68', padding: '4px 0' }}>{montant.toLocaleString('fr-FR')} €</div>
                                </div>
                                <button onClick={() => mettreAJour('interventions', (selectionne.interventions || []).filter(i => i.id !== iv.id))} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <label style={{ backgroundColor: iv.emargement ? '#e6f4f1' : '#f0f0f0', color: iv.emargement ? '#006B68' : '#555', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {iv.emargement ? `✅ ${iv.emargement}` : '📎 Importer feuille émargement'}
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                                  const f = ev.target.files?.[0];
                                  if (f) {
                                    const updated = (selectionne.interventions || []).map(i => i.id === iv.id ? { ...i, emargement: f.name } : i);
                                    mettreAJour('interventions', updated);
                                  }
                                }} />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ backgroundColor: '#006B68', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>Total — {(selectionne.interventions || []).reduce((s, i) => s + i.heures, 0)}h</span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#C8A23A' }}>
                          {(selectionne.interventions || []).reduce((s, i) => s + i.heures * (i.type === 'presentiel' ? 30 : 18), 0).toLocaleString('fr-FR')} €
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {ongletFormateur === 'suivi' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>Suivi mensuel des heures et paiements</h3>
                    <button onClick={() => {
                      const mois = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                      const hP = (selectionne.interventions || []).filter(i => i.type === 'presentiel').reduce((s, i) => s + i.heures, 0);
                      const hD = (selectionne.interventions || []).filter(i => i.type === 'distanciel').reduce((s, i) => s + i.heures, 0);
                      const montant = hP * 30 + hD * 18;
                      const nouv: SuiviMensuel = { mois, heuresPresence: hP, heuresDistanciel: hD, montantDu: montant, facture: '', dateFacture: '', datePaiement: '' };
                      mettreAJour('suiviMensuel', [...(selectionne.suiviMensuel || []), nouv]);
                    }} style={{ ...btnPrimary, padding: '5px 10px', fontSize: '11px' }}>+ Ajouter mois</button>
                  </div>
                  {(selectionne.suiviMensuel || []).length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>Aucun suivi mensuel</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(selectionne.suiviMensuel || []).map((sm, idx) => (
                        <div key={idx} style={{ backgroundColor: sm.datePaiement ? '#e6f4f1' : '#fafafa', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${sm.datePaiement ? '#006B68' : '#e0e0e0'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>{sm.mois}</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed' }}>{sm.heuresPresence}h présentiel + {sm.heuresDistanciel}h distanciel</span>
                              <span style={{ fontSize: '13px', fontWeight: '800', color: '#006B68' }}>{sm.montantDu.toLocaleString('fr-FR')} €</span>
                              <button onClick={() => mettreAJour('suiviMensuel', (selectionne.suiviMensuel || []).filter((_, i) => i !== idx))} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {[
                              { label: 'N° Facture', champ: 'facture', type: 'text' },
                              { label: 'Date facture', champ: 'dateFacture', type: 'text', placeholder: 'JJ/MM/AAAA' },
                              { label: 'Date paiement', champ: 'datePaiement', type: 'text', placeholder: 'JJ/MM/AAAA' },
                            ].map(f => (
                              <div key={f.champ}>
                                <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>{f.label}</label>
                                <input type="text" placeholder={(f as any).placeholder || ''} style={{ ...inputStyle, fontSize: '11px', padding: '4px 6px' }} value={(sm as any)[f.champ] ?? ''} onChange={e => {
                                  const updated = (selectionne.suiviMensuel || []).map((s, i) => i === idx ? { ...s, [f.champ]: e.target.value } : s);
                                  mettreAJour('suiviMensuel', updated);
                                }} />
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <label style={{ backgroundColor: sm.facture ? '#e6f4f1' : '#f0f0f0', color: sm.facture ? '#006B68' : '#555', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>
                              {sm.facture ? `✅ Facture importée` : '📎 Importer facture formateur'}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                                const f = ev.target.files?.[0];
                                if (f) {
                                  const updated = (selectionne.suiviMensuel || []).map((s, i) => i === idx ? { ...s, facture: f.name } : s);
                                  mettreAJour('suiviMensuel', updated);
                                }
                              }} />
                            </label>
                          </div>
                        </div>
                      ))}
                      <div style={{ backgroundColor: '#006B68', borderRadius: '8px', padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {[
                          { label: 'Total heures', value: (selectionne.suiviMensuel || []).reduce((s, m) => s + m.heuresPresence + m.heuresDistanciel, 0) + 'h' },
                          { label: 'Total dû', value: (selectionne.suiviMensuel || []).reduce((s, m) => s + m.montantDu, 0).toLocaleString('fr-FR') + ' €' },
                          { label: 'Payé', value: (selectionne.suiviMensuel || []).filter(m => m.datePaiement).reduce((s, m) => s + m.montantDu, 0).toLocaleString('fr-FR') + ' €' },
                        ].map(t => (
                          <div key={t.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '2px' }}>{t.label}</div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#C8A23A' }}>{t.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {ongletFormateur === 'pieces' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>📎 Pièces justificatives</h3>
                    <span style={{ fontSize: '12px', color: dossierComplet(selectionne) ? '#16a34a' : '#C8A23A', fontWeight: '600' }}>
                      {nbPiecesOk(selectionne)}/{PIECES_CONFIG.length} pièces
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PIECES_CONFIG.map(piece => {
                      const fichier = selectionne.pieces[piece.id as keyof typeof selectionne.pieces];
                      return (
                        <div key={piece.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', backgroundColor: fichier ? '#e6f4f1' : '#fffbf0', border: `1px solid ${fichier ? '#006B68' : '#C8A23A'}` }}>
                          <span style={{ fontSize: '18px', flexShrink: 0 }}>{fichier ? '✅' : '⚠️'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: fichier ? '#006B68' : '#333' }}>{piece.label}</div>
                            <div style={{ fontSize: '10px', color: '#888' }}>{fichier ? `${fichier.nom} — importé le ${fichier.date}` : piece.detail}</div>
                          </div>
                          <label style={{ backgroundColor: fichier ? 'white' : '#006B68', color: fichier ? '#006B68' : 'white', border: fichier ? '1px solid #006B68' : 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {fichier ? '🔄 Remplacer' : '⬆ Importer'}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                              const f = ev.target.files?.[0];
                              if (f) importerPiece(piece.id, f);
                            }} />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {ongletFormateur === 'evaluation' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>💬 Appréciation du formateur sur PAM OI</h3>
                      <p style={{ fontSize: '10px', color: '#888' }}>🛡️ Indicateur 31 — Recueil des appréciations des parties prenantes — 🔒 Confidentielle</p>
                    </div>
                    {peutEvaluer && !evaluationEnEdition && (
                      <button onClick={nouvelleEvaluation} style={{ ...btnPrimary, padding: '6px 12px', fontSize: '12px' }}>+ Nouvelle appréciation</button>
                    )}
                  </div>

                  {peutEvaluer && !evaluationEnEdition && evaluations.length === 0 && (
                    <div style={{ padding: '14px', backgroundColor: '#e0f2fe', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: '#0c5274', borderLeft: '4px solid #0891b2' }}>
                      💡 <strong>Workflow Qualiopi recommandé :</strong>
                      <ol style={{ marginTop: '6px', paddingLeft: '20px' }}>
                        <li>Crée une nouvelle appréciation pour générer le questionnaire vierge</li>
                        <li>Imprime-le et donne-le au formateur (ou envoie-le par email)</li>
                        <li>Le formateur le remplit et te le retourne signé</li>
                        <li>Tu saisis ses notes dans EasyCFA + tu importes le scan signé</li>
                        <li>Statut "Reçue signée" — Prêt pour audit Qualiopi ✅</li>
                      </ol>
                    </div>
                  )}

                  {!peutEvaluer && (
                    <div style={{ padding: '12px 14px', backgroundColor: '#fef6e4', borderRadius: '8px', fontSize: '12px', color: '#7a5c00', borderLeft: '4px solid #C8A23A' }}>
                      🔒 <strong>Accès restreint</strong> — Seule la direction (PAMA) peut accéder à ces appréciations confidentielles.
                    </div>
                  )}

                  {peutEvaluer && evaluationEnEdition && (
                    <FormulaireEvaluation
                      evaluation={evaluationEnEdition}
                      onSave={sauvegarderEvaluationLocale}
                      onCancel={() => setEvaluationEnEdition(null)}
                      utilisateur={utilisateur}
                    />
                  )}

                  {peutEvaluer && !evaluationEnEdition && evaluations.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px', fontStyle: 'italic', backgroundColor: '#EAF4F3', borderRadius: '8px' }}>
                      Aucune appréciation enregistrée pour {selectionne.prenom} {selectionne.nom}.
                      <br />
                      Clique sur <strong>"+ Nouvelle appréciation"</strong> pour démarrer.
                    </div>
                  )}

                  {peutEvaluer && !evaluationEnEdition && evaluations.length > 0 && (
                    <div>
                      {evaluations.map(evaluation => (
                        <AffichageEvaluation
                          key={evaluation.id}
                          evaluation={evaluation}
                          specialites={selectionne.specialites || []}
                          onEdit={() => setEvaluationEnEdition(evaluation)}
                          onDelete={() => supprimerEvaluationLocale(evaluation)}
                          onSignedUpload={(f) => uploadSignature(evaluation, f)}
                          onSignedDelete={() => supprimerSignature(evaluation)}
                          peutEvaluer={peutEvaluer}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            </Card>
          {ongletFormateur === 'formations_continues' && (
                <div>
                  <div style={{ marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>📈 Formations continues du formateur</h3>
                    <p style={{ fontSize: '10px', color: '#888' }}>🛡️ Indicateur 22 — Traçabilité des formations, certifications et veille professionnelle</p>
                  </div>

                  <CardFormationsContinues
                    formateurId={String(selectionne.id)}
                    formateurNom={`${selectionne.prenom} ${selectionne.nom}`}
                    peutEditer={peutEvaluer}
                    utilisateur={utilisateur}
                  />
                </div>
              )}
          </div>
        )}
      </div>

      {modale && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '520px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#006B68', marginBottom: '20px' }}>+ Nouveau formateur</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Nom *', champ: 'nom' },
                  { label: 'Prénom *', champ: 'prenom' },
                  { label: 'Téléphone', champ: 'telephone' },
                  { label: 'Email', champ: 'email' },
                  { label: 'N° SIRET', champ: 'siret' },
                  { label: 'N° NDA', champ: 'nda' },
                ].map(f => (
                  <div key={f.champ}>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                    <input style={inputStyle} value={(form as any)[f.champ] ?? ''} onChange={e => setForm(p => ({ ...p, [f.champ]: e.target.value }))} />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Formations dispensées</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {FORMATIONS_CODES.map(code => {
                    const actif = (form.specialites || []).includes(code);
                    return (
                      <button key={code} type="button" onClick={() => {
                        const updated = actif ? (form.specialites || []).filter(s => s !== code) : [...(form.specialites || []), code];
                        setForm(p => ({ ...p, specialites: updated }));
                      }} style={{ backgroundColor: actif ? '#006B68' : '#f0f0f0', color: actif ? 'white' : '#555', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Notes</label>
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setModale(false)} style={btnSecondary}>Annuler</button>
              <button onClick={creerFormateur} disabled={!form.nom || !form.prenom} style={{ ...btnPrimary, opacity: !form.nom || !form.prenom ? 0.5 : 1 }}>
                ✅ Créer le formateur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
