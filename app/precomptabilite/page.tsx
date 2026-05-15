'use client';

import { useState, useEffect } from 'react';
import { APPRENANTS_REELS } from '../../data/mockApprenants_reels';
import Card from '../../components/Card';

const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };
const btnPrimary: React.CSSProperties = { backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };

const OPCOS = ['AKTO','ATLAS','AFDAS','OPCO EP','OCAPIAT','OPCOMMERCE','UNIFORMATION','CNFPT','CONSTRUCTYS','OPCO MOBILITES','OPCO 2i'];
const MOIS_NOMS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const ANNEES = ['2024','2025','2026','2027'];

type Echeance = {
  id: string; label: string; type: 'pedago'|'equipement'|'repas';
  annee: number; pourcentage: number; montantPrevu: number;
  dateEcheancier: string; numeroFacture: string; dateFacture: string;
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

export default function Facturation() {
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

  useEffect(()=>{
    try { const s=localStorage.getItem('easycfa_apcs_v2'); if(s) setApcs(JSON.parse(s)); } catch {}
  },[]);

  function save(liste: APC[]) { setApcs(liste); localStorage.setItem('easycfa_apcs_v2',JSON.stringify(liste)); }

  function creerAPC() {
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
    save([...apcs,n]); setModale(false); setForm({statut:'En attente',annee:'2026',echeances:[]}); setApcSel(n);
  }

  function maj(champ:string,val:any) {
    if (!apcSel) return;
    const u={...apcSel,[champ]:val}; setApcSel(u); save(apcs.map(a=>a.id===u.id?u:a));
  }

  function majEch(eid:string,champ:string,val:any) {
    if (!apcSel) return;
    const echs=apcSel.echeances.map(e=>{
      if (e.id!==eid) return e;
      const u={...e,[champ]:val,modifiee:true};
      if (champ==='dateDepotOpco'&&val) {
        const p=val.split('/');
        if (p.length===3) {
          const d=new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));
          d.setDate(d.getDate()+30); u.dateEcheance30j=d.toLocaleDateString('fr-FR');
        }
      }
      return u;
    });
    const u={...apcSel,echeances:echs}; setApcSel(u); save(apcs.map(a=>a.id===u.id?u:a));
  }

  function supprimer(id:string) {
    if (!confirm('Supprimer ce dossier ?')) return;
    save(apcs.filter(a=>a.id!==id)); if(apcSel?.id===id) setApcSel(null);
  }

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

  // Filtres dossiers
  const apcsFiltres=apcs.filter(a=>{
    const mO=!filtreOpco||a.opco===filtreOpco;
    const mF=!filtreFormation||a.formation===filtreFormation;
    const mS=!filtreStatut||a.statut===filtreStatut;
    const mR=!recherche||(a.apprenantNom+' '+a.apprenantPrenom+' '+a.entreprise+' '+a.opco).toLowerCase().includes(recherche.toLowerCase());
    return mO&&mF&&mS&&mR;
  });

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

  // Stats mois
  const statsMois=MOIS_NOMS.map((_,mi)=>{
    const fact=apcs.reduce((s,a)=>s+a.echeances.filter(e=>{
      if(!e.dateFacture) return false;
      const p=e.dateFacture.split('/');
      return p.length===3&&parseInt(p[1])-1===mi&&p[2]===filtreAnnee;
    }).reduce((se,e)=>se+e.montantPrevu,0),0);
    const enc=apcs.reduce((s,a)=>s+a.echeances.filter(e=>{
      if(!e.datePaiement) return false;
      const p=e.datePaiement.split('/');
      return p.length===3&&parseInt(p[1])-1===mi&&p[2]===filtreAnnee;
    }).reduce((se,e)=>se+(e.montantPaye||0),0),0);
    return {fact,enc,att:fact-enc};
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
    return {an,nb:l.length,att:l.filter(a=>a.statut==='En attente').length,accord:l.reduce((s,a)=>s+a.coutPedagoAccorde+a.premierEquipement+a.fraisRepas,0),fact,enc};
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

      {/* Alertes J-3 */}
      {alertes.length>0&&(
        <div style={{backgroundColor:'#fde8e8',border:'1.5px solid #e53e3e',borderRadius:'10px',padding:'12px 16px',marginBottom:'14px'}}>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#e53e3e',marginBottom:'6px'}}>🔴 {alertes.length} échéance(s) arrivant à terme dans 3 jours ou moins !</div>
          {alertes.map((a,i)=>(
            <div key={i} style={{fontSize:'11px',color:'#c53030',marginBottom:'2px'}}>
              ⚠️ <strong>{a.apprenti}</strong> — {a.opco} — {a.label} — le <strong>{a.date}</strong>
              {a.jours===0?<span style={{fontWeight:'700'}}> (AUJOURD'HUI !)</span>:<span> (J-{a.jours})</span>}
            </div>
          ))}
        </div>
      )}

      {/* Stats globales */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'8px'}}>
        {[
          {label:'Dossiers',v:apcsAnnee.length.toString(),c:'#006B68'},
          {label:'Total accordé',v:totalAccorde.toLocaleString('fr-FR',{minimumFractionDigits:2})+' €',c:'#7c3aed'},
          {label:'Total facturé',v:totalFacture.toLocaleString('fr-FR',{minimumFractionDigits:2})+' €',c:'#0891b2'},
          {label:'Total encaissé',v:totalEncaisse.toLocaleString('fr-FR',{minimumFractionDigits:2})+' €',c:'#16a34a'},
          {label:'En attente règl.',v:totalEnAttente.toLocaleString('fr-FR',{minimumFractionDigits:2})+' €',c:'#e53e3e'},
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
        return (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'16px'}}>
            {[
              {label:'Frais pédagogiques',accord:totalPeda,facture:factPeda,color:'#006B68',icon:'📚'},
              {label:'1er équipement',accord:totalEquip,facture:factEquip,color:'#7c3aed',icon:'🎒'},
              {label:'Frais de repas',accord:totalRepas,facture:factRepas,color:'#C8A23A',icon:'🍽'},
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
                      <div style={{fontSize:'9px',color:'#888',textTransform:'uppercase',fontWeight:'600'}}>Reste</div>
                      <div style={{fontSize:'13px',fontWeight:'800',color:(s.accord-s.facture)>0?'#C8A23A':'#16a34a'}}>{(s.accord-s.facture).toLocaleString('fr-FR',{minimumFractionDigits:2})} €</div>
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
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={ev=>{const f=ev.target.files?.[0];if(f){maj('apcRecu',f.name);maj('dateReception',new Date().toLocaleDateString('fr-FR'));maj('statut','Accordé');}}}/>
                    </label>
                    {apcSel.apcRecu&&<span style={{fontSize:'11px',color:'#006B68',fontWeight:'600'}}>✅ {apcSel.apcRecu}</span>}
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
                                  📎 Importer<input type="file" accept=".pdf,.jpg" style={{display:'none'}} onChange={ev=>{const f=ev.target.files?.[0];if(f)majEch(e.id,'fichierFacture',f.name);}}/>
                                </label>
                              </div>
                            )}
                            {e.fichierFacture&&(
                              <div style={{backgroundColor:'#e6f4f1',padding:'4px 10px',fontSize:'10px',color:'#006B68',fontWeight:'600',display:'flex',justifyContent:'space-between'}}>
                                <span>✅ {e.fichierFacture}</span>
                                <label style={{backgroundColor:'#006B68',color:'white',borderRadius:'4px',padding:'2px 8px',fontSize:'10px',cursor:'pointer'}}>
                                  🔄 Remplacer<input type="file" accept=".pdf,.jpg" style={{display:'none'}} onChange={ev=>{const f=ev.target.files?.[0];if(f)majEch(e.id,'fichierFacture',f.name);}}/>
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
                                <button onClick={()=>maj('echeances',apcSel.echeances.filter(ec=>ec.id!==e.id))} style={{backgroundColor:'rgba(255,255,255,0.2)',color:'white',border:'none',borderRadius:'4px',padding:'1px 5px',fontSize:'10px',cursor:'pointer'}}>✕</button>
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
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAR OPCO ── */}
      {onglet==='opco'&&(
        <Card>
          <h2 style={{fontSize:'14px',fontWeight:'700',color:'#006B68',marginBottom:'14px'}}>🏦 Synthèse par OPCO</h2>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:'700px'}}>
              <thead>
                <tr style={{backgroundColor:'#006B68'}}>
                  {['OPCO','Dossiers','En attente','Accordé (€)','Facturé (€)','Reste à fact. (€)','Encaissé (€)','En att. règl. (€)'].map((c,i)=>(
                    <th key={c} style={{...thStyle,textAlign:i===0?'left':'right',padding:'10px'}}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statsOpco.map((s,i)=>{
                  const reste=s.accord-s.fact, att=s.fact-s.enc;
                  return (
                    <tr key={s.opco} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:i%2===0?'white':'#EAF4F3'}}>
                      <td style={{padding:'10px',fontSize:'12px',fontWeight:'700',color:'#006B68'}}>{s.opco}</td>
                      <td style={tdNum(s.nb)}>{s.nb}</td>
                      <td style={{...tdNum(s.att),color:s.att>0?'#C8A23A':'#888'}}>{s.att}</td>
                      <td style={{...tdNum(s.accord,'#7c3aed',true)}}>{s.accord.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                      <td style={{...tdNum(s.fact,'#0891b2',true)}}>{s.fact.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                      <td style={{...tdNum(reste,reste>0?'#C8A23A':'#16a34a',true)}}>{reste.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                      <td style={{...tdNum(s.enc,'#16a34a',true)}}>{s.enc.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                      <td style={{...tdNum(att,att>0?'#e53e3e':'#16a34a',true)}}>{att.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                    </tr>
                  );
                })}
                <tr style={{backgroundColor:'#006B68'}}>
                  {[
                    {v:'TOTAL',c:'white',al:'left'},{v:apcs.length,c:'white'},{v:apcs.filter(a=>a.statut==='En attente').length,c:'#fef6e4'},
                    {v:totalAccorde,c:'#C8A23A'},{v:totalFacture,c:'#C8A23A'},{v:totalReste,c:'#C8A23A'},{v:totalEncaisse,c:'#C8A23A'},{v:totalEnAttente,c:'#fca5a5'},
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
          <Card>
            <h2 style={{fontSize:'14px',fontWeight:'700',color:'#006B68',marginBottom:'14px'}}>📅 Chiffre d'affaires mensuel — {filtreAnnee}</h2>
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
                    {label:'Facturé (€)',key:'fact',color:'#0891b2'},
                    {label:'Encaissé (€)',key:'enc',color:'#16a34a'},
                    {label:'En att. règl. (€)',key:'att',color:'#e53e3e'},
                  ].map((row,ri)=>{
                    const total=statsMois.reduce((s,m)=>s+(m as any)[row.key],0);
                    return (
                      <tr key={row.label} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:ri%2===0?'white':'#EAF4F3'}}>
                        <td style={{padding:'10px',fontSize:'12px',fontWeight:'700',color:row.color}}>{row.label}</td>
                        {statsMois.map((m,mi)=>{
                          const v=(m as any)[row.key];
                          return <td key={mi} style={{padding:'7px 6px',fontSize:'11px',textAlign:'right',color:v>0?row.color:v<0?'#e53e3e':'#ddd',fontWeight:v!==0?'600':'400'}}>{v!==0?v.toLocaleString('fr-FR',{minimumFractionDigits:0}):'—'}</td>;
                        })}
                        <td style={{padding:'10px',fontSize:'12px',textAlign:'right',fontWeight:'800',color:row.color}}>{total.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
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
                {['Année','Dossiers','En attente','Accordé (€)','Facturé (€)','Reste à fact. (€)','Encaissé (€)','En att. règl. (€)'].map((c,i)=>(
                  <th key={c} style={{...thStyle,textAlign:i===0?'left':'right',padding:'10px'}}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statsAnnee.map((s,i)=>{
                const reste=s.accord-s.fact, att=s.fact-s.enc;
                return (
                  <tr key={s.an} style={{borderBottom:'1px solid #f0f0f0',backgroundColor:i%2===0?'white':'#EAF4F3'}}>
                    <td style={{padding:'10px',fontSize:'13px',fontWeight:'800',color:'#006B68'}}>{s.an}</td>
                    <td style={tdNum(s.nb)}>{s.nb}</td>
                    <td style={{...tdNum(s.att),color:s.att>0?'#C8A23A':'#888'}}>{s.att}</td>
                    <td style={{...tdNum(s.accord,'#7c3aed',true)}}>{s.accord.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                    <td style={{...tdNum(s.fact,'#0891b2',true)}}>{s.fact.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                    <td style={{...tdNum(reste,reste>0?'#C8A23A':'#16a34a',true)}}>{reste.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                    <td style={{...tdNum(s.enc,'#16a34a',true)}}>{s.enc.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                    <td style={{...tdNum(att,att>0?'#e53e3e':'#16a34a',true)}}>{att.toLocaleString('fr-FR',{minimumFractionDigits:2})}</td>
                  </tr>
                );
              })}
              <tr style={{backgroundColor:'#006B68'}}>
                {[
                  {v:'TOTAL',c:'white',al:'left'},{v:apcs.length,c:'white'},{v:apcs.filter(a=>a.statut==='En attente').length,c:'#fef6e4'},
                  {v:totalAccorde,c:'#C8A23A'},{v:totalFacture,c:'#C8A23A'},{v:totalReste,c:'#C8A23A'},{v:totalEncaisse,c:'#C8A23A'},{v:totalEnAttente,c:'#fca5a5'},
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