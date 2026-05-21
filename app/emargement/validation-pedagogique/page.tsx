'use client';

import { useState, useEffect, useMemo } from 'react';
import { COLORS } from '../../../lib/constants';
import Card from '../../../components/Card';
import { chargerEmargements, creerEmargement } from '../../../data/emargementsSupabase';

const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', backgroundColor: 'white' };
const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' };

interface IncidentAValider {
  feuilleId: string;
  feuilleIndex: number; // index dans le tableau feuilles
  djIndex: number;
  presenceIndex: number;
  date: string;
  jour: string;
  formation: string;
  sessionNumero: string;
  demiJournee: string;
  apprenantId: string;
  nom: string;
  prenom: string;
  statut: string;
  motif: string;
  duree?: string;
  heureArrivee?: string;
  justifiee: 'OUI' | 'NON' | null;
  justificatifNom?: string;
  justificatifUrl?: string;
}

function parseDateFr(date: string): { jour: number; mois: number; annee: number } | null {
  if (!date) return null;
  const p = date.split('/');
  if (p.length !== 3) return null;
  const j = parseInt(p[0]), m = parseInt(p[1]), a = parseInt(p[2]);
  return isNaN(j) || isNaN(m) || isNaN(a) ? null : { jour: j, mois: m, annee: a };
}

