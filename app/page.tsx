'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { COLORS } from '../lib/constants';
import { chargerApprentis } from '../data/apprentisSupabase';
import { chargerApcs } from '../data/apcsSupabase';
import { chargerEntretiens as chargerEntretiensSupabase } from '../data/entretiensSupabase';
import { verifierConformiteSifa } from '../data/mockApprenants_reels';
import { chargerOuCreerEntretiensApprenant, calculerDatePrevue, calculerStatut, STATUT_STYLE, LIBELLE_TYPE } from '../data/mockEntretiens';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ── Helpers dates ────────────────────────────────────────────────────────────
function parseDateFr(str?: string): Date | null {
  if (!str) return null;
  const v = String(str).trim();
  if (v.includes('-')) {
    const p = v.slice(0, 10).split('-');
    if (p.length !== 3) return null;
    const d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    return isNaN(d.getTime()) ? null : d;
  }
  const p = v.split('/');
  if (p.length !== 3) return null;
  const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  return isNaN(d.getTime()) ? null : d;
}

const MOIS_NOMS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const ANNEES = ['2024', '2025', '2026', '2027'];

// Chez PAM OI, une rupture = statut 'Rupture' (le champ maintienFormation distingue MEF/FMEF)
function estRupture(statut?: string): boolean {
  return statut === 'Rupture';
}

// Le contrat d'un apprenant chevauche-t-il l'année civile N ?
// chevauchement = dateDebutContrat <= 31/12/N ET dateFinContrat >= 01/01/N
function contratChevaucheAnnee(a: any, annee: number): boolean {
  const debut = parseDateFr(a.dateDebutContrat);
  const fin = parseDateFr(a.dateFinContrat);
  if (!debut || !fin) return false; // dates incomplètes → géré par l'alerte
  const debutAnnee = new Date(annee, 0, 1);
  const finAnnee = new Date(annee, 11, 31);
  return debut <= finAnnee && fin >= debutAnnee;
}

