// components/OngletFormationsContinues.tsx
// Onglet "📈 Formations continues" pour la fiche formateur
// Indicateur 22 Qualiopi - CFA PAM OI Formation

import React, { useState, useMemo } from 'react';
import {
  FormationContinue,
  TypeFormationContinue,
  LABELS_TYPE_FORMATION,
  COULEURS_TYPE,
  getStatutValidite,
  LABELS_STATUT,
  COULEURS_STATUT,
} from '../types/formationContinue';
import { useFormationsContinues } from '../hooks/useFormationsContinues';
import { exporterPdfFormateur } from '../lib/exportPdfFormateur';

interface Props {
  formateurId: string;
  formateurNom: string;
  formateurPrenom: string;
}

type FormDraft = {
  type: TypeFormationContinue;
  intitule: string;
  organisme: string;
  dateDebut: string;
  dateFin: string;
  dureeHeures: string; // en string dans le form, parsé à la sauvegarde
  dateExpiration: string;
  competencesVisees: string; // saisie séparée par virgules
  commentaire: string;
};

const FORM_VIDE: FormDraft = {
  type: 'pedagogique',
  intitule: '',
  organisme: '',
  dateDebut: '',
  dateFin: '',
  dureeHeures: '',
  dateExpiration: '',
  competencesVisees: '',
  commentaire: '',
};