export default function ValidationPedagogique() {
  const [feuilles, setFeuilles] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [moisFiltre, setMoisFiltre] = useState<number>(new Date().getMonth() + 1);
  const [anneeFiltre, setAnneeFiltre] = useState<number>(new Date().getFullYear());
  const [formationFiltre, setFormationFiltre] = useState<string>('');
  const [enAttenteOnly, setEnAttenteOnly] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await chargerEmargements();
        setFeuilles(data as any[]);
        console.log(`[ValidationPédagogique] ${data.length} feuilles chargées ✅`);
      } catch (e) {
        console.error('[ValidationPédagogique] Erreur:', e);
      }
      setChargement(false);
    })();
  }, []);

  // Construit la liste des incidents (absents + retards) avec leur position dans la structure
  const incidents: IncidentAValider[] = useMemo(() => {
    const liste: IncidentAValider[] = [];
    feuilles.forEach((feuille, feuilleIndex) => {
      const d = parseDateFr(feuille.date || '');
      if (!d) return;
      if (d.mois !== moisFiltre || d.annee !== anneeFiltre) return;
      if (formationFiltre && feuille.formation !== formationFiltre) return;

      (feuille.demiJournees || []).forEach((dj: any, djIndex: number) => {
        (dj.presences || []).forEach((p: any, presenceIndex: number) => {
          if (p.statut === 'Absent' || p.statut === 'Retard' || p.statut === 'Absent justifié') {
            if (enAttenteOnly && p.justifiee) return; // déjà décidé
            liste.push({
              feuilleId: feuille.id,
              feuilleIndex,
              djIndex,
              presenceIndex,
              date: feuille.date,
              jour: feuille.jour,
              formation: feuille.formation,
              sessionNumero: feuille.sessionNumero || '',
              demiJournee: dj.type,
              apprenantId: p.apprenantId,
              nom: p.nom,
              prenom: p.prenom,
              statut: p.statut,
              motif: p.motif || '',
              duree: p.duree,
              heureArrivee: p.heureArrivee,
              justifiee: p.justifiee || null,
              justificatifNom: p.justificatifNom,
              justificatifUrl: p.justificatifUrl,
            });
          }
        });
      });
    });
    // Tri : en attente en premier, puis date décroissante
    liste.sort((a, b) => {
      if (!a.justifiee && b.justifiee) return -1;
      if (a.justifiee && !b.justifiee) return 1;
      const dA = (a.date || '').split('/').reverse().join('-');
      const dB = (b.date || '').split('/').reverse().join('-');
      return dB.localeCompare(dA);
    });
    return liste;
  }, [feuilles, moisFiltre, anneeFiltre, formationFiltre, enAttenteOnly]);

  // Stats
  const stats = useMemo(() => {
    let enAttente = 0, oui = 0, non = 0;
    feuilles.forEach((feuille) => {
      const d = parseDateFr(feuille.date || '');
      if (!d || d.mois !== moisFiltre || d.annee !== anneeFiltre) return;
      if (formationFiltre && feuille.formation !== formationFiltre) return;
      (feuille.demiJournees || []).forEach((dj: any) => {
        (dj.presences || []).forEach((p: any) => {
          if (p.statut === 'Absent' || p.statut === 'Retard' || p.statut === 'Absent justifié') {
            if (p.justifiee === 'OUI') oui++;
            else if (p.justifiee === 'NON') non++;
            else enAttente++;
          }
        });
      });
    });
    return { enAttente, oui, non, total: enAttente + oui + non };
  }, [feuilles, moisFiltre, anneeFiltre, formationFiltre]);

  // Formations disponibles dans le mois
  const formationsDispo = useMemo(() => {
    const set = new Set<string>();
    feuilles.forEach(f => {
      const d = parseDateFr(f.date || '');
      if (d && d.mois === moisFiltre && d.annee === anneeFiltre) set.add(f.formation);
    });
    return Array.from(set).sort();
  }, [feuilles, moisFiltre, anneeFiltre]);

  // Décide d'une absence : OUI = justifié, NON = non justifié
  async function deciderAbsence(inc: IncidentAValider, decision: 'OUI' | 'NON') {
    const feuille = feuilles[inc.feuilleIndex];
    if (!feuille) return;

    // Mutation immuable de la structure
    const feuilleModifiee = { ...feuille };
    feuilleModifiee.demiJournees = feuille.demiJournees.map((dj: any, di: number) => {
      if (di !== inc.djIndex) return dj;
      return {
        ...dj,
        presences: dj.presences.map((p: any, pi: number) => {
          if (pi !== inc.presenceIndex) return p;
          return {
            ...p,
            justifiee: decision,
            // Si justifiée OUI, on bascule le statut à "Absent justifié" (uniquement si Absent à l'origine)
            statut: decision === 'OUI' && p.statut === 'Absent' ? 'Absent justifié' : p.statut,
            justificatifRecu: decision === 'OUI' ? true : p.justificatifRecu,
          };
        }),
      };
    });

    // Maj UI optimiste
    const nouvelles = [...feuilles];
    nouvelles[inc.feuilleIndex] = feuilleModifiee;
    setFeuilles(nouvelles);

    // Maj Supabase
    const res = await creerEmargement(feuilleModifiee);
    if (!res.success) {
      alert(`⚠️ Erreur Supabase : ${res.error}`);
      // rollback
      setFeuilles(feuilles);
      return;
    }
    console.log(`[ValidationPédagogique] ${inc.prenom} ${inc.nom} ${inc.date} → ${decision} ✅`);
    setMessage(`✅ Décision enregistrée pour ${inc.prenom} ${inc.nom} (${inc.date})`);
    setTimeout(() => setMessage(''), 3000);
  }

  if (chargement) {
    return <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>Chargement...</div>;
  }

  return (
    <div>
      <a href="/emargement" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>← Retour émargement</a>
      <div style={{ marginTop: '8px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
          🛡️ Validation pédagogique des absences
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
          Décision sur les justificatifs reçus — Réservé au service pédagogique
        </p>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', backgroundColor: '#e6f4f1', borderRadius: '8px', borderLeft: `4px solid ${COLORS.primary}`, marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          {message}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: '#fef6e4', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#C8A23A' }}>{stats.enAttente}</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>En attente</div>
        </div>
        <div style={{ backgroundColor: '#dcfce7', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803d' }}>{stats.oui}</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Justifiées</div>
        </div>
        <div style={{ backgroundColor: '#fde8e8', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#e53e3e' }}>{stats.non}</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Non justifiées</div>
        </div>
        <div style={{ backgroundColor: COLORS.background, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: COLORS.primary }}>{stats.total}</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Total</div>
        </div>
      </div>

      {/* Filtres */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Mois</label>
            <select style={inputStyle} value={moisFiltre} onChange={e => setMoisFiltre(parseInt(e.target.value))}>
              {MOIS_NOMS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Année</label>
            <select style={inputStyle} value={anneeFiltre} onChange={e => setAnneeFiltre(parseInt(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Formation</label>
            <select style={{ ...inputStyle, width: '100%' }} value={formationFiltre} onChange={e => setFormationFiltre(e.target.value)}>
              <option value="">Toutes les formations</option>
              {formationsDispo.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', marginTop: '16px' }}>
            <input type="checkbox" checked={enAttenteOnly} onChange={e => setEnAttenteOnly(e.target.checked)} style={{ accentColor: COLORS.primary, width: '16px', height: '16px' }} />
            <span>Uniquement en attente</span>
          </label>
        </div>
      </Card>

      {/* Tableau */}
      {incidents.length === 0 ? (
        <Card>
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Aucune absence/retard à valider</div>
            {enAttenteOnly && <div style={{ fontSize: '12px', marginTop: '8px', fontStyle: 'italic' }}>Décoche "Uniquement en attente" pour voir tout l'historique</div>}
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                  {['Date', 'Apprenant', 'Formation', 'Statut', 'Motif annoncé', 'Justificatif', 'Décision'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '10px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, idx) => {
                  const styleStatut = inc.statut === 'Absent' ? { bg: '#fde8e8', color: '#e53e3e', icon: '❌' }
                    : inc.statut === 'Retard' ? { bg: '#fef6e4', color: '#C8A23A', icon: '⚠️' }
                    : { bg: '#f0f4ff', color: '#3a5bc7', icon: '📋' };
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: '600' }}>
                        {inc.date}
                        <div style={{ fontSize: '10px', color: '#888', fontWeight: '400' }}>{inc.jour} · {inc.demiJournee}</div>
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px' }}>
                        <a href={`/apprenants/${inc.apprenantId}`} style={{ color: COLORS.text, textDecoration: 'none', fontWeight: '700' }}>
                          {inc.prenom} {inc.nom}
                        </a>
                      </td>
                      <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>
                        {inc.formation}
                        {inc.sessionNumero && <div style={{ fontSize: '10px', color: '#888' }}>{inc.sessionNumero}</div>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ backgroundColor: styleStatut.bg, color: styleStatut.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {styleStatut.icon} {inc.statut}
                        </span>
                        {inc.heureArrivee && <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>Arrivée {inc.heureArrivee}</div>}
                      </td>
                      <td style={{ padding: '10px', fontSize: '12px', color: COLORS.text, maxWidth: '250px' }}>
                        {inc.motif || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Aucun motif annoncé</span>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {inc.justificatifUrl ? (
                          <a href={inc.justificatifUrl} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#e6f4f1', color: COLORS.primary, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            📄 Voir
                          </a>
                        ) : (
                          <span style={{ color: '#bbb', fontSize: '11px', fontStyle: 'italic' }}>Aucun</span>
                        )}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {inc.justifiee === 'OUI' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textAlign: 'center' }}>✅ Justifiée</span>
                            <button onClick={() => deciderAbsence(inc, 'NON')} style={{ ...btnPrimary, backgroundColor: 'white', color: '#888', border: '1px solid #e0e0e0' }}>↺ Revenir</button>
                          </div>
                        )}
                        {inc.justifiee === 'NON' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textAlign: 'center' }}>❌ Non justifiée</span>
                            <button onClick={() => deciderAbsence(inc, 'OUI')} style={{ ...btnPrimary, backgroundColor: 'white', color: '#888', border: '1px solid #e0e0e0' }}>↺ Revenir</button>
                          </div>
                        )}
                        {!inc.justifiee && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => deciderAbsence(inc, 'OUI')} style={{ ...btnPrimary, backgroundColor: '#15803d' }}>✅ Justifiée</button>
                            <button onClick={() => deciderAbsence(inc, 'NON')} style={{ ...btnPrimary, backgroundColor: '#e53e3e' }}>❌ Non</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div style={{ padding: '12px 16px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic', marginTop: '16px' }}>
        💡 Cliquer sur "Justifiée" passe automatiquement le statut de l'apprenant à "Absent justifié" dans la feuille d'émargement et coche "Justificatif reçu".
      </div>
    </div>
  );
}