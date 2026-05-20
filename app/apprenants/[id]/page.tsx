'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { APPRENANTS_REELS, DERNIERE_SITUATION_SIFA, verifierConformiteSifa, estMineur } from '../../../data/mockApprenants_reels';
import { ENTREPRISES_REELS } from '../../../data/mockEntreprises_reels';
import { SESSIONS } from '../../../data/mockData';
import { COLORS } from '../../../lib/constants';
import { chargerApprenti, creerApprenti, modifierApprenti, supprimerApprenti as supprimerApprentiSupabase } from '../../../data/apprentisSupabase';
import Card from '../../../components/Card';
import { useAcces } from '../../../lib/useAcces';
import dynamic from 'next/dynamic';
import BoutonSupprimer from '../../../components/BoutonSupprimer';
import {
  Entretien,
  TypeEntretien,
  LIBELLE_TYPE,
  LIBELLE_TYPE_LONG,
  INDICATEUR_QUALIOPI,
  STATUT_STYLE,
  MOTIFS_NON_FAIT,
  chargerOuCreerEntretiensApprenant,
  sauvegarderEntretien,
  supprimerEntretiensApprenant,
  calculerStatut,
  dateIsoToFr,
  dateFrToIso,
} from '../../../data/mockEntretiens';
import { creerEntretien as creerEntretienSupabase } from '../../../data/entretiensSupabase';
const BoutonPdfRupture = dynamic(() => import('../../../components/BoutonPdfRupture'), { ssr: false });

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnDanger: React.CSSProperties = { backgroundColor: 'white', color: '#e53e3e', border: '1.5px solid #e53e3e', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };

function trouverApprenant(id: string): any | null {
  if (typeof window === 'undefined') {
    return (APPRENANTS_REELS as any[]).find(a => a.id === id) || null;
  }
  try {
    const liste = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
    const trouve = liste.find((a: any) => a.id === id);
    if (trouve) {
      try {
        const fiche = localStorage.getItem(`apprenant_${id}`);
        if (fiche) return { ...trouve, ...JSON.parse(fiche) };
      } catch {}
      return trouve;
    }
  } catch {}

  const mockA = (APPRENANTS_REELS as any[]).find(a => a.id === id);
  if (mockA) {
    try {
      const fiche = localStorage.getItem(`apprenant_${id}`);
      if (fiche) return { ...mockA, ...JSON.parse(fiche) };
    } catch {}
    return mockA;
  }

  try {
    const fiche = localStorage.getItem(`apprenant_${id}`);
    if (fiche) return JSON.parse(fiche);
  } catch {}

  return null;
}

function chargerEntreprises(): string[] {
  const set = new Set<string>();
  // 1. Entreprises du seed (mock)
  (ENTREPRISES_REELS as any[]).forEach((e: any) => { if (e.raisonSociale && e.raisonSociale.trim()) set.add(e.raisonSociale.trim()); });
  if (typeof window === 'undefined') return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  // 2. Entreprises persistées (nouvelles créées via /entreprises/nouvelle)
  try {
    const ents = JSON.parse(localStorage.getItem('easycfa_entreprises_v2') || '[]');
    ents.forEach((e: any) => { if (e.raisonSociale && e.raisonSociale.trim()) set.add(e.raisonSociale.trim()); });
  } catch {}
  // 2. Anciennes entreprises issues des APC (rétrocompatibilité)
  try {
    const apcs = JSON.parse(localStorage.getItem('easycfa_apcs_v2') || '[]');
    apcs.forEach((apc: any) => {
      const nom = apc.entrepriseNom || apc.entreprise;
      if (nom && typeof nom === 'string' && nom.trim()) set.add(nom.trim());
    });
  } catch {}
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
}

function chargerSessions(): any[] {
  if (typeof window === 'undefined') return SESSIONS as any[];
  try {
    const saved = localStorage.getItem('easycfa_sessions_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return SESSIONS as any[];
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: (!value || value === '—') ? '#ccc' : COLORS.text, textAlign: 'right', maxWidth: '65%' }}>{value || '—'}</span>
    </div>
  );
}

function Champ({ label, champ, form, setForm, type = 'text', placeholder = '' }: { label: string; champ: string; form: any; setForm: any; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>{label}</label>
      <input type={type} style={inputStyle} value={form[champ] ?? ''} placeholder={placeholder} onChange={e => setForm((prev: any) => ({ ...prev, [champ]: e.target.value }))} />
    </div>
  );
}