export default function OngletFormationsContinues({
  formateurId,
  formateurNom,
  formateurPrenom,
}: Props) {
  const { formations, ajouter, modifier, supprimer, supprimerJustificatif } =
    useFormationsContinues(formateurId);

  const [modalOuverte, setModalOuverte] = useState(false);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FormDraft>(FORM_VIDE);
  const [filtreType, setFiltreType] = useState<TypeFormationContinue | 'tous'>('tous');
  const [justificatifDraft, setJustificatifDraft] =
    useState<FormationContinue['justificatif'] | null>(null);

  // Statistiques
  const stats = useMemo(() => {
    const totalHeures = formations.reduce((s, f) => s + f.dureeHeures, 0);
    const parType = formations.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {} as Record<TypeFormationContinue, number>);
    const annee = new Date().getFullYear();
    const heuresAnnee = formations
      .filter((f) => new Date(f.dateFin).getFullYear() === annee)
      .reduce((s, f) => s + f.dureeHeures, 0);
    return { totalHeures, parType, heuresAnnee, total: formations.length };
  }, [formations]);

  const formationsAffichees = useMemo(() => {
    const liste = filtreType === 'tous'
      ? formations
      : formations.filter((f) => f.type === filtreType);
    return [...liste].sort(
      (a, b) => new Date(b.dateFin).getTime() - new Date(a.dateFin).getTime()
    );
  }, [formations, filtreType]);

  function ouvrirAjout() {
    setEditionId(null);
    setDraft(FORM_VIDE);
    setJustificatifDraft(null);
    setModalOuverte(true);
  }

  function ouvrirEdition(f: FormationContinue) {
    setEditionId(f.id);
    setDraft({
      type: f.type,
      intitule: f.intitule,
      organisme: f.organisme,
      dateDebut: f.dateDebut,
      dateFin: f.dateFin,
      dureeHeures: String(f.dureeHeures),
      dateExpiration: f.dateExpiration || '',
      competencesVisees: f.competencesVisees.join(', '),
      commentaire: f.commentaire || '',
    });
    setJustificatifDraft(f.justificatif || null);
    setModalOuverte(true);
  }

  async function handleFichierJustificatif(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('⚠️ Seuls les fichiers PDF sont acceptés pour le justificatif.');
      e.target.value = '';
      return;
    }
    // Limite raisonnable pour localStorage (3 Mo)
    if (file.size > 3 * 1024 * 1024) {
      alert('⚠️ Fichier trop volumineux (max 3 Mo). Compressez le PDF avant de l\'uploader.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      setJustificatifDraft({
        nomFichier: file.name,
        typeMime: file.type,
        tailleKo: Math.round(file.size / 1024),
        dataBase64: base64,
        dateUpload: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(file);
  }

  function telechargerJustificatif(f: FormationContinue) {
    if (!f.justificatif) return;
    const byteString = atob(f.justificatif.dataBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: f.justificatif.typeMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.justificatif.nomFichier;
    a.click();
    URL.revokeObjectURL(url);
  }

  function enregistrer() {
    if (!draft.intitule.trim()) {
      alert('⚠️ L\'intitulé est obligatoire.');
      return;
    }
    if (!draft.organisme.trim()) {
      alert('⚠️ L\'organisme est obligatoire.');
      return;
    }
    if (!draft.dateDebut || !draft.dateFin) {
      alert('⚠️ Les dates de début et de fin sont obligatoires.');
      return;
    }
    if (new Date(draft.dateFin) < new Date(draft.dateDebut)) {
      alert('⚠️ La date de fin doit être postérieure à la date de début.');
      return;
    }
    const duree = parseFloat(draft.dureeHeures);
    if (isNaN(duree) || duree <= 0) {
      alert('⚠️ La durée doit être un nombre positif (en heures).');
      return;
    }

    const competences = draft.competencesVisees
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const payload = {
      formateurId,
      type: draft.type,
      intitule: draft.intitule.trim(),
      organisme: draft.organisme.trim(),
      dateDebut: draft.dateDebut,
      dateFin: draft.dateFin,
      dureeHeures: duree,
      dateExpiration: draft.dateExpiration || undefined,
      competencesVisees: competences,
      justificatif: justificatifDraft || undefined,
      commentaire: draft.commentaire.trim() || undefined,
    };

    try {
      if (editionId) {
        modifier(editionId, payload);
      } else {
        ajouter(payload);
      }
      setModalOuverte(false);
    } catch (e) {
      // erreur quota déjà signalée
    }
  }

  function handleSupprimer(f: FormationContinue) {
    if (confirm(`Supprimer la formation "${f.intitule}" ?`)) {
      supprimer(f.id);
    }
  }

  function handleExportPdf() {
    exporterPdfFormateur({
      formateurNom,
      formateurPrenom,
      formations,
    });
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            📈 Formations continues
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Indicateur 22 Qualiopi — Maintien et développement des compétences
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPdf}
            disabled={formations.length === 0}
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50
                       disabled:opacity-40 disabled:cursor-not-allowed rounded-lg
                       text-sm font-medium text-gray-700 transition-colors"
          >
            📄 Exporter PDF
          </button>
          <button
            onClick={ouvrirAjout}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       text-sm font-medium transition-colors shadow-sm"
          >
            ➕ Ajouter une formation
          </button>
        </div>
      </div>

      {/* Cartes de stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total formations" value={String(stats.total)} />
        <StatCard label="Heures cumulées" value={`${stats.totalHeures} h`} />
        <StatCard label={`Heures ${new Date().getFullYear()}`} value={`${stats.heuresAnnee} h`} />
        <StatCard
          label="Certifications"
          value={String(stats.parType.certification || 0)}
        />
      </div>

      {/* Filtre par type */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltreType('tous')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
            ${filtreType === 'tous'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        >
          Tous ({formations.length})
        </button>
        {(Object.keys(LABELS_TYPE_FORMATION) as TypeFormationContinue[]).map((t) => {
          const count = formations.filter((f) => f.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setFiltreType(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                ${filtreType === t
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {LABELS_TYPE_FORMATION[t]} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste / tableau */}
      {formationsAffichees.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-3">Aucune formation enregistrée.</p>
          <button
            onClick={ouvrirAjout}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Ajouter la première formation →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Intitulé</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Organisme</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Période</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Durée</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Validité</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Justif.</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {formationsAffichees.map((f) => {
                  const statut = getStatutValidite(f);
                  return (
                    <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${COULEURS_TYPE[f.type]}`}>
                          {LABELS_TYPE_FORMATION[f.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {f.intitule}
                        {f.competencesVisees.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            🎯 {f.competencesVisees.join(' · ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{f.organisme}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formaterDate(f.dateDebut)}<br />
                        <span className="text-gray-500">au {formaterDate(f.dateFin)}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {f.dureeHeures} h
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${COULEURS_STATUT[statut]}`}>
                          {LABELS_STATUT[statut]}
                        </span>
                        {f.dateExpiration && (
                          <div className="text-xs text-gray-500 mt-1">
                            jusqu'au {formaterDate(f.dateExpiration)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {f.justificatif ? (
                          <button
                            onClick={() => telechargerJustificatif(f)}
                            title={f.justificatif.nomFichier}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            📎
                          </button>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => ouvrirEdition(f)}
                          className="text-gray-600 hover:text-blue-600 mr-3"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleSupprimer(f)}
                          className="text-gray-600 hover:text-red-600"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal d'ajout / édition */}
      {modalOuverte && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setModalOuverte(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">
                {editionId ? 'Modifier la formation' : 'Nouvelle formation continue'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {formateurPrenom} {formateurNom}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <Champ label="Type de formation *">
                <select
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value as TypeFormationContinue })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {(Object.keys(LABELS_TYPE_FORMATION) as TypeFormationContinue[]).map((t) => (
                    <option key={t} value={t}>{LABELS_TYPE_FORMATION[t]}</option>
                  ))}
                </select>
              </Champ>

              <Champ label="Intitulé *">
                <input
                  type="text"
                  value={draft.intitule}
                  onChange={(e) => setDraft({ ...draft, intitule: e.target.value })}
                  placeholder="Ex : Animer une formation à distance"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </Champ>

              <Champ label="Organisme *">
                <input
                  type="text"
                  value={draft.organisme}
                  onChange={(e) => setDraft({ ...draft, organisme: e.target.value })}
                  placeholder="Ex : AFPA, CNFPT, Université de La Réunion..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </Champ>

              <div className="grid grid-cols-2 gap-4">
                <Champ label="Date de début *">
                  <input
                    type="date"
                    value={draft.dateDebut}
                    onChange={(e) => setDraft({ ...draft, dateDebut: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </Champ>
                <Champ label="Date de fin *">
                  <input
                    type="date"
                    value={draft.dateFin}
                    onChange={(e) => setDraft({ ...draft, dateFin: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </Champ>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Champ label="Durée (heures) *">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={draft.dureeHeures}
                    onChange={(e) => setDraft({ ...draft, dureeHeures: e.target.value })}
                    placeholder="Ex : 14"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </Champ>
                <Champ label="Date d'expiration (si certification)">
                  <input
                    type="date"
                    value={draft.dateExpiration}
                    onChange={(e) => setDraft({ ...draft, dateExpiration: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </Champ>
              </div>

              <Champ label="Compétences visées (référentiel formateur)">
                <input
                  type="text"
                  value={draft.competencesVisees}
                  onChange={(e) => setDraft({ ...draft, competencesVisees: e.target.value })}
                  placeholder="Séparez par des virgules — ex : Animation, Distanciel, Évaluation"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Indiquez les compétences du référentiel formateur travaillées (utile pour l'audit).
                </p>
              </Champ>

              <Champ label="Justificatif (PDF, max 3 Mo)">
                {justificatifDraft ? (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <div className="text-sm">
                      <div className="font-medium text-blue-900">📎 {justificatifDraft.nomFichier}</div>
                      <div className="text-xs text-blue-700">{justificatifDraft.tailleKo} Ko</div>
                    </div>
                    <button
                      onClick={() => setJustificatifDraft(null)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Retirer
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFichierJustificatif}
                    className="w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg
                               file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700
                               hover:file:bg-blue-100"
                  />
                )}
              </Champ>

              <Champ label="Commentaire">
                <textarea
                  value={draft.commentaire}
                  onChange={(e) => setDraft({ ...draft, commentaire: e.target.value })}
                  rows={3}
                  placeholder="Notes complémentaires..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </Champ>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setModalOuverte(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={enregistrer}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm"
              >
                {editionId ? 'Enregistrer les modifications' : 'Ajouter la formation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === Sous-composants ===

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function formaterDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
