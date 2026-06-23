'use client';

import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import {
  chargerExamens as chargerExamensSupabase,
  sauvegarderExamen as sauvegarderExamenSupabase,
  supprimerExamen as supprimerExamenSupabase,
} from '../../data/examensSupabase';
import {
  chargerAgrements,
  creerAgrement,
  modifierAgrement,
  supprimerAgrement,
  uploaderPdfAgrement,
  type Agrement,
} from '../../data/agrementsSupabase';

const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };
const btnPrimary: React.CSSProperties = { backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };

// ── Référentiel formations ────────────────────────────────────────────────────
const FORMATIONS_EXAMEN: Record<string, {
  code: string; label: string; numero: string; couleur: string;
  agrement: string; validiteAgrement: string;
  debutAgrement?: string;
  situations: { id: string; label: string; duree: string; applicable: boolean }[];
}> = {
  SC: {
    code: 'SC', label: 'Secrétaire Comptable', numero: 'TP-00402m09', couleur: '#006B68',
    agrement: 'Agrément DEETS Réunion', validiteAgrement: '31/12/2026',
    situations: [
      { id: 'MSP', label: 'Mise en situation professionnelle', duree: '4h00', applicable: true },
      { id: 'ET', label: 'Entretien technique', duree: '0h20', applicable: true },
      { id: 'QP', label: 'Questionnaire professionnel', duree: 'Sans objet', applicable: false },
      { id: 'QAP', label: 'Questionnement à partir de production(s)', duree: 'Sans objet', applicable: false },
      { id: 'EF', label: 'Entretien final', duree: '0h20', applicable: true },
    ],
  },
  ARH: {
    code: 'ARH', label: 'Assistant RH', numero: 'TP-01284m04', couleur: '#16a34a',
    agrement: 'Agrément DEETS Réunion', validiteAgrement: '31/12/2026',
    situations: [
      { id: 'MSP', label: 'Mise en situation professionnelle', duree: '3h30', applicable: true },
      { id: 'ET', label: 'Entretien technique', duree: '0h30', applicable: true },
      { id: 'QP', label: 'Questionnaire professionnel', duree: 'Sans objet', applicable: false },
      { id: 'QAP', label: 'Questionnement à partir de production(s)', duree: 'Sans objet', applicable: false },
      { id: 'EF', label: 'Entretien final', duree: '0h20', applicable: true },
    ],
  },
  AD: {
    code: 'AD', label: 'Assistant de Direction', numero: 'TP-01293m04', couleur: '#C8A23A',
    agrement: 'Agrément DEETS Réunion', validiteAgrement: '31/12/2026',
    situations: [
      { id: 'MSP', label: 'Mise en situation professionnelle', duree: '5h00', applicable: true },
      { id: 'ET', label: 'Entretien technique', duree: '0h10', applicable: true },
      { id: 'QP', label: 'Questionnaire professionnel', duree: 'Sans objet', applicable: false },
      { id: 'QAP', label: 'Questionnement à partir de production(s)', duree: '0h20', applicable: true },
      { id: 'EF', label: 'Entretien final', duree: '0h15', applicable: true },
    ],
  },
  GCF: {
    code: 'GCF', label: 'Gestionnaire Comptable et Fiscal', numero: 'TP-00140m09', couleur: '#dc2626',
    agrement: 'Agrément DEETS Réunion', validiteAgrement: '31/12/2026',
    situations: [
      { id: 'MSP', label: 'Mise en situation professionnelle', duree: '4h15', applicable: true },
      { id: 'ET', label: 'Entretien technique', duree: '0h30', applicable: true },
      { id: 'QP', label: 'Questionnaire professionnel', duree: 'Sans objet', applicable: false },
      { id: 'QAP', label: 'Questionnement à partir de production(s)', duree: 'Sans objet', applicable: false },
      { id: 'EF', label: 'Entretien final', duree: '0h20', applicable: true },
    ],
  },
  CATL: {
    code: 'CATL', label: 'Chargé Accueil Touristique', numero: 'TP-01348m02', couleur: '#ea580c',
    agrement: 'Agrément DEETS Réunion', validiteAgrement: '31/12/2026',
    situations: [
      { id: 'MSP', label: 'Mise en situation professionnelle', duree: '0h45', applicable: true },
      { id: 'ET', label: 'Entretien technique', duree: '0h45', applicable: true },
      { id: 'QP', label: 'Questionnaire professionnel', duree: 'Sans objet', applicable: false },
      { id: 'QAP', label: 'Questionnement à partir de production(s)', duree: '0h30', applicable: true },
      { id: 'EF', label: 'Entretien final', duree: '0h15', applicable: true },
    ],
  },
  EC: {
    code: 'EC', label: 'Employé Commercial', numero: 'TP-00219m08', couleur: '#0891b2',
    agrement: 'Agrément DEETS Réunion', validiteAgrement: '31/12/2026',
    situations: [
      { id: 'MSP', label: 'Mise en situation professionnelle', duree: '2h05', applicable: true },
      { id: 'ET', label: 'Entretien technique', duree: 'Sans objet', applicable: false },
      { id: 'QP', label: 'Questionnaire professionnel', duree: 'Sans objet', applicable: false },
      { id: 'QAP', label: 'Questionnement à partir de production(s)', duree: '0h30', applicable: true },
      { id: 'EF', label: 'Entretien final', duree: '0h15', applicable: true },
    ],
  },
  CV: {
    code: 'CV', label: 'Conseiller de Vente', numero: 'TP-00520m05', couleur: '#7c3aed',
    agrement: 'Agrément DEETS Réunion', validiteAgrement: '31/12/2026',
    situations: [
      { id: 'MSP', label: 'Mise en situation professionnelle', duree: '2h00', applicable: true },
      { id: 'ET', label: 'Entretien technique', duree: '0h30', applicable: true },
      { id: 'QP', label: 'Questionnaire professionnel', duree: 'Sans objet', applicable: false },
      { id: 'QAP', label: 'Questionnement à partir de production(s)', duree: '1h10', applicable: true },
      { id: 'EF', label: 'Entretien final', duree: '0h15', applicable: true },
    ],
  },
  FPA: {
    code: 'FPA', label: 'Formateur Professionnel Adultes', numero: 'TP-00350m07', couleur: '#475569',
    agrement: 'Agrément DEETS Réunion', validiteAgrement: '31/12/2026',
    situations: [
      { id: 'MSP', label: 'Mise en situation professionnelle', duree: '0h55', applicable: true },
      { id: 'ET', label: 'Entretien technique', duree: '0h20', applicable: true },
      { id: 'QP', label: 'Questionnaire professionnel', duree: 'Sans objet', applicable: false },
      { id: 'QAP', label: 'Questionnement à partir de production(s)', duree: '1h35', applicable: true },
      { id: 'EF', label: 'Entretien final', duree: '0h10', applicable: true },
    ],
  },
};

