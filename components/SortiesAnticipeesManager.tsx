'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import PdfSortieAnticipee from './PdfSortieAnticipee';
import { assemblerDonneesSortieAnticipee, MOTIFS_SORTIE_ANTICIPEE, type MotifSortie, type SortieAnticipee } from '../lib/donneesSortieAnticipee';
import { ajouterSortieAnticipee, modifierSortieAnticipee, supprimerSortieAnticipee } from '../data/apprentisSupabase';
import { uploaderFichier, cheminStorage } from '../lib/storage';

type Props = {
  apprenant: any;
  entreprise: any | null;
  onChange: (sorties: SortieAnticipee[]) => void;
};

export default function SortiesAnticipeesManager({ apprenant, entreprise, onChange }: Props) {
  const sorties: SortieAnticipee[] = (apprenant.sortiesAnticipees || []) as SortieAnticipee[];
  const [modaleOuverte, setModaleOuverte] = useState(false);

  // États du formulaire de la modale (pré-rempli avec date + heure du jour)
  const now = new Date();
  const dateDefaut = now.toLocaleDateString('fr-FR');
  const heureDefaut = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const [date, setDate] = useState(dateDefaut);
  const [heure, setHeure] = useState(heureDefaut);
  const [motifCle, setMotifCle] = useState<MotifSortie>('rdv_medical');
  const [commentaire, setCommentaire] = useState('');
  const [enCours, setEnCours] = useState(false);

  function reset() {
    const n = new Date();
    setDate(n.toLocaleDateString('fr-FR'));
    setHeure(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`);
    setMotifCle('rdv_medical');
    setCommentaire('');
  }

  async function creerEtTelecharger() {
    if (!date || !heure) { alert('Date et heure obligatoires'); return; }
    setEnCours(true);
    try {
      const motifLabel = MOTIFS_SORTIE_ANTICIPEE.find(m => m.cle === motifCle)?.label || '';
      const sortie: SortieAnticipee = {
        id: `sortie_${Date.now()}`,
        date,
        heure,
        motifCle,
        motifLabel,
        commentaire: commentaire.trim() || undefined,
        statut: 'a_generer',
        dateCreation: new Date().toISOString(),
      };

      // 1. Sauvegarde dans Supabase
      const resAjout = await ajouterSortieAnticipee(apprenant.id, sortie);
      if (!resAjout.success) {
        alert(`⚠️ Erreur Supabase : ${resAjout.error}`);
        return;
      }

      // 2. Génère le PDF et télécharge
      const donnees = assemblerDonneesSortieAnticipee(apprenant, entreprise, sortie);
      const blob = await pdf(<PdfSortieAnticipee donnees={donnees} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateFichier = date.replace(/\//g, '-');
      a.download = `SortieAnticipee_${apprenant.nom}_${apprenant.prenom}_${dateFichier}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      // 3. Met à jour la liste affichée et ferme la modale
      const nouvellesSorties = [...sorties, sortie];
      onChange(nouvellesSorties);
      setModaleOuverte(false);
      reset();
    } catch (e: any) {
      alert(`⚠️ Erreur : ${e.message}`);
    } finally {
      setEnCours(false);
    }
  }

  async function marquerEnvoyee(sortieId: string) {
    if (!confirm('Marquer cette sortie anticipée comme envoyée pour signature ?')) return;
    const res = await modifierSortieAnticipee(apprenant.id, sortieId, {
      statut: 'en_attente',
      dateEnvoiEmail: new Date().toISOString(),
    });
    if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
    onChange(sorties.map(s => s.id === sortieId ? { ...s, statut: 'en_attente', dateEnvoiEmail: new Date().toISOString() } : s));
  }

  async function importerSignee(sortieId: string, file: File) {
    const chemin = cheminStorage('apprenants', apprenant.id, `sortie_anticipee_${sortieId}`, file.name);
    const resUp = await uploaderFichier(chemin, file);
    if (!resUp.success || !resUp.fichier) { alert(`⚠️ Erreur upload : ${resUp.error}`); return; }
    const maj = {
      statut: 'signee' as const,
      fichierSigneNom: file.name,
      fichierSigneUrl: resUp.fichier.url,
      cheminStorageSigne: chemin,
      dateSignature: new Date().toISOString(),
    };
    const res = await modifierSortieAnticipee(apprenant.id, sortieId, maj);
    if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
    onChange(sorties.map(s => s.id === sortieId ? { ...s, ...maj } : s));
  }

  async function supprimer(sortieId: string) {
    if (!confirm('Supprimer cette sortie anticipée de l\'historique ?')) return;
    const res = await supprimerSortieAnticipee(apprenant.id, sortieId);
    if (!res.success) { alert(`⚠️ Erreur : ${res.error}`); return; }
    onChange(sorties.filter(s => s.id !== sortieId));
  }

  // Tri par date décroissante
  const sortiesTriees = [...sorties].sort((a, b) => (b.dateCreation || '').localeCompare(a.dateCreation || ''));

  return (
    <div>
      {/* Bouton créer */}
      <div style={{ marginBottom: 12, textAlign: 'right' }}>
        <button
          onClick={() => setModaleOuverte(true)}
          style={{ backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          ➕ Nouvelle sortie anticipée
        </button>
      </div>

      {/* Liste historique */}
      {sortiesTriees.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: 12, backgroundColor: '#fafafa', borderRadius: 8 }}>
          Aucune sortie anticipée enregistrée.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortiesTriees.map(s => {
            const bg = s.statut === 'signee' ? '#e6f4f1' : s.statut === 'en_attente' ? '#fff8e1' : '#fff7ed';
            const border = s.statut === 'signee' ? '#006B68' : s.statut === 'en_attente' ? '#ffe082' : '#ea580c';
            const icon = s.statut === 'signee' ? '✅' : s.statut === 'en_attente' ? '⏳' : '📄';
            return (
              <div key={s.id} style={{ padding: 12, backgroundColor: bg, borderRadius: 8, border: `1.5px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 20 }}>{icon}</div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
                      Sortie du <span style={{ color: '#ea580c' }}>{s.date}</span> à <span style={{ color: '#ea580c' }}>{s.heure}</span>
                      <span style={{ marginLeft: 10, fontSize: 11, color: '#666', fontWeight: 500 }}>— {s.motifLabel}</span>
                    </div>
                    {s.commentaire && (
                      <div style={{ fontSize: 11, color: '#666', marginTop: 3, fontStyle: 'italic' }}>"{s.commentaire}"</div>
                    )}
                    {s.statut === 'en_attente' && s.dateEnvoiEmail && (
                      <div style={{ fontSize: 11, color: '#C8A23A', marginTop: 4 }}>
                        📧 Marquée envoyée le {new Date(s.dateEnvoiEmail).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    {s.statut === 'signee' && s.dateSignature && (
                      <div style={{ fontSize: 11, color: '#006B68', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span>📄 {s.fichierSigneNom}</span>
                        <a href={s.fichierSigneUrl} target="_blank" rel="noreferrer" style={{ color: '#006B68', textDecoration: 'underline' }}>⬇ Télécharger</a>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {s.statut === 'a_generer' && (
                      <button
                        onClick={() => marquerEnvoyee(s.id)}
                        style={{ backgroundColor: '#C8A23A', color: 'white', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        ✉️ Marquer envoyée
                      </button>
                    )}
                    {(s.statut === 'en_attente' || s.statut === 'signee') && (
                      <label style={{ backgroundColor: s.statut === 'signee' ? 'white' : '#006B68', color: s.statut === 'signee' ? '#006B68' : 'white', border: s.statut === 'signee' ? '1.5px solid #006B68' : 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {s.statut === 'signee' ? '🔄 Remplacer' : '📤 Importer signé'}
                        <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(ev) => { const f = ev.target.files?.[0]; if (f) importerSignee(s.id, f); }} />
                      </label>
                    )}
                    <button
                      onClick={() => supprimer(s.id)}
                      title="Supprimer cette sortie"
                      style={{ backgroundColor: 'white', color: '#c00', border: '1px solid #c00', borderRadius: 6, padding: '6px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* === MODALE de création === */}
      {modaleOuverte && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, width: '90%', maxWidth: 500, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #ea580c' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ea580c', margin: 0 }}>➕ Nouvelle sortie anticipée</h3>
              <button onClick={() => { setModaleOuverte(false); reset(); }} style={{ backgroundColor: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Date + Heure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date de la sortie</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="dd/mm/yyyy"
                    style={{ border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Heure de sortie</label>
                  <input
                    type="text"
                    value={heure}
                    onChange={(e) => setHeure(e.target.value)}
                    placeholder="HH:MM"
                    style={{ border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Motif */}
              <div>
                <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Motif</label>
                <select
                  value={motifCle}
                  onChange={(e) => setMotifCle(e.target.value as MotifSortie)}
                  style={{ border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', backgroundColor: 'white' }}
                >
                  {MOTIFS_SORTIE_ANTICIPEE.map(m => (
                    <option key={m.cle} value={m.cle}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Commentaire */}
              <div>
                <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Précisions (optionnel)</label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ex : consultation chez le dentiste, RDV trimestriel..."
                  rows={3}
                  style={{ border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={() => { setModaleOuverte(false); reset(); }}
                  disabled={enCours}
                  style={{ backgroundColor: 'white', color: '#666', border: '1.5px solid #ccc', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  onClick={creerEtTelecharger}
                  disabled={enCours}
                  style={{ backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: enCours ? 'wait' : 'pointer', opacity: enCours ? 0.7 : 1 }}
                >
                  {enCours ? '⏳ Génération...' : '📥 Créer + télécharger PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}