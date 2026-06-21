'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SidebarFormateur from '../../components/SidebarFormateur';
import { chargerIdsFeuillesAccessibles } from '../../lib/seancesService';
import Link from 'next/link';
import { FEUILLES_EMARGEMENT, EMAIL_ABSENCE_TEMPLATE } from '../../data/mockEmargement';
import type { FeuilleEmargement, DemiJournee, PresenceApprenant, StatutPresence } from '../../data/mockEmargement';
import { APPRENANTS_REELS } from '../../data/mockApprenants_reels';
import { chargerApprentis } from '../../data/apprentisSupabase';
import { chargerEntreprises } from '../../data/entreprisesSupabase';
import { REFERENTIEL_FORMATIONS } from '../../data/mockData';
import { useUser } from '../../lib/UserContext';
import { useAcces, tracerAction } from '../../lib/useAcces';
import {
  FicheIntervention,
  ficheCompletee,
} from '../../data/mockInterventions';
import {
  chargerOuCreerFicheSupabase as chargerOuCreerFiche,
  sauvegarderFicheSupabase as sauvegarderFiche,
} from '../../data/interventionsSupabase';
import { COLORS } from '../../lib/constants';
import { uploaderFichier, cheminStorage } from '../../lib/storage';
import { pdf } from '@react-pdf/renderer';
import PdfEmargement from '../../components/PdfEmargement';
import PdfFicheIntervention from '../../components/PdfFicheIntervention';
import {
  chargerEmargements as chargerEmargementsSupabase,
  creerEmargement as creerEmargementSupabase,
  supprimerEmargement as supprimerEmargementSupabase,
} from '../../data/emargementsSupabase';
import Card from '../../components/Card';
import dynamic from 'next/dynamic';
const BoutonPdfEmargement = dynamic(() => import('../../components/BoutonPdfEmargement'), { ssr: false });

const STATUT_STYLE: Record<StatutPresence, { bg: string; color: string; icon: string }> = {
  'Présent':          { bg: '#e6f4f1', color: '#006B68', icon: '✅' },
  'Absent':           { bg: '#fde8e8', color: '#e53e3e', icon: '❌' },
  'Retard':           { bg: '#fef6e4', color: '#C8A23A', icon: '⚠️' },
  'Absent justifié':  { bg: '#f0f4ff', color: '#3a5bc7', icon: '📋' },
  'Non saisi':        { bg: '#f0f0f0', color: '#888', icon: '—' },
};

const FORMATIONS_LABELS: Record<string, string> = {
  SC: 'TP Secrétaire Comptable',
  EC: 'TP Employé Commercial',
  CV: 'TP Conseiller de Vente',
  AD: 'TP Assistant de Direction',
  CATL: 'TP Chargé Accueil Touristique',
  ARH: 'TP Assistant RH',
  GCF: 'TP Gestionnaire Comptable et Fiscal',
  FPA: 'TP Formateur Professionnel d\'Adultes',
};

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnDanger: React.CSSProperties = { backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: COLORS.text, backgroundColor: 'white' };
const textareaStyle: React.CSSProperties = { ...inputStyle, width: '100%', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box' };

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

function genererFeuilleDepuisSessions(sessionsSelectionnees: any[], date: string, jour: string, apprenants: any[]): FeuilleEmargement {
  if (sessionsSelectionnees.length === 0) throw new Error('Au moins une session est nécessaire');
  const sessionPrincipale = sessionsSelectionnees[0];
  const formationLabel = FORMATIONS_LABELS[sessionPrincipale.formation] ?? sessionPrincipale.formation;

  // Agréger TOUS les apprenants de TOUTES les sessions cochées (sans doublon)
  // Source : apprenants Supabase, rattachement via session.apprenantIds (fiable)
  // Exclut les fiches qui ne doivent plus émarger : Terminé, archivées, ou rupture SANS maintien (FMEF).
  // Les ruptures AVEC maintien (MEF) continuent d'émarger (obligation Qualiopi).
  const neDoitPlusEmarger = (a: any): boolean => {
    if (a.archive === true) return true;
    if (a.statut === 'Terminé') return true;
    if (a.statut === 'Rupture' && a.maintienFormation !== 'OUI') return true;
    return false;
  };
  const idsDejaAjoutes = new Set<string>();
  const apprenantsInscrits: any[] = [];
  sessionsSelectionnees.forEach(session => {
    apprenants.forEach((a: any) => {
      if (idsDejaAjoutes.has(a.id)) return;
      if (neDoitPlusEmarger(a)) return;
      const dansSession = session.apprenantIds?.includes(a.id);
      if (dansSession) {
        apprenantsInscrits.push(a);
        idsDejaAjoutes.add(a.id);
      }
    });
  });

  // Planning + thème : on prend ceux de la session principale (la 1ère cochée)
  const planningDuJour = sessionPrincipale.planning?.find((p: any) => p.date === date);
  const moduleAssocie = planningDuJour?.moduleId ? sessionPrincipale.modules?.find((m: any) => m.id === planningDuJour.moduleId) : null;
  // Le formateur est stocké directement dans l'entrée de planning (formateurNom).
  // Repli sur le module associé si jamais, sinon "À définir".
  const formateurNom = planningDuJour?.formateurNom || moduleAssocie?.formateurNom || 'À définir';
  const themeJour = moduleAssocie?.nom || (planningDuJour?.type === 'examen' ? 'Examen' : planningDuJour?.type === 'revision' ? 'Révisions' : 'Cours');

  const fabriquerPresence = (a: any): PresenceApprenant => ({
    apprenantId: a.id,
    nom: a.nom,
    prenom: a.prenom,
    entreprise: a.entreprise || 'P2S',
    emailApprenant: a.email || '',
    emailEntreprise: a.emailEntreprise || '',
    statut: 'Non saisi',
    heuresComptees: 0,
    emailEnvoye: false,
    justificatifRecu: false,
  });

  // ID feuille : on inclut les IDs de toutes les sessions cochées
  const idsKey = sessionsSelectionnees.map(s => s.id).sort().join('-');
  const numerosKey = sessionsSelectionnees.map(s => s.numero).join(' + ');

  return {
    id: `feuille_${idsKey}_${date.replace(/\//g, '-')}`,
    formation: formationLabel,
    formationCode: sessionPrincipale.formation,
    sessionId: sessionPrincipale.id,                         // compat ancien code
    sessionIds: sessionsSelectionnees.map(s => s.id),        // NOUVEAU : tableau multi-sessions
    sessionNumero: numerosKey,                                // ex: "SC-2026-001 + SC-2026-002"
    date,
    jour,
    salle: sessionPrincipale.salle || 'Salle A',
    demiJournees: [
      { id: `${date}_matin`, type: 'Matin', heureDebut: '08:30', heureFin: '12:00', heures: 3.5, formateur: formateurNom, theme: themeJour, modalite: sessionPrincipale.salle === 'Distanciel' ? 'Distanciel' : 'Présentiel', presences: apprenantsInscrits.map(fabriquerPresence), valide: false },
      { id: `${date}_aprem`, type: 'Après-midi', heureDebut: '13:00', heureFin: '16:30', heures: 3.5, formateur: formateurNom, theme: themeJour, modalite: sessionPrincipale.salle === 'Distanciel' ? 'Distanciel' : 'Présentiel', presences: apprenantsInscrits.map(fabriquerPresence), valide: false },
    ],
  } as any;
}

export default function Emargement() {
  const { utilisateur } = useUser();
  const { estAdmin, peutModifier } = useAcces();
  const searchParams = useSearchParams();

  // Phase 4.b-bis : détecter si l'utilisateur est un formateur (mode partagé)
  const estFormateur = utilisateur?.role === 'formateur';
  const feuilleIdUrl = searchParams.get('feuille'); // ?feuille=xxx pour pré-sélectionner

  // IDs des feuilles que le formateur peut voir (filtrées par son planning)
  const [feuillesAccessiblesIds, setFeuillesAccessiblesIds] = useState<string[]>([]);
  const [feuillesLocales, setFeuillesLocales] = useState<FeuilleEmargement[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [formateurs, setFormateurs] = useState<any[]>([]);
  const [apprenants, setApprenants] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [formationsRef, setFormationsRef] = useState<any[]>([]);

  // Code formation court → mot-clé distinctif pour retrouver le bon référentiel
  const MOTCLE_FORMATION: Record<string, string> = {
    SC: 'Secrétaire Comptable',
    GCF: 'Gestionnaire Comptable',
    AD: 'Direction',
    ARH: 'Ressources Humaines',
    EC: 'Commercial',
    CV: 'Conseiller',
    CATL: 'Accueil Touristique',
    FPA: 'Formateur',
  };

  // Retrouve le référentiel (CCP) de la formation NON archivée correspondant à un code court.
  function trouverReferentiel(codeFormation: string): any | null {
    const motcle = MOTCLE_FORMATION[codeFormation];
    if (!motcle) return null;
    const candidates = formationsRef.filter(f =>
      (f.intitule || '').toLowerCase().includes(motcle.toLowerCase()) && !f.archive
    );
    return candidates[0] || null;
  }

  // Aplatit les compétences de tous les CCP en une liste CP1..CPn (numérotation continue),
  // en gardant le rattachement à chaque AT (= CCP).
  function construireAtEtCp(formationRef: any): { ats: { code: string; libelle: string; idxCcp: number }[]; cps: { code: string; libelle: string; idxCcp: number }[] } {
    const ats: { code: string; libelle: string; idxCcp: number }[] = [];
    const cps: { code: string; libelle: string; idxCcp: number }[] = [];
    let cpCompteur = 0;
    (formationRef?.ccps || []).forEach((ccp: any, idx: number) => {
      ats.push({ code: `AT${idx + 1}`, libelle: ccp.libelle || '', idxCcp: idx });
      (ccp.competences || []).forEach((comp: string) => {
        cpCompteur++;
        cps.push({ code: `CP${cpCompteur}`, libelle: comp, idxCcp: idx });
      });
    });
    return { ats, cps };
  }

  // Résout l'email destinataire (entreprise) pour un apprenant absent/en retard.
  // Priorité : tuteurEmail de l'entreprise, repli sur email général de l'entreprise.
  // Renvoie aussi le nom de l'entreprise et l'email de l'apprenti (pour le Cc).
  function resoudreDestinataires(presence: any): { emailEntreprise: string | null; nomEntreprise: string; emailApprenant: string | null; entrepriseTrouvee: boolean } {
    // 1. Retrouver l'apprenant Supabase (pour son entrepriseId / nom entreprise / email)
    const app = apprenants.find(a => a.id === presence.apprenantId);
    const nomEntrepriseApp = (app?.entreprise || presence.entreprise || '').trim();
    const emailApprenant = app?.email || presence.emailApprenant || null;

    // 2. Retrouver la fiche entreprise (par entrepriseId si dispo, sinon par nom raisonSociale)
    const ent = entreprises.find(e =>
      (app?.entrepriseId && e.id === app.entrepriseId) ||
      (nomEntrepriseApp && (e.raisonSociale || '').toLowerCase().trim() === nomEntrepriseApp.toLowerCase())
    );

    // 3. Email entreprise : tuteur en priorité, repli sur email général
    const emailEntreprise = ent?.tuteurEmail || ent?.email || null;

    return {
      emailEntreprise: emailEntreprise || null,
      nomEntreprise: ent?.raisonSociale || nomEntrepriseApp || '(entreprise inconnue)',
      emailApprenant,
      entrepriseTrouvee: !!ent,
    };
  }

  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  // Envoi groupé des alertes absence/retard aux entreprises (admin uniquement, après validation)
  async function envoyerAlertesAbsence(feuilleCible: FeuilleEmargement, djCible: DemiJournee) {
    const concernes = djCible.presences.filter(p => (p.statut === 'Absent' || p.statut === 'Retard' || p.statut === 'Absent justifié') && !p.emailEnvoye);
    if (concernes.length === 0) {
      alert('Aucune alerte à envoyer (déjà toutes envoyées, ou aucun absent/retard).');
      return;
    }

    const alertes = concernes.map(p => {
      const d = resoudreDestinataires(p);
      const corps = EMAIL_ABSENCE_TEMPLATE.corps
        .replace('{{APPRENANT_PRENOM}}', p.prenom)
        .replace('{{APPRENANT_NOM}}', p.nom)
        .replace('{{STATUT}}', p.statut === 'Retard' ? 'en retard' : 'absent(e)')
        .replace('{{DATE}}', feuilleCible.date)
        .replace('{{DEMI_JOURNEE}}', djCible.type)
        .replace('{{FORMATION}}', feuilleCible.formation)
        .replace('{{MESSAGE_SPECIFIQUE}}',
          p.statut === 'Retard'
            ? `Heure d'arrivée enregistrée : ${p.heureArrivee ?? 'non précisée'}.`
            : p.statut === 'Absent justifié'
              ? `Cette absence a été justifiée (justificatif reçu par le CFA). Nous vous en informons pour la gestion de la paie de l'apprenti(e).`
              : `Cette absence sera comptabilisée comme injustifiée si aucun justificatif n'est transmis dans les 48 heures.`);
      return {
        apprenantId: p.apprenantId,
        apprenantNom: `${p.prenom} ${p.nom}`,
        emailEntreprise: d.emailEntreprise,
        emailApprenant: d.emailApprenant,
        sujet: EMAIL_ABSENCE_TEMPLATE.sujet,
        corps,
      };
    });

    const sansEmail = alertes.filter(a => !a.emailEntreprise);
    if (sansEmail.length > 0) {
      const noms = sansEmail.map(a => a.apprenantNom).join(', ');
      if (!confirm(`⚠️ ${sansEmail.length} apprenant(s) sans email entreprise : ${noms}\n\nIls seront ignorés. Continuer avec les autres ?`)) return;
    }

    const aEnvoyer = alertes.filter(a => a.emailEntreprise);
    if (aEnvoyer.length === 0) {
      alert('Aucun email entreprise disponible — rien à envoyer.');
      return;
    }
    if (!confirm(`Envoyer ${aEnvoyer.length} alerte(s) aux entreprises ?`)) return;

    setEnvoiEnCours(true);
    try {
      const res = await fetch('/api/envoyer-alertes-absence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertes: aEnvoyer }),
      });
      const data = await res.json();

      const idsReussis = new Set<string>(
        (data.resultats || [])
          .map((r: any, i: number) => (r.success ? aEnvoyer[i]?.apprenantId : null))
          .filter(Boolean)
      );

      setFeuillesLocales(prev => {
        const nouvelles = prev.map(f => {
          if (f.id !== feuilleCible.id) return f;
          return {
            ...f,
            demiJournees: f.demiJournees.map(dd => {
              if (dd.id !== djCible.id) return dd;
              return {
                ...dd,
                presences: dd.presences.map(p => idsReussis.has(p.apprenantId) ? { ...p, emailEnvoye: true } : p),
              };
            }),
          };
        });
        localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
        const fMod = nouvelles.find(f => f.id === feuilleCible.id);
        if (fMod) creerEmargementSupabase(fMod as any);
        return nouvelles;
      });

      tracerAction('ENVOI_ALERTES_ABSENCE', 'emargement', `${feuilleCible.id}_${djCible.id}`,
        `${feuilleCible.formation} — ${feuilleCible.date} — ${djCible.type} — ${data.nbReussis}/${data.nbTotal} envoyé(s)`, utilisateur);

      setMessageSuccess(`✅ ${data.nbReussis}/${data.nbTotal} alerte(s) envoyée(s) aux entreprises.`);
      setTimeout(() => setMessageSuccess(''), 6000);
    } catch (e: any) {
      console.error('[Alertes absence] Erreur envoi:', e);
      alert(`⚠️ Erreur lors de l'envoi : ${e.message}`);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  // Import du PDF d'émargement signé (depuis sign.plus) pour une demi-journée précise.
  // Stocke dans Supabase Storage + enregistre les infos sur la demi-journée (localStorage + Supabase).
  async function importerPdfSigne(feuilleCible: FeuilleEmargement, djCible: DemiJournee, file: File) {
    if (file.type !== 'application/pdf') {
      alert('⚠️ Merci d\'importer un fichier PDF.');
      return;
    }
    const chemin = cheminStorage('emargements', feuilleCible.id, `${djCible.id}_signe`, file.name);
    const resUpload = await uploaderFichier(chemin, file);
    if (!resUpload.success || !resUpload.fichier) {
      alert(`⚠️ Erreur upload : ${resUpload.error}`);
      return;
    }
    console.log(`[Émargement signé] ${feuilleCible.date} — ${djCible.type} uploadé ✅`);

    setFeuillesLocales(prev => {
      const nouvelles = prev.map(f => {
        if (f.id !== feuilleCible.id) return f;
        return {
          ...f,
          demiJournees: f.demiJournees.map(dd => {
            if (dd.id !== djCible.id) return dd;
            return {
              ...dd,
              pdfSigneUrl: resUpload.fichier!.url,
              pdfSigneNom: resUpload.fichier!.nom,
              pdfSigneCheminStorage: resUpload.fichier!.cheminStorage,
              pdfSigneDateImport: new Date().toISOString(),
            };
          }),
        };
      });
      localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
      const fMod = nouvelles.find(f => f.id === feuilleCible.id);
      if (fMod) {
        creerEmargementSupabase(fMod as any).then(res => {
          if (!res.success) console.error(`[Émargement ${feuilleCible.id}] Erreur sauvegarde PDF signé :`, res.error);
          else console.log(`[Émargement ${feuilleCible.id}] PDF signé enregistré dans Supabase ✅`);
        });
      }
      return nouvelles;
    });

    tracerAction('IMPORT_EMARGEMENT_SIGNE', 'emargement', `${feuilleCible.id}_${djCible.id}`,
      `${feuilleCible.formation} — ${feuilleCible.date} — ${djCible.type}`, utilisateur);

    setMessageSuccess(`✅ Émargement signé importé pour ${djCible.type} du ${feuilleCible.date}.`);
    setTimeout(() => setMessageSuccess(''), 6000);
  }

  // Import d'un PDF de ressource pédagogique pour la fiche d'intervention (ressource à l'index idx).
  async function importerPdfRessource(idx: number, file: File) {
    if (!ficheActive) return;
    if (file.type !== 'application/pdf') {
      alert('⚠️ Merci d\'importer un fichier PDF.');
      return;
    }
    const chemin = cheminStorage('ressources', ficheActive.id, `ressource_${idx}_${Date.now()}`, file.name);
    const resUpload = await uploaderFichier(chemin, file);
    if (!resUpload.success || !resUpload.fichier) {
      alert(`⚠️ Erreur upload : ${resUpload.error}`);
      return;
    }
    const nouvelles = [...(ficheActive.ressourcesSupplementaires || [])];
    nouvelles[idx] = {
      type: 'pdf',
      valeur: resUpload.fichier.url,
      nomFichier: resUpload.fichier.nom,
      cheminStorage: resUpload.fichier.cheminStorage,
    };
    majFiche('ressourcesSupplementaires', nouvelles);
    console.log(`[Ressource PDF] ${resUpload.fichier.nom} importée ✅`);
  }
  const [modaleNouvelle, setModaleNouvelle] = useState(false);
  const [modaleForm, setModaleForm] = useState<{ sessionIds: string[]; date: string; jour: string; formationCode: string }>({ sessionIds: [], date: '', jour: '', formationCode: '' });

  // Détermine si l'utilisateur connecté est aussi formateur
  const formateurId = utilisateur?.formateurId;
  const monFormateur = formateurId ? formateurs.find(f => f.id === formateurId) : null;
  const monNomFormateur = monFormateur ? `${monFormateur.prenom} ${monFormateur.nom}` : `${utilisateur?.prenom ?? ''} ${utilisateur?.nom ?? ''}`;

  useEffect(() => {
    (async () => {
      // Émargements : Supabase d'abord, fallback localStorage
      try {
        const fromSupabase = await chargerEmargementsSupabase();
        if (fromSupabase.length > 0) {
          console.log(`[Emargements] ${fromSupabase.length} feuilles chargées depuis Supabase ✅`);
          setFeuillesLocales(fromSupabase as any[]);
        } else {
          console.warn('[Emargements] Supabase vide, fallback localStorage');
          const s = localStorage.getItem('easycfa_emargement_v2');
          if (s) setFeuillesLocales(JSON.parse(s));
        }
      } catch (e) {
        console.error('[Emargements] Erreur Supabase, fallback localStorage', e);
        try {
          const s = localStorage.getItem('easycfa_emargement_v2');
          if (s) setFeuillesLocales(JSON.parse(s));
        } catch {}
      }
      // Sessions + formateurs (lecture locale, déjà migrés)
      try {
        const ses = localStorage.getItem('easycfa_sessions_v2');
        if (ses) setSessions(JSON.parse(ses));
        const fSaved = localStorage.getItem('easycfa_formateurs');
        if (fSaved) setFormateurs(JSON.parse(fSaved));
      } catch {}
      // Apprenants : Supabase (table 'apprenants') — pour la création des feuilles
      try {
        const apprenantsSupabase = await chargerApprentis();
        console.log(`[Emargement] ${apprenantsSupabase.length} apprenants chargés depuis Supabase ✅`);
        setApprenants(apprenantsSupabase as any[]);
      } catch (e) {
        console.error('[Emargement] Erreur chargement apprenants Supabase', e);
      }
      // Entreprises : Supabase — pour récupérer les emails (alertes absence aux entreprises)
      try {
        const entreprisesSupabase = await chargerEntreprises();
        console.log(`[Emargement] ${entreprisesSupabase.length} entreprises chargées depuis Supabase ✅`);
        setEntreprises(entreprisesSupabase as any[]);
      } catch (e) {
        console.error('[Emargement] Erreur chargement entreprises Supabase', e);
      }
      // Référentiel formations (CCP/compétences) — pour les listes déroulantes de la fiche intervention
      try {
        const saved = localStorage.getItem('easycfa_formations_v2');
        const formsRef = saved ? JSON.parse(saved) : REFERENTIEL_FORMATIONS;
        console.log(`[Emargement] ${formsRef.length} formations (référentiel) chargées ✅`);
        setFormationsRef(formsRef);
      } catch (e) {
        console.error('[Emargement] Erreur chargement référentiel formations', e);
      }
    })();
  }, []);

  // Phase 4.b-bis : charger la liste des feuilles que le formateur peut voir
  useEffect(() => {
    if (!estFormateur || !utilisateur?.formateurId) {
      setFeuillesAccessiblesIds([]);
      return;
    }
    (async () => {
      try {
        const ids = await chargerIdsFeuillesAccessibles(utilisateur.formateurId!);
        setFeuillesAccessiblesIds(ids);
        console.log(`[Emargement formateur] ${ids.length} feuille(s) accessible(s)`);
      } catch (e) {
        console.error('[Emargement formateur] Erreur chargement IDs :', e);
        setFeuillesAccessiblesIds([]);
      }
    })();
  }, [estFormateur, utilisateur?.formateurId]);

  const toutesFeuillesRaw: FeuilleEmargement[] = [...feuillesLocales, ...FEUILLES_EMARGEMENT];

  // Phase 4.b-bis : filtrer selon le rôle
  // - Admin/équipe : voit toutes les feuilles
  // - Formateur : voit uniquement ses feuilles (celles où il intervient via le planning)
  const toutesFeuillesFiltrees: FeuilleEmargement[] = estFormateur
    ? toutesFeuillesRaw.filter(f => feuillesAccessiblesIds.includes(f.id))
    : toutesFeuillesRaw;

  // Tri chronologique : la journée la plus récente en haut.
  // Les dates sont au format JJ/MM/AAAA → on les convertit en vraie date pour comparer.
  function dateEnTimestamp(dateStr: string): number {
    const parts = (dateStr || '').split('/');
    if (parts.length !== 3) return 0;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
  }
  const toutesFeuilles: FeuilleEmargement[] = [...toutesFeuillesFiltrees].sort(
    (a, b) => dateEnTimestamp(b.date) - dateEnTimestamp(a.date)
  );

  // Une feuille est "archivée/passée" quand TOUTES ses demi-journées ont leur PDF signé importé.
  function feuilleEstArchivee(f: FeuilleEmargement): boolean {
    if (!f.demiJournees || f.demiJournees.length === 0) return false;
    return f.demiJournees.every(dj => !!(dj as any).pdfSigneUrl);
  }

  // Séparation : feuilles en cours (colonne gauche) vs feuilles passées (futur tableau)
  const feuillesEnCours = toutesFeuilles.filter(f => !feuilleEstArchivee(f));
  const feuillesPassees = toutesFeuilles.filter(f => feuilleEstArchivee(f));

  // Vérification temporaire (à retirer ensuite)
  console.log(`[Emargement] ${feuillesEnCours.length} feuille(s) en cours, ${feuillesPassees.length} feuille(s) passée(s) (PDF signés importés)`);

  const [feuilleId, setFeuilleId] = useState(toutesFeuilles[0]?.id ?? '');
  const [demiJourneeId, setDemiJourneeId] = useState(toutesFeuilles[0]?.demiJournees[0]?.id ?? '');
  
  const [validationConfirm, setValidationConfirm] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState('');

  // === Fiche d'intervention pour la feuille active ===
  const [ficheActive, setFicheActive] = useState<FicheIntervention | null>(null);
  const [ongletPrincipal, setOngletPrincipal] = useState<'presences' | 'intervention'>('presences');

  useEffect(() => {
    // Phase 4.b-bis : si une feuille est demandée via URL, la sélectionner en priorité
    if (feuilleIdUrl && toutesFeuilles.find(f => f.id === feuilleIdUrl)) {
      setFeuilleId(feuilleIdUrl);
      const f = toutesFeuilles.find(f => f.id === feuilleIdUrl)!;
      setDemiJourneeId(f.demiJournees[0]?.id ?? '');
      return;
    }
    // Sinon, sélectionner la première feuille disponible
    if (!toutesFeuilles.find(f => f.id === feuilleId) && toutesFeuilles[0]) {
      setFeuilleId(toutesFeuilles[0].id);
      setDemiJourneeId(toutesFeuilles[0].demiJournees[0]?.id ?? '');
    }
  }, [feuillesLocales.length, feuilleIdUrl, feuillesAccessiblesIds.length]);

  const feuille = toutesFeuilles.find(f => f.id === feuilleId);
  const dj = feuille?.demiJournees.find(d => d.id === demiJourneeId);

  // Charger ou créer la fiche d'intervention quand on change de feuille
  useEffect(() => {
    if (!feuille) {
      setFicheActive(null);
      return;
    }
    // Admin (PAMA/Betty) sans formateurId : on charge quand même la fiche en lecture seule.
    // Formateur : on charge/crée sa fiche normalement.
    if (!formateurId && !estAdmin) {
      setFicheActive(null);
      return;
    }
    (async () => {
      const fiche = await chargerOuCreerFiche(
        feuille.id,
        (feuille as any).sessionId ?? '',
        (feuille as any).sessionNumero ?? '',
        feuille.formation,
        feuille.date,
        feuille.jour,
        formateurId ?? '',
        monNomFormateur,
      );
      // Si la fiche n'a pas encore de formateur renseigné, on l'hérite du planning
      // (le formateur de la 1ère demi-journée, déjà résolu depuis le planning de session).
      if (!fiche.formateurId || !fiche.formateurNom) {
        const nomPlanning = feuille.demiJournees[0]?.formateur;
        if (nomPlanning && nomPlanning !== 'À définir') {
          const fMatch = formateurs.find(f => `${f.prenom} ${f.nom}` === nomPlanning || `${f.nom} ${f.prenom}` === nomPlanning);
          fiche.formateurNom = nomPlanning;
          if (fMatch) fiche.formateurId = fMatch.id;
        }
      }
      setFicheActive(fiche);
    })();
  }, [feuilleId, formateurId, monNomFormateur, estAdmin, formateurs.length]);

  function calculerHeures(statut: StatutPresence, heureArrivee?: string, heureDebut = '08:30', heureFin = '12:00'): number {
    if (statut === 'Présent' || statut === 'Absent justifié') return 3.5;
    if (statut === 'Absent') return 0;
    if (statut === 'Retard' && heureArrivee) {
      const [hA, mA] = heureArrivee.split(':').map(Number);
      const [hF, mF] = heureFin.split(':').map(Number);
      const minutesArrivee = hA * 60 + mA;
      const minutesFin = hF * 60 + mF;
      const minutesDuree = minutesFin - minutesArrivee;
      return Math.max(0, Math.round(minutesDuree / 60 * 4) / 4);
    }
    return 0;
  }

  function mettreAJourStatut(apprenantId: string, statut: StatutPresence, heureArrivee?: string) {
    if (!feuille || !dj) return;
    const estLocale = feuillesLocales.some(f => f.id === feuilleId);

    if (!estLocale) {
      alert("Les feuilles de démonstration ne peuvent pas être modifiées. Crée une nouvelle feuille depuis une session pour saisir les présences.");
      return;
    }

    setFeuillesLocales(prev => {
      const nouvelles = prev.map(f => {
        if (f.id !== feuilleId) return f;
        return {
          ...f,
          demiJournees: f.demiJournees.map(d => {
            if (d.id !== demiJourneeId) return d;
            return {
              ...d,
              presences: d.presences.map(p => {
                if (p.apprenantId !== apprenantId) return p;
                const heures = calculerHeures(statut, heureArrivee, d.heureDebut, d.heureFin);
                return { ...p, statut, heureArrivee: heureArrivee ?? p.heureArrivee, heuresComptees: heures };
              }),
            };
          }),
        };
      });
      localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
      // Supabase : envoi async de la feuille modifiée
      const feuilleModifiee = nouvelles.find(f => f.id === feuilleId);
      if (feuilleModifiee) {
        creerEmargementSupabase(feuilleModifiee as any).then(res => {
          if (!res.success) console.error(`[Emargement ${feuilleId}] Erreur Supabase :`, res.error);
          else console.log(`[Emargement ${feuilleId}] Statut mis à jour dans Supabase ✅`);
        });
      }
      return nouvelles;
    });
  }

  function rouvrirDemiJournee() {
    if (!feuille || !dj) return;
    if (!estAdmin) {
      alert('⚠️ Seule la directrice (PAMA) peut rouvrir une demi-journée validée.');
      return;
    }
    const estLocale = feuillesLocales.some(f => f.id === feuilleId);
    if (!estLocale) {
      alert('Les feuilles de démonstration ne peuvent pas être modifiées.');
      return;
    }
    if (!confirm(`⚠️ Rouvrir la demi-journée "${dj.type}" du ${feuille.date} ?\n\nCette action sera tracée dans l'historique pour traçabilité Qualiopi.\nLe formateur pourra modifier la saisie puis re-valider.`)) return;

    setFeuillesLocales(prev => {
      const nouvelles = prev.map(f => {
        if (f.id !== feuilleId) return f;
        return {
          ...f,
          demiJournees: f.demiJournees.map(d => {
            if (d.id !== demiJourneeId) return d;
            return { ...d, valide: false, heureValidation: undefined };
          }),
        };
      });
      localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
      // Supabase
      const feuilleModifiee = nouvelles.find(f => f.id === feuilleId);
      if (feuilleModifiee) {
        creerEmargementSupabase(feuilleModifiee as any).then(res => {
          if (!res.success) console.error(`[Emargement ${feuilleId}] Erreur réouverture Supabase :`, res.error);
          else console.log(`[Emargement ${feuilleId}] Demi-journée rouverte dans Supabase ✅`);
        });
      }
      return nouvelles;
    });

    // Traçage
    tracerAction(
      'REOUVERTURE_DEMI_JOURNEE',
      'emargement',
      `${feuilleId}_${demiJourneeId}`,
      `${feuille.formation} — ${feuille.jour} ${feuille.date} — ${dj.type}`,
      utilisateur,
    );

    setMessageSuccess(`↺ Demi-journée ${dj.type} rouverte par ${utilisateur?.prenom} ${utilisateur?.nom} — Action tracée`);
    setTimeout(() => setMessageSuccess(''), 6000);
  }

  function validerDemiJournee() {
    if (!feuille || !dj) return;
    const absentsOuRetards = dj.presences.filter(p => p.statut === 'Absent' || p.statut === 'Retard');
    const estLocale = feuillesLocales.some(f => f.id === feuilleId);

    if (estLocale) {
      setFeuillesLocales(prev => {
        const nouvelles = prev.map(f => {
          if (f.id !== feuilleId) return f;
          return {
            ...f,
            demiJournees: f.demiJournees.map(d => {
              if (d.id !== demiJourneeId) return d;
              return {
                ...d,
                valide: true,
                heureValidation: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                presences: d.presences.map(p => ({
                  ...p,
                  // emailEnvoye reste tel quel : il ne passera à true qu'après un envoi réel par l'admin
                })),
              };
            }),
          };
        });
        localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
        // Supabase
        const feuilleModifiee = nouvelles.find(f => f.id === feuilleId);
        if (feuilleModifiee) {
          creerEmargementSupabase(feuilleModifiee as any).then(res => {
            if (!res.success) console.error(`[Emargement ${feuilleId}] Erreur validation Supabase :`, res.error);
            else console.log(`[Emargement ${feuilleId}] Validation sauvegardée dans Supabase ✅`);
          });
        }
        return nouvelles;
      });
    }

    setValidationConfirm(false);
    const msgEmails = absentsOuRetards.length > 0
      ? ` ${absentsOuRetards.length} absence(s)/retard(s) à signaler aux entreprises — envoi géré par l'administration.`
      : '';
    setMessageSuccess(`✅ Demi-journée validée à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.${msgEmails}`);
    setTimeout(() => setMessageSuccess(''), 6000);
  }

  function creerNouvelleFeuille() {
    if (modaleForm.sessionIds.length === 0 || !modaleForm.date) return;
    const sessionsSelectionnees = modaleForm.sessionIds
      .map(id => sessions.find(s => s.id === id))
      .filter(Boolean);
    if (sessionsSelectionnees.length === 0) return;

    const parts = modaleForm.date.split('/');
    let jour = modaleForm.jour;
    if (!jour && parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      jour = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][d.getDay()];
    }

    const nouvelleFeuille = genererFeuilleDepuisSessions(sessionsSelectionnees as any[], modaleForm.date, jour, apprenants);

    setFeuillesLocales(prev => {
      const existante = prev.find(f => f.id === nouvelleFeuille.id);
      if (existante) {
        if (!confirm(`Une feuille existe déjà pour cette session à la date ${modaleForm.date}. La remplacer ?`)) return prev;
        const sansDoublon = prev.filter(f => f.id !== nouvelleFeuille.id);
        const nouvelles = [nouvelleFeuille, ...sansDoublon];
        localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
        // Supabase
        creerEmargementSupabase(nouvelleFeuille as any).then(res => {
          if (!res.success) console.error(`[Emargement ${nouvelleFeuille.id}] Erreur Supabase :`, res.error);
          else console.log(`[Emargement ${nouvelleFeuille.id}] Remplacée dans Supabase ✅`);
        });
        return nouvelles;
      }
      const nouvelles = [nouvelleFeuille, ...prev];
      localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
      // Supabase
      creerEmargementSupabase(nouvelleFeuille as any).then(res => {
        if (!res.success) console.error(`[Emargement ${nouvelleFeuille.id}] Erreur Supabase :`, res.error);
        else console.log(`[Emargement ${nouvelleFeuille.id}] Créée dans Supabase ✅`);
      });
      return nouvelles;
    });

    setFeuilleId(nouvelleFeuille.id);
    setDemiJourneeId(nouvelleFeuille.demiJournees[0].id);
    setModaleNouvelle(false);
    setModaleForm({ sessionIds: [], date: '', jour: '', formationCode: '' });
    const numeros = sessionsSelectionnees.map((s: any) => s.numero).join(' + ');
    setMessageSuccess(`✅ Nouvelle feuille créée pour ${numeros} — ${modaleForm.date} (${nouvelleFeuille.demiJournees[0].presences.length} apprenants)`);
    setTimeout(() => setMessageSuccess(''), 5000);
  }

  function supprimerFeuilleLocale(id: string) {
    if (!confirm('Supprimer cette feuille d\'émargement ?')) return;
    // Supabase
    supprimerEmargementSupabase(id).then(res => {
      if (!res.success) console.error(`[Emargement ${id}] Erreur suppression Supabase :`, res.error);
      else console.log(`[Emargement ${id}] Supprimée de Supabase ✅`);
    });
    // UI + localStorage
    setFeuillesLocales(prev => {
      const nouvelles = prev.filter(f => f.id !== id);
      localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
      return nouvelles;
    });
  }

  // === FONCTIONS FICHE INTERVENTION ===

  // Propage les motifs/durées de la fiche d'intervention vers les présences de l'émargement
  function pousserVersEmargement(retards: FicheIntervention['retards'], absences: FicheIntervention['absences']) {
    if (!feuille) return;
    const estLocale = feuillesLocales.some(f => f.id === feuilleId);
    if (!estLocale) return; // Pas de propagation sur feuilles de démo

    setFeuillesLocales(prev => {
      const nouvelles = prev.map(f => {
        if (f.id !== feuilleId) return f;
        return {
          ...f,
          demiJournees: f.demiJournees.map(d => ({
            ...d,
            presences: d.presences.map(p => {
              const ret = retards.find(r => r.apprenantId === p.apprenantId);
              if (ret) {
                return { ...p, motif: ret.motif, duree: ret.duree };
              }
              const abs = absences.find(a => a.apprenantId === p.apprenantId);
              if (abs) {
                const absAny = abs as any;
                return {
                  ...p,
                  motif: abs.motif,
                  justificatifNom: absAny.justificatifNom,
                  justificatifUrl: absAny.justificatifUrl,
                  justificatifCheminStorage: absAny.justificatifCheminStorage,
                  justificatifDateImport: absAny.justificatifDateImport,
                };
              }
              return p;
            }),
          })),
        };
      });
      localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
      // Supabase
      const feuilleModifiee = nouvelles.find(f => f.id === feuilleId);
      if (feuilleModifiee) {
        creerEmargementSupabase(feuilleModifiee as any).then(res => {
          if (!res.success) console.error(`[Emargement ${feuilleId}] Erreur sync fiche→émargement :`, res.error);
          else console.log(`[Emargement ${feuilleId}] Motifs synchronisés depuis fiche ✅`);
        });
      }
      return nouvelles;
    });
  }

  function majFiche(champ: keyof FicheIntervention, valeur: any) {
    if (!ficheActive) return;
    const updated = { ...ficheActive, [champ]: valeur };
    setFicheActive(updated);
    sauvegarderFiche(updated);
    // Si on modifie retards ou absences (motif/durée), on propage vers l'émargement
    if (champ === 'retards' || champ === 'absences') {
      pousserVersEmargement(
        champ === 'retards' ? valeur : updated.retards,
        champ === 'absences' ? valeur : updated.absences,
      );
    }
  }

  // Change le formateur de la fiche d'intervention + propage vers les demi-journées de l'émargement
  function changerFormateurFiche(formateurId: string, formateurNom: string) {
    if (!ficheActive || !feuille) return;
    // Maj fiche
    const updatedFiche = { ...ficheActive, formateurId, formateurNom };
    setFicheActive(updatedFiche);
    sauvegarderFiche(updatedFiche);
    // Propagation vers la feuille d'émargement (champ formateur des demi-journées)
    const estLocale = feuillesLocales.some(f => f.id === feuilleId);
    if (!estLocale) return;
    setFeuillesLocales(prev => {
      const nouvelles = prev.map(f => {
        if (f.id !== feuilleId) return f;
        return {
          ...f,
          demiJournees: f.demiJournees.map(d => ({ ...d, formateur: formateurNom })),
        };
      });
      localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
      const feuilleModifiee = nouvelles.find(f => f.id === feuilleId);
      if (feuilleModifiee) {
        creerEmargementSupabase(feuilleModifiee as any).then(res => {
          if (!res.success) console.error(`[Emargement ${feuilleId}] Erreur maj formateur:`, res.error);
          else console.log(`[Emargement ${feuilleId}] Formateur mis à jour : ${formateurNom} ✅`);
        });
      }
      return nouvelles;
    });
  }

  // Récupère le formateur depuis le planning de la session principale et le réenregistre
  // sur les demi-journées de la feuille (corrige les feuilles "À définir" anciennes).
  function rafraichirFormateurDepuisPlanning(feuilleCible: FeuilleEmargement) {
    if (!estAdmin) {
      alert('⚠️ Action réservée à la direction.');
      return;
    }
    // Session principale (1ère cochée) : son id est dans feuille.sessionId
    const sessionPrincipale = sessions.find(s => s.id === (feuilleCible as any).sessionId);
    if (!sessionPrincipale) {
      alert('⚠️ Session introuvable pour cette feuille — impossible de récupérer le formateur.');
      return;
    }
    const planningDuJour = sessionPrincipale.planning?.find((p: any) => p.date === feuilleCible.date);
    const nomPlanning = planningDuJour?.formateurNom;
    if (!nomPlanning) {
      alert(`⚠️ Aucun formateur renseigné dans le planning de ${sessionPrincipale.numero} à la date du ${feuilleCible.date}.\n\nVérifie le planning de la session.`);
      return;
    }
    if (!confirm(`Récupérer le formateur "${nomPlanning}" depuis le planning et l'appliquer aux deux demi-journées du ${feuilleCible.date} ?`)) return;

    setFeuillesLocales(prev => {
      const nouvelles = prev.map(f => {
        if (f.id !== feuilleCible.id) return f;
        return {
          ...f,
          demiJournees: f.demiJournees.map(d => ({ ...d, formateur: nomPlanning })),
        };
      });
      localStorage.setItem('easycfa_emargement_v2', JSON.stringify(nouvelles));
      const fMod = nouvelles.find(f => f.id === feuilleCible.id);
      if (fMod) {
        creerEmargementSupabase(fMod as any).then(res => {
          if (!res.success) console.error(`[Emargement ${feuilleCible.id}] Erreur rafraîchissement formateur:`, res.error);
          else console.log(`[Emargement ${feuilleCible.id}] Formateur rafraîchi : ${nomPlanning} ✅`);
        });
      }
      return nouvelles;
    });

    tracerAction('RAFRAICHIR_FORMATEUR', 'emargement', feuilleCible.id,
      `${feuilleCible.formation} — ${feuilleCible.date} — formateur ${nomPlanning}`, utilisateur);

    setMessageSuccess(`✅ Formateur "${nomPlanning}" récupéré depuis le planning pour le ${feuilleCible.date}.`);
    setTimeout(() => setMessageSuccess(''), 6000);
  }

  // Upload justificatif pour une absence
  async function uploadJustificatifAbsence(idxAbsence: number, file: File) {
    if (!ficheActive || !feuille) return;
    const abs = ficheActive.absences[idxAbsence];
    if (!abs) return;
    const chemin = cheminStorage('justificatifs', feuille.id, `${abs.apprenantId}_justif`, file.name);
    const resUpload = await uploaderFichier(chemin, file);
    if (!resUpload.success || !resUpload.fichier) {
      alert(`⚠️ Erreur upload : ${resUpload.error}`);
      return;
    }
    console.log(`[Justificatif] ${abs.prenom} ${abs.nom} uploadé vers Storage ✅`);
    const nouvellesAbsences = [...ficheActive.absences];
    nouvellesAbsences[idxAbsence] = {
      ...abs,
      justificatifNom: resUpload.fichier.nom,
      justificatifUrl: resUpload.fichier.url,
      justificatifCheminStorage: resUpload.fichier.cheminStorage,
      justificatifDateImport: new Date().toISOString(),
    } as any;
    majFiche('absences', nouvellesAbsences);
  }

  // Synchroniser les retards et absences depuis les présences (deux demi-journées)
  // La fiche fait foi pour motif/duree (saisis manuellement), l'émargement fait foi pour statut/heureArrivee
  function synchroniserIncidents() {
    if (!feuille || !ficheActive) return;
    const tousRetards: typeof ficheActive.retards = [];
    const tousAbsents: typeof ficheActive.absences = [];
    feuille.demiJournees.forEach(djItem => {
      djItem.presences.forEach(p => {
        if (p.statut === 'Retard') {
          const existant = ficheActive.retards.find(r => r.apprenantId === p.apprenantId);
          if (!tousRetards.find(r => r.apprenantId === p.apprenantId)) {
            tousRetards.push({
              apprenantId: p.apprenantId,
              nom: p.nom,
              prenom: p.prenom,
              heureArrivee: p.heureArrivee || '',
              duree: existant?.duree || p.duree || '',
              motif: existant?.motif || p.motif || '',
            });
          }
        }
        if (p.statut === 'Absent' || p.statut === 'Absent justifié') {
          const existant = ficheActive.absences.find(a => a.apprenantId === p.apprenantId);
          if (!tousAbsents.find(a => a.apprenantId === p.apprenantId)) {
            tousAbsents.push({
              apprenantId: p.apprenantId,
              nom: p.nom,
              prenom: p.prenom,
              motif: existant?.motif || p.motif || '',
            });
          }
        }
      });
    });
    const updated = { ...ficheActive, retards: tousRetards, absences: tousAbsents };
    setFicheActive(updated);
    sauvegarderFiche(updated);
  }

  // Synchroniser auto quand on ouvre l'onglet intervention
  useEffect(() => {
    if (ongletPrincipal === 'intervention' && ficheActive && !ficheActive.certifiee) {
      synchroniserIncidents();
    }
  }, [ongletPrincipal, feuilleId]);

  async function signerFiche() {
    if (!ficheActive || !feuille) return;
    const check = ficheCompletee(ficheActive);
    if (!check.ok) {
      alert(`⚠️ Champs obligatoires manquants :\n\n${check.manquants.join(', ')}\n\nMerci de compléter avant de signer.`);
      return;
    }
    if (!ficheActive.certifiee) {
      alert("⚠️ Veuillez cocher 'Je certifie l'exactitude des informations' avant de signer.");
      return;
    }
    const maintenant = new Date();
    const updated: FicheIntervention = {
      ...ficheActive,
      dateSignature: maintenant.toISOString(),
      heureSignature: maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setFicheActive(updated);
    sauvegarderFiche(updated);
    setMessageSuccess(`✅ Fiche signée à ${updated.heureSignature} — Génération des PDF...`);

    // Génération et envoi automatique des PDF
    try {
      // Choisir la 1ère demi-journée non vide pour le PDF émargement (ou la première par défaut)
      const djPourPdf = feuille.demiJournees.find(d => d.presences.length > 0) || feuille.demiJournees[0];

      // Génération PDF émargement
      const blobEmargement = await pdf(<PdfEmargement feuille={feuille} demiJournee={djPourPdf} />).toBlob();
      const base64Emargement = await blobToBase64(blobEmargement);

      // Génération PDF fiche d'intervention
      const blobFiche = await pdf(<PdfFicheIntervention fiche={updated} />).toBlob();
      const base64Fiche = await blobToBase64(blobFiche);

      const nomEmargement = `Emargement_${feuille.formation.replace(/\s/g, '_')}_${feuille.date.replace(/\//g, '-')}.pdf`;
      const nomFiche = `Fiche_Intervention_${updated.formateurNom.replace(/\s/g, '_')}_${feuille.date.replace(/\//g, '-')}.pdf`;

      // Envoi via l'API
      setMessageSuccess(`📧 Envoi en cours vers pedagogie@pamoi.re...`);
      const res = await fetch('/api/envoyer-fiche-signee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formateurNom: updated.formateurNom,
          formation: feuille.formation,
          date: feuille.date,
          jour: feuille.jour,
          pdfEmargementBase64: base64Emargement,
          pdfEmargementNom: nomEmargement,
          pdfFicheBase64: base64Fiche,
          pdfFicheNom: nomFiche,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error('[signerFiche] Erreur envoi email:', data.error);
        alert(`⚠️ Fiche signée mais erreur d'envoi email : ${data.error}\n\nLa fiche reste signée. Tu peux relancer l'envoi plus tard.`);
        setMessageSuccess(`✅ Fiche signée — ⚠️ Erreur envoi email`);
      } else {
        console.log('[signerFiche] Email envoyé ✅', data.emailId);
        setMessageSuccess(`✅ Fiche signée + email envoyé à pedagogie@pamoi.re ✉️`);
      }
    } catch (e: any) {
      console.error('[signerFiche] Erreur génération/envoi:', e);
      alert(`⚠️ Fiche signée mais erreur génération PDF : ${e.message}`);
      setMessageSuccess(`✅ Fiche signée — ⚠️ Erreur génération PDF`);
    }
    setTimeout(() => setMessageSuccess(''), 8000);
  }

  // Helper : convertit un Blob en string base64 (sans le préfixe data:application/pdf;base64,)
  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Format: "data:application/pdf;base64,XXXXX" → on garde juste XXXXX
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function annulerSignature() {
    if (!ficheActive) return;
    if (!confirm("Annuler la signature de cette fiche ? Tu pourras la re-signer après modifications.")) return;
    const updated: FicheIntervention = {
      ...ficheActive,
      certifiee: false,
      dateSignature: undefined,
      heureSignature: undefined,
    };
    setFicheActive(updated);
    sauvegarderFiche(updated);
  }

  const nbPresents = dj?.presences.filter(p => p.statut === 'Présent').length ?? 0;
  const nbAbsents = dj?.presences.filter(p => p.statut === 'Absent').length ?? 0;
  const nbRetards = dj?.presences.filter(p => p.statut === 'Retard').length ?? 0;
  const nbNonSaisis = dj?.presences.filter(p => p.statut === 'Non saisi').length ?? 0;
  const totalHeures = dj?.presences.reduce((acc, p) => acc + p.heuresComptees, 0) ?? 0;

  const sessionsDispo = sessions.filter(s => s.statut === 'À venir' || s.statut === 'En cours');

  // Sessions de la formation sélectionnée
  const sessionsMemeFormation = modaleForm.formationCode
    ? sessionsDispo.filter(s => s.formation === modaleForm.formationCode)
    : [];

  // Liste des formations disponibles (avec compteur de sessions actives)
  const formationsDispo = Array.from(new Set(sessionsDispo.map(s => s.formation))).filter(Boolean).sort();

  // Dates dispo : on prend les dates de TOUTES les sessions cochées, fusionnées (dédupliquées)
  const sessionsCochees = modaleForm.sessionIds.map(id => sessions.find(s => s.id === id)).filter(Boolean);
  const datesMap = new Map<string, { date: string; type: string; jour: string }>();
  sessionsCochees.forEach((s: any) => {
    s.planning?.forEach((p: any) => {
      if (datesMap.has(p.date)) return;
      const parts = p.date.split('/');
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const jour = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][d.getDay()];
      datesMap.set(p.date, { date: p.date, type: p.type, jour });
    });
  });
  const datesDispo = Array.from(datesMap.values()).sort((a, b) => {
    const pa = a.date.split('/'); const pb = b.date.split('/');
    return new Date(`${pa[2]}-${pa[1]}-${pa[0]}`).getTime() - new Date(`${pb[2]}-${pb[1]}-${pb[0]}`).getTime();
  });

  const ficheSignee = !!ficheActive?.dateSignature;
  const ficheCheck = ficheActive ? ficheCompletee(ficheActive) : { ok: false, manquants: [] };

  // Référentiel AT/CP de la formation de la feuille active (pour les listes déroulantes de la fiche)
  const refFormation = feuille ? trouverReferentiel((feuille as any).formationCode) : null;
  const { ats: atsDispo, cps: cpsDispo } = refFormation ? construireAtEtCp(refFormation) : { ats: [], cps: [] };
  // Index du CCP correspondant à l'AT actuellement choisi dans la fiche (pour filtrer les CP)
  const idxCcpChoisi = (() => {
    if (!ficheActive?.activiteType) return -1;
    const at = atsDispo.find(a => ficheActive.activiteType.startsWith(a.code));
    return at ? at.idxCcp : -1;
  })();
  const cpsFiltres = idxCcpChoisi >= 0 ? cpsDispo.filter(c => c.idxCcp === idxCcpChoisi) : cpsDispo;

  // Phase 4.b-bis : si l'utilisateur est formateur, on enveloppe avec la sidebar formateur
  const contenuPage = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>Feuilles d'émargement</h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Saisie des présences par demi-journée — Envoi automatique des alertes absence</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Bouton "Retour Mes séances" — uniquement pour le formateur */}
          {estFormateur && (
            <Link
              href="/formateur/seances"
              style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}
            >
              ← Mes séances
            </Link>
          )}
          {/* Boutons admin — masqués pour le formateur */}
          {!estFormateur && (
            <button onClick={() => setModaleNouvelle(true)} style={btnPrimary}>+ Nouvelle feuille depuis session</button>
          )}
          {feuille && dj && !estFormateur && (
            <BoutonPdfEmargement feuille={feuille} demiJournee={dj} nomFichier={`Emargement_${feuille.formation.replace(/\s/g, '_')}_${feuille.date.replace(/\//g, '-')}_${dj.type}.pdf`} />
          )}
          {!estFormateur && (
            <a href="/emargement/mensuel" style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>📊 États mensuels</a>
          )}
        </div>
      </div>

      {messageSuccess && (
        <div style={{ padding: '14px 16px', backgroundColor: '#e6f4f1', borderRadius: '8px', borderLeft: `4px solid ${COLORS.primary}`, marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          {messageSuccess}
        </div>
      )}

      {toutesFeuilles.length === 0 ? (
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '8px' }}>Aucune feuille d'émargement</h2>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Crée une feuille d'émargement depuis une session active pour commencer.</p>
            <button onClick={() => setModaleNouvelle(true)} style={btnPrimary}>+ Créer ma première feuille</button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>

          {/* PANNEAU GAUCHE — Liste des feuilles + demi-journée */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary }}>Journées en cours</h2>
                <span style={{ backgroundColor: '#EAF4F3', color: COLORS.primary, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>{feuillesEnCours.length}</span>
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {feuillesEnCours.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '12px', fontStyle: 'italic' }}>
                    Aucune journée en cours
                  </div>
                ) : feuillesEnCours.map((f) => {
                  const isLocale = !!feuillesLocales.find(fl => fl.id === f.id);
                  return (
                    <div key={f.id} onClick={() => { setFeuilleId(f.id); setDemiJourneeId(f.demiJournees[0].id); setOngletPrincipal('presences'); }} style={{
                      width: '100%', padding: '10px 12px',
                      backgroundColor: feuilleId === f.id ? COLORS.background : 'transparent',
                      border: feuilleId === f.id ? `1.5px solid ${COLORS.primary}` : '1.5px solid #e0e0e0',
                      borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary }}>{f.jour} {f.date}</div>
                          <div style={{ fontSize: '11px', color: COLORS.textMuted }}>
                            {(f as any).sessionNumero ? `${(f as any).sessionNumero} — ` : ''}{f.formation}
                          </div>
                        </div>
                        {isLocale && !estFormateur && (
                          <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); supprimerFeuilleLocale(f.id); }}
                            style={{ backgroundColor: '#fde8e8', color: '#e53e3e', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', cursor: 'pointer', marginLeft: '4px', display: 'inline-block', userSelect: 'none' }}
                          >✕</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {f.demiJournees.map(djItem => (
                          <span key={djItem.id} style={{ backgroundColor: djItem.valide ? '#e6f4f1' : '#fef6e4', color: djItem.valide ? '#006B68' : '#C8A23A', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>
                            {djItem.type === 'Matin' ? '🌅' : '🌇'} {djItem.valide ? '✅' : '⏳'}
                          </span>
                        ))}
                        {isLocale && (
                          <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '700' }}>📅 Session</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            </div>

          {/* PANNEAU DROIT — Détail */}
          {feuille && dj ? (
            <div>
              {/* En-tête feuille */}
              <Card style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                      {(feuille as any).sessionNumero ? `${(feuille as any).sessionNumero} — ` : ''}{feuille.formation} — {feuille.jour} {feuille.date}
                    </h2>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: COLORS.textMuted, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>🕐 {dj.heureDebut} – {dj.heureFin}</span>
                      <span>👨‍🏫 {dj.formateur}</span>
                      {dj.formateur === 'À définir' && estAdmin && !estFormateur && (
                        <button
                          onClick={() => rafraichirFormateurDepuisPlanning(feuille)}
                          style={{ backgroundColor: '#C8A23A', color: 'white', border: 'none', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                          title="Récupérer le formateur depuis le planning de la session"
                        >🔄 Récupérer le formateur</button>
                      )}
                      <span>📚 {dj.theme}</span>
                      <span>🏫 {dj.modalite}</span>
                      <span>📍 {feuille.salle}</span>
                    </div>
                  </div>
                  {dj.valide && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                        ✅ Validé à {dj.heureValidation}
                      </span>
                      {peutModifier && !estFormateur && (() => {
                        const aEnvoyer = dj.presences.filter(p => (p.statut === 'Absent' || p.statut === 'Retard' || p.statut === 'Absent justifié') && !p.emailEnvoye).length;
                        if (aEnvoyer === 0) return null;
                        return (
                          <button
                            onClick={() => envoyerAlertesAbsence(feuille, dj)}
                            disabled={envoiEnCours}
                            style={{ backgroundColor: '#3a5bc7', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: envoiEnCours ? 'wait' : 'pointer', opacity: envoiEnCours ? 0.6 : 1 }}
                          >
                            {envoiEnCours ? '⏳ Envoi…' : `📧 Envoyer ${aEnvoyer} alerte(s) aux entreprises`}
                          </button>
                        );
                      })()}
                      {peutModifier && !estFormateur && (
                        (dj as any).pdfSigneUrl ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>📄 Émargement signé</span>
                            <a href={(dj as any).pdfSigneUrl} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary, fontSize: '12px', fontWeight: '600', textDecoration: 'underline' }}>Consulter</a>
                            <label style={{ color: '#888', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>
                              Remplacer
                              <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) importerPdfSigne(feuille, dj, file); e.target.value = ''; }} />
                            </label>
                          </span>
                        ) : (
                          <label style={{ backgroundColor: '#006B68', color: 'white', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }}>
                            📎 Importer l'émargement signé
                            <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) importerPdfSigne(feuille, dj, file); e.target.value = ''; }} />
                          </label>
                        )
                      )}
                      {estAdmin && (
                        <button onClick={rouvrirDemiJournee} style={{ backgroundColor: 'white', color: '#c53030', border: '1.5px solid #c53030', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          ↺ Rouvrir
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Sélection demi-journée — horizontale, au-dessus du détail */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {feuille.demiJournees.map((d) => (
                  <div key={d.id} onClick={() => setDemiJourneeId(d.id)} style={{
                    flex: 1, padding: '10px 14px', cursor: 'pointer',
                    backgroundColor: demiJourneeId === d.id ? COLORS.background : 'white',
                    border: demiJourneeId === d.id ? `2px solid ${COLORS.primary}` : '1.5px solid #e0e0e0',
                    borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary }}>
                        {d.type === 'Matin' ? '🌅' : '🌇'} {d.type}
                      </span>
                      <span style={{ backgroundColor: d.valide ? '#e6f4f1' : '#fef6e4', color: d.valide ? '#006B68' : '#C8A23A', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                        {d.valide ? '✅ Validé' : '⏳ En attente'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '4px' }}>
                      {d.heureDebut} – {d.heureFin} ({d.heures}h) — {d.theme}
                    </div>
                  </div>
                ))}
              </div>

              {/* ===== ONGLETS PRÉSENCES / FICHE INTERVENTION ===== */}
              {(formateurId || estAdmin) && (
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid #EAF4F3' }}>
                  <button
                    onClick={() => setOngletPrincipal('presences')}
                    style={{
                      padding: '12px 24px', fontSize: '13px', fontWeight: '700', border: 'none',
                      borderBottom: ongletPrincipal === 'presences' ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                      backgroundColor: 'transparent', color: ongletPrincipal === 'presences' ? COLORS.primary : '#888',
                      cursor: 'pointer', marginBottom: '-2px',
                    }}
                  >
                    ✅ Présences
                  </button>
                  <button
                    onClick={() => setOngletPrincipal('intervention')}
                    style={{
                      padding: '12px 24px', fontSize: '13px', fontWeight: '700', border: 'none',
                      borderBottom: ongletPrincipal === 'intervention' ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                      backgroundColor: 'transparent', color: ongletPrincipal === 'intervention' ? COLORS.primary : '#888',
                      cursor: 'pointer', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    📝 Ma fiche d'intervention
                    {ficheSignee && <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>✅ Signée</span>}
                    {!ficheSignee && ficheActive && !ficheCheck.ok && <span style={{ backgroundColor: '#fef6e4', color: '#7a5c00', padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700' }}>⚠️ À compléter</span>}
                  </button>
                </div>
              )}

              {/* ===== ONGLET PRÉSENCES (existant) ===== */}
              {ongletPrincipal === 'presences' && (
                <>
                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { label: 'Présents', value: nbPresents, color: '#006B68', bg: '#e6f4f1' },
                      { label: 'Absents', value: nbAbsents, color: '#e53e3e', bg: '#fde8e8' },
                      { label: 'Retards', value: nbRetards, color: '#C8A23A', bg: '#fef6e4' },
                      { label: 'Non saisis', value: nbNonSaisis, color: '#888', bg: '#f0f0f0' },
                      { label: 'Total heures', value: `${totalHeures}h`, color: COLORS.primary, bg: COLORS.background },
                    ].map((s) => (
                      <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <Card style={{ marginBottom: '16px' }}>
                    {dj.presences.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                        Aucun apprenant inscrit à cette session. Va dans <a href="/sessions" style={{ color: COLORS.primary, fontWeight: '700' }}>Sessions</a> → onglet 👥 Apprenants pour les ajouter.
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                            {['Apprenant', 'Entreprise', 'Statut', 'Heure arrivée', 'Heures comptées', 'Email envoyé', 'Justificatif', 'Actions'].map((col) => (
                              <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dj.presences.map((p) => {
                            const s = STATUT_STYLE[p.statut];
                            return (
                              <tr key={p.apprenantId} style={{ borderBottom: `1px solid ${COLORS.border}`, backgroundColor: p.statut === 'Absent' ? '#fffbfb' : p.statut === 'Retard' ? '#fffdf0' : 'white' }}>
                                <td style={{ padding: '12px 10px', fontSize: '14px', fontWeight: '700' }}>
                                  <a href={`/apprenants/${p.apprenantId}`} style={{ color: COLORS.text, textDecoration: 'none' }}>{p.prenom} {p.nom}</a>
                                </td>
                                <td style={{ padding: '12px 10px', fontSize: '12px', color: COLORS.textMuted }}>{p.entreprise}</td>
                                <td style={{ padding: '12px 10px' }}>
                                  <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                    {s.icon} {p.statut}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 10px' }}>
                                  {p.statut === 'Retard' ? (
                                    <input type="time" defaultValue={p.heureArrivee} disabled={dj.valide} onChange={(e) => mettreAJourStatut(p.apprenantId, 'Retard', e.target.value)} style={{ ...inputStyle, width: '100px', padding: '4px 8px', fontSize: '12px' }} />
                                  ) : (
                                    <span style={{ fontSize: '12px', color: '#aaa' }}>—</span>
                                  )}
                                </td>
                                <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '700', color: p.heuresComptees > 0 ? COLORS.primary : '#e53e3e', textAlign: 'center' }}>{p.heuresComptees}h</td>
                                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                  {p.emailEnvoye ? <span style={{ color: COLORS.primary, fontSize: '12px', fontWeight: '600' }}>✅ Envoyé</span> : <span style={{ color: '#aaa', fontSize: '12px' }}>—</span>}
                                </td>
                                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                  {(p.statut === 'Absent' || p.statut === 'Retard') ? (
                                    <span style={{ backgroundColor: p.justificatifRecu ? '#e6f4f1' : '#fde8e8', color: p.justificatifRecu ? '#006B68' : '#e53e3e', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                                      {p.justificatifRecu ? '✅ Reçu' : '⏳ En attente'}
                                    </span>
                                  ) : <span style={{ color: '#aaa', fontSize: '12px' }}>—</span>}
                                </td>
                                <td style={{ padding: '12px 10px' }}>
                                  {!dj.valide && (
                                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                      {(['Présent', 'Absent', 'Retard'] as StatutPresence[]).map((statut) => (
                                        <button key={statut} onClick={() => mettreAJourStatut(p.apprenantId, statut)} style={{
                                          backgroundColor: p.statut === statut ? STATUT_STYLE[statut].color : '#f0f0f0',
                                          color: p.statut === statut ? 'white' : '#555',
                                          border: 'none', borderRadius: '5px', padding: '3px 7px',
                                          fontSize: '10px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                                        }}>
                                          {STATUT_STYLE[statut].icon} {statut}
                                        </button>
                                      ))}
                                      
                                    </div>
                                  )}
                                  {dj.valide && <span style={{ fontSize: '11px', color: '#aaa' }}>Feuille validée</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </Card>

                  {!dj.valide && dj.presences.length > 0 && (
                    <Card>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                            Valider la feuille d'émargement — {dj.type}
                          </div>
                          <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                            {nbNonSaisis > 0 ? `⚠️ ${nbNonSaisis} présence(s) non saisie(s)` : `✅ Toutes les présences sont saisies`}
                          </div>
                          {(nbAbsents + nbRetards) > 0 && (
                            <div style={{ fontSize: '12px', color: '#e53e3e', marginTop: '4px', fontWeight: '600' }}>
                              📧 {nbAbsents + nbRetards} absence(s)/retard(s) à signaler — l'administration enverra les emails aux entreprises
                            </div>
                          )}
                          
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!validationConfirm ? (
                            <button onClick={() => setValidationConfirm(true)} disabled={nbNonSaisis > 0} style={{ ...btnPrimary, opacity: nbNonSaisis > 0 ? 0.5 : 1, cursor: nbNonSaisis > 0 ? 'not-allowed' : 'pointer' }}>
                              ✅ Valider la demi-journée
                            </button>
                          ) : (
                            <>
                              <div style={{ fontSize: '13px', color: '#e53e3e', fontWeight: '600', alignSelf: 'center' }}>Confirmer ?</div>
                              <button onClick={validerDemiJournee} style={btnDanger}>Oui, valider</button>
                              <button onClick={() => setValidationConfirm(false)} style={btnSecondary}>Annuler</button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {/* ===== ONGLET FICHE INTERVENTION (NOUVEAU) ===== */}
              {ongletPrincipal === 'intervention' && ficheActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* En-tête fiche signée ou pas */}
                  {ficheSignee ? (
                    <div style={{ padding: '14px 16px', backgroundColor: '#dcfce7', borderRadius: '10px', border: '2px solid #16a34a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#15803d', marginBottom: '4px' }}>
                          ✅ Fiche d'intervention signée par {ficheActive.formateurNom}
                        </div>
                        <div style={{ fontSize: '12px', color: '#15803d' }}>
                          Signée le {new Date(ficheActive.dateSignature!).toLocaleDateString('fr-FR')} à {ficheActive.heureSignature}
                        </div>
                      </div>
                              {estAdmin && (
                        <button onClick={annulerSignature} style={{ ...btnSecondary, color: '#15803d', borderColor: '#15803d' }}>
                          ✏️ Modifier (annuler signature)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '14px 16px', backgroundColor: '#fef6e4', borderRadius: '10px', border: '1.5px solid #C8A23A', fontSize: '12px', color: '#7a5c00' }}>
                      ℹ️ Cette fiche d'intervention pédagogique sera signée électroniquement et envoyée à <strong>pedagogie@pamoi.re</strong> après validation. Tous les champs marqués <span style={{ color: '#e53e3e' }}>*</span> sont obligatoires (Qualiopi).
                    </div>
                  )}

                  {/* SECTION 1 — Identification pédagogique */}
                  <Card>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '14px' }}>
                      📋 Identification pédagogique
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Activité Type <span style={{ color: '#e53e3e' }}>*</span></label>
                        <select
                          disabled={ficheSignee || atsDispo.length === 0}
                          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                          value={ficheActive.activiteType || ''}
                          onChange={e => {
                            // Changer d'AT réinitialise la compétence (les CP dépendent de l'AT)
                            majFiche('activiteType', e.target.value);
                            if (ficheActive.competence) majFiche('competence', '');
                          }}
                        >
                          <option value="">{atsDispo.length === 0 ? '— Aucun référentiel trouvé —' : '— Sélectionner une AT —'}</option>
                          {atsDispo.map(at => (
                            <option key={at.code} value={`${at.code} — ${at.libelle}`}>{at.code} — {at.libelle}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Compétence <span style={{ color: '#e53e3e' }}>*</span></label>
                        <select
                          disabled={ficheSignee || !ficheActive.activiteType}
                          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                          value={ficheActive.competence || ''}
                          onChange={e => majFiche('competence', e.target.value)}
                        >
                          <option value="">{!ficheActive.activiteType ? '— Choisir d\'abord une AT —' : '— Sélectionner une CP —'}</option>
                          {cpsFiltres.map(cp => (
                            <option key={cp.code} value={`${cp.code} — ${cp.libelle}`}>{cp.code} — {cp.libelle}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Séance <span style={{ color: '#e53e3e' }}>*</span></label>
                        <input type="text" disabled={ficheSignee} style={inputStyle} value={ficheActive.seance} onChange={e => majFiche('seance', e.target.value)} placeholder="ex: Séance 5" />
                      </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>👨‍🏫 Formateur de la séance <span style={{ color: '#e53e3e' }}>*</span></label>
                      <select
                        disabled={ficheSignee}
                        style={{ ...inputStyle, width: '100%', maxWidth: '400px' }}
                        value={ficheActive.formateurId || ''}
                        onChange={(e) => {
                          const id = e.target.value;
                          const f = formateurs.find((fo: any) => fo.id === id);
                          if (f) {
                            changerFormateurFiche(id, `${f.prenom} ${f.nom}`);
                          }
                        }}
                      >
                        <option value="">— Sélectionner un formateur —</option>
                        {formateurs
                          .filter((f: any) => f.actif !== false)
                          .sort((a: any, b: any) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`))
                          .map((f: any) => (
                            <option key={f.id} value={f.id}>
                              {f.nom} {f.prenom}{f.email ? ` — ${f.email}` : ''}
                            </option>
                          ))
                        }
                      </select>
                      {!ficheActive.formateurId && (
                        <div style={{ fontSize: '11px', color: '#C8A23A', marginTop: '4px', fontStyle: 'italic' }}>
                          ⚠️ Sélectionne ton nom pour recevoir les rappels et notifications par email
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* SECTION 2 — Contenu pédagogique */}
                  <Card>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '14px' }}>
                      📚 Contenu pédagogique
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>1. Objectifs de la séance <span style={{ color: '#e53e3e' }}>*</span></label>
                        <textarea disabled={ficheSignee} style={textareaStyle} value={ficheActive.objectifsSeance} onChange={e => majFiche('objectifsSeance', e.target.value)} placeholder="Décrire les objectifs pédagogiques visés..." />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>2. Contenus vus durant la séance <span style={{ color: '#e53e3e' }}>*</span></label>
                        <textarea disabled={ficheSignee} style={textareaStyle} value={ficheActive.contenusVus} onChange={e => majFiche('contenusVus', e.target.value)} placeholder="Notions abordées, exercices réalisés..." />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>3. Évaluation réalisée ? <span style={{ color: '#e53e3e' }}>*</span></label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: ficheSignee ? 'default' : 'pointer', padding: '8px 12px', borderRadius: '8px', backgroundColor: ficheActive.evaluationRealisee === 'OUI' ? '#dcfce7' : '#f0f0f0', flex: 1 }}>
                              <input type="radio" disabled={ficheSignee} name="eval" checked={ficheActive.evaluationRealisee === 'OUI'} onChange={() => majFiche('evaluationRealisee', 'OUI')} />
                              <span style={{ fontSize: '13px', fontWeight: '700', color: ficheActive.evaluationRealisee === 'OUI' ? '#15803d' : '#555' }}>OUI</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: ficheSignee ? 'default' : 'pointer', padding: '8px 12px', borderRadius: '8px', backgroundColor: ficheActive.evaluationRealisee === 'NON' ? '#fde8e8' : '#f0f0f0', flex: 1 }}>
                              <input type="radio" disabled={ficheSignee} name="eval" checked={ficheActive.evaluationRealisee === 'NON'} onChange={() => majFiche('evaluationRealisee', 'NON')} />
                              <span style={{ fontSize: '13px', fontWeight: '700', color: ficheActive.evaluationRealisee === 'NON' ? '#e53e3e' : '#555' }}>NON</span>
                            </label>
                          </div>
                        </div>
                        {ficheActive.evaluationRealisee === 'OUI' && (
                          <div>
                            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>4. Format de l'évaluation <span style={{ color: '#e53e3e' }}>*</span></label>
                            <input type="text" disabled={ficheSignee} style={inputStyle} value={ficheActive.formatEvaluation} onChange={e => majFiche('formatEvaluation', e.target.value)} placeholder="ex: QCM, étude de cas, mise en situation..." />
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>5. Outils utilisés <span style={{ color: '#e53e3e' }}>*</span></label>
                        <textarea disabled={ficheSignee} style={{ ...textareaStyle, minHeight: '50px' }} value={ficheActive.outils} onChange={e => majFiche('outils', e.target.value)} placeholder="ex: PowerPoint, paperboard, Excel, EBP Compta..." />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>6. Ressources de synthèse (URL Google Drive, ...)</label>
                        <input type="url" disabled={ficheSignee} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} value={ficheActive.ressourcesUrl} onChange={e => majFiche('ressourcesUrl', e.target.value)} placeholder="https://drive.google.com/..." />
                        {(ficheActive.ressourcesSupplementaires || []).map((ressource, idx) => (
                          <div key={idx} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '10px', marginTop: '8px', backgroundColor: '#fafafa' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  disabled={ficheSignee}
                                  onClick={() => {
                                    const nouvelles = [...(ficheActive.ressourcesSupplementaires || [])];
                                    nouvelles[idx] = { type: 'lien', valeur: '' };
                                    majFiche('ressourcesSupplementaires', nouvelles);
                                  }}
                                  style={{ backgroundColor: ressource.type === 'lien' ? COLORS.primary : '#f0f0f0', color: ressource.type === 'lien' ? 'white' : '#555', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: ficheSignee ? 'default' : 'pointer' }}
                                >🔗 Lien</button>
                                <button
                                  disabled={ficheSignee}
                                  onClick={() => {
                                    const nouvelles = [...(ficheActive.ressourcesSupplementaires || [])];
                                    nouvelles[idx] = { type: 'pdf', valeur: '' };
                                    majFiche('ressourcesSupplementaires', nouvelles);
                                  }}
                                  style={{ backgroundColor: ressource.type === 'pdf' ? COLORS.primary : '#f0f0f0', color: ressource.type === 'pdf' ? 'white' : '#555', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: ficheSignee ? 'default' : 'pointer' }}
                                >📎 PDF</button>
                              </div>
                              {!ficheSignee && (
                                <button
                                  onClick={() => {
                                    const nouvelles = (ficheActive.ressourcesSupplementaires || []).filter((_, i) => i !== idx);
                                    majFiche('ressourcesSupplementaires', nouvelles);
                                  }}
                                  style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '6px', padding: '4px 9px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                  title="Retirer cette ressource"
                                >✕</button>
                              )}
                            </div>
                            {ressource.type === 'lien' ? (
                              <input
                                type="url"
                                disabled={ficheSignee}
                                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                                value={ressource.valeur}
                                onChange={e => {
                                  const nouvelles = [...(ficheActive.ressourcesSupplementaires || [])];
                                  nouvelles[idx] = { ...ressource, valeur: e.target.value };
                                  majFiche('ressourcesSupplementaires', nouvelles);
                                }}
                                placeholder="https://..."
                              />
                            ) : (
                              ressource.valeur ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                                  <span style={{ color: '#15803d', fontWeight: '600' }}>📄 {ressource.nomFichier || 'Fichier importé'}</span>
                                  <a href={ressource.valeur} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary, fontWeight: '600', textDecoration: 'underline' }}>Consulter</a>
                                </div>
                              ) : (
                                <label style={{ backgroundColor: '#006B68', color: 'white', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: ficheSignee ? 'default' : 'pointer', display: 'inline-block' }}>
                                  📎 Importer un PDF
                                  <input type="file" accept="application/pdf" disabled={ficheSignee} style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) importerPdfRessource(idx, file); e.target.value = ''; }} />
                                </label>
                              )
                            )}
                          </div>
                        ))}
                        {!ficheSignee && (
                          <button
                            onClick={() => majFiche('ressourcesSupplementaires', [...(ficheActive.ressourcesSupplementaires || []), { type: 'lien', valeur: '' }])}
                            style={{ ...btnSecondary, marginTop: '8px', fontSize: '12px', padding: '6px 12px' }}
                          >+ Ajouter une ressource</button>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>7. Lien si séance en distanciel (Zoom, Meet...)</label>
                        <input type="url" disabled={ficheSignee} style={inputStyle} value={ficheActive.lienDistanciel} onChange={e => majFiche('lienDistanciel', e.target.value)} placeholder="https://meet.google.com/..." />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>8. Difficultés rencontrées</label>
                        <textarea disabled={ficheSignee} style={textareaStyle} value={ficheActive.difficultes} onChange={e => majFiche('difficultes', e.target.value)} placeholder="Difficultés des apprenants, problèmes techniques, points à clarifier..." />
                      </div>
                    </div>
                  </Card>

                  {/* SECTION 3 — Incidents */}
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary }}>
                        🚨 Retards et absences
                      </h3>
                      <button onClick={synchroniserIncidents} disabled={ficheSignee} style={{ ...btnSecondary, padding: '5px 10px', fontSize: '11px', opacity: ficheSignee ? 0.5 : 1 }}>
                        🔄 Synchroniser depuis les présences
                      </button>
                    </div>

                    {/* Retards */}
                    <div style={{ marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#C8A23A', marginBottom: '8px' }}>
                        9 & 10. Retards ({ficheActive.retards.length})
                      </h4>
                      {ficheActive.retards.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                          Aucun retard détecté. Les retards seront ajoutés automatiquement lorsque tu coches "Retard" dans l'onglet Présences.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {ficheActive.retards.map((r, idx) => (
                            <div key={r.apprenantId} style={{ padding: '10px', backgroundColor: '#fef6e4', borderRadius: '8px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '8px', alignItems: 'center' }}>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: '#7a5c00' }}>{r.prenom} {r.nom}</div>
                              <div style={{ fontSize: '11px', color: '#7a5c00' }}>Arrivée : <strong>{r.heureArrivee || '—'}</strong></div>
                              <input type="text" disabled={ficheSignee} style={{ ...inputStyle, fontSize: '11px', padding: '5px 8px' }} placeholder="Durée (ex: 30 min)" value={r.duree} onChange={e => {
                                const nouveaux = [...ficheActive.retards];
                                nouveaux[idx] = { ...r, duree: e.target.value };
                                majFiche('retards', nouveaux);
                              }} />
                              <input type="text" disabled={ficheSignee} style={{ ...inputStyle, fontSize: '11px', padding: '5px 8px' }} placeholder="Motif" value={r.motif} onChange={e => {
                                const nouveaux = [...ficheActive.retards];
                                nouveaux[idx] = { ...r, motif: e.target.value };
                                majFiche('retards', nouveaux);
                              }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Absences */}
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#e53e3e', marginBottom: '8px' }}>
                        11. Absences ({ficheActive.absences.length})
                      </h4>
                      {ficheActive.absences.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                          Aucune absence détectée.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {ficheActive.absences.map((a, idx) => {
                            const justifUrl = (a as any).justificatifUrl;
                            const justifNom = (a as any).justificatifNom;
                            return (
                              <div key={a.apprenantId} style={{ padding: '10px', backgroundColor: '#fde8e8', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '8px', alignItems: 'center' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#c53030' }}>{a.prenom} {a.nom}</div>
                                  <input type="text" disabled={ficheSignee} style={{ ...inputStyle, fontSize: '11px', padding: '5px 8px' }} placeholder="Motif annoncé par l'apprenant" value={a.motif} onChange={e => {
                                    const nouveaux = [...ficheActive.absences];
                                    nouveaux[idx] = { ...a, motif: e.target.value };
                                    majFiche('absences', nouveaux);
                                  }} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>
                                    📋 Le suivi du justificatif est assuré par l'administration (Betty).
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* SECTION 4 — Validation et signature */}
                  {!ficheSignee && !estFormateur && estAdmin && !formateurId && (
                    <Card>
                      <div style={{ padding: '14px 16px', backgroundColor: '#e0f2fe', borderRadius: '8px', fontSize: '13px', color: '#0c5274', borderLeft: '4px solid #0891b2' }}>
                        🔒 En tant qu'administrateur, vous consultez cette fiche en lecture seule. <strong>Seul le formateur peut la signer</strong> depuis son espace ou l'onglet émargement, pour garantir la validité Qualiopi.
                      </div>
                    </Card>
                  )}
                  {!ficheSignee && (estFormateur || formateurId) && (
                    <Card>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '14px' }}>
                        ✍️ Validation et signature électronique
                      </h3>

                      {!ficheCheck.ok && (
                        <div style={{ padding: '10px 14px', backgroundColor: '#fef6e4', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', color: '#7a5c00' }}>
                          ⚠️ Champs obligatoires manquants : <strong>{ficheCheck.manquants.join(', ')}</strong>
                        </div>
                      )}

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', backgroundColor: ficheActive.certifiee ? '#e6f4f1' : '#f9f9f9', borderRadius: '8px', cursor: 'pointer', border: `2px solid ${ficheActive.certifiee ? COLORS.primary : '#e0e0e0'}` }}>
                        <input
                          type="checkbox"
                          checked={ficheActive.certifiee}
                          onChange={e => majFiche('certifiee', e.target.checked)}
                          style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: COLORS.primary }}
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: ficheActive.certifiee ? COLORS.primary : '#333' }}>
                            Je certifie l'exactitude des informations renseignées ci-dessus
                          </div>
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                            En cochant cette case, vous attestez sur l'honneur de la réalité du contenu pédagogique, des présences et des absences déclarés pour la journée du {feuille.date}.
                          </div>
                        </div>
                      </label>

                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={signerFiche} disabled={!ficheActive.certifiee || !ficheCheck.ok} style={{ ...btnPrimary, opacity: (!ficheActive.certifiee || !ficheCheck.ok) ? 0.5 : 1, cursor: (!ficheActive.certifiee || !ficheCheck.ok) ? 'not-allowed' : 'pointer' }}>
                          ✍️ Signer et valider la fiche
                        </button>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Message si l'utilisateur n'est pas formateur */}
              {!formateurId && !estAdmin && ongletPrincipal === 'intervention' && (
                <Card>
                  <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                    Ton compte n'est pas lié à un formateur. Contacte l'administrateur.
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Sélectionne une feuille à gauche pour commencer.</div>
            </Card>
          )}
        </div>
      )}

      {/* ===== TABLEAU DES JOURNÉES PASSÉES (émargements signés archivés) ===== */}
      {!estFormateur && feuillesPassees.length > 0 && (
        <Card style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>📁 Journées passées — émargements signés</h2>
            <span style={{ backgroundColor: '#EAF4F3', color: COLORS.primary, padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{feuillesPassees.length}</span>
          </div>
          <p style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '14px' }}>
            Feuilles d'émargement signées et archivées (les deux demi-journées importées). Consultables pour audit Qualiopi.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                {['Date', 'Formation', 'Formateur', 'Émargements signés', 'Consulter', 'Actions'].map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feuillesPassees.map(f => {
                const matin = f.demiJournees.find(d => d.type === 'Matin');
                const aprem = f.demiJournees.find(d => d.type === 'Après-midi');
                const formateurFeuille = f.demiJournees[0]?.formateur || 'À définir';
                return (
                  <tr key={f.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '700', color: COLORS.primary }}>{f.jour} {f.date}</td>
                    <td style={{ padding: '12px 10px', fontSize: '12px', color: COLORS.text }}>
                      {(f as any).sessionNumero ? `${(f as any).sessionNumero} — ` : ''}{f.formation}
                    </td>
                    <td style={{ padding: '12px 10px', fontSize: '12px' }}>
                      {formateurFeuille === 'À définir' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#C8A23A', fontWeight: '600' }}>⚠️ À définir</span>
                          {estAdmin && (
                            <button
                              onClick={() => rafraichirFormateurDepuisPlanning(f)}
                              style={{ backgroundColor: '#C8A23A', color: 'white', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}
                              title="Récupérer le formateur depuis le planning"
                            >🔄 Récupérer</button>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: COLORS.text, fontWeight: '600' }}>{formateurFeuille}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>🌅 Matin ✅</span>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>🌇 Après-midi ✅</span>
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ display: 'inline-flex', gap: '10px', flexWrap: 'wrap' }}>
                        {matin && (matin as any).pdfSigneUrl && (
                          <a href={(matin as any).pdfSigneUrl} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary, fontSize: '12px', fontWeight: '600', textDecoration: 'underline' }}>📄 Matin</a>
                        )}
                        {aprem && (aprem as any).pdfSigneUrl && (
                          <a href={(aprem as any).pdfSigneUrl} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary, fontSize: '12px', fontWeight: '600', textDecoration: 'underline' }}>📄 Après-midi</a>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {estAdmin && (
                        <button
                          onClick={() => supprimerFeuilleLocale(f.id)}
                          style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                          title="Supprimer cette feuille (réservé direction)"
                        >🗑️ Supprimer</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* MODALE NOUVELLE FEUILLE — multi-sessions */}
      {modaleNouvelle && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary, marginBottom: '6px' }}>+ Nouvelle feuille d'émargement</h2>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '16px' }}>
              Tu peux sélectionner plusieurs sessions de la même formation pour créer une feuille collective.
            </p>

            {sessionsDispo.length === 0 ? (
              <div style={{ padding: '20px', backgroundColor: '#fef6e4', borderRadius: '8px', fontSize: '13px', color: '#7a5c00', marginBottom: '16px' }}>
                ⚠️ Aucune session active disponible. <a href="/sessions" style={{ color: '#7a5c00', fontWeight: '700' }}>Crée une session</a> d'abord.
              </div>
            ) : (
              <>
                {/* 1. Choix de la formation */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>1. Formation *</label>
                  <select
                    style={{ ...inputStyle, width: '100%' }}
                    value={modaleForm.formationCode}
                    onChange={e => setModaleForm(p => ({ ...p, formationCode: e.target.value, sessionIds: [], date: '', jour: '' }))}
                  >
                    <option value="">— Choisir une formation —</option>
                    {formationsDispo.map(code => {
                      const nbSessions = sessionsDispo.filter(s => s.formation === code).length;
                      const label = FORMATIONS_LABELS[code] ?? code;
                      return <option key={code} value={code}>{code} — {label} ({nbSessions} session{nbSessions > 1 ? 's' : ''})</option>;
                    })}
                  </select>
                </div>

                {/* 2. Choix des sessions (checkboxes multi) */}
                {modaleForm.formationCode && sessionsMemeFormation.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      2. Sessions à inclure dans la feuille * ({modaleForm.sessionIds.length} cochée{modaleForm.sessionIds.length > 1 ? 's' : ''})
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto', padding: '8px', border: '1.5px solid #e0e0e0', borderRadius: '8px' }}>
                      {sessionsMemeFormation.map(s => {
                        const nbInscrits = (s.apprenantIds || []).length;
                        const checked = modaleForm.sessionIds.includes(s.id);
                        return (
                          <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', backgroundColor: checked ? '#EAF4F3' : 'white', borderRadius: '6px', cursor: 'pointer', border: checked ? `1.5px solid ${COLORS.primary}` : '1.5px solid #e0e0e0' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => {
                                setModaleForm(p => ({
                                  ...p,
                                  sessionIds: e.target.checked
                                    ? [...p.sessionIds, s.id]
                                    : p.sessionIds.filter(id => id !== s.id),
                                  date: '', // reset car planning peut changer
                                  jour: '',
                                }));
                              }}
                              style={{ accentColor: COLORS.primary, width: '16px', height: '16px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: checked ? COLORS.primary : COLORS.text }}>
                                {s.numero} <span style={{ fontSize: '11px', color: '#888', fontWeight: '500' }}>— {s.dateDebut ?? ''} → {s.dateFin ?? ''}</span>
                              </div>
                              <div style={{ fontSize: '11px', color: COLORS.textMuted }}>{nbInscrits} apprenant{nbInscrits > 1 ? 's' : ''} — Statut : {s.statut}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Choix de la date */}
                {modaleForm.sessionIds.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>3. Date de la séance *</label>
                    {datesDispo.length > 0 ? (
                      <select style={{ ...inputStyle, width: '100%' }} value={modaleForm.date} onChange={e => {
                        const choice = datesDispo.find(d => d.date === e.target.value);
                        setModaleForm(p => ({ ...p, date: e.target.value, jour: choice?.jour ?? '' }));
                      }}>
                        <option value="">— Choisir une date —</option>
                        {datesDispo.map((d, i) => (
                          <option key={i} value={d.date}>{d.date} ({d.jour}) — {d.type === 'cours' ? '📖 Cours' : d.type === 'revision' ? '📝 Révisions' : '🎓 Examen'}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input style={{ ...inputStyle, width: '100%' }} placeholder="JJ/MM/AAAA" value={modaleForm.date} onChange={e => setModaleForm(p => ({ ...p, date: e.target.value }))} />
                        <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>Aucun planning généré — saisis la date manuellement</div>
                      </>
                    )}
                  </div>
                )}

                {/* Aperçu : nb d'apprenants total */}
                {modaleForm.sessionIds.length > 0 && modaleForm.date && (() => {
                  const sessionsCocheesArr = modaleForm.sessionIds.map(id => sessions.find(s => s.id === id)).filter(Boolean);
                  const idsUniques = new Set<string>();
                  sessionsCocheesArr.forEach((s: any) => (s.apprenantIds || []).forEach((id: string) => idsUniques.add(id)));
                  return (
                    <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#006B68', marginBottom: '14px' }}>
                      💡 La feuille sera créée pour <strong>{idsUniques.size} apprenant(s)</strong> issus de <strong>{sessionsCocheesArr.length} session(s)</strong> :
                      <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                        {sessionsCocheesArr.map((s: any) => s.numero).join(', ')}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setModaleNouvelle(false); setModaleForm({ sessionIds: [], date: '', jour: '', formationCode: '' }); }} style={btnSecondary}>Annuler</button>
              <button
                onClick={creerNouvelleFeuille}
                disabled={modaleForm.sessionIds.length === 0 || !modaleForm.date || sessionsDispo.length === 0}
                style={{ ...btnPrimary, opacity: (modaleForm.sessionIds.length === 0 || !modaleForm.date || sessionsDispo.length === 0) ? 0.5 : 1 }}
              >
                ✅ Créer la feuille
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
  );

  // Rendu final selon le rôle
  if (estFormateur) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: COLORS.background }}>
        <SidebarFormateur activePath="/formateur/seances" />
        <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          {contenuPage}
        </main>
      </div>
    );
  }

  return contenuPage;
}
