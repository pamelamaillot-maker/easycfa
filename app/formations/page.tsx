'use client';

import { useState, useEffect } from 'react';
import { REFERENTIEL_FORMATIONS } from '../../data/mockData';
import { COLORS } from '../../lib/constants';
import { useUser } from '../../lib/UserContext';
import Card from '../../components/Card';

const btnPrimary: React.CSSProperties = { backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };

const TAILLE_MAX_FICHIER = 4 * 1024 * 1024;

function diffMois(dateFin: string): number | null {
  if (!dateFin) return null;
  const p = dateFin.split('/');
  if (p.length !== 3) return null;
  const fin = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  const now = new Date();
  return (fin.getFullYear() - now.getFullYear()) * 12 + fin.getMonth() - now.getMonth();
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const p = dateStr.split('/');
  if (p.length !== 3) return null;
  return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
}

function ajouterUnAn(dateStr: string): string | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString('fr-FR');
}

function diffJours(dateStr: string): number | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  const now = new Date();
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function statutValidite(dateFin: string): 'ok' | 'warning' | 'ceres' | 'expired' {
  const mois = diffMois(dateFin);
  if (mois === null) return 'ok';
  if (mois >= 0) {
    if (mois <= 6) return 'warning';
    return 'ok';
  }
  const dateLimiteCeres = ajouterUnAn(dateFin);
  if (dateLimiteCeres) {
    const jours = diffJours(dateLimiteCeres);
    if (jours !== null && jours >= 0) return 'ceres';
  }
  return 'expired';
}

function formaterTaille(octets: number): string {
  if (octets < 1024) return octets + ' o';
  if (octets < 1024 * 1024) return (octets / 1024).toFixed(1) + ' Ko';
  return (octets / (1024 * 1024)).toFixed(2) + ' Mo';
}

function lireFichierEnBase64(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      resolve(r.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(new Error('Erreur lecture fichier'));
    reader.readAsDataURL(fichier);
  });
}

function telechargerFichier(doc: any) {
  if (!doc?.dataBase64) {
    alert('Ce document a été référencé avant la mise à jour. Réimporte-le pour pouvoir le consulter et le télécharger.');
    return;
  }
  const lien = document.createElement('a');
  lien.href = `data:${doc.mimeType ?? 'application/pdf'};base64,${doc.dataBase64}`;
  lien.download = doc.nom;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
}

const STATUT_COLORS = {
  ok: { bg: '#dcfce7', color: '#16a34a', label: 'Valide' },
  warning: { bg: '#fef6e4', color: '#C8A23A', label: 'Expire bientôt' },
  ceres: { bg: '#fff0d6', color: '#d97706', label: 'Période CERES' },
  expired: { bg: '#fde8e8', color: '#e53e3e', label: 'Expiré' },
};

const NIVEAU_COLORS: Record<string, string> = {
  'Niveau 3': '#64748b',
  'Niveau 4': '#0891b2',
  'Niveau 5': '#7c3aed',
  'Niveau 6': '#006B68',
};

export default function Formations() {
  const { utilisateur } = useUser();
  const estAdmin = utilisateur?.role === 'admin';
  const nomUtilisateur = utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Inconnu';

  const [formations, setFormations] = useState<any[]>([]);
  const [selectionne, setSelectionne] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<'infos' | 'ccps' | 'stats'>('infos');
  const [modaleNouvelle, setModaleNouvelle] = useState(false);
  const [filtreNiveau, setFiltreNiveau] = useState('');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [importEnCours, setImportEnCours] = useState<string | null>(null);
  const [modaleDesarchive, setModaleDesarchive] = useState(false);
  const [motifDesarchive, setMotifDesarchive] = useState('');
  const [modaleHistorique, setModaleHistorique] = useState(false);
  const [nouvelleForm, setNouvelleForm] = useState({
    intitule: '', rncp: '', codeDiplome: '', niveau: 'Niveau 4',
    certificateur: "Ministère du Travail du Plein Emploi et de l'Insertion",
    joursFormation: '', dureeContrat: '', volumeHoraireCFA: '',
    dateValiditeDebut: '', dateValiditeFin: '',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('easycfa_formations_v2');
      if (saved) {
        setFormations(JSON.parse(saved));
      } else {
        const init = REFERENTIEL_FORMATIONS.map(f => ({ ...f, agrement: (f as any).agrement ?? null }));
        setFormations(init);
        localStorage.setItem('easycfa_formations_v2', JSON.stringify(init));
      }
    } catch {
      setFormations(REFERENTIEL_FORMATIONS.map(f => ({ ...f, agrement: (f as any).agrement ?? null })));
    }
  }, []);

  function sauvegarder(liste: any[]) {
    try {
      localStorage.setItem('easycfa_formations_v2', JSON.stringify(liste));
      setFormations(liste);
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || /quota/i.test(err?.message ?? '')) {
        alert("⚠️ Stockage local saturé (limite ~5 Mo de localStorage).\n\nLes fichiers PDF prennent de la place. Solutions :\n• Supprimer un document existant avant d'en importer un nouveau\n• Attendre la migration Supabase prévue lundi (stockage cloud illimité)");
      } else {
        alert("Erreur de sauvegarde : " + (err?.message ?? 'inconnue'));
      }
      throw err;
    }
  }

  function majFormation(id: string, champ: string, valeur: any) {
    const updated = formations.map(f => f.id === id ? { ...f, [champ]: valeur } : f);
    sauvegarder(updated);
  }

  function majFormationMulti(id: string, modifs: Record<string, any>) {
    const updated = formations.map(f => f.id === id ? { ...f, ...modifs } : f);
    sauvegarder(updated);
  }

  async function importerDocument(id: string, champ: string, fichier: File) {
    if (fichier.size > TAILLE_MAX_FICHIER) {
      alert(`⚠️ Fichier trop volumineux : ${formaterTaille(fichier.size)}\n\nTaille maximale autorisée : ${formaterTaille(TAILLE_MAX_FICHIER)}\n\nCompresse le PDF (ex: ilovepdf.com) ou attends la migration Supabase de lundi.`);
      return;
    }
    try {
      setImportEnCours(champ);
      const dataBase64 = await lireFichierEnBase64(fichier);
      const doc = {
        nom: fichier.name,
        mimeType: fichier.type || 'application/pdf',
        taille: fichier.size,
        dataBase64,
        date: new Date().toLocaleDateString('fr-FR'),
        dateImport: new Date().toISOString(),
        importePar: utilisateur?.id ?? null,
      };
      majFormation(id, champ, doc);
    } catch (err) {
      console.error(err);
    } finally {
      setImportEnCours(null);
    }
  }

  function supprimerDocument(id: string, champ: string, libelle: string) {
    if (!confirm(`Supprimer le document "${libelle}" ?`)) return;
    majFormation(id, champ, null);
  }

  function archiver(formation: any) {
    if (!confirm(`Archiver "${formation.intitule}" ?\n\nLa formation restera consultable dans la section Archives et pourra être désarchivée par l'administrateur si nécessaire (sessions CERES, apprenants en cours...).`)) return;
    const aujourdhui = new Date().toLocaleDateString('fr-FR');
    const historiquePrecedent = formation.archive?.historique ?? formation.historiqueArchivage ?? [];
    const nouvelleEntree = {
      action: 'archive' as const,
      date: aujourdhui,
      dateISO: new Date().toISOString(),
      par: utilisateur?.id ?? 'INCONNU',
      parNom: nomUtilisateur,
      motif: 'Archivage manuel',
    };
    const archive = {
      date: aujourdhui,
      motif: 'Archivage manuel',
      parUtilisateur: utilisateur?.id ?? 'INCONNU',
      parNom: nomUtilisateur,
      historique: [...historiquePrecedent, nouvelleEntree],
    };
    majFormationMulti(formation.id, { archive, historiqueArchivage: null });
    setSelectionne(null);
  }

  function ouvrirModaleDesarchive() {
    if (!estAdmin) {
      alert("⛔ Action réservée à l'administrateur.\n\nSeule Paméla MAILLOT (Directrice) peut désarchiver une formation.");
      return;
    }
    setMotifDesarchive('');
    setModaleDesarchive(true);
  }

  function confirmerDesarchive() {
    if (!formationSelectionnee || !estAdmin) return;
    const motif = motifDesarchive.trim();
    if (!motif) {
      alert('Le motif de désarchivage est obligatoire.');
      return;
    }
    const aujourdhui = new Date().toLocaleDateString('fr-FR');
    const historiquePrecedent = formationSelectionnee.archive?.historique ?? [];
    const nouvelleEntree = {
      action: 'desarchive' as const,
      date: aujourdhui,
      dateISO: new Date().toISOString(),
      par: utilisateur?.id ?? 'INCONNU',
      parNom: nomUtilisateur,
      motif,
    };
    majFormationMulti(formationSelectionnee.id, {
      archive: null,
      historiqueArchivage: [...historiquePrecedent, nouvelleEntree],
    });
    setModaleDesarchive(false);
    setMotifDesarchive('');
  }

  function creerFormation() {
    if (!nouvelleForm.intitule || !nouvelleForm.rncp) return;
    const nouvelle = {
      id: 'form_' + Date.now(),
      intitule: nouvelleForm.intitule,
      rncp: nouvelleForm.rncp,
      codeDiplome: nouvelleForm.codeDiplome,
      niveau: nouvelleForm.niveau,
      niveauEuropeen: '',
      certificateur: nouvelleForm.certificateur,
      joursFormation: nouvelleForm.joursFormation,
      dureeContrat: nouvelleForm.dureeContrat,
      volumeHoraireCFA: parseInt(nouvelleForm.volumeHoraireCFA) || 0,
      volumeHoraireEntreprise: 0,
      dateValiditeDebut: nouvelleForm.dateValiditeDebut,
      dateValiditeFin: nouvelleForm.dateValiditeFin,
      modalites: 'Certification par capitalisation',
      public: '',
      modalitesEvaluation: '',
      poursuiteEtudes: '',
      tauxSatisfaction: null,
      tauxPresentation: null,
      tauxCertification: null,
      lienFranceCompetences: '',
      metiers: [],
      alerte: false,
      alerteMessage: null,
      ccps: [],
      agrement: null,
    };
    sauvegarder([...formations, nouvelle]);
    setModaleNouvelle(false);
    setNouvelleForm({ intitule: '', rncp: '', codeDiplome: '', niveau: 'Niveau 4', certificateur: "Ministère du Travail du Plein Emploi et de l'Insertion", joursFormation: '', dureeContrat: '', volumeHoraireCFA: '', dateValiditeDebut: '', dateValiditeFin: '' });
    setSelectionne(nouvelle.id);
  }

  const formationSelectionnee = formations.find(f => f.id === selectionne);
  const formationsActives = formations.filter(f => !f.archive && (!filtreNiveau || f.niveau === filtreNiveau));
  const formationsArchivees = formations.filter(f => f.archive);
  const niveaux = [...new Set(formations.map(f => f.niveau))].filter(Boolean).sort();

  const DOCUMENTS_OFFICIELS = [
    { label: 'RNCP', key: 'docRncp', desc: 'Fiche officielle France Compétences' },
    { label: 'REAC', key: 'docReac', desc: 'Référentiel Emploi Activités Compétences' },
    { label: 'REV', key: 'docRev', desc: "Référentiel d'Évaluation" },
    { label: 'Fiche formation', key: 'docFiche', desc: 'Fiche descriptive de la formation' },
    { label: 'Dossier Professionnel', key: 'docDP', desc: 'Modèle de Dossier Professionnel vierge' },
    { label: 'Livret ECF', key: 'docECF', desc: "Livret d'Évaluation en Cours de Formation" },
  ];

  const historiqueComplet = formationSelectionnee
    ? (formationSelectionnee.archive?.historique ?? formationSelectionnee.historiqueArchivage ?? [])
    : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#006B68', marginBottom: '4px' }}>🎓 Référentiel des formations</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>{formationsActives.length} active(s) — {formationsArchivees.length} archivée(s) — {formations.filter(f => f.agrement).length} agrément(s) DEETS importé(s)</p>
        </div>
        <button onClick={() => setModaleNouvelle(true)} style={btnPrimary}>+ Nouvelle formation</button>
      </div>

      {formationsActives.some(f => ['warning', 'ceres'].includes(statutValidite(f.dateValiditeFin))) && (
        <div style={{ backgroundColor: '#fef6e4', border: '1.5px solid #C8A23A', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#C8A23A', marginBottom: '4px' }}>⚠️ Validité RNCP à surveiller</div>
          {formationsActives.filter(f => ['warning', 'ceres'].includes(statutValidite(f.dateValiditeFin))).map(f => {
            const st = statutValidite(f.dateValiditeFin);
            return (
              <div key={f.id} style={{ fontSize: '11px', color: st === 'ceres' ? '#d97706' : '#7a5c00', marginTop: '2px' }}>
                {st === 'ceres' ? '🟠' : '🟡'} <strong>{f.intitule}</strong> — {f.rncp} — expire le {f.dateValiditeFin}
                {st === 'ceres' && f.dateValiditeFin && <span> — Sessions CERES jusqu'au {ajouterUnAn(f.dateValiditeFin)}</span>}
              </div>
            );
          })}
        </div>
      )}

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>Niveau :</span>
          <button onClick={() => setFiltreNiveau('')} style={{ ...btnSecondary, backgroundColor: !filtreNiveau ? '#006B68' : 'white', color: !filtreNiveau ? 'white' : '#006B68', padding: '4px 12px', fontSize: '11px' }}>Tous</button>
          {niveaux.map(n => (
            <button key={n} onClick={() => setFiltreNiveau(n === filtreNiveau ? '' : n)} style={{ ...btnSecondary, backgroundColor: filtreNiveau === n ? '#006B68' : 'white', color: filtreNiveau === n ? 'white' : '#006B68', padding: '4px 12px', fontSize: '11px' }}>{n}</button>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: formationSelectionnee ? '320px 1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {formationsActives.map(f => {
            const st = statutValidite(f.dateValiditeFin);
            const stStyle = STATUT_COLORS[st];
            const mois = diffMois(f.dateValiditeFin);
            const isSelected = selectionne === f.id;
            const niveauColor = NIVEAU_COLORS[f.niveau] ?? '#006B68';

            return (
              <div key={f.id} onClick={() => { setSelectionne(isSelected ? null : f.id); setOnglet('infos'); }}
                style={{ borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', borderLeft: `4px solid ${niveauColor}`, border: `1px solid ${isSelected ? '#006B68' : '#e0e0e0'}`, borderLeftWidth: '4px', backgroundColor: isSelected ? '#EAF4F3' : 'white', boxShadow: isSelected ? '0 2px 8px rgba(0,107,104,0.15)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#006B68', marginBottom: '2px', lineHeight: '1.3' }}>{f.intitule}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{f.rncp} — {f.codeDiplome}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginLeft: '8px' }}>
                    <span style={{ backgroundColor: niveauColor + '20', color: niveauColor, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>{f.niveau}</span>
                    <span style={{ backgroundColor: stStyle.bg, color: stStyle.color, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      {st === 'expired' ? '⚠️ Expiré' : st === 'ceres' ? '🟠 CERES' : st === 'warning' ? `⏳ J-${mois}m` : '✅ Valide'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#555' }}>
                  <span>📅 {f.joursFormation}</span>
                  <span>⏱ {f.volumeHoraireCFA}h</span>
                  <span>📋 {f.ccps?.length ?? 0} CCP</span>
                </div>
                {f.agrement ? (
                  <div style={{ marginTop: '6px', backgroundColor: '#e6f4f1', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', color: '#006B68', fontWeight: '600' }}>
                    ✅ Agrément DEETS importé le {f.agrement.date}
                  </div>
                ) : (
                  <div style={{ marginTop: '6px', backgroundColor: '#fef6e4', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', color: '#C8A23A', fontWeight: '600' }}>
                    ⚠️ Agrément DEETS non importé
                  </div>
                )}
              </div>
            );
          })}

          {formationsArchivees.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '8px', borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
                🗄️ Archives ({formationsArchivees.length})
              </div>
              {formationsArchivees.map(f => {
                const st = statutValidite(f.dateValiditeFin);
                const dansFenetreCeres = st === 'ceres';
                const isSelected = selectionne === f.id;
                return (
                  <div key={f.id} onClick={() => { setSelectionne(f.id); setOnglet('infos'); }} style={{ backgroundColor: isSelected ? '#EAF4F3' : '#f9f9f9', borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', borderLeft: '4px solid #ccc', border: `1px solid ${isSelected ? '#006B68' : '#e0e0e0'}`, marginBottom: '6px', opacity: 0.9 }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#666', marginBottom: '2px' }}>{f.intitule}</div>
                    <div style={{ fontSize: '10px', color: '#999' }}>{f.rncp} — Archivée le {f.archive?.date}</div>
                    {dansFenetreCeres && (
                      <div style={{ marginTop: '4px', fontSize: '10px', color: '#d97706', fontWeight: '600' }}>
                        🟠 CERES jusqu'au {ajouterUnAn(f.dateValiditeFin)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {formationSelectionnee && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#006B68', marginBottom: '4px' }}>{formationSelectionnee.intitule}</h2>
                  <div style={{ fontSize: '12px', color: '#888' }}>{formationSelectionnee.certificateur}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {!formationSelectionnee.agrement ? (
                    <label style={{ ...btnPrimary, display: 'inline-block', cursor: 'pointer', fontSize: '11px', padding: '6px 12px' }}>
                      {importEnCours === 'agrement' ? '⏳ Import...' : '📎 Importer agrément DEETS'}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={importEnCours === 'agrement'} onChange={ev => {
                        const file = ev.target.files?.[0];
                        if (file) importerDocument(formationSelectionnee.id, 'agrement', file);
                        ev.target.value = '';
                      }} />
                    </label>
                  ) : (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', backgroundColor: '#e6f4f1', borderRadius: '8px', padding: '4px 8px' }}>
                      <span style={{ fontSize: '11px', color: '#006B68', fontWeight: '600' }}>✅ Agrément</span>
                      <button onClick={() => setPreviewDoc({ ...formationSelectionnee.agrement, _titre: 'Agrément DEETS' })} title="Consulter" style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>👁️</button>
                      <button onClick={() => telechargerFichier(formationSelectionnee.agrement)} title="Télécharger" style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>⬇️</button>
                      <button onClick={() => supprimerDocument(formationSelectionnee.id, 'agrement', 'Agrément DEETS')} title="Supprimer" style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', color: '#e53e3e' }}>🗑️</button>
                    </div>
                  )}

                  {historiqueComplet.length > 0 && (
                    <button onClick={() => setModaleHistorique(true)} title="Voir l'historique d'archivage" style={{ backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                      📜 Historique ({historiqueComplet.length})
                    </button>
                  )}

                  {!formationSelectionnee.archive ? (
                    <button onClick={() => archiver(formationSelectionnee)} style={{ backgroundColor: '#f0f0f0', color: '#888', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                      🗄️ Archiver
                    </button>
                  ) : (
                    <>
                      <span style={{ backgroundColor: '#f0f0f0', color: '#888', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '600' }}>
                        🗄️ Archivée le {formationSelectionnee.archive.date}
                      </span>
                      <button
                        onClick={ouvrirModaleDesarchive}
                        disabled={!estAdmin}
                        title={estAdmin ? 'Désarchiver cette formation' : "Réservé à l'administrateur (Paméla MAILLOT)"}
                        style={{
                          backgroundColor: estAdmin ? '#C8A23A' : '#e0e0e0',
                          color: estAdmin ? 'white' : '#999',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: estAdmin ? 'pointer' : 'not-allowed',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        📤 Désarchiver {!estAdmin && '🔒'}
                      </button>
                    </>
                  )}

                  <button onClick={() => setSelectionne(null)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                </div>
              </div>

              {formationSelectionnee.archive && statutValidite(formationSelectionnee.dateValiditeFin) === 'ceres' && (
                <div style={{ backgroundColor: '#fff0d6', border: '1.5px solid #d97706', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', marginBottom: '6px' }}>🟠 Période CERES active</div>
                  <div style={{ fontSize: '11px', color: '#7a4906', lineHeight: '1.5' }}>
                    Les sessions d'examen peuvent encore être organisées <strong>jusqu'au {ajouterUnAn(formationSelectionnee.dateValiditeFin)}</strong> à condition que :
                    <ul style={{ margin: '4px 0 4px 18px', padding: 0 }}>
                      <li>la formation ait démarré avant le {formationSelectionnee.dateValiditeFin}</li>
                      <li>la session ait été inscrite sur CERES avant cette date</li>
                    </ul>
                    {estAdmin && <span>👉 Tu peux désarchiver temporairement la fiche pour finaliser les derniers examens.</span>}
                  </div>
                </div>
              )}

              {formationSelectionnee.archive && statutValidite(formationSelectionnee.dateValiditeFin) === 'expired' && (
                <div style={{ backgroundColor: '#fde8e8', border: '1.5px solid #e53e3e', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#7a1f1f', lineHeight: '1.5' }}>
                    🔴 <strong>Formation archivée — RNCP expiré depuis plus d'un an.</strong> Aucune nouvelle session d'examen possible. Cette fiche reste consultable pour l'historique pédagogique.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', borderBottom: '2px solid #EAF4F3', marginBottom: '16px' }}>
                {[{ id: 'infos', label: '📋 Informations' }, { id: 'ccps', label: `🎯 CCP (${formationSelectionnee.ccps?.length ?? 0})` }, { id: 'stats', label: '📊 Résultats' }].map(o => (
                  <button key={o.id} onClick={() => setOnglet(o.id as any)} style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '600', border: 'none', borderBottom: onglet === o.id ? '3px solid #006B68' : '3px solid transparent', backgroundColor: 'white', color: onglet === o.id ? '#006B68' : '#888', cursor: 'pointer', marginBottom: '-2px' }}>
                    {o.label}
                  </button>
                ))}
              </div>

              {onglet === 'infos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { label: 'Code RNCP', value: formationSelectionnee.rncp },
                      { label: 'Code diplôme', value: formationSelectionnee.codeDiplome },
                      { label: 'Niveau', value: formationSelectionnee.niveau },
                      { label: 'Niveau européen', value: formationSelectionnee.niveauEuropeen },
                      { label: 'Durée contrat', value: formationSelectionnee.dureeContrat },
                      { label: 'Jour de formation', value: formationSelectionnee.joursFormation },
                      { label: 'Volume horaire CFA', value: formationSelectionnee.volumeHoraireCFA + 'h' },
                      { label: 'Volume horaire entreprise', value: formationSelectionnee.volumeHoraireEntreprise + 'h' },
                      { label: 'Modalités', value: formationSelectionnee.modalites },
                    ].map(f => (
                      <div key={f.label} style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '3px' }}>{f.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>{f.value || '—'}</div>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const st = statutValidite(formationSelectionnee.dateValiditeFin);
                    const stColor = STATUT_COLORS[st];
                    const mois = diffMois(formationSelectionnee.dateValiditeFin);
                    return (
                      <div style={{ backgroundColor: stColor.bg, borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px' }}>Période de validité RNCP</div>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>Du {formationSelectionnee.dateValiditeDebut} au {formationSelectionnee.dateValiditeFin}</div>
                          {st === 'ceres' && <div style={{ fontSize: '11px', color: '#d97706', marginTop: '3px', fontWeight: '600' }}>🟠 Sessions CERES jusqu'au {ajouterUnAn(formationSelectionnee.dateValiditeFin)}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: stColor.color }}>
                            {mois !== null && mois > 0 ? `${mois}` : '⚠️'}
                          </div>
                          <div style={{ fontSize: '10px', color: '#888' }}>{mois !== null && mois > 0 ? 'mois restants' : stColor.label}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {formationSelectionnee.public && (
                    <div>
                      <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Public visé</div>
                      <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.5' }}>{formationSelectionnee.public}</div>
                    </div>
                  )}

                  {formationSelectionnee.metiers?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>Débouchés métiers</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {formationSelectionnee.metiers.map((m: string, i: number) => (
                          <span key={i} style={{ backgroundColor: '#EAF4F3', color: '#006B68', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{m}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {formationSelectionnee.lienFranceCompetences && (
                    <a href={formationSelectionnee.lienFranceCompetences} target="_blank" rel="noopener noreferrer" style={{ color: '#0891b2', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                      🔗 Voir sur France Compétences →
                    </a>
                  )}

                  <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#006B68', textTransform: 'uppercase' }}>📄 Documents officiels</div>
                      <div style={{ fontSize: '10px', color: '#888' }}>Taille max : {formaterTaille(TAILLE_MAX_FICHIER)} par fichier</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {DOCUMENTS_OFFICIELS.map(doc => {
                        const fichier = formationSelectionnee[doc.key];
                        const enImport = importEnCours === doc.key;
                        return (
                          <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', backgroundColor: fichier ? '#e6f4f1' : 'white', border: `1px solid ${fichier ? '#006B68' : '#e0e0e0'}`, gap: '8px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: fichier ? '#006B68' : '#333' }}>
                                {fichier ? '✅' : '📎'} {doc.label}
                              </div>
                              <div style={{ fontSize: '10px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {fichier ? `${fichier.nom} — ${formaterTaille(fichier.taille ?? 0)} — importé le ${fichier.date}` : doc.desc}
                              </div>
                            </div>
                            {!fichier ? (
                              <label style={{ backgroundColor: enImport ? '#888' : '#006B68', color: 'white', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: enImport ? 'wait' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {enImport ? '⏳ Import...' : 'Importer'}
                                <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} disabled={enImport} onChange={ev => {
                                  const f = ev.target.files?.[0];
                                  if (f) importerDocument(formationSelectionnee.id, doc.key, f);
                                  ev.target.value = '';
                                }} />
                              </label>
                            ) : (
                              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                <button onClick={() => setPreviewDoc({ ...fichier, _titre: doc.label })} title="Consulter" style={{ backgroundColor: 'white', border: '1px solid #006B68', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>👁️</button>
                                <button onClick={() => telechargerFichier(fichier)} title="Télécharger" style={{ backgroundColor: 'white', border: '1px solid #006B68', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>⬇️</button>
                                <button onClick={() => supprimerDocument(formationSelectionnee.id, doc.key, doc.label)} title="Supprimer" style={{ backgroundColor: 'white', border: '1px solid #e53e3e', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', color: '#e53e3e' }}>🗑️</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {onglet === 'ccps' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formationSelectionnee.ccps?.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>Aucun CCP renseigné</div>
                  ) : formationSelectionnee.ccps?.map((ccp: any) => (
                    <div key={ccp.id} style={{ backgroundColor: '#EAF4F3', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#006B68', marginBottom: '8px' }}>
                        <span style={{ backgroundColor: '#006B68', color: 'white', padding: '2px 8px', borderRadius: '4px', marginRight: '8px', fontSize: '11px' }}>{ccp.id}</span>
                        {ccp.libelle}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {ccp.competences?.map((c: string, i: number) => (
                          <div key={i} style={{ fontSize: '11px', color: '#555', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                            <span style={{ color: '#006B68', fontWeight: '700', flexShrink: 0 }}>✓</span>
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {onglet === 'stats' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Taux de satisfaction', value: formationSelectionnee.tauxSatisfaction, unit: '%', color: '#16a34a' },
                    { label: 'Taux de présentation', value: formationSelectionnee.tauxPresentation, unit: '%', color: '#0891b2' },
                    { label: 'Taux de certification', value: formationSelectionnee.tauxCertification, unit: '%', color: '#7c3aed' },
                  ].map(s => (
                    <div key={s.label} style={{ backgroundColor: '#EAF4F3', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: s.value !== null && s.value !== undefined ? s.color : '#ccc' }}>
                        {s.value !== null && s.value !== undefined ? `${s.value}${s.unit}` : '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', textTransform: 'uppercase', fontWeight: '600' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {modaleNouvelle && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '540px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#006B68', marginBottom: '20px' }}>+ Nouvelle formation</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Intitulé complet *</label>
                <input style={inputStyle} value={nouvelleForm.intitule} placeholder="ex: Titre Professionnel Secrétaire Comptable" onChange={e => setNouvelleForm(p => ({ ...p, intitule: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Code RNCP *', k: 'rncp', ph: 'ex: RNCP37123' },
                  { label: 'Code diplôme', k: 'codeDiplome', ph: 'ex: TP-00402m09' },
                  { label: 'Jour de formation', k: 'joursFormation', ph: 'ex: Mercredi' },
                  { label: 'Durée contrat', k: 'dureeContrat', ph: 'ex: 14 mois' },
                  { label: 'Volume horaire CFA', k: 'volumeHoraireCFA', ph: 'ex: 476' },
                  { label: 'Date début validité', k: 'dateValiditeDebut', ph: 'JJ/MM/AAAA' },
                  { label: 'Date fin validité', k: 'dateValiditeFin', ph: 'JJ/MM/AAAA' },
                ].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                    <input style={inputStyle} value={(nouvelleForm as any)[f.k]} placeholder={f.ph} onChange={e => setNouvelleForm(p => ({ ...p, [f.k]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Niveau</label>
                  <select style={inputStyle} value={nouvelleForm.niveau} onChange={e => setNouvelleForm(p => ({ ...p, niveau: e.target.value }))}>
                    {['Niveau 3', 'Niveau 4', 'Niveau 5', 'Niveau 6'].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setModaleNouvelle(false)} style={btnSecondary}>Annuler</button>
              <button onClick={creerFormation} disabled={!nouvelleForm.intitule || !nouvelleForm.rncp} style={{ ...btnPrimary, opacity: !nouvelleForm.intitule || !nouvelleForm.rncp ? 0.5 : 1 }}>
                ✅ Créer la formation
              </button>
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div onClick={() => setPreviewDoc(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', width: '90vw', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EAF4F3' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>{previewDoc._titre}</div>
                <div style={{ fontSize: '11px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {previewDoc.nom} — {formaterTaille(previewDoc.taille ?? 0)} — importé le {previewDoc.date}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => telechargerFichier(previewDoc)} style={{ ...btnSecondary, fontSize: '11px', padding: '6px 12px' }}>⬇️ Télécharger</button>
                <button onClick={() => setPreviewDoc(null)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✕ Fermer</button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
              {previewDoc.dataBase64 ? (
                previewDoc.mimeType?.startsWith('image/') ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
                    <img src={`data:${previewDoc.mimeType};base64,${previewDoc.dataBase64}`} alt={previewDoc.nom} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  </div>
                ) : (
                  <iframe src={`data:${previewDoc.mimeType ?? 'application/pdf'};base64,${previewDoc.dataBase64}`} style={{ width: '100%', height: '100%', border: 'none' }} title={previewDoc.nom} />
                )
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📄</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Aperçu indisponible</div>
                  <div style={{ fontSize: '12px' }}>Ce document a été référencé avant la mise à jour du module.<br />Réimporte le fichier pour pouvoir le consulter et le télécharger.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modaleDesarchive && formationSelectionnee && (
        <div onClick={() => setModaleDesarchive(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '520px', maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#006B68', marginBottom: '6px' }}>📤 Désarchiver la formation</h2>
            <div style={{ fontSize: '13px', color: '#555', marginBottom: '14px' }}>{formationSelectionnee.intitule}</div>

            <div style={{ backgroundColor: '#fff0d6', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: '#7a4906', lineHeight: '1.5' }}>
                ⚠️ Cette formation va redevenir <strong>active</strong> et réapparaître dans la liste principale.<br />
                Cette action est tracée dans l'historique de la fiche.
              </div>
            </div>

            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Motif de désarchivage *</label>
            <textarea
              value={motifDesarchive}
              onChange={e => setMotifDesarchive(e.target.value)}
              placeholder="ex: Session d'examen CERES à finaliser pour l'apprenant X — inscription effectuée le JJ/MM/AAAA"
              style={{ ...inputStyle, minHeight: '90px', fontFamily: 'inherit', resize: 'vertical' }}
              autoFocus
            />

            <div style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>
              Désarchivé par : <strong>{nomUtilisateur}</strong> ({utilisateur?.fonction ?? '—'})
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button onClick={() => setModaleDesarchive(false)} style={btnSecondary}>Annuler</button>
              <button
                onClick={confirmerDesarchive}
                disabled={!motifDesarchive.trim()}
                style={{ ...btnPrimary, backgroundColor: '#C8A23A', opacity: !motifDesarchive.trim() ? 0.5 : 1 }}
              >
                📤 Confirmer le désarchivage
              </button>
            </div>
          </div>
        </div>
      )}

      {modaleHistorique && formationSelectionnee && (
        <div onClick={() => setModaleHistorique(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '580px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#006B68', marginBottom: '2px' }}>📜 Historique de la fiche</h2>
                <div style={{ fontSize: '12px', color: '#888' }}>{formationSelectionnee.intitule}</div>
              </div>
              <button onClick={() => setModaleHistorique(false)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✕ Fermer</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historiqueComplet.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>Aucun événement enregistré</div>
              ) : [...historiqueComplet].reverse().map((entry: any, idx: number) => {
                const isArchive = entry.action === 'archive';
                return (
                  <div key={idx} style={{ borderLeft: `4px solid ${isArchive ? '#888' : '#C8A23A'}`, paddingLeft: '12px', paddingTop: '4px', paddingBottom: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: isArchive ? '#666' : '#C8A23A', marginBottom: '2px' }}>
                      {isArchive ? '🗄️ Archivée' : '📤 Désarchivée'} le {entry.date}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                      par <strong>{entry.parNom ?? entry.par}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#444', fontStyle: 'italic', backgroundColor: '#fafafa', padding: '6px 10px', borderRadius: '6px' }}>
                      "{entry.motif}"
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
