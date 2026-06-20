'use client';

import { useState, useEffect } from 'react';
import { ENTREPRISES_REELS } from '../../data/mockEntreprises_reels';
import { APPRENANTS_REELS } from '../../data/mockApprenants_reels';
import { COLORS } from '../../lib/constants';
import { 
  chargerMandats as chargerMandatsSupabase,
  creerMandat as creerMandatSupabase,
  modifierMandat,
  supprimerMandat as supprimerMandatSupabase,
} from '../../data/mandatsSupabase';
import Card from '../../components/Card';
import BoutonMandatRecrutement from '../../components/BoutonMandatRecrutement';
import { uploaderFichier, cheminStorage } from '../../lib/storage';

const FORMATIONS = ['SC', 'GCF', 'AD', 'ARH', 'CATL', 'EC', 'CV', 'FPA'];
const STATUTS = ["En attente", "Actif", "En cours d'entretiens", "Pourvu", "Annulé"];

const statutStyles: Record<string, { bg: string; color: string }> = {
  "En attente":             { bg: '#fef6e4', color: '#C8A23A' },
  "Actif":                  { bg: '#e6f4f1', color: '#006B68' },
  "En cours d'entretiens":  { bg: '#ede9fe', color: '#7c3aed' },
  "Pourvu":                 { bg: '#dcfce7', color: '#16a34a' },
  "Annulé":                 { bg: '#fde8e8', color: '#e53e3e' },
};