type Jure = {
  id: string; nom: string; prenom: string; telephone: string; email: string;
  specialite: string; disponible: boolean; mailEnvoye: string; confirme: boolean;
};

type Candidat = {
  id: string; nom: string; prenom: string; entreprise: string;
  dpFourni: boolean; ecfFourni: boolean; convocationEnvoyee: string;
  resultats: Record<string, 'Acquis' | 'Non acquis' | 'Absent' | ''>;
};

type SessionExamen = {
  id: string;
  formation: string;
  sessionFormationId: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  responsableNom: string;
  responsablePrenom: string;
  responsableTel: string;
  responsableEmail: string;
  dateCreationCERES: string;
  numeroCERES: string;
  statut: 'Planifiée' | 'En cours' | 'Terminée' | 'Clôturée';
  // DTE
  dateCmdDTE: string;
  dateReceptionDTE: string;
  // Jurés
  jures: Jure[];
  dateCmdJury: string;
  // Candidats
  candidats: Candidat[];
  dateEnvoiConvocations: string;
  // Documents
  affichageReglement: boolean;
  affichagePlanning: boolean;
  affichageConditions: boolean;
  // PV
  dateResultatsCERES: string;
  pvImporte: string;
  pvSigne: string;
  pvEnvoiDemarche: string;
  pvCourrierReco: string;
  pvReceptionDeets: string;
  pvDeets: string;
  // Émargements
  emargementJures: string;
  emargementsCandidats: Record<string, string>;
  // Résultats par candidat (clé = id candidat)
  resultats?: Record<string, any>;
};

function diffJours(dateStr: string): number | null {
  if (!dateStr) return null;
  const p = dateStr.split('/');
  if (p.length !== 3) return null;
  const j = parseInt(p[0]);
  const m = parseInt(p[1]);
  let a = parseInt(p[2]);
  // Si l'année est sur 2 chiffres (ex: "26"), on la complète en 2026
  if (a < 100) a += 2000;
  if (isNaN(j) || isNaN(m) || isNaN(a)) return null;
  const d = new Date(a, m - 1, j);
  // Date du jour à 00h00 pour calcul propre
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - aujourdhui.getTime()) / 86400000);
}

function alerteCouleur(jours: number | null, seuil: number): string {
  if (jours === null) return '#888';
  if (jours < 0) return '#e53e3e';
  if (jours <= seuil * 0.25) return '#e53e3e';
  if (jours <= seuil * 0.5) return '#C8A23A';
  return '#16a34a';
}

export default function Examens() {
  const [sessions, setSessions] = useState<SessionExamen[]>([]);
  const [sessionSel, setSessionSel] = useState<SessionExamen | null>(null);
  const [onglet, setOnglet] = useState<'sessions' | 'agrement' | 'jures'>('sessions');
  const [ongletFiche, setOngletFiche] = useState<'infos' | 'dte' | 'jury' | 'candidats' | 'documents' | 'pv' | 'emargement'>('infos');
  const [modale, setModale] = useState(false);
  const [form, setForm] = useState<Partial<SessionExamen>>({
    lieu: '1 Chemin Dubuisson 97436 Saint-Leu',
    responsableNom: 'MAILLOT', responsablePrenom: 'Paméla',
    responsableTel: '0693 55 64 92', responsableEmail: 'pamelamaillot@pamoi.re',
    statut: 'Planifiée', jures: [], candidats: [],
    resultats: {}, emargementsCandidats: {},
    affichageReglement: false, affichagePlanning: false, affichageConditions: false,
  });
  const [sessionsFo, setSessionsFo] = useState<any[]>([]);
  const [agrementsFichiers, setAgrementsFichiers] = useState<Record<string, string>>({});
  const [agreementsInfos, setAgreementsInfos] = useState<Record<string, { debut: string; fin: string; archive: boolean }>>({});
  const [agrementsDb, setAgrementsDb] = useState<Agrement[]>([]);

  useEffect(() => {
    (async () => {
      // Examens : Supabase d'abord, fallback localStorage
      try {
        const fromSupabase = await chargerExamensSupabase();
        if (fromSupabase && fromSupabase.length > 0) {
          console.log(`[Examens] ${fromSupabase.length} examens chargés depuis Supabase ✅`);
          setSessions(fromSupabase as any[]);
          // Sync local pour fallback hors-ligne
          localStorage.setItem('easycfa_examens', JSON.stringify(fromSupabase));
        } else {
          console.warn('[Examens] Supabase vide, fallback localStorage');
          const s = localStorage.getItem('easycfa_examens');
          if (s) setSessions(JSON.parse(s));
        }
      } catch (e) {
        console.error('[Examens] Erreur Supabase, fallback localStorage', e);
        const s = localStorage.getItem('easycfa_examens');
        if (s) setSessions(JSON.parse(s));
      }
      // Autres données : restent en localStorage
      try {
        const sf = localStorage.getItem('easycfa_sessions_v2');
        if (sf) setSessionsFo(JSON.parse(sf));
        const af = localStorage.getItem('easycfa_agrements_fichiers');
        if (af) setAgrementsFichiers(JSON.parse(af));
        const ai = localStorage.getItem('easycfa_agrements_infos');
        if (ai) setAgreementsInfos(JSON.parse(ai));
      } catch {}
      // Agréments : nouvelle source Supabase (table agrements)
      try {
        const ags = await chargerAgrements();
        console.log(`[Examens] ${ags.length} agréments chargés depuis Supabase ✅`);
        setAgrementsDb(ags);
      } catch (e) {
        console.error('[Examens] Erreur chargement agréments Supabase', e);
      }
    })();
  }, []);

  function save(liste: SessionExamen[], examenModifie?: SessionExamen) {
    setSessions(liste);
    // Sauvegarde locale immédiate (fallback hors-ligne)
    localStorage.setItem('easycfa_examens', JSON.stringify(liste));
    // Sauvegarde Supabase de l'examen modifié uniquement (asynchrone, best-effort)
    if (examenModifie) {
      sauvegarderExamenSupabase(examenModifie as any).then(res => {
        if (!res.success) {
          console.error(`[Examens ${examenModifie.id}] Erreur Supabase :`, res.error);
        } else {
          console.log(`[Examens ${examenModifie.id}] Sauvegardé dans Supabase ✅`);
        }
      });
    }
  }

  function maj(champ: string, val: any) {
    if (!sessionSel) return;
    const u = { ...sessionSel, [champ]: val };
    setSessionSel(u);
    save(sessions.map(s => s.id === u.id ? u : s), u);
  }

  function creer() {
    if (!form.formation || !form.dateDebut) return;
    const n: SessionExamen = {
      id: Date.now().toString(),
      formation: form.formation ?? '',
      sessionFormationId: form.sessionFormationId ?? '',
      dateDebut: form.dateDebut ?? '',
      dateFin: form.dateFin ?? '',
      lieu: form.lieu ?? '1 Chemin Dubuisson 97436 Saint-Leu',
      responsableNom: form.responsableNom ?? 'MAILLOT',
      responsablePrenom: form.responsablePrenom ?? 'Paméla',
      responsableTel: form.responsableTel ?? '0693 55 64 92',
      responsableEmail: form.responsableEmail ?? 'pamelamaillot@pamoi.re',
      dateCreationCERES: form.dateCreationCERES ?? '',
      numeroCERES: form.numeroCERES ?? '',
      statut: 'Planifiée',
      dateCmdDTE: '', dateReceptionDTE: '',
      jures: [], dateCmdJury: '',
      candidats: form.candidats ?? [],
      dateEnvoiConvocations: '',
      affichageReglement: false, affichagePlanning: false, affichageConditions: false,
      dateResultatsCERES: '', pvImporte: '', pvSigne: '',
      pvEnvoiDemarche: '', pvCourrierReco: '', pvReceptionDeets: '', pvDeets: '',
      emargementJures: '', emargementsCandidats: {},
    };
    save([...sessions, n], n);
    setModale(false);
    setForm({ lieu: '1 Chemin Dubuisson 97436 Saint-Leu', responsableNom: 'MAILLOT', responsablePrenom: 'Paméla', responsableTel: '0693 55 64 92', responsableEmail: 'pamelamaillot@pamoi.re', statut: 'Planifiée', jures: [], candidats: [], affichageReglement: false, affichagePlanning: false, affichageConditions: false });
    setSessionSel(n);
    setOngletFiche('infos');
  }

  const cfg = sessionSel ? FORMATIONS_EXAMEN[sessionSel.formation] : null;
  const joursDebut = sessionSel ? diffJours(sessionSel.dateDebut) : null;

  // Alertes globales
  const alertes = sessions.filter(s => {
    const j = diffJours(s.dateDebut);
    if (j === null) return false;
    if (!s.dateCmdDTE && j <= 120) return true;
    if (!s.dateCmdJury && j <= 90) return true;
    if (!s.dateEnvoiConvocations && j <= 40) return true;
    return false;
  });

  const statutStyles: Record<string, { bg: string; color: string }> = {
    'Planifiée': { bg: '#fef6e4', color: '#C8A23A' },
    'En cours': { bg: '#e6f4f1', color: '#006B68' },
    'Terminée': { bg: '#dcfce7', color: '#16a34a' },
    'Clôturée': { bg: '#f0f0f0', color: '#888' },
  };

  // Complétion checklist
  function tauxCompletion(s: SessionExamen): number {
    const checks = [
      !!s.dateCreationCERES, !!s.numeroCERES,
      !!s.dateCmdDTE, !!s.dateReceptionDTE,
      s.jures.length > 0, !!s.dateCmdJury,
      !!s.dateEnvoiConvocations,
      s.affichageReglement, s.affichagePlanning, s.affichageConditions,
      !!s.dateResultatsCERES, !!s.pvSigne, !!s.pvEnvoiDemarche,
      !!s.pvCourrierReco, !!s.pvDeets,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#006B68', marginBottom: '4px' }}>🎓 Examens</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>{sessions.length} session(s) — {sessions.filter(s => s.statut === 'Planifiée').length} planifiée(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="https://ceres.emploi.gouv.fr/ceres/#" target="_blank" rel="noopener noreferrer" style={{ ...btnSecondary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🔗 Ouvrir CERES
          </a>
          <button onClick={() => setModale(true)} style={btnPrimary}>+ Nouvelle session</button>
        </div>
      </div>

      {/* Alertes globales */}
      {alertes.length > 0 && (
        <div style={{ backgroundColor: '#fde8e8', border: '1.5px solid #e53e3e', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#e53e3e', marginBottom: '6px' }}>🔴 {alertes.length} session(s) nécessitent une action urgente !</div>
          {alertes.map(s => {
            const j = diffJours(s.dateDebut);
            const cfg2 = FORMATIONS_EXAMEN[s.formation];
            const actions = [];
            if (!s.dateCmdDTE && j !== null && j <= 120) actions.push(`Commander DTE (J-${j})`);
            if (!s.dateCmdJury && j !== null && j <= 90) actions.push(`Commander jurés (J-${j})`);
            if (!s.dateEnvoiConvocations && j !== null && j <= 40) actions.push(`Envoyer convocations (J-${j})`);
            return (
              <div key={s.id} style={{ fontSize: '11px', color: '#c53030', marginBottom: '3px' }}>
                ⚠️ <strong>{cfg2?.label} — {s.dateDebut}</strong> : {actions.join(' • ')}
              </div>
            );
          })}
        </div>
      )}

      {/* Onglets principaux */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '2px solid #EAF4F3' }}>
        {[
          { id: 'sessions', label: '📅 Sessions d\'examen' },
          { id: 'agrement', label: '📋 Agréments TP' },
          { id: 'jures', label: '👨‍⚖️ Répertoire jurés' },
        ].map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id as any)} style={{ padding: '10px 18px', fontSize: '13px', fontWeight: '600', border: 'none', borderBottom: onglet === o.id ? '3px solid #006B68' : '3px solid transparent', backgroundColor: 'white', color: onglet === o.id ? '#006B68' : '#888', cursor: 'pointer', marginBottom: '-2px' }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ── AGRÉMENTS (Supabase) ── */}
      {onglet === 'agrement' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {agrementsDb.filter(ag => !ag.archive).map(ag => {
            const finReelle = ag.dateFin || '';
            const jFin = diffJours(finReelle);
            const couleurV = jFin !== null && jFin <= 90 ? '#e53e3e' : jFin !== null && jFin <= 180 ? '#C8A23A' : '#16a34a';
            const couleurAg = ag.couleur || '#006B68';
            const situations = Array.isArray(ag.situations) ? ag.situations : [];

            async function patchAgrement(patch: Partial<Agrement>) {
              setAgrementsDb(prev => prev.map(a => a.id === ag.id ? { ...a, ...patch } : a));
              const res = await modifierAgrement(ag.id, patch);
              if (!res.success) console.error('[Agrement] Erreur sauvegarde :', res.error);
            }

            async function importerPdf(file: File) {
              const res = await uploaderPdfAgrement(ag.id, file);
              if (!res.success) { alert('Erreur upload PDF : ' + res.error); return; }
              await patchAgrement({ pdfUrl: res.url, pdfNom: res.nom, pdfCheminStorage: res.chemin });
            }

            return (
              <Card key={ag.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ backgroundColor: couleurAg, color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{ag.formationCode}</div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#333' }}>{ag.formationLabel}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>N° : <strong style={{ color: '#006B68' }}>{ag.numero}</strong></div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{ag.intituleAgrement || 'Agrément DEETS Réunion'}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Début validité</label>
                        <input style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', width: '110px', backgroundColor: 'white' }}
                          value={ag.dateDebut ?? ''} placeholder="JJ/MM/AAAA"
                          onChange={e => patchAgrement({ dateDebut: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Fin validité</label>
                        <input style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', width: '110px', backgroundColor: 'white' }}
                          value={ag.dateFin ?? ''} placeholder="JJ/MM/AAAA"
                          onChange={e => patchAgrement({ dateFin: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Validité</div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: couleurV }}>{finReelle || '—'}</div>
                      {jFin !== null && <div style={{ fontSize: '10px', color: couleurV, fontWeight: '700' }}>{jFin > 0 ? 'J-' + jFin : 'EXPIRÉ'}</div>}
                      {jFin !== null && jFin <= 90 && jFin > 0 && (
                        <div style={{ fontSize: '10px', backgroundColor: '#fde8e8', color: '#e53e3e', padding: '2px 6px', borderRadius: '6px', fontWeight: '700', marginTop: '2px' }}>⚠️ Renouveler !</div>
                      )}
                    </div>
                    <button onClick={() => patchAgrement({ archive: true })}
                      style={{ backgroundColor: '#f0f0f0', color: '#888', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>
                      📦 Archiver
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '10px', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>📋 Situations d'évaluation</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {situations.map(sit => (
                      <div key={sit.id} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', paddingBottom: '4px', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#d0e8e6', fontSize: '12px' }}>
                        <span style={{ color: '#333' }}>{sit.applicable ? '✅' : '—'} {sit.label}</span>
                        <span style={{ fontWeight: sit.applicable ? '600' : '400', color: sit.applicable ? couleurAg : '#ccc' }}>{sit.duree}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {ag.pdfUrl ? (
                      <>
                        <a href={ag.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#006B68', fontWeight: '600', textDecoration: 'underline' }}>✅ {ag.pdfNom || 'Agrément importé'}</a>
                        <label style={{ backgroundColor: 'white', color: '#006B68', border: '1px solid #006B68', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>
                          🔄 Remplacer
                          <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={ev => { const file = ev.target.files?.[0]; if (file) importerPdf(file); ev.target.value = ''; }} />
                        </label>
                      </>
                    ) : (
                      <label style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                        📎 Importer agrément DEETS (PDF)
                        <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={ev => { const file = ev.target.files?.[0]; if (file) importerPdf(file); ev.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── RÉPERTOIRE JURÉS ── */}
      {onglet === 'jures' && (
        <RepertoireJures />
      )}

      {/* ── SESSIONS ── */}
      {onglet === 'sessions' && (
        <div style={{ display: 'grid', gridTemplateColumns: sessionSel ? '340px 1fr' : '1fr', gap: '20px' }}>
          {/* Liste sessions */}
          <Card>
            {sessions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                Aucune session d'examen — cliquez sur "+ Nouvelle session"
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessions.map(s => {
                  const cfg2 = FORMATIONS_EXAMEN[s.formation];
                  const st = statutStyles[s.statut] ?? { bg: '#f0f0f0', color: '#888' };
                  const j = diffJours(s.dateDebut);
                  const taux = tauxCompletion(s);
                  const isOpen = sessionSel?.id === s.id;
                  return (
                    <div key={s.id} onClick={() => { setSessionSel(isOpen ? null : s); setOngletFiche('infos'); }} style={{ padding: '12px 14px', borderRadius: '10px', borderTop: '1.5px solid ' + (isOpen ? '#006B68' : '#e0e0e0'), borderRight: '1.5px solid ' + (isOpen ? '#006B68' : '#e0e0e0'), borderBottom: '1.5px solid ' + (isOpen ? '#006B68' : '#e0e0e0'), backgroundColor: isOpen ? '#EAF4F3' : 'white', cursor: 'pointer', borderLeft: `4px solid ${cfg2?.couleur ?? '#006B68'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: cfg2?.couleur ?? '#006B68' }}>{cfg2?.label} — {cfg2?.numero}</div>
                          <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>📅 {s.dateDebut} → {s.dateFin}</div>
                          <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>👥 {s.candidats.length} candidat(s) · 👨‍⚖️ {s.jures.length} juré(s)</div>
                          {s.numeroCERES && <div style={{ fontSize: '10px', color: '#888' }}>CERES : {s.numeroCERES}</div>}
                          {/* Barre progression */}
                          <div style={{ marginTop: '6px', backgroundColor: '#e0e0e0', borderRadius: '4px', height: '4px', width: '140px' }}>
                            <div style={{ height: '4px', borderRadius: '4px', backgroundColor: taux === 100 ? '#16a34a' : '#006B68', width: taux + '%' }} />
                          </div>
                          <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{taux}% complété</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{ backgroundColor: st.bg, color: st.color, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>{s.statut}</span>
                          {j !== null && (
                            <span style={{ fontSize: '10px', fontWeight: '700', color: alerteCouleur(j, 120) }}>
                              {j >= 0 ? `J-${j}` : 'Passée'}
                            </span>
                          )}
                          <button onClick={e => { e.stopPropagation(); if (confirm('Supprimer ?')) { save(sessions.filter(x => x.id !== s.id)); if (sessionSel?.id === s.id) setSessionSel(null); } }} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Fiche session */}
          {sessionSel && cfg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* En-tête fiche */}
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <div style={{ backgroundColor: cfg.couleur, color: 'white', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-block', marginBottom: '4px' }}>{cfg.code} — {cfg.numero}</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#333' }}>{cfg.label}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>📅 {sessionSel.dateDebut} → {sessionSel.dateFin}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select value={sessionSel.statut} onChange={e => maj('statut', e.target.value)} style={{ ...inputStyle, width: 'auto', fontSize: '11px' }}>
                      {['Planifiée', 'En cours', 'Terminée', 'Clôturée'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setSessionSel(null)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                  </div>
                </div>

                {/* Alertes J-120/90/40 */}
                {joursDebut !== null && joursDebut >= 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { seuil: 120, label: 'Commander DTE', fait: !!sessionSel.dateCmdDTE },
                      { seuil: 90, label: 'Commander jurés', fait: !!sessionSel.dateCmdJury },
                      { seuil: 40, label: 'Envoyer convocations', fait: !!sessionSel.dateEnvoiConvocations },
                    ].map(a => (
                      <div key={a.label} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', backgroundColor: a.fait ? '#dcfce7' : joursDebut <= a.seuil ? '#fde8e8' : '#EAF4F3', color: a.fait ? '#16a34a' : joursDebut <= a.seuil ? '#e53e3e' : '#888' }}>
                        {a.fait ? '✅' : joursDebut <= a.seuil ? '⚠️' : '⏳'} {a.label} {!a.fait && joursDebut <= a.seuil && `(J-${joursDebut})`}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Onglets fiche */}
              <Card style={{ padding: 0 }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #EAF4F3', overflowX: 'auto' }}>
                  {[
                    { id: 'infos', label: '📋 Infos' },
                    { id: 'dte', label: '📦 DTE' },
                    { id: 'jury', label: '👨‍⚖️ Jurés' },
                    { id: 'candidats', label: `👥 Candidats (${sessionSel.candidats.length})` },
                    { id: 'documents', label: '📄 Documents' },
                    { id: 'pv', label: '📝 PV & Résultats' },
                    { id: 'emargement', label: '✍️ Émargements' },
                  ].map(o => (
                    <button key={o.id} onClick={() => setOngletFiche(o.id as any)} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', border: 'none', borderBottom: ongletFiche === o.id ? '3px solid #006B68' : '3px solid transparent', backgroundColor: 'white', color: ongletFiche === o.id ? '#006B68' : '#888', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: '-2px' }}>
                      {o.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '16px' }}>

                  {/* ── INFOS ── */}
                  {ongletFiche === 'infos' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {[
                          { label: 'Date début examen', champ: 'dateDebut', ph: 'JJ/MM/AAAA' },
                          { label: 'Date fin examen', champ: 'dateFin', ph: 'JJ/MM/AAAA' },
                          { label: 'Lieu', champ: 'lieu', ph: '' },
                          { label: 'N° session CERES', champ: 'numeroCERES', ph: '' },
                          { label: 'Date création CERES', champ: 'dateCreationCERES', ph: 'JJ/MM/AAAA' },
                          { label: 'Responsable Nom', champ: 'responsableNom', ph: '' },
                          { label: 'Responsable Prénom', champ: 'responsablePrenom', ph: '' },
                          { label: 'Téléphone', champ: 'responsableTel', ph: '' },
                          { label: 'Email', champ: 'responsableEmail', ph: '' },
                        ].map(f => (
                          <div key={f.champ}>
                            <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>{f.label}</label>
                            <input style={inputStyle} value={(sessionSel as any)[f.champ] ?? ''} placeholder={f.ph} onChange={e => maj(f.champ, e.target.value)} />
                          </div>
                        ))}
                      </div>
                      {/* Situations évaluation */}
                      <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#006B68', marginBottom: '8px', textTransform: 'uppercase' }}>📋 Situations d'évaluation</div>
                        {cfg.situations.filter(s => s.applicable).map(s => (
                          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #d0e8e6', fontSize: '12px' }}>
                            <span style={{ color: '#333' }}>{s.label}</span>
                            <span style={{ fontWeight: '700', color: cfg.couleur }}>{s.duree}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── DTE ── */}
                  {ongletFiche === 'dte' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ backgroundColor: joursDebut !== null && joursDebut <= 120 && !sessionSel.dateCmdDTE ? '#fde8e8' : '#EAF4F3', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#006B68', marginBottom: '8px' }}>
                          📦 Documents de l'évaluation (DTE)
                          {joursDebut !== null && joursDebut <= 120 && !sessionSel.dateCmdDTE && (
                            <span style={{ marginLeft: '8px', backgroundColor: '#e53e3e', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>⚠️ À commander — J-{joursDebut}</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {[
                            { label: 'Date commande DTE (CERES)', champ: 'dateCmdDTE' },
                            { label: 'Date réception DTE', champ: 'dateReceptionDTE' },
                          ].map(f => (
                            <div key={f.champ}>
                              <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>{f.label}</label>
                              <input style={inputStyle} value={(sessionSel as any)[f.champ] ?? ''} placeholder="JJ/MM/AAAA" onChange={e => maj(f.champ, e.target.value)} />
                            </div>
                          ))}
                        </div>
                        {sessionSel.dateCmdDTE && !sessionSel.dateReceptionDTE && (
                          <div style={{ marginTop: '8px', fontSize: '11px', color: '#C8A23A', fontWeight: '600' }}>⏳ DTE commandés le {sessionSel.dateCmdDTE} — En attente de réception</div>
                        )}
                        {sessionSel.dateReceptionDTE && (
                          <div style={{ marginTop: '8px', fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>✅ DTE reçus le {sessionSel.dateReceptionDTE}</div>
                        )}
                      </div>
                      <a href="https://ceres.emploi.gouv.fr/ceres/#" target="_blank" rel="noopener noreferrer" style={{ ...btnSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
                        🔗 Commander sur CERES
                      </a>
                    </div>
                  )}

                  {/* ── JURÉS ── */}
                  {ongletFiche === 'jury' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          {joursDebut !== null && joursDebut <= 90 && !sessionSel.dateCmdJury && (
                            <span style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '11px' }}>⚠️ Commander jurés sur CERES — J-{joursDebut}</span>
                          )}
                        </div>
                        <button onClick={() => {
                          const n: Jure = { id: Date.now().toString(), nom: '', prenom: '', telephone: '', email: '', specialite: '', disponible: false, mailEnvoye: '', confirme: false };
                          maj('jures', [...sessionSel.jures, n]);
                        }} style={{ ...btnPrimary, padding: '5px 10px', fontSize: '11px' }}>+ Ajouter juré</button>
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Date commande jurés (CERES)</label>
                        <input style={{ ...inputStyle, maxWidth: '200px' }} value={sessionSel.dateCmdJury ?? ''} placeholder="JJ/MM/AAAA" onChange={e => maj('dateCmdJury', e.target.value)} />
                      </div>

                      {sessionSel.jures.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '12px' }}>Aucun juré — cliquez sur "+ Ajouter juré"</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {sessionSel.jures.map((j, ji) => (
                            <div key={j.id} style={{ backgroundColor: j.confirme ? '#e6f4f1' : '#fafafa', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${j.confirme ? '#006B68' : '#e0e0e0'}` }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                                {[
                                  { label: 'Nom', k: 'nom' }, { label: 'Prénom', k: 'prenom' },
                                  { label: 'Téléphone', k: 'telephone' }, { label: 'Email', k: 'email' },
                                  { label: 'Spécialité', k: 'specialite' }, { label: 'Mail envoyé le', k: 'mailEnvoye' },
                                ].map(f => (
                                  <div key={f.k}>
                                    <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>{f.label}</label>
                                    <input style={{ ...inputStyle, fontSize: '11px', padding: '5px 7px' }} value={(j as any)[f.k] ?? ''} onChange={e => {
                                      const jures = sessionSel.jures.map((jj, i) => i === ji ? { ...jj, [f.k]: e.target.value } : jj);
                                      maj('jures', jures);
                                    }} />
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={j.confirme} onChange={e => {
                                    const jures = sessionSel.jures.map((jj, i) => i === ji ? { ...jj, confirme: e.target.checked } : jj);
                                    maj('jures', jures);
                                  }} />
                                  <span style={{ color: j.confirme ? '#16a34a' : '#888', fontWeight: '600' }}>{j.confirme ? '✅ Confirmé' : 'Confirmation en attente'}</span>
                                </label>
                                <a href={`mailto:${j.email}?subject=Disponibilité session examen ${cfg.label} - ${sessionSel.dateDebut}&body=Bonjour,%0A%0ANous vous contactons concernant la session d'examen ${cfg.label} du ${sessionSel.dateDebut}.%0A%0AMerci de nous confirmer votre disponibilité.%0A%0ACordialement%0APAM OI`} style={{ fontSize: '10px', color: '#0891b2', textDecoration: 'none', fontWeight: '600' }}>📧 Envoyer mail disponibilité</a>
                                <button onClick={() => maj('jures', sessionSel.jures.filter((_, i) => i !== ji))} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <a href="https://ceres.emploi.gouv.fr/ceres/#" target="_blank" rel="noopener noreferrer" style={{ ...btnSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
                        🔗 Commander jurés sur CERES
                      </a>
                    </div>
                  )}

                  {/* ── CANDIDATS ── */}
                  {ongletFiche === 'candidats' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          {joursDebut !== null && joursDebut <= 40 && !sessionSel.dateEnvoiConvocations && (
                            <span style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '11px' }}>⚠️ Envoyer convocations — J-{joursDebut}</span>
                          )}
                        </div>
                        <button onClick={() => {
                          const n: Candidat = { id: Date.now().toString(), nom: '', prenom: '', entreprise: '', dpFourni: false, ecfFourni: false, convocationEnvoyee: '', resultats: {} };
                          maj('candidats', [...sessionSel.candidats, n]);
                        }} style={{ ...btnPrimary, padding: '5px 10px', fontSize: '11px' }}>+ Ajouter candidat</button>
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Date envoi convocations</label>
                        <input style={{ ...inputStyle, maxWidth: '200px' }} value={sessionSel.dateEnvoiConvocations ?? ''} placeholder="JJ/MM/AAAA" onChange={e => maj('dateEnvoiConvocations', e.target.value)} />
                      </div>
                      {sessionSel.candidats.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '12px' }}>Aucun candidat inscrit</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {sessionSel.candidats.map((c, ci) => {
                            const docsOk = c.dpFourni && c.ecfFourni;
                            return (
                              <div key={c.id} style={{ backgroundColor: docsOk ? '#e6f4f1' : '#fafafa', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${docsOk ? '#006B68' : '#e0e0e0'}` }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                                  {[
                                    { label: 'Nom', k: 'nom' }, { label: 'Prénom', k: 'prenom' }, { label: 'Entreprise', k: 'entreprise' },
                                  ].map(f => (
                                    <div key={f.k}>
                                      <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>{f.label}</label>
                                      <input style={{ ...inputStyle, fontSize: '11px', padding: '5px 7px' }} value={(c as any)[f.k] ?? ''} onChange={e => {
                                        const candidats = sessionSel.candidats.map((cc, i) => i === ci ? { ...cc, [f.k]: e.target.value } : cc);
                                        maj('candidats', candidats);
                                      }} />
                                    </div>
                                  ))}
                                </div>
                                {/* Docs obligatoires */}
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                                  {[
                                    { label: 'Dossier Professionnel', k: 'dpFourni' },
                                    { label: 'Livret ECF', k: 'ecfFourni' },
                                  ].map(f => (
                                    <label key={f.k} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
                                      <input type="checkbox" checked={(c as any)[f.k]} onChange={e => {
                                        const candidats = sessionSel.candidats.map((cc, i) => i === ci ? { ...cc, [f.k]: e.target.checked } : cc);
                                        maj('candidats', candidats);
                                      }} />
                                      <span style={{ color: (c as any)[f.k] ? '#16a34a' : '#e53e3e', fontWeight: '600' }}>{f.label}</span>
                                    </label>
                                  ))}
                                </div>
                                {/* Résultats par situation */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Résultats :</span>
                                  {cfg.situations.filter(s => s.applicable).map(sit => (
                                    <div key={sit.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                      <span style={{ fontSize: '9px', color: '#888' }}>{sit.id}</span>
                                      <select style={{ fontSize: '10px', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '2px 4px', backgroundColor: 'white', color: c.resultats[sit.id] === 'Acquis' ? '#16a34a' : c.resultats[sit.id] === 'Non acquis' ? '#e53e3e' : '#888' }} value={c.resultats[sit.id] ?? ''} onChange={e => {
                                        const candidats = sessionSel.candidats.map((cc, i) => i === ci ? { ...cc, resultats: { ...cc.resultats, [sit.id]: e.target.value } } : cc);
                                        maj('candidats', candidats);
                                      }}>
                                        <option value="">—</option>
                                        <option value="Acquis">Acquis</option>
                                        <option value="Non acquis">Non acquis</option>
                                        <option value="Absent">Absent</option>
                                      </select>
                                    </div>
                                  ))}
                                  <button onClick={() => maj('candidats', sessionSel.candidats.filter((_, i) => i !== ci))} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── DOCUMENTS ── */}
                  {ongletFiche === 'documents' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#006B68', marginBottom: '4px' }}>📄 Affichages obligatoires</div>
                      {[
                        { label: 'Règlement général des sessions d\'examen', champ: 'affichageReglement' },
                        { label: 'Planning de la session', champ: 'affichagePlanning' },
                        { label: 'Conditions de délivrance des titres professionnels (Décret 22/12/2015)', champ: 'affichageConditions' },
                      ].map(f => (
                        <div key={f.champ} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', backgroundColor: (sessionSel as any)[f.champ] ? '#e6f4f1' : '#fafafa', border: `1px solid ${(sessionSel as any)[f.champ] ? '#006B68' : '#e0e0e0'}` }}>
                          <input type="checkbox" checked={(sessionSel as any)[f.champ] ?? false} onChange={e => maj(f.champ, e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                          <span style={{ fontSize: '12px', fontWeight: '600', color: (sessionSel as any)[f.champ] ? '#006B68' : '#555' }}>
                            {(sessionSel as any)[f.champ] ? '✅' : '⬜'} {f.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── PV & RÉSULTATS ── */}
                  {ongletFiche === 'pv' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { titre: '📊 Enregistrement résultats CERES', champ: 'dateResultatsCERES', label: 'Date enregistrement résultats sur CERES', lien: true },
                        { titre: '🖨 PV d\'examen', champ: 'pvImporte', label: 'PV imprimé et importé', fichier: true },
                        { titre: '✍️ Signature PV par jurés', champ: 'pvSigne', label: 'PV signé importé', fichier: true },
                        { titre: '🌐 Envoi copie PV — démarches.numerique.gouv.fr', champ: 'pvEnvoiDemarche', label: 'Date envoi demarche.numerique.gouv.fr', lien2: 'https://demarche.numerique.gouv.fr/' },
                        { titre: '📮 PV original par courrier recommandé AR', champ: 'pvCourrierReco', label: 'Date envoi recommandé' },
                        { titre: '📥 Réception PV validé par DEETS', champ: 'pvReceptionDeets', label: 'Date réception PV DEETS' },
                        { titre: '📁 Import PV DEETS validé', champ: 'pvDeets', label: 'PV DEETS importé', fichier: true },
                      ].map(bloc => (
                        <div key={bloc.champ} style={{ backgroundColor: (sessionSel as any)[bloc.champ] ? '#e6f4f1' : '#fafafa', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${(sessionSel as any)[bloc.champ] ? '#006B68' : '#e0e0e0'}` }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#006B68', marginBottom: '6px' }}>
                            {(sessionSel as any)[bloc.champ] ? '✅' : '⏳'} {bloc.titre}
                          </div>
                          {bloc.fichier ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <label style={{ ...btnSecondary, display: 'inline-block', cursor: 'pointer', fontSize: '11px', padding: '5px 10px' }}>
                                📎 {(sessionSel as any)[bloc.champ] ? 'Remplacer' : 'Importer'}
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                                  const f = ev.target.files?.[0];
                                  if (f) maj(bloc.champ, f.name);
                                }} />
                              </label>
                              {(sessionSel as any)[bloc.champ] && <span style={{ fontSize: '11px', color: '#006B68', fontWeight: '600' }}>{(sessionSel as any)[bloc.champ]}</span>}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input style={{ ...inputStyle, maxWidth: '180px' }} value={(sessionSel as any)[bloc.champ] ?? ''} placeholder="JJ/MM/AAAA" onChange={e => maj(bloc.champ, e.target.value)} />
                              {bloc.lien && <a href="https://ceres.emploi.gouv.fr/ceres/#" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0891b2', textDecoration: 'none', fontWeight: '600' }}>🔗 Ouvrir CERES</a>}
                              {bloc.lien2 && <a href={bloc.lien2} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0891b2', textDecoration: 'none', fontWeight: '600' }}>🔗 Ouvrir démarches.gouv.fr</a>}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Clôture session */}
                      <div style={{ backgroundColor: sessionSel.statut === 'Clôturée' ? '#e6f4f1' : '#fef6e4', borderRadius: '8px', padding: '12px', border: `1.5px solid ${sessionSel.statut === 'Clôturée' ? '#006B68' : '#C8A23A'}` }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: sessionSel.statut === 'Clôturée' ? '#16a34a' : '#C8A23A', marginBottom: '8px' }}>
                          {sessionSel.statut === 'Clôturée' ? '✅ Session clôturée' : '🔒 Clôturer la session'}
                        </div>
                        {sessionSel.statut !== 'Clôturée' && (
                          <button onClick={() => {
                            if (!confirm('Confirmer la clôture de la session ?')) return;
                            maj('statut', 'Clôturée');
                          }} style={btnPrimary}>🔒 Clôturer la session</button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── ÉMARGEMENTS ── */}
                  {ongletFiche === 'emargement' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Émargement jurés */}
                      <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#006B68', marginBottom: '8px' }}>👨‍⚖️ Émargement jurés (feuille collective)</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <label style={{ ...btnSecondary, display: 'inline-block', cursor: 'pointer', fontSize: '11px', padding: '5px 10px' }}>
                            📎 {sessionSel.emargementJures ? 'Remplacer' : 'Importer feuille signée'}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                              const f = ev.target.files?.[0];
                              if (f) maj('emargementJures', f.name);
                            }} />
                          </label>
                          {sessionSel.emargementJures && <span style={{ fontSize: '11px', color: '#006B68', fontWeight: '600' }}>✅ {sessionSel.emargementJures}</span>}
                        </div>
                      </div>

                      {/* Émargements candidats par situation */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#006B68', marginBottom: '8px' }}>👥 Émargements candidats par situation d'évaluation</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {cfg.situations.filter(s => s.applicable).map(sit => {
                            const fichier = sessionSel.emargementsCandidats?.[sit.id] ?? '';
                            return (
                              <div key={sit.id} style={{ backgroundColor: fichier ? '#e6f4f1' : '#fafafa', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${fichier ? '#006B68' : '#e0e0e0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: fichier ? '#006B68' : '#333' }}>
                                    {fichier ? '✅' : '⏳'} {sit.label}
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#888' }}>{sit.duree}</div>
                                  {fichier && <div style={{ fontSize: '10px', color: '#006B68', marginTop: '2px' }}>{fichier}</div>}
                                </div>
                                <label style={{ ...btnSecondary, display: 'inline-block', cursor: 'pointer', fontSize: '11px', padding: '5px 10px' }}>
                                  📎 {fichier ? 'Remplacer' : 'Importer'}
                                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                                    const f = ev.target.files?.[0];
                                    if (f) maj('emargementsCandidats', { ...sessionSel.emargementsCandidats, [sit.id]: f.name });
                                  }} />
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Modale création */}
      {modale && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '560px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#006B68', marginBottom: '20px' }}>+ Nouvelle session d'examen</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Formation *</label>
                <select style={inputStyle} value={form.formation ?? ''} onChange={e => setForm(p => ({ ...p, formation: e.target.value }))}>
                  <option value="">Choisir une formation...</option>
                  {Object.values(FORMATIONS_EXAMEN).map(f => (
                    <option key={f.code} value={f.code}>{f.code} — {f.label} ({f.numero})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { l: 'Date début examen *', k: 'dateDebut', ph: 'JJ/MM/AAAA' },
                  { l: 'Date fin examen', k: 'dateFin', ph: 'JJ/MM/AAAA' },
                  { l: 'N° session CERES', k: 'numeroCERES', ph: '' },
                  { l: 'Date création CERES', k: 'dateCreationCERES', ph: 'JJ/MM/AAAA' },
                  { l: 'Lieu', k: 'lieu', ph: '1 Chemin Dubuisson 97436 Saint-Leu' },
                  { l: 'Responsable Nom', k: 'responsableNom', ph: '' },
                  { l: 'Responsable Prénom', k: 'responsablePrenom', ph: '' },
                  { l: 'Téléphone responsable', k: 'responsableTel', ph: '' },
                  { l: 'Email responsable', k: 'responsableEmail', ph: '' },
                ].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.l}</label>
                    <input style={inputStyle} value={(form as any)[f.k] ?? ''} placeholder={f.ph} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} />
                  </div>
                ))}
              </div>
              {form.formation && (
                <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#006B68' }}>
                  💡 {FORMATIONS_EXAMEN[form.formation]?.situations.filter(s => s.applicable).map(s => `${s.id}: ${s.duree}`).join(' • ')}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setModale(false)} style={btnSecondary}>Annuler</button>
              <button onClick={creer} disabled={!form.formation || !form.dateDebut} style={{ ...btnPrimary, opacity: !form.formation || !form.dateDebut ? 0.5 : 1 }}>
                ✅ Créer la session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Répertoire jurés global ───────────────────────────────────────────────────
function RepertoireJures() {
  const [jures, setJures] = useState<Jure[]>([]);
  const [modale, setModale] = useState(false);
  const [form, setForm] = useState<Partial<Jure>>({});
  const inputStyle2: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };

  useEffect(() => {
    try { const s = localStorage.getItem('easycfa_jures'); if (s) setJures(JSON.parse(s)); } catch {}
  }, []);

  function save(liste: Jure[]) { setJures(liste); localStorage.setItem('easycfa_jures', JSON.stringify(liste)); }

  function ajouter() {
    if (!form.nom || !form.prenom) return;
    save([...jures, { ...form as Jure, id: Date.now().toString(), disponible: false, confirme: false }]);
    setModale(false); setForm({});
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>👨‍⚖️ Répertoire des jurés — {jures.length} juré(s)</div>
        <button onClick={() => setModale(true)} style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Ajouter un juré</button>
      </div>
      {jures.length === 0 ? (
        <Card><div style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>Aucun juré enregistré</div></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {jures.map(j => (
            <Card key={j.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>{j.prenom} {j.nom}</div>
                  {j.specialite && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>🎓 {j.specialite}</div>}
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>📞 {j.telephone}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>✉️ {j.email}</div>
                </div>
                <button onClick={() => { if (confirm('Supprimer ce juré ?')) save(jures.filter(jj => jj.id !== j.id)); }} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modale && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#006B68', marginBottom: '20px' }}>+ Nouveau juré</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { l: 'Nom *', k: 'nom' }, { l: 'Prénom *', k: 'prenom' },
                { l: 'Téléphone', k: 'telephone' }, { l: 'Email', k: 'email' },
                { l: 'Spécialité / Formation', k: 'specialite' },
              ].map(f => (
                <div key={f.k} style={{ gridColumn: f.k === 'specialite' ? '1/-1' : 'auto' }}>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.l}</label>
                  <input style={inputStyle2} value={(form as any)[f.k] ?? ''} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => { setModale(false); setForm({}); }} style={{ backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
              <button onClick={ajouter} disabled={!form.nom || !form.prenom} style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', opacity: !form.nom || !form.prenom ? 0.5 : 1 }}>✅ Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}