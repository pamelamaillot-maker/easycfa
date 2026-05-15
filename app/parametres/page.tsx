'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../../lib/UserContext';
import { UTILISATEURS, ROLES, Utilisateur, ACCES_PAR_ROLE } from '../../data/mockUtilisateurs';
import { COLORS } from '../../lib/constants';
import { getAccesParRole, setAccesParRole, resetAccesParRole } from '../../lib/useAcces';
import {
  getCfaIdentite, setCfaIdentite, resetCfaIdentite,
  getReferentHandicap, setReferentHandicap, resetReferentHandicap,
  CfaIdentite, ReferentHandicapCfa,
  CFA_IDENTITE_DEFAUT, REFERENT_HANDICAP_DEFAUT,
  TYPE_CFA_OPTIONS, FORMES_JURIDIQUES, REGIONS_FRANCE_COMPETENCES,
  deduireSiren,
} from '../../lib/cfaConfig';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';

const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };
const TAILLE_MAX_FICHIER = 4 * 1024 * 1024;

// ============================================================================
// CONFIGURATION DES ACCÈS — Liste des pages gérables dans la matrice
// ============================================================================
type PageItem = { label: string; href: string; icon: string };
type Section = { titre: string; pages: PageItem[] };

const SECTIONS_ACCES: Section[] = [
  { titre: 'Page d\'accueil', pages: [{ label: 'Tableau de bord', href: '/', icon: '🏠' }] },
  {
    titre: 'ADMINISTRATIF',
    pages: [
      { label: 'Apprenants', href: '/apprenants', icon: '🎓' },
      { label: 'Entreprises', href: '/entreprises', icon: '🏢' },
      { label: 'Formateurs', href: '/formateurs', icon: '👨‍🏫' },
      { label: 'Recrutement', href: '/recrutement', icon: '🎯' },
    ],
  },
  {
    titre: 'PÉDAGOGIE',
    pages: [
      { label: 'Formations', href: '/formations', icon: '📚' },
      { label: 'Sessions', href: '/sessions', icon: '📅' },
      { label: 'Planning', href: '/planning', icon: '🗓️' },
      { label: 'Examens', href: '/examens', icon: '🏆' },
    ],
  },
  {
    titre: 'ASSIDUITÉS',
    pages: [
      { label: 'Émargement', href: '/emargement', icon: '✍️' },
      { label: 'Présences', href: '/presences', icon: '📋' },
    ],
  },
  {
    titre: 'CONFORMITÉS',
    pages: [
      { label: 'Qualiopi', href: '/qualiopi', icon: '🏅' },
      { label: 'France Compétences', href: '/france-competences', icon: '🇫🇷' },
      { label: 'SIFA', href: '/sifa', icon: '📊' },
      { label: 'BPF', href: '/bpf', icon: '📑' },
      { label: 'Documents', href: '/documents', icon: '📄' },
    ],
  },
  {
    titre: 'COMPTABILITÉ',
    pages: [
      { label: 'Facturation OPCO', href: '/precomptabilite', icon: '💰' },
      { label: 'OPCO', href: '/opco', icon: '🏦' },
    ],
  },
  { titre: 'SYSTÈME', pages: [{ label: 'Paramètres', href: '/parametres', icon: '⚙️' }] },
];

const ROLES_GERABLES: Array<{ id: string; label: string; couleur: string; verrouille?: boolean }> = [
  { id: 'admin', label: 'Admin', couleur: '#006B68', verrouille: true },
  { id: 'pedagogique', label: 'Pédagogique', couleur: '#3a5bc7' },
  { id: 'comptable', label: 'Comptable', couleur: '#9333ea' },
  { id: 'formateur', label: 'Formateur', couleur: '#C8A23A' },
  { id: 'lecteur', label: 'Lecteur', couleur: '#888' },
];

// ============================================================================
// CONFIGURATION DES JUSTIFICATIFS LÉGAUX
// ============================================================================
const JUSTIFICATIFS_LEGAUX = [
  { key: 'kbis', label: 'Kbis', desc: 'Extrait Kbis à jour (< 3 mois)', alerteJours: 30, dureeRecommandee: '3 mois' },
  { key: 'qualiopi', label: 'Certificat Qualiopi', desc: 'Certificat Qualiopi en cours de validité', alerteJours: 90, dureeRecommandee: 'Variable' },
  { key: 'nda', label: 'Récépissé NDA', desc: 'Récépissé de déclaration d\'activité', alerteJours: null, dureeRecommandee: 'Permanent' },
  { key: 'multirisques', label: 'Multirisques', desc: 'Attestation d\'assurance multirisques professionnelle', alerteJours: 60, dureeRecommandee: '1 an' },
  { key: 'bail', label: 'Bail commercial', desc: 'Bail commercial des locaux du CFA', alerteJours: 90, dureeRecommandee: 'Variable' },
  { key: 'vigilance', label: 'Attestation de vigilance URSSAF', desc: 'Attestation de vigilance URSSAF', alerteJours: 30, dureeRecommandee: '6 mois' },
  { key: 'fiscale', label: 'Régularité fiscale', desc: 'Attestation de régularité fiscale', alerteJours: 30, dureeRecommandee: '1 an' },
  { key: 'casier', label: 'Casier judiciaire n°3', desc: 'Casier judiciaire n°3 du dirigeant', alerteJours: null, dureeRecommandee: 'Variable' },
];

// ============================================================================
// HELPERS
// ============================================================================
function formaterTaille(o: number): string {
  if (o < 1024) return o + ' o';
  if (o < 1024 * 1024) return (o / 1024).toFixed(1) + ' Ko';
  return (o / (1024 * 1024)).toFixed(2) + ' Mo';
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
    alert('Document non disponible. Réimporte-le pour pouvoir le consulter.');
    return;
  }
  const lien = document.createElement('a');
  lien.href = `data:${doc.mimeType ?? 'application/pdf'};base64,${doc.dataBase64}`;
  lien.download = doc.nom;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
}

function parseDate(d: string): Date | null {
  if (!d) return null;
  const p = d.split('/');
  if (p.length !== 3) return null;
  return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
}

function diffJours(d: string): number | null {
  const dd = parseDate(d);
  if (!dd) return null;
  const now = new Date();
  return Math.floor((dd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function statutJustificatif(dateExpiration: string | null, alerteJours: number | null): 'ok' | 'warning' | 'expired' | 'none' {
  if (!dateExpiration || alerteJours === null) return 'none';
  const j = diffJours(dateExpiration);
  if (j === null) return 'none';
  if (j < 0) return 'expired';
  if (j <= alerteJours) return 'warning';
  return 'ok';
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function Parametres() {
  const { utilisateur, mettreAJour } = useUser();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(UTILISATEURS);
  const [onglet, setOnglet] = useState<'profil' | 'utilisateurs' | 'acces' | 'cfa'>('profil');
  const [editUser, setEditUser] = useState<Utilisateur | null>(null);
  const [nouveauUser, setNouveauUser] = useState(false);
  const [formUser, setFormUser] = useState<Partial<Utilisateur>>({});
  const [sauvegarde, setSauvegarde] = useState(false);
  const [afficherMdp, setAfficherMdp] = useState<string | null>(null);

  // État accès
  const [accesConfig, setAccesConfig] = useState<Record<string, string[]>>(() => getAccesParRole());
  const [accesModifie, setAccesModifie] = useState(false);
  const [historiqueAcces, setHistoriqueAcces] = useState<any[]>([]);

  // État justificatifs
  const [justificatifs, setJustificatifs] = useState<Record<string, any>>({});
  const [importEnCours, setImportEnCours] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [editDateJustif, setEditDateJustif] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState('');

  // === NOUVEAU : État pour Identité CFA + Référent handicap ===
  const [cfaForm, setCfaForm] = useState<CfaIdentite>(CFA_IDENTITE_DEFAUT);
  const [referentForm, setReferentForm] = useState<ReferentHandicapCfa>(REFERENT_HANDICAP_DEFAUT);
  const [editCfa, setEditCfa] = useState(false);
  const [editReferent, setEditReferent] = useState(false);

  const isAdmin = utilisateur?.role === 'admin';

  // Chargement initial
  useEffect(() => {
    try {
      const j = localStorage.getItem('easycfa_justificatifs_legaux');
      if (j) setJustificatifs(JSON.parse(j));
      const h = localStorage.getItem('easycfa_acces_historique');
      if (h) setHistoriqueAcces(JSON.parse(h));
    } catch {}
    // Charger CFA + référent handicap
    setCfaForm(getCfaIdentite());
    setReferentForm(getReferentHandicap());
  }, []);

  function sauvegarderJustificatifs(maj: Record<string, any>) {
    try {
      localStorage.setItem('easycfa_justificatifs_legaux', JSON.stringify(maj));
      setJustificatifs(maj);
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || /quota/i.test(err?.message ?? '')) {
        alert("⚠️ Stockage local saturé. Supprime des fichiers ou attends la migration Supabase.");
      } else {
        alert("Erreur de sauvegarde : " + (err?.message ?? 'inconnue'));
      }
    }
  }

  function genererAvatar(prenom: string, nom: string) {
    return (prenom?.slice(0, 1) + nom?.slice(0, 1)).toUpperCase();
  }
  function genererID(prenom: string, nom: string) {
    return (prenom?.slice(0, 2) + nom?.slice(0, 2)).toUpperCase();
  }

  function sauvegarderProfil(data: Partial<Utilisateur>) {
    mettreAJour(data);
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  function sauvegarderUser() {
    if (!formUser.nom || !formUser.prenom || !formUser.email) return;
    const id = genererID(formUser.prenom!, formUser.nom!);
    const avatar = genererAvatar(formUser.prenom!, formUser.nom!);
    const complet: Utilisateur = {
      id, avatar, actif: true,
      nom: formUser.nom!, prenom: formUser.prenom!,
      email: formUser.email!, telephone: formUser.telephone ?? '',
      fonction: formUser.fonction ?? '', role: formUser.role ?? 'lecteur',
      motDePasse: formUser.motDePasse ?? id + '@2024!',
      signatureEmail: formUser.signatureEmail ?? formUser.prenom + ' ' + formUser.nom + '\n' + (formUser.fonction ?? '') + ' — PAM OI Formation\n' + (formUser.telephone ?? '') + '\n' + (formUser.email ?? ''),
    };
    if (editUser) {
      setUtilisateurs(prev => prev.map(u => u.id === editUser.id ? { ...complet, id: editUser.id } : u));
    } else {
      setUtilisateurs(prev => [...prev, complet]);
    }
    setEditUser(null);
    setNouveauUser(false);
    setFormUser({});
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  function ouvrirEdition(u: Utilisateur) {
    setEditUser(u);
    setFormUser(u);
    setNouveauUser(false);
  }

  function ouvrirNouvel() {
    setNouveauUser(true);
    setEditUser(null);
    setFormUser({ role: 'lecteur', actif: true });
  }

  // ==========================================================================
  // GESTION DES ACCÈS
  // ==========================================================================
  function toggleAcces(role: string, href: string) {
    if (role === 'admin') return;
    setAccesConfig(prev => {
      const current = prev[role] ?? [];
      const updated = current.includes(href)
        ? current.filter(p => p !== href)
        : [...current, href];
      const maj = { ...prev, [role]: updated };
      setAccesModifie(true);
      return maj;
    });
  }

  function enregistrerAcces() {
    if (!confirm('Enregistrer les nouvelles permissions ?\n\nCette action prendra effet immédiatement pour tous les utilisateurs concernés à leur prochain rechargement de page.')) return;
    const ancien = getAccesParRole();
    const diff: any[] = [];
    Object.keys(accesConfig).forEach(role => {
      if (role === 'admin') return;
      const avant = new Set(ancien[role] ?? []);
      const apres = new Set(accesConfig[role] ?? []);
      const ajoutes = [...apres].filter(p => !avant.has(p));
      const retires = [...avant].filter(p => !apres.has(p));
      if (ajoutes.length || retires.length) {
        diff.push({ role, ajoutes, retires });
      }
    });
    setAccesParRole(accesConfig);
    if (diff.length > 0) {
      const entree = {
        date: new Date().toLocaleDateString('fr-FR'),
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        par: utilisateur?.id ?? 'INCONNU',
        parNom: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Inconnu',
        diff,
      };
      const nouveauHistorique = [entree, ...historiqueAcces].slice(0, 50);
      setHistoriqueAcces(nouveauHistorique);
      localStorage.setItem('easycfa_acces_historique', JSON.stringify(nouveauHistorique));
    }
    setAccesModifie(false);
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  function reinitialiserAcces() {
    if (!confirm('Réinitialiser les accès à leur valeur par défaut ?\n\nToutes les modifications seront perdues.')) return;
    resetAccesParRole();
    setAccesConfig(ACCES_PAR_ROLE);
    setAccesModifie(false);
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  function annulerAcces() {
    setAccesConfig(getAccesParRole());
    setAccesModifie(false);
  }

  // ==========================================================================
  // NOUVEAU : GESTION IDENTITÉ CFA
  // ==========================================================================
  function sauvegarderCfa() {
    // Calcul auto du SIREN
    const updated = { ...cfaForm, siren: deduireSiren(cfaForm.siret) };
    setCfaIdentite(updated);
    setCfaForm(updated);
    setEditCfa(false);
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  function annulerCfa() {
    setCfaForm(getCfaIdentite());
    setEditCfa(false);
  }

  function reinitialiserCfa() {
    if (!confirm('Réinitialiser l\'identité du CFA aux valeurs par défaut (PAM OI Formation) ?')) return;
    resetCfaIdentite();
    setCfaForm(CFA_IDENTITE_DEFAUT);
    setEditCfa(false);
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  // ==========================================================================
  // NOUVEAU : GESTION RÉFÉRENT HANDICAP
  // ==========================================================================
  function sauvegarderReferent() {
    setReferentHandicap(referentForm);
    setEditReferent(false);
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  function annulerReferent() {
    setReferentForm(getReferentHandicap());
    setEditReferent(false);
  }

  function reinitialiserReferent() {
    if (!confirm('Réinitialiser le référent handicap (Betty REBOUL par défaut) ?')) return;
    resetReferentHandicap();
    setReferentForm(REFERENT_HANDICAP_DEFAUT);
    setEditReferent(false);
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  // ==========================================================================
  // GESTION DES JUSTIFICATIFS LÉGAUX
  // ==========================================================================
  async function importerJustificatif(key: string, fichier: File) {
    if (fichier.size > TAILLE_MAX_FICHIER) {
      alert(`⚠️ Fichier trop volumineux : ${formaterTaille(fichier.size)}\n\nTaille maximale : ${formaterTaille(TAILLE_MAX_FICHIER)}`);
      return;
    }
    try {
      setImportEnCours(key);
      const dataBase64 = await lireFichierEnBase64(fichier);
      const ancienne = justificatifs[key];
      const doc = {
        nom: fichier.name,
        mimeType: fichier.type || 'application/pdf',
        taille: fichier.size,
        dataBase64,
        date: new Date().toLocaleDateString('fr-FR'),
        dateImport: new Date().toISOString(),
        importePar: utilisateur?.id ?? null,
        dateExpiration: ancienne?.dateExpiration ?? null,
      };
      sauvegarderJustificatifs({ ...justificatifs, [key]: doc });
    } catch (err) {
      console.error(err);
    } finally {
      setImportEnCours(null);
    }
  }

  function supprimerJustificatif(key: string, label: string) {
    if (!confirm(`Supprimer le justificatif "${label}" ?`)) return;
    const maj = { ...justificatifs };
    delete maj[key];
    sauvegarderJustificatifs(maj);
  }

  function ouvrirEditionDate(key: string) {
    setEditDateJustif(key);
    setTempDate(justificatifs[key]?.dateExpiration ?? '');
  }

  function sauvegarderDate(key: string) {
    if (tempDate && !/^\d{2}\/\d{2}\/\d{4}$/.test(tempDate)) {
      alert('Format de date invalide. Utilise JJ/MM/AAAA');
      return;
    }
    const doc = justificatifs[key];
    if (!doc) return;
    sauvegarderJustificatifs({ ...justificatifs, [key]: { ...doc, dateExpiration: tempDate || null } });
    setEditDateJustif(null);
    setTempDate('');
  }

  // ==========================================================================
  // FORMULAIRE UTILISATEUR
  // ==========================================================================
  const FormUser = () => (
    <div style={{ backgroundColor: COLORS.background, borderRadius: '10px', padding: '20px', marginBottom: '20px', border: `2px solid ${COLORS.primary}` }}>
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
        {editUser ? '✏️ Modifier ' + editUser.prenom + ' ' + editUser.nom : '+ Nouvel utilisateur'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
        {[
          { label: 'Nom', champ: 'nom', placeholder: 'NOM' },
          { label: 'Prénom', champ: 'prenom', placeholder: 'Prénom' },
          { label: 'Email', champ: 'email', placeholder: 'email@pamoi.re' },
          { label: 'Téléphone', champ: 'telephone', placeholder: '06 93 XX XX XX' },
          { label: 'Fonction', champ: 'fonction', placeholder: 'Ex: Formateur, Comptable...' },
        ].map(f => (
          <div key={f.champ}>
            <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>{f.label}</label>
            <input style={inputStyle} value={(formUser as any)[f.champ] ?? ''} placeholder={f.placeholder} onChange={e => setFormUser(p => ({ ...p, [f.champ]: e.target.value }))} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Rôle</label>
          <select style={inputStyle} value={formUser.role ?? 'lecteur'} onChange={e => setFormUser(p => ({ ...p, role: e.target.value as any }))}>
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
            Mot de passe {!editUser && '(généré automatiquement si vide)'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={afficherMdp === 'form' ? 'text' : 'password'}
              style={inputStyle}
              value={formUser.motDePasse ?? ''}
              placeholder={editUser ? 'Laisser vide pour ne pas modifier' : genererID(formUser.prenom ?? '', formUser.nom ?? '') + '@2024!'}
              onChange={e => setFormUser(p => ({ ...p, motDePasse: e.target.value }))}
            />
            <button onClick={() => setAfficherMdp(afficherMdp === 'form' ? null : 'form')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
              {afficherMdp === 'form' ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>ID généré automatiquement</label>
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', fontWeight: '700', color: COLORS.primary }}>
            {formUser.prenom && formUser.nom ? genererID(formUser.prenom, formUser.nom) : '—'}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Signature email</label>
        <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={formUser.signatureEmail ?? ''} onChange={e => setFormUser(p => ({ ...p, signatureEmail: e.target.value }))} placeholder="Prénom NOM&#10;Fonction — PAM OI Formation&#10;Téléphone&#10;email@pamoi.re" />
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={() => { setEditUser(null); setNouveauUser(false); setFormUser({}); }} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
        <button onClick={sauvegarderUser} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          ✅ {editUser ? 'Modifier' : 'Créer le compte'}
        </button>
      </div>
    </div>
  );

  // Helper pour champ saisie CFA
  const ChampCfa = ({ label, champ, type = 'text' }: { label: string; champ: keyof CfaIdentite; type?: string }) => (
    <div>
      <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>{label}</label>
      <input
        type={type}
        style={inputStyle}
        value={cfaForm[champ] as string}
        onChange={e => setCfaForm(p => ({ ...p, [champ]: e.target.value }))}
      />
    </div>
  );

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Gestion des utilisateurs et configuration EasyCFA" />

      {sauvegarde && (
        <div style={{ padding: '12px 16px', backgroundColor: '#e6f4f1', border: '2px solid #006B68', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          ✅ Modifications enregistrées
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'profil', label: '👤 Mon profil' },
          { id: 'utilisateurs', label: '👥 Utilisateurs', adminOnly: true },
          { id: 'acces', label: '🔐 Accès', adminOnly: true },
          { id: 'cfa', label: '🏫 Paramètres CFA', adminOnly: true },
        ].map(o => (
          (!o.adminOnly || isAdmin) && (
            <button key={o.id} onClick={() => setOnglet(o.id as any)} style={{ backgroundColor: onglet === o.id ? COLORS.primary : 'white', color: onglet === o.id ? 'white' : COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              {o.label}
            </button>
          )
        ))}
      </div>

      {/* ===== MON PROFIL ===== */}
      {onglet === 'profil' && utilisateur && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Informations personnelles</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '50%', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700' }}>
                {utilisateur.avatar}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>{utilisateur.prenom} {utilisateur.nom}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{utilisateur.fonction}</div>
                <span style={{ backgroundColor: ROLES.find(r => r.id === utilisateur.role)?.couleur ?? '#888', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'inline-block' }}>
                  {ROLES.find(r => r.id === utilisateur.role)?.label}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Prénom', champ: 'prenom' },
                { label: 'Nom', champ: 'nom' },
                { label: 'Email', champ: 'email' },
                { label: 'Téléphone', champ: 'telephone' },
                { label: 'Fonction', champ: 'fonction' },
              ].map(f => (
                <div key={f.champ}>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input style={inputStyle} value={(utilisateur as any)[f.champ] ?? ''} onChange={e => mettreAJour({ [f.champ]: e.target.value })} />
                </div>
              ))}
              <button onClick={() => sauvegarderProfil(utilisateur)} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>
                ✅ Enregistrer mon profil
              </button>
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Signature email</h2>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
              Utilisée automatiquement dans tous les emails générés par EasyCFA
            </div>
            <textarea
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', marginBottom: '12px' }}
              value={utilisateur.signatureEmail}
              onChange={e => mettreAJour({ signatureEmail: e.target.value })}
            />
            <div style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#555', whiteSpace: 'pre-line' }}>
              <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '6px' }}>Aperçu</div>
              {utilisateur.signatureEmail}
            </div>
            <button onClick={() => sauvegarderProfil(utilisateur)} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '12px', width: '100%' }}>
              ✅ Enregistrer la signature
            </button>
          </Card>
        </div>
      )}

      {/* ===== UTILISATEURS ===== */}
      {onglet === 'utilisateurs' && isAdmin && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>Comptes utilisateurs ({utilisateurs.length})</h2>
            <button onClick={ouvrirNouvel} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              + Nouvel utilisateur
            </button>
          </div>
          {(nouveauUser || editUser) && <FormUser />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {utilisateurs.map(u => {
              const role = ROLES.find(r => r.id === u.role);
              return (
                <Card key={u.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ backgroundColor: u.actif ? COLORS.primary : '#ccc', color: 'white', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
                        {u.avatar}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary }}>{u.prenom} {u.nom}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{u.fonction} — {u.email}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <span style={{ backgroundColor: role?.couleur ?? '#888', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>{role?.label}</span>
                          <span style={{ backgroundColor: '#f0f0f0', color: '#555', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>ID : {u.id}</span>
                          {!u.actif && <span style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>Inactif</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => setAfficherMdp(afficherMdp === u.id ? null : u.id)} style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                        {afficherMdp === u.id ? '🙈 Masquer MDP' : '👁️ Voir MDP'}
                      </button>
                      {afficherMdp === u.id && (
                        <span style={{ backgroundColor: '#fef6e4', color: '#7a5c00', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace' }}>
                          {u.motDePasse}
                        </span>
                      )}
                      <button onClick={() => ouvrirEdition(u)} style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✏️ Modifier</button>
                      <button onClick={() => setUtilisateurs(prev => prev.map(uu => uu.id === u.id ? { ...uu, actif: !uu.actif } : uu))} style={{ backgroundColor: u.actif ? '#fde8e8' : '#e6f4f1', color: u.actif ? '#e53e3e' : COLORS.primary, border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        {u.actif ? '🚫 Désactiver' : '✅ Activer'}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ACCÈS (matrice) ===== */}
      {onglet === 'acces' && isAdmin && (
        <div>
          <Card style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>🔐 Matrice des accès</h2>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Coche/décoche pour ajuster les droits par rôle. L'administrateur conserve toujours tous les accès.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={reinitialiserAcces} style={{ backgroundColor: 'white', color: '#888', border: '1.5px solid #ccc', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>🔄 Réinitialiser</button>
                {accesModifie && <button onClick={annulerAcces} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>}
                <button onClick={enregistrerAcces} disabled={!accesModifie} style={{ backgroundColor: accesModifie ? COLORS.primary : '#ccc', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: accesModifie ? 'pointer' : 'not-allowed' }}>💾 Enregistrer</button>
              </div>
            </div>
            {accesModifie && <div style={{ backgroundColor: '#fef6e4', border: '1.5px solid #C8A23A', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#7a5c00', marginBottom: '14px' }}>⚠️ Modifications non enregistrées</div>}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px', padding: '8px 12px', backgroundColor: COLORS.background, borderRadius: '8px' }}>
              {ROLES_GERABLES.map(r => (
                <span key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#555' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: r.couleur, borderRadius: '50%' }}></span>
                  <span style={{ fontWeight: '600' }}>{r.label}</span>
                  {r.verrouille && <span style={{ fontSize: '10px' }}>🔒</span>}
                </span>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.primary}` }}>
                    <th style={{ textAlign: 'left', padding: '10px 8px', color: COLORS.primary, fontWeight: '700' }}>Page</th>
                    {ROLES_GERABLES.map(r => (
                      <th key={r.id} style={{ textAlign: 'center', padding: '10px 8px', color: r.couleur, fontWeight: '700', minWidth: '80px' }}>
                        {r.label}
                        {r.verrouille && <span style={{ fontSize: '10px', display: 'block', color: '#888', fontWeight: '400' }}>🔒 verrouillé</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTIONS_ACCES.map(section => (
                    <>
                      <tr key={'sec-' + section.titre} style={{ backgroundColor: '#f9f9f9' }}>
                        <td colSpan={ROLES_GERABLES.length + 1} style={{ padding: '8px 12px', fontSize: '10px', fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          {section.titre}
                        </td>
                      </tr>
                      {section.pages.map(page => (
                        <tr key={page.href} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px 12px 8px 24px', color: '#444' }}>
                            <span style={{ marginRight: '8px' }}>{page.icon}</span>
                            {page.label}
                            <span style={{ fontSize: '10px', color: '#aaa', marginLeft: '6px' }}>{page.href}</span>
                          </td>
                          {ROLES_GERABLES.map(r => {
                            const coche = r.verrouille ? true : (accesConfig[r.id] ?? []).includes(page.href);
                            return (
                              <td key={r.id} style={{ textAlign: 'center', padding: '8px' }}>
                                <input type="checkbox" checked={coche} disabled={r.verrouille} onChange={() => toggleAcces(r.id, page.href)} style={{ width: '18px', height: '18px', cursor: r.verrouille ? 'not-allowed' : 'pointer', accentColor: r.couleur }} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {historiqueAcces.length > 0 && (
            <Card>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>📜 Historique des modifications ({historiqueAcces.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {historiqueAcces.map((entry, idx) => (
                  <div key={idx} style={{ borderLeft: `3px solid ${COLORS.primary}`, paddingLeft: '10px', paddingTop: '4px', paddingBottom: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: COLORS.primary }}>{entry.date} à {entry.heure} — par {entry.parNom}</div>
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {entry.diff.map((d: any, i: number) => (
                        <div key={i} style={{ fontSize: '11px', color: '#555' }}>
                          <strong>{ROLES_GERABLES.find(r => r.id === d.role)?.label ?? d.role}</strong> :
                          {d.ajoutes.length > 0 && <span style={{ color: '#16a34a', marginLeft: '4px' }}>+ {d.ajoutes.join(', ')}</span>}
                          {d.retires.length > 0 && <span style={{ color: '#e53e3e', marginLeft: '4px' }}>− {d.retires.join(', ')}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ===== PARAMÈTRES CFA + RÉFÉRENT HANDICAP + JUSTIFICATIFS ===== */}
      {onglet === 'cfa' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* === BLOC IDENTITÉ CFA === */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>🏫 Identité du CFA</h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                {!editCfa ? (
                  <>
                    <button onClick={reinitialiserCfa} style={{ backgroundColor: 'white', color: '#888', border: '1.5px solid #ccc', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>🔄 Réinitialiser</button>
                    <button onClick={() => setEditCfa(true)} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✏️ Modifier</button>
                  </>
                ) : (
                  <>
                    <button onClick={annulerCfa} style={{ backgroundColor: 'white', color: '#888', border: '1.5px solid #ccc', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                    <button onClick={sauvegarderCfa} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>💾 Enregistrer</button>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '12px', color: '#555' }}>
              💡 Ces informations sont utilisées dans les <strong>déclarations France Compétences</strong> et <strong>SIFA</strong>. Toute modification ici se répercute automatiquement dans les exports.
            </div>

            {editCfa ? (
              // === MODE ÉDITION ===
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Identification juridique */}
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.8px' }}>Identification juridique</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <ChampCfa label="SIRET (14 chiffres)" champ="siret" />
                    <div>
                      <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>SIREN (auto-calculé)</label>
                      <div style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', fontWeight: '700', color: '#555' }}>
                        {deduireSiren(cfaForm.siret) || '—'}
                      </div>
                    </div>
                    <ChampCfa label="NDA (11 chiffres)" champ="nda" />
                    <ChampCfa label="Code UAI" champ="uai" />
                    <ChampCfa label="Numéro Qualiopi" champ="qualiopi" />
                    <ChampCfa label="Raison sociale" champ="raisonSociale" />
                    <ChampCfa label="Dénomination usuelle" champ="denominationUsuelle" />
                    <div>
                      <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Forme juridique</label>
                      <select style={inputStyle} value={cfaForm.formeJuridique} onChange={e => setCfaForm(p => ({ ...p, formeJuridique: e.target.value }))}>
                        {FORMES_JURIDIQUES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Type CFA (code SIFA)</label>
                      <select style={inputStyle} value={cfaForm.typeCfa} onChange={e => setCfaForm(p => ({ ...p, typeCfa: e.target.value }))}>
                        {TYPE_CFA_OPTIONS.map(t => <option key={t.code} value={t.code}>{t.code} — {t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>CFA d'entreprise ?</label>
                      <select style={inputStyle} value={cfaForm.cfaEntreprise} onChange={e => setCfaForm(p => ({ ...p, cfaEntreprise: e.target.value as 'Oui' | 'Non' }))}>
                        <option value="Non">Non</option>
                        <option value="Oui">Oui</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.8px' }}>Adresse du siège social</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <ChampCfa label="Adresse 1" champ="adresse1" />
                    <ChampCfa label="Adresse 2 (complément)" champ="adresse2" />
                    <div></div>
                    <ChampCfa label="Code postal" champ="codePostal" />
                    <ChampCfa label="Ville" champ="ville" />
                    <div>
                      <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Région</label>
                      <select style={inputStyle} value={cfaForm.region} onChange={e => setCfaForm(p => ({ ...p, region: e.target.value }))}>
                        {REGIONS_FRANCE_COMPETENCES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Représentant légal */}
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.8px' }}>Représentant légal</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <ChampCfa label="Nom" champ="representantLegalNom" />
                    <ChampCfa label="Prénom" champ="representantLegalPrenom" />
                    <ChampCfa label="Fonction" champ="representantLegalFonction" />
                    <ChampCfa label="Email" champ="representantLegalEmail" type="email" />
                    <ChampCfa label="Téléphone" champ="representantLegalTelephone" />
                  </div>
                </div>
              </div>
            ) : (
              // === MODE LECTURE ===
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'SIRET', value: cfaForm.siret },
                  { label: 'SIREN', value: cfaForm.siren || deduireSiren(cfaForm.siret) },
                  { label: 'NDA', value: cfaForm.nda },
                  { label: 'UAI', value: cfaForm.uai },
                  { label: 'N° Qualiopi', value: cfaForm.qualiopi },
                  { label: 'Forme juridique', value: cfaForm.formeJuridique },
                  { label: 'Raison sociale', value: cfaForm.raisonSociale },
                  { label: 'Dénomination usuelle', value: cfaForm.denominationUsuelle },
                  { label: 'Type CFA (SIFA)', value: TYPE_CFA_OPTIONS.find(t => t.code === cfaForm.typeCfa)?.label ?? cfaForm.typeCfa },
                  { label: 'Adresse', value: `${cfaForm.adresse1}${cfaForm.adresse2 ? ', ' + cfaForm.adresse2 : ''}` },
                  { label: 'Code postal — Ville', value: `${cfaForm.codePostal} ${cfaForm.ville}` },
                  { label: 'Région', value: cfaForm.region },
                  { label: 'Représentant légal', value: `${cfaForm.representantLegalNom} ${cfaForm.representantLegalPrenom}` },
                  { label: 'Fonction', value: cfaForm.representantLegalFonction },
                  { label: 'Email représentant', value: cfaForm.representantLegalEmail },
                  { label: 'Téléphone représentant', value: cfaForm.representantLegalTelephone },
                  { label: 'CFA d\'entreprise', value: cfaForm.cfaEntreprise },
                ].map(info => (
                  <div key={info.label} style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>{info.label}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: info.value ? COLORS.text : '#ccc' }}>{info.value || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* === BLOC RÉFÉRENT HANDICAP === */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>♿ Référent handicap</h2>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Obligatoire pour la déclaration SIFA</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {!editReferent ? (
                  <>
                    <button onClick={reinitialiserReferent} style={{ backgroundColor: 'white', color: '#888', border: '1.5px solid #ccc', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>🔄 Réinitialiser</button>
                    <button onClick={() => setEditReferent(true)} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✏️ Modifier</button>
                  </>
                ) : (
                  <>
                    <button onClick={annulerReferent} style={{ backgroundColor: 'white', color: '#888', border: '1.5px solid #ccc', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                    <button onClick={sauvegarderReferent} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>💾 Enregistrer</button>
                  </>
                )}
              </div>
            </div>

            {editReferent ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Nom</label>
                  <input style={inputStyle} value={referentForm.nom} onChange={e => setReferentForm(p => ({ ...p, nom: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Prénom</label>
                  <input style={inputStyle} value={referentForm.prenom} onChange={e => setReferentForm(p => ({ ...p, prenom: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input type="email" style={inputStyle} value={referentForm.email} onChange={e => setReferentForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Téléphone</label>
                  <input style={inputStyle} value={referentForm.telephone} onChange={e => setReferentForm(p => ({ ...p, telephone: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Nom', value: referentForm.nom },
                  { label: 'Prénom', value: referentForm.prenom },
                  { label: 'Email', value: referentForm.email },
                  { label: 'Téléphone', value: referentForm.telephone },
                ].map(info => (
                  <div key={info.label} style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>{info.label}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: info.value ? COLORS.text : '#ccc' }}>{info.value || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* === BLOC JUSTIFICATIFS LÉGAUX === */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>📂 Justificatifs légaux du CFA</h2>
              <div style={{ fontSize: '11px', color: '#888' }}>
                {Object.keys(justificatifs).length}/{JUSTIFICATIFS_LEGAUX.length} importés · Max {formaterTaille(TAILLE_MAX_FICHIER)}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '14px' }}>
              Documents légaux à jour requis pour la conformité Qualiopi et les démarches administratives.
            </div>

            {(() => {
              const expires = JUSTIFICATIFS_LEGAUX.filter(j => {
                const doc = justificatifs[j.key];
                return doc?.dateExpiration && statutJustificatif(doc.dateExpiration, j.alerteJours) === 'expired';
              });
              const bientotExpires = JUSTIFICATIFS_LEGAUX.filter(j => {
                const doc = justificatifs[j.key];
                return doc?.dateExpiration && statutJustificatif(doc.dateExpiration, j.alerteJours) === 'warning';
              });
              if (expires.length === 0 && bientotExpires.length === 0) return null;
              return (
                <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {expires.length > 0 && (
                    <div style={{ backgroundColor: '#fde8e8', border: '1.5px solid #e53e3e', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#7a1f1f' }}>
                      🔴 <strong>{expires.length} document(s) expiré(s)</strong> : {expires.map(e => e.label).join(', ')}
                    </div>
                  )}
                  {bientotExpires.length > 0 && (
                    <div style={{ backgroundColor: '#fef6e4', border: '1.5px solid #C8A23A', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#7a5c00' }}>
                      🟡 <strong>{bientotExpires.length} document(s) à renouveler bientôt</strong> : {bientotExpires.map(e => e.label).join(', ')}
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {JUSTIFICATIFS_LEGAUX.map(jus => {
                const doc = justificatifs[jus.key];
                const enImport = importEnCours === jus.key;
                const statut = doc?.dateExpiration ? statutJustificatif(doc.dateExpiration, jus.alerteJours) : 'none';
                const jours = doc?.dateExpiration ? diffJours(doc.dateExpiration) : null;

                let bordColor = '#e0e0e0';
                let bgColor = 'white';
                if (doc) {
                  if (statut === 'expired') { bordColor = '#e53e3e'; bgColor = '#fde8e8'; }
                  else if (statut === 'warning') { bordColor = '#C8A23A'; bgColor = '#fef6e4'; }
                  else { bordColor = COLORS.primary; bgColor = '#e6f4f1'; }
                }

                return (
                  <div key={jus.key} style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: bgColor, border: `1px solid ${bordColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: doc ? COLORS.primary : '#333', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {doc ? '✅' : '📎'} {jus.label}
                        {statut === 'expired' && <span style={{ backgroundColor: '#e53e3e', color: 'white', padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>EXPIRÉ</span>}
                        {statut === 'warning' && jours !== null && <span style={{ backgroundColor: '#C8A23A', color: 'white', padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>J-{jours}</span>}
                        {statut === 'ok' && jours !== null && <span style={{ backgroundColor: '#16a34a', color: 'white', padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>J-{jours}</span>}
                      </div>
                      <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                        {doc ? `${doc.nom} — ${formaterTaille(doc.taille ?? 0)} — importé le ${doc.date}` : `${jus.desc} · Validité : ${jus.dureeRecommandee}`}
                      </div>

                      {doc && (
                        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {editDateJustif === jus.key ? (
                            <>
                              <input type="text" value={tempDate} onChange={e => setTempDate(e.target.value)} placeholder="JJ/MM/AAAA" style={{ ...inputStyle, width: '120px', padding: '4px 8px', fontSize: '11px' }} autoFocus />
                              <button onClick={() => sauvegarderDate(jus.key)} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>✓</button>
                              <button onClick={() => { setEditDateJustif(null); setTempDate(''); }} style={{ backgroundColor: '#f0f0f0', color: '#888', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>✕</button>
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: '10px', color: '#888', fontWeight: '600' }}>Expire le : {doc.dateExpiration ?? '— non renseignée —'}</span>
                              <button onClick={() => ouvrirEditionDate(jus.key)} style={{ backgroundColor: 'transparent', color: COLORS.primary, border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>
                                ✏️ {doc.dateExpiration ? 'Modifier' : 'Ajouter'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {!doc ? (
                      <label style={{ backgroundColor: enImport ? '#888' : COLORS.primary, color: 'white', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', cursor: enImport ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                        {enImport ? '⏳ Import...' : '📎 Importer'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} disabled={enImport} onChange={ev => {
                          const f = ev.target.files?.[0];
                          if (f) importerJustificatif(jus.key, f);
                          ev.target.value = '';
                        }} />
                      </label>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button onClick={() => setPreviewDoc({ ...doc, _titre: jus.label })} title="Consulter" style={{ backgroundColor: 'white', border: `1px solid ${COLORS.primary}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '13px' }}>👁️</button>
                        <button onClick={() => telechargerFichier(doc)} title="Télécharger" style={{ backgroundColor: 'white', border: `1px solid ${COLORS.primary}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '13px' }}>⬇️</button>
                        <label title="Remplacer" style={{ backgroundColor: 'white', border: `1px solid ${COLORS.primary}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '13px' }}>
                          🔄
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                            const f = ev.target.files?.[0];
                            if (f) importerJustificatif(jus.key, f);
                            ev.target.value = '';
                          }} />
                        </label>
                        <button onClick={() => supprimerJustificatif(jus.key, jus.label)} title="Supprimer" style={{ backgroundColor: 'white', border: '1px solid #e53e3e', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '13px', color: '#e53e3e' }}>🗑️</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Modale preview */}
      {previewDoc && (
        <div onClick={() => setPreviewDoc(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', width: '90vw', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary }}>{previewDoc._titre}</div>
                <div style={{ fontSize: '11px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {previewDoc.nom} — {formaterTaille(previewDoc.taille ?? 0)} — importé le {previewDoc.date}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => telechargerFichier(previewDoc)} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>⬇️ Télécharger</button>
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
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Aperçu indisponible</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