const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };
const btnPrimary: React.CSSProperties = { backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

type Candidat = { nom: string; prenom: string; statut: string; notes: string };
type Mandat = {
  id: string;
  entrepriseId: string;
  entrepriseNom: string;
  entrepriseAdresse: string;
  entrepriseSiret: string;
  entrepriseEmail: string;
  dateContact: string;
  formation: string;
  nbPostes: number;
  statut: string;
  dateEnvoiMandat: string;
  dateSignatureMandat: string;
  mandatSigne: string;
  datePublication: string;
  dateEntretiens: string;
  profils_proposes: boolean;
  contrat_conclu: boolean;
  non_abouti: boolean;
  annule: boolean;
  candidats: Candidat[];
  notes: string;
};

export default function Recrutement() {
  const [mandats, setMandats] = useState<Mandat[]>([]);
  const [modale, setModale] = useState(false);
  const [ficheOuverte, setFicheOuverte] = useState<Mandat | null>(null);
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState<Partial<Mandat>>({ statut: 'En attente', nbPostes: 1 });
  const [entrepriseMode, setEntrepriseMode] = useState<'bdd' | 'nouvelle'>('bdd');
  const [nouveauCandidat, setNouveauCandidat] = useState({ nom: '', prenom: '', statut: 'P2S', notes: '' });

  useEffect(() => {
    (async () => {
      try {
        const fromSupabase = await chargerMandatsSupabase();
        if (fromSupabase.length > 0) {
          console.log(`[Mandats] ${fromSupabase.length} mandats chargés depuis Supabase ✅`);
          setMandats(fromSupabase as any[]);
          return;
        }
        console.warn('[Mandats] Supabase vide, fallback localStorage');
      } catch (e) {
        console.error('[Mandats] Erreur Supabase, fallback localStorage', e);
      }
      try {
        const saved = localStorage.getItem('easycfa_mandats');
        if (saved) setMandats(JSON.parse(saved));
      } catch {}
    })();
  }, []);

  function sauvegarderMandats(liste: Mandat[]) {
    setMandats(liste);
    localStorage.setItem('easycfa_mandats', JSON.stringify(liste));
  }

  async function creerMandat() {
    if (!form.entrepriseNom || !form.formation) return;
    const nouveau: Mandat = {
      id: Date.now().toString(),
      entrepriseId: form.entrepriseId ?? '',
      entrepriseNom: form.entrepriseNom ?? '',
      entrepriseAdresse: form.entrepriseAdresse ?? '',
      entrepriseSiret: form.entrepriseSiret ?? '',
      entrepriseEmail: form.entrepriseEmail ?? '',
      dateContact: form.dateContact ?? new Date().toLocaleDateString('fr-FR'),
      formation: form.formation ?? '',
      nbPostes: form.nbPostes ?? 1,
      statut: 'En attente',
      dateEnvoiMandat: '',
      dateSignatureMandat: '',
      mandatSigne: '',
      datePublication: '',
      dateEntretiens: '',
      profils_proposes: false,
      contrat_conclu: false,
      non_abouti: false,
      annule: false,
      candidats: [],
      notes: form.notes ?? '',
    };
    // Supabase d'abord
    const res = await creerMandatSupabase(nouveau as any);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[Mandats] ${nouveau.id} créé dans Supabase ✅`);
    // localStorage + UI
    sauvegarderMandats([...mandats, nouveau]);
    setModale(false);
    setForm({ statut: 'En attente', nbPostes: 1 });

    // Le mandat pré-rempli se télécharge depuis la fiche du mandat (bouton « Télécharger mandat »)

    // Ouvrir Gmail
    setTimeout(() => {
      const sujet = encodeURIComponent("Mandat de recrutement — PAM OI Formation — " + (form.formation ?? ''));
      const corps = encodeURIComponent(
        "Madame, Monsieur,\n\nNous vous remercions de l'intérêt que vous portez à la formation par apprentissage.\n\n" +
        "Veuillez trouver ci-joint notre mandat de recrutement pour " + (form.nbPostes ?? 1) + " poste(s) — Formation : " + (form.formation ?? '') + ".\n\n" +
        "Merci de le compléter, signer et retourner à : pedagogie@pamoi.re\n\n" +
        "Cordialement,\nPAM OI Formation\npedagogie@pamoi.re\n06 93 55 64 97"
      );
      window.open("https://mail.google.com/mail/?view=cm&to=" + (form.entrepriseEmail ?? '') + "&su=" + sujet + "&body=" + corps, '_blank');
    }, 500);
  }

  async function mettreAJourFiche(champ: string, valeur: any) {
    if (!ficheOuverte) return;
    const updated = { ...ficheOuverte, [champ]: valeur };
    // Supabase d'abord
    const res = await modifierMandat(ficheOuverte.id, { [champ]: valeur } as any);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[Mandats ${ficheOuverte.id}] ${champ} mis à jour dans Supabase ✅`);
    // UI + localStorage
    setFicheOuverte(updated);
    sauvegarderMandats(mandats.map(m => m.id === updated.id ? updated : m));
  }

  function ajouterCandidat() {
    if (!ficheOuverte || !nouveauCandidat.nom) return;
    mettreAJourFiche('candidats', [...(ficheOuverte.candidats ?? []), { ...nouveauCandidat }]);
    setNouveauCandidat({ nom: '', prenom: '', statut: 'P2S', notes: '' });
  }

  async function supprimerMandat(id: string) {
    if (confirm('Supprimer ce mandat ?')) {
      // Supabase d'abord
      const res = await supprimerMandatSupabase(id);
      if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
      else console.log(`[Mandats ${id}] Supprimé de Supabase ✅`);
      // UI + localStorage
      sauvegarderMandats(mandats.filter(m => m.id !== id));
      if (ficheOuverte?.id === id) setFicheOuverte(null);
    }
  }

  function envoyerMandat(m: Mandat) {
    const sujet = encodeURIComponent("Mandat de recrutement — PAM OI Formation");
    const corps = encodeURIComponent(
      "Madame, Monsieur,\n\nVeuillez trouver ci-joint notre mandat de recrutement pour un poste en apprentissage — " + m.formation + ".\n\n" +
      "Merci de le compléter, signer et retourner à : pedagogie@pamoi.re\n\nCordialement,\nPAM OI Formation\n06 93 55 64 97"
    );
    window.open("https://mail.google.com/mail/?view=cm&to=" + m.entrepriseEmail + "&su=" + sujet + "&body=" + corps, '_blank');
    mettreAJourFiche('dateEnvoiMandat', new Date().toLocaleDateString('fr-FR'));
  }

  const mandatsFiltres = mandats.filter(m => {
    const matchStatut = filtreStatut === 'Tous' || m.statut === filtreStatut;
    const matchRecherche = !recherche || m.entrepriseNom.toLowerCase().includes(recherche.toLowerCase()) || m.formation.toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchRecherche;
  });

  const p2sDisponibles = APPRENANTS_REELS.filter(a => a.statut === 'P2S');

  function calculerFinPublication(datePublication: string): { joursRestants: number; alerte: boolean; expire: boolean } | null {
    if (!datePublication) return null;
    const [j, m, a] = datePublication.split('/').map(Number);
    const debut = new Date(a, m - 1, j);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 30);
    const aujourd = new Date();
    const joursRestants = Math.ceil((fin.getTime() - aujourd.getTime()) / (1000 * 60 * 60 * 24));
    return { joursRestants, alerte: joursRestants <= 8 && joursRestants > 0, expire: joursRestants <= 0 };
  }

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#006B68', marginBottom: '4px' }}>🎯 Recrutement</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>{mandats.length} mandat(s) — {mandats.filter(m => m.statut === 'Actif').length} actif(s)</p>
        </div>
        <button onClick={() => setModale(true)} style={btnPrimary}>+ Nouveau mandat</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: mandats.length, color: '#006B68' },
          { label: 'En attente', value: mandats.filter(m => m.statut === 'En attente').length, color: '#C8A23A' },
          { label: 'Actifs', value: mandats.filter(m => m.statut === 'Actif').length, color: '#006B68' },
          { label: 'En entretiens', value: mandats.filter(m => m.statut === "En cours d'entretiens").length, color: '#7c3aed' },
          { label: 'Pourvus', value: mandats.filter(m => m.statut === 'Pourvu').length, color: '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center', borderTop: '4px solid ' + s.color }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher..." style={{ ...inputStyle, paddingLeft: '32px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['Tous', ...STATUTS].map(s => (
              <button key={s} onClick={() => setFiltreStatut(s)} style={{ ...btnSecondary, backgroundColor: filtreStatut === s ? '#006B68' : 'white', color: filtreStatut === s ? 'white' : '#006B68', padding: '6px 14px', fontSize: '12px' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Alerte P2S */}
      {p2sDisponibles.length > 0 && (
        <div style={{ backgroundColor: '#fef6e4', border: '1.5px solid #C8A23A', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#7a5c00' }}>{p2sDisponibles.length} apprenant(s) en P2S disponibles</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
              {p2sDisponibles.slice(0, 5).map(a => a.prenom + ' ' + a.nom + ' (' + a.formation + ')').join(' — ')}
              {p2sDisponibles.length > 5 && ' — ...'}
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div style={{ display: 'grid', gridTemplateColumns: ficheOuverte ? '1fr 1fr' : '1fr', gap: '24px' }}>

        {/* Liste mandats */}
        <Card>
          {mandatsFiltres.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
              Aucun mandat — cliquez sur "+ Nouveau mandat" pour commencer
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mandatsFiltres.map(m => {
                const st = statutStyles[m.statut] ?? { bg: '#f0f0f0', color: '#888' };
                const isOpen = ficheOuverte?.id === m.id;
                return (
                  <div key={m.id} onClick={() => setFicheOuverte(isOpen ? null : m)} style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid ' + (isOpen ? '#006B68' : '#e0e0e0'), backgroundColor: isOpen ? '#EAF4F3' : 'white', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>{m.entrepriseNom}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                          {m.formation} — {m.nbPostes} poste(s) — Contact : {m.dateContact}
                        </div>
                        {(m.candidats ?? []).length > 0 && (
                          <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '3px' }}>👥 {m.candidats.length} candidat(s)</div>
                        )}
                        {(() => {
                          const pub = calculerFinPublication(m.datePublication);
                          if (!pub) return null;
                          if (pub.expire) return <div style={{ fontSize: '11px', color: '#e53e3e', fontWeight: '700', marginTop: '3px' }}>🔴 Offre expirée — À renouveler !</div>;
                          if (pub.alerte) return <div style={{ fontSize: '11px', color: '#C8A23A', fontWeight: '700', marginTop: '3px' }}>⚠️ Offre expire dans {pub.joursRestants} jour(s) — Pensez à renouveler !</div>;
                          return <div style={{ fontSize: '11px', color: '#006B68', marginTop: '3px' }}>📢 Offre publiée — {pub.joursRestants} jour(s) restant(s)</div>;
                        })()}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ backgroundColor: st.bg, color: st.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>{m.statut}</span>
                        <button onClick={e => { e.stopPropagation(); supprimerMandat(m.id); }} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Fiche mandat */}
        {ficheOuverte && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#006B68' }}>{ficheOuverte.entrepriseNom}</h2>
                <button onClick={() => setFicheOuverte(null)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>✕ Fermer</button>
              </div>

              {/* Rappel publication */}
              {(() => {
                const pub = calculerFinPublication(ficheOuverte.datePublication);
                if (!pub) return null;
                if (pub.expire) return (
                  <div style={{ backgroundColor: '#fde8e8', border: '1.5px solid #e53e3e', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', fontWeight: '700', color: '#e53e3e' }}>
                    🔴 Offre expirée ! Renouvelez l'annonce sur France Travail.
                  </div>
                );
                if (pub.alerte) return (
                  <div style={{ backgroundColor: '#fef6e4', border: '1.5px solid #C8A23A', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', fontWeight: '700', color: '#7a5c00' }}>
                    ⚠️ Offre expire dans {pub.joursRestants} jour(s) ! Pensez à renouveler sur France Travail.
                  </div>
                );
                return (
                  <div style={{ backgroundColor: '#e6f4f1', borderRadius: '8px', padding: '8px 14px', marginBottom: '12px', fontSize: '12px', color: '#006B68', fontWeight: '600' }}>
                    📢 Offre publiée — expire dans {pub.joursRestants} jour(s)
                  </div>
                );
              })()}

              {/* Avancée */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#006B68', textTransform: 'uppercase', marginBottom: '10px' }}>📊 Avancée du mandat</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: '📤 Mandat envoyé le', champ: 'dateEnvoiMandat' },
                    { label: '✍️ Mandat signé le', champ: 'dateSignatureMandat' },
                    { label: '📢 Publication offre le', champ: 'datePublication' },
                    { label: '🤝 Début entretiens le', champ: 'dateEntretiens' },
                  ].map(f => (
                    <div key={f.champ} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', flexShrink: 0 }}>{(ficheOuverte as any)[f.champ] ? '✅' : '⏳'}</span>
                      <label style={{ fontSize: '12px', color: '#555', width: '180px', flexShrink: 0 }}>{f.label}</label>
                      <input style={{ ...inputStyle, flex: 1, padding: '5px 8px', fontSize: '12px' }} value={(ficheOuverte as any)[f.champ] ?? ''} placeholder="JJ/MM/AAAA" onChange={e => mettreAJourFiche(f.champ, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Résultat */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#EAF4F3', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#006B68', textTransform: 'uppercase', marginBottom: '10px' }}>🎯 Résultat</div>
                {[
                  { id: 'profils_proposes', label: 'Profils proposés à l\'entreprise' },
                  { id: 'contrat_conclu', label: 'Contrat d\'apprentissage conclu ✅' },
                  { id: 'non_abouti', label: 'Recrutement non abouti ❌' },
                  { id: 'annule', label: 'Mandat annulé 🚫' },
                ].map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', flex: 1 }}>
                      <input type="checkbox" checked={(ficheOuverte as any)[item.id] ?? false} onChange={e => mettreAJourFiche(item.id, e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#006B68', cursor: 'pointer' }} />
                      {item.label}
                    </label>
                    {(item as any).bouton && (ficheOuverte as any)[item.id] && !ficheOuverte.entrepriseId && (
                      <a
                        href={"/entreprises/nouvelle?nom=" + encodeURIComponent(ficheOuverte.entrepriseNom) + "&siret=" + encodeURIComponent(ficheOuverte.entrepriseSiret) + "&adresse=" + encodeURIComponent(ficheOuverte.entrepriseAdresse) + "&email=" + encodeURIComponent(ficheOuverte.entrepriseEmail)}
                        style={{ backgroundColor: '#006B68', color: 'white', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', textDecoration: 'none', whiteSpace: 'nowrap' }}
                      >
                        + Créer la fiche entreprise
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Statut */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Statut</label>
                <select value={ficheOuverte.statut} onChange={e => mettreAJourFiche('statut', e.target.value)} style={inputStyle}>
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Notes</label>
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={ficheOuverte.notes ?? ''} onChange={e => mettreAJourFiche('notes', e.target.value)} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <BoutonMandatRecrutement
                  donnees={{ entrepriseNom: ficheOuverte.entrepriseNom, entrepriseAdresse: ficheOuverte.entrepriseAdresse, entrepriseSiret: ficheOuverte.entrepriseSiret }}
                  nomFichier={'Mandat_' + (ficheOuverte.entrepriseNom || '').replace(/\s/g, '_') + '.pdf'}
                  style={btnPrimary}
                />
                <button onClick={() => envoyerMandat(ficheOuverte)} style={btnSecondary}>
                  ✉️ Envoyer par email
                </button>
                <label style={{ ...btnSecondary, display: 'inline-block', cursor: 'pointer' }}>
                  📎 Importer mandat signé
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={async ev => {
                    const f = ev.target.files?.[0];
                    if (!f) return;
                    const chemin = cheminStorage('mandats', ficheOuverte.id, 'mandat_signe', f.name);
                    const resUpload = await uploaderFichier(chemin, f);
                    if (!resUpload.success || !resUpload.fichier) {
                      alert(`⚠️ Erreur upload : ${resUpload.error}`);
                      return;
                    }
                    console.log(`[Mandat ${ficheOuverte.id}] Mandat signé uploadé vers Storage ✅`);
                    mettreAJourFiche('mandatSigne', f.name);
                    mettreAJourFiche('mandatSigneUrl', resUpload.fichier.url);
                    mettreAJourFiche('mandatSigneCheminStorage', resUpload.fichier.cheminStorage);
                    mettreAJourFiche('dateSignatureMandat', new Date().toLocaleDateString('fr-FR'));
                    mettreAJourFiche('statut', 'Actif');
                  }} />
                </label>
              </div>
              {ficheOuverte.mandatSigne && (
                <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#e6f4f1', borderRadius: '8px', fontSize: '12px', color: '#006B68', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span>✅ Mandat signé : {ficheOuverte.mandatSigne}</span>
                  {ficheOuverte.mandatSigneUrl && (
                    <a href={ficheOuverte.mandatSigneUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#006B68', textDecoration: 'underline', fontSize: '11px' }}>⬇ Télécharger</a>
                  )}
                </div>
              )}
            </Card>

            {/* Candidats */}
            <Card>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68', marginBottom: '12px' }}>👥 Candidats proposés</h3>

              {/* P2S suggérés */}
              {p2sDisponibles.filter(a => a.formation === ficheOuverte.formation).length > 0 && (
                <div style={{ backgroundColor: '#fef6e4', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#7a5c00', marginBottom: '6px' }}>⚡ P2S disponibles en {ficheOuverte.formation} :</div>
                  {p2sDisponibles.filter(a => a.formation === ficheOuverte.formation).map((a, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#555' }}>{a.prenom} {a.nom}</span>
                      <button onClick={() => {
                        const cand = { nom: a.nom, prenom: a.prenom, statut: 'P2S', notes: '' };
                        mettreAJourFiche('candidats', [...(ficheOuverte.candidats ?? []), cand]);
                      }} style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>
                        + Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Liste candidats */}
              {(ficheOuverte.candidats ?? []).map((cand, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{cand.prenom} {cand.nom}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{cand.statut}{cand.notes ? ' — ' + cand.notes : ''}</div>
                  </div>
                  <button onClick={() => {
                    mettreAJourFiche('candidats', ficheOuverte.candidats.filter((_, j) => j !== i));
                  }} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                </div>
              ))}

              {/* Ajouter candidat */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '10px' }}>
                <input placeholder="Nom" style={inputStyle} value={nouveauCandidat.nom} onChange={e => setNouveauCandidat(p => ({ ...p, nom: e.target.value }))} />
                <input placeholder="Prénom" style={inputStyle} value={nouveauCandidat.prenom} onChange={e => setNouveauCandidat(p => ({ ...p, prenom: e.target.value }))} />
                <select style={inputStyle} value={nouveauCandidat.statut} onChange={e => setNouveauCandidat(p => ({ ...p, statut: e.target.value }))}>
                  <option value="P2S">P2S</option>
                  <option value="Externe">Externe</option>
                  <option value="Retenu">Retenu</option>
                  <option value="Refusé">Refusé</option>
                </select>
              </div>
              <input placeholder="Notes (optionnel)" style={{ ...inputStyle, marginTop: '6px' }} value={nouveauCandidat.notes} onChange={e => setNouveauCandidat(p => ({ ...p, notes: e.target.value }))} />
              <button onClick={ajouterCandidat} style={{ ...btnPrimary, marginTop: '8px', width: '100%' }}>+ Ajouter ce candidat</button>
            </Card>
          </div>
        )}
      </div>

      {/* Modale nouveau mandat */}
      {modale && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#006B68', marginBottom: '20px' }}>+ Nouveau mandat de recrutement</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => setEntrepriseMode('bdd')} style={{ ...btnSecondary, backgroundColor: entrepriseMode === 'bdd' ? '#006B68' : 'white', color: entrepriseMode === 'bdd' ? 'white' : '#006B68', flex: 1 }}>
                📋 Entreprise existante
              </button>
              <button onClick={() => setEntrepriseMode('nouvelle')} style={{ ...btnSecondary, backgroundColor: entrepriseMode === 'nouvelle' ? '#006B68' : 'white', color: entrepriseMode === 'nouvelle' ? 'white' : '#006B68', flex: 1 }}>
                + Nouvelle entreprise
              </button>
            </div>

            {entrepriseMode === 'bdd' ? (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sélectionner une entreprise *</label>
                <select style={inputStyle} value={form.entrepriseId ?? ''} onChange={e => {
                  const ent = ENTREPRISES_REELS.find(en => en.id === e.target.value);
                  if (ent) setForm(p => ({ ...p, entrepriseId: ent.id, entrepriseNom: ent.raisonSociale, entrepriseAdresse: ent.adresse + ' ' + ent.codePostal + ' ' + ent.ville, entrepriseSiret: ent.siret, entrepriseEmail: ent.tuteurEmail || ent.email }));
                }}>
                  <option value="">Choisir une entreprise...</option>
                  {ENTREPRISES_REELS.map(e => <option key={e.id} value={e.id}>{e.raisonSociale}</option>)}
                </select>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: 'Raison sociale *', champ: 'entrepriseNom' },
                  { label: 'SIRET', champ: 'entrepriseSiret' },
                  { label: 'Adresse', champ: 'entrepriseAdresse' },
                  { label: 'Email contact', champ: 'entrepriseEmail' },
                ].map(f => (
                  <div key={f.champ}>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                    <input style={inputStyle} value={(form as any)[f.champ] ?? ''} onChange={e => setForm(p => ({ ...p, [f.champ]: e.target.value }))} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Formation *</label>
                <select style={inputStyle} value={form.formation ?? ''} onChange={e => setForm(p => ({ ...p, formation: e.target.value }))}>
                  <option value="">Choisir...</option>
                  {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Nb de postes *</label>
                <input type="number" min={1} style={inputStyle} value={form.nbPostes ?? 1} onChange={e => setForm(p => ({ ...p, nbPostes: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Date de contact</label>
                <input style={inputStyle} value={form.dateContact ?? ''} placeholder="JJ/MM/AAAA" onChange={e => setForm(p => ({ ...p, dateContact: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Email entreprise</label>
                <input style={inputStyle} value={form.entrepriseEmail ?? ''} placeholder="contact@entreprise.re" onChange={e => setForm(p => ({ ...p, entrepriseEmail: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Notes</label>
              <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setModale(false); setForm({ statut: 'En attente', nbPostes: 1 }); }} style={btnSecondary}>Annuler</button>
              <button onClick={creerMandat} disabled={!form.entrepriseNom || !form.formation} style={{ ...btnPrimary, opacity: !form.entrepriseNom || !form.formation ? 0.5 : 1 }}>
                ✅ Créer et envoyer le mandat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}