function ChampSelect({ label, champ, form, setForm, options }: { label: string; champ: string; form: any; setForm: any; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>{label}</label>
      <select style={inputStyle} value={form[champ] ?? ''} onChange={e => setForm((prev: any) => ({ ...prev, [champ]: e.target.value }))}>
        <option value="">— Non renseigné —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ============================================================================
// COMPOSANT ENTRETIEN
// ============================================================================

function CardEntretien({
  entretien,
  apprenantNom,
  peutModifierEntretien,
  utilisateur,
  onSave,
}: {
  entretien: Entretien;
  apprenantNom: string;
  peutModifierEntretien: boolean;
  utilisateur: any;
  onSave: (e: Entretien) => void;
}) {
  const [mode, setMode] = useState<'lecture' | 'edition' | 'nonFait'>('lecture');
  const [form, setForm] = useState<Entretien>(entretien);

  React.useEffect(() => {
    setForm(entretien);
  }, [entretien.id, entretien.statut, entretien.dateEffective]);

  const style = STATUT_STYLE[entretien.statut];

  function marquerCommeFait() {
    setForm({
      ...entretien,
      dateEffective: entretien.dateEffective || new Date().toISOString().slice(0, 10),
      realisePar: entretien.realisePar || (utilisateur ? `${utilisateur.prenom ?? ''} ${utilisateur.nom ?? ''}`.trim() : ''),
      supportUtilise: entretien.supportUtilise || {
        livretApprentissage: true, // ✅ Livret pré-coché car SEUL support officiel
      },
      presents: entretien.presents || {
        apprenti: true,
        formateur: false,
        maitreApprentissage: false,
        employeur: false,
        responsableLegal: false,
      },
    });
    setMode('edition');
  }

  function marquerCommeNonFait() {
    setForm({
      ...entretien,
      motifNonFait: entretien.motifNonFait || '',
    });
    setMode('nonFait');
  }

  function sauvegarder() {
    const final: Entretien = {
      ...form,
      statut: 'fait',
      modifiePar: utilisateur?.identifiant ?? 'inconnu',
    };
    onSave(final);
    setMode('lecture');
  }

  function sauvegarderNonFait() {
    if (!form.motifNonFait?.trim()) {
      alert('⚠️ Merci de sélectionner un motif.');
      return;
    }
    const final: Entretien = {
      ...form,
      statut: 'nonFait',
      modifiePar: utilisateur?.identifiant ?? 'inconnu',
    };
    onSave(final);
    setMode('lecture');
  }

  function reouvrir() {
    if (!confirm('Réouvrir cet entretien ? Le statut sera remis à "à faire" et les données saisies seront conservées.')) return;
    const final: Entretien = {
      ...entretien,
      statut: calculerStatut({ ...entretien, statut: 'aprevoir' }),
    };
    onSave(final);
  }

  // ✅ NOUVEAU — Upload du livret signé (utilisable après l'entretien)
  function uploadLivretSigne(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const taille = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(f.size / 1024)} Ko`;
    const livretSigne = { nom: f.name, taille, dateImport: new Date().toISOString() };
    const updated: Entretien = {
      ...entretien,
      supportUtilise: {
        ...(entretien.supportUtilise || { livretApprentissage: true }),
        livretSigne,
      },
      modifiePar: utilisateur?.identifiant ?? 'inconnu',
    };
    onSave(updated);
  }

  function supprimerLivretSigne() {
    if (!confirm('Supprimer le livret signé importé ?')) return;
    const updated: Entretien = {
      ...entretien,
      supportUtilise: {
        ...(entretien.supportUtilise || { livretApprentissage: true }),
        livretSigne: undefined,
      },
      modifiePar: utilisateur?.identifiant ?? 'inconnu',
    };
    onSave(updated);
  }

  return (
    <div style={{
      backgroundColor: 'white',
      border: `2px solid ${style.color}`,
      borderRadius: '12px',
      padding: '18px',
      marginBottom: '12px',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.text }}>
              {LIBELLE_TYPE[entretien.type]}
            </h3>
            <span style={{
              backgroundColor: style.bg,
              color: style.color,
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
            }}>
              {style.emoji} {style.label}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: COLORS.textMuted, fontStyle: 'italic' }}>
            🛡️ {INDICATEUR_QUALIOPI[entretien.type]}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>📅 Date prévue</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.text, marginTop: '2px' }}>
            {entretien.datePrevue ? dateIsoToFr(entretien.datePrevue) : '— (dates contrat manquantes)'}
          </div>
        </div>
        <div style={{ backgroundColor: entretien.dateEffective ? '#dcfce7' : '#f5f5f5', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
            {entretien.statut === 'nonFait' ? '❌ Non effectué' : '✅ Date effective'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: entretien.dateEffective ? '#15803d' : '#ccc', marginTop: '2px' }}>
            {entretien.dateEffective ? dateIsoToFr(entretien.dateEffective) : entretien.statut === 'nonFait' ? `Motif: ${entretien.motifNonFait}` : '— En attente'}
          </div>
        </div>
      </div>

      {/* === MODE LECTURE === */}
      {mode === 'lecture' && (
        <>
          {entretien.statut === 'fait' && (
            <div style={{ backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ fontSize: '12px', color: '#666' }}>👤 Réalisé par :</strong>{' '}
                <span style={{ fontSize: '13px' }}>{entretien.realisePar || '—'}</span>
              </div>
              {entretien.supportUtilise?.livretApprentissage && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '12px', color: '#666' }}>📓 Support :</strong>{' '}
                  <span style={{ fontSize: '13px' }}>📘 Livret d'apprentissage</span>
                </div>
              )}
              {entretien.presents && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '12px', color: '#666' }}>👥 Présents :</strong>{' '}
                  <span style={{ fontSize: '13px' }}>
                    {[
                      entretien.presents.apprenti && 'Apprenti',
                      entretien.presents.formateur && 'Formateur',
                      entretien.presents.maitreApprentissage && 'Maître d\'apprentissage',
                      entretien.presents.employeur && 'Employeur',
                      entretien.presents.responsableLegal && 'Responsable légal',
                    ].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              )}
              {entretien.notes && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '12px', color: '#666' }}>📝 Notes :</strong>
                  <div style={{ fontSize: '13px', color: COLORS.text, marginTop: '4px', whiteSpace: 'pre-wrap' }}>{entretien.notes}</div>
                </div>
              )}
              {entretien.decisions && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '12px', color: '#666' }}>🎯 Décisions :</strong>
                  <div style={{ fontSize: '13px', color: COLORS.text, marginTop: '4px', whiteSpace: 'pre-wrap' }}>{entretien.decisions}</div>
                </div>
              )}

              {/* ✅ Livret signé — visible après que l'entretien est marqué effectué */}
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: entretien.supportUtilise?.livretSigne ? '#e6f4f1' : '#fffbf0', borderRadius: '8px', border: `1.5px solid ${entretien.supportUtilise?.livretSigne ? '#006B68' : '#C8A23A'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '22px' }}>{entretien.supportUtilise?.livretSigne ? '✅' : '📘'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: entretien.supportUtilise?.livretSigne ? COLORS.primary : '#7a5c00' }}>
                      Livret d'apprentissage signé
                    </div>
                    {entretien.supportUtilise?.livretSigne ? (
                      <div style={{ fontSize: '12px', color: COLORS.primary, marginTop: '4px', fontWeight: '600' }}>
                        📄 {entretien.supportUtilise.livretSigne.nom} ({entretien.supportUtilise.livretSigne.taille})
                        <span style={{ fontWeight: '400', fontStyle: 'italic', marginLeft: '6px' }}>
                          — Importé le {new Date(entretien.supportUtilise.livretSigne.dateImport).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        Importe ici le livret signé après l'entretien (PDF, JPG, PNG — Max 5 Mo)
                      </div>
                    )}
                  </div>
                  {peutModifierEntretien && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <label style={{
                        backgroundColor: entretien.supportUtilise?.livretSigne ? 'white' : COLORS.primary,
                        color: entretien.supportUtilise?.livretSigne ? COLORS.primary : 'white',
                        border: entretien.supportUtilise?.livretSigne ? `1.5px solid ${COLORS.primary}` : 'none',
                        borderRadius: '8px',
                        padding: '7px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}>
                        {entretien.supportUtilise?.livretSigne ? '🔄 Remplacer' : '⬆ Importer'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={uploadLivretSigne} />
                      </label>
                      {entretien.supportUtilise?.livretSigne && (
                        <button onClick={supprimerLivretSigne} style={{ backgroundColor: 'white', color: '#c53030', border: '1.5px solid #c53030', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {entretien.statut === 'nonFait' && (
            <div style={{ backgroundColor: '#fef2f2', borderRadius: '8px', padding: '12px', marginBottom: '12px', borderLeft: '3px solid #c53030' }}>
              <strong style={{ fontSize: '12px', color: '#c53030' }}>❌ Motif :</strong>{' '}
              <span style={{ fontSize: '13px' }}>{entretien.motifNonFait}</span>
              {entretien.dateReport && (
                <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                  📅 Reporté au {dateIsoToFr(entretien.dateReport)}
                </div>
              )}
              {entretien.notes && (
                <div style={{ fontSize: '13px', color: COLORS.text, marginTop: '8px', whiteSpace: 'pre-wrap' }}>{entretien.notes}</div>
              )}
            </div>
          )}

          {peutModifierEntretien && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {entretien.statut !== 'fait' && entretien.statut !== 'nonFait' && (
                <>
                  <button onClick={marquerCommeFait} style={{ ...btnPrimary, backgroundColor: '#15803d' }}>
                    ✅ Marquer comme effectué
                  </button>
                  <button onClick={marquerCommeNonFait} style={btnDanger}>
                    ❌ Marquer comme non effectué
                  </button>
                </>
              )}
              {(entretien.statut === 'fait' || entretien.statut === 'nonFait') && (
                <>
                  <button onClick={marquerCommeFait} style={btnSecondary}>
                    ✏️ Modifier
                  </button>
                  <button onClick={reouvrir} style={{ ...btnSecondary, color: '#888', borderColor: '#ccc' }}>
                    ↩️ Réouvrir
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* === MODE EDITION === */}
      {mode === 'edition' && (
        <div style={{ backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
            ✏️ Saisir les détails de l'entretien
          </h4>

          {/* Date + Réalisé par */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>📅 Date effective *</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.dateEffective ? dateIsoToFr(form.dateEffective) : ''}
                  placeholder="JJ/MM/AAAA"
                  onChange={e => {
                    const valeur = e.target.value;
                    if (valeur.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                      setForm(p => ({ ...p, dateEffective: dateFrToIso(valeur) }));
                    } else if (valeur === '') {
                      setForm(p => ({ ...p, dateEffective: '' }));
                    } else {
                      setForm(p => ({ ...p, dateEffective: valeur }));
                    }
                  }}
                />
                <input
                  type="date"
                  style={{ width: '40px', border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '4px', cursor: 'pointer', backgroundColor: 'white' }}
                  value={form.dateEffective && form.dateEffective.match(/^\d{4}-\d{2}-\d{2}$/) ? form.dateEffective : ''}
                  onChange={e => setForm(p => ({ ...p, dateEffective: e.target.value }))}
                  title="Ouvrir le calendrier"
                />
              </div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                Tape la date au format JJ/MM/AAAA ou utilise l'icône 📅 à droite
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>👤 Réalisé par *</label>
              <input
                style={inputStyle}
                value={form.realisePar ?? ''}
                onChange={e => setForm(p => ({ ...p, realisePar: e.target.value }))}
                placeholder="Ex: Paméla MAILLOT"
              />
            </div>
          </div>

          {/* ✅ Support — Livret uniquement */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px' }}>📓 Support utilisé pendant l'entretien</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', padding: '10px 12px', backgroundColor: 'white', borderRadius: '8px', border: `1.5px solid ${form.supportUtilise?.livretApprentissage ? COLORS.primary : '#e0e0e0'}` }}>
              <input
                type="checkbox"
                checked={form.supportUtilise?.livretApprentissage ?? false}
                onChange={e => setForm(p => ({ ...p, supportUtilise: { ...(p.supportUtilise || {}), livretApprentissage: e.target.checked } }))}
              />
              📘 <strong>Livret d'apprentissage</strong>
              <span style={{ fontSize: '11px', color: COLORS.textMuted, marginLeft: '4px' }}>(support officiel CFA)</span>
            </label>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '6px', fontStyle: 'italic' }}>
              💡 Tu pourras importer le livret signé par les parties après l'entretien.
            </div>
          </div>

          {/* ✅ Présents — terminologie CFA officielle */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px' }}>👥 Présents à l'entretien</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {([
                { key: 'apprenti', label: '👨‍🎓 Apprenti' },
                { key: 'formateur', label: '👨‍🏫 Formateur' },
                { key: 'maitreApprentissage', label: '🎓 Maître d\'apprentissage' },
                { key: 'employeur', label: '👔 Employeur' },
                { key: 'responsableLegal', label: '👨‍👩‍👧 Responsable légal' },
              ] as const).map(p => (
                <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', padding: '6px 8px', backgroundColor: 'white', borderRadius: '6px' }}>
                  <input
                    type="checkbox"
                    checked={form.presents?.[p.key] ?? false}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      presents: {
                        apprenti: false, formateur: false, maitreApprentissage: false, employeur: false, responsableLegal: false,
                        ...(prev.presents || {}),
                        [p.key]: e.target.checked,
                      },
                    }))}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>📝 Notes / Compte-rendu</label>
            <textarea
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
              value={form.notes ?? ''}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Observations sur le déroulement, les acquis, les difficultés rencontrées..."
            />
          </div>

          {/* Décisions */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>🎯 Décisions / Plan d'action</label>
            <textarea
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              value={form.decisions ?? ''}
              onChange={e => setForm(p => ({ ...p, decisions: e.target.value }))}
              placeholder="Actions à mettre en place suite à l'entretien..."
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setMode('lecture')} style={btnSecondary}>Annuler</button>
            <button
              onClick={sauvegarder}
              disabled={!form.dateEffective || !form.realisePar || !form.dateEffective.match(/^\d{4}-\d{2}-\d{2}$/)}
              style={{
                ...btnPrimary,
                backgroundColor: (form.dateEffective && form.realisePar && form.dateEffective.match(/^\d{4}-\d{2}-\d{2}$/)) ? '#15803d' : '#ccc',
                cursor: (form.dateEffective && form.realisePar && form.dateEffective.match(/^\d{4}-\d{2}-\d{2}$/)) ? 'pointer' : 'not-allowed',
              }}
            >
              ✅ Enregistrer l'entretien
            </button>
          </div>
        </div>
      )}

      {/* === MODE NON FAIT === */}
      {mode === 'nonFait' && (
        <div style={{ backgroundColor: '#fef2f2', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#c53030', marginBottom: '12px' }}>
            ❌ Entretien non effectué
          </h4>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Motif *</label>
            <select
              style={inputStyle}
              value={form.motifNonFait ?? ''}
              onChange={e => setForm(p => ({ ...p, motifNonFait: e.target.value }))}
            >
              <option value="">— Choisir un motif —</option>
              {MOTIFS_NON_FAIT.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>📅 Date de report éventuelle</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                style={{ ...inputStyle, flex: 1 }}
                value={form.dateReport ? dateIsoToFr(form.dateReport) : ''}
                placeholder="JJ/MM/AAAA"
                onChange={e => {
                  const valeur = e.target.value;
                  if (valeur.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                    setForm(p => ({ ...p, dateReport: dateFrToIso(valeur) }));
                  } else if (valeur === '') {
                    setForm(p => ({ ...p, dateReport: '' }));
                  } else {
                    setForm(p => ({ ...p, dateReport: valeur }));
                  }
                }}
              />
              <input
                type="date"
                style={{ width: '40px', border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '4px', cursor: 'pointer', backgroundColor: 'white' }}
                value={form.dateReport && form.dateReport.match(/^\d{4}-\d{2}-\d{2}$/) ? form.dateReport : ''}
                onChange={e => setForm(p => ({ ...p, dateReport: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>📝 Notes / Précisions</label>
            <textarea
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              value={form.notes ?? ''}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Détails du contexte..."
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setMode('lecture')} style={btnSecondary}>Annuler</button>
            <button onClick={sauvegarderNonFait} style={btnDanger}>
              ❌ Enregistrer comme non effectué
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function FicheApprenant({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [apprenant, setApprenant] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [modeEdition, setModeEdition] = useState(false);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [modaleRupture, setModaleRupture] = useState(false);
  const [rupture, setRupture] = useState({ date: '', motif: '', maintien: 'NON' });
  const [sessions, setSessions] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<string[]>([]);
  const [modeEntrepriseManuelle, setModeEntrepriseManuelle] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const { utilisateur, peutModifier, estAdmin, estPedagogique } = useAcces();

  const peutModifierEntretien = estAdmin || estPedagogique;

  useEffect(() => {
    (async () => {
      // 1. Tentative Supabase d'abord
      let trouve: any = null;
      try {
        trouve = await chargerApprenti(id);
        if (trouve) console.log(`[FicheApprenant ${id}] Chargé depuis Supabase ✅`);
      } catch (e) {
        console.error('[FicheApprenant] Erreur Supabase, fallback localStorage', e);
      }
      // 2. Fallback localStorage si rien dans Supabase
      if (!trouve) {
        trouve = trouverApprenant(id);
        if (trouve) console.warn(`[FicheApprenant ${id}] Chargé depuis localStorage (fallback)`);
      }

      setApprenant(trouve);
      setForm(trouve ?? {});
      setSessions(chargerSessions());
      setEntreprises(chargerEntreprises());

      if (trouve) {
        const ents = chargerOuCreerEntretiensApprenant(id, trouve.dateDebutContrat, trouve.dateFinContrat);
        setEntretiens(ents);
      }

      setChargement(false);
    })();
  }, [id]);

  useEffect(() => {
    if (apprenant && (form.dateDebutContrat !== apprenant.dateDebutContrat || form.dateFinContrat !== apprenant.dateFinContrat)) {
      const ents = chargerOuCreerEntretiensApprenant(id, form.dateDebutContrat, form.dateFinContrat);
      setEntretiens(ents);
    }
  }, [form.dateDebutContrat, form.dateFinContrat]);

  async function handleSauvegarderEntretien(entretien: Entretien) {
    // Supabase d'abord (upsert)
    const res = await creerEntretienSupabase(entretien as any);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[Entretien ${entretien.id}] Sauvegardé dans Supabase ✅`);
    // localStorage en miroir + rafraîchissement UI
    sauvegarderEntretien(entretien);
    const ents = chargerOuCreerEntretiensApprenant(id, form.dateDebutContrat, form.dateFinContrat);
    setEntretiens(ents);
  }

  if (chargement) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>
        Chargement...
      </div>
    );
  }

  if (!apprenant) return (
    <div style={{ padding: '32px' }}>
      <a href="/apprenants" style={{ color: COLORS.primary, fontWeight: '600', textDecoration: 'none' }}>← Retour aux apprenants</a>
      <p style={{ marginTop: '16px', color: COLORS.textMuted }}>Apprenant introuvable (ID : {id}).</p>
    </div>
  );

  const p2s = form.statut === 'P2S';
  const estEnRupture = form.statut === 'Rupture';
  const enCours = form.statut === 'En cours';
  const statutBg = enCours ? '#e6f4f1' : p2s ? '#fef6e4' : '#fde8e8';
  const statutColor = enCours ? '#006B68' : p2s ? '#C8A23A' : '#e53e3e';
  const statutLabel = form.statut === 'Terminé' ? 'TERMINÉ' : estEnRupture ? (form.maintienFormation === 'OUI' ? 'RUPTURE MEF' : 'RUPTURE FMEF') : p2s ? 'P2S' : enCours ? 'CA' : '—';

  const champsSifaManquants = verifierConformiteSifa(form);
  const estMineurApp = estMineur(form);

  const sessionsCompatibles = sessions.filter((s: any) => {
    const codeForm = s.formation ?? s.codeFormation ?? s.code;
    if (!codeForm || !form.formation) return true;
    if (codeForm === form.formation) return true;
    if (typeof codeForm === 'string' && (codeForm.startsWith(form.formation + '-') || codeForm.startsWith(form.formation + '_'))) return true;
    return false;
  });

  const sessionActuelle = form.sessionId ? sessions.find((s: any) => s.id === form.sessionId) : null;

  function libelleSession(s: any): string {
    if (!s) return '';
    const code = s.formation ?? s.codeFormation ?? s.code ?? '';
    const debut = s.dateDebut ?? s.debut ?? s.dateDebutFormation ?? '';
    const fin = s.dateFin ?? s.fin ?? s.dateFinFormation ?? '';
    const nom = s.nom ?? s.libelle ?? code;
    return `${nom}${debut ? ` — ${debut}` : ''}${fin ? ` → ${fin}` : ''}`;
  }

  async function sauvegarder() {
    // 1. Supabase d'abord (source de vérité)
    try {
      const res = await modifierApprenti(id, form);
      if (!res.success) {
        alert(`⚠️ Erreur Supabase : ${res.error}\nModifications enregistrées localement uniquement.`);
      } else {
        console.log(`[FicheApprenant ${id}] Sauvegardé dans Supabase ✅`);
      }
    } catch (e) {
      console.error('[FicheApprenant] Erreur Supabase, sauvegarde locale uniquement', e);
    }
    // 2. localStorage en miroir (fallback / compatibilité)
    localStorage.setItem('apprenant_' + id, JSON.stringify(form));
    try {
      const liste = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
      const idx = liste.findIndex((a: any) => a.id === id);
      if (idx >= 0) {
        liste[idx] = { ...liste[idx], ...form };
      } else {
        liste.push(form);
      }
      localStorage.setItem('easycfa_apprenants_v2', JSON.stringify(liste));
    } catch {}
    setApprenant(form);
    setSauvegarde(true);
    setModeEdition(false);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  async function declarerRupture() {
    const updated = { ...form, statut: 'Rupture', dateRupture: rupture.date, maintienFormation: rupture.maintien };
    // 1. Supabase d'abord
    try {
      const res = await modifierApprenti(id, { statut: 'Rupture', dateRupture: rupture.date, maintienFormation: rupture.maintien });
      if (!res.success) {
        alert(`⚠️ Erreur Supabase : ${res.error}\nRupture enregistrée localement uniquement.`);
      } else {
        console.log(`[FicheApprenant ${id}] Rupture sauvegardée dans Supabase ✅`);
      }
    } catch (e) {
      console.error('[FicheApprenant] Erreur Supabase rupture, fallback local', e);
    }
    // 2. UI + localStorage en miroir
    setForm(updated);
    setApprenant(updated);
    localStorage.setItem('apprenant_' + id, JSON.stringify(updated));
    try {
      const liste = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
      const idx = liste.findIndex((a: any) => a.id === id);
      if (idx >= 0) liste[idx] = { ...liste[idx], ...updated };
      else liste.push(updated);
      localStorage.setItem('easycfa_apprenants_v2', JSON.stringify(liste));
    } catch {}
    setModaleRupture(false);
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  async function supprimerApprenant() {
    // 1. Supabase d'abord (source de vérité)
    try {
      const res = await supprimerApprentiSupabase(id);
      if (!res.success) {
        alert(`⚠️ Erreur Supabase : ${res.error}\nL'apprenant a été supprimé localement uniquement.`);
      } else {
        console.log(`[FicheApprenant ${id}] Supprimé de Supabase ✅`);
      }
    } catch (e) {
      console.error('[FicheApprenant] Erreur Supabase suppression, fallback local', e);
    }
    // 2. localStorage en miroir
    try {
      const liste = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
      const listeFiltree = liste.filter((a: any) => a.id !== id);
      localStorage.setItem('easycfa_apprenants_v2', JSON.stringify(listeFiltree));
      localStorage.removeItem(`apprenant_${id}`);
      // Nettoyage clés annexes éventuelles
      Object.keys(localStorage).forEach(k => {
        if (k === `apprenant_${id}` || k.startsWith(`entretien_${id}`)) {
          localStorage.removeItem(k);
        }
      });
      supprimerEntretiensApprenant(id);
      router.push('/apprenants');
    } catch (err) {
      console.error('Erreur suppression apprenant:', err);
      alert('Erreur lors de la suppression. Voir la console (F12).');
    }
  }

  return (
    <div>
      <a href="/apprenants" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>← Retour aux apprenants</a>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '16px 0 24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: COLORS.primary }}>{form.prenom} {form.nom}</h1>
            <span style={{ backgroundColor: statutBg, color: statutColor, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{statutLabel}</span>
            <span style={{ backgroundColor: COLORS.background, color: COLORS.primary, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{form.formation}</span>
            {estEnRupture && form.dateRupture && <span style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Rupture le {form.dateRupture}</span>}
            {form.maintienFormation === 'OUI' && <span style={{ backgroundColor: '#fef6e4', color: '#C8A23A', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Maintien formation</span>}
            {sessionActuelle && (
              <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                📅 Session {sessionActuelle.id}
              </span>
            )}
            {champsSifaManquants.length > 0 ? (
              <span title={`Champs SIFA manquants : ${champsSifaManquants.join(', ')}`} style={{ backgroundColor: '#fef6e4', color: '#7a5c00', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'help' }}>
                ⚠️ SIFA : {champsSifaManquants.length} champ{champsSifaManquants.length > 1 ? 's' : ''} manquant{champsSifaManquants.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                ✅ SIFA conforme
              </span>
            )}
            {entretiens.map(e => {
              const s = STATUT_STYLE[e.statut];
              return (
                <span
                  key={e.id}
                  title={`${LIBELLE_TYPE_LONG[e.type]} — ${s.label}`}
                  style={{
                    backgroundColor: s.bg,
                    color: s.color,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}
                >
                  {s.emoji} {LIBELLE_TYPE[e.type]}
                </span>
              );
            })}
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>{({'SC':'TP Secrétaire Comptable','GCF':'TP Gestionnaire Comptable et Fiscal','ARH':'TP Assistant(e) en Ressources Humaines','AD':'TP Assistant(e) de Direction','CATL':'TP Chargé(e) d\'Accueil Touristique et de Loisirs','EC':'TP Employé(e) Commercial(e)','CV':'TP Conseiller(ère) de Vente','FPA':'TP Formateur(trice) Professionnel(le) d\'Adultes'} as Record<string,string>)[form.formation] || form.formationLibelle || form.formation || '—'} — {form.entreprise || "Pas encore d'entreprise"}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {modeEdition ? (
            <>
              <button onClick={sauvegarder} style={btnPrimary}>✅ Enregistrer</button>
              <button onClick={() => { setForm(apprenant); setModeEdition(false); setModeEntrepriseManuelle(false); }} style={btnSecondary}>Annuler</button>
            </>
          ) : (
            <>
              <button onClick={() => setModeEdition(true)} style={btnSecondary}>✏️ Modifier</button>
              <button style={btnPrimary}>Générer état mensuel</button>
              <button onClick={() => { const a = document.createElement('a'); a.href = '/modeles/Sortie_Anticipee.pdf'; a.download = 'Sortie_Anticipee_' + form.nom + '_' + form.prenom + '.pdf'; a.click(); }} style={{ backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                🚪 Sortie anticipée
              </button>
              <button onClick={() => { const a = document.createElement('a'); a.href = '/modeles/Droit_Image.pdf'; a.download = 'Droit_Image_' + form.nom + '_' + form.prenom + '.pdf'; a.click(); }} style={{ backgroundColor: '#0891b2', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                📸 Droit à l'image
              </button>
              <button onClick={() => {
                const livrets: Record<string, string> = {
                  'SC': 'https://docs.google.com/document/d/1iRHWuOb5EYT5Yy7v4YXy5rFBAA5KPOeNW88VpZUkkA4/edit?usp=drive_link',
                  'AD': 'https://docs.google.com/document/d/16oAKKIBW5YwL3sXTZ1Be1bhlEMvwOsleByH8cvjY8a4/edit?usp=drive_link',
                  'ARH': 'https://docs.google.com/document/d/13m_VmguC9M4sbMksiI6q8kcNMSGrCDIlveVPPoBsac8/edit?usp=drive_link',
                  'GCF': 'https://docs.google.com/document/d/1mEW1o_VYrU5GexbSRHJQNFetJhBUHozVq3jZJeyy8IA/edit?usp=drive_link',
                  'CATL': 'https://docs.google.com/document/d/1WM0qKJA2krngqCo4l9NNEPnFc-HGmRhEhNKftl65eaA/edit?usp=drive_link',
                  'EC': 'https://docs.google.com/document/d/1M4-mFr49q9NnBvK5BjTJ_9gh2YFRQ-fhbodb1h0DpVA/edit?usp=drive_link',
                  'CV': 'https://docs.google.com/document/d/1xFJxdfirIX2ZUzG7WmxB5eZkq6_yl_uw9UOdm80lcXg/edit?usp=drive_link',
                };
                const lien = livrets[form.formation];
                if (lien) window.open(lien, '_blank');
                else alert('Livret non disponible pour : ' + form.formation);
              }} style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                📓 Livret d'apprentissage
              </button>
              {!estEnRupture && <button onClick={() => setModaleRupture(true)} style={btnDanger}>Déclarer rupture</button>}
              {!estEnRupture && form.statut !== 'Terminé' && (
                <button onClick={async () => {
                  const updated = { ...form, statut: 'Terminé' };
                  // Supabase d'abord
                  const res = await modifierApprenti(id, { statut: 'Terminé' });
                  if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
                  else console.log(`[FicheApprenant ${id}] Marqué Terminé dans Supabase ✅`);
                  // localStorage en miroir
                  setForm(updated); setApprenant(updated);
                  localStorage.setItem('apprenant_' + id, JSON.stringify(updated));
                  try {
                    const liste = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
                    const idx = liste.findIndex((a: any) => a.id === id);
                    if (idx >= 0) liste[idx] = { ...liste[idx], ...updated };
                    localStorage.setItem('easycfa_apprenants_v2', JSON.stringify(liste));
                  } catch {}
                  setSauvegarde(true); setTimeout(() => setSauvegarde(false), 3000);
                }} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  ✅ Marquer comme Terminé
                </button>
              )}
              {form.statut === 'Terminé' && (
                <button onClick={async () => {
                  const updated = { ...form, statut: 'En cours' };
                  // Supabase d'abord
                  const res = await modifierApprenti(id, { statut: 'En cours' });
                  if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
                  else console.log(`[FicheApprenant ${id}] Réactivé dans Supabase ✅`);
                  // localStorage en miroir
                  setForm(updated); setApprenant(updated);
                  localStorage.setItem('apprenant_' + id, JSON.stringify(updated));
                  try {
                    const liste = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
                    const idx = liste.findIndex((a: any) => a.id === id);
                    if (idx >= 0) liste[idx] = { ...liste[idx], ...updated };
                    localStorage.setItem('easycfa_apprenants_v2', JSON.stringify(liste));
                  } catch {}
                  setSauvegarde(true); setTimeout(() => setSauvegarde(false), 3000);
                }} style={{ backgroundColor: 'white', color: '#16a34a', border: '1.5px solid #16a34a', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  ↩️ Réactiver
                </button>
              )}
              <BoutonSupprimer
                type="apprenant"
                id={id}
                libelle={`${form.prenom ?? ''} ${form.nom ?? ''} (${form.formation ?? ''})`}
                onSupprimer={supprimerApprenant}
              />
            </>
          )}
        </div>
      </div>

      {sauvegarde && (
        <div style={{ padding: '12px 16px', backgroundColor: '#e6f4f1', border: '2px solid #006B68', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          ✅ Modifications enregistrées avec succès
        </div>
      )}

      {p2s && (
        <div style={{ backgroundColor: '#fef6e4', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', border: '1.5px solid #C8A23A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#7a5c00', fontWeight: '600', fontSize: '14px' }}>⚠️ Stagiaire P2S — Entreprise à trouver avant le {form.dateFinFormation}</span>
          </div>
        </div>
      )}

      {form.dateRupture && (
        <div style={{ backgroundColor: form.statut === 'Terminé' ? '#f3f4f6' : '#fde8e8', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', border: form.statut === 'Terminé' ? '1px solid #d1d5db' : 'none' }}>
          <span style={{ color: form.statut === 'Terminé' ? '#6b7280' : '#c53030', fontWeight: '600', fontSize: '14px' }}>{form.statut === 'Terminé' ? '📋' : '❌'} Contrat rompu le {form.dateRupture} — Maintien en formation : {form.maintienFormation || 'Non renseigné'}{form.contratSuivant ? ` — Repris via contrat ${form.contratSuivant}` : ''}</span>
          {form.maintienFormation === 'OUI' && form.dateRupture && (() => {
            const parts = form.dateRupture.split('/');
            if (parts.length !== 3) return null;
            const dateRup = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            const dateLimite = new Date(dateRup); dateLimite.setMonth(dateLimite.getMonth() + 6);
            const aujourdhui = new Date();
            const joursRestants = Math.ceil((dateLimite.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24));
            const dateLimiteFR = dateLimite.toLocaleDateString('fr-FR');
            if (joursRestants < 0) {
              return <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#fee', border: '2px solid #c53030', borderRadius: '6px', fontSize: '13px', color: '#c53030', fontWeight: '700' }}>🚨 Délai de maintien dépassé depuis {Math.abs(joursRestants)} jour{Math.abs(joursRestants) > 1 ? 's' : ''} (limite : {dateLimiteFR}) — Archivage requis</div>;
            }
            const couleur = joursRestants <= 30 ? '#c53030' : joursRestants <= 60 ? '#C8A23A' : '#006B68';
            const bg = joursRestants <= 30 ? '#fee' : joursRestants <= 60 ? '#fef6e4' : '#e6f4f1';
            return <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: bg, border: `1.5px solid ${couleur}`, borderRadius: '6px', fontSize: '13px', color: couleur, fontWeight: '700' }}>⏰ Maintien en formation : {joursRestants} jour{joursRestants > 1 ? 's' : ''} restant{joursRestants > 1 ? 's' : ''} (jusqu'au {dateLimiteFR})</div>;
          })()}
          {form.maintienFormation === 'OUI' && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  if (!confirm(`L'apprenti(e) ${form.prenom} ${form.nom} a trouvé une nouvelle entreprise ?\n\nCela va :\n- Clôturer la fiche actuelle (statut "Terminé")\n- Créer une nouvelle fiche apprenti pré-remplie pour le nouveau contrat`)) return;
                  const nettoyer = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase();
                  const nouvelId = `${nettoyer(form.nom).substring(0,3)}${nettoyer(form.prenom).substring(0,2)}_${Date.now().toString().slice(-4)}`;
                  const nouvelleFiche = { ...form, id: nouvelId, statut: 'En cours', entreprise: '', entrepriseId: '', dateDebutContrat: '', dateFinContrat: '', dateRupture: '', maintienFormation: '', contratPrecedent: id, archive: false };

                  // === SUPABASE : créer la nouvelle fiche + clôturer l'ancienne ===
                  // 1. Nettoyer la nouvelle fiche pour Supabase (retirer les champs orphelins)
                  const pourSupabase: any = { ...nouvelleFiche };
                  delete pourSupabase.nirConfirm;
                  delete pourSupabase.situationAvantContrat;
                  delete pourSupabase.dateEntretien;
                  delete pourSupabase.entrepriseId; // n'existe pas dans la table
                  Object.keys(pourSupabase).forEach(k => { if (k.startsWith('piece_')) delete pourSupabase[k]; });

                  const resCreate = await creerApprenti(pourSupabase);
                  if (!resCreate.success) {
                    alert(`⚠️ Erreur Supabase (création nouvelle fiche) : ${resCreate.error}`);
                  } else {
                    console.log(`[FicheApprenant] Nouvelle fiche ${nouvelId} créée dans Supabase ✅`);
                  }

                  const resUpdate = await modifierApprenti(id, { statut: 'Terminé', contratSuivant: nouvelId });
                  if (!resUpdate.success) {
                    alert(`⚠️ Erreur Supabase (clôture ancienne fiche) : ${resUpdate.error}`);
                  } else {
                    console.log(`[FicheApprenant ${id}] Ancien contrat clôturé dans Supabase ✅`);
                  }

                  // === localStorage en miroir ===
                  localStorage.setItem('apprenant_' + nouvelId, JSON.stringify(nouvelleFiche));
                  try {
                    const liste = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
                    liste.push(nouvelleFiche);
                    localStorage.setItem('easycfa_apprenants_v2', JSON.stringify(liste));
                  } catch {}
                  const ancienneCloturee = { ...form, statut: 'Terminé', contratSuivant: nouvelId };
                  setForm(ancienneCloturee); setApprenant(ancienneCloturee);
                  localStorage.setItem('apprenant_' + id, JSON.stringify(ancienneCloturee));
                  try {
                    const liste = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
                    const idx = liste.findIndex((a: any) => a.id === id);
                    if (idx >= 0) liste[idx] = { ...liste[idx], ...ancienneCloturee };
                    localStorage.setItem('easycfa_apprenants_v2', JSON.stringify(liste));
                  } catch {}
                  router.push('/apprenants/' + nouvelId);
                }}
                style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                🆕 Trouvé nouvelle entreprise → créer nouveau contrat
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Fin de maintien en formation pour ${form.prenom} ${form.nom} ?\n\nCela va :\n- Passer la fiche en "Rupture FMEF"\n- Le dossier sera archivé`)) return;
                  const updated = { ...form, maintienFormation: 'NON', archive: true };
                  // Supabase d'abord
                  const res = await modifierApprenti(id, { maintienFormation: 'NON', archive: true });
                  if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
                  else console.log(`[FicheApprenant ${id}] Fin de maintien dans Supabase ✅`);
                  // localStorage en miroir
                  setForm(updated); setApprenant(updated);
                  localStorage.setItem('apprenant_' + id, JSON.stringify(updated));
                  try {
                    const liste = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
                    const idx = liste.findIndex((a: any) => a.id === id);
                    if (idx >= 0) liste[idx] = { ...liste[idx], ...updated };
                    localStorage.setItem('easycfa_apprenants_v2', JSON.stringify(liste));
                  } catch {}
                  router.push('/apprenants');
                }}
                style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                🚫 Fin de maintien — Archiver le dossier
              </button>
            </div>
          )}
        </div>
      )}

      {/* 📋 ENTRETIENS DE SUIVI QUALIOPI */}
      <Card style={{ marginBottom: '24px', borderTop: `4px solid ${COLORS.secondary}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: COLORS.primary, marginBottom: '4px' }}>
              📋 Entretiens de suivi Qualiopi
            </h2>
            <p style={{ fontSize: '12px', color: COLORS.textMuted }}>
              🛡️ Indicateurs 11, 13 et 14 — Preuves obligatoires pour audit Qualiopi
            </p>
          </div>
          {!peutModifierEntretien && (
            <span style={{ backgroundColor: '#fef6e4', color: '#7a5c00', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
              👁️ Lecture seule — Saisie réservée à PAMA/Pédagogique
            </span>
          )}
        </div>

        {(!form.dateDebutContrat || !form.dateFinContrat) && (
          <div style={{ padding: '12px 14px', backgroundColor: '#fef6e4', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#7a5c00', borderLeft: '4px solid #C8A23A' }}>
            ⚠️ <strong>Dates de contrat manquantes</strong> — Renseigne <em>début</em> et <em>fin de contrat</em> dans la section "Contrat d'apprentissage" ci-dessous pour que les dates prévues d'entretien se calculent automatiquement.
          </div>
        )}

        {entretiens.map(ent => (
          <CardEntretien
            key={ent.id}
            entretien={ent}
            apprenantNom={`${form.prenom} ${form.nom}`}
            peutModifierEntretien={peutModifierEntretien}
            utilisateur={utilisateur}
            onSave={handleSauvegarderEntretien}
          />
        ))}
      </Card>

      {/* Identité + Coordonnées + NIR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <Card>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>Identité</h2>
          {modeEdition ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Champ label="Nom" champ="nom" form={form} setForm={setForm} />
              <Champ label="Prénom" champ="prenom" form={form} setForm={setForm} />
              <Champ label="Date de naissance (JJ/MM/AAAA)" champ="dateNaissance" form={form} setForm={setForm} placeholder="JJ/MM/AAAA" />
              <Champ label="Lieu de naissance" champ="lieuNaissance" form={form} setForm={setForm} />
            </div>
          ) : (
            <>
              <InfoRow label="Nom" value={form.nom} />
              <InfoRow label="Prénom" value={form.prenom} />
              <InfoRow label="Date de naissance" value={form.dateNaissance} />
              <InfoRow label="Lieu de naissance" value={form.lieuNaissance} />
            </>
          )}
        </Card>

        <Card>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>Coordonnées</h2>
          {modeEdition ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Champ label="Email" champ="email" form={form} setForm={setForm} type="email" />
              <Champ label="Téléphone" champ="telephone" form={form} setForm={setForm} placeholder="06 XX XX XX XX" />
              <Champ label="Adresse" champ="adresse" form={form} setForm={setForm} />
              <Champ label="Code postal" champ="codePostal" form={form} setForm={setForm} />
              <Champ label="Ville" champ="ville" form={form} setForm={setForm} />
            </div>
          ) : (
            <>
              <InfoRow label="Email" value={form.email} />
              <InfoRow label="Téléphone" value={form.telephone} />
              <InfoRow label="Adresse" value={form.adresse} />
              <InfoRow label="Code postal" value={form.codePostal} />
              <InfoRow label="Ville" value={form.ville} />
            </>
          )}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Données sensibles</h2>
            <span style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Accès restreint</span>
          </div>
          <div style={{ backgroundColor: '#fef6e4', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>NIR</div>
            {modeEdition ? (
              <input style={{ ...inputStyle, letterSpacing: '2px' }} value={form.nir ?? ''} placeholder="X XX XX XX XXX XXX XX" onChange={e => setForm((p: any) => ({ ...p, nir: e.target.value }))} maxLength={15} />
            ) : (
              <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.text, letterSpacing: '2px' }}>
                {form.nir ? '● ● ● ● ● ● ● ● ● ● ●' : '— À compléter'}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Contrat */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>Contrat d'apprentissage</h2>
        {modeEdition ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Formation</label>
              <div style={{ padding: '8px 12px', backgroundColor: '#EAF4F3', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#006B68' }}>
                {({'SC':'TP Secrétaire Comptable','GCF':'TP Gestionnaire Comptable et Fiscal','ARH':'TP Assistant(e) en Ressources Humaines','AD':'TP Assistant(e) de Direction','CATL':'TP Chargé(e) d\'Accueil Touristique et de Loisirs','EC':'TP Employé(e) Commercial(e)','CV':'TP Conseiller(ère) de Vente','FPA':'TP Formateur(trice) Professionnel(le) d\'Adultes'} as Record<string,string>)[form.formation] || form.formation || '—'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Entreprise</label>
              {!modeEntrepriseManuelle ? (
                <select
                  style={inputStyle}
                  value={entreprises.includes(form.entreprise) ? form.entreprise : (form.entreprise ? '__autre__' : '')}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '__manuelle__' || v === '__autre__') {
                      setModeEntrepriseManuelle(true);
                    } else {
                      setForm((p: any) => ({ ...p, entreprise: v }));
                    }
                  }}
                >
                  <option value="">— Choisir une entreprise —</option>
                  {entreprises.map(nom => <option key={nom} value={nom}>{nom}</option>)}
                  {form.entreprise && !entreprises.includes(form.entreprise) && (
                    <option value="__autre__">📝 {form.entreprise} (saisie manuelle)</option>
                  )}
                  <option value="__manuelle__">✏️ Saisir manuellement (nouvelle entreprise)</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.entreprise ?? ''}
                    onChange={e => setForm((p: any) => ({ ...p, entreprise: e.target.value }))}
                    placeholder="Nom de l'entreprise"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setModeEntrepriseManuelle(false)}
                    style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '0 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ↩
                  </button>
                </div>
              )}
            </div>

            <Champ label="Statut" champ="statut" form={form} setForm={setForm} />
            <Champ label="Début contrat (JJ/MM/AAAA)" champ="dateDebutContrat" form={form} setForm={setForm} placeholder="JJ/MM/AAAA" />
            <Champ label="Fin contrat (JJ/MM/AAAA)" champ="dateFinContrat" form={form} setForm={setForm} placeholder="JJ/MM/AAAA" />
            <Champ label="Début formation (JJ/MM/AAAA)" champ="dateDebutFormation" form={form} setForm={setForm} placeholder="JJ/MM/AAAA" />
            <Champ label="Fin formation (JJ/MM/AAAA)" champ="dateFinFormation" form={form} setForm={setForm} placeholder="JJ/MM/AAAA" />
            <Champ label="N° dossier OPCO" champ="numeroDossierOpco" form={form} setForm={setForm} placeholder="Ex: 123456789" />
            <Champ label="N° DECA (APC)" champ="numeroDeca" form={form} setForm={setForm} placeholder="Ex: 974202XXXXXXXXX" />
            <ChampSelect label="Situation avant contrat" champ="situationAvant" form={form} setForm={setForm} options={[
              { value: '1 Scolaire', label: '1 - Scolaire' },
              { value: '4 Contrat d\'apprentissage', label: '4 - Contrat d\'apprentissage' },
              { value: '7 En formation au CFA sous le statut de stagiaire de la formation professionnelle, avant la conclusion d\'un CA', label: '7 - Stagiaire FP avant CA' },
              { value: '11 Personne à la recherche d\'un emploi (inscrite ou non à France Travail)', label: '11 - Demandeur d\'emploi' },
            ]} />
            <ChampSelect label="Dernier diplôme obtenu" champ="dernierDiplome" form={form} setForm={setForm} options={[
              { value: 'Brevet des collèges', label: 'Brevet des collèges' },
              { value: 'CAP', label: 'CAP' },
              { value: 'BEP', label: 'BEP' },
              { value: 'BAC', label: 'BAC' },
              { value: 'BTS', label: 'BTS' },
              { value: 'LICENCE', label: 'LICENCE' },
              { value: 'MASTER', label: 'MASTER' },
              { value: 'TP SC', label: 'TP Secrétaire Comptable' },
              { value: 'TP AD', label: 'TP Assistant(e) de Direction' },
              { value: 'TP ARH', label: 'TP Assistant(e) RH' },
              { value: 'TP GCF', label: 'TP Gestionnaire Comptable et Fiscal' },
              { value: 'TP CATL', label: 'TP CATL' },
              { value: 'Autre', label: 'Autre' },
            ]} />
            <ChampSelect label="RQTH (OUI/NON)" champ="rqth" form={form} setForm={setForm} options={[
              { value: 'OUI', label: 'OUI' },
              { value: 'NON', label: 'NON' },
            ]} />

            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                📅 Session de formation
                {sessionsCompatibles.length === 0 && form.formation && (
                  <span style={{ marginLeft: '8px', color: '#e53e3e', fontWeight: '500', textTransform: 'none' }}>
                    Aucune session disponible pour la formation {form.formation}
                  </span>
                )}
              </label>
              <select
                style={inputStyle}
                value={form.sessionId ?? ''}
                onChange={e => setForm((prev: any) => ({ ...prev, sessionId: e.target.value === '' ? undefined : e.target.value }))}
              >
                <option value="">— Aucune session assignée —</option>
                {sessionsCompatibles.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    Session #{s.id} — {libelleSession(s)}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                💡 {sessionsCompatibles.length} session{sessionsCompatibles.length > 1 ? 's' : ''} compatible{sessionsCompatibles.length > 1 ? 's' : ''} avec la formation {form.formation || '(toutes)'}.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Formation', value: ({'SC':'TP Secrétaire Comptable','GCF':'TP Gestionnaire Comptable et Fiscal','ARH':'TP Assistant(e) en Ressources Humaines','AD':'TP Assistant(e) de Direction','CATL':'TP Chargé(e) d\'Accueil Touristique et de Loisirs','EC':'TP Employé(e) Commercial(e)','CV':'TP Conseiller(ère) de Vente','FPA':'TP Formateur(trice) Professionnel(le) d\'Adultes'} as Record<string,string>)[form.formation] || form.formationLibelle || form.formation || '—' },
              { label: 'Code', value: form.formation },
              { label: 'Statut', value: statutLabel },
              { label: 'Entreprise', value: form.entreprise },
              { label: 'Début contrat', value: form.dateDebutContrat },
              { label: 'Fin contrat', value: form.dateFinContrat },
              { label: 'Début formation', value: form.dateDebutFormation },
              { label: 'Fin formation', value: form.dateFinFormation },
              { label: 'N° dossier OPCO', value: form.numeroDossierOpco },
              { label: 'N° DECA (APC)', value: form.numeroDeca },
              { label: 'Situation avant contrat', value: form.situationAvant },
              { label: 'Dernier diplôme obtenu', value: form.dernierDiplome },
              { label: 'RQTH', value: form.rqth },
              { label: '📅 Session de formation', value: sessionActuelle ? `Session #${sessionActuelle.id} — ${libelleSession(sessionActuelle)}` : '— Non assignée' },
            ].map((info) => (
              <div key={info.label} style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>{info.label}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: (!info.value || info.value === '—' || info.value === '— Non assignée') ? '#ccc' : COLORS.text }}>{info.value || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* SIFA */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>📊 Déclarations administratives (SIFA)</h2>
          {champsSifaManquants.length > 0 ? (
            <span style={{ backgroundColor: '#fef6e4', color: '#7a5c00', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
              ⚠️ {champsSifaManquants.length} champ{champsSifaManquants.length > 1 ? 's' : ''} obligatoire{champsSifaManquants.length > 1 ? 's' : ''} manquant{champsSifaManquants.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
              ✅ Conforme SIFA
            </span>
          )}
        </div>

        <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '12px', color: '#555' }}>
          💡 Ces informations sont nécessaires pour la déclaration annuelle <strong>SIFA</strong>.
          {estMineurApp && <span> ⚠️ Cet apprenant est <strong>mineur</strong> : email d'un responsable légal obligatoire.</span>}
        </div>

        {modeEdition ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <ChampSelect label="Sexe" champ="sexe" form={form} setForm={setForm} options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]} />
            <Champ label="CP de naissance" champ="codePostalNaissance" form={form} setForm={setForm} placeholder="ex: 97410" />
            <Champ label="INE" champ="ine" form={form} setForm={setForm} placeholder="11 caractères" />
            <ChampSelect label="RQTH" champ="rqth" form={form} setForm={setForm} options={[{ value: 'OUI', label: 'OUI' }, { value: 'NON', label: 'NON' }]} />
            <Champ label="Date RQTH" champ="dateRqth" form={form} setForm={setForm} placeholder="JJ/MM/AAAA" />
            <div></div>
            <Champ label="Email représentant légal" champ="representantEmail" form={form} setForm={setForm} type="email" />
            <Champ label="Email responsable légal 1" champ="responsableEmail1" form={form} setForm={setForm} type="email" />
            <Champ label="Email responsable légal 2" champ="responsableEmail2" form={form} setForm={setForm} type="email" />
            <Champ label="UAI dernier établissement" champ="dernierOrganismeUai" form={form} setForm={setForm} />
            <ChampSelect label="Dernière situation scolaire" champ="derniereSituationCode" form={form} setForm={setForm} options={DERNIERE_SITUATION_SIFA.map(s => ({ value: s.code, label: `${s.code} — ${s.label}` }))} />
            <div></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '12px' }}>État civil & santé</h3>
              <InfoRow label="Sexe" value={form.sexe === 'M' ? 'Masculin' : form.sexe === 'F' ? 'Féminin' : ''} />
              <InfoRow label="CP de naissance" value={form.codePostalNaissance} />
              <InfoRow label="INE" value={form.ine} />
              <InfoRow label="RQTH" value={form.rqth} />
              <InfoRow label="Date RQTH" value={form.dateRqth} />
            </div>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '12px' }}>
                Responsables légaux & parcours
                {estMineurApp && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#e53e3e', backgroundColor: '#fde8e8', padding: '2px 8px', borderRadius: '10px' }}>👶 Mineur</span>}
              </h3>
              <InfoRow label="Email représentant" value={form.representantEmail} />
              <InfoRow label="Email responsable 1" value={form.responsableEmail1} />
              <InfoRow label="Email responsable 2" value={form.responsableEmail2} />
              <InfoRow label="UAI étab. précédent" value={form.dernierOrganismeUai} />
              <InfoRow label="Dernière situation" value={form.derniereSituationCode ? `${form.derniereSituationCode} — ${DERNIERE_SITUATION_SIFA.find(s => s.code === form.derniereSituationCode)?.label ?? ''}` : ''} />
            </div>
          </div>
        )}
      </Card>

      {/* Pièces justificatives */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>📎 Pièces justificatives</h2>
          <span style={{ fontSize: '12px', color: '#888' }}>Formats : PDF, JPG, PNG — Max 5 Mo</span>
        </div>

        {[
          { id: 'cv', label: 'CV à jour', detail: 'Curriculum vitae à jour', obligatoire: false },
          { id: 'cni', label: 'Pièce d\'identité valide', detail: 'CNI, passeport ou titre de séjour', obligatoire: true },
          { id: 'domicile', label: 'Justificatif de domicile', detail: 'Moins de 3 mois', obligatoire: true },
          { id: 'vitale', label: 'Carte vitale / attestation SS', detail: 'NIR obligatoire pour le CERFA', obligatoire: true },
          { id: 'diplomes', label: 'Diplômes obtenus', detail: 'Derniers diplômes', obligatoire: true },
          { id: 'contrat', label: 'Contrat signé', detail: 'Importé depuis fiche entreprise', obligatoire: true, readonly: true },
          { id: 'convention', label: 'Convention signée', detail: 'Importée depuis fiche entreprise', obligatoire: false, readonly: true },
          { id: 'dpae', label: 'DPAE', detail: 'Déclaration Préalable à l\'Embauche', obligatoire: false },
          { id: 'autre', label: 'Autre document', detail: 'Tout autre document utile', obligatoire: false },
        ].map((piece) => {
          const fichier = form['piece_' + piece.id];
          return (
            <div key={piece.id} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '12px 14px', borderRadius: '10px', marginBottom: '8px',
              backgroundColor: fichier ? '#e6f4f1' : piece.obligatoire ? '#fffbf0' : '#fafafa',
              border: `1.5px solid ${fichier ? '#006B68' : piece.obligatoire ? '#C8A23A' : '#e0e0e0'}`,
            }}>
              <div style={{ fontSize: '22px', flexShrink: 0 }}>{fichier ? '✅' : piece.obligatoire ? '⚠️' : '📄'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: fichier ? COLORS.primary : '#333' }}>
                  {piece.label}
                  {piece.obligatoire && <span style={{ color: '#e53e3e', marginLeft: '6px', fontSize: '11px' }}>OBLIGATOIRE</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{piece.detail}</div>
                {fichier && (
                  <div style={{ fontSize: '12px', color: COLORS.primary, marginTop: '4px', fontWeight: '600' }}>
                    📄 {fichier.nom} ({fichier.taille})
                    {fichier.source && <span style={{ fontStyle: 'italic', marginLeft: '6px' }}>— {fichier.source}</span>}
                  </div>
                )}
              </div>
              {peutModifier && !(piece as any).readonly && (
                <label style={{ backgroundColor: fichier ? 'white' : COLORS.primary, color: fichier ? COLORS.primary : 'white', border: fichier ? `1.5px solid ${COLORS.primary}` : 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-block', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {fichier ? '🔄 Remplacer' : '⬆ Importer'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const taille = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(f.size / 1024)} Ko`;
                        const updated = { ...form, ['piece_' + piece.id]: { nom: f.name, taille } };
                        setForm(updated);
                        localStorage.setItem('apprenant_' + id, JSON.stringify(updated));
                      }
                    }}
                  />
                </label>
              )}
            </div>
          );
        })}
      </Card>

      {/* Présences mensuelles */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Présences mensuelles</h2>
        <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px', fontStyle: 'italic' }}>
          Alimentées depuis le module Émargement
        </div>
      </Card>

      {/* Rupture */}
      <Card>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>Rupture de contrat</h2>
        {estEnRupture ? (
          <div style={{ padding: '16px', backgroundColor: '#fde8e8', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#c53030', fontWeight: '700', marginBottom: '12px' }}>❌ Contrat rompu</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Date de rupture</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#c53030' }}>{form.dateRupture || '—'}</div>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Maintien formation</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: form.maintienFormation === 'OUI' ? COLORS.primary : '#888' }}>{form.maintienFormation || '—'}</div>
              </div>
            </div>
            <BoutonPdfRupture
              apprenant={form}
              motif={rupture.motif}
              dateRupture={form.dateRupture}
              maintienFormation={form.maintienFormation}
              emailTuteur={form.emailTuteur}
              expediteur={utilisateur?.email}
              signature={utilisateur?.signatureEmail}
              nomFichier={"Rupture_" + form.nom + "_" + form.prenom + "_" + (form.dateRupture ?? 'date').replace(/\//g, '-') + ".pdf"}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#e6f4f1', borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', color: '#004744', fontWeight: '500' }}>✅ Aucune rupture déclarée.</span>
            <button onClick={() => setModaleRupture(true)} style={btnDanger}>Déclarer une rupture</button>
          </div>
        )}
      </Card>

      {/* Modale rupture */}
      {modaleRupture && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#e53e3e', marginBottom: '8px' }}>❌ Déclarer une rupture</h2>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{form.prenom} {form.nom}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date de rupture *</label>
                <input style={inputStyle} value={rupture.date} placeholder="JJ/MM/AAAA" onChange={e => setRupture(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Motif</label>
                <select style={inputStyle} value={rupture.motif} onChange={e => setRupture(p => ({ ...p, motif: e.target.value }))}>
                  <option value="">Choisir un motif...</option>
                  <option value="unilateral">Rupture unilatérale — 45 premiers jours</option>
                  <option value="commun">Rupture d'un commun accord</option>
                  <option value="force_majeure">Force majeure</option>
                  <option value="faute_grave">Faute grave de l'apprenti</option>
                  <option value="inaptitude">Inaptitude médicale</option>
                  <option value="initiative">À l'initiative de l'apprenti</option>
                  <option value="liquidation">Liquidation judiciaire</option>
                  <option value="exclusion">Exclusion définitive par le CFA</option>
                  <option value="diplome">Obtention du diplôme</option>
                  <option value="administratif">Décision administrative</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Maintien en formation (6 mois) *</label>
                <select style={inputStyle} value={rupture.maintien} onChange={e => setRupture(p => ({ ...p, maintien: e.target.value }))}>
                  <option value="OUI">OUI — L'apprenti continue la formation (MEF)</option>
                  <option value="NON">NON — L'apprenti quitte la formation (FMEF)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setModaleRupture(false)} style={btnSecondary}>Annuler</button>
              <button
                onClick={declarerRupture}
                disabled={!rupture.date}
                style={{ ...btnDanger, backgroundColor: rupture.date ? '#e53e3e' : '#f0f0f0', color: rupture.date ? 'white' : '#aaa', border: 'none' }}
              >
                ❌ Confirmer la rupture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