// ── Carte chiffre clé ────────────────────────────────────────────────────────
function ChiffreCle({ icone, label, valeur, sous, couleur, href, onClick }: {
  icone: string; label: string; valeur: string | number; sous?: string; couleur: string; href?: string; onClick?: () => void;
}) {
  const contenu = (
    <div style={{
      backgroundColor: 'white', borderRadius: '12px', padding: '16px',
      borderTop: `4px solid ${couleur}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      cursor: 'pointer', height: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{ fontSize: '20px' }}>{icone}</div>
        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.4px' }}>
          {label}
        </div>
      </div>
      <div style={{ fontSize: '26px', fontWeight: '800', color: couleur, lineHeight: '1.1' }}>
        {valeur}
      </div>
      {sous && <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', fontWeight: '500' }}>{sous}</div>}
    </div>
  );
  if (onClick) return <div onClick={onClick} style={{ cursor: 'pointer' }}>{contenu}</div>;
  return <Link href={href || '#'} style={{ textDecoration: 'none' }}>{contenu}</Link>;
}

function CarteSection({ titre, icone, couleur, children, href }: {
  titre: string; icone: string; couleur: string; children: React.ReactNode; href?: string;
}) {
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '14px', padding: '18px',
      borderLeft: `4px solid ${couleur}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: couleur }}>{icone} {titre}</h3>
        {href && <Link href={href} style={{ fontSize: '11px', color: couleur, fontWeight: '600', textDecoration: 'none' }}>Voir tout →</Link>}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [apprenants, setApprenants] = useState<any[]>([]);
  const [apcs, setApcs] = useState<any[]>([]);
  const [entretiensRetard, setEntretiensRetard] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [annee, setAnnee] = useState<string>(new Date().getFullYear().toString());
  const [listeDetail, setListeDetail] = useState<{ titre: string; couleur: string; apprenants: any[] } | null>(null);
  const [listeFinance, setListeFinance] = useState<{ titre: string; couleur: string; lignes: any[]; total: number } | null>(null);

  useEffect(() => {
    (async () => {
      let apps: any[] = [];
      let apcsList: any[] = [];
      try {
        apps = await chargerApprentis();
        console.log(`[Dashboard] ${apps.length} apprenants chargés depuis Supabase ✅`);
      } catch (e) {
        console.error('[Dashboard] Erreur chargement apprenants Supabase', e);
      }
      try {
        apcsList = await chargerApcs();
        console.log(`[Dashboard] ${apcsList.length} APCs chargés depuis Supabase ✅`);
      } catch (e) {
        console.error('[Dashboard] Erreur chargement APCs Supabase', e);
      }
      setApprenants(apps.filter((a: any) => a.archive !== true));
      setApcs(apcsList);

      const retards: any[] = [];
      try {
        const tousEntretiens = await chargerEntretiensSupabase();
        const parApprenant = new Map<string, any[]>();
        tousEntretiens.forEach((e: any) => {
          const l = parApprenant.get(e.apprenantId) || [];
          l.push(e);
          parApprenant.set(e.apprenantId, l);
        });
        apps.filter(a => a.statut === 'En cours' && a.archive !== true).forEach(a => {
          const ents = parApprenant.get(a.id) || [];
          ['6mois', '2moisAvantFin'].forEach(type => {
            const ent = ents.find((e: any) => e.type === type);
            if (ent && (ent.statut === 'fait' || ent.statut === 'nonFait')) return;
            const datePrevue = ent?.datePrevue || calculerDatePrevue(type as any, a.dateDebutContrat, a.dateFinContrat);
            if (!datePrevue) return;
            const statut = calculerStatut({ ...(ent || {}), datePrevue, statut: ent?.statut });
            if (statut === 'enRetard') {
              retards.push({ ...(ent || {}), type, datePrevue, apprenantNom: `${a.prenom} ${a.nom}`, apprenantId: a.id });
            }
          });
        });
        console.log(`[Dashboard] ${tousEntretiens.length} entretien(s) chargés depuis Supabase ✅`);
      } catch (e) {
        console.error('[Dashboard] Erreur chargement entretiens Supabase', e);
      }
      setEntretiensRetard(retards);
      setChargement(false);
    })();
  }, []);

  const anneeNum = parseInt(annee);

  // ── Apprenants rattachés à l'année sélectionnée ─────────────────────────
  // En cours : contrat chevauche l'année
  const enCours = apprenants.filter(a => a.statut === 'En cours' && contratChevaucheAnnee(a, anneeNum));
  // Rupture : contrat chevauchait l'année
  const ruptures = apprenants.filter(a => estRupture(a.statut) && contratChevaucheAnnee(a, anneeNum));
  // P2S : dateDebutFormation dans l'année
  const p2s = apprenants.filter(a => {
    if (a.statut !== 'P2S') return false;
    const d = parseDateFr(a.dateDebutFormation);
    return d && d.getFullYear() === anneeNum;
  });

  // Apprenants avec dates manquantes (à compléter pour un comptage fiable par année)
  const datesManquantes = apprenants.filter(a => {
    if (a.statut === 'Terminé') return false;
    // P2S : besoin d'une date de début de formation
    if (a.statut === 'P2S') return !parseDateFr(a.dateDebutFormation);
    // CA / Rupture : besoin des dates de contrat
    if (a.statut === 'En cours' || estRupture(a.statut)) {
      return !parseDateFr(a.dateDebutContrat) || !parseDateFr(a.dateFinContrat);
    }
    return false;
  });

  const sifaManquants = enCours.filter(a => verifierConformiteSifa(a).length > 0);

  const donneesCamembert = [
    { name: 'En cours (CA)', value: enCours.length, color: '#006B68' },
    { name: 'P2S', value: p2s.length, color: '#C8A23A' },
    { name: 'Rupture', value: ruptures.length, color: '#e53e3e' },
  ].filter(d => d.value > 0);

  // ── Répartition Hommes / Femmes (apprenants rattachés à l'année) ──────────
  // On agrège les mêmes apprenants que le camembert ci-dessus (en cours + P2S + ruptures de l'année).
  const apprenantsAnnee = [...enCours, ...p2s, ...ruptures];
  function sexeNormalise(s?: string): 'Femme' | 'Homme' | 'Non renseigné' {
    const v = (s || '').trim().toUpperCase();
    if (v.startsWith('F')) return 'Femme';   // Féminin / F
    if (v.startsWith('M')) return 'Homme';   // Masculin / M
    return 'Non renseigné';
  }
  const nbFemmes = apprenantsAnnee.filter(a => sexeNormalise(a.sexe) === 'Femme').length;
  const nbHommes = apprenantsAnnee.filter(a => sexeNormalise(a.sexe) === 'Homme').length;
  const nbSexeNR = apprenantsAnnee.filter(a => sexeNormalise(a.sexe) === 'Non renseigné').length;
  const listeFemmes = apprenantsAnnee.filter(a => sexeNormalise(a.sexe) === 'Femme');
  const listeHommes = apprenantsAnnee.filter(a => sexeNormalise(a.sexe) === 'Homme');
  const listeSexeNR = apprenantsAnnee.filter(a => sexeNormalise(a.sexe) === 'Non renseigné');
  const donneesSexe = [
    { name: 'Femmes', value: nbFemmes, color: '#C8567A', liste: listeFemmes },
    { name: 'Hommes', value: nbHommes, color: '#006B68', liste: listeHommes },
    { name: 'Non renseigné', value: nbSexeNR, color: '#bbbbbb', liste: listeSexeNR },
  ].filter(d => d.value > 0);

  // ── Facturation par année sélectionnée ──────────────────────────────────
  const moisActuel = new Date().getMonth();
  const estAnneeCourante = anneeNum === new Date().getFullYear();

  const caParMois = MOIS_NOMS.map((nom, mi) => {
    let total = 0;
    apcs.forEach((a: any) => {
      (a.echeances || []).forEach((e: any) => {
        if (!e.datePaiement) return;
        const p = e.datePaiement.split('/');
        if (p.length !== 3) return;
        if (parseInt(p[1]) - 1 === mi && parseInt(p[2]) === anneeNum) {
          total += e.montantPaye || 0;
        }
      });
    });
    return { mois: nom, CA: Math.round(total) };
  });

  // Détail encaissements de l'année (modale + total exact au centime)
  const detailEncaisse = apcs.flatMap((a: any) =>
    (a.echeances || []).filter((e: any) => {
      if (!e.datePaiement) return false;
      const p = e.datePaiement.split('/');
      return p.length === 3 && parseInt(p[2]) === anneeNum;
    }).map((e: any) => ({
      apprenant: `${a.apprenantPrenom} ${a.apprenantNom}`,
      opco: a.opco, label: e.label,
      montant: e.montantPaye || 0, date: e.datePaiement,
    }))
  ).sort((x, y) => {
    const px = x.date.split('/'), py = y.date.split('/');
    return new Date(parseInt(px[2]), parseInt(px[1]) - 1, parseInt(px[0])).getTime() - new Date(parseInt(py[2]), parseInt(py[1]) - 1, parseInt(py[0])).getTime();
  });

  const caEncaisseAnnee = detailEncaisse.reduce((s, l) => s + l.montant, 0);

  // À facturer : échéance non encore facturée (PDF fichierFacture absent), dont la date prévue
  // tombe dans l'année sélectionnée. Pour l'année courante : ce mois + tous les retards (dépassés).
  const finMoisCourant = new Date(new Date().getFullYear(), moisActuel + 1, 0, 23, 59, 59);
  const aFacturer = apcs.flatMap((a: any) =>
    (a.echeances || []).filter((e: any) => {
      if (e.fichierFacture) return false; // PDF importé → facture établie → sort de la liste
      const d = parseDateFr(e.dateEcheance);
      if (!d) return false;
      if (d.getFullYear() !== anneeNum) return false;
      if (estAnneeCourante) {
        // Ce mois + tout ce qui est déjà dépassé (retards) : échéance <= fin du mois courant
        return d <= finMoisCourant;
      }
      return true; // autre année : toutes les échéances de l'année
    }).map((e: any) => {
      const d = parseDateFr(e.dateEcheance);
      const enRetard = d ? d < new Date(new Date().getFullYear(), moisActuel, 1) : false;
      return { apprenant: `${a.apprenantPrenom} ${a.apprenantNom}`, opco: a.opco, label: e.label, montant: e.montantPrevu || 0, date: e.dateEcheance, enRetard };
    })
  ).sort((x, y) => {
    const px = (x.date || '').split('/'), py = (y.date || '').split('/');
    if (px.length !== 3 || py.length !== 3) return 0;
    return new Date(parseInt(px[2]), parseInt(px[1]) - 1, parseInt(px[0])).getTime() - new Date(parseInt(py[2]), parseInt(py[1]) - 1, parseInt(py[0])).getTime();
  });
  const montantAFacturer = aFacturer.reduce((s: number, e: any) => s + e.montant, 0);
  const nbRetard = aFacturer.filter((e: any) => e.enRetard).length;
  const labelAFacturer = estAnneeCourante ? 'À facturer (ce mois + retards)' : `À facturer ${annee}`;

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (chargement) {
    return <div style={{ padding: '40px', textAlign: 'center', color: COLORS.textMuted }}>Chargement du tableau de bord…</div>;
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* EN-TÊTE */}
      <div style={{
        background: 'linear-gradient(135deg, #006B68 0%, #008A85 100%)',
        borderRadius: '16px', padding: '24px 28px', marginBottom: '20px',
        color: 'white', boxShadow: '0 4px 16px rgba(0, 107, 104, 0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>👋 Bonjour Paméla !</h1>
            <p style={{ fontSize: '14px', opacity: 0.9, textTransform: 'capitalize' }}>📅 {dateAujourdhui}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', opacity: 0.85, fontWeight: '500' }}>CFA PAM OI Formation</div>
            <div style={{ fontSize: '11px', opacity: 0.75 }}>🏝️ La Réunion</div>
          </div>
        </div>
      </div>

      {/* SÉLECTEUR D'ANNÉE */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary }}>Année civile :</span>
        {ANNEES.map(an => (
          <button key={an} onClick={() => setAnnee(an)} style={{
            backgroundColor: annee === an ? '#006B68' : 'white',
            color: annee === an ? 'white' : '#006B68',
            border: '1.5px solid #006B68', borderRadius: '8px',
            padding: '6px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
          }}>{an}</button>
        ))}
        <span style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginLeft: '6px' }}>
          Les chiffres et graphiques ci-dessous concernent l'année sélectionnée.
        </span>
      </div>

      {/* ALERTE dates de contrat manquantes */}
      {datesManquantes.length > 0 && (
        <div style={{ backgroundColor: '#fef2f2', border: '2px solid #e53e3e', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#c53030', marginBottom: '8px' }}>
            🚨 {datesManquantes.length} apprenant{datesManquantes.length > 1 ? 's' : ''} avec dates de contrat manquantes — à compléter pour un comptage fiable par année
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {datesManquantes.slice(0, 12).map((a: any) => (
              <Link key={a.id} href={`/apprenants/${a.id}`} style={{ textDecoration: 'none' }}>
                <span style={{ display: 'inline-block', backgroundColor: 'white', border: '1px solid #fecaca', color: '#c53030', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  {a.prenom} {a.nom} ({a.statut}) →
                </span>
              </Link>
            ))}
            {datesManquantes.length > 12 && (
              <span style={{ fontSize: '12px', color: '#c53030', alignSelf: 'center' }}>+ {datesManquantes.length - 12} autres…</span>
            )}
          </div>
        </div>
      )}

      {/* CHIFFRES CLÉS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <ChiffreCle icone="🎓" label={`En cours ${annee}`} valeur={enCours.length} sous="contrat actif sur l'année" couleur="#006B68" onClick={() => setListeDetail({ titre: `Apprenants En cours (CA) — ${annee}`, couleur: '#006B68', apprenants: enCours })} />
        <ChiffreCle icone="⏳" label={`P2S ${annee}`} valeur={p2s.length} sous="début formation cette année" couleur="#C8A23A" onClick={() => setListeDetail({ titre: `Apprenants P2S — ${annee}`, couleur: '#C8A23A', apprenants: p2s })} />
        <ChiffreCle icone="❌" label={`Ruptures ${annee}`} valeur={ruptures.length} sous="contrat chevauchant l'année" couleur="#e53e3e" onClick={() => setListeDetail({ titre: `Apprenants en Rupture — ${annee}`, couleur: '#e53e3e', apprenants: ruptures })} />
        <ChiffreCle icone="💰" label={`CA encaissé ${annee}`} valeur={`${caEncaisseAnnee.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`} sous="cumul année civile" couleur="#16a34a" onClick={() => setListeFinance({ titre: `CA encaissé ${annee}`, couleur: '#16a34a', lignes: detailEncaisse, total: caEncaisseAnnee })} />
        <ChiffreCle icone="💶" label={labelAFacturer} valeur={`${Math.round(montantAFacturer).toLocaleString('fr-FR')} €`} sous={`${aFacturer.length} échéance${aFacturer.length > 1 ? 's' : ''}`} couleur="#0891b2" onClick={() => setListeFinance({ titre: labelAFacturer, couleur: '#0891b2', lignes: aFacturer, total: montantAFacturer })} />
        <ChiffreCle icone="⚠️" label="SIFA" valeur={sifaManquants.length} sous="à compléter (en cours)" couleur={sifaManquants.length > 0 ? '#C8A23A' : '#16a34a'} href="/apprenants" />
      </div>

      {/* GRAPHIQUES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.primary, marginBottom: '8px' }}>
            👥 Répartition des apprenants — {annee}
          </h3>
          {donneesCamembert.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '13px' }}>Aucun apprenant pour cette année.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Pie
                  data={donneesCamembert}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  labelLine={false}
                  label={(entry: any) => `${entry.value}`}
                >
                  {donneesCamembert.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: any, name: any) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.primary, marginBottom: '8px' }}>
            💰 CA encaissé par mois — {annee}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={caParMois} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString('fr-FR')} €`, 'Encaissé']} />
              <Bar dataKey="CA" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRAPHIQUE RÉPARTITION H/F */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.primary, marginBottom: '8px' }}>
            🚻 Répartition Femmes / Hommes — {annee}
          </h3>
          {donneesSexe.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '13px' }}>Aucun apprenant pour cette année.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Pie
                  data={donneesSexe}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  labelLine={false}
                  label={(entry: any) => `${entry.value}`}
                >
                  {donneesSexe.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: any, name: any) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.primary, marginBottom: '14px' }}>
            📊 Détail par sexe — {annee}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {donneesSexe.map(d => {
              const total = donneesSexe.reduce((s, x) => s + x.value, 0);
              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <div
                  key={d.name}
                  onClick={() => setListeDetail({ titre: `${d.name} — ${annee}`, couleur: d.color, apprenants: d.liste })}
                  style={{ cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f7f7f7')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', color: '#333' }}>{d.name} <span style={{ fontSize: '11px', color: '#aaa', fontWeight: '400' }}>(voir la liste →)</span></span>
                    <span style={{ fontWeight: '700', color: d.color }}>{d.value} ({pct}%)</span>
                  </div>
                  <div style={{ backgroundColor: '#f0f0f0', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: d.color, borderRadius: '6px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION À FACTURER */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '18px', borderLeft: '4px solid #0891b2', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0891b2' }}>
            💶 Factures à établir — {estAnneeCourante ? 'ce mois + retards' : annee}
            {nbRetard > 0 && <span style={{ marginLeft: '10px', backgroundColor: '#fde8e8', color: '#c53030', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>🔴 {nbRetard} en retard</span>}
          </h3>
          <Link href="/precomptabilite" style={{ fontSize: '11px', color: '#0891b2', fontWeight: '600', textDecoration: 'none' }}>Aller à la précompta →</Link>
        </div>
        {aFacturer.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#16a34a', fontWeight: '600', fontSize: '13px' }}>✅ Aucune facture en attente d'établissement.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #EAF4F3' }}>
                  {['Apprenant', 'OPCO', 'Échéance', 'Date prévue', 'Montant (€)', 'Statut'].map(c => (
                    <th key={c} style={{ textAlign: c.includes('Montant') ? 'right' : 'left', padding: '8px 10px', fontSize: '10px', color: '#999', fontWeight: '700', textTransform: 'uppercase' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aFacturer.map((e: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: e.enRetard ? '#fff5f5' : (i % 2 === 0 ? 'white' : '#fafafa') }}>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: '#333' }}>{e.apprenant}</td>
                    <td style={{ padding: '8px 10px', color: '#666' }}>{e.opco}</td>
                    <td style={{ padding: '8px 10px', color: '#666' }}>{e.label}</td>
                    <td style={{ padding: '8px 10px', color: e.enRetard ? '#c53030' : '#666', fontWeight: e.enRetard ? '700' : '400' }}>{e.date || '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: '#0891b2' }}>{e.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {e.enRetard
                        ? <span style={{ backgroundColor: '#fde8e8', color: '#c53030', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>🔴 En retard</span>
                        : <span style={{ backgroundColor: '#e6f4f1', color: '#0891b2', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>📅 Ce mois</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTIONS ALERTES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <CarteSection titre="Apprenants SIFA à compléter" icone="⚠️" couleur="#C8A23A" href="/apprenants">
          {sifaManquants.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#16a34a', fontWeight: '600', fontSize: '13px' }}>✅ Tous vos apprenants sont conformes SIFA !</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sifaManquants.slice(0, 5).map((a: any) => {
                const manquants = verifierConformiteSifa(a);
                return (
                  <Link key={a.id} href={`/apprenants/${a.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#fffbf0', border: '1px solid #fde68a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#7a5c00' }}>{a.prenom} {a.nom}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>{manquants.length} champ{manquants.length > 1 ? 's' : ''} manquant{manquants.length > 1 ? 's' : ''} — {a.formation}</div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#C8A23A', fontWeight: '700' }}>→</span>
                    </div>
                  </Link>
                );
              })}
              {sifaManquants.length > 5 && <Link href="/apprenants" style={{ fontSize: '11px', color: '#C8A23A', textAlign: 'center', textDecoration: 'none', marginTop: '4px', fontWeight: '600' }}>+ {sifaManquants.length - 5} autres apprenants...</Link>}
            </div>
          )}
        </CarteSection>

        <CarteSection titre="Entretiens Qualiopi en retard" icone="📋" couleur="#e53e3e" href="/apprenants">
          {entretiensRetard.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#16a34a', fontWeight: '600', fontSize: '13px' }}>✅ Aucun entretien en retard ! 🎉</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {entretiensRetard.slice(0, 5).map((e: any) => {
                const s = STATUT_STYLE[e.statut as keyof typeof STATUT_STYLE];
                return (
                  <Link key={e.id} href={`/apprenants/${e.apprenantId}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#fde8e8', border: '1px solid #fecaca', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#c53030' }}>{e.apprenantNom}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>{s?.emoji} {LIBELLE_TYPE[e.type as keyof typeof LIBELLE_TYPE]}</div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#e53e3e', fontWeight: '700' }}>→</span>
                    </div>
                  </Link>
                );
              })}
              {entretiensRetard.length > 5 && <div style={{ fontSize: '11px', color: '#e53e3e', textAlign: 'center', marginTop: '4px', fontWeight: '600' }}>+ {entretiensRetard.length - 5} autres entretiens...</div>}
            </div>
          )}
        </CarteSection>
      </div>

      <div style={{ marginTop: '32px', padding: '16px', textAlign: 'center', color: '#888', fontSize: '11px', fontStyle: 'italic' }}>
        🛡️ EasyCFA — Conforme Qualiopi · Mise à jour : {new Date().toLocaleString('fr-FR')}
      </div>

      {/* Modale liste apprenants */}
      {listeDetail && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setListeDetail(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: listeDetail.couleur }}>
                {listeDetail.titre} ({listeDetail.apprenants.length})
              </h2>
              <button onClick={() => setListeDetail(null)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✕ Fermer</button>
            </div>
            {listeDetail.apprenants.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>Aucun apprenant dans cette catégorie.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {listeDetail.apprenants
                  .slice()
                  .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
                  .map((a: any) => (
                    <Link key={a.id} href={`/apprenants/${a.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#fafafa', border: '1px solid #e0e0e0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#333' }}>{a.prenom} {a.nom}</span>
                        <span style={{ fontSize: '11px', color: '#888', fontWeight: '600' }}>{a.formation || '—'}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modale détail financier */}
      {listeFinance && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setListeFinance(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: listeFinance.couleur }}>
                {listeFinance.titre} ({listeFinance.lignes.length})
              </h2>
              <button onClick={() => setListeFinance(null)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✕ Fermer</button>
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
              Total : <strong style={{ color: listeFinance.couleur }}>{listeFinance.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
            </div>
            {listeFinance.lignes.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>Aucune ligne.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: listeFinance.couleur }}>
                      {['Apprenant', 'OPCO', 'Échéance', 'Date', 'Montant (€)'].map(c => (
                        <th key={c} style={{ padding: '8px 10px', fontSize: '10px', color: 'white', fontWeight: '700', textTransform: 'uppercase', textAlign: c.includes('Montant') ? 'right' : 'left' }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listeFinance.lignes.map((l: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: '700' }}>{l.apprenant}</td>
                        <td style={{ padding: '8px 10px', color: '#666' }}>{l.opco}</td>
                        <td style={{ padding: '8px 10px', color: '#666' }}>{l.label}</td>
                        <td style={{ padding: '8px 10px', color: '#666' }}>{l.date || '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: listeFinance.couleur }}>{l.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
