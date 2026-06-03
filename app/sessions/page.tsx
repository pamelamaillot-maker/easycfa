'use client';

import { useState, useEffect } from 'react';
import { APPRENANTS_REELS } from '../../data/mockApprenants_reels';
import { chargerApprentis } from '../../data/apprentisSupabase';
import { COLORS } from '../../lib/constants';
import { 
  chargerSessions as chargerSessionsSupabase,
  creerSession as creerSessionSupabase,
  modifierSession,
  supprimerSession as supprimerSessionSupabase,
} from '../../data/sessionsSupabase';
import Card from '../../components/Card';
import CardEvaluationsChaud from '../../components/CardEvaluationsChaud';
import CardEvaluationsFroid from '../../components/CardEvaluationsFroid';
import CardEvaluationsEntreprise from '../../components/CardEvaluationsEntreprise';

const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };
const btnPrimary: React.CSSProperties = { backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

// ── Config formations ────────────────────────────────────────────────────────
const FORMATIONS_CONFIG: Record<string, { jour: number; nbJours: number; totalHeures: number; couleur: string; label: string }> = {
  SC:   { jour: 3, nbJours: 58, totalHeures: 476, couleur: '#006B68', label: 'Secrétaire Comptable' },
  EC:   { jour: 1, nbJours: 61, totalHeures: 497, couleur: '#0891b2', label: 'Employé Commercial' },
  CV:   { jour: 1, nbJours: 61, totalHeures: 497, couleur: '#7c3aed', label: 'Conseiller de Vente' },
  AD:   { jour: 4, nbJours: 67, totalHeures: 539, couleur: '#C8A23A', label: 'Assistant de Direction' },
  CATL: { jour: 4, nbJours: 61, totalHeures: 497, couleur: '#ea580c', label: 'Chargé Accueil Touristique' },
  ARH:  { jour: 2, nbJours: 58, totalHeures: 476, couleur: '#16a34a', label: 'Assistant RH' },
  GCF:  { jour: 2, nbJours: 72, totalHeures: 574, couleur: '#dc2626', label: 'Gestionnaire Comptable et Fiscal' },
};

// Jours noms
const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Jours fériés La Réunion 2024-2027
const JOURS_FERIES = new Set([
  '01/01/2024','01/04/2024','01/05/2024','08/05/2024','09/05/2024','20/05/2024','14/07/2024','15/08/2024','01/11/2024','11/11/2024','25/12/2024','20/12/2024',
  '01/01/2025','18/04/2025','01/05/2025','08/05/2025','29/05/2025','09/06/2025','14/07/2025','15/08/2025','01/11/2025','11/11/2025','25/12/2025','20/12/2025',
  '01/01/2026','03/04/2026','01/05/2026','08/05/2026','14/05/2026','25/05/2026','14/07/2026','15/08/2026','01/11/2026','11/11/2026','25/12/2026','20/12/2026',
  '01/01/2027','26/03/2027','01/05/2027','08/05/2027','06/05/2027','17/05/2027','14/07/2027','15/08/2027','01/11/2027','11/11/2027','25/12/2027','20/12/2027',
]);

function estFermeture(date: Date): boolean {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return (m === 12 && d >= 18) || (m === 1 && d <= 4);
}

function estFerie(date: Date): boolean {
  return JOURS_FERIES.has(date.toLocaleDateString('fr-FR'));
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  return null;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR');
}

function genererPlanning(dateDebutStr: string, formation: string): { date: string; type: 'cours' | 'revision' | 'examen'; semaine: number }[] {
  const config = FORMATIONS_CONFIG[formation];
  if (!config) return [];
  const dateDebut = parseDate(dateDebutStr);
  if (!dateDebut) return [];

  const planning: { date: string; type: 'cours' | 'revision' | 'examen'; semaine: number }[] = [];
  let current = new Date(dateDebut);
  let nbCours = 0;
  let semaine = 1;
  let lastSemaine = -1;

  while (current.getDay() !== config.jour) {
    current.setDate(current.getDate() + 1);
  }

  let iterations = 0;
  while (nbCours < config.nbJours && iterations < 500) {
    iterations++;
    if (!estFerie(current) && !estFermeture(current)) {
      const semCourante = Math.floor((current.getTime() - dateDebut.getTime()) / (7 * 86400000));
      if (semCourante !== lastSemaine) { semaine++; lastSemaine = semCourante; }
      planning.push({ date: formatDate(current), type: 'cours', semaine });
      nbCours++;
    }
    current.setDate(current.getDate() + 7);
  }

  let joursRev = 0;
  while (joursRev < 5) {
    current.setDate(current.getDate() + 1);
    if (current.getDay() >= 1 && current.getDay() <= 5 && !estFerie(current) && !estFermeture(current)) {
      planning.push({ date: formatDate(current), type: 'revision', semaine: semaine + 1 });
      joursRev++;
    }
  }

  let joursEx = 0;
  while (joursEx < 5) {
    current.setDate(current.getDate() + 1);
    if (current.getDay() >= 1 && current.getDay() <= 5 && !estFerie(current) && !estFermeture(current)) {
      planning.push({ date: formatDate(current), type: 'examen', semaine: semaine + 2 });
      joursEx++;
    }
  }

  return planning;
}

type ModuleSession = {
  id: string;
  nom: string;
  ccp: string;
  formateurId: string;
  formateurNom: string;
  dateDebut: string;
  dateFin: string;
  heures: number;
};

type Session = {
  id: string;
  numero: string;
  formation: string;
  annee: string;
  dateDebut: string;
  dateFin: string;
  apprenantIds: string[];
  modules: ModuleSession[];
  planning: { date: string; type: 'cours' | 'revision' | 'examen'; semaine: number; formateurId?: string; moduleId?: string }[];
  statut: 'À venir' | 'En cours' | 'Terminée' | 'Archivée';
  salle: string;
  notes: string;
};

// ============================================================================
// SYNCHRONISATION BIDIRECTIONNELLE Apprenant ↔ Session
// ============================================================================
// Quand on assigne un apprenant à une session, on met aussi à jour
// localStorage('apprenant_' + apprenantId) avec sessionId = session.id
// Et vice-versa : si on retire un apprenant, on enlève le sessionId
// ============================================================================
function syncApprenantSessionId(apprenantId: string, sessionId: string | undefined) {
  try {
    const key = 'apprenant_' + apprenantId;
    const saved = localStorage.getItem(key);
    const apprenantBase = APPRENANTS_REELS.find(a => a.id === apprenantId);
    const baseObj: any = saved ? JSON.parse(saved) : (apprenantBase ? { ...apprenantBase } : { id: apprenantId });
    if (sessionId) {
      baseObj.sessionId = sessionId;
    } else {
      delete baseObj.sessionId;
    }
    localStorage.setItem(key, JSON.stringify(baseObj));
  } catch (err) {
    console.error('Erreur sync apprenant:', err);
  }
}

// Récupère le sessionId courant d'un apprenant (depuis localStorage si existe, sinon depuis APPRENANTS_REELS)
function getApprenantSessionId(apprenantId: string): string | undefined {
  try {
    const saved = localStorage.getItem('apprenant_' + apprenantId);
    if (saved) {
      const obj = JSON.parse(saved);
      return obj.sessionId;
    }
  } catch {}
  const base = APPRENANTS_REELS.find(a => a.id === apprenantId) as any;
  return base?.sessionId;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectionne, setSelectionne] = useState<Session | null>(null);
  const [modale, setModale] = useState(false);
  const [onglet, setOnglet] = useState<'planning' | 'apprenants' | 'modules' | 'eval_chaud' | 'eval_froid' | 'eval_entreprise'>('planning');
  const [filtreFormation, setFiltreFormation] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [form, setForm] = useState<Partial<Session>>({ formation: 'SC', annee: '2026', statut: 'À venir', apprenantIds: [], modules: [] });
  const [formateurs, setFormateurs] = useState<any[]>([]);
  const [apprenants, setApprenants] = useState<any[]>([]);
  const [vuePlanning, setVuePlanning] = useState<'liste' | 'mois'>('liste');
  const [refreshKey, setRefreshKey] = useState(0); // pour rafraîchir l'affichage des apprenants
  const [modeEditionPlanning, setModeEditionPlanning] = useState(false);
  const [planningBrouillon, setPlanningBrouillon] = useState<any[]>([]);
  const [sauvegardePlanning, setSauvegardePlanning] = useState(false);

  useEffect(() => {
    (async () => {
      // Sessions : Supabase d'abord
      try {
        const fromSupabase = await chargerSessionsSupabase();
        if (fromSupabase.length > 0) {
          console.log(`[Sessions] ${fromSupabase.length} sessions chargées depuis Supabase ✅`);
          setSessions(fromSupabase as any[]);
        } else {
          console.warn('[Sessions] Supabase vide, fallback localStorage');
          const saved = localStorage.getItem('easycfa_sessions_v2');
          if (saved) setSessions(JSON.parse(saved));
        }
      } catch (e) {
        console.error('[Sessions] Erreur Supabase, fallback localStorage', e);
        const saved = localStorage.getItem('easycfa_sessions_v2');
        if (saved) setSessions(JSON.parse(saved));
      }
      // Formateurs (pour les sélecteurs) : localStorage en attendant que la page soit elle aussi async
      try {
        const fSaved = localStorage.getItem('easycfa_formateurs');
        if (fSaved) setFormateurs(JSON.parse(fSaved));
      } catch {}
      // Apprenants (pour l'affectation aux sessions) : Supabase, table 'apprenants'
      try {
        const apprenantsSupabase = await chargerApprentis();
        console.log(`[Sessions] ${apprenantsSupabase.length} apprenants chargés depuis Supabase ✅`);
        setApprenants(apprenantsSupabase as any[]);
      } catch (e) {
        console.error('[Sessions] Erreur chargement apprenants Supabase', e);
      }
    })();
  }, []);

  function sauvegarder(liste: Session[]) {
    setSessions(liste);
    localStorage.setItem('easycfa_sessions_v2', JSON.stringify(liste));
  }

  const NUMEROS_INITIAUX: Record<string, number> = {
    'ARH': 4, 'CATL': 3, 'AD': 4, 'GCF': 4, 'SC': 4, 'EC': 0, 'CV': 0,
  };

  function genererNumero(formation: string, annee: string): string {
    const existantes = sessions.filter(s => s.formation === formation && s.annee === annee);
    const base = NUMEROS_INITIAUX[formation] ?? 0;
    const num = String(base + existantes.length + 1).padStart(3, '0');
    return `${formation}-${annee}-${num}`;
  }

  async function creerSession() {
    if (!form.formation || !form.dateDebut || !form.annee) return;
    const planning = genererPlanning(form.dateDebut, form.formation!);
    const dateFin = planning.length > 0 ? planning[planning.length - 1].date : '';
    const nouveau: Session = {
      id: Date.now().toString(),
      numero: genererNumero(form.formation!, form.annee!),
      formation: form.formation!,
      annee: form.annee!,
      dateDebut: form.dateDebut!,
      dateFin,
      apprenantIds: form.apprenantIds ?? [],
      modules: [],
      planning,
      statut: form.statut as any ?? 'À venir',
      salle: form.salle ?? 'Salle A',
      notes: form.notes ?? '',
    };
    // Supabase d'abord
    const res = await creerSessionSupabase(nouveau as any);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[Sessions] ${nouveau.id} créée dans Supabase ✅`);
    // localStorage + UI
    sauvegarder([...sessions, nouveau]);
    setModale(false);
    setForm({ formation: 'SC', annee: '2026', statut: 'À venir', apprenantIds: [], modules: [] });
    setSelectionne(nouveau);
  }

  async function mettreAJour(champ: string, valeur: any) {
    if (!selectionne) return;
    const updated = { ...selectionne, [champ]: valeur };
    // Supabase d'abord
    const res = await modifierSession(selectionne.id, { [champ]: valeur } as any);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[Sessions ${selectionne.id}] ${champ} mis à jour dans Supabase ✅`);
    // UI + localStorage
    setSelectionne(updated);
    sauvegarder(sessions.map(s => s.id === updated.id ? updated : s));
  }

  // === NOUVELLE FONCTION : basculer un apprenant (ajouter/retirer) avec sync ===
  function basculerApprenant(apprenantId: string) {
    if (!selectionne) return;
    const estRattache = selectionne.apprenantIds.includes(apprenantId);

    if (estRattache) {
      // Retirer : sessionId effacé sur l'apprenant
      const newIds = selectionne.apprenantIds.filter(id => id !== apprenantId);
      mettreAJour('apprenantIds', newIds);
      syncApprenantSessionId(apprenantId, undefined);
    } else {
      // Ajouter : il faut d'abord vérifier s'il est dans une AUTRE session
      const sessionPrecedenteId = getApprenantSessionId(apprenantId);
      if (sessionPrecedenteId && sessionPrecedenteId !== selectionne.id) {
        const sessionPrec = sessions.find(s => s.id === sessionPrecedenteId);
        if (sessionPrec) {
          if (!confirm(`Cet apprenant est déjà dans la session ${sessionPrec.numero}.\n\nLe déplacer vers la session ${selectionne.numero} ?`)) {
            return;
          }
          // Retirer de l'ancienne session
          const liste = sessions.map(s => {
            if (s.id === sessionPrecedenteId) {
              return { ...s, apprenantIds: s.apprenantIds.filter(id => id !== apprenantId) };
            }
            return s;
          });
          sauvegarder(liste);
        }
      }
      // Ajouter à la session courante
      const newIds = [...selectionne.apprenantIds, apprenantId];
      mettreAJour('apprenantIds', newIds);
      syncApprenantSessionId(apprenantId, selectionne.id);
    }
    setRefreshKey(k => k + 1);
  }

  async function supprimerSession(id: string) {
    if (!confirm('Supprimer cette session ?')) return;
    // Supabase d'abord
    const res = await supprimerSessionSupabase(id);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[Sessions ${id}] Supprimée de Supabase ✅`);
    // Nettoyer les sessionId des apprenants liés (localStorage en miroir)
    const sessionASupprimer = sessions.find(s => s.id === id);
    if (sessionASupprimer) {
      sessionASupprimer.apprenantIds.forEach(aid => syncApprenantSessionId(aid, undefined));
    }
    sauvegarder(sessions.filter(s => s.id !== id));
    if (selectionne?.id === id) setSelectionne(null);
  }

  // === Synchronisation initiale : si un apprenant a un sessionId mais n'est pas dans la liste apprenantIds, on le rajoute ===
  useEffect(() => {
    if (sessions.length === 0) return;
    let needSave = false;
    const updated = sessions.map(s => {
      const inApprenantList = APPRENANTS_REELS
        .filter(a => getApprenantSessionId(a.id) === s.id)
        .map(a => a.id);
      const merged = Array.from(new Set([...s.apprenantIds, ...inApprenantList]));
      if (merged.length !== s.apprenantIds.length) {
        needSave = true;
        return { ...s, apprenantIds: merged };
      }
      return s;
    });
    if (needSave) {
      sauvegarder(updated);
    }
  }, [sessions.length, refreshKey]);

  const sessionsFiltrees = sessions.filter(s => {
    const matchF = !filtreFormation || s.formation === filtreFormation;
    const matchS = filtreStatut === 'Tous' || s.statut === filtreStatut;
    return matchF && matchS;
  });

  const config = selectionne ? FORMATIONS_CONFIG[selectionne.formation] : null;
  const nbCours = selectionne?.planning.filter(p => p.type === 'cours').length ?? 0;
  const nbRevisions = selectionne?.planning.filter(p => p.type === 'revision').length ?? 0;
  const nbExamens = selectionne?.planning.filter(p => p.type === 'examen').length ?? 0;

  const statutStyles: Record<string, { bg: string; color: string }> = {
    'À venir':  { bg: '#fef6e4', color: '#C8A23A' },
    'En cours': { bg: '#e6f4f1', color: '#006B68' },
    'Terminée': { bg: '#dcfce7', color: '#16a34a' },
    'Archivée': { bg: '#f0f0f0', color: '#888' },
  };

  // === Apprenants pour cette formation (CA + P2S, non archivés) ===
  const apprenantsDispo = selectionne ? apprenants
    .filter((a: any) => !a.archive && a.formation === selectionne.formation && (a.statut === 'En cours' || a.statut === 'P2S'))
    .sort((a: any, b: any) => {
      // CA d'abord, P2S ensuite, puis tri par nom
      if (a.statut !== b.statut) return a.statut === 'En cours' ? -1 : 1;
      return a.nom.localeCompare(b.nom);
    }) : [];

  const nbInscrits = selectionne?.apprenantIds.length ?? 0;
  const totalCapacite = apprenantsDispo.length;

  function entrerEditionPlanning() {
    if (!selectionne) return;
    setPlanningBrouillon(JSON.parse(JSON.stringify(selectionne.planning || [])));
    setModeEditionPlanning(true);
  }

  function annulerEditionPlanning() {
    setPlanningBrouillon([]);
    setModeEditionPlanning(false);
  }

  async function sauvegarderPlanningEdit() {
    if (!selectionne) return;
    try {
      // Supabase d'abord (uniquement le champ planning)
      const res = await modifierSession(selectionne.id, { planning: planningBrouillon } as any);
      if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
      else console.log(`[Sessions ${selectionne.id}] Planning sauvegardé dans Supabase ✅`);
      // UI + localStorage en miroir
      const liste = sessions.map(s => s.id === selectionne.id ? { ...s, planning: planningBrouillon } : s);
      setSessions(liste);
      setSelectionne({ ...selectionne, planning: planningBrouillon });
      localStorage.setItem('easycfa_sessions_v2', JSON.stringify(liste));
      setModeEditionPlanning(false);
      setSauvegardePlanning(true);
      setTimeout(() => setSauvegardePlanning(false), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde planning:', err);
      alert('Erreur lors de la sauvegarde du planning.');
    }
  }

  function modifierEntreePlanning(index: number, champ: string, valeur: any) {
    setPlanningBrouillon(prev => prev.map((p, i) => i === index ? { ...p, [champ]: valeur } : p));
  }

  function ajouterEntreePlanning() {
    setPlanningBrouillon(prev => [...prev, { date: '', type: 'cours', semaine: prev.length + 1 }]);
  }

  function supprimerEntreePlanning(index: number) {
    setPlanningBrouillon(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#006B68', marginBottom: '4px' }}>📅 Sessions de formation</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>{sessions.filter(s => s.statut === 'En cours').length} en cours — {sessions.length} au total</p>
        </div>
        <button onClick={() => setModale(true)} style={btnPrimary}>+ Nouvelle session</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: sessions.length, color: '#006B68' },
          { label: 'En cours', value: sessions.filter(s => s.statut === 'En cours').length, color: '#0891b2' },
          { label: 'À venir', value: sessions.filter(s => s.statut === 'À venir').length, color: '#C8A23A' },
          { label: 'Terminées', value: sessions.filter(s => s.statut === 'Terminée').length, color: '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center', borderTop: '4px solid ' + s.color }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filtreFormation} onChange={e => setFiltreFormation(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
            <option value="">Toutes les formations</option>
            {Object.entries(FORMATIONS_CONFIG).map(([k, v]) => <option key={k} value={k}>{k} — {v.label}</option>)}
          </select>
          {['Tous', 'À venir', 'En cours', 'Terminée', 'Archivée'].map(s => (
            <button key={s} onClick={() => setFiltreStatut(s)} style={{ ...btnSecondary, backgroundColor: filtreStatut === s ? '#006B68' : 'white', color: filtreStatut === s ? 'white' : '#006B68', padding: '6px 14px', fontSize: '12px' }}>
              {s}
            </button>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: selectionne ? '340px 1fr' : '1fr', gap: '24px' }}>

        {/* Liste sessions */}
        <Card>
          {sessionsFiltrees.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
              Aucune session — cliquez sur "+ Nouvelle session"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sessionsFiltrees.map(s => {
                const cfg = FORMATIONS_CONFIG[s.formation];
                const st = statutStyles[s.statut] ?? { bg: '#f0f0f0', color: '#888' };
                const isOpen = selectionne?.id === s.id;
                return (
                  <div key={s.id} onClick={() => { setSelectionne(isOpen ? null : s); setOnglet('planning'); }} style={{ padding: '14px 16px', borderRadius: '10px', borderTop: '1.5px solid ' + (isOpen ? '#006B68' : '#e0e0e0'), borderRight: '1.5px solid ' + (isOpen ? '#006B68' : '#e0e0e0'), borderBottom: '1.5px solid ' + (isOpen ? '#006B68' : '#e0e0e0'), borderLeft: `4px solid ${cfg?.couleur ?? '#006B68'}`, backgroundColor: isOpen ? '#EAF4F3' : 'white', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: cfg?.couleur ?? '#006B68', textTransform: 'uppercase', marginBottom: '2px' }}>{s.numero}</div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#333' }}>{cfg?.label ?? s.formation}</div>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                          {JOURS[cfg?.jour ?? 1]} · {s.dateDebut} → {s.dateFin}
                        </div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                          👥 {s.apprenantIds.length} apprenant(s) · 📅 {s.planning.length} jours · ⏱ {cfg?.totalHeures}h
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ backgroundColor: st.bg, color: st.color, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>{s.statut}</span>
                        <button onClick={e => { e.stopPropagation(); supprimerSession(s.id); }} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Fiche session */}
        {selectionne && config && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* En-tête fiche */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: config.couleur, textTransform: 'uppercase', marginBottom: '4px' }}>{selectionne.numero}</div>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '4px' }}>{config.label}</h2>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {JOURS[config.jour]} · du {selectionne.dateDebut} au {selectionne.dateFin}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <select value={selectionne.statut} onChange={e => mettreAJour('statut', e.target.value)} style={{ ...inputStyle, width: 'auto', fontSize: '12px' }}>
                    {['À venir', 'En cours', 'Terminée', 'Archivée'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap' }}>Fin officielle :</label>
                    <input
                      style={{ ...inputStyle, width: '120px', fontSize: '12px', padding: '6px 8px' }}
                      value={selectionne.dateFin}
                      placeholder="JJ/MM/AAAA"
                      onChange={e => mettreAJour('dateFin', e.target.value)}
                    />
                  </div>
                  <button onClick={() => setSelectionne(null)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                </div>
              </div>

              {/* Stats session */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Jours cours', value: nbCours, color: config.couleur },
                  { label: 'Révisions', value: nbRevisions, color: '#7c3aed' },
                  { label: 'Examens', value: nbExamens, color: '#0891b2' },
                  { label: 'Total heures', value: config.totalHeures + 'h', color: '#16a34a' },
                ].map(s => (
                  <div key={s.label} style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Onglets */}
            <Card style={{ padding: 0 }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #EAF4F3' }}>
                {[
                  { id: 'planning', label: '📅 Planning' },
                  { id: 'apprenants', label: `👥 Apprenants (${selectionne.apprenantIds.length})` },
                  { id: 'modules', label: '📚 Modules/Formateurs' },
                  { id: 'eval_chaud', label: '🌡️ Évaluations à chaud' },
                  { id: 'eval_entreprise', label: '🏢 Évaluations entreprises' },
                ].map(o => (
                  <button key={o.id} onClick={() => setOnglet(o.id as any)} style={{ flex: 1, padding: '12px', fontSize: '12px', fontWeight: '600', border: 'none', borderBottom: onglet === o.id ? '3px solid #006B68' : '3px solid transparent', backgroundColor: 'white', color: onglet === o.id ? '#006B68' : '#888', cursor: 'pointer' }}>
                    {o.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '16px' }}>

                {/* PLANNING */}
                {onglet === 'planning' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        Planning généré automatiquement · Hors jours fériés et fermetures 18/12→04/01
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setVuePlanning('liste')} style={{ ...btnSecondary, padding: '4px 10px', fontSize: '11px', backgroundColor: vuePlanning === 'liste' ? '#006B68' : 'white', color: vuePlanning === 'liste' ? 'white' : '#006B68' }}>📋 Liste</button>
                        <button onClick={() => setVuePlanning('mois')} style={{ ...btnSecondary, padding: '4px 10px', fontSize: '11px', backgroundColor: vuePlanning === 'mois' ? '#006B68' : 'white', color: vuePlanning === 'mois' ? 'white' : '#006B68' }}>🗓 Mois</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Cours', color: config.couleur, bg: config.couleur + '20' },
                        { label: 'Révisions', color: '#7c3aed', bg: '#ede9fe' },
                        { label: 'Examens', color: '#0891b2', bg: '#e0f2fe' },
                      ].map(l => (
                        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '12px', height: '12px', backgroundColor: l.bg, border: `2px solid ${l.color}`, borderRadius: '3px' }} />
                          <span style={{ fontSize: '11px', color: '#555' }}>{l.label}</span>
                        </div>
                      ))}
                      </div>
                      {modeEditionPlanning ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={sauvegarderPlanningEdit} style={btnPrimary}>✅ Enregistrer</button>
                          <button onClick={annulerEditionPlanning} style={btnSecondary}>Annuler</button>
                        </div>
                      ) : (
                        <button onClick={entrerEditionPlanning} style={btnSecondary}>✏️ Modifier le planning</button>
                      )}
                    </div>

                    {vuePlanning === 'liste' ? (
                      <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(modeEditionPlanning ? planningBrouillon : selectionne.planning).map((p, i) => {
                          const typeColor = p.type === 'cours' ? config.couleur : p.type === 'revision' ? '#7c3aed' : '#0891b2';
                          const typeBg = p.type === 'cours' ? config.couleur + '15' : p.type === 'revision' ? '#ede9fe' : '#e0f2fe';
                          const typeLabel = p.type === 'cours' ? '📖 Cours' : p.type === 'revision' ? '📝 Révisions' : '🎓 Examen';
                          if (modeEditionPlanning) {
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', backgroundColor: typeBg, border: `1px solid ${typeColor}30`, flexWrap: 'wrap' }}>
                                <input type="text" placeholder="JJ/MM/AAAA" value={p.date} onChange={ev => modifierEntreePlanning(i, 'date', ev.target.value)} style={{ fontSize: '11px', fontWeight: '700', color: typeColor, width: '90px', flexShrink: 0, border: `1px solid ${typeColor}40`, borderRadius: '4px', padding: '3px 6px' }} />
                                <select value={p.type} onChange={ev => modifierEntreePlanning(i, 'type', ev.target.value)} style={{ fontSize: '11px', fontWeight: '600', color: typeColor, width: '110px', flexShrink: 0, border: `1px solid ${typeColor}40`, borderRadius: '4px', padding: '3px 6px', backgroundColor: 'white' }}>
                                  <option value="cours">📖 Cours</option>
                                  <option value="revision">📝 Révisions</option>
                                  <option value="examen">🎓 Examen</option>
                                </select>
                                <select value={p.formateurId || ''} onChange={ev => {
                                  const f = formateurs.find(fo => fo.id === ev.target.value);
                                  modifierEntreePlanning(i, 'formateurId', ev.target.value);
                                  modifierEntreePlanning(i, 'formateurNom', f ? `${f.prenom} ${f.nom}` : '');
                                }} style={{ fontSize: '11px', color: '#555', width: '160px', flexShrink: 0, border: `1px solid ${typeColor}40`, borderRadius: '4px', padding: '3px 6px', backgroundColor: 'white' }}>
                                  <option value="">— Formateur —</option>
                                  {formateurs.map(f => <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>)}
                                </select>
                                <input type="text" placeholder="Module / Thème" value={p.module || ''} onChange={ev => modifierEntreePlanning(i, 'module', ev.target.value)} style={{ fontSize: '11px', color: '#555', flex: 1, minWidth: '120px', border: `1px solid ${typeColor}40`, borderRadius: '4px', padding: '3px 6px' }} />
                                <input type="number" min="1" value={p.semaine} onChange={ev => modifierEntreePlanning(i, 'semaine', parseInt(ev.target.value) || 0)} style={{ fontSize: '11px', color: '#555', width: '55px', flexShrink: 0, border: `1px solid ${typeColor}40`, borderRadius: '4px', padding: '3px 6px' }} placeholder="Sem." />
                                <button onClick={() => supprimerEntreePlanning(i)} style={{ marginLeft: 'auto', backgroundColor: '#fee', color: '#c53030', border: '1px solid #fcc', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>🗑️</button>
                              </div>
                            );
                          }
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', borderRadius: '6px', backgroundColor: typeBg, border: `1px solid ${typeColor}30`, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '10px', fontWeight: '700', color: typeColor, width: '80px', flexShrink: 0 }}>{p.date}</span>
                              <span style={{ fontSize: '10px', color: typeColor, fontWeight: '600', width: '90px', flexShrink: 0 }}>{typeLabel}</span>
                              {p.formateurNom && <span style={{ fontSize: '10px', color: '#555', fontWeight: '600' }}>👨‍🏫 {p.formateurNom}</span>}
                              {p.module && <span style={{ fontSize: '10px', color: '#555', fontStyle: 'italic' }}>📚 {p.module}</span>}
                              <span style={{ fontSize: '10px', color: '#888', marginLeft: 'auto' }}>7h · Sem. {p.semaine}</span>
                            </div>
                          );
                        })}
                        {modeEditionPlanning && (
                          <button onClick={ajouterEntreePlanning} style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#e6f4f1', color: '#006B68', border: '1.5px dashed #006B68', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Ajouter une date</button>
                        )}
                      </div>
                    ) : (
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {(() => {
                          const parMois: Record<string, typeof selectionne.planning> = {};
                          selectionne.planning.forEach(p => {
                            const parts = p.date.split('/');
                            const cle = `${parts[2]}-${parts[1]}`;
                            if (!parMois[cle]) parMois[cle] = [];
                            parMois[cle].push(p);
                          });
                          return Object.entries(parMois).sort().map(([mois, jours]) => {
                            const [an, m] = mois.split('-');
                            const nomMois = new Date(parseInt(an), parseInt(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                            const hMois = jours.length * 7;
                            return (
                              <div key={mois} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#EAF4F3', padding: '6px 10px', borderRadius: '6px', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#006B68', textTransform: 'capitalize' }}>{nomMois}</span>
                                  <span style={{ fontSize: '11px', color: '#888' }}>{jours.length} jour(s) · {hMois}h</span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {jours.map((p, i) => {
                                    const typeColor = p.type === 'cours' ? config.couleur : p.type === 'revision' ? '#7c3aed' : '#0891b2';
                                    return (
                                      <span key={i} style={{ backgroundColor: typeColor + '15', border: `1px solid ${typeColor}`, color: typeColor, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                                        {p.date.split('/')[0]}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* ===== APPRENANTS (AMÉLIORÉ) ===== */}
                {onglet === 'apprenants' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        Apprenants {config.label} (CA + P2S)
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ backgroundColor: '#EAF4F3', color: '#006B68', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                          {nbInscrits} / {totalCapacite} inscrits
                        </span>
                        {nbInscrits < totalCapacite && (
                          <button onClick={() => {
                            // Tout sélectionner
                            apprenantsDispo.forEach((a: any) => {
                              if (!selectionne.apprenantIds.includes(a.id)) {
                                const sessionPrec = getApprenantSessionId(a.id);
                                if (!sessionPrec || sessionPrec === selectionne.id) {
                                  syncApprenantSessionId(a.id, selectionne.id);
                                }
                              }
                            });
                            const newIds = apprenantsDispo
                              .filter((a: any) => {
                                const sessionPrec = getApprenantSessionId(a.id);
                                return !sessionPrec || sessionPrec === selectionne.id;
                              })
                              .map((a: any) => a.id);
                            mettreAJour('apprenantIds', Array.from(new Set([...selectionne.apprenantIds, ...newIds])));
                            setRefreshKey(k => k + 1);
                          }} style={{ ...btnSecondary, padding: '4px 10px', fontSize: '11px' }}>
                            ✅ Tout sélectionner (libres)
                          </button>
                        )}
                        {nbInscrits > 0 && (
                          <button onClick={() => {
                            if (!confirm('Retirer tous les apprenants de cette session ?')) return;
                            selectionne.apprenantIds.forEach(aid => syncApprenantSessionId(aid, undefined));
                            mettreAJour('apprenantIds', []);
                            setRefreshKey(k => k + 1);
                          }} style={{ backgroundColor: 'white', color: '#e53e3e', border: '1.5px solid #e53e3e', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                            🗑 Tout retirer
                          </button>
                        )}
                      </div>
                    </div>

                    {apprenantsDispo.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '12px' }}>
                        Aucun apprenant {selectionne.formation} en cours
                      </div>
                    ) : (
                      <div key={refreshKey} style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '500px', overflowY: 'auto' }}>
                        {apprenantsDispo.map((a: any) => {
                          const estRattache = selectionne.apprenantIds.includes(a.id);
                          const sessionPrec = getApprenantSessionId(a.id);
                          const dansAutreSession = !estRattache && sessionPrec && sessionPrec !== selectionne.id;
                          const sessionPrecObj = dansAutreSession ? sessions.find(s => s.id === sessionPrec) : null;
                          const statutColor = a.statut === 'En cours' ? '#006B68' : '#C8A23A';
                          const statutBg = a.statut === 'En cours' ? '#e6f4f1' : '#fef6e4';

                          return (
                            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', backgroundColor: estRattache ? '#EAF4F3' : dansAutreSession ? '#fef6e4' : '#fafafa', border: `1px solid ${estRattache ? '#006B68' : dansAutreSession ? '#C8A23A' : '#e0e0e0'}` }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <a href={`/apprenants/${a.id}`} style={{ fontSize: '13px', fontWeight: '600', color: estRattache ? '#006B68' : '#333', textDecoration: 'none' }}>
                                    {a.prenom} {a.nom}
                                  </a>
                                  <span style={{ backgroundColor: statutBg, color: statutColor, padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>
                                    {a.statut === 'En cours' ? 'CA' : 'P2S'}
                                  </span>
                                  {dansAutreSession && sessionPrecObj && (
                                    <span style={{ backgroundColor: '#fef6e4', color: '#7a5c00', padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>
                                      ⚠️ Déjà dans {sessionPrecObj.numero}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                  {a.entreprise || 'P2S — sans entreprise'}
                                  {a.dateDebutContrat && <span> · Début : {a.dateDebutContrat}</span>}
                                </div>
                              </div>
                              <button onClick={() => basculerApprenant(a.id)} style={{ backgroundColor: estRattache ? '#fde8e8' : '#006B68', color: estRattache ? '#e53e3e' : 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
                                {estRattache ? '− Retirer' : '+ Ajouter'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#e6f4f1', borderRadius: '8px', fontSize: '11px', color: '#006B68' }}>
                      💡 L'inscription est <strong>synchronisée automatiquement</strong> avec la fiche apprenant. Si tu déplaces un apprenant vers cette session, il sera automatiquement retiré de l'ancienne.
                    </div>
                  </div>
                )}

                {/* MODULES / FORMATEURS */}
                {onglet === 'modules' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#888' }}>Modules et formateurs par CCP</div>
                      <button onClick={() => {
                        const nouv: ModuleSession = { id: Date.now().toString(), nom: '', ccp: '', formateurId: '', formateurNom: '', dateDebut: '', dateFin: '', heures: 0 };
                        mettreAJour('modules', [...(selectionne.modules || []), nouv]);
                      }} style={{ ...btnPrimary, padding: '5px 10px', fontSize: '11px' }}>+ Ajouter module</button>
                    </div>
                    {(selectionne.modules || []).length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '12px' }}>Aucun module — cliquez sur "+ Ajouter module"</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(selectionne.modules || []).map(mod => (
                          <div key={mod.id} style={{ backgroundColor: '#fafafa', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                              {[
                                { label: 'Nom du module', champ: 'nom', placeholder: 'ex: Comptabilité générale' },
                                { label: 'CCP concerné', champ: 'ccp', placeholder: 'ex: CCP1' },
                                { label: 'Date début', champ: 'dateDebut', placeholder: 'JJ/MM/AAAA' },
                                { label: 'Date fin', champ: 'dateFin', placeholder: 'JJ/MM/AAAA' },
                              ].map(f => (
                                <div key={f.champ}>
                                  <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>{f.label}</label>
                                  <input placeholder={f.placeholder} style={{ ...inputStyle, fontSize: '11px', padding: '5px 8px' }} value={(mod as any)[f.champ] ?? ''} onChange={e => {
                                    const updated = (selectionne.modules || []).map(m => m.id === mod.id ? { ...m, [f.champ]: e.target.value } : m);
                                    mettreAJour('modules', updated);
                                  }} />
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Formateur</label>
                                <select style={{ ...inputStyle, fontSize: '11px', padding: '5px 8px' }} value={mod.formateurId} onChange={e => {
                                  const f = formateurs.find(f => f.id === e.target.value);
                                  const updated = (selectionne.modules || []).map(m => m.id === mod.id ? { ...m, formateurId: e.target.value, formateurNom: f ? f.prenom + ' ' + f.nom : '' } : m);
                                  mettreAJour('modules', updated);
                                }}>
                                  <option value="">Choisir un formateur...</option>
                                  {formateurs.filter(f => f.statut === 'Actif').map(f => (
                                    <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Nb heures</label>
                                <input type="number" step="0.5" style={{ ...inputStyle, fontSize: '11px', padding: '5px 8px' }} value={mod.heures} onChange={e => {
                                  const updated = (selectionne.modules || []).map(m => m.id === mod.id ? { ...m, heures: parseFloat(e.target.value) || 0 } : m);
                                  mettreAJour('modules', updated);
                                }} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                              <button onClick={() => mettreAJour('modules', (selectionne.modules || []).filter(m => m.id !== mod.id))} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer' }}>✕ Supprimer</button>
                            </div>
                          </div>
                        ))}
                        <div style={{ backgroundColor: '#006B68', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>Total modules</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#C8A23A' }}>
                            {(selectionne.modules || []).reduce((s, m) => s + m.heures, 0)}h / {config.totalHeures}h
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {onglet === 'eval_chaud' && (
                  <div>
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>🌡️ Évaluations à chaud des apprentis</h3>
                      <p style={{ fontSize: '10px', color: '#888' }}>🛡️ Indicateurs 30/31 Qualiopi</p>
                    </div>
                    <CardEvaluationsChaud
                      sessionId={selectionne.id}
                      sessionNom={`${selectionne.numero} — ${config.label}`}
                      apprenantIds={selectionne.apprenantIds}
                    />
                  </div>
                )}

                {onglet === 'eval_froid' && (
                  <div>
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>❄️ Évaluations à froid (6 mois)</h3>
                      <p style={{ fontSize: '10px', color: '#888' }}>🛡️ Indicateur 30 Qualiopi — Suivi à froid</p>
                    </div>
                    <CardEvaluationsFroid
                      sessionId={selectionne.id}
                      sessionNom={`${selectionne.numero} — ${config.label}`}
                      apprenantIds={selectionne.apprenantIds}
                    />
                  </div>
                )}
                {onglet === 'eval_entreprise' && (
                  <div>
                    <div style={{ marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>🏢 Évaluations entreprises / Maîtres d'apprentissage</h3>
                      <p style={{ fontSize: '10px', color: '#888' }}>🛡️ Indicateur 13 Qualiopi — Recueil de l'avis des entreprises</p>
                    </div>
                    <CardEvaluationsEntreprise
                      sessionId={selectionne.id}
                      sessionNom={`${selectionne.numero} — ${config.label}`}
                      apprenantIds={selectionne.apprenantIds}
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modale nouvelle session */}
      {modale && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '500px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#006B68', marginBottom: '20px' }}>+ Nouvelle session</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Formation *</label>
                <select style={inputStyle} value={form.formation ?? 'SC'} onChange={e => setForm(p => ({ ...p, formation: e.target.value }))}>
                  {Object.entries(FORMATIONS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v.label} ({JOURS[v.jour]}s)</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Date de début *</label>
                  <input style={inputStyle} value={form.dateDebut ?? ''} placeholder="JJ/MM/AAAA" onChange={e => setForm(p => ({ ...p, dateDebut: e.target.value }))} />
                  {form.formation && <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>Jour fixe : {JOURS[FORMATIONS_CONFIG[form.formation]?.jour ?? 1]}</div>}
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Année</label>
                  <select style={inputStyle} value={form.annee ?? '2026'} onChange={e => setForm(p => ({ ...p, annee: e.target.value }))}>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Salle</label>
                  <select style={inputStyle} value={form.salle ?? 'Salle A'} onChange={e => setForm(p => ({ ...p, salle: e.target.value }))}>
                    <option value="Salle A">Salle A</option>
                    <option value="Salle B">Salle B</option>
                    <option value="Distanciel">Distanciel</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Statut</label>
                  <select style={inputStyle} value={form.statut ?? 'À venir'} onChange={e => setForm(p => ({ ...p, statut: e.target.value as any }))}>
                    <option value="À venir">À venir</option>
                    <option value="En cours">En cours</option>
                  </select>
                </div>
              </div>

              {form.formation && form.dateDebut && parseDate(form.dateDebut) && (
                <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#006B68' }}>
                  💡 Planning généré : <strong>{FORMATIONS_CONFIG[form.formation].nbJours} {JOURS[FORMATIONS_CONFIG[form.formation].jour]}s</strong> + 1 sem. révisions + 1 sem. examens = <strong>{FORMATIONS_CONFIG[form.formation].totalHeures}h</strong>
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Notes</label>
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setModale(false)} style={btnSecondary}>Annuler</button>
              <button onClick={creerSession} disabled={!form.formation || !form.dateDebut} style={{ ...btnPrimary, opacity: !form.formation || !form.dateDebut ? 0.5 : 1 }}>
                ✅ Créer et générer le planning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
