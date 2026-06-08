'use client';

import { useState, useEffect } from 'react';
import { APPRENANTS_REELS } from '../../data/mockApprenants_reels';
import { useAcces, tracerAction } from '../../lib/useAcces';
import { 
  chargerApcs as chargerApcsSupabase,
  creerApc as creerApcSupabase,
  modifierApc,
  supprimerApc as supprimerApcSupabase,
  modifierEcheance,
  creerEcheance,
  supprimerEcheance,
  sauvegarderCrEcheance,
  marquerCrSignee,
  supprimerCrEcheance,
  type CertificatRealisation,
} from '../../data/apcsSupabase';
import Card from '../../components/Card';
import { uploaderFichier, cheminStorage } from '../../lib/storage';
import { calculerPeriodeCr, calculerPeriodeCrFinal, nbJoursEntre, nbMoisEntre } from '../../lib/calculerPeriodeCr';
import dynamic from 'next/dynamic';
import { APPRENANTS_REELS as APPS_REELS_LIB } from '../../data/mockApprenants_reels';

const BoutonGenerationCR = dynamic(() => import('../../components/BoutonGenerationCR'), { ssr: false });

const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };
const btnPrimary: React.CSSProperties = { backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };

const OPCOS = ['AKTO','ATLAS','AFDAS','OPCO EP','OCAPIAT','OPCOMMERCE','UNIFORMATION','CNFPT','CONSTRUCTYS','OPCO MOBILITES','OPCO 2i'];
const MOIS_NOMS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const ANNEES = ['2024','2025','2026','2027'];

type Echeance = {
  id: string; label: string; type: 'pedago'|'equipement'|'repas';
  annee: number; pourcentage: number; montantPrevu: number;
  dateEcheance: string; numeroFacture: string; dateFacture: string;
  dateDepotOpco: string; dateEcheance30j: string; datePaiement: string;
  montantPaye: number; anneePaiement?: string; fichierFacture: string; modifiee: boolean;
};

type APC = {
  id: string; apprenantId: string; apprenantNom: string; apprenantPrenom: string;
  formation: string; entreprise: string; opco: string; numeroDossierOpco: string;
  numeroDeca: string; dateDebutContrat: string; dateFinContrat: string;
  dateDebutFormation: string; annee: string; npecBranche: number;
  coutPedagoDemande: number; coutPedagoAccorde: number; premierEquipement: number;
  fraisRepas: number; nbJoursFormation: number; resteACharge: number;
  apcRecu: string; dateReception: string; echeances: Echeance[];
  statut: 'En attente'|'Accordé'|'Soldé'|'Refusé';
};

const STATUT_STYLES: Record<string,{bg:string;color:string}> = {
  'En attente':{bg:'#fef6e4',color:'#C8A23A'},
  'Accordé':{bg:'#e6f4f1',color:'#006B68'},
  'Refusé':{bg:'#fde8e8',color:'#e53e3e'},
  'Soldé':{bg:'#dcfce7',color:'#16a34a'},
};

function parseDate(str: string): Date|null {
  if (!str) return null;
  const p = str.split('/');
  if (p.length===3) return new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));
  return null;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date); d.setMonth(d.getMonth()+months); return d;
}

function formatDate(date: Date): string { return date.toLocaleDateString('fr-FR'); }
function r2(n: number): number { return Math.round(n*100)/100; }

function genererEcheances(apc: Partial<APC>): Echeance[] {
  const echeances: Echeance[] = [];
  const dF = parseDate(apc.dateDebutFormation||'');
  const dC = parseDate(apc.dateDebutContrat||'');
  let dateDebut: Date|null = null;
  if (dF&&dC) dateDebut = dF<dC?dF:dC; else dateDebut=dF||dC;
  const dateFin = parseDate(apc.dateFinContrat||'');
  if (!dateDebut) return echeances;
  const npec = apc.npecBranche||apc.coutPedagoAccorde||0;
  const eq = apc.premierEquipement||0;
  const rep = apc.fraisRepas||0;
  const joursTotal = dateFin?Math.round((dateFin.getTime()-dateDebut.getTime())/86400000):(apc.nbJoursFormation||365);
  const j1=Math.min(joursTotal,365), j2=Math.max(0,joursTotal-365);
  const m1=j1>=365?npec:r2(npec*j1/365), m2=j2>0?r2(npec*j2/365):0, s10=r2(npec*0.1);
  const pivot=new Date(2025,6,1), nouveau=dateDebut>=pivot;
  const e1=dateDebut,e2=addMonths(dateDebut,6),e3=addMonths(dateDebut,9),e4=addMonths(dateDebut,12),e5=dateFin||addMonths(dateDebut,15);
  const mk=(suffix:string,label:string,type:'pedago'|'equipement'|'repas',annee:number,pct:number,montant:number,date:Date):Echeance=>({
    id:Date.now()+suffix,label,type,annee,pourcentage:pct,montantPrevu:montant,
    dateEcheance:formatDate(date),numeroFacture:'',dateFacture:'',dateDepotOpco:'',
    dateEcheance30j:'',datePaiement:'',montantPaye:0,fichierFacture:'',modifiee:false,
  });
  if (nouveau) {
    echeances.push(mk('1','Éch. 1 — An 1 (40%)','pedago',1,40,r2(m1*0.4),e1));
    echeances.push(mk('2','Éch. 2 — An 1 (30%)','pedago',1,30,r2(m1*0.3),e2));
    echeances.push(mk('3','Éch. 3 — An 1 (20%)','pedago',1,20,r2(m1*0.2),e3));
    if (m2>0) echeances.push(mk('4','Éch. 4 — An 2','pedago',2,0,m2,e4));
    echeances.push(mk('5','Éch. 5 — Solde 10%','pedago',2,10,s10,e5));
  } else {
    echeances.push(mk('1','Éch. 1 — An 1 (40%)','pedago',1,40,r2(m1*0.4),e1));
    echeances.push(mk('2','Éch. 2 — An 1 (30%)','pedago',1,30,r2(m1*0.3),e2));
    echeances.push(mk('3','Éch. 3 — An 1 (30%)','pedago',1,30,r2(m1*0.3),e3));
    if (m2>0) {
      const e4v=r2(m2*0.4);
      echeances.push(mk('4','Éch. 4 — An 2 (40%)','pedago',2,40,e4v,e4));
      echeances.push(mk('5','Éch. 5 — Solde An 2','pedago',2,0,r2(m2-e4v),e5));
    }
  }
  echeances.push(mk('eq','1er équipement','equipement',1,0,eq>0?eq:500,dateDebut));
  if (rep>0) echeances.push(mk('rep','Frais repas','repas',1,0,rep,addMonths(dateDebut,6)));
  return echeances;
}

/**
 * Prépare les données du CR pour l'échéance ciblée + le dossier APC parent.
 * Retourne null si CR non applicable (1ère échéance, période non calculable).
 */
function donneesCrPourEcheance(apc: APC, echeance: Echeance, apprenant?: any): {
  donnees: Record<string, string>;
  periode: { debut: string; fin: string };
} | null {
  const periode = calculerPeriodeCr(
    apc.echeances as any,
    echeance as any,
    apc.dateDebutContrat,
    apc.dateFinContrat,
    (apprenant as any)?.dateRupture
  );
  if (!periode) return null;
  const nbJ = nbJoursEntre(periode.debut, periode.fin);
  const nbMois = Math.round(nbJ / 30.4);
  // Formation libellée
  const fLibel: Record<string, string> = {
    'SC':'TP Secrétaire Comptable','GCF':'TP Gestionnaire Comptable et Fiscal',
    'ARH':"TP Assistant(e) en Ressources Humaines",'AD':"TP Assistant(e) de Direction",
    'CATL':"TP Chargé(e) d'Accueil Touristique et de Loisirs",
    'EC':"TP Employé(e) Commercial(e)",'CV':"TP Conseiller(ère) de Vente",
    'FPA':"TP Formateur(trice) Professionnel(le) d'Adultes",
  };
  const formationLib = fLibel[apc.formation] || apc.formation;
  const civilite = apprenant?.sexe === 'F' ? 'Mme' : 'M.';
  const donnees: Record<string, string> = {
    CFA_RAISON_SOCIALE: 'PAM OI Formation',
    CFA_DIRECTRICE: 'MAILLOT Gaëlle',
    APPRENANT_CIVILITE: civilite,
    APPRENANT_NOM_COMPLET: `${apc.apprenantPrenom} ${apc.apprenantNom}`,
    ENTREPRISE_RAISON_SOCIALE: apc.entreprise || '',
    FORMATION_LIBELLE: formationLib,
    CR_DATE_DEBUT: periode.debut,
    CR_DATE_FIN: periode.fin,
    CR_DUREE_HEURES: nbMois > 0 ? `${nbMois} mois (${nbJ} jours)` : `${nbJ} jours`,
    CR_LIEU_SIGNATURE: 'Saint-Leu',
    CR_SIGNATAIRE_QUALITE: 'Directrice et référente handicap',
    DATE_SIGNATURE_DOC: new Date().toLocaleDateString('fr-FR'),
  };
  return { donnees, periode };
}

/**
 * Données du CR FINAL (couvrant tout le contrat, pour contrôle OPCO).
 */
function donneesCrFinal(apc: APC, apprenant?: any): {
  donnees: Record<string, string>;
  periode: { debut: string; fin: string };
  nbMoisTotal: number;
} | null {
  const periode = calculerPeriodeCrFinal(
    apc.dateDebutContrat,
    apc.dateFinContrat,
    (apprenant as any)?.dateRupture
  );
  if (!periode) return null;
  const nbJ = nbJoursEntre(periode.debut, periode.fin);
  const nbMoisTotal = nbMoisEntre(periode.debut, periode.fin);
  const fLibel: Record<string, string> = {
    'SC':'TP Secrétaire Comptable','GCF':'TP Gestionnaire Comptable et Fiscal',
    'ARH':"TP Assistant(e) en Ressources Humaines",'AD':"TP Assistant(e) de Direction",
    'CATL':"TP Chargé(e) d'Accueil Touristique et de Loisirs",
    'EC':"TP Employé(e) Commercial(e)",'CV':"TP Conseiller(ère) de Vente",
    'FPA':"TP Formateur(trice) Professionnel(le) d'Adultes",
  };
  const formationLib = fLibel[apc.formation] || apc.formation;
  const civilite = apprenant?.sexe === 'F' ? 'Mme' : 'M.';
  const donnees: Record<string, string> = {
    CFA_RAISON_SOCIALE: 'PAM OI Formation',
    CFA_DIRECTRICE: 'MAILLOT Gaëlle',
    APPRENANT_CIVILITE: civilite,
    APPRENANT_NOM_COMPLET: `${apc.apprenantPrenom} ${apc.apprenantNom}`,
    ENTREPRISE_RAISON_SOCIALE: apc.entreprise || '',
    FORMATION_LIBELLE: formationLib,
    CR_DATE_DEBUT: periode.debut,
    CR_DATE_FIN: periode.fin,
    CR_DUREE_HEURES: `${nbMoisTotal} mois (${nbJ} jours)`,
    CR_LIEU_SIGNATURE: 'Saint-Leu',
    CR_SIGNATAIRE_QUALITE: 'Directrice et référente handicap',
    DATE_SIGNATURE_DOC: new Date().toLocaleDateString('fr-FR'),
  };
  return { donnees, periode, nbMoisTotal };
}

