'use client';

import React, { useState, useEffect } from 'react';
import { COLORS } from '../lib/constants';
import {
  FormationContinue,
  TypeFormationContinue,
  LABELS_TYPE_FORMATION,
  COULEURS_TYPE,
  LABELS_STATUT,
  COULEURS_STATUT,
  getStatutValidite,
  dateIsoToFr,
  dateFrToIso,
  formaterTailleFichier,
  chargerFormationsFormateur,
  sauvegarderFormation,
  supprimerFormation,
  creerFormationVide,
  calculerStatsFormateur,
} from '../data/mockFormationsContinues';

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };

// ============================================================================
// SOUS-COMPOSANT : Formulaire d'ajout / édition d'une formation continue
// ============================================================================

function FormulaireFormationContinue({
  formation,
  onSave,
  onCancel,
  utilisateur,
}: {
  formation: FormationContinue;
  onSave: (f: FormationContinue) => void;
  onCancel: () => void;
  utilisateur: any;
}) {
  const [form, setForm] = useState<FormationContinue>(formation);
  const [dureeStr, setDureeStr] = useState<string>(formation.dureeHeures > 0 ? String(formation.dureeHeures) : '');

  function handleFichierJustificatif(file: File | null) {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('⚠️ Fichier trop volumineux (max 3 Mo).');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      alert('⚠️ Formats acceptés : PDF, JPG, PNG.');
      return;
    }
    setForm(p => ({
      ...p,
      justificatif: {
        nom: file.name,
        taille: formaterTailleFichier(file.size),
        dateImport: new Date().toISOString(),
      },
    }));
  }

  function handleSave() {
    if (!form.intitule.trim()) {
      alert('⚠️ L\'intitulé est obligatoire.');
      return;
    }
    if (!form.organisme.trim()) {
      alert('⚠️ L\'organisme est obligatoire.');
      return;
    }
    if (!form.dateDebut || !form.dateFin) {
      alert('⚠️ Les dates de début et de fin sont obligatoires.');
      return;
    }
    if (new Date(form.dateFin) < new Date(form.dateDebut)) {
      alert('⚠️ La date de fin doit être après la date de début.');
      return;
    }
    const duree = parseFloat(dureeStr);
    if (isNaN(duree) || duree <= 0) {
      alert('⚠️ La durée doit être un nombre positif (en heures).');
      return;
    }
    onSave({ ...form, dureeHeures: duree });
  }

  return (
    <div style={{ backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
        ✏️ {form.id.startsWith('fc_') && !chargerFormationsFormateur(form.formateurId).find(f => f.id === form.id)
          ? 'Nouvelle formation continue'
          : 'Modifier la formation'}
        — {form.formateurNom}
      </h3>

      {/* Type + Intitulé */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
              Type *
            </label>
            <select
              style={inputStyle}
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as TypeFormationContinue }))}
            >
              {(Object.keys(LABELS_TYPE_FORMATION) as TypeFormationContinue[]).map(t => (
                <option key={t} value={t}>{LABELS_TYPE_FORMATION[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
              Intitulé *
            </label>
            <input
              style={inputStyle}
              value={form.intitule}
              onChange={e => setForm(p => ({ ...p, intitule: e.target.value }))}
              placeholder="Ex : Animer une formation à distance"
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
            Organisme *
          </label>
          <input
            style={inputStyle}
            value={form.organisme}
            onChange={e => setForm(p => ({ ...p, organisme: e.target.value }))}
            placeholder="Ex : AFPA, CNFPT, Université de La Réunion..."
          />
        </div>
      </div>

      {/* Dates + Durée */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
              📅 Date début *
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                style={{ ...inputStyle, flex: 1 }}
                value={form.dateDebut ? dateIsoToFr(form.dateDebut) : ''}
                placeholder="JJ/MM/AAAA"
                onChange={e => {
                  const v = e.target.value;
                  if (v.match(/^\d{2}\/\d{2}\/\d{4}$/)) setForm(p => ({ ...p, dateDebut: dateFrToIso(v) }));
                  else if (v === '') setForm(p => ({ ...p, dateDebut: '' }));
                  else setForm(p => ({ ...p, dateDebut: v }));
                }}
              />
              <input
                type="date"
                style={{ width: '40px', border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '4px', cursor: 'pointer', backgroundColor: 'white' }}
                value={form.dateDebut && form.dateDebut.match(/^\d{4}-\d{2}-\d{2}$/) ? form.dateDebut : ''}
                onChange={e => setForm(p => ({ ...p, dateDebut: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
              📅 Date fin *
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                style={{ ...inputStyle, flex: 1 }}
                value={form.dateFin ? dateIsoToFr(form.dateFin) : ''}
                placeholder="JJ/MM/AAAA"
                onChange={e => {
                  const v = e.target.value;
                  if (v.match(/^\d{2}\/\d{2}\/\d{4}$/)) setForm(p => ({ ...p, dateFin: dateFrToIso(v) }));
                  else if (v === '') setForm(p => ({ ...p, dateFin: '' }));
                  else setForm(p => ({ ...p, dateFin: v }));
                }}
              />
              <input
                type="date"
                style={{ width: '40px', border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '4px', cursor: 'pointer', backgroundColor: 'white' }}
                value={form.dateFin && form.dateFin.match(/^\d{4}-\d{2}-\d{2}$/) ? form.dateFin : ''}
                onChange={e => setForm(p => ({ ...p, dateFin: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
              ⏱ Durée (heures) *
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              style={inputStyle}
              value={dureeStr}
              onChange={e => setDureeStr(e.target.value)}
              placeholder="Ex : 14"
            />
          </div>
        </div>

        {/* Date expiration - visible surtout pour certif */}
        {(form.type === 'certification' || form.dateExpiration) && (
          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#ede9fe', borderRadius: '6px' }}>
            <label style={{ fontSize: '11px', color: '#6b21a8', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
              📜 Date d'expiration (si certification / habilitation)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                style={{ ...inputStyle, flex: 1 }}
                value={form.dateExpiration ? dateIsoToFr(form.dateExpiration) : ''}
                placeholder="JJ/MM/AAAA (optionnel)"
                onChange={e => {
                  const v = e.target.value;
                  if (v.match(/^\d{2}\/\d{2}\/\d{4}$/)) setForm(p => ({ ...p, dateExpiration: dateFrToIso(v) }));
                  else if (v === '') setForm(p => ({ ...p, dateExpiration: '' }));
                  else setForm(p => ({ ...p, dateExpiration: v }));
                }}
              />
              <input
                type="date"
                style={{ width: '40px', border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '4px', cursor: 'pointer', backgroundColor: 'white' }}
                value={form.dateExpiration && form.dateExpiration.match(/^\d{4}-\d{2}-\d{2}$/) ? form.dateExpiration : ''}
                onChange={e => setForm(p => ({ ...p, dateExpiration: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Compétences visées */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
          🎯 Compétences visées (référentiel formateur)
        </label>
        <input
          style={inputStyle}
          value={form.competencesVisees}
          onChange={e => setForm(p => ({ ...p, competencesVisees: e.target.value }))}
          placeholder="Ex : Animation distanciel, Évaluation par compétences..."
        />
        <p style={{ fontSize: '11px', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>
          Compétences travaillées dans le cadre du référentiel formateur (utile pour l'audit).
        </p>
      </div>

      {/* Justificatif */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
          📎 Justificatif (PDF, JPG, PNG — max 3 Mo)
        </label>
        {form.justificatif ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#dbeafe', borderRadius: '6px', border: '1.5px solid #1e40af' }}>
            <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>
              📄 {form.justificatif.nom} <span style={{ fontWeight: '400', fontStyle: 'italic' }}>({form.justificatif.taille})</span>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, justificatif: undefined }))}
              style={{ backgroundColor: 'white', color: '#c53030', border: '1.5px solid #c53030', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              🗑️ Retirer
            </button>
          </div>
        ) : (
          <label style={{ display: 'inline-block', backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            ⬆ Importer le justificatif
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={e => handleFichierJustificatif(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      {/* Commentaire */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
          💬 Commentaire (optionnel)
        </label>
        <textarea
          style={{ ...inputStyle, minHeight: '50px', resize: 'vertical' }}
          value={form.commentaire ?? ''}
          onChange={e => setForm(p => ({ ...p, commentaire: e.target.value }))}
          placeholder="Notes complémentaires..."
        />
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnSecondary}>Annuler</button>
        <button onClick={handleSave} style={{ ...btnPrimary, backgroundColor: '#15803d' }}>
          💾 Enregistrer
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SOUS-COMPOSANT : Affichage d'une formation (lecture)
// ============================================================================

function AffichageFormation({
  formation,
  onEdit,
  onDelete,
  peutEditer,
}: {
  formation: FormationContinue;
  onEdit: () => void;
  onDelete: () => void;
  peutEditer: boolean;
}) {
  const couleursType = COULEURS_TYPE[formation.type];
  const statut = getStatutValidite(formation);
  const couleursStatut = COULEURS_STATUT[statut];

  return (
    <div style={{
      backgroundColor: 'white',
      border: `2px solid ${couleursType.color}`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '10px',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{ backgroundColor: couleursType.bg, color: couleursType.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
              {LABELS_TYPE_FORMATION[formation.type]}
            </span>
            {formation.dateExpiration && (
              <span style={{ backgroundColor: couleursStatut.bg, color: couleursStatut.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                {LABELS_STATUT[statut]}
              </span>
            )}
          </div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.text, marginBottom: '2px' }}>
            {formation.intitule}
          </h4>
          <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
            🏢 {formation.organisme}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>Durée</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: couleursType.color }}>
            {formation.dureeHeures} h
          </div>
        </div>
      </div>

      {/* Dates */}
      <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px', padding: '8px 12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
        📅 Du <strong>{dateIsoToFr(formation.dateDebut)}</strong> au <strong>{dateIsoToFr(formation.dateFin)}</strong>
        {formation.dateExpiration && (
          <span style={{ marginLeft: '12px', color: couleursStatut.color, fontWeight: '600' }}>
            · Expire le {dateIsoToFr(formation.dateExpiration)}
          </span>
        )}
      </div>

      {/* Compétences */}
      {formation.competencesVisees && (
        <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px' }}>
          <strong style={{ color: '#666' }}>🎯 Compétences :</strong> {formation.competencesVisees}
        </div>
      )}

      {/* Commentaire */}
      {formation.commentaire && (
        <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px', padding: '8px 12px', backgroundColor: '#fef6e4', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
          💬 {formation.commentaire}
        </div>
      )}

      {/* Justificatif */}
      {formation.justificatif ? (
        <div style={{ padding: '10px 12px', backgroundColor: '#dbeafe', borderRadius: '6px', border: '1.5px solid #1e40af', marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
            📎 Justificatif : {formation.justificatif.nom}
            <span style={{ fontWeight: '400', fontStyle: 'italic', marginLeft: '6px' }}>
              ({formation.justificatif.taille}) — Importé le {new Date(formation.justificatif.dateImport).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ padding: '8px 12px', backgroundColor: '#fffbf0', borderRadius: '6px', border: '1.5px solid #C8A23A', marginBottom: '10px', fontSize: '12px', color: '#7a5c00' }}>
          ⚠️ Aucun justificatif importé — Demande-le au formateur pour l'audit Qualiopi.
        </div>
      )}

      {/* Métadonnées */}
      <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic', marginBottom: peutEditer ? '10px' : '0' }}>
        Ajouté {formation.ajoutePar ? `par ${formation.ajoutePar}` : ''} le {new Date(formation.dateCreation).toLocaleDateString('fr-FR')}
      </div>

      {/* Actions */}
      {peutEditer && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
// COMPOSANT PRINCIPAL EXPORTÉ
// ============================================================================

interface Props {
  formateurId: string;
  formateurNom: string;
  peutEditer: boolean;
  utilisateur: any;
}

export default function CardFormationsContinues({
  formateurId,
  formateurNom,
  peutEditer,
  utilisateur,
}: Props) {
  const [formations, setFormations] = useState<FormationContinue[]>([]);
  const [formationEnEdition, setFormationEnEdition] = useState<FormationContinue | null>(null);
  const [filtreType, setFiltreType] = useState<TypeFormationContinue | 'tous'>('tous');

  useEffect(() => {
    if (formateurId) {
      setFormations(chargerFormationsFormateur(formateurId));
    }
  }, [formateurId]);

  function recharger() {
    setFormations(chargerFormationsFormateur(formateurId));
  }

  function nouvelleFormation() {
    setFormationEnEdition(creerFormationVide(formateurId, formateurNom));
  }

  function modifier(f: FormationContinue) {
    setFormationEnEdition(f);
  }

  function annuler() {
    setFormationEnEdition(null);
  }

  function sauvegarder(f: FormationContinue) {
    sauvegarderFormation(f, utilisateur);
    recharger();
    setFormationEnEdition(null);
  }

  function supprimer(f: FormationContinue) {
    if (!confirm(`Supprimer la formation "${f.intitule}" ? Cette action est irréversible.`)) return;
    supprimerFormation(f.id);
    recharger();
  }

  // Stats
  const stats = calculerStatsFormateur(formateurId);
  const annee = new Date().getFullYear();

  // Filtrage
  const formationsAffichees = filtreType === 'tous'
    ? formations
    : formations.filter(f => f.type === filtreType);

  return (
    <div>
      {/* Bandeau stats */}
      {formations.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
          <StatBox label="Total" value={String(stats.total)} color={COLORS.primary} />
          <StatBox label="Heures cumulées" value={`${stats.heuresTotal} h`} color="#15803d" />
          <StatBox label={`Heures ${annee}`} value={`${stats.heuresAnnee} h`} color="#1e40af" />
          <StatBox
            label="Alertes validité"
            value={String(stats.certifsExpirees + stats.certifsBientotExpirees)}
            color={(stats.certifsExpirees + stats.certifsBientotExpirees) > 0 ? '#c53030' : '#888'}
          />
        </div>
      )}

      {/* Alertes certifications */}
      {(stats.certifsExpirees > 0 || stats.certifsBientotExpirees > 0) && (
        <div style={{ padding: '12px 14px', backgroundColor: '#fffbf0', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#7a5c00', borderLeft: '4px solid #C8A23A' }}>
          ⚠️ <strong>Attention :</strong>
          {stats.certifsExpirees > 0 && ` ${stats.certifsExpirees} certification(s) expirée(s).`}
          {stats.certifsBientotExpirees > 0 && ` ${stats.certifsBientotExpirees} certification(s) expire(nt) dans les 3 mois.`}
        </div>
      )}

      {/* Bouton ajout */}
      {peutEditer && !formationEnEdition && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={nouvelleFormation} style={btnPrimary}>
            + Ajouter une formation continue
          </button>

          {/* Filtre */}
          {formations.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <FiltreBouton
                actif={filtreType === 'tous'}
                onClick={() => setFiltreType('tous')}
                label={`Tous (${formations.length})`}
              />
              {(Object.keys(LABELS_TYPE_FORMATION) as TypeFormationContinue[]).map(t => {
                const count = formations.filter(f => f.type === t).length;
                if (count === 0) return null;
                return (
                  <FiltreBouton
                    key={t}
                    actif={filtreType === t}
                    onClick={() => setFiltreType(t)}
                    label={`${LABELS_TYPE_FORMATION[t]} (${count})`}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Formulaire */}
      {peutEditer && formationEnEdition && (
        <FormulaireFormationContinue
          formation={formationEnEdition}
          onSave={sauvegarder}
          onCancel={annuler}
          utilisateur={utilisateur}
        />
      )}

      {/* Liste */}
      {!formationEnEdition && formations.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px', fontStyle: 'italic', backgroundColor: COLORS.background, borderRadius: '8px' }}>
          Aucune formation continue enregistrée pour ce formateur.
          {peutEditer && (
            <>
              <br />
              Clique sur <strong>"+ Ajouter une formation continue"</strong> pour démarrer.
            </>
          )}
        </div>
      )}

      {!formationEnEdition && formationsAffichees.length > 0 && (
        <div>
          {formationsAffichees.map(f => (
            <AffichageFormation
              key={f.id}
              formation={f}
              onEdit={() => modifier(f)}
              onDelete={() => supprimer(f)}
              peutEditer={peutEditer}
            />
          ))}
        </div>
      )}

      {!formationEnEdition && formations.length > 0 && formationsAffichees.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted, fontSize: '13px', fontStyle: 'italic' }}>
          Aucune formation de ce type pour ce formateur.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PETITS SOUS-COMPOSANTS
// ============================================================================

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ backgroundColor: 'white', border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '10px 12px' }}>
      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '800', color, marginTop: '2px' }}>{value}</div>
    </div>
  );
}

function FiltreBouton({ actif, onClick, label }: { actif: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: actif ? COLORS.primary : 'white',
        color: actif ? 'white' : COLORS.text,
        border: `1.5px solid ${actif ? COLORS.primary : '#e0e0e0'}`,
        borderRadius: '20px',
        padding: '4px 12px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
