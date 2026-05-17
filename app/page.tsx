'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { APPRENANTS_REELS, verifierConformiteSifa } from '../data/mockApprenants_reels';
import { SESSIONS } from '../data/mockData';
import { COLORS } from '../lib/constants';
import {
  chargerOuCreerEntretiensApprenant,
  STATUT_STYLE,
  LIBELLE_TYPE,
} from '../data/mockEntretiens';

// ============================================================================
// HELPERS
// ============================================================================

function parseDateFr(str: string): Date | null {
  if (!str) return null;
  const p = str.split('/');
  if (p.length === 3) return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  return null;
}

function joursRestants(dateFr: string): number | null {
  const d = parseDateFr(dateFr);
  if (!d) return null;
  return Math.ceil((d.getTime() - new Date().getTime()) / 86400000);
}

function chargerApprenants(): any[] {
  if (typeof window === 'undefined') return APPRENANTS_REELS as any[];
  try {
    const saved = localStorage.getItem('easycfa_apprenants_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return APPRENANTS_REELS as any[];
}

function chargerSessions(): any[] {
  if (typeof window === 'undefined') return SESSIONS as any[];
  try {
    const saved = localStorage.getItem('easycfa_sessions_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return SESSIONS as any[];
}

function chargerMandats(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('easycfa_mandats');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function chargerApcs(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('easycfa_apcs_v2');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

// ============================================================================
// COMPOSANTS RÉUTILISABLES
// ============================================================================

function CarteKPI({
  icone, label, valeur, sous, couleur, href,
}: {
  icone: string; label: string; valeur: string | number; sous?: string; couleur: string; href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '14px', padding: '18px 16px',
        borderTop: `4px solid ${couleur}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        cursor: 'pointer', transition: 'transform 0.15s',
        height: '100%',
      }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '22px' }}>{icone}</div>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.4px' }}>
            {label}
          </div>
        </div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: couleur, lineHeight: '1.1' }}>
          {valeur}
        </div>
        {sous && (
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', fontWeight: '500' }}>
            {sous}
          </div>
        )}
      </div>
    </Link>
  );
}

function CarteSection({ titre, icone, couleur, children, href }: { titre: string; icone: string; couleur: string; children: React.ReactNode; href?: string }) {
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '14px', padding: '18px',
      borderLeft: `4px solid ${couleur}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      height: '100%',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: couleur }}>
          {icone} {titre}
        </h3>
        {href && (
          <Link href={href} style={{ fontSize: '11px', color: couleur, fontWeight: '600', textDecoration: 'none' }}>
            Voir tout →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function Dashboard() {
  const [apprenants, setApprenants] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [apcs, setApcs] = useState<any[]>([]);
  const [mandats, setMandats] = useState<any[]>([]);
  const [entretiensRetard, setEntretiensRetard] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const apps = chargerApprenants();
    const sess = chargerSessions();
    const apcsList = chargerApcs();
    setApprenants(apps);
    setSessions(sess);
    setApcs(apcsList);

    // Charger entretiens en retard pour les apprenants en cours
    const retards: any[] = [];
    apps.filter(a => a.statut === 'En cours').forEach(a => {
      try {
        const ents = chargerOuCreerEntretiensApprenant(a.id, a.dateDebutContrat, a.dateFinContrat);
        ents.forEach(e => {
          if (e.statut === 'enRetard') {
            retards.push({ ...e, apprenantNom: `${a.prenom} ${a.nom}`, apprenantId: a.id });
          }
        });
      } catch {}
    });
    setEntretiensRetard(retards);
    setChargement(false);
  }, []);

  // CALCULS KPI
  const enCours = apprenants.filter(a => a.statut === 'En cours');
  const p2s = apprenants.filter(a => a.statut === 'P2S');
  const ruptures = apprenants.filter(a => a.statut === 'Rupture' || a.statut === 'Rupture MEF' || a.statut === 'Rupture FMEF');
  const termines = apprenants.filter(a => a.statut === 'Terminé');

  // SESSIONS ACTIVES
  const sessionsActives = sessions.filter(s => {
    if (s.statut === 'Terminée') return false;
    const fin = parseDateFr(s.dateFin || s.fin || s.dateFinFormation || '');
    if (fin && fin < new Date()) return false;
    return true;
  });

  // CONFORMITÉ SIFA — apprenants en cours avec champs manquants
  const sifaManquants = enCours.filter(a => verifierConformiteSifa(a).length > 0);

  // MANDATS = nombre de dossiers APC en attente ou accordés (non soldés)
  const mandatsEnCours = apcs.filter(a => a.statut !== 'Soldé' && a.statut !== 'Refusé');

  // FACTURATION — calculs
  const moisActuel = new Date().getMonth();
  const anneeActuelle = new Date().getFullYear();

  const aFacturerCeMois = apcs.flatMap((a: any) =>
    a.echeances.filter((e: any) => {
      if (e.numeroFacture) return false; // déjà facturé
      const d = parseDateFr(e.dateEcheance);
      if (!d) return false;
      return d.getMonth() === moisActuel && d.getFullYear() === anneeActuelle;
    }).map((e: any) => ({ ...e, apprenant: `${a.apprenantPrenom} ${a.apprenantNom}`, opco: a.opco }))
  );

  const montantAFacturer = aFacturerCeMois.reduce((s: number, e: any) => s + (e.montantPrevu || 0), 0);

  const enAttenteReglement = apcs.flatMap((a: any) =>
    a.echeances.filter((e: any) => e.numeroFacture && !e.datePaiement).map((e: any) => ({
      ...e, apprenant: `${a.apprenantPrenom} ${a.apprenantNom}`, opco: a.opco,
    }))
  );

  const montantEnAttente = enAttenteReglement.reduce((s: number, e: any) => s + (e.montantPrevu || 0), 0);

  // EXAMENS — sessions qui se terminent dans 30 jours
  const examensAVenir = sessions.filter(s => {
    const fin = parseDateFr(s.dateFin || s.fin || s.dateFinFormation || '');
    if (!fin) return false;
    const j = Math.ceil((fin.getTime() - new Date().getTime()) / 86400000);
    return j >= 0 && j <= 30;
  });

  // EN-TÊTE DATE
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
        borderRadius: '16px', padding: '24px 28px', marginBottom: '24px',
        color: 'white', boxShadow: '0 4px 16px rgba(0, 107, 104, 0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>
              👋 Bonjour Paméla !
            </h1>
            <p style={{ fontSize: '14px', opacity: 0.9, textTransform: 'capitalize' }}>
              📅 {dateAujourdhui}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', opacity: 0.85, fontWeight: '500' }}>CFA PAM OI Formation</div>
            <div style={{ fontSize: '11px', opacity: 0.75 }}>🏝️ La Réunion</div>
          </div>
        </div>
      </div>

      {/* LIGNE 1 : KPI APPRENANTS */}
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          👥 Vos apprenants
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <CarteKPI icone="🎓" label="En cours" valeur={enCours.length} sous="apprenants actifs" couleur="#006B68" href="/apprenants" />
        <CarteKPI icone="⏳" label="P2S" valeur={p2s.length} sous="en recherche d'entreprise" couleur="#C8A23A" href="/apprenants" />
        <CarteKPI icone="❌" label="Ruptures" valeur={ruptures.length} sous="contrats rompus" couleur="#e53e3e" href="/apprenants" />
        <CarteKPI icone="✅" label="Terminés" valeur={termines.length} sous="parcours achevés" couleur="#16a34a" href="/apprenants" />
      </div>

      {/* LIGNE 2 : KPI ACTIVITÉ */}
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          📚 Activité pédagogique
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <CarteKPI icone="📅" label="Sessions actives" valeur={sessionsActives.length} sous="en cours" couleur="#0891b2" href="/sessions" />
        <CarteKPI icone="🎯" label="Examens 30j" valeur={examensAVenir.length} sous="à organiser" couleur="#7c3aed" href="/sessions" />
        <CarteKPI icone="📋" label="Entretiens" valeur={entretiensRetard.length} sous="en retard" couleur={entretiensRetard.length > 0 ? '#e53e3e' : '#16a34a'} href="/apprenants" />
        <CarteKPI icone="⚠️" label="SIFA" valeur={sifaManquants.length} sous="à compléter" couleur={sifaManquants.length > 0 ? '#C8A23A' : '#16a34a'} href="/apprenants" />
      </div>

      {/* LIGNE 3 : KPI FACTURATION */}
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          💰 Facturation OPCO
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <CarteKPI
          icone="📝" label="Mandats en cours"
          valeur={mandatsEnCours.length} sous="dossiers actifs"
          couleur="#7c3aed" href="/precomptabilite"
        />
        <CarteKPI
          icone="💶" label="À facturer ce mois"
          valeur={`${Math.round(montantAFacturer).toLocaleString('fr-FR')} €`}
          sous={`${aFacturerCeMois.length} échéance${aFacturerCeMois.length > 1 ? 's' : ''}`}
          couleur="#0891b2" href="/precomptabilite"
        />
        <CarteKPI
          icone="⏳" label="En attente règlement"
          valeur={`${Math.round(montantEnAttente).toLocaleString('fr-FR')} €`}
          sous={`${enAttenteReglement.length} facture${enAttenteReglement.length > 1 ? 's' : ''}`}
          couleur="#e53e3e" href="/precomptabilite"
        />
      </div>

      {/* SECTIONS DÉTAILLÉES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* SECTION SIFA À COMPLÉTER */}
        <CarteSection titre="Apprenants SIFA à compléter" icone="⚠️" couleur="#C8A23A" href="/apprenants">
          {sifaManquants.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#16a34a', fontWeight: '600', fontSize: '13px' }}>
              ✅ Tous vos apprenants sont conformes SIFA !
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sifaManquants.slice(0, 5).map((a: any) => {
                const manquants = verifierConformiteSifa(a);
                return (
                  <Link key={a.id} href={`/apprenants/${a.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '8px 10px', borderRadius: '8px', backgroundColor: '#fffbf0',
                      border: '1px solid #fde68a', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#7a5c00' }}>{a.prenom} {a.nom}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>
                          {manquants.length} champ{manquants.length > 1 ? 's' : ''} manquant{manquants.length > 1 ? 's' : ''} — {a.formation}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#C8A23A', fontWeight: '700' }}>→</span>
                    </div>
                  </Link>
                );
              })}
              {sifaManquants.length > 5 && (
                <Link href="/apprenants" style={{ fontSize: '11px', color: '#C8A23A', textAlign: 'center', textDecoration: 'none', marginTop: '4px', fontWeight: '600' }}>
                  + {sifaManquants.length - 5} autres apprenants...
                </Link>
              )}
            </div>
          )}
        </CarteSection>

        {/* SECTION ENTRETIENS EN RETARD */}
        <CarteSection titre="Entretiens Qualiopi en retard" icone="📋" couleur="#e53e3e" href="/apprenants">
          {entretiensRetard.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#16a34a', fontWeight: '600', fontSize: '13px' }}>
              ✅ Aucun entretien en retard ! 🎉
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {entretiensRetard.slice(0, 5).map((e: any) => {
                const s = STATUT_STYLE[e.statut];
                return (
                  <Link key={e.id} href={`/apprenants/${e.apprenantId}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '8px 10px', borderRadius: '8px', backgroundColor: '#fde8e8',
                      border: '1px solid #fecaca', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#c53030' }}>{e.apprenantNom}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>
                          {s.emoji} {LIBELLE_TYPE[e.type as keyof typeof LIBELLE_TYPE]}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#e53e3e', fontWeight: '700' }}>→</span>
                    </div>
                  </Link>
                );
              })}
              {entretiensRetard.length > 5 && (
                <div style={{ fontSize: '11px', color: '#e53e3e', textAlign: 'center', marginTop: '4px', fontWeight: '600' }}>
                  + {entretiensRetard.length - 5} autres entretiens...
                </div>
              )}
            </div>
          )}
        </CarteSection>
      </div>

      {/* SECTION 2 : FACTURATION + EXAMENS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* À FACTURER CE MOIS */}
        <CarteSection titre="À facturer ce mois" icone="💶" couleur="#0891b2" href="/precomptabilite">
          {aFacturerCeMois.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '13px' }}>
              Aucune échéance à facturer ce mois.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {aFacturerCeMois.slice(0, 5).map((e: any, i: number) => (
                <Link key={i} href="/precomptabilite" style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '8px 10px', borderRadius: '8px', backgroundColor: '#e0f2fe',
                    border: '1px solid #7dd3fc', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0c4a6e' }}>{e.apprenant}</div>
                      <div style={{ fontSize: '10px', color: '#0891b2' }}>{e.opco} — {e.label}</div>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#0891b2' }}>
                      {Math.round(e.montantPrevu || 0).toLocaleString('fr-FR')} €
                    </div>
                  </div>
                </Link>
              ))}
              {aFacturerCeMois.length > 5 && (
                <div style={{ fontSize: '11px', color: '#0891b2', textAlign: 'center', marginTop: '4px', fontWeight: '600' }}>
                  + {aFacturerCeMois.length - 5} autres...
                </div>
              )}
            </div>
          )}
        </CarteSection>

        {/* EXAMENS À VENIR */}
        <CarteSection titre="Examens à venir (30j)" icone="🎯" couleur="#7c3aed" href="/sessions">
          {examensAVenir.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '13px' }}>
              Aucun examen dans les 30 prochains jours.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {examensAVenir.slice(0, 5).map((s: any) => {
                const j = joursRestants(s.dateFin || s.fin || s.dateFinFormation || '');
                return (
                  <Link key={s.id} href={`/sessions`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '8px 10px', borderRadius: '8px', backgroundColor: '#f5f3ff',
                      border: '1px solid #c4b5fd', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#4c1d95' }}>{s.nom || `Session ${s.id}`}</div>
                        <div style={{ fontSize: '10px', color: '#7c3aed' }}>
                          {s.formation || ''} — Fin {s.dateFin || s.fin || s.dateFinFormation || '—'}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: j !== null && j <= 7 ? '#e53e3e' : '#7c3aed' }}>
                        {j !== null ? (j <= 0 ? '🔴 Aujourd\'hui' : `J-${j}`) : '—'}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CarteSection>
      </div>

      {/* PIED DE PAGE */}
      <div style={{ marginTop: '32px', padding: '16px', textAlign: 'center', color: '#888', fontSize: '11px', fontStyle: 'italic' }}>
        🛡️ EasyCFA — Conforme Qualiopi · Mise à jour : {new Date().toLocaleString('fr-FR')}
      </div>
    </div>
  );
}