export default function Facturation() {
  const { estAdmin, utilisateur } = useAcces();
  const [apcs, setApcs] = useState<APC[]>([]);
  const [apcSel, setApcSel] = useState<APC|null>(null);
  const [modale, setModale] = useState(false);
  const [onglet, setOnglet] = useState<'dossiers'|'opco'|'mois'|'annee'>('dossiers');
  const [filtreOpco, setFiltreOpco] = useState('');
  const [filtreFormation, setFiltreFormation] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState(new Date().getFullYear().toString());
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState<Partial<APC>>({statut:'En attente',annee:'2026',echeances:[]});
  const [drilldown, setDrilldown] = useState<{titre: string; lignes: any[]} | null>(null);
  const [voirArchives, setVoirArchives] = useState(false);

  useEffect(()=>{
    (async () => {
      try {
        const fromSupabase = await chargerApcsSupabase();
        if (fromSupabase.length > 0) {
          console.log(`[APCs] ${fromSupabase.length} APCs chargés depuis Supabase ✅`);
          setApcs(fromSupabase as any[]);
          return;
        }
        console.warn('[APCs] Supabase vide, fallback localStorage');
      } catch (e) {
        console.error('[APCs] Erreur Supabase, fallback localStorage', e);
      }
      try { const s=localStorage.getItem('easycfa_apcs_v2'); if(s) setApcs(JSON.parse(s)); } catch {}
    })();
  },[]);

  function save(liste: APC[]) { setApcs(liste); localStorage.setItem('easycfa_apcs_v2',JSON.stringify(liste)); }

  async function creerAPC() {
    if (!form.apprenantId||!form.opco) return;
    const ap=APPRENANTS_REELS.find(a=>a.id===form.apprenantId);
    const n:APC={
      id:Date.now().toString(),apprenantId:form.apprenantId??'',
      apprenantNom:ap?.nom??'',apprenantPrenom:ap?.prenom??'',
      formation:ap?.formation??'',entreprise:ap?.entreprise??'',
      opco:form.opco??'',numeroDossierOpco:form.numeroDossierOpco??'',
      numeroDeca:form.numeroDeca??'',
      dateDebutContrat:form.dateDebutContrat??ap?.dateDebutContrat??'',
      dateFinContrat:form.dateFinContrat??ap?.dateFinContrat??'',
      dateDebutFormation:form.dateDebutFormation??form.dateDebutContrat??'',
      annee:form.annee??'2026',npecBranche:form.npecBranche??0,
      coutPedagoDemande:form.coutPedagoDemande??0,coutPedagoAccorde:form.coutPedagoAccorde??0,
      premierEquipement:form.premierEquipement??500,fraisRepas:form.fraisRepas??0,
      nbJoursFormation:form.nbJoursFormation??0,resteACharge:form.resteACharge??0,
      apcRecu:'',dateReception:'',echeances:genererEcheances({...form}),statut:'En attente',
    };
    // Supabase d'abord (APC + ses échéances)
    const res = await creerApcSupabase(n as any);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[APCs] ${n.id} créé dans Supabase (${n.echeances.length} échéances) ✅`);
    // UI + localStorage
    save([...apcs,n]); setModale(false); setForm({statut:'En attente',annee:'2026',echeances:[]}); setApcSel(n);
  }

  async function maj(champ:string,val:any) {
    if (!apcSel) return;
    const u={...apcSel,[champ]:val};
    // Si on modifie les échéances, on les envoie via creerApc (upsert global). Sinon, modifierApc.
    if (champ === 'echeances') {
      const res = await creerApcSupabase(u as any);
      if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
      else console.log(`[APCs ${apcSel.id}] Échéances mises à jour dans Supabase ✅`);
    } else {
      const res = await modifierApc(apcSel.id, { [champ]: val } as any);
      if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
      else console.log(`[APCs ${apcSel.id}] ${champ} mis à jour dans Supabase ✅`);
    }
    setApcSel(u); save(apcs.map(a=>a.id===u.id?u:a));
  }

  async function marquerRelance(facture: any, envoyee: boolean) {
    const dateJour = envoyee ? new Date().toLocaleDateString('fr-FR') : '';
    // Trouver l'échéance ciblée pour récupérer son id
    let targetId: string | null = null;
    apcs.forEach(a => {
      if (a.opco !== facture.opco) return;
      a.echeances.forEach(e => {
        if (e.numeroFacture === facture.numeroFacture && e.dateFacture === facture.dateFacture) {
          targetId = e.id;
        }
      });
    });
    if (targetId) {
      const res = await modifierEcheance(targetId, { relanceEnvoyee: envoyee, dateRelance: dateJour } as any);
      if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
      else console.log(`[Echeance ${targetId}] Relance ${envoyee?'envoyée':'annulée'} dans Supabase ✅`);
    }
    // UI + localStorage
    const updated = apcs.map(a => {
      if (a.opco !== facture.opco) return a;
      return {
        ...a,
        echeances: a.echeances.map(e => {
          if (e.numeroFacture === facture.numeroFacture && e.dateFacture === facture.dateFacture) {
            return { ...e, relanceEnvoyee: envoyee, dateRelance: dateJour };
          }
          return e;
        }),
      };
    });
    save(updated);
  }

  async function modifierDateRelance(facture: any, nouvelleDate: string) {
    let targetId: string | null = null;
    apcs.forEach(a => {
      if (a.opco !== facture.opco) return;
      a.echeances.forEach(e => {
        if (e.numeroFacture === facture.numeroFacture && e.dateFacture === facture.dateFacture) {
          targetId = e.id;
        }
      });
    });
    if (targetId) {
      const res = await modifierEcheance(targetId, { dateRelance: nouvelleDate } as any);
      if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
      else console.log(`[Echeance ${targetId}] dateRelance mise à jour dans Supabase ✅`);
    }
    const updated = apcs.map(a => {
      if (a.opco !== facture.opco) return a;
      return {
        ...a,
        echeances: a.echeances.map(e => {
          if (e.numeroFacture === facture.numeroFacture && e.dateFacture === facture.dateFacture) {
            return { ...e, dateRelance: nouvelleDate };
          }
          return e;
        }),
      };
    });
    save(updated);
  }

  async function majEch(eid:string,champ:string,val:any) {
    if (!apcSel) return;
    let mods: any = { [champ]: val, modifiee: true };
    const echs=apcSel.echeances.map(e=>{
      if (e.id!==eid) return e;
      const u={...e,[champ]:val,modifiee:true};
      if (champ==='dateDepotOpco'&&val) {
        const p=val.split('/');
        if (p.length===3) {
          const d=new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));
          d.setDate(d.getDate()+30); u.dateEcheance30j=d.toLocaleDateString('fr-FR');
          mods.dateEcheance30j = u.dateEcheance30j;
        }
      }
      return u;
    });
    // Supabase d'abord
    const res = await modifierEcheance(eid, mods);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[Echeance ${eid}] ${champ} mis à jour dans Supabase ✅`);
    // UI + localStorage
    const u={...apcSel,echeances:echs}; setApcSel(u); save(apcs.map(a=>a.id===u.id?u:a));
  }

  // Supprime une échéance : DELETE réel dans Supabase (pas un upsert, qui ne supprimerait rien)
  async function supprimerEcheanceLocale(echeanceId: string) {
    if (!apcSel) return;
    if (!confirm('Supprimer cette échéance ?\n\nCette suppression est définitive (côté base de données).')) return;
    const res = await supprimerEcheance(echeanceId);
    if (!res.success) {
      alert(`⚠️ Erreur Supabase : ${res.error}`);
      return;
    }
    console.log(`[Echeance ${echeanceId}] Supprimée de Supabase ✅`);
    const u = { ...apcSel, echeances: apcSel.echeances.filter(ec => ec.id !== echeanceId) };
    setApcSel(u);
    save(apcs.map(a => a.id === u.id ? u : a));
  }

  /**
   * Marque une échéance comme "CR généré" (PDF non signé prêt à envoyer pour signature).
   * Sauvegarde aussi le PDF dans Storage.
   */
  async function marquerCrGenere(echeance: Echeance, periode: {debut: string; fin: string}, blob?: Blob) {
    if (!apcSel) return;
    const nomFichier = `CR_${apcSel.apprenantNom}_${apcSel.apprenantPrenom}_${periode.debut.replace(/\//g,'-')}_${periode.fin.replace(/\//g,'-')}.pdf`;
    // Si on a un blob, on l'upload dans Storage
    let url = '', chemin = '';
    if (blob) {
      const f = new File([blob], nomFichier, { type: 'application/pdf' });
      chemin = cheminStorage('apcs', apcSel.id, `cr_${echeance.id}`, nomFichier);
      const res = await uploaderFichier(chemin, f);
      if (!res.success || !res.fichier) {
        alert(`⚠️ Erreur upload : ${res.error}`);
        return;
      }
      url = res.fichier.url;
      console.log(`[CR ${echeance.id}] PDF non signé uploadé vers Storage ✅`);
    }
    const nbJ = nbJoursEntre(periode.debut, periode.fin);
    const cr: CertificatRealisation = {
      statut: 'a_signer',
      periodeDebut: periode.debut,
      periodeFin: periode.fin,
      nbHeures: 0,
      nbMois: Math.round(nbJ / 30.4),
      fichierNonSigneNom: nomFichier,
      fichierNonSigneUrl: url,
      cheminStorageNonSigne: chemin,
      dateGeneration: new Date().toISOString(),
    };
    const resSave = await sauvegarderCrEcheance(echeance.id, cr);
    if (!resSave.success) {
      alert(`⚠️ Erreur sauvegarde CR : ${resSave.error}`);
      return;
    }
    // Recharge l'APC
    const apcMaj = await import('../../data/apcsSupabase').then(m => m.chargerApc(apcSel.id));
    if (apcMaj) {
      setApcSel(apcMaj as any);
      save(apcs.map(a => a.id === apcSel.id ? (apcMaj as any) : a));
    }
  }

  async function importerCrSignee(echeance: Echeance, file: File) {
    if (!apcSel) return;
    const chemin = cheminStorage('apcs', apcSel.id, `cr_signe_${echeance.id}`, file.name);
    const resUpload = await uploaderFichier(chemin, file);
    if (!resUpload.success || !resUpload.fichier) {
      alert(`⚠️ Erreur upload : ${resUpload.error}`);
      return;
    }
    const res = await marquerCrSignee(echeance.id, resUpload.fichier.url, file.name, chemin);
    if (!res.success) {
      alert(`⚠️ Erreur : ${res.error}`);
      return;
    }
    console.log(`[CR ${echeance.id}] PDF signé importé ✅`);
    const apcMaj = await import('../../data/apcsSupabase').then(m => m.chargerApc(apcSel.id));
    if (apcMaj) {
      setApcSel(apcMaj as any);
      save(apcs.map(a => a.id === apcSel.id ? (apcMaj as any) : a));
    }
  }

  async function annulerCr(echeance: Echeance) {
    if (!apcSel) return;
    if (!confirm('Annuler ce CR et supprimer les fichiers liés ? (Les PDFs restent dans Storage mais ne sont plus référencés)')) return;
    const res = await supprimerCrEcheance(echeance.id);
    if (!res.success) {
      alert(`⚠️ Erreur : ${res.error}`);
      return;
    }
    const apcMaj = await import('../../data/apcsSupabase').then(m => m.chargerApc(apcSel.id));
    if (apcMaj) {
      setApcSel(apcMaj as any);
      save(apcs.map(a => a.id === apcSel.id ? (apcMaj as any) : a));
    }
  }

  async function supprimer(id:string) {
    if (!confirm('Supprimer ce dossier ?')) return;
    // Supabase d'abord (les échéances sont supprimées en cascade via FK ON DELETE CASCADE)
    const res = await supprimerApcSupabase(id);
    if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
    else console.log(`[APCs ${id}] Supprimé de Supabase (cascade échéances) ✅`);
    // UI + localStorage
    save(apcs.filter(a=>a.id!==id)); if(apcSel?.id===id) setApcSel(null);
  }

  // Détecte si un dossier est archivable : Statut Soldé + toutes échéances payées
  function estArchive(a: APC): boolean {
    if (a.statut !== 'Soldé') return false;
    if (!a.echeances || a.echeances.length === 0) return false;
    return a.echeances.every(e => !!e.datePaiement);
  }
  const apcsActifs = apcs.filter(a => !estArchive(a));
  const apcsArchives = apcs.filter(a => estArchive(a));

  // Calculs globaux — filtrés par année sélectionnée
  const anneeAffichee = filtreAnnee || new Date().getFullYear().toString();
  const apcsAnnee = apcs.filter(a => a.annee === anneeAffichee);
  const totalAccorde = apcsAnnee.reduce((s,a)=>s+a.coutPedagoAccorde+a.premierEquipement+a.fraisRepas,0);
  const totalFacture = apcsAnnee.reduce((s,a)=>s+a.echeances.filter(e=>e.numeroFacture).reduce((se,e)=>se+e.montantPrevu,0),0);
  const totalEncaisse = apcs.reduce((s,a)=>s+a.echeances.filter(e=>{
    if (!e.datePaiement) return false;
    const p=e.datePaiement.split('/');
    return p.length===3&&p[2]===anneeAffichee;
  }).reduce((se,e)=>se+(e.montantPaye||0),0),0);
  const totalEnAttente = totalFacture - totalEncaisse;
  const totalReste = totalAccorde - totalFacture;

  // Alertes J-3
  const alertes=apcs.flatMap(a=>a.echeances.filter(e=>{
    if (!e.dateEcheance30j||e.datePaiement) return false;
    const p=e.dateEcheance30j.split('/');
    if (p.length!==3) return false;
    const j=Math.ceil((new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0])).getTime()-new Date().getTime())/86400000);
    return j<=3&&j>=0;
  }).map(e=>({apprenti:a.apprenantPrenom+' '+a.apprenantNom,opco:a.opco,label:e.label,date:e.dateEcheance30j,jours:Math.ceil((new Date(parseInt(e.dateEcheance30j.split('/')[2]),parseInt(e.dateEcheance30j.split('/')[1])-1,parseInt(e.dateEcheance30j.split('/')[0])).getTime()-new Date().getTime())/86400000)})));

  // Filtres dossiers — exclut les archivés (Soldés + tout payé)
  const apcsFiltres=apcsActifs.filter(a=>{
    const mO=!filtreOpco||a.opco===filtreOpco;
    const mF=!filtreFormation||a.formation===filtreFormation;
    const mS=!filtreStatut||a.statut===filtreStatut;
    const mR=!recherche||(a.apprenantNom+' '+a.apprenantPrenom+' '+a.entreprise+' '+a.opco).toLowerCase().includes(recherche.toLowerCase());
    return mO&&mF&&mS&&mR;
  });

  // Factures impayées par OPCO (dateFacture remplie + datePaiement vide)
  function getFacturesImpayeesParOpco(): Record<string, any[]> {
    const parOpco: Record<string, any[]> = {};
    apcs.forEach(a => {
      a.echeances.forEach(e => {
        if (!e.dateFacture || e.datePaiement) return;
        if (!parOpco[a.opco]) parOpco[a.opco] = [];
        const p = e.dateFacture.split('/');
        let joursDepuis: number | null = null;
        let joursRestants30j: number | null = null;
        if (p.length === 3) {
          const dF = new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));
          joursDepuis = Math.floor((Date.now() - dF.getTime()) / 86400000);
        }
        if (e.dateEcheance30j) {
          const p30 = e.dateEcheance30j.split('/');
          if (p30.length === 3) {
            const d30 = new Date(parseInt(p30[2]),parseInt(p30[1])-1,parseInt(p30[0]));
            joursRestants30j = Math.ceil((d30.getTime() - Date.now()) / 86400000);
          }
        }
        parOpco[a.opco].push({
          apprenant: `${a.apprenantPrenom} ${a.apprenantNom}`,
          formation: a.formation, entreprise: a.entreprise, opco: a.opco,
          numeroDossierOpco: a.numeroDossierOpco,
          type: e.type, label: e.label,
          numeroFacture: e.numeroFacture, dateFacture: e.dateFacture,
          dateDepotOpco: e.dateDepotOpco, dateEcheance30j: e.dateEcheance30j,
          montantPrevu: e.montantPrevu,
          joursDepuis, joursRestants30j,
          relanceEnvoyee: (e as any).relanceEnvoyee || false,
          dateRelance: (e as any).dateRelance || '',
        });
      });
    });
    Object.keys(parOpco).forEach(opco => {
      parOpco[opco].sort((a,b) => {
        const pa = (a.dateFacture||'').split('/'), pb = (b.dateFacture||'').split('/');
        if (pa.length !== 3 || pb.length !== 3) return 0;
        return new Date(parseInt(pa[2]),parseInt(pa[1])-1,parseInt(pa[0])).getTime() - new Date(parseInt(pb[2]),parseInt(pb[1])-1,parseInt(pb[0])).getTime();
      });
    });
    return parOpco;
  }
  const facturesImpayeesParOpco = getFacturesImpayeesParOpco();

  // Stats OPCO
  const opcosList=[...new Set(apcs.map(a=>a.opco))].filter(Boolean).sort();
  const statsOpco=opcosList.map(opco=>{
    const l=apcs.filter(a=>a.opco===opco);
    return {
      opco,nb:l.length,
      att:l.filter(a=>a.statut==='En attente').length,
      accord:l.reduce((s,a)=>s+a.coutPedagoAccorde+a.premierEquipement+a.fraisRepas,0),
      fact:l.reduce((s,a)=>s+a.echeances.filter(e=>e.numeroFacture).reduce((se,e)=>se+e.montantPrevu,0),0),
      enc:l.reduce((s,a)=>s+a.echeances.reduce((se,e)=>se+(e.montantPaye||0),0),0),
    };
  });

  // Fonction utilitaire pour le drill-down : retourne les échéances + infos APC
  function getEcheancesFiltrees(opts: {mode: 'fact'|'enc'|'att'|'prev'; type?: string; mois?: number; annee?: string}): any[] {
    const lignes: any[] = [];
    apcs.forEach(a => {
      a.echeances.forEach(e => {
        if (opts.type && e.type !== opts.type) return;
        // Mode "prev" : échéances avec dateEcheance mais sans dateFacture (à facturer)
        if (opts.mode === 'prev') {
          if (e.dateFacture || !e.dateEcheance) return;
          const p = e.dateEcheance.split('/');
          if (p.length !== 3) return;
          if (opts.annee && p[2] !== opts.annee) return;
          if (opts.mois !== undefined && parseInt(p[1])-1 !== opts.mois) return;
          lignes.push({
            apprenant: `${a.apprenantPrenom} ${a.apprenantNom}`,
            formation: a.formation, entreprise: a.entreprise, opco: a.opco,
            type: e.type, label: e.label,
            numeroFacture: e.numeroFacture || '(à émettre)', dateFacture: e.dateEcheance, datePaiement: '',
            montantPrevu: e.montantPrevu, montantPaye: 0,
          });
          return;
        }
        // Mode "att" : factures émises non encore payées
        if (opts.mode === 'att') {
          if (!e.dateFacture || e.datePaiement) return;
          const p = e.dateFacture.split('/');
          if (p.length !== 3) return;
          if (opts.annee && p[2] !== opts.annee) return;
          if (opts.mois !== undefined && parseInt(p[1])-1 !== opts.mois) return;
          lignes.push({
            apprenant: `${a.apprenantPrenom} ${a.apprenantNom}`,
            formation: a.formation, entreprise: a.entreprise, opco: a.opco,
            type: e.type, label: e.label,
            numeroFacture: e.numeroFacture, dateFacture: e.dateFacture, datePaiement: e.datePaiement,
            montantPrevu: e.montantPrevu, montantPaye: e.montantPaye || 0,
          });
          return;
        }
        const dateRef = opts.mode === 'fact' ? e.dateFacture : e.datePaiement;
        if (!dateRef) return;
        const p = dateRef.split('/');
        if (p.length !== 3) return;
        if (opts.annee && p[2] !== opts.annee) return;
        if (opts.mois !== undefined && parseInt(p[1])-1 !== opts.mois) return;
        lignes.push({
          apprenant: `${a.apprenantPrenom} ${a.apprenantNom}`,
          formation: a.formation,
          entreprise: a.entreprise,
          opco: a.opco,
          type: e.type,
          label: e.label,
          numeroFacture: e.numeroFacture,
          dateFacture: e.dateFacture,
          datePaiement: e.datePaiement,
          montantPrevu: e.montantPrevu,
          montantPaye: e.montantPaye || 0,
        });
      });
    });
    return lignes.sort((a,b) => {
      const da = (opts.mode === 'fact' ? a.dateFacture : a.datePaiement) || '';
      const db = (opts.mode === 'fact' ? b.dateFacture : b.datePaiement) || '';
      const pa = da.split('/'), pb = db.split('/');
      if (pa.length !== 3 || pb.length !== 3) return 0;
      return new Date(parseInt(pa[2]),parseInt(pa[1])-1,parseInt(pa[0])).getTime() - new Date(parseInt(pb[2]),parseInt(pb[1])-1,parseInt(pb[0])).getTime();
    });
  }

  // Stats mois — ventilation par type (pedago/equipement/repas)
  function sommeFactureMoisType(mi: number, type: string): number {
    return apcs.reduce((s,a)=>s+a.echeances.filter(e=>{
      if(!e.dateFacture||e.type!==type) return false;
      const p=e.dateFacture.split('/');
      return p.length===3&&parseInt(p[1])-1===mi&&p[2]===filtreAnnee;
    }).reduce((se,e)=>se+e.montantPrevu,0),0);
  }
  function sommeEncMoisType(mi: number, type: string): number {
    return apcs.reduce((s,a)=>s+a.echeances.filter(e=>{
      if(!e.datePaiement||e.type!==type) return false;
      const p=e.datePaiement.split('/');
      return p.length===3&&parseInt(p[1])-1===mi&&p[2]===filtreAnnee;
    }).reduce((se,e)=>se+(e.montantPaye||0),0),0);
  }
  // Prévisionnel : échéances avec dateEcheance définie mais SANS dateFacture
  function sommePrevMoisType(mi: number, type: string): number {
    return apcs.reduce((s,a)=>s+a.echeances.filter(e=>{
      if(e.dateFacture||e.type!==type||!e.dateEcheance) return false;
      const p=e.dateEcheance.split('/');
      return p.length===3&&parseInt(p[1])-1===mi&&p[2]===filtreAnnee;
    }).reduce((se,e)=>se+e.montantPrevu,0),0);
  }
  const statsMois=MOIS_NOMS.map((_,mi)=>{
    const factP=sommeFactureMoisType(mi,'pedago'), factE=sommeFactureMoisType(mi,'equipement'), factR=sommeFactureMoisType(mi,'repas');
    const encP=sommeEncMoisType(mi,'pedago'), encE=sommeEncMoisType(mi,'equipement'), encR=sommeEncMoisType(mi,'repas');
    const prevP=sommePrevMoisType(mi,'pedago'), prevE=sommePrevMoisType(mi,'equipement'), prevR=sommePrevMoisType(mi,'repas');
    const fact=factP+factE+factR, enc=encP+encE+encR, prev=prevP+prevE+prevR;
    return {fact,enc,att:fact-enc,prev,factP,factE,factR,encP,encE,encR,prevP,prevE,prevR};
  });

  // Stats année
  const statsAnnee=ANNEES.map(an=>{
    const l=apcs.filter(a=>a.annee===an);
    const fact=l.reduce((s,a)=>s+a.echeances.filter(e=>e.numeroFacture).reduce((se,e)=>se+e.montantPrevu,0),0);
    const enc=apcs.reduce((s,a)=>s+a.echeances.filter(e=>{
      if(!e.datePaiement) return false;
      const p=e.datePaiement.split('/');
      return p.length===3&&p[2]===an;
    }).reduce((se,e)=>se+(e.montantPaye||0),0),0);
    // Non encaissé au 31/12/N = factures émises en N (ou avant) mais payées en N+1+ ou pas encore
    const anNum = parseInt(an);
    const nonEnc = apcs.reduce((s,a)=>s+a.echeances.filter(e=>{
      if (!e.dateFacture) return false;
      const pF = e.dateFacture.split('/');
      if (pF.length !== 3) return false;
      const anFact = parseInt(pF[2]);
      if (anFact > anNum) return false;
      if (!e.datePaiement) return true;
      const pP = e.datePaiement.split('/');
      if (pP.length !== 3) return false;
      return parseInt(pP[2]) > anNum;
    }).reduce((se,e)=>se+e.montantPrevu,0),0);
    return {an,nb:l.length,att:l.filter(a=>a.statut==='En attente').length,accord:l.reduce((s,a)=>s+a.coutPedagoAccorde+a.premierEquipement+a.fraisRepas,0),fact,enc,nonEnc};
  }).filter(s=>s.nb>0||s.fact>0||s.enc>0);

  const formationsList=[...new Set(apcs.map(a=>a.formation))].filter(Boolean).sort();
  const maxMois=Math.max(...statsMois.map(m=>m.fact),1);

  const thStyle:React.CSSProperties={padding:'10px',fontSize:'10px',color:'white',fontWeight:'700',textTransform:'uppercase',textAlign:'right'};
  const tdNum=(v:number,color='inherit',bold=false):React.CSSProperties=>({padding:'8px 10px',fontSize:'12px',textAlign:'right',fontWeight:bold?'700':'400',color:v<0?'#e53e3e':v===0?'#888':color});

  return (
    <div>
      {/* En-tête */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
        <div>
          <h1 style={{fontSize:'24px',fontWeight:'800',color:'#006B68',marginBottom:'4px'}}>💰 Facturation OPCO</h1>
          <p style={{color:'#888',fontSize:'14px'}}>{apcs.length} dossier(s) — {apcs.filter(a=>a.statut==='En attente').length} en attente</p>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          {ANNEES.map(an=>(
            <button key={an} onClick={()=>setFiltreAnnee(an)} style={{...btnSecondary,backgroundColor:filtreAnnee===an?'#006B68':'white',color:filtreAnnee===an?'white':'#006B68',padding:'5px 12px',fontSize:'12px'}}>
              {an}
            </button>
          ))}
          <button onClick={()=>setModale(true)} style={btnPrimary}>+ Nouveau dossier</button>
        </div>
      </div>

      {/* Stats globales */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'8px'}}>
        {[
          {label:'Dossiers',v:apcsAnnee.length.toString(),c:'#006B68'},
          {label:'Total accordé',v:totalAccorde.toLocaleString('fr-FR',{minimumFractionDigits:2})+' €',c:'#7c3aed'},
          {label:'Total facturé',v:totalFacture.toLocaleString('fr-FR',{minimumFractionDigits:2})+' €',c:'#0891b2'},
          {label:'Total encaissé',v:totalEncaisse.toLocaleString('fr-FR',{minimumFractionDigits:2})+' €',c:'#16a34a'},
        ].map(s=>(
          <div key={s.label} style={{backgroundColor:'white',borderRadius:'10px',padding:'12px',textAlign:'center',borderTop:'4px solid '+s.c,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:'13px',fontWeight:'800',color:s.c}}>{s.v}</div>
            <div style={{fontSize:'10px',color:'#888',textTransform:'uppercase',fontWeight:'600',marginTop:'3px'}}>{s.label} {anneeAffichee}</div>
          </div>
        ))}
      </div>

      {/* Ligne ventilation par nature — année sélectionnée */}
      {(() => {
        const totalPeda = apcsAnnee.reduce((s,a)=>s+a.coutPedagoAccorde,0);
        const totalEquip = apcsAnnee.reduce((s,a)=>s+a.premierEquipement,0);
        const totalRepas = apcsAnnee.reduce((s,a)=>s+a.fraisRepas,0);
        const factPeda = apcsAnnee.reduce((s,a)=>s+a.echeances.filter(e=>e.numeroFacture&&e.type==='pedago').reduce((se,e)=>se+e.montantPrevu,0),0);
        const factEquip = apcsAnnee.reduce((s,a)=>s+a.echeances.filter(e=>e.numeroFacture&&e.type==='equipement').reduce((se,e)=>se+e.montantPrevu,0),0);
        const factRepas = apcsAnnee.reduce((s,a)=>s+a.echeances.filter(e=>e.numeroFacture&&e.type==='repas').reduce((se,e)=>se+e.montantPrevu,0),0);
        const matchPaiementAnnee = (e: any) => { if(!e.datePaiement) return false; const p=e.datePaiement.split('/'); return p.length===3 && p[2]===anneeAffichee; };
        const encPeda = apcs.reduce((s,a)=>s+a.echeances.filter(e=>e.type==='pedago'&&matchPaiementAnnee(e)).reduce((se,e)=>se+(e.montantPaye||0),0),0);
        const encEquip = apcs.reduce((s,a)=>s+a.echeances.filter(e=>e.type==='equipement'&&matchPaiementAnnee(e)).reduce((se,e)=>se+(e.montantPaye||0),0),0);
        const encRepas = apcs.reduce((s,a)=>s+a.echeances.filter(e=>e.type==='repas'&&matchPaiementAnnee(e)).reduce((se,e)=>se+(e.montantPaye||0),0),0);
        return (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'16px'}}>
            {[
              {label:'Frais pédagogiques',accord:totalPeda,facture:factPeda,encaisse:encPeda,color:'#006B68',icon:'📚'},
              {label:'1er équipement',accord:totalEquip,facture:factEquip,encaisse:encEquip,color:'#7c3aed',icon:'🎒'},
              {label:'Frais de repas',accord:totalRepas,facture:factRepas,encaisse:encRepas,color:'#C8A23A',icon:'🍽'},
            ].map(s=>(
              <div key={s.label} style={{backgroundColor:'white',borderRadius:'10px',padding:'12px 14px',borderLeft:'4px solid '+s.color,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:'11px',fontWeight:'700',color:s.color,marginBottom:'6px'}}>{s.icon} {s.label} — {anneeAffichee}</div>
                  <div style={{display:'flex',gap:'16px'}}>
                    <div>
                      <div style={{fontSize:'9px',color:'#888',textTransform:'uppercase',fontWeight:'600'}}>Accordé</div>
                      <div style={{fontSize:'13px',fontWeight:'800',color:s.color}}>{s.accord.toLocaleString('fr-FR',{minimumFractionDigits:2})} €</div>
                    </div>
                    <div>
                      <div style={{fontSize:'9px',color:'#888',textTransform:'uppercase',fontWeight:'600'}}>Facturé</div>
                      <div style={{fontSize:'13px',fontWeight:'800',color:'#0891b2'}}>{s.facture.toLocaleString('fr-FR',{minimumFractionDigits:2})} €</div>
                    </div>
                    <div>
                      <div style={{fontSize:'9px',color:'#888',textTransform:'uppercase',fontWeight:'600'}}>Encaissé</div>
                      <div style={{fontSize:'13px',fontWeight:'800',color:'#16a34a'}}>{s.encaisse.toLocaleString('fr-FR',{minimumFractionDigits:2})} €</div>
                    </div>
                    <div>
                      <div style={{fontSize:'9px',color:'#888',textTransform:'uppercase',fontWeight:'600'}}>Reste à enc.</div>
                      <div style={{fontSize:'13px',fontWeight:'800',color:(s.facture-s.encaisse)>0?'#e53e3e':'#16a34a'}}>{(s.facture-s.encaisse).toLocaleString('fr-FR',{minimumFractionDigits:2})} €</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Onglets */}
      <div style={{display:'flex',gap:'0',marginBottom:'16px',borderBottom:'2px solid #EAF4F3'}}>
        {[{id:'dossiers',label:'📋 Dossiers'},{id:'opco',label:'🏦 Par OPCO'},{id:'mois',label:'📅 Par mois'},{id:'annee',label:'📊 Par année'}].map(o=>(
          <button key={o.id} onClick={()=>setOnglet(o.id as any)} style={{padding:'10px 18px',fontSize:'13px',fontWeight:'600',border:'none',borderBottom:onglet===o.id?'3px solid #006B68':'3px solid transparent',backgroundColor:'white',color:onglet===o.id?'#006B68':'#888',cursor:'pointer',marginBottom:'-2px'}}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ── DOSSIERS ── */}
      {onglet==='dossiers'&&(
        <div>
          <Card style={{marginBottom:'12px'}}>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <input value={recherche} onChange={e=>setRecherche(e.target.value)} placeholder="🔍 Rechercher..." style={{...inputStyle,flex:1}}/>
              <select value={filtreOpco} onChange={e=>setFiltreOpco(e.target.value)} style={{...inputStyle,width:'auto'}}>
                <option value="">Tous OPCO</option>
                {opcosList.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
              <select value={filtreFormation} onChange={e=>setFiltreFormation(e.target.value)} style={{...inputStyle,width:'auto'}}>
                <option value="">Toutes formations</option>
                {formationsList.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
              <select value={filtreStatut} onChange={e=>setFiltreStatut(e.target.value)} style={{...inputStyle,width:'auto'}}>
                <option value="">Tous statuts</option>
                {['En attente','Accordé','Soldé','Refusé'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </Card>

          <div style={{display:'grid',gridTemplateColumns:apcSel?'380px 1fr':'1fr',gap:'20px'}}>
            <Card>
              {apcsFiltres.length===0?(
                <div style={{padding:'40px',textAlign:'center',color:'#888',fontStyle:'italic'}}>Aucun dossier</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {apcsFiltres.map(a=>{
                    const st=STATUT_STYLES[a.statut]??{bg:'#f0f0f0',color:'#888'};
                    const paye=a.echeances.reduce((s,e)=>s+(e.montantPaye||0),0);
                    const accord=a.coutPedagoAccorde+a.premierEquipement+a.fraisRepas;
                    const fact=a.echeances.filter(e=>e.numeroFacture).reduce((s,e)=>s+e.montantPrevu,0);
                    const prochaine=a.echeances.find(e=>!e.datePaiement&&e.type==='pedago');
                    const isOpen=apcSel?.id===a.id;
                    return (
                      <div key={a.id} onClick={()=>setApcSel(isOpen?null:a)} style={{padding:'12px 14px',borderRadius:'10px',border:'1.5px solid '+(isOpen?'#006B68':'#e0e0e0'),backgroundColor:isOpen?'#EAF4F3':'white',cursor:'pointer'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'13px',fontWeight:'700',color:'#006B68'}}>{a.apprenantPrenom} {a.apprenantNom}</div>
                            <div style={{fontSize:'11px',color:'#555',marginTop:'2px'}}>{a.opco} — {a.formation} — {a.entreprise||'—'}</div>
                            {a.numeroDossierOpco&&<div style={{fontSize:'10px',color:'#888',marginTop:'2px'}}>Réf: {a.numeroDossierOpco}</div>}
                            <div style={{display:'flex',gap:'8px',fontSize:'11px',marginTop:'4px',flexWrap:'wrap'}}>
                              <span style={{color:'#7c3aed',fontWeight:'600'}}>Acc: {accord.toLocaleString('fr-FR')}€</span>
                              <span style={{color:'#0891b2',fontWeight:'600'}}>Fact: {fact.toLocaleString('fr-FR')}€</span>
                              <span style={{color:'#16a34a',fontWeight:'700'}}>Enc: {paye.toLocaleString('fr-FR')}€</span>
                            </div>
                            {prochaine&&<div style={{fontSize:'10px',color:'#C8A23A',fontWeight:'600',marginTop:'2px'}}>⏳ {prochaine.label} — {prochaine.montantPrevu.toLocaleString('fr-FR')}€</div>}
                          </div>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px'}}>
                            <span style={{backgroundColor:st.bg,color:st.color,padding:'2px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:'700'}}>{a.statut}</span>
                            <span style={{fontSize:'10px',color:'#888'}}>{a.annee}</span>
                            <button onClick={ev=>{ev.stopPropagation();supprimer(a.id);}} style={{backgroundColor:'#fde8e8',color:'#e53e3e',border:'none',borderRadius:'4px',padding:'2px 6px',fontSize:'10px',cursor:'pointer'}}>✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {apcSel&&(
              <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <Card>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
                    <h2 style={{fontSize:'14px',fontWeight:'700',color:'#006B68'}}>{apcSel.apprenantPrenom} {apcSel.apprenantNom} — {apcSel.opco}</h2>
                    <div style={{display:'flex',gap:'6px'}}>
                      <select value={apcSel.statut} onChange={e=>maj('statut',e.target.value)} style={{...inputStyle,width:'auto',fontSize:'11px'}}>
                        {['En attente','Accordé','Soldé','Refusé'].map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={()=>setApcSel(null)} style={{backgroundColor:'#f0f0f0',border:'none',borderRadius:'6px',padding:'4px 10px',cursor:'pointer',fontSize:'11px'}}>✕</button>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                    {[
                      {label:'N° dossier OPCO',champ:'numeroDossierOpco'},
                      {label:'N° DECA',champ:'numeroDeca'},
                      {label:'Début financement',champ:'dateDebutFormation'},
                      {label:'Début contrat',champ:'dateDebutContrat'},
                      {label:'Fin contrat',champ:'dateFinContrat'},
                      {label:'Nb jours',champ:'nbJoursFormation'},
                    ].map(f=>(
                      <div key={f.champ}>
                        <label style={{fontSize:'10px',color:'#888',display:'block',marginBottom:'2px',textTransform:'uppercase'}}>{f.label}</label>
                        <input style={inputStyle} value={(apcSel as any)[f.champ]??''} onChange={e=>maj(f.champ,e.target.value)}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'12px'}}>
                    <label style={{...btnSecondary,display:'inline-block',cursor:'pointer',fontSize:'11px',padding:'6px 10px'}}>
                      📎 Importer APC
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={async ev=>{
                        const f=ev.target.files?.[0];
                        if(!f) return;
                        const chemin = cheminStorage('apcs', apcSel.id, 'apc_recu', f.name);
                        const resUpload = await uploaderFichier(chemin, f);
                        if(!resUpload.success || !resUpload.fichier){
                          alert(`⚠️ Erreur upload : ${resUpload.error}`);
                          return;
                        }
                        console.log(`[APC ${apcSel.id}] APC reçu uploadé vers Storage ✅`);
                        await maj('apcRecu',f.name);
                        await maj('apcRecuUrl',resUpload.fichier.url);
                        await maj('apcRecuCheminStorage',resUpload.fichier.cheminStorage);
                        await maj('dateReception',new Date().toLocaleDateString('fr-FR'));
                        await maj('statut','Accordé');
                      }}/>
                    </label>
                    {apcSel.apcRecu&&<span style={{fontSize:'11px',color:'#006B68',fontWeight:'600',display:'inline-flex',alignItems:'center',gap:'6px'}}>
                      ✅ {apcSel.apcRecu}
                      {(apcSel as any).apcRecuUrl && <a href={(apcSel as any).apcRecuUrl} target="_blank" rel="noopener noreferrer" style={{color:'#006B68',textDecoration:'underline'}}>⬇</a>}
                    </span>}
                  </div>
                  <div style={{backgroundColor:'#EAF4F3',borderRadius:'8px',padding:'12px'}}>
                    <div style={{fontSize:'11px',fontWeight:'700',color:'#006B68',textTransform:'uppercase',marginBottom:'8px'}}>💰 Montants APC</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                      {[
                        {label:'NPEC (€/an)',champ:'npecBranche'},{label:'Péda demandée (€)',champ:'coutPedagoDemande'},
                        {label:'Péda accordée (€)',champ:'coutPedagoAccorde'},{label:'1er équipement (€)',champ:'premierEquipement'},
                        {label:'Frais repas (€)',champ:'fraisRepas'},{label:'Reste à charge (€)',champ:'resteACharge'},
                      ].map(f=>(
                        <div key={f.champ}>
                          <label style={{fontSize:'10px',color:'#555',display:'block',marginBottom:'2px'}}>{f.label}</label>
                          <input type="number" step="0.01" style={inputStyle} value={(apcSel as any)[f.champ]??0} onChange={e=>maj(f.champ,parseFloat(e.target.value)||0)}/>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:'10px',backgroundColor:'#006B68',borderRadius:'6px',padding:'8px 12px',display:'flex',justifyContent:'space-between'}}>
                      <span style={{fontSize:'12px',fontWeight:'700',color:'white'}}>Total accordé</span>
                      <span style={{fontSize:'13px',fontWeight:'800',color:'#C8A23A'}}>{(apcSel.coutPedagoAccorde+apcSel.premierEquipement+apcSel.fraisRepas).toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                    <h3 style={{fontSize:'13px',fontWeight:'700',color:'#006B68'}}>📅 Échéancier</h3>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>{if(!confirm('Régénérer ?')) return;const u={...apcSel,echeances:genererEcheances(apcSel)};setApcSel(u);save(apcs.map(a=>a.id===u.id?u:a));}} style={{...btnSecondary,padding:'4px 10px',fontSize:'11px'}}>🔄 Régénérer</button>
                      <button onClick={()=>{const n:Echeance={id:Date.now().toString(),label:'Nouvelle échéance',type:'pedago',annee:1,pourcentage:0,montantPrevu:0,dateEcheance:'',numeroFacture:'',dateFacture:'',dateDepotOpco:'',dateEcheance30j:'',datePaiement:'',montantPaye:0,fichierFacture:'',modifiee:true};maj('echeances',[...apcSel.echeances,n]);}} style={{...btnPrimary,padding:'4px 10px',fontSize:'11px'}}>+ Ajouter</button>
                    </div>
                  </div>
                  {apcSel.echeances.length===0?(
                    <div style={{padding:'16px',textAlign:'center',color:'#888',fontSize:'12px',fontStyle:'italic'}}>Aucune échéance — cliquez Régénérer ou + Ajouter</div>
                  ):(
                    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                      {apcSel.echeances.map(e=>{
                        const isPaye=!!e.datePaiement, isFacture=!!e.numeroFacture;
                        const tc=e.type==='equipement'?'#7c3aed':e.type==='repas'?'#0891b2':'#006B68';
                        return (
                          <div key={e.id} style={{borderRadius:'8px',border:'1px solid '+(isPaye?'#006B68':isFacture?'#C8A23A':'#e0e0e0'),backgroundColor:isPaye?'#e6f4f1':isFacture?'#fef6e4':'#fafafa',overflow:'hidden'}}>
                            {e.numeroFacture&&!e.fichierFacture&&(
                              <div style={{backgroundColor:'#fef6e4',padding:'4px 10px',fontSize:'10px',color:'#7a5c00',fontWeight:'600',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <span>⚠️ N° {e.numeroFacture} — PDF manquant</span>
                                <label style={{backgroundColor:'#C8A23A',color:'white',borderRadius:'4px',padding:'2px 8px',fontSize:'10px',cursor:'pointer'}}>
                                  📎 Importer<input type="file" accept=".pdf,.jpg" style={{display:'none'}} onChange={async ev=>{
                                    const f=ev.target.files?.[0];
                                    if(!f) return;
                                    const chemin = cheminStorage('apcs', apcSel.id, `facture_${e.id}`, f.name);
                                    const resUpload = await uploaderFichier(chemin, f);
                                    if(!resUpload.success || !resUpload.fichier){
                                      alert(`⚠️ Erreur upload : ${resUpload.error}`);
                                      return;
                                    }
                                    console.log(`[Échéance ${e.id}] Facture uploadée vers Storage ✅`);
                                    await majEch(e.id,'fichierFacture',f.name);
                                    await majEch(e.id,'fichierFactureUrl',resUpload.fichier.url);
                                    await majEch(e.id,'fichierFactureCheminStorage',resUpload.fichier.cheminStorage);
                                  }}/>
                                </label>
                              </div>
                            )}
                            {e.fichierFacture&&(
                              <div style={{backgroundColor:'#e6f4f1',padding:'4px 10px',fontSize:'10px',color:'#006B68',fontWeight:'600',display:'flex',justifyContent:'space-between'}}>
                                <span>✅ {e.fichierFacture} {(e as any).fichierFactureUrl && <a href={(e as any).fichierFactureUrl} target="_blank" rel="noopener noreferrer" style={{color:'#006B68',textDecoration:'underline',marginLeft:'6px'}}>⬇</a>}</span>
                                <label style={{backgroundColor:'#006B68',color:'white',borderRadius:'4px',padding:'2px 8px',fontSize:'10px',cursor:'pointer'}}>
                                  🔄 Remplacer<input type="file" accept=".pdf,.jpg" style={{display:'none'}} onChange={async ev=>{
                                    const f=ev.target.files?.[0];
                                    if(!f) return;
                                    const chemin = cheminStorage('apcs', apcSel.id, `facture_${e.id}`, f.name);
                                    const resUpload = await uploaderFichier(chemin, f);
                                    if(!resUpload.success || !resUpload.fichier){
                                      alert(`⚠️ Erreur upload : ${resUpload.error}`);
                                      return;
                                    }
                                    console.log(`[Échéance ${e.id}] Facture remplacée vers Storage ✅`);
                                    majEch(e.id,'fichierFacture',f.name);
                                    majEch(e.id,'fichierFactureUrl',resUpload.fichier.url);
                                    majEch(e.id,'fichierFactureCheminStorage',resUpload.fichier.cheminStorage);
                                  }}/>
                                </label>
                              </div>
                            )}
                            <div style={{backgroundColor:tc,padding:'6px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                                <span style={{fontSize:'11px',fontWeight:'700',color:'white'}}>{isPaye?'✅':isFacture?'🟡':'⏳'} {e.label}</span>
                                {e.modifiee&&<span style={{fontSize:'9px',backgroundColor:'rgba(255,255,255,0.3)',color:'white',padding:'1px 5px',borderRadius:'10px'}}>modifiée</span>}
                                {e.dateEcheance30j&&!e.datePaiement&&(()=>{
                                  const p=e.dateEcheance30j.split('/');
                                  if(p.length!==3) return null;
                                  const j=Math.ceil((new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0])).getTime()-new Date().getTime())/86400000);
                                  if(j<=3&&j>=0) return <span style={{fontSize:'9px',backgroundColor:'#fde8e8',color:'#e53e3e',padding:'1px 6px',borderRadius:'10px',fontWeight:'700'}}>⚠️ J-{j}</span>;
                                  if(j<0) return <span style={{fontSize:'9px',backgroundColor:'#fde8e8',color:'#e53e3e',padding:'1px 6px',borderRadius:'10px',fontWeight:'700'}}>🔴 DÉPASSÉ</span>;
                                  return null;
                                })()}
                              </div>
                              <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                                <span style={{fontSize:'12px',fontWeight:'800',color:'white'}}>{e.montantPrevu.toLocaleString('fr-FR')} €</span>
                                <button onClick={()=>supprimerEcheanceLocale(e.id)} style={{backgroundColor:'rgba(255,255,255,0.2)',color:'white',border:'none',borderRadius:'4px',padding:'1px 5px',fontSize:'10px',cursor:'pointer'}}>✕</button>
                              </div>
                            </div>
                            <div style={{padding:'8px 10px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px'}}>
                              {[
                                {label:'Libellé',champ:'label',type:'text'},{label:'Date échéance',champ:'dateEcheance',type:'text'},
                                {label:'Montant prévu (€)',champ:'montantPrevu',type:'number'},{label:'N° Facture',champ:'numeroFacture',type:'text'},
                                {label:'Date facture',champ:'dateFacture',type:'text'},{label:'Date dépôt OPCO',champ:'dateDepotOpco',type:'text'},
                                {label:'Échéance 30j (auto)',champ:'dateEcheance30j',type:'text'},{label:'Date paiement',champ:'datePaiement',type:'text'},
                                {label:'Montant payé (€)',champ:'montantPaye',type:'number'},
                              ].map(f=>(
                                <div key={f.champ}>
                                  <label style={{fontSize:'9px',color:'#888',display:'block',marginBottom:'2px',textTransform:'uppercase'}}>{f.label}</label>
                                  <input type={f.type} step={f.type==='number'?'0.01':undefined} style={{...inputStyle,fontSize:'11px',padding:'5px 7px'}} value={(e as any)[f.champ]??''} onChange={ev=>majEch(e.id,f.champ,f.type==='number'?(ev.target.value===''?0:parseFloat(ev.target.value)):ev.target.value)}/>
                                </div>
                              ))}
                            </div>

                            {/* === SECTION CERTIFICAT DE RÉALISATION === */}
                            {e.type === 'pedago' && (() => {
                              const apprenant = APPS_REELS_LIB.find(a => a.id === apcSel.apprenantId);
                              const data = donneesCrPourEcheance(apcSel as any, e as any, apprenant);
                              const cr: CertificatRealisation | undefined = (e as any).pieces?.certificatRealisation;
                              const colorCR = cr?.statut === 'signe' ? '#16a34a' : cr?.statut === 'a_signer' ? '#C8A23A' : '#888';
                              const bgCR = cr?.statut === 'signe' ? '#dcfce7' : cr?.statut === 'a_signer' ? '#fef6e4' : '#fafafa';
                              if (!data) {
                                // Première facture pédagogique : pas de CR
                                return (
                                  <div style={{padding:'8px 10px',backgroundColor:'#fafafa',borderTop:'1px dashed #ddd',fontSize:'11px',color:'#888',fontStyle:'italic'}}>
                                    ℹ️ Pas de CR sur cette échéance (première facture pédagogique)
                                  </div>
                                );
                              }
                              return (
                                <div style={{padding:'10px',backgroundColor:bgCR,borderTop:'2px solid '+colorCR}}>
                                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px',flexWrap:'wrap',gap:'8px'}}>
                                    <div style={{fontSize:'11px',fontWeight:'700',color:colorCR}}>
                                      📜 Certificat de Réalisation
                                      {cr?.statut === 'a_signer' && ' — ⏳ À signer'}
                                      {cr?.statut === 'signe' && ' — ✅ Signé'}
                                      {!cr && ' — Non généré'}
                                    </div>
                                    <div style={{fontSize:'10px',color:'#666'}}>
                                      Période : <strong>{data.periode.debut}</strong> → <strong>{data.periode.fin}</strong>
                                      <span style={{marginLeft:'6px',color:'#888'}}>({nbJoursEntre(data.periode.debut, data.periode.fin)} jours)</span>
                                    </div>
                                  </div>

                                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
                                    {/* Toujours : bouton télécharger PDF (génération à la volée) */}
                                    <BoutonGenerationCR
                                      donnees={data.donnees}
                                      nomFichier={`CR_${apcSel.apprenantNom}_${apcSel.apprenantPrenom}_${data.periode.debut.replace(/\//g,'-')}_${data.periode.fin.replace(/\//g,'-')}.pdf`}
                                    />

                                    {/* Si pas encore généré : bouton marquer comme généré */}
                                    {!cr && (
                                      <button
                                        onClick={() => marquerCrGenere(e as any, data.periode)}
                                        style={{backgroundColor:'#C8A23A',color:'white',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}
                                      >
                                        ✓ Marquer comme généré
                                      </button>
                                    )}

                                    {/* Si statut "à signer" : bouton importer signé */}
                                    {cr?.statut === 'a_signer' && (
                                      <label style={{backgroundColor:'#16a34a',color:'white',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                                        📤 Importer CR signé
                                        <input type="file" accept=".pdf" style={{display:'none'}} onChange={ev => {
                                          const f = ev.target.files?.[0];
                                          if (f) importerCrSignee(e as any, f);
                                        }} />
                                      </label>
                                    )}

                                    {/* Si signé : voir le PDF + bouton remplacer */}
                                    {cr?.statut === 'signe' && cr.fichierSigneUrl && (
                                      <>
                                        <a href={cr.fichierSigneUrl} target="_blank" rel="noopener noreferrer" style={{backgroundColor:'white',color:'#16a34a',border:'1.5px solid #16a34a',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,textDecoration:'none'}}>
                                          📄 Voir le CR signé
                                        </a>
                                        <label style={{backgroundColor:'white',color:'#666',border:'1px solid #ccc',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                                          🔄 Remplacer
                                          <input type="file" accept=".pdf" style={{display:'none'}} onChange={ev => {
                                            const f = ev.target.files?.[0];
                                            if (f) importerCrSignee(e as any, f);
                                          }} />
                                        </label>
                                      </>
                                    )}

                                    {/* Si CR existe : bouton annuler */}
                                    {cr && (
                                      <button
                                        onClick={() => annulerCr(e as any)}
                                        style={{backgroundColor:'white',color:'#c00',border:'1px solid #c00',borderRadius:6,padding:'5px 8px',fontSize:11,fontWeight:600,cursor:'pointer'}}
                                        title="Annuler le CR"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>

                                  {/* Alerte si facture suivante saisie mais CR manquant ou pas signé */}
                                  {(() => {
                                    const pedago = (apcSel.echeances || []).filter(x => x.type === 'pedago').sort((a,b) => {
                                      const pA = (a.dateEcheance||'').split('/'), pB = (b.dateEcheance||'').split('/');
                                      if (pA.length !== 3 || pB.length !== 3) return 0;
                                      return new Date(parseInt(pA[2]),parseInt(pA[1])-1,parseInt(pA[0])).getTime() - new Date(parseInt(pB[2]),parseInt(pB[1])-1,parseInt(pB[0])).getTime();
                                    });
                                    const idx = pedago.findIndex(x => x.id === e.id);
                                    // S'il y a une facture SUIVANTE avec une dateFacture saisie ET ce CR pas signé : alerte
                                    if (idx >= 0 && idx < pedago.length - 1) {
                                      const suivante = pedago[idx + 1];
                                      if (suivante.dateFacture && cr?.statut !== 'signe') {
                                        return (
                                          <div style={{marginTop:6,padding:'4px 8px',backgroundColor:'#fde8e8',color:'#c53030',fontSize:10,fontWeight:600,borderRadius:4}}>
                                            🚨 La facture suivante ({suivante.label}) a été émise mais ce CR n'est pas encore signé !
                                          </div>
                                        );
                                      }
                                    }
                                    return null;
                                  })()}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                      <div style={{backgroundColor:'#006B68',borderRadius:'8px',padding:'10px 12px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px'}}>
                        {[
                          {label:'Total prévu',v:apcSel.echeances.reduce((s,e)=>s+(e.montantPrevu||0),0),c:'white'},
                          {label:'Facturé',v:apcSel.echeances.filter(e=>e.numeroFacture).reduce((s,e)=>s+e.montantPrevu,0),c:'#C8A23A'},
                          {label:'Encaissé',v:apcSel.echeances.reduce((s,e)=>s+(e.montantPaye||0),0),c:'#86efac'},
                          {label:'Reste',v:apcSel.echeances.reduce((s,e)=>s+(e.montantPrevu||0),0)-apcSel.echeances.reduce((s,e)=>s+(e.montantPaye||0),0),c:'#fca5a5'},
                        ].map(t=>(
                          <div key={t.label} style={{textAlign:'center'}}>
                            <div style={{fontSize:'10px',color:'rgba(255,255,255,0.7)',textTransform:'uppercase',marginBottom:'2px'}}>{t.label}</div>
                            <div style={{fontSize:'13px',fontWeight:'800',color:t.c}}>{t.v.toLocaleString('fr-FR')} €</div>
                          </div>
                        ))}
                      </div>

                      {/* === CR FINAL — couvre tout le contrat pour contrôle OPCO === */}
                      {(() => {
                        const apprenant = APPS_REELS_LIB.find(a => a.id === apcSel.apprenantId);
                        const dataFinal = donneesCrFinal(apcSel as any, apprenant);
                        if (!dataFinal) return null;

                        // Somme des mois des CR par échéance (pour contrôle cohérence)
                        const pedago = (apcSel.echeances || []).filter(e => e.type === 'pedago').sort((a,b) => {
                          const pA = (a.dateEcheance||'').split('/'), pB = (b.dateEcheance||'').split('/');
                          if (pA.length !== 3 || pB.length !== 3) return 0;
                          return new Date(parseInt(pA[2]),parseInt(pA[1])-1,parseInt(pA[0])).getTime() - new Date(parseInt(pB[2]),parseInt(pB[1])-1,parseInt(pB[0])).getTime();
                        });
                        let sommeMoisCrEcheance = 0;
                        pedago.forEach((e, idx) => {
                          if (idx === 0) return;
                          const data = donneesCrPourEcheance(apcSel as any, e as any, apprenant);
                          if (data) sommeMoisCrEcheance += nbMoisEntre(data.periode.debut, data.periode.fin);
                        });
                        const ecart = dataFinal.nbMoisTotal - sommeMoisCrEcheance;

                        return (
                          <div style={{marginTop: 12, padding: 12, backgroundColor: '#f0f4ff', borderRadius: 8, border: '2px solid #3a5bc7'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,flexWrap:'wrap',gap:8}}>
                              <div style={{fontSize:'12px',fontWeight:'800',color:'#3a5bc7'}}>
                                🏛️ CR FINAL (pour contrôle OPCO) — couvre tout le contrat
                              </div>
                              <div style={{fontSize:'11px',color:'#555'}}>
                                Période : <strong>{dataFinal.periode.debut}</strong> → <strong>{dataFinal.periode.fin}</strong>
                                <span style={{marginLeft: 8, color:'#3a5bc7', fontWeight: 700}}>= {dataFinal.nbMoisTotal} mois</span>
                              </div>
                            </div>

                            {/* Contrôle cohérence */}
                            {sommeMoisCrEcheance > 0 && (
                              <div style={{
                                marginBottom: 8, padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                backgroundColor: ecart === 0 ? '#dcfce7' : '#fde8e8',
                                color: ecart === 0 ? '#15803d' : '#c53030',
                              }}>
                                {ecart === 0
                                  ? `✅ Cohérence OK : ${sommeMoisCrEcheance} mois des CR par échéance = ${dataFinal.nbMoisTotal} mois du CR final`
                                  : `⚠️ Écart de ${Math.abs(ecart)} mois : somme CR échéances = ${sommeMoisCrEcheance} mois vs CR final = ${dataFinal.nbMoisTotal} mois`
                                }
                              </div>
                            )}

                            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                              <BoutonGenerationCR
                                donnees={dataFinal.donnees}
                                nomFichier={`CR_FINAL_${apcSel.apprenantNom}_${apcSel.apprenantPrenom}_${dataFinal.periode.debut.replace(/\//g,'-')}_${dataFinal.periode.fin.replace(/\//g,'-')}.pdf`}
                              />
                              <span style={{fontSize:10, color:'#666', fontStyle:'italic', alignSelf:'center'}}>
                                À conserver pour contrôle OPCO (preuve totale de réalisation)
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DOSSIERS ARCHIVÉS (Soldés + tout payé) ── */}
      {onglet==='dossiers' && apcsArchives.length > 0 && (
        <Card style={{marginTop:'14px', border: '1.5px dashed #ccc'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <div>
              <h2 style={{fontSize:'14px',fontWeight:'700',color:'#666'}}>🗄️ Dossiers archivés ({apcsArchives.length})</h2>
              <p style={{fontSize:'11px',color:'#888',marginTop:'2px',fontStyle:'italic'}}>Dossiers Soldés avec toutes les échéances payées</p>
            </div>
            <button onClick={() => setVoirArchives(!voirArchives)} style={btnSecondary}>
              {voirArchives ? '🔼 Masquer les archivés' : '🔽 Voir les archivés'}
            </button>
          </div>
          {voirArchives && (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
                <thead>
                  <tr style={{backgroundColor:'#f0f0f0'}}>
                    {['Apprenant','Formation','OPCO','Année','Accordé (€)','Encaissé (€)', estAdmin ? 'Action' : ''].filter(Boolean).map(c => (
                      <th key={c} style={{padding:'8px 10px',fontSize:'10px',color:'#666',fontWeight:'700',textTransform:'uppercase',textAlign:c.includes('€')?'right':'left'}}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apcsArchives.map((a,i) => {
                    const enc = a.echeances.reduce((s,e)=>s+(e.montantPaye||0),0);
                    const accord = a.coutPedagoAccorde + a.premierEquipement + a.fraisRepas;
                    return (
                      <tr key={a.id} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:i%2===0?'white':'#fafafa',opacity:0.75}}>
                        <td style={{padding:'8px 10px',fontWeight:'600',color:'#555'}}>{a.apprenantPrenom} {a.apprenantNom}</td>
                        <td style={{padding:'8px 10px',color:'#777'}}>{a.formation}</td>
                        <td style={{padding:'8px 10px',color:'#777'}}>{a.opco}</td>
                        <td style={{padding:'8px 10px',color:'#777'}}>{a.annee}</td>
                        <td style={{padding:'8px 10px',textAlign:'right',color:'#777'}}>{accord.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                        <td style={{padding:'8px 10px',textAlign:'right',color:'#16a34a',fontWeight:'700'}}>{enc.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                        {estAdmin && (
                          <td style={{padding:'8px 10px'}}>
                            <button onClick={async () => {
                              if (!confirm(`Désarchiver le dossier de ${a.apprenantPrenom} ${a.apprenantNom} ?\n\nIl repassera en statut "Accordé" et redeviendra actif.`)) return;
                              // Supabase d'abord
                              const res = await modifierApc(a.id, { statut: 'Accordé' } as any);
                              if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
                              else console.log(`[APCs ${a.id}] Désarchivé dans Supabase ✅`);
                              // UI + localStorage
                              const updated = apcs.map(x => x.id === a.id ? {...x, statut: 'Accordé' as const} : x);
                              save(updated);
                              tracerAction('DESARCHIVAGE', 'apc', a.id, `${a.apprenantPrenom} ${a.apprenantNom} — ${a.opco}`, utilisateur);
                            }} style={{backgroundColor:'#fef6e4',color:'#7a5c00',border:'1px solid #C8A23A',borderRadius:'4px',padding:'3px 8px',fontSize:'10px',fontWeight:'700',cursor:'pointer'}}>
                              ♻️ Désarchiver
                            </button>
                          </td>
                        )}
                        {!estAdmin && (
                          <td style={{padding:'8px 10px',fontSize:'10px',color:'#aaa',fontStyle:'italic'}}>Lecture seule</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── PAR OPCO ── */}
      {onglet==='opco'&&(
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
        <Card>
          <h2 style={{fontSize:'14px',fontWeight:'700',color:'#006B68',marginBottom:'14px'}}>🏦 Synthèse par OPCO</h2>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:'700px'}}>
              <thead>
                <tr style={{backgroundColor:'#006B68'}}>
                  {['OPCO','Dossiers','En attente','Accordé (€)','Facturé (€)','Reste à fact. (€)','Encaissé (€)'].map((c,i)=>(
                    <th key={c} style={{...thStyle,textAlign:i===0?'left':'right',padding:'10px'}}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statsOpco.map((s,i)=>{
                  const reste=s.accord-s.fact;
                  return (
                    <tr key={s.opco} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:i%2===0?'white':'#EAF4F3'}}>
                      <td style={{padding:'10px',fontSize:'12px',fontWeight:'700',color:'#006B68'}}>{s.opco}</td>
                      <td style={tdNum(s.nb)}>{s.nb}</td>
                      <td style={{...tdNum(s.att),color:s.att>0?'#C8A23A':'#888'}}>{s.att}</td>
                      <td style={{...tdNum(s.accord,'#7c3aed',true)}}>{s.accord.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                      <td style={{...tdNum(s.fact,'#0891b2',true)}}>{s.fact.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                      <td style={{...tdNum(reste,reste>0?'#C8A23A':'#16a34a',true)}}>{reste.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                      <td style={{...tdNum(s.enc,'#16a34a',true)}}>{s.enc.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                    </tr>
                  );
                })}
                <tr style={{backgroundColor:'#006B68'}}>
                  {[
                    {v:'TOTAL',c:'white',al:'left'},{v:apcs.length,c:'white'},{v:apcs.filter(a=>a.statut==='En attente').length,c:'#fef6e4'},
                    {v:totalAccorde,c:'#C8A23A'},{v:totalFacture,c:'#C8A23A'},{v:totalReste,c:'#C8A23A'},{v:totalEncaisse,c:'#C8A23A'},
                  ].map((t,i)=>(
                    <td key={i} style={{padding:'10px',fontSize:'12px',fontWeight:'700',color:t.c,textAlign:(t as any).al||'right'}}>
                      {typeof t.v==='number'&&i>1?t.v.toLocaleString('fr-FR',{minimumFractionDigits:2}):t.v}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Section Factures impayées par OPCO */}
        {Object.keys(facturesImpayeesParOpco).length > 0 && (
          <Card style={{border:'2px solid #e53e3e'}}>
            <h2 style={{fontSize:'14px',fontWeight:'800',color:'#e53e3e',marginBottom:'10px'}}>
              ⚠️ Factures impayées par OPCO ({Object.values(facturesImpayeesParOpco).reduce((s,arr)=>s+arr.length,0)} facture(s) — Total : {Object.values(facturesImpayeesParOpco).reduce((s,arr)=>s+arr.reduce((sa,f)=>sa+f.montantPrevu,0),0).toLocaleString('fr-FR',{minimumFractionDigits:2})} €)
            </h2>
            <p style={{fontSize:'11px',color:'#888',marginBottom:'10px',fontStyle:'italic'}}>Factures émises (avec n° et date) mais sans paiement enregistré.</p>
            {Object.entries(facturesImpayeesParOpco).sort().map(([opco, factures]) => {
              const totalOpco = factures.reduce((s,f)=>s+f.montantPrevu,0);
              return (
                <div key={opco} style={{marginBottom:'14px',borderRadius:'8px',border:'1.5px solid #fcc',overflow:'hidden'}}>
                  <div style={{backgroundColor:'#fde8e8',padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'13px',fontWeight:'800',color:'#c53030'}}>🏦 {opco} — {factures.length} facture(s) impayée(s)</span>
                    <span style={{fontSize:'13px',fontWeight:'800',color:'#c53030'}}>{totalOpco.toLocaleString('fr-FR',{minimumFractionDigits:2})} €</span>
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
                      <thead>
                        <tr style={{backgroundColor:'#f9f9f9'}}>
                          {['Apprenant','Formation','N° dossier OPCO','Nature','Libellé','N° facture','Date facture','Dépôt OPCO','Échéance 30j','Statut','Montant (€)','Relance'].map(c=>(
                            <th key={c} style={{padding:'6px 8px',fontSize:'10px',color:'#666',fontWeight:'700',textTransform:'uppercase',textAlign:c.includes('Montant')?'right':'left'}}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {factures.map((f,i)=>{
                          let statutBg = '#fff', statutColor = '#888', statutLabel = '—';
                          if (f.joursRestants30j !== null) {
                            if (f.joursRestants30j < 0) { statutBg = '#fee'; statutColor = '#c53030'; statutLabel = `🔴 Dépassé +${Math.abs(f.joursRestants30j)}j`; }
                            else if (f.joursRestants30j <= 3) { statutBg = '#fef6e4'; statutColor = '#7a5c00'; statutLabel = `⚠️ J-${f.joursRestants30j}`; }
                            else { statutBg = '#e6f4f1'; statutColor = '#006B68'; statutLabel = `J-${f.joursRestants30j}`; }
                          } else if (f.joursDepuis !== null) {
                            statutLabel = `Facturé il y a ${f.joursDepuis}j`;
                            if (f.joursDepuis > 30) { statutBg = '#fee'; statutColor = '#c53030'; statutLabel = `🔴 +${f.joursDepuis}j sans dépôt OPCO`; }
                          }
                          return (
                            <tr key={i} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:i%2===0?'white':'#fafafa'}}>
                              <td style={{padding:'6px 8px',fontWeight:'700'}}>{f.apprenant}</td>
                              <td style={{padding:'6px 8px'}}>{f.formation}</td>
                              <td style={{padding:'6px 8px',fontSize:'10px',color:'#888'}}>{f.numeroDossierOpco || '—'}</td>
                              <td style={{padding:'6px 8px'}}>
                                <span style={{backgroundColor:f.type==='pedago'?'#e6f4f1':f.type==='equipement'?'#ede9fe':'#fef6e4',color:f.type==='pedago'?'#006B68':f.type==='equipement'?'#7c3aed':'#C8A23A',padding:'2px 6px',borderRadius:'10px',fontSize:'9px',fontWeight:'600'}}>{f.type}</span>
                              </td>
                              <td style={{padding:'6px 8px'}}>{f.label}</td>
                              <td style={{padding:'6px 8px',fontWeight:'600'}}>{f.numeroFacture}</td>
                              <td style={{padding:'6px 8px'}}>{f.dateFacture}</td>
                              <td style={{padding:'6px 8px'}}>{f.dateDepotOpco || '—'}</td>
                              <td style={{padding:'6px 8px'}}>{f.dateEcheance30j || '—'}</td>
                              <td style={{padding:'6px 8px'}}>
                                <span style={{backgroundColor:statutBg,color:statutColor,padding:'2px 6px',borderRadius:'10px',fontSize:'10px',fontWeight:'700'}}>{statutLabel}</span>
                              </td>
                              <td style={{padding:'6px 8px',textAlign:'right',fontWeight:'700',color:'#c53030'}}>{f.montantPrevu.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                              <td style={{padding:'6px 8px'}}>
                                <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                                  <input type="checkbox" checked={!!f.relanceEnvoyee} onChange={ev => marquerRelance(f, ev.target.checked)} style={{cursor:'pointer'}} />
                                  {f.relanceEnvoyee && (
                                    <input type="text" value={f.dateRelance || ''} onChange={ev => modifierDateRelance(f, ev.target.value)} placeholder="JJ/MM/AAAA" style={{fontSize:'10px',padding:'2px 4px',border:'1px solid #ccc',borderRadius:'3px',width:'85px'}} />
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
        </div>
      )}

      {/* ── PAR MOIS ── */}
      {onglet==='mois'&&(
        <div>
          <div style={{display:'flex',gap:'8px',marginBottom:'14px',alignItems:'center'}}>
            <span style={{fontSize:'13px',fontWeight:'700',color:'#006B68'}}>Année :</span>
            {ANNEES.map(an=>(
              <button key={an} onClick={()=>setFiltreAnnee(an)} style={{...btnSecondary,backgroundColor:filtreAnnee===an?'#006B68':'white',color:filtreAnnee===an?'white':'#006B68',padding:'5px 12px',fontSize:'12px'}}>
                {an}
              </button>
            ))}
          </div>

          {/* 3 tableaux par nature */}
          {[
            {nat:'pedago',label:'📚 Frais pédagogiques',color:'#006B68',kFact:'factP',kEnc:'encP'},
            {nat:'equipement',label:'🎒 1er équipement',color:'#7c3aed',kFact:'factE',kEnc:'encE'},
            {nat:'repas',label:'🍽 Frais de repas',color:'#C8A23A',kFact:'factR',kEnc:'encR'},
          ].map(nature => (
            <Card key={nature.nat} style={{marginBottom:'14px'}}>
              <h2 style={{fontSize:'13px',fontWeight:'700',color:nature.color,marginBottom:'10px'}}>{nature.label} — {filtreAnnee}</h2>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',minWidth:'900px'}}>
                  <thead>
                    <tr style={{backgroundColor:nature.color}}>
                      <th style={{...thStyle,textAlign:'left',padding:'8px 10px',width:'130px'}}>Indicateur</th>
                      {MOIS_NOMS.map(m=><th key={m} style={{...thStyle,padding:'6px 4px',fontSize:'10px'}}>{m}</th>)}
                      <th style={{...thStyle,color:'#C8A23A',padding:'8px 10px'}}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {label:'Facturé (€)',key:nature.kFact,c:'#0891b2',mode:'fact' as const},
                      {label:'Encaissé (€)',key:nature.kEnc,c:'#16a34a',mode:'enc' as const},
                    ].map((row,ri)=>{
                      const total = statsMois.reduce((s,m)=>s+(m as any)[row.key],0);
                      return (
                        <tr key={row.label} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:ri%2===0?'white':'#EAF4F3'}}>
                          <td style={{padding:'8px 10px',fontSize:'11px',fontWeight:'700',color:row.c}}>{row.label}</td>
                          {statsMois.map((m,mi)=>{
                            const v=(m as any)[row.key];
                            if (v === 0) return <td key={mi} style={{padding:'6px 4px',fontSize:'10px',textAlign:'right',color:'#ddd'}}>—</td>;
                            return <td key={mi} onClick={() => setDrilldown({titre:`${row.label} ${nature.label} — ${MOIS_NOMS[mi]} ${filtreAnnee}`, lignes: getEcheancesFiltrees({mode:row.mode,type:nature.nat,mois:mi,annee:filtreAnnee})})} style={{padding:'6px 4px',fontSize:'10px',textAlign:'right',color:row.c,fontWeight:'600',cursor:'pointer',textDecoration:'underline'}}>{v.toLocaleString('fr-FR',{minimumFractionDigits:0})}</td>;
                          })}
                          <td onClick={() => setDrilldown({titre:`${row.label} ${nature.label} — Total ${filtreAnnee}`, lignes: getEcheancesFiltrees({mode:row.mode,type:nature.nat,annee:filtreAnnee})})} style={{padding:'8px 10px',fontSize:'11px',textAlign:'right',fontWeight:'800',color:row.c,cursor:'pointer',textDecoration:'underline'}}>{total.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}

          {/* Tableau Prévisionnel à facturer */}
          <Card style={{marginBottom:'14px',border:'2px dashed #C8A23A'}}>
            <h2 style={{fontSize:'14px',fontWeight:'700',color:'#C8A23A',marginBottom:'10px'}}>🔮 Prévisionnel à facturer — {filtreAnnee}</h2>
            <p style={{fontSize:'11px',color:'#888',marginBottom:'10px',fontStyle:'italic'}}>Échéances planifiées (dateEcheance) sans facture encore émise. Clique sur un montant pour voir le détail.</p>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:'900px'}}>
                <thead>
                  <tr style={{backgroundColor:'#C8A23A'}}>
                    <th style={{...thStyle,textAlign:'left',padding:'8px 10px',width:'180px'}}>Nature</th>
                    {MOIS_NOMS.map(m=><th key={m} style={{...thStyle,padding:'6px 4px',fontSize:'10px'}}>{m}</th>)}
                    <th style={{...thStyle,color:'white',padding:'8px 10px'}}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {label:'📚 Pédagogiques',key:'prevP',type:'pedago',c:'#006B68'},
                    {label:'🎒 1er équipement',key:'prevE',type:'equipement',c:'#7c3aed'},
                    {label:'🍽 Frais de repas',key:'prevR',type:'repas',c:'#C8A23A'},
                    {label:'TOTAL',key:'prev',type:null,c:'#7a5c00',bold:true},
                  ].map((row,ri)=>{
                    const total = statsMois.reduce((s,m)=>s+(m as any)[row.key],0);
                    return (
                      <tr key={row.label} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:row.bold?'#fef6e4':(ri%2===0?'white':'#EAF4F3')}}>
                        <td style={{padding:'8px 10px',fontSize:'11px',fontWeight:row.bold?'800':'700',color:row.c}}>{row.label}</td>
                        {statsMois.map((m,mi)=>{
                          const v=(m as any)[row.key];
                          if (v === 0) return <td key={mi} style={{padding:'6px 4px',fontSize:'10px',textAlign:'right',color:'#ddd'}}>—</td>;
                          return <td key={mi} onClick={() => setDrilldown({titre:`🔮 Prévisionnel ${row.label} — ${MOIS_NOMS[mi]} ${filtreAnnee}`, lignes: getEcheancesFiltrees({mode:'prev',type:row.type||undefined,mois:mi,annee:filtreAnnee})})} style={{padding:'6px 4px',fontSize:'10px',textAlign:'right',color:row.c,fontWeight:row.bold?'800':'600',cursor:'pointer',textDecoration:'underline'}}>{v.toLocaleString('fr-FR',{minimumFractionDigits:0})}</td>;
                        })}
                        <td onClick={() => setDrilldown({titre:`🔮 Prévisionnel ${row.label} — Total ${filtreAnnee}`, lignes: getEcheancesFiltrees({mode:'prev',type:row.type||undefined,annee:filtreAnnee})})} style={{padding:'8px 10px',fontSize:'11px',textAlign:'right',fontWeight:'800',color:row.c,cursor:'pointer',textDecoration:'underline'}}>{total.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 style={{fontSize:'14px',fontWeight:'700',color:'#006B68',marginBottom:'14px'}}>📅 TOTAL toutes natures confondues — {filtreAnnee}</h2>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:'900px'}}>
                <thead>
                  <tr style={{backgroundColor:'#006B68'}}>
                    <th style={{...thStyle,textAlign:'left',padding:'10px',width:'140px'}}>Indicateur</th>
                    {MOIS_NOMS.map(m=><th key={m} style={{...thStyle,padding:'8px 6px'}}>{m}</th>)}
                    <th style={{...thStyle,color:'#C8A23A',padding:'10px'}}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {label:'Facturé (€)',key:'fact',color:'#0891b2',mode:'fact' as const},
                    {label:'Encaissé (€)',key:'enc',color:'#16a34a',mode:'enc' as const},
                    ].map((row,ri)=>{
                    const total=statsMois.reduce((s,m)=>s+(m as any)[row.key],0);
                    return (
                      <tr key={row.label} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:ri%2===0?'white':'#EAF4F3'}}>
                        <td style={{padding:'10px',fontSize:'12px',fontWeight:'700',color:row.color}}>{row.label}</td>
                        {statsMois.map((m,mi)=>{
                          const v=(m as any)[row.key];
                          if (v === 0) return <td key={mi} style={{padding:'7px 6px',fontSize:'11px',textAlign:'right',color:'#ddd'}}>—</td>;
                          if (row.mode) return <td key={mi} onClick={() => setDrilldown({titre:`${row.label} toutes natures — ${MOIS_NOMS[mi]} ${filtreAnnee}`, lignes: getEcheancesFiltrees({mode:row.mode!,mois:mi,annee:filtreAnnee})})} style={{padding:'7px 6px',fontSize:'11px',textAlign:'right',color:row.color,fontWeight:'600',cursor:'pointer',textDecoration:'underline'}}>{v.toLocaleString('fr-FR',{minimumFractionDigits:0})}</td>;
                          return <td key={mi} style={{padding:'7px 6px',fontSize:'11px',textAlign:'right',color:v>0?row.color:v<0?'#e53e3e':'#ddd',fontWeight:v!==0?'600':'400'}}>{v.toLocaleString('fr-FR',{minimumFractionDigits:0})}</td>;
                        })}
                        {row.mode ? (
                          <td onClick={() => setDrilldown({titre:`${row.label} toutes natures — Total ${filtreAnnee}`, lignes: getEcheancesFiltrees({mode:row.mode!,annee:filtreAnnee})})} style={{padding:'10px',fontSize:'12px',textAlign:'right',fontWeight:'800',color:row.color,cursor:'pointer',textDecoration:'underline'}}>{total.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                        ) : (
                          <td style={{padding:'10px',fontSize:'12px',textAlign:'right',fontWeight:'800',color:row.color}}>{total.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mini graphique */}
            <div style={{marginTop:'20px',padding:'0 4px'}}>
              <div style={{fontSize:'12px',fontWeight:'700',color:'#006B68',marginBottom:'10px'}}>📊 Aperçu graphique {filtreAnnee}</div>
              <div style={{display:'flex',gap:'3px',alignItems:'flex-end',height:'80px',borderBottom:'1px solid #e0e0e0'}}>
                {statsMois.map((m,i)=>{
                  const h=Math.round((m.fact/maxMois)*72);
                  const hE=m.fact>0?Math.round((m.enc/m.fact)*h):0;
                  return (
                    <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
                      <div style={{width:'100%',height:'72px',display:'flex',alignItems:'flex-end'}}>
                        <div style={{width:'100%',height:h+'px',backgroundColor:'#0891b220',borderRadius:'2px 2px 0 0',position:'relative',overflow:'hidden'}}>
                          <div style={{position:'absolute',bottom:0,width:'100%',height:hE+'px',backgroundColor:'#16a34a'}}/>
                        </div>
                      </div>
                      <div style={{fontSize:'8px',color:'#888',marginTop:'3px',textAlign:'center'}}>{MOIS_NOMS[i]}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:'flex',gap:'12px',marginTop:'8px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{width:'10px',height:'10px',backgroundColor:'#0891b220',border:'1px solid #0891b2',borderRadius:'2px'}}/><span style={{fontSize:'10px',color:'#555'}}>Facturé</span></div>
                <div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{width:'10px',height:'10px',backgroundColor:'#16a34a',borderRadius:'2px'}}/><span style={{fontSize:'10px',color:'#555'}}>Encaissé</span></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── PAR ANNÉE ── */}
      {onglet==='annee'&&(
        <Card>
          <h2 style={{fontSize:'14px',fontWeight:'700',color:'#006B68',marginBottom:'14px'}}>📊 Synthèse par année</h2>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{backgroundColor:'#006B68'}}>
                {['Année','Dossiers','En attente','Accordé (€)','Facturé (€)','Reste à fact. (€)','Encaissé (€)','Non encaissé au 31/12 (€)'].map((c,i)=>(
                  <th key={c} style={{...thStyle,textAlign:i===0?'left':'right',padding:'10px'}}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statsAnnee.map((s,i)=>{
                const reste=s.accord-s.fact;
                return (
                  <tr key={s.an} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:i%2===0?'white':'#EAF4F3'}}>
                    <td style={{padding:'10px',fontSize:'13px',fontWeight:'800',color:'#006B68'}}>{s.an}</td>
                    <td style={tdNum(s.nb)}>{s.nb}</td>
                    <td style={{...tdNum(s.att),color:s.att>0?'#C8A23A':'#888'}}>{s.att}</td>
                    <td style={{...tdNum(s.accord,'#7c3aed',true)}}>{s.accord.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                    <td style={{...tdNum(s.fact,'#0891b2',true)}}>{s.fact.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                    <td style={{...tdNum(reste,reste>0?'#C8A23A':'#16a34a',true)}}>{reste.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                    <td style={{...tdNum(s.enc,'#16a34a',true)}}>{s.enc.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                    <td style={{...tdNum(s.nonEnc,s.nonEnc>0?'#C8A23A':'#16a34a',true)}}>{s.nonEnc.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                  </tr>
                );
              })}
              <tr style={{backgroundColor:'#006B68'}}>
                {[
                  {v:'TOTAL',c:'white',al:'left'},{v:apcs.length,c:'white'},{v:apcs.filter(a=>a.statut==='En attente').length,c:'#fef6e4'},
                  {v:totalAccorde,c:'#C8A23A'},{v:totalFacture,c:'#C8A23A'},{v:totalReste,c:'#C8A23A'},{v:totalEncaisse,c:'#C8A23A'},{v:statsAnnee.reduce((s,a)=>s+a.nonEnc,0),c:'#fca5a5'},
                ].map((t,i)=>(
                  <td key={i} style={{padding:'10px',fontSize:'12px',fontWeight:'700',color:t.c,textAlign:(t as any).al||'right'}}>
                    {typeof t.v==='number'&&i>1?t.v.toLocaleString('fr-FR',{minimumFractionDigits:2}):t.v}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {/* Modale Drill-down — détail des montants */}
      {drilldown && (
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px'}}>
          <div style={{backgroundColor:'white',borderRadius:'12px',padding:'24px',width:'95%',maxWidth:'1100px',maxHeight:'88vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <h2 style={{fontSize:'16px',fontWeight:'800',color:'#006B68'}}>🔍 {drilldown.titre}</h2>
              <button onClick={() => setDrilldown(null)} style={{backgroundColor:'#f0f0f0',border:'none',borderRadius:'6px',padding:'6px 12px',cursor:'pointer',fontSize:'13px',fontWeight:'600'}}>✕ Fermer</button>
            </div>
            {drilldown.lignes.length === 0 ? (
              <div style={{padding:'40px',textAlign:'center',color:'#888',fontStyle:'italic'}}>Aucune ligne trouvée.</div>
            ) : (
              <>
                <div style={{fontSize:'12px',color:'#666',marginBottom:'10px'}}>
                  <strong>{drilldown.lignes.length}</strong> ligne(s) — Total :
                  <strong style={{color:'#006B68',marginLeft:'8px'}}>
                    {drilldown.lignes.reduce((s,l) => s + (l.__col === 'enc' ? l.montantPaye : l.montantPrevu), 0).toLocaleString('fr-FR',{minimumFractionDigits:2})} €
                  </strong>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                    <thead>
                      <tr style={{backgroundColor:'#006B68'}}>
                        {['Apprenant','Formation','Entreprise','OPCO','Nature','Libellé','N° Facture','Date facture','Date paiement','Mt prévu (€)','Mt payé (€)'].map(c=>(
                          <th key={c} style={{padding:'8px 10px',fontSize:'10px',color:'white',fontWeight:'700',textTransform:'uppercase',textAlign:c.includes('Mt')?'right':'left'}}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {drilldown.lignes.map((l,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:i%2===0?'white':'#EAF4F3'}}>
                          <td style={{padding:'8px 10px',fontWeight:'700'}}>{l.apprenant}</td>
                          <td style={{padding:'8px 10px'}}>{l.formation}</td>
                          <td style={{padding:'8px 10px'}}>{l.entreprise}</td>
                          <td style={{padding:'8px 10px'}}>{l.opco}</td>
                          <td style={{padding:'8px 10px'}}>
                            <span style={{backgroundColor:l.type==='pedago'?'#e6f4f1':l.type==='equipement'?'#ede9fe':'#fef6e4',color:l.type==='pedago'?'#006B68':l.type==='equipement'?'#7c3aed':'#C8A23A',padding:'2px 6px',borderRadius:'10px',fontSize:'10px',fontWeight:'600'}}>{l.type}</span>
                          </td>
                          <td style={{padding:'8px 10px'}}>{l.label}</td>
                          <td style={{padding:'8px 10px',fontWeight:'600'}}>{l.numeroFacture || '—'}</td>
                          <td style={{padding:'8px 10px'}}>{l.dateFacture || '—'}</td>
                          <td style={{padding:'8px 10px'}}>{l.datePaiement || '—'}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',fontWeight:'600',color:'#0891b2'}}>{l.montantPrevu.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',fontWeight:'700',color:l.montantPaye>0?'#16a34a':'#888'}}>{l.montantPaye.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modale création */}
      {modale&&(
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{backgroundColor:'white',borderRadius:'12px',padding:'28px',width:'580px',maxHeight:'88vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
            <h2 style={{fontSize:'16px',fontWeight:'700',color:'#006B68',marginBottom:'20px'}}>+ Nouveau dossier APC</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div>
                <label style={{fontSize:'11px',color:'#888',textTransform:'uppercase',fontWeight:'600',display:'block',marginBottom:'3px'}}>Apprenant *</label>
                <select style={inputStyle} value={form.apprenantId??''} onChange={e=>{const a=APPRENANTS_REELS.find(ap=>ap.id===e.target.value);setForm(p=>({...p,apprenantId:e.target.value,dateDebutContrat:a?.dateDebutContrat??'',dateFinContrat:a?.dateFinContrat??''}));}}>
                  <option value="">Choisir un apprenant...</option>
                  {APPRENANTS_REELS.filter(a=>a.statut==='En cours'||a.statut==='P2S').sort((a,b)=>a.nom.localeCompare(b.nom)).map(a=>(
                    <option key={a.id} value={a.id}>{a.nom} {a.prenom} — {a.formation} — {a.entreprise||'P2S'}</option>
                  ))}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div><label style={{fontSize:'11px',color:'#888',textTransform:'uppercase',fontWeight:'600',display:'block',marginBottom:'3px'}}>OPCO *</label>
                  <select style={inputStyle} value={form.opco??''} onChange={e=>setForm(p=>({...p,opco:e.target.value}))}>
                    <option value="">Choisir...</option>{OPCOS.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:'11px',color:'#888',textTransform:'uppercase',fontWeight:'600',display:'block',marginBottom:'3px'}}>Année</label>
                  <select style={inputStyle} value={form.annee??'2026'} onChange={e=>setForm(p=>({...p,annee:e.target.value}))}>
                    {ANNEES.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                {[
                  {l:'N° dossier OPCO',k:'numeroDossierOpco',ph:'Ex: 2509CA040253'},
                  {l:'N° DECA',k:'numeroDeca',ph:'Ex: 974202604018937'},
                  {l:'Début financement *',k:'dateDebutFormation',ph:'JJ/MM/AAAA'},
                  {l:'Début contrat',k:'dateDebutContrat',ph:'JJ/MM/AAAA'},
                  {l:'Fin contrat',k:'dateFinContrat',ph:'JJ/MM/AAAA'},
                  {l:'Nb jours formation',k:'nbJoursFormation',ph:''},
                ].map(f=>(
                  <div key={f.k}><label style={{fontSize:'11px',color:'#888',textTransform:'uppercase',fontWeight:'600',display:'block',marginBottom:'3px'}}>{f.l}</label>
                    <input style={inputStyle} value={(form as any)[f.k]??''} placeholder={f.ph} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
              <div style={{backgroundColor:'#EAF4F3',borderRadius:'8px',padding:'12px'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:'#006B68',textTransform:'uppercase',marginBottom:'8px'}}>💰 Montants APC</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                  {[
                    {l:'NPEC branche (€)',k:'npecBranche'},{l:'Coût péda demandé (€)',k:'coutPedagoDemande'},
                    {l:'Coût péda accordé (€)',k:'coutPedagoAccorde'},{l:'1er équipement (€)',k:'premierEquipement',d:500},
                    {l:'Frais repas (€)',k:'fraisRepas'},{l:'Reste à charge (€)',k:'resteACharge'},
                  ].map(f=>(
                    <div key={f.k}><label style={{fontSize:'10px',color:'#555',display:'block',marginBottom:'2px'}}>{f.l}</label>
                      <input type="number" step="0.01" style={inputStyle} value={(form as any)[f.k]??(f as any).d??''} onChange={e=>setForm(p=>({...p,[f.k]:parseFloat(e.target.value)||0}))}/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'20px'}}>
              <button onClick={()=>{setModale(false);setForm({statut:'En attente',annee:'2026'});}} style={btnSecondary}>Annuler</button>
              <button onClick={creerAPC} disabled={!form.apprenantId||!form.opco||!form.dateDebutFormation} style={{...btnPrimary,opacity:(!form.apprenantId||!form.opco||!form.dateDebutFormation)?0.5:1}}>✅ Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}