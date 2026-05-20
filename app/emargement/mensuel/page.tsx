'use client';

import { useState, useEffect, useMemo } from 'react';
import { COLORS } from '../../../lib/constants';
import Card from '../../../components/Card';
import dynamic from 'next/dynamic';
import { chargerEmargements } from '../../../data/emargementsSupabase';
import type { Emargement } from '../../../data/emargementsSupabase';

const BoutonPdfEtatMensuel = dynamic(() => import('../../../components/BoutonPdfEtatMensuel'), { ssr: false });

const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', backgroundColor: 'white' };

/**
 * Parse une date "DD/MM/YYYY" et retourne {jour, mois, annee} ou null
 */
function parseDateFr(date: string): { jour: number; mois: number; annee: number } | null {
  if (!date) return null;
  const parts = date.split('/');
  if (parts.length !== 3) return null;
  const jour = parseInt(parts[0]);
  const mois = parseInt(parts[1]);
  const annee = parseInt(parts[2]);
  if (isNaN(jour) || isNaN(mois) || isNaN(annee)) return null;
  return { jour, mois, annee };
}

interface StatApprenantMensuel {
  apprenantId: string;
  nom: string;
  prenom: string;
  emailApprenant: string;
  entreprise: string;
  emailEntreprise: string;
  formation: string;
  formationCode: string;
  session: string;
  mois: string;
  heuresPrevues: number;
  heuresRealisees: number;
  heuresAbsence: number;
  tauxPresence: number;
  tauxAbsence: number;
  seances: Array<{
    date: string;
    demiJournee: string;
    theme: string;
    statut: string;
    heures: number;
    heureArrivee?: string;
    justificatif: boolean;
  }>;
}

export default function RecapMensuel() {
  const [emargements, setEmargements] = useState<Emargement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [moisFiltre, setMoisFiltre] = useState<number>(new Date().getMonth() + 1);
  const [anneeFiltre, setAnneeFiltre] = useState<number>(new Date().getFullYear());
  const [sessionFiltre, setSessionFiltre] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const data = await chargerEmargements();
        setEmargements(data);
        console.log(`[EmargementMensuel] ${data.length} feuilles chargées depuis Supabase ✅`);
      } catch (e) {
        console.error('[EmargementMensuel] Erreur Supabase', e);
      }
      setChargement(false);
    })();
  }, []);

  // Sessions disponibles dans les feuilles
  const sessionsDispo = useMemo(() => {
    const set = new Map<string, string>();
    emargements.forEach(e => {
      if (e.sessionNumero) {
        set.set(e.sessionNumero, `${e.sessionNumero} — ${e.formation || ''}`);
      }
    });
    return Array.from(set.entries()).sort();
  }, [emargements]);

  // Calcul des stats mensuelles
  const statsMensuelles: StatApprenantMensuel[] = useMemo(() => {
    // Filtrer les feuilles selon mois + année + session
    const feuillesFiltrees = emargements.filter(e => {
      const d = parseDateFr(e.date || '');
      if (!d) return false;
      if (d.mois !== moisFiltre) return false;
      if (d.annee !== anneeFiltre) return false;
      if (sessionFiltre && e.sessionNumero !== sessionFiltre) return false;
      return true;
    });

    // Regrouper par apprenant
    const parApprenant = new Map<string, StatApprenantMensuel>();

    feuillesFiltrees.forEach(feuille => {
      (feuille.demiJournees || []).forEach(dj => {
        (dj.presences || []).forEach(p => {
          if (!p.apprenantId) return;

          const key = p.apprenantId;
          let stat = parApprenant.get(key);

          if (!stat) {
            stat = {
              apprenantId: p.apprenantId,
              nom: p.nom || '',
              prenom: p.prenom || '',
              emailApprenant: p.emailApprenant || '',
              entreprise: p.entreprise || '',
              emailEntreprise: p.emailEntreprise || '',
              formation: feuille.formation || '',
              formationCode: feuille.formationCode || '',
              session: feuille.sessionNumero || '',
              mois: `${MOIS_NOMS[moisFiltre - 1]} ${anneeFiltre}`,
              heuresPrevues: 0,
              heuresRealisees: 0,
              heuresAbsence: 0,
              tauxPresence: 0,
              tauxAbsence: 0,
              seances: [],
            };
            parApprenant.set(key, stat);
          }

          const heuresPrevuesDj = dj.heures || 0;
          const heuresReellesP = p.heuresComptees || 0;

          stat.heuresPrevues += heuresPrevuesDj;
          stat.heuresRealisees += heuresReellesP;
          if (p.statut === 'Absent' || p.statut === 'Retard') {
            stat.heuresAbsence += (heuresPrevuesDj - heuresReellesP);
          }

          stat.seances.push({
            date: feuille.date || '',
            demiJournee: dj.type || '',
            theme: dj.theme || '',
            statut: p.statut || 'Non saisi',
            heures: heuresReellesP,
            heureArrivee: p.heureArrivee,
            justificatif: p.justificatifRecu || false,
          });
        });
      });
    });

    // Calculer les taux
    const liste = Array.from(parApprenant.values());
    liste.forEach(s => {
      s.tauxPresence = s.heuresPrevues > 0 ? Math.round((s.heuresRealisees / s.heuresPrevues) * 100) : 0;
      s.tauxAbsence = 100 - s.tauxPresence;
    });

    return liste.sort((a, b) => a.nom.localeCompare(b.nom));
  }, [emargements, moisFiltre, anneeFiltre, sessionFiltre]);

  if (chargement) {
    return <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>Chargement des feuilles d'émargement...</div>;
  }

  const titreMois = `${MOIS_NOMS[moisFiltre - 1]} ${anneeFiltre}`;
  const titreSession = sessionFiltre ? ` — Session ${sessionFiltre}` : '';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <a href="/emargement" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>← Retour émargement</a>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px', marginTop: '8px' }}>
            📊 États de présence mensuels
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
            {titreMois}{titreSession} — Calculé automatiquement depuis les feuilles d'émargement
          </p>
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
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Session</label>
            <select style={{ ...inputStyle, width: '100%' }} value={sessionFiltre} onChange={e => setSessionFiltre(e.target.value)}>
              <option value="">Toutes les sessions</option>
              {sessionsDispo.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Récapitulatif */}
      {statsMensuelles.length === 0 ? (
        <Card>
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Aucune donnée pour {titreMois}{titreSession}</div>
            <div style={{ fontSize: '12px', fontStyle: 'italic' }}>
              Les états de présence sont générés à partir des feuilles d'émargement saisies.
              Va dans <a href="/emargement" style={{ color: COLORS.primary, fontWeight: '700' }}>Émargement</a> pour créer/saisir des feuilles.
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>
              {statsMensuelles.length} apprenant(s) — {titreMois}
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                  {['Apprenant', 'Entreprise', 'Session', 'H. prévues', 'H. réalisées', 'H. absence', 'Taux présence', 'Alerte', 'PDF'].map((col) => (
                    <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statsMensuelles.map((a, i) => (
                  <tr key={a.apprenantId} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700' }}>
                      <a href={`/apprenants/${a.apprenantId}`} style={{ color: COLORS.text, textDecoration: 'none' }}>{a.prenom} {a.nom}</a>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{a.entreprise || '—'}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: COLORS.textMuted }}>{a.session || '—'}</td>
                    <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center' }}>{a.heuresPrevues}h</td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: COLORS.primary, textAlign: 'center' }}>{a.heuresRealisees}h</td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: a.heuresAbsence > 0 ? '#e53e3e' : COLORS.textMuted, textAlign: 'center' }}>{a.heuresAbsence}h</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: a.tauxPresence >= 90 ? '#e6f4f1' : a.tauxPresence >= 75 ? '#fef6e4' : '#fde8e8', color: a.tauxPresence >= 90 ? '#006B68' : a.tauxPresence >= 75 ? '#C8A23A' : '#e53e3e', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                        {a.tauxPresence}%
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {a.tauxAbsence > 10
                        ? <span style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>⚠ Taux élevé</span>
                        : <span style={{ color: '#aaa', fontSize: '12px' }}>OK</span>
                      }
                    </td>
                    <td style={{ padding: '12px' }}>
                      <BoutonPdfEtatMensuel
                        apprenant={{ nom: a.nom, prenom: a.prenom, email: a.emailApprenant }}
                        entreprise={{ nom: a.entreprise, email: a.emailEntreprise, tuteur: '' }}
                        formation={a.formation}
                        session={a.session}
                        mois={a.mois}
                        heuresPrevues={a.heuresPrevues}
                        heuresRealisees={a.heuresRealisees}
                        heuresAbsence={a.heuresAbsence}
                        tauxPresence={a.tauxPresence}
                        tauxAbsence={a.tauxAbsence}
                        seances={a.seances}
                        nomFichier={`Etat_Presence_${a.nom}_${a.mois.replace(/\s/g, '_')}.pdf`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div style={{ padding: '12px 16px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '12px', color: COLORS.textMuted, fontStyle: 'italic' }}>
        💡 Les états de présence sont calculés automatiquement depuis les feuilles d'émargement validées dans Supabase. Ils sont à envoyer aux entreprises avant le 5 du mois suivant.
      </div>
    </div>
  );
}