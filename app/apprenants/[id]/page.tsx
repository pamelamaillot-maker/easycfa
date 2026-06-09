'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { APPRENANTS_REELS, DERNIERE_SITUATION_SIFA, verifierConformiteSifa, estMineur } from '../../../data/mockApprenants_reels';
import { ENTREPRISES_REELS } from '../../../data/mockEntreprises_reels';
import { SESSIONS } from '../../../data/mockData';
import { COLORS } from '../../../lib/constants';
import { chargerApprenti, creerApprenti, modifierApprenti, supprimerApprenti as supprimerApprentiSupabase, marquerDocApprenantEnAttente, marquerDocApprenantSignee, supprimerDocApprenant } from '../../../data/apprentisSupabase';
import { chargerEntreprises as chargerEntreprisesSupabase } from '../../../data/entreprisesSupabase';
import { chargerApcs } from '../../../data/apcsSupabase';
import { calculerPeriodeCr, calculerPeriodeCrFinal, nbMoisEntre } from '../../../lib/calculerPeriodeCr';
import { assemblerDonneesDMF } from '../../../lib/donneesDMF';
import { assemblerDonneesDroitImage } from '../../../lib/donneesDroitImage';
import { chercherNpecParRncp } from '../../../data/npecSupabase';
import { uploaderFichier, supprimerFichier, cheminStorage, type FichierStocke } from '../../../lib/storage';
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
import { chargerEmargements } from '../../../data/emargementsSupabase';
const BoutonPdfRupture = dynamic(() => import('../../../components/BoutonPdfRupture'), { ssr: false });
const BoutonGenerationDMF = dynamic(() => import('../../../components/BoutonGenerationDMF'), { ssr: false });
const BoutonRemplirLivret = dynamic(() => import('../../../components/BoutonRemplirLivret'), { ssr: false });
const BoutonPdfDroitImage = dynamic(() => import('../../../components/BoutonPdfDroitImage'), { ssr: false });
const SortiesAnticipeesManager = dynamic(() => import('../../../components/SortiesAnticipeesManager'), { ssr: false });
const BoutonCarteEtudiante = dynamic(() => import('../../../components/BoutonCarteEtudiante'), { ssr: false });

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

  // ✅ Upload du livret signé vers Supabase Storage
  async function uploadLivretSigne(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const chemin = cheminStorage('entretiens', entretien.id, 'livret_signe', f.name);
    const resUpload = await uploaderFichier(chemin, f);
    if (!resUpload.success || !resUpload.fichier) {
      alert(`⚠️ Erreur upload : ${resUpload.error}`);
      return;
    }
    console.log(`[Entretien ${entretien.id}] Livret signé uploadé vers Storage ✅`);
    const livretSigne = {
      nom: resUpload.fichier.nom,
      taille: resUpload.fichier.taille,
      url: resUpload.fichier.url,
      cheminStorage: resUpload.fichier.cheminStorage,
      dateImport: new Date().toISOString(),
    };
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

  async function supprimerLivretSigne() {
    if (!confirm('Supprimer le livret signé importé ?')) return;
    const cheminASupprimer = (entretien.supportUtilise?.livretSigne as any)?.cheminStorage;
    if (cheminASupprimer) {
      const resDel = await supprimerFichier(cheminASupprimer);
      if (!resDel.success) {
        console.warn(`[Entretien ${entretien.id}] Erreur suppression Storage : ${resDel.error}`);
      } else {
        console.log(`[Entretien ${entretien.id}] Livret signé supprimé du Storage ✅`);
      }
    }
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
                      <div style={{ fontSize: '12px', color: COLORS.primary, marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>📄 {entretien.supportUtilise.livretSigne.nom} ({entretien.supportUtilise.livretSigne.taille})</span>
                        {(entretien.supportUtilise.livretSigne as any).url && (
                          <a href={(entretien.supportUtilise.livretSigne as any).url} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary, textDecoration: 'underline', fontSize: '11px' }}>⬇ Télécharger</a>
                        )}
                        <span style={{ fontWeight: '400', fontStyle: 'italic' }}>
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
  const [historiqueEmargement, setHistoriqueEmargement] = useState<any[]>([]);
  const [crsApprenant, setCrsApprenant] = useState<any[]>([]);
  const [crFinalApprenant, setCrFinalApprenant] = useState<any>(null);

  // Charge l'historique d'émargement de l'apprenant (absences + retards)
  useEffect(() => {
    (async () => {
      try {
        const toutes = await chargerEmargements();
        const incidents: any[] = [];
        toutes.forEach((feuille: any) => {
          (feuille.demiJournees || []).forEach((dj: any) => {
            (dj.presences || []).forEach((p: any) => {
              if (p.apprenantId === id && (p.statut === 'Absent' || p.statut === 'Retard' || p.statut === 'Absent justifié')) {
                incidents.push({
                  feuilleId: feuille.id,
                  date: feuille.date,
                  jour: feuille.jour,
                  formation: feuille.formation,
                  demiJournee: dj.type,
                  theme: dj.theme,
                  statut: p.statut,
                  motif: p.motif || '',
                  duree: p.duree || '',
                  heureArrivee: p.heureArrivee || '',
                  justifiee: p.justifiee || null,
                  justificatifNom: p.justificatifNom,
                  justificatifUrl: p.justificatifUrl,
                });
              }
            });
          });
        });
        // Tri par date décroissante
        incidents.sort((a, b) => {
          const dA = a.date.split('/').reverse().join('-');
          const dB = b.date.split('/').reverse().join('-');
          return dB.localeCompare(dA);
        });
        setHistoriqueEmargement(incidents);
        console.log(`[FicheApprenant ${id}] ${incidents.length} incident(s) d'émargement chargés ✅`);
      } catch (e) {
        console.error('[FicheApprenant] Erreur chargement historique émargement:', e);
      }
    })();
  }, [id]);
  const [form, setForm] = useState<any>({});
  const [conventionEntreprise, setConventionEntreprise] = useState<any>(null);
  const [contratEntreprise, setContratEntreprise] = useState<any>(null);
  const [entrepriseObj, setEntrepriseObj] = useState<any>(null);
  const [npecApprenant, setNpecApprenant] = useState<any>(null);
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
      // Hydratation : reconstruit les piece_* depuis le JSON pieces pour l'affichage
      const trouveHydrate: any = { ...(trouve ?? {}) };
      if (trouveHydrate.pieces && typeof trouveHydrate.pieces === 'object') {
        Object.entries(trouveHydrate.pieces).forEach(([pieceId, fichier]) => {
          trouveHydrate['piece_' + pieceId] = fichier;
        });
      }
      setForm(trouveHydrate);
      setSessions(chargerSessions());
      setEntreprises(chargerEntreprises());

      if (trouve) {
        const ents = chargerOuCreerEntretiensApprenant(id, trouve.dateDebutContrat, trouve.dateFinContrat);
        setEntretiens(ents);
      }

      setChargement(false);
    })();
  }, [id]);

  // Charge le NPEC correspondant à la formation de l'apprenant
  useEffect(() => {
    if (!apprenant?.formation) return;
    (async () => {
      try {
        // On cherche par code RNCP (via numeroDossierOpco ou rncpCode) ou par codeInterne
        const codeRncp = apprenant.rncpCode || apprenant.numeroDossierOpco || '';
        if (codeRncp) {
          const n = await chercherNpecParRncp(codeRncp);
          if (n) {
            setNpecApprenant(n);
            return;
          }
        }
        // Fallback : chercher par codeInterne (= apprenant.formation)
        const { chargerNpec } = await import('../../../data/npecSupabase');
        const tous = await chargerNpec();
        const match = tous.find((x: any) => x.codeInterne === apprenant.formation);
        if (match) setNpecApprenant(match);
      } catch (e) {
        console.error('[FicheApprenant] Erreur chargement NPEC:', e);
      }
    })();
  }, [apprenant?.formation]);

  // Charge les Certificats de Réalisation (CR) liés à cet apprenant via les APCs
  useEffect(() => {
    if (!apprenant) return;
    (async () => {
      try {
        const apcs = await chargerApcs();
        const apcsApp = apcs.filter((a: any) => a.apprenantId === id);
        const lignesCr: any[] = [];
        let crFinalTrouve: any = null;
        apcsApp.forEach((apc: any) => {
          // CR par échéance (sur les échéances pédago, sauf la 1ère)
          const pedago = (apc.echeances || []).filter((e: any) => e.type === 'pedago').sort((a: any, b: any) => {
            const pA = (a.dateEcheance || '').split('/'), pB = (b.dateEcheance || '').split('/');
            if (pA.length !== 3 || pB.length !== 3) return 0;
            return new Date(parseInt(pA[2]), parseInt(pA[1]) - 1, parseInt(pA[0])).getTime() - new Date(parseInt(pB[2]), parseInt(pB[1]) - 1, parseInt(pB[0])).getTime();
          });
          pedago.forEach((ech: any, idx: number) => {
            if (idx === 0) return; // Pas de CR sur la 1ère échéance
            const periode = calculerPeriodeCr(
              apc.echeances as any,
              ech as any,
              apc.dateDebutContrat,
              apc.dateFinContrat,
              apprenant.dateRupture
            );
            const cr = ech.pieces?.certificatRealisation;
            lignesCr.push({
              apcId: apc.id,
              opco: apc.opco,
              echeanceLabel: ech.label,
              periode,
              cr: cr || null,
              statut: cr?.statut || 'non_genere',
            });
          });

          // CR final par APC
          const finalPeriode = calculerPeriodeCrFinal(
            apc.dateDebutContrat,
            apc.dateFinContrat,
            apprenant.dateRupture
          );
          if (finalPeriode) {
            const nbMois = nbMoisEntre(finalPeriode.debut, finalPeriode.fin);
            crFinalTrouve = {
              apcId: apc.id,
              opco: apc.opco,
              periode: finalPeriode,
              nbMois,
            };
          }
        });
        setCrsApprenant(lignesCr);
        setCrFinalApprenant(crFinalTrouve);
        console.log(`[FicheApprenant ${id}] ${lignesCr.length} CR(s) chargés depuis APCs ✅`);
      } catch (e) {
        console.error('[FicheApprenant] Erreur chargement CRs:', e);
      }
    })();
  }, [apprenant, id]);

  // Charge la convention signée depuis l'entreprise (lecture seule)
  useEffect(() => {
    if (!apprenant) return;
    (async () => {
      try {
        const ents = await chargerEntreprisesSupabase();
        // Normalise un nom d'entreprise (ignore casse, accents, espaces multiples)
        const normEnt = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
        // Trouve l'entreprise par entrepriseId ou par nom normalisé
        const ent = ents.find(e =>
          (apprenant.entrepriseId && e.id === apprenant.entrepriseId) ||
          (apprenant.entreprise && normEnt(e.raisonSociale || '') === normEnt(apprenant.entreprise))
        );
        if (!ent) {
          setConventionEntreprise(null);
          setEntrepriseObj(null);
          return;
        }
        setEntrepriseObj(ent);
        const fin = (ent as any).financementsApprenants?.[id];
        const conv = fin?.convention;
        if (conv) {
          setConventionEntreprise({
            ...conv,
            entrepriseId: ent.id,
            entrepriseRaisonSociale: ent.raisonSociale,
          });
          console.log(`[FicheApprenant ${id}] Convention chargée depuis entreprise ${ent.raisonSociale} : ${conv.statut} ✅`);
        } else {
          setConventionEntreprise(null);
        }
        const contrat = fin?.contratApprentissage;
        if (contrat) {
          setContratEntreprise({
            ...contrat,
            entrepriseId: ent.id,
            entrepriseRaisonSociale: ent.raisonSociale,
          });
          console.log(`[FicheApprenant ${id}] Contrat chargé depuis entreprise ${ent.raisonSociale} : ${contrat.statut} ✅`);
        } else {
          setContratEntreprise(null);
        }
      } catch (e) {
        console.error('[FicheApprenant] Erreur chargement convention entreprise:', e);
      }
    })();
  }, [apprenant, id]);

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
      // Nettoyage : reconstruit le champ JSON `pieces` à partir des piece_*
      const pourSupabase: any = { ...form };
      const piecesReconstruites: any = { ...(form.pieces || {}) };
      Object.keys(pourSupabase).forEach((k) => {
        if (k.startsWith('piece_')) {
          const pieceId = k.replace('piece_', '');
          if (pourSupabase[k]) piecesReconstruites[pieceId] = pourSupabase[k];
          delete pourSupabase[k];
        }
      });
      pourSupabase.pieces = piecesReconstruites;

      const res = await modifierApprenti(id, pourSupabase);
      if (!res.success) {
        alert(`⚠️ Erreur Supabase : ${res.error}\nModifications enregistrées localement uniquement.`);
      } else {
        console.log(`[FicheApprenant ${id}] Sauvegardé dans Supabase ✅ (pieces:`, Object.keys(piecesReconstruites), ')');
      } } catch (e) {
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
    const updated = { ...form, statut: 'Rupture', dateRupture: rupture.date, maintienFormation: rupture.maintien, motifRupture: rupture.motif };
    // 1. Supabase d'abord
    try {
      const res = await modifierApprenti(id, { statut: 'Rupture', dateRupture: rupture.date, maintienFormation: rupture.maintien, motifRupture: rupture.motif });
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
              
              <a  href={`/emargement/mensuel?apprenantId=${id}`}
                style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
              >
                📊 Générer état mensuel
              </a>
              <BoutonPdfDroitImage
                donnees={assemblerDonneesDroitImage(form, entrepriseObj)}
                nomFichier={'Droit_Image_' + form.nom + '_' + form.prenom + '.pdf'}
              />
              <BoutonRemplirLivret
                apprenant={form}
                entreprise={entrepriseObj}
                npec={npecApprenant}
              />
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
              <BoutonGenerationDMF
                donnees={assemblerDonneesDMF(form, entrepriseObj)}
                nomFichier={`DMF_Maintien_${form.nom}_${form.prenom}_${(form.dateRupture || '').replace(/\//g, '-')}.pdf`}
              />
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

          {/* 📷 Photo d'identité — repère visuel équipe + future carte étudiante */}
          {(() => {
            const photo = form.piece_photo_identite || form.pieces?.photo_identite;
            return (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px', paddingBottom: '14px', borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{
                  width: '84px', aspectRatio: '35 / 45', borderRadius: '8px', overflow: 'hidden',
                  backgroundColor: '#f0f0f0', border: `1.5px solid ${photo?.url ? COLORS.primary : '#e0e0e0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {photo?.url ? (
                    <img src={photo.url} alt={`Photo de ${form.prenom} ${form.nom}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '32px', opacity: 0.35 }}>👤</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Photo d'identité</div>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                    Format portrait — servira pour la carte étudiante (JPG, PNG — Max 5 Mo)
                  </div>
                  {peutModifier ? (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <label style={{ backgroundColor: photo?.url ? 'white' : COLORS.primary, color: photo?.url ? COLORS.primary : 'white', border: photo?.url ? `1.5px solid ${COLORS.primary}` : 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {photo?.url ? '🔄 Remplacer' : '⬆ Importer'}
                        <input type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const chemin = cheminStorage('apprenants', id, 'photo_identite', f.name);
                          const resStorage = await uploaderFichier(chemin, f);
                          if (!resStorage.success || !resStorage.fichier) { alert(`⚠️ Erreur upload : ${resStorage.error}`); return; }
                          console.log(`[Apprenant ${id}] Photo d'identité uploadée vers Storage ✅`);
                          const fichierStocke: FichierStocke = resStorage.fichier!;
                          const nouvellesPieces = { ...(form.pieces || {}), photo_identite: fichierStocke };
                          const updated = { ...form, piece_photo_identite: fichierStocke, pieces: nouvellesPieces };
                          setForm(updated);
                          setApprenant(updated);
                          localStorage.setItem('apprenant_' + id, JSON.stringify(updated));
                          const res = await modifierApprenti(id, { pieces: nouvellesPieces });
                          if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
                          else console.log(`[Apprenant ${id}] Photo d'identité enregistrée dans Supabase ✅`);
                        }} />
                      </label>
                      {photo?.url && (
                        <button onClick={async () => {
                          if (!confirm('Supprimer la photo d\'identité ?')) return;
                          if (photo.cheminStorage) {
                            const resDel = await supprimerFichier(photo.cheminStorage);
                            if (!resDel.success) console.warn(`[Apprenant ${id}] Erreur suppression Storage : ${resDel.error}`);
                          }
                          const nouvellesPieces = { ...(form.pieces || {}) };
                          delete nouvellesPieces.photo_identite;
                          const updated = { ...form, piece_photo_identite: undefined, pieces: nouvellesPieces };
                          setForm(updated);
                          setApprenant(updated);
                          localStorage.setItem('apprenant_' + id, JSON.stringify(updated));
                          const res = await modifierApprenti(id, { pieces: nouvellesPieces });
                          if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
                        }} style={{ backgroundColor: 'white', color: '#c53030', border: '1.5px solid #c53030', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  ) : (
                    !photo?.url && <div style={{ fontSize: '11px', color: '#bbb', fontStyle: 'italic' }}>Aucune photo</div>
                  )}
                </div>
              </div>
            );
          })()}

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

      {/* Sorties anticipées — historique multi-PDF */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>🚪 Sorties anticipées</h2>
          <span style={{ fontSize: '12px', color: '#888' }}>Décharges de responsabilité — Historique</span>
        </div>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 12, marginTop: 0, fontStyle: 'italic' }}>
          Permet à l'apprenant(e) de quitter le CFA en cours de journée pour un RDV médical, France Travail, activité entreprise, urgence familiale, etc.
        </p>
        <SortiesAnticipeesManager
          apprenant={form}
          entreprise={entrepriseObj}
          onChange={(sorties) => {
            const updated = { ...form, sortiesAnticipees: sorties };
            setForm(updated);
            setApprenant(updated);
          }}
        />
      </Card>

      {/* Droit à l'image — workflow signature */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>📸 Autorisation de droit à l'image (RGPD)</h2>
          <span style={{ fontSize: '12px', color: '#888' }}>Document à conserver dans le dossier</span>
        </div>
        {(() => {
          const di = form.droitImage || {};
          const diStatut = di.statut || 'a_generer';
          const bg = diStatut === 'signee' ? '#e6f4f1' : diStatut === 'en_attente' ? '#fff8e1' : '#f0f4ff';
          const border = diStatut === 'signee' ? '#006B68' : diStatut === 'en_attente' ? '#ffe082' : '#3a5bc7';
          const icon = diStatut === 'signee' ? '✅' : diStatut === 'en_attente' ? '⏳' : '📸';
          const label = diStatut === 'signee' ? 'Signée' : diStatut === 'en_attente' ? 'En attente de signature' : 'À envoyer après génération';
          return (
            <div style={{ padding: 14, backgroundColor: bg, borderRadius: 8, border: `1.5px solid ${border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ fontSize: 26 }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: diStatut === 'signee' ? '#006B68' : '#3a5bc7' }}>
                    Autorisation droit à l'image — {label}
                  </div>
                  {diStatut === 'en_attente' && di.dateEnvoiEmail && (
                    <div style={{ fontSize: 11, color: '#C8A23A', marginTop: 4 }}>
                      📧 Envoyée pour signature le {new Date(di.dateEnvoiEmail).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                  {diStatut === 'signee' && di.dateSignature && (
                    <div style={{ fontSize: 12, color: '#006B68', marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span>📄 {di.fichierSigneNom}</span>
                      <a href={di.fichierSigneUrl} target="_blank" rel="noreferrer" style={{ color: '#006B68', textDecoration: 'underline', fontSize: 11 }}>⬇ Télécharger</a>
                      <span style={{ color: '#888', fontStyle: 'italic', fontSize: 11 }}>— Importé le {new Date(di.dateSignature).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {diStatut === 'a_generer' && (
                    <div style={{ fontSize: 11, color: '#666', marginTop: 4, fontStyle: 'italic' }}>
                      Cliquez sur 📸 Droit à l'image en haut pour télécharger le PDF, faites signer l'apprenant(e), puis importez le PDF signé ci-dessous.
                    </div>
                  )}
                </div>
              </div>
              {peutModifier && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {diStatut === 'a_generer' && (
                    <button
                      onClick={async () => {
                        if (!confirm('Marquer le Droit à l\'image comme envoyé pour signature ?\n\nAssurez-vous d\'avoir téléchargé le PDF avant.')) return;
                        const res = await marquerDocApprenantEnAttente(id, 'droitImage', '', 'DroitImage_' + form.nom + '_' + form.prenom + '.pdf', '');
                        if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                        const updated = { ...form, droitImage: { statut: 'en_attente', dateEnvoiEmail: new Date().toISOString(), fichierNonSigneNom: 'DroitImage_' + form.nom + '_' + form.prenom + '.pdf' } };
                        setForm(updated); setApprenant(updated);
                      }}
                      style={{ backgroundColor: '#C8A23A', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✉️ Marquer comme envoyée
                    </button>
                  )}
                  {diStatut === 'en_attente' || diStatut === 'signee' ? (
                    <label style={{ backgroundColor: diStatut === 'signee' ? 'white' : '#006B68', color: diStatut === 'signee' ? '#006B68' : 'white', border: diStatut === 'signee' ? '1.5px solid #006B68' : 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {diStatut === 'signee' ? '🔄 Remplacer le signé' : '📤 Importer Droit à l\'image signé'}
                      <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={async (ev) => {
                        const f = ev.target.files?.[0];
                        if (!f) return;
                        const chemin = cheminStorage('apprenants', id, 'droit_image_signe', f.name);
                        const resUp = await uploaderFichier(chemin, f);
                        if (!resUp.success || !resUp.fichier) { alert(`⚠️ Erreur upload : ${resUp.error}`); return; }
                        const res = await marquerDocApprenantSignee(id, 'droitImage', resUp.fichier.url, f.name, chemin);
                        if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                        const apprenantMaj = await chargerApprenti(id);
                        if (apprenantMaj) { setForm(apprenantMaj); setApprenant(apprenantMaj); }
                      }} />
                    </label>
                  ) : null}
                  {diStatut !== 'a_generer' && (
                    <button
                      onClick={async () => {
                        if (!confirm('Annuler/supprimer le suivi du Droit à l\'image ?')) return;
                        const res = await supprimerDocApprenant(id, 'droitImage');
                        if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                        const updated = { ...form, droitImage: null };
                        setForm(updated); setApprenant(updated);
                      }}
                      style={{ backgroundColor: 'white', color: '#c00', border: '1px solid #c00', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✕ Annuler
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </Card>

      {/* 🎓 Carte d'étudiant des métiers */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>🎓 Carte d'étudiant des métiers</h2>
          <span style={{ fontSize: '12px', color: '#888' }}>Nominative — à imprimer recto/verso</span>
        </div>
        {(() => {
          const photo = form.piece_photo_identite || form.pieces?.photo_identite;
          const aPhoto = !!photo?.url;
          const c = form.carteEtudiant || {};
          const cStatut = c.statut || 'a_generer';
          const bg = cStatut === 'signee' ? '#e6f4f1' : cStatut === 'en_attente' ? '#fff8e1' : '#fffbf0';
          const border = cStatut === 'signee' ? '#006B68' : cStatut === 'en_attente' ? '#ffe082' : '#C8A23A';
          const icon = cStatut === 'signee' ? '✅' : cStatut === 'en_attente' ? '⏳' : '🎓';
          const label = cStatut === 'signee' ? 'Signée' : cStatut === 'en_attente' ? 'En attente de signature' : 'À générer puis faire signer';
          const nomFichier = 'Carte_Etudiant_' + (form.nom || '') + '_' + (form.prenom || '') + '.pdf';
          return (
            <div style={{ padding: 14, backgroundColor: bg, borderRadius: 8, border: `1.5px solid ${border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ fontSize: 26 }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: cStatut === 'signee' ? '#006B68' : '#7a5c00' }}>
                    Carte d'étudiant — {label}
                  </div>
                  {cStatut === 'en_attente' && c.dateEnvoiEmail && (
                    <div style={{ fontSize: 11, color: '#C8A23A', marginTop: 4 }}>
                      📧 Marquée envoyée pour signature le {new Date(c.dateEnvoiEmail).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                  {cStatut === 'signee' && c.dateSignature && (
                    <div style={{ fontSize: 11, color: '#006B68', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>📄 {c.fichierSigneNom}</span>
                      <a href={c.fichierSigneUrl} target="_blank" rel="noreferrer" style={{ color: '#006B68', textDecoration: 'underline', fontSize: 11 }}>⬇ Télécharger</a>
                      <span style={{ color: '#888', fontStyle: 'italic' }}>— Importée le {new Date(c.dateSignature).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {cStatut === 'a_generer' && (
                    <div style={{ fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.5 }}>
                      Recto : photo, {form.prenom} {form.nom}, né(e) le {form.dateNaissance || '—'}, validité {form.dateFinContrat || '—'}.
                      {!aPhoto && <><br />Ajoutez une photo dans la carte « Identité » pour une carte complète.</>}
                    </div>
                  )}
                </div>
              </div>
              {peutModifier && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <BoutonCarteEtudiante apprenant={form} nomFichier={nomFichier} />

                  {cStatut === 'a_generer' && (
                    <button
                      onClick={async () => {
                        if (!confirm('Marquer la carte comme envoyée pour signature ?\n\nAssurez-vous d\'avoir généré et transmis le PDF à l\'apprenti(e) avant.')) return;
                        const res = await marquerDocApprenantEnAttente(id, 'carteEtudiant', '', nomFichier, '');
                        if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                        const updated = { ...form, carteEtudiant: { statut: 'en_attente', dateEnvoiEmail: new Date().toISOString(), fichierNonSigneNom: nomFichier } };
                        setForm(updated); setApprenant(updated);
                      }}
                      style={{ backgroundColor: '#C8A23A', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✉️ Marquer comme envoyée
                    </button>
                  )}

                  {(cStatut === 'en_attente' || cStatut === 'signee') && (
                    <label style={{ backgroundColor: cStatut === 'signee' ? 'white' : '#006B68', color: cStatut === 'signee' ? '#006B68' : 'white', border: cStatut === 'signee' ? '1.5px solid #006B68' : 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {cStatut === 'signee' ? '🔄 Remplacer la signée' : '📤 Importer la carte signée'}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={async (ev) => {
                        const f = ev.target.files?.[0];
                        if (!f) return;
                        const chemin = cheminStorage('apprenants', id, 'carte_etudiant_signee', f.name);
                        const resUp = await uploaderFichier(chemin, f);
                        if (!resUp.success || !resUp.fichier) { alert(`⚠️ Erreur upload : ${resUp.error}`); return; }
                        const res = await marquerDocApprenantSignee(id, 'carteEtudiant', resUp.fichier.url, f.name, chemin);
                        if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                        const apprenantMaj = await chargerApprenti(id);
                        if (apprenantMaj) { setForm(apprenantMaj); setApprenant(apprenantMaj); }
                      }} />
                    </label>
                  )}

                  {cStatut !== 'a_generer' && (
                    <button
                      onClick={async () => {
                        if (!confirm('Annuler/supprimer le suivi de la carte signée ?')) return;
                        const res = await supprimerDocApprenant(id, 'carteEtudiant');
                        if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                        const updated = { ...form, carteEtudiant: null };
                        setForm(updated); setApprenant(updated);
                      }}
                      style={{ backgroundColor: 'white', color: '#c00', border: '1px solid #c00', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✕ Annuler
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}
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
          { id: 'dpae', label: 'DPAE', detail: 'Déclaration Préalable à l\'Embauche', obligatoire: false },
          { id: 'p2s', label: 'P2S', detail: 'Document P2S (stagiaire)', obligatoire: false },
          { id: 'attestation_hebergement', label: 'Attestation d\'hébergement', detail: 'Si l\'apprenant est hébergé', obligatoire: false },
          { id: 'piece_identite_hebergeur', label: 'Pièce d\'identité de l\'hébergeur', detail: 'CNI ou titre de séjour de l\'hébergeant', obligatoire: false },
          { id: 'autre', label: 'Autre document', detail: 'Tout autre document utile', obligatoire: false },
        ].map((piece) => {
          // Cas spécial : contrat → lit depuis l'entreprise (lecture seule)
          let fichier: any;
          if (piece.id === 'contrat' && contratEntreprise) {
            if (contratEntreprise.statut === 'signee' && contratEntreprise.fichierSigneUrl) {
              fichier = {
                nom: contratEntreprise.fichierSigneNom || 'Contrat d\'apprentissage signé.pdf',
                taille: '',
                url: contratEntreprise.fichierSigneUrl,
                source: `Importé le ${new Date(contratEntreprise.dateSignature).toLocaleDateString('fr-FR')} via fiche entreprise`,
              };
            } else {
              fichier = null;
            }
          } else {
            fichier = form['piece_' + piece.id];
          }
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
                  <div style={{ fontSize: '12px', color: COLORS.primary, marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    📄 {fichier.nom} ({fichier.taille})
                    {fichier.source && <span style={{ fontStyle: 'italic' }}>— {fichier.source}</span>}
                    {fichier.url && (
                      <a
                        href={fichier.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ backgroundColor: '#e6f4f1', color: COLORS.primary, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', fontWeight: '600' }}
                      >
                        ⬇ Télécharger
                      </a>
                    )}
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
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;

                      // 1. Upload Storage
                      const chemin = cheminStorage('apprenants', id, piece.id, f.name);
                      const resStorage = await uploaderFichier(chemin, f);
                      if (!resStorage.success) {
                        alert(`⚠️ Erreur upload : ${resStorage.error}`);
                        return;
                      }
                      console.log(`[Apprenant ${id}] Pièce '${piece.id}' uploadée vers Storage ✅`);

                      const fichierStocke: FichierStocke = resStorage.fichier!;

                      // 2. Mise à jour formulaire local (compat localStorage + UI)
                      const updated = { ...form, ['piece_' + piece.id]: fichierStocke };
                      setForm(updated);
                      localStorage.setItem('apprenant_' + id, JSON.stringify(updated));

                      // 3. Mise à jour Supabase via colonne JSONB 'pieces'
                      const piecesActuelles = form.pieces || {};
                      const nouvellesPieces = { ...piecesActuelles, [piece.id]: fichierStocke };
                      const res = await modifierApprenti(id, { pieces: nouvellesPieces });
                      if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
                      else console.log(`[Apprenant ${id}] Pièces sauvegardées dans Supabase ✅`);
                      // Mise à jour locale aussi pour cohérence
                      setForm((p: any) => ({ ...p, pieces: nouvellesPieces }));
                    }}
                  />
                </label>
              )}
            </div>
          );
        })}
      </Card>

      {/* === Certificats de Réalisation (LECTURE SEULE) === */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>📜 Certificats de Réalisation</h2>
            <p style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: 2 }}>
              Preuves Qualiopi/OPCO de réalisation de la formation — Lecture seule
            </p>
          </div>
          
            <a href="/precomptabilite"
            style={{ ...btnSecondary, textDecoration: 'none', display: 'inline-block', fontSize: 12 }}
          >
            → Gérer les CR (Facturation)
          </a>
        </div>

        {crsApprenant.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted, fontSize: '13px', fontStyle: 'italic', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            Aucun CR généré pour cet apprenant.<br />
            <span style={{ fontSize: 11 }}>Les CR sont générés depuis la page Facturation, à partir de l'échéance n°2 de chaque dossier APC.</span>
          </div>
        ) : (
          <>
            {/* Stats CR */}
            {(() => {
              const nbSignes = crsApprenant.filter(c => c.statut === 'signe').length;
              const nbASigner = crsApprenant.filter(c => c.statut === 'a_signer').length;
              const nbNonGen = crsApprenant.filter(c => c.statut === 'non_genere').length;
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                  <div style={{ backgroundColor: '#dcfce7', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>{nbSignes}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>Signés</div>
                  </div>
                  <div style={{ backgroundColor: '#fef6e4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#C8A23A' }}>{nbASigner}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>À signer</div>
                  </div>
                  <div style={{ backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#888' }}>{nbNonGen}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>Non générés</div>
                  </div>
                  <div style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.primary }}>{crsApprenant.length}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>Total</div>
                  </div>
                </div>
              );
            })()}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                    {['OPCO', 'Échéance', 'Période', 'Statut', 'PDF signé'].map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {crsApprenant.map((ligne, idx) => {
                    const styleStatut =
                      ligne.statut === 'signe' ? { bg: '#dcfce7', color: '#15803d', label: '✅ Signé' }
                      : ligne.statut === 'a_signer' ? { bg: '#fef6e4', color: '#C8A23A', label: '⏳ À signer' }
                      : { bg: '#f5f5f5', color: '#888', label: '— Non généré' };
                    return (
                      <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: '10px', fontSize: 12, fontWeight: 600, color: COLORS.text }}>{ligne.opco}</td>
                        <td style={{ padding: '10px', fontSize: 12, color: COLORS.textMuted }}>{ligne.echeanceLabel}</td>
                        <td style={{ padding: '10px', fontSize: 12 }}>
                          {ligne.periode ? (
                            <span><strong>{ligne.periode.debut}</strong> → <strong>{ligne.periode.fin}</strong></span>
                          ) : (
                            <span style={{ color: '#bbb', fontStyle: 'italic' }}>Période non calculable</span>
                          )}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ backgroundColor: styleStatut.bg, color: styleStatut.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {styleStatut.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          {ligne.cr?.statut === 'signe' && ligne.cr.fichierSigneUrl ? (
                            <a href={ligne.cr.fichierSigneUrl} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#e6f4f1', color: COLORS.primary, padding: '3px 10px', borderRadius: 6, fontSize: 11, textDecoration: 'none', fontWeight: 600 }}>
                              📄 Voir
                            </a>
                          ) : (
                            <span style={{ color: '#bbb', fontSize: 11, fontStyle: 'italic' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CR FINAL */}
            {crFinalApprenant && (
              <div style={{ marginTop: 14, padding: 12, backgroundColor: '#f0f4ff', borderRadius: 8, border: '1.5px solid #3a5bc7' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#3a5bc7', marginBottom: 4 }}>
                  🏛️ CR FINAL — pour contrôle OPCO
                </div>
                <div style={{ fontSize: 11, color: '#555' }}>
                  Période complète du contrat : <strong>{crFinalApprenant.periode.debut}</strong> → <strong>{crFinalApprenant.periode.fin}</strong>
                  <span style={{ marginLeft: 8, color: '#3a5bc7', fontWeight: 700 }}>= {crFinalApprenant.nbMois} mois</span>
                </div>
                <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic', marginTop: 4 }}>
                  Ce CR final est généré à la demande depuis la page Facturation, en cas de contrôle Qualiopi/OPCO.
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Historique des absences et retards */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>📋 Historique des absences et retards</h2>
          <span style={{ fontSize: '12px', color: '#888' }}>Alimenté depuis le module Émargement</span>
        </div>

        {/* Stats rapides */}
        {historiqueEmargement.length > 0 && (() => {
          const nbAbs = historiqueEmargement.filter(i => i.statut === 'Absent').length;
          const nbAbsJ = historiqueEmargement.filter(i => i.statut === 'Absent justifié').length;
          const nbRet = historiqueEmargement.filter(i => i.statut === 'Retard').length;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#fde8e8', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#e53e3e' }}>{nbAbs}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>Absences</div>
              </div>
              <div style={{ backgroundColor: '#f0f4ff', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#3a5bc7' }}>{nbAbsJ}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>Justifiées</div>
              </div>
              <div style={{ backgroundColor: '#fef6e4', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#C8A23A' }}>{nbRet}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>Retards</div>
              </div>
              <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: COLORS.primary }}>{historiqueEmargement.length}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>Total</div>
              </div>
            </div>
          );
        })()}

        {historiqueEmargement.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted, fontSize: '13px', fontStyle: 'italic', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            ✅ Aucune absence ou retard enregistré
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                  {['Date', 'Demi-J.', 'Statut', 'Motif', 'Justifiée', 'Justificatif'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historiqueEmargement.map((i, idx) => {
                  const styleStatut = i.statut === 'Absent' ? { bg: '#fde8e8', color: '#e53e3e', icon: '❌' }
                    : i.statut === 'Retard' ? { bg: '#fef6e4', color: '#C8A23A', icon: '⚠️' }
                    : { bg: '#f0f4ff', color: '#3a5bc7', icon: '📋' };
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: '600' }}>
                        {i.date}
                        <div style={{ fontSize: '10px', color: '#888', fontWeight: '400' }}>{i.jour}</div>
                      </td>
                      <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>
                        {i.demiJournee === 'Matin' ? '🌅' : '🌇'} {i.demiJournee}
                        {i.heureArrivee && <div style={{ fontSize: '10px', color: '#888' }}>Arrivée {i.heureArrivee}</div>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ backgroundColor: styleStatut.bg, color: styleStatut.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {styleStatut.icon} {i.statut}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '12px', color: COLORS.text, maxWidth: '300px' }}>
                        {i.motif || <span style={{ color: '#bbb', fontStyle: 'italic' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {i.justifiee === 'OUI' && <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>✅ Oui</span>}
                        {i.justifiee === 'NON' && <span style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>❌ Non</span>}
                        {!i.justifiee && <span style={{ color: '#bbb', fontSize: '12px', fontStyle: 'italic' }}>En attente</span>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {i.justificatifUrl ? (
                          <a href={i.justificatifUrl} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#e6f4f1', color: COLORS.primary, padding: '3px 10px', borderRadius: '6px', fontSize: '11px', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            📄 {i.justificatifNom || 'Voir'}
                          </a>
                        ) : (
                          <span style={{ color: '#bbb', fontSize: '12px', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
              motif={rupture.motif || form.motifRupture || ''}
              dateRupture={form.dateRupture}
              maintienFormation={form.maintienFormation}
              emailTuteur={form.emailTuteur}
              expediteur={utilisateur?.email}
              signature={utilisateur?.signatureEmail}
              nomFichier={"Rupture_" + form.nom + "_" + form.prenom + "_" + (form.dateRupture ?? 'date').replace(/\//g, '-') + ".pdf"}
              entreprise={entrepriseObj}
            />
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #ccc' }}>
              <button
                onClick={async () => {
                  if (!confirm(`⚠️ Annuler la rupture de ${form.prenom} ${form.nom} ?\n\nCela va :\n- Remettre le statut "En cours"\n- Effacer la date de rupture, le motif et le maintien\n- L'apprenant redeviendra actif comme avant la rupture`)) return;
                  // Supabase d'abord
                  const res = await modifierApprenti(id, {
                    statut: 'En cours',
                    dateRupture: null as any,
                    maintienFormation: null as any,
                    motifRupture: null as any,
                  });
                  if (!res.success) { alert(`⚠️ Erreur Supabase : ${res.error}`); return; }
                  console.log(`[FicheApprenant ${id}] Rupture annulée dans Supabase ✅`);
                  // UI + localStorage en miroir
                  const updated = { ...form, statut: 'En cours', dateRupture: '', maintienFormation: '', motifRupture: '' };
                  setForm(updated);
                  setApprenant(updated);
                  localStorage.setItem('apprenant_' + id, JSON.stringify(updated));
                  try {
                    const liste = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
                    const idx = liste.findIndex((a: any) => a.id === id);
                    if (idx >= 0) liste[idx] = { ...liste[idx], ...updated };
                    localStorage.setItem('easycfa_apprenants_v2', JSON.stringify(liste));
                  } catch {}
                  setSauvegarde(true);
                  setTimeout(() => setSauvegarde(false), 3000);
                }}
                style={{ backgroundColor: 'white', color: '#666', border: '1px solid #ccc', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                ↩️ Annuler la rupture (erreur de saisie)
              </button>
            </div>

            {/* === Workflow Rupture : générer / envoyée / signée === */}
            {(() => {
              const r = form.rupture || {};
              const rStatut = r.statut || 'a_generer';
              const bg = rStatut === 'signee' ? '#e6f4f1' : rStatut === 'en_attente' ? '#fff8e1' : '#fffbf0';
              const border = rStatut === 'signee' ? '#006B68' : rStatut === 'en_attente' ? '#ffe082' : '#C8A23A';
              const icon = rStatut === 'signee' ? '✅' : rStatut === 'en_attente' ? '⏳' : '📤';
              const label = rStatut === 'signee' ? 'Signée' : rStatut === 'en_attente' ? 'En attente de signature' : 'Non générée';
              return (
                <div style={{ marginTop: 14, padding: 12, backgroundColor: bg, borderRadius: 8, border: `1.5px solid ${border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div style={{ fontSize: 22 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: rStatut === 'signee' ? '#006B68' : '#7a5c00' }}>
                        Formulaire de rupture — {label}
                      </div>
                      {rStatut === 'en_attente' && r.dateEnvoiEmail && (
                        <div style={{ fontSize: 11, color: '#C8A23A', marginTop: 2 }}>
                          📧 Envoyée pour signature le {new Date(r.dateEnvoiEmail).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      {rStatut === 'signee' && r.dateSignature && (
                        <div style={{ fontSize: 11, color: '#006B68', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span>📄 {r.fichierSigneNom}</span>
                          <a href={r.fichierSigneUrl} target="_blank" rel="noreferrer" style={{ color: '#006B68', textDecoration: 'underline', fontSize: 11 }}>⬇ Télécharger</a>
                          <span style={{ color: '#888', fontStyle: 'italic' }}>— Importé le {new Date(r.dateSignature).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {peutModifier && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {rStatut === 'a_generer' && (
                        <button
                          onClick={async () => {
                            // Sauvegarde un placeholder en attente (l'utilisateur a téléchargé le PDF et va l'envoyer)
                            if (!confirm('Marquer le formulaire de rupture comme envoyé pour signature ?\n\nAssurez-vous d\'avoir téléchargé le PDF avant.')) return;
                            const res = await marquerDocApprenantEnAttente(id, 'rupture', '', 'Rupture_' + form.nom + '_' + form.prenom + '.pdf', '');
                            if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                            const updated = { ...form, rupture: { statut: 'en_attente', dateEnvoiEmail: new Date().toISOString(), fichierNonSigneNom: 'Rupture_' + form.nom + '_' + form.prenom + '.pdf' } };
                            setForm(updated); setApprenant(updated);
                          }}
                          style={{ backgroundColor: '#C8A23A', color: 'white', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          ✉️ Marquer comme envoyée
                        </button>
                      )}
                      {rStatut === 'en_attente' || rStatut === 'signee' ? (
                        <label style={{ backgroundColor: rStatut === 'signee' ? 'white' : '#006B68', color: rStatut === 'signee' ? '#006B68' : 'white', border: rStatut === 'signee' ? '1.5px solid #006B68' : 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {rStatut === 'signee' ? '🔄 Remplacer le signé' : '📤 Importer rupture signée'}
                          <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={async (ev) => {
                            const f = ev.target.files?.[0];
                            if (!f) return;
                            const chemin = cheminStorage('apprenants', id, 'rupture_signee', f.name);
                            const resUp = await uploaderFichier(chemin, f);
                            if (!resUp.success || !resUp.fichier) { alert(`⚠️ Erreur upload : ${resUp.error}`); return; }
                            const res = await marquerDocApprenantSignee(id, 'rupture', resUp.fichier.url, f.name, chemin);
                            if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                            const apprenantMaj = await chargerApprenti(id);
                            if (apprenantMaj) { setForm(apprenantMaj); setApprenant(apprenantMaj); }
                          }} />
                        </label>
                      ) : null}
                      {rStatut !== 'a_generer' && (
                        <button
                          onClick={async () => {
                            if (!confirm('Annuler/supprimer le suivi de la rupture signée ?')) return;
                            const res = await supprimerDocApprenant(id, 'rupture');
                            if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                            const updated = { ...form, rupture: null };
                            setForm(updated); setApprenant(updated);
                          }}
                          style={{ backgroundColor: 'white', color: '#c00', border: '1px solid #c00', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* === Workflow DMF (visible si rupture déclarée avec maintien renseigné OUI ou NON) === */}
            {(form.maintienFormation === 'OUI' || form.maintienFormation === 'NON') && (() => {
              const d = form.dmf || {};
              const dStatut = d.statut || 'a_generer';
              const bg = dStatut === 'signee' ? '#f0f4ff' : dStatut === 'en_attente' ? '#fff8e1' : '#f9f5ff';
              const border = dStatut === 'signee' ? '#3a5bc7' : dStatut === 'en_attente' ? '#ffe082' : '#7c3aed';
              const icon = dStatut === 'signee' ? '✅' : dStatut === 'en_attente' ? '⏳' : '📜';
              const label = dStatut === 'signee' ? 'Signée' : dStatut === 'en_attente' ? 'En attente de signature' : 'À envoyer après génération';
              return (
                <div style={{ marginTop: 10, padding: 12, backgroundColor: bg, borderRadius: 8, border: `1.5px solid ${border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div style={{ fontSize: 22 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: dStatut === 'signee' ? '#3a5bc7' : '#5b21b6' }}>
                        Déclaration de Maintien en Formation (DMF) — {label}
                      </div>
                      {dStatut === 'en_attente' && d.dateEnvoiEmail && (
                        <div style={{ fontSize: 11, color: '#C8A23A', marginTop: 2 }}>📧 Envoyée le {new Date(d.dateEnvoiEmail).toLocaleDateString('fr-FR')}</div>
                      )}
                      {dStatut === 'signee' && d.dateSignature && (
                        <div style={{ fontSize: 11, color: '#3a5bc7', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span>📄 {d.fichierSigneNom}</span>
                          <a href={d.fichierSigneUrl} target="_blank" rel="noreferrer" style={{ color: '#3a5bc7', textDecoration: 'underline', fontSize: 11 }}>⬇ Télécharger</a>
                          <span style={{ color: '#888', fontStyle: 'italic' }}>— Importé le {new Date(d.dateSignature).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {peutModifier && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <BoutonGenerationDMF
                        donnees={assemblerDonneesDMF(form, entrepriseObj)}
                        nomFichier={`DMF_${form.nom}_${form.prenom}_${(form.dateRupture || '').replace(/\//g, '-')}.pdf`}
                      />
                      {dStatut === 'a_generer' && (
                        <button
                          onClick={async () => {
                            if (!confirm('Marquer le DMF comme envoyé pour signature ?\n\nAssurez-vous d\'avoir téléchargé le PDF avant.')) return;
                            const res = await marquerDocApprenantEnAttente(id, 'dmf', '', 'DMF_' + form.nom + '_' + form.prenom + '.pdf', '');
                            if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                            const updated = { ...form, dmf: { statut: 'en_attente', dateEnvoiEmail: new Date().toISOString(), fichierNonSigneNom: 'DMF_' + form.nom + '_' + form.prenom + '.pdf' } };
                            setForm(updated); setApprenant(updated);
                          }}
                          style={{ backgroundColor: '#C8A23A', color: 'white', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          ✉️ Marquer comme envoyée
                        </button>
                      )}
                      {dStatut === 'a_generer' || dStatut === 'en_attente' || dStatut === 'signee' ? (
                        <label style={{ backgroundColor: dStatut === 'signee' ? 'white' : '#3a5bc7', color: dStatut === 'signee' ? '#3a5bc7' : 'white', border: dStatut === 'signee' ? '1.5px solid #3a5bc7' : 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {dStatut === 'signee' ? '🔄 Remplacer le signé' : '📤 Importer DMF signé'}
                          <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={async (ev) => {
                            const f = ev.target.files?.[0];
                            if (!f) return;
                            const chemin = cheminStorage('apprenants', id, 'dmf_signe', f.name);
                            const resUp = await uploaderFichier(chemin, f);
                            if (!resUp.success || !resUp.fichier) { alert(`⚠️ Erreur upload : ${resUp.error}`); return; }
                            const res = await marquerDocApprenantSignee(id, 'dmf', resUp.fichier.url, f.name, chemin);
                            if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                            const apprenantMaj = await chargerApprenti(id);
                            if (apprenantMaj) { setForm(apprenantMaj); setApprenant(apprenantMaj); }
                          }} />
                        </label>
                      ) : null}
                      {dStatut !== 'a_generer' && (
                        <button
                          onClick={async () => {
                            if (!confirm('Annuler/supprimer le suivi du DMF signé ?')) return;
                            const res = await supprimerDocApprenant(id, 'dmf');
                            if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                            const updated = { ...form, dmf: null };
                            setForm(updated); setApprenant(updated);
                          }}
                          style={{ backgroundColor: 'white', color: '#c00', border: '1px solid #c00', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* === Workflow DFMF (Fin de maintien) — toujours visible === */}
            {(() => {
              const fd = form.dfmf || {};
              const fdStatut = fd.statut || 'a_generer';
              const bg = fdStatut === 'signee' ? '#e6f4f1' : fdStatut === 'en_attente' ? '#fff8e1' : '#fffbf0';
              const border = fdStatut === 'signee' ? '#006B68' : fdStatut === 'en_attente' ? '#ffe082' : '#C8A23A';
              const icon = fdStatut === 'signee' ? '✅' : fdStatut === 'en_attente' ? '⏳' : '📋';
              const label = fdStatut === 'signee' ? 'Signée' : fdStatut === 'en_attente' ? 'En attente de signature' : 'À importer une fois la fin de maintien complétée';
              return (
                <div style={{ marginTop: 10, padding: 12, backgroundColor: bg, borderRadius: 8, border: `1.5px solid ${border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div style={{ fontSize: 22 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: fdStatut === 'signee' ? '#006B68' : '#7a5c00' }}>
                        Fin de maintien en formation (DFMF) — {label}
                      </div>
                      {fdStatut === 'signee' && fd.dateSignature && (
                        <div style={{ fontSize: 11, color: '#006B68', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span>📄 {fd.fichierSigneNom}</span>
                          <a href={fd.fichierSigneUrl} target="_blank" rel="noreferrer" style={{ color: '#006B68', textDecoration: 'underline', fontSize: 11 }}>⬇ Télécharger</a>
                          <span style={{ color: '#888', fontStyle: 'italic' }}>— Importé le {new Date(fd.dateSignature).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {peutModifier && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <label style={{ backgroundColor: fdStatut === 'signee' ? 'white' : '#006B68', color: fdStatut === 'signee' ? '#006B68' : 'white', border: fdStatut === 'signee' ? '1.5px solid #006B68' : 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {fdStatut === 'signee' ? '🔄 Remplacer le signé' : '📤 Importer DFMF signé'}
                        <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={async (ev) => {
                          const f = ev.target.files?.[0];
                          if (!f) return;
                          const chemin = cheminStorage('apprenants', id, 'dfmf_signe', f.name);
                          const resUp = await uploaderFichier(chemin, f);
                          if (!resUp.success || !resUp.fichier) { alert(`⚠️ Erreur upload : ${resUp.error}`); return; }
                          const res = await marquerDocApprenantSignee(id, 'dfmf', resUp.fichier.url, f.name, chemin);
                          if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                          const apprenantMaj = await chargerApprenti(id);
                          if (apprenantMaj) { setForm(apprenantMaj); setApprenant(apprenantMaj); }
                        }} />
                      </label>
                      {fdStatut !== 'a_generer' && (
                        <button
                          onClick={async () => {
                            if (!confirm('Annuler/supprimer le suivi du DFMF signé ?')) return;
                            const res = await supprimerDocApprenant(id, 'dfmf');
                            if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
                            const updated = { ...form, dfmf: null };
                            setForm(updated); setApprenant(updated);
                          }}
                          style={{ backgroundColor: 'white', color: '#c00', border: '1px solid #c00', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* === Ancien bloc Rupture signée legacy (à conserver pour compatibilité) === */}
            <div style={{ display: 'none', marginTop: 14, padding: 12, backgroundColor: form.ruptureSignee?.url ? '#e6f4f1' : '#fffbf0', borderRadius: 8, border: `1.5px solid ${form.ruptureSignee?.url ? '#006B68' : '#C8A23A'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 22 }}>{form.ruptureSignee?.url ? '✅' : '📤'}</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: form.ruptureSignee?.url ? '#006B68' : '#7a5c00' }}>
                    Formulaire de rupture signé (entreprise + apprenti)
                  </div>
                  {form.ruptureSignee?.url ? (
                    <div style={{ fontSize: 12, color: '#006B68', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>📄 {form.ruptureSignee.nom}</span>
                      <a href={form.ruptureSignee.url} target="_blank" rel="noopener noreferrer" style={{ color: '#006B68', textDecoration: 'underline', fontSize: 11 }}>⬇ Télécharger</a>
                      <span style={{ fontWeight: 400, fontStyle: 'italic', color: '#888' }}>
                        — Importé le {new Date(form.ruptureSignee.dateImport).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                      Importe ici le PDF signé par les 2 parties (PDF — Max 5 Mo)
                    </div>
                  )}
                </div>
                {peutModifier && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <label style={{ backgroundColor: form.ruptureSignee?.url ? 'white' : '#006B68', color: form.ruptureSignee?.url ? '#006B68' : 'white', border: form.ruptureSignee?.url ? '1.5px solid #006B68' : 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {form.ruptureSignee?.url ? '🔄 Remplacer' : '⬆ Importer'}
                      <input
                        type="file"
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={async (ev) => {
                          const f = ev.target.files?.[0];
                          if (!f) return;
                          const chemin = cheminStorage('apprenants', id, 'rupture_signee', f.name);
                          const resUpload = await uploaderFichier(chemin, f);
                          if (!resUpload.success || !resUpload.fichier) {
                            alert(`⚠️ Erreur upload : ${resUpload.error}`);
                            return;
                          }
                          console.log(`[Apprenant ${id}] Rupture signée uploadée vers Storage ✅`);
                          const ruptureSignee = {
                            nom: resUpload.fichier.nom,
                            taille: resUpload.fichier.taille,
                            url: resUpload.fichier.url,
                            cheminStorage: resUpload.fichier.cheminStorage,
                            dateImport: new Date().toISOString(),
                          };
                          // Supabase
                          const res = await modifierApprenti(id, { ruptureSignee } as any);
                          if (!res.success) { alert(`⚠️ Erreur Supabase : ${res.error}`); return; }
                          // UI + localStorage
                          const updated = { ...form, ruptureSignee };
                          setForm(updated);
                          setApprenant(updated);
                          localStorage.setItem('apprenant_' + id, JSON.stringify(updated));
                          setSauvegarde(true);
                          setTimeout(() => setSauvegarde(false), 3000);
                        }}
                      />
                    </label>
                    {form.ruptureSignee?.url && (
                      <button
                        onClick={async () => {
                          if (!confirm('Supprimer le PDF de rupture signé importé ?')) return;
                          // Supabase : on retire le champ
                          const res = await modifierApprenti(id, { ruptureSignee: null } as any);
                          if (!res.success) { alert(`⚠️ Erreur Supabase : ${res.error}`); return; }
                          const updated = { ...form, ruptureSignee: null };
                          setForm(updated);
                          setApprenant(updated);
                          localStorage.setItem('apprenant_' + id, JSON.stringify(updated));
                        }}
                        style={{ backgroundColor: 'white', color: '#c53030', border: '1.5px solid #c53030', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
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
