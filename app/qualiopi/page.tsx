'use client';

import { useState } from 'react';
import { COLORS } from '../../lib/constants';
import { useEffect } from 'react';
import { chargerApprentis } from '../../data/apprentisSupabase';
import { chargerSessions } from '../../data/sessionsSupabase';
import { chargerInterventions } from '../../data/interventionsSupabase';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import { INDICATEURS_QUALIOPI, RESULTATS_FORMATIONS, PREUVES, QUALIOPI_STATS, SESSIONS_EXAMENS, EPREUVES_PAR_FORMATION, DOCUMENTS_EXAMEN } from '../../data/mockQualiopi';
import type { ResultatCCP } from '../../data/mockQualiopi';
import GestionEvaluationsEnseignements from '../../components/GestionEvaluationsEnseignements';
import dynamic from 'next/dynamic';
const BoutonPdfConvocation = dynamic(() => import('../../components/BoutonPdfConvocation'), { ssr: false });

// L'onglet « Examens » a été retiré : il faisait doublon avec la page Examens,
// désormais alimentée par des données réelles (sessions, candidats, jurés, PV).
const ONGLETS = ['Tableau de bord', 'Indicateurs', 'Résultats & CCP', 'Preuves documentaires', 'Éval. enseignements', 'Alertes'];

const STATUT_IND: Record<string, { bg: string; color: string; icon: string }> = {
  'Conforme':     { bg: '#e6f4f1', color: '#006B68', icon: '✅' },
  'À contrôler':  { bg: '#fef6e4', color: '#C8A23A', icon: '⚠️' },
  'Non conforme': { bg: '#fde8e8', color: '#e53e3e', icon: '❌' },
};

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

function TauxBar({ taux, color }: { taux: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: '4px', height: '8px' }}>
        <div style={{ width: `${taux}%`, backgroundColor: color, borderRadius: '4px', height: '8px', transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: '700', color, minWidth: '45px', textAlign: 'right' }}>{taux}%</span>
    </div>
  );
}

export default function Qualiopi() {
  const [onglet, setOnglet] = useState(0);

  // Données réelles pour l'indicateur 33
  const [interventionsDb, setInterventionsDb] = useState<any[]>([]);
  const [sessionsDb, setSessionsDb] = useState<any[]>([]);
  const [apprenantsDb, setApprenantsDb] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [i, s, a] = await Promise.all([
          chargerInterventions(),
          chargerSessions(),
          chargerApprentis(),
        ]);
        console.log(`[Qualiopi] ${i.length} intervention(s), ${s.length} session(s), ${a.length} apprenant(s) ✅`);
        setInterventionsDb(i as any[]);
        setSessionsDb(s as any[]);
        setApprenantsDb(a as any[]);
      } catch (e) {
        console.error('[Qualiopi] Erreur chargement données Supabase', e);
      }
    })();
  }, []);
  const [formationSelectionnee, setFormationSelectionnee] = useState('SC');
  const [indicateurs, setIndicateurs] = useState(INDICATEURS_QUALIOPI);
  const [indicateurEdite, setIndicateurEdite] = useState<string | null>(null);
  const [filtreIndicateur, setFiltreIndicateur] = useState('Tous');
  const [preuvesPar, setPreuvesPar] = useState<Record<string, { nom: string; date: string; type: string }[]>>({});
  const [ajoutPreuve, setAjoutPreuve] = useState<string | null>(null);
  const [nouvellePreuve, setNouvellePreuve] = useState({ libelle: '', type: 'Document' });
  const [preuves, setPreuves] = useState(PREUVES);
  const [ajoutNouvellePreuve, setAjoutNouvellePreuve] = useState(false);
  const [nouvellePreuveForm, setNouvellePreuveForm] = useState({
    indicateur: '', libelle: '', type: 'Document',
    statut: 'Validé', lien: '', fichierNom: '',
  });
  const [sessionExamenId, setSessionExamenId] = useState('EXAM-SC-2026-01');
  const [candidatSelectionne, setCandidatSelectionne] = useState<string | null>(null);
  const [numerosCERES, setNumerosCERES] = useState<Record<string, string>>({});
  const [jury, setJury] = useState([
    { nom: 'DUPONT', prenom: 'Marie', qualite: 'Présidente du jury — DEETS La Réunion', telephone: '02 62 XX XX XX', email: 'marie.dupont@reunion.dreets.gouv.fr' },
    { nom: 'MARTIN', prenom: 'Paul', qualite: 'Membre professionnel — Expert comptable', telephone: '06 93 XX XX XX', email: 'paul.martin@cabinet.fr' },
  ]);
  const [afficherGestionJury, setAfficherGestionJury] = useState(false);
  const [nouveauJure, setNouveauJure] = useState({ nom: '', prenom: '', qualite: '', telephone: '', email: '' });
  
  function mettreAJourIndicateur(id: string, champ: string, valeur: string | number) {
    setIndicateurs(prev => prev.map(ind =>
      ind.id === id ? { ...ind, [champ]: valeur } : ind
    ));
  }

  function ajouterPreuve(indId: string, fichier: File) {
    const taille = fichier.size > 1024 * 1024
      ? `${(fichier.size / 1024 / 1024).toFixed(1)} Mo`
      : `${Math.round(fichier.size / 1024)} Ko`;
    const nouvelleEntree = {
      nom: fichier.name,
      date: new Date().toLocaleDateString('fr-FR'),
      type: nouvellePreuve.type,
    };
    setPreuvesPar(prev => ({
      ...prev,
      [indId]: [...(prev[indId] ?? []), nouvelleEntree],
    }));
    mettreAJourIndicateur(indId, 'preuves', (indicateurs.find(i => i.id === indId)?.preuves ?? 0) + 1);
    setAjoutPreuve(null);
    setNouvellePreuve({ libelle: '', type: 'Document' });
  }

  const formation = RESULTATS_FORMATIONS.find(f => f.id === formationSelectionnee);
  const pctConformes = Math.round((QUALIOPI_STATS.conformes / QUALIOPI_STATS.totalIndicateurs) * 100);

  const [sessionSelectionnee, setSessionSelectionnee] = useState('EXAM-SC-2026-01');

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>Qualiopi</h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
            Suivi des indicateurs, résultats, preuves et préparation aux audits
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnPrimary}>Exporter rapport Qualiopi</button>
          <button style={btnSecondary}>Préparer l'audit</button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `2px solid ${COLORS.background}` }}>
        {ONGLETS.map((o, i) => (
          <button key={o} onClick={() => setOnglet(i)} style={{
            backgroundColor: 'transparent', border: 'none', padding: '10px 20px',
            fontSize: '14px', fontWeight: onglet === i ? '700' : '500',
            color: onglet === i ? COLORS.primary : COLORS.textMuted,
            borderBottom: onglet === i ? `3px solid ${COLORS.primary}` : '3px solid transparent',
            cursor: 'pointer', marginBottom: '-2px',
          }}>
            {o}
          </button>
        ))}
      </div>

      {/* ===== ONGLET 1 — Tableau de bord ===== */}
      {onglet === 0 && (
        <div>
          {/* Carte certification */}
          <div style={{ backgroundColor: COLORS.primary, borderRadius: '12px', padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                ✅ Certifié Qualiopi
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                Certification n° 51971543-3 — Valide jusqu'au {QUALIOPI_STATS.echeanceAudit}
              </div>
              <div style={{ fontSize: '13px', color: COLORS.secondary, marginTop: '4px', fontWeight: '600' }}>
                Prochain audit : {QUALIOPI_STATS.prochainAudit}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '48px', fontWeight: '800', color: 'white' }}>{pctConformes}%</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>indicateurs conformes</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard label="Indicateurs conformes" value={`${QUALIOPI_STATS.conformes}/${QUALIOPI_STATS.totalIndicateurs}`} color={COLORS.primary} />
            <StatCard label="À contrôler" value={String(QUALIOPI_STATS.aControler)} color={COLORS.secondary} />
            <StatCard label="Non conformes" value={String(QUALIOPI_STATS.nonConformes)} color="#e53e3e" />
            <StatCard label="Preuves manquantes" value={String(QUALIOPI_STATS.preuveManquantes)} color={COLORS.secondary} />
          </div>

          {/* Résumé par critère */}
          <Card>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
              Avancement par critère
            </h2>
            {[1, 2, 3, 4, 5, 6, 7].map((critere) => {
              const inds = INDICATEURS_QUALIOPI.filter(i => i.critere === critere);
              const conformes = inds.filter(i => i.statut === 'Conforme').length;
              const taux = Math.round((conformes / inds.length) * 100);
                   const labels: Record<number, string> = {
                1: 'Conditions d\'information du public',
                2: 'Identification des objectifs de la formation',
                3: 'Adaptation aux bénéficiaires',
                4: 'Adéquation des moyens pédagogiques et techniques',
                5: 'Gestion et amélioration continue',
                6: 'Sous-traitance et portage salarial',
                7: 'Spécifique apprentissage (8 indicateurs)',
              };
              return (
                <div key={critere} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>
                      Critère {critere} — {labels[critere]}
                    </span>
                    <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
                      {conformes}/{inds.length} indicateurs
                    </span>
                  </div>
                  <TauxBar taux={taux} color={taux === 100 ? COLORS.primary : taux >= 70 ? COLORS.secondary : '#e53e3e'} />
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* ===== ONGLET 2 — Indicateurs ===== */}
      {onglet === 1 && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
              Indicateurs Qualiopi ({indicateurs.length})
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Tous', 'Conforme', 'À contrôler', 'Non conforme'].map((f) => (
                <button key={f} onClick={() => setFiltreIndicateur(f)} style={{ backgroundColor: filtreIndicateur === f ? COLORS.primary : COLORS.background, color: filtreIndicateur === f ? 'white' : COLORS.primary, border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                {['Réf.', 'Indicateur', 'Statut', 'Preuves', 'Dernière vérif.', 'Actions'].map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indicateurs
                .filter(ind => filtreIndicateur === 'Tous' || ind.statut === filtreIndicateur)
                .map((ind) => {
                  const s = STATUT_IND[ind.statut] ?? { bg: '#f0f0f0', color: '#888', icon: '?' };
                  const enEdition = indicateurEdite === ind.id;
                  return (
                    <tr key={ind.id} style={{ borderBottom: `1px solid ${COLORS.border}`, backgroundColor: enEdition ? COLORS.background : 'white' }}>
                      <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '700', color: COLORS.primary }}>{ind.id}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: COLORS.text }}>{ind.libelle}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {enEdition ? (
                          <select
                            value={ind.statut}
                            onChange={(e) => mettreAJourIndicateur(ind.id, 'statut', e.target.value)}
                            style={{ border: '1.5px solid #e0e0e0', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', color: COLORS.text, backgroundColor: 'white' }}
                          >
                            <option value="Conforme">✅ Conforme</option>
                            <option value="À contrôler">⚠️ À contrôler</option>
                            <option value="Non conforme">❌ Non conforme</option>
                          </select>
                        ) : (
                          <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            {s.icon} {ind.statut}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {enEdition ? (
                          <input
                            type="number"
                            value={ind.preuves}
                            min={0}
                            onChange={(e) => mettreAJourIndicateur(ind.id, 'preuves', Number(e.target.value))}
                            style={{ border: '1.5px solid #e0e0e0', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', width: '60px' }}
                          />
                        ) : (
                          <span style={{ fontSize: '13px', color: ind.preuves === 0 ? '#e53e3e' : COLORS.textMuted, fontWeight: ind.preuves === 0 ? '700' : '400' }}>
                            {ind.preuves} preuve(s)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {enEdition ? (
                          <input
                            type="date"
                            value={ind.dateVerif.split('/').reverse().join('-')}
                            onChange={(e) => {
                              const [y, m, d] = e.target.value.split('-');
                              mettreAJourIndicateur(ind.id, 'dateVerif', `${d}/${m}/${y}`);
                            }}
                            style={{ border: '1.5px solid #e0e0e0', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }}
                          />
                        ) : (
                          <span style={{ fontSize: '12px', color: COLORS.textMuted }}>{ind.dateVerif}</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {enEdition ? (
                              <>
                                <button onClick={() => setIndicateurEdite(null)} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                                  ✅ Valider
                                </button>
                                <button onClick={() => setIndicateurEdite(null)} style={{ backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                                  Annuler
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setIndicateurEdite(ind.id)} style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                                  ✏️ Modifier
                                </button>
                                <button onClick={() => setAjoutPreuve(ajoutPreuve === ind.id ? null : ind.id)} style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                                  📎 Preuve
                                </button>
                              </>
                            )}
                          </div>

                          {/* Zone ajout preuve */}
                          {ajoutPreuve === ind.id && (
                            <div style={{ marginTop: '6px', padding: '10px', backgroundColor: '#fef6e4', borderRadius: '8px', border: `1px solid ${COLORS.secondary}`, minWidth: '260px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: COLORS.secondary, marginBottom: '8px' }}>
                                📎 Ajouter une preuve — {ind.id}
                              </div>
                              <select
                                value={nouvellePreuve.type}
                                onChange={e => setNouvellePreuve(prev => ({ ...prev, type: e.target.value }))}
                                style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', width: '100%', marginBottom: '6px', backgroundColor: 'white' }}
                              >
                                <option value="Document">📄 Document</option>
                                <option value="Lien web">🔗 Lien web</option>
                                <option value="Photo">📷 Photo</option>
                                <option value="Attestation">✅ Attestation</option>
                                <option value="Procès-verbal">📋 Procès-verbal</option>
                                <option value="Enquête">📊 Enquête satisfaction</option>
                              </select>
                              <label style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'block', textAlign: 'center' }}>
                                ⬆ Choisir un fichier
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) ajouterPreuve(ind.id, f);
                                  }}
                                />
                              </label>
                              <button onClick={() => setAjoutPreuve(null)} style={{ marginTop: '6px', backgroundColor: 'transparent', border: 'none', color: '#888', fontSize: '11px', cursor: 'pointer', width: '100%' }}>
                                Annuler
                              </button>
                            </div>
                          )}

                          {/* Preuves existantes */}
                          {(preuvesPar[ind.id] ?? []).length > 0 && (
                            <div style={{ marginTop: '4px' }}>
                              {(preuvesPar[ind.id] ?? []).map((p, pi) => (
                                <div key={pi} style={{ fontSize: '11px', color: COLORS.primary, backgroundColor: '#e6f4f1', borderRadius: '4px', padding: '3px 6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>📄 {p.nom}</span>
                                  <span style={{ color: '#888' }}>{p.date}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </Card>
      )}      

      {/* ===== ONGLET 3 — Résultats & CCP ===== */}
      {onglet === 2 && (
        <div>
          {/* Sélecteur formation */}
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {RESULTATS_FORMATIONS.map((f) => (
                <button key={f.id} onClick={() => setFormationSelectionnee(f.id)} style={{
                  backgroundColor: formationSelectionnee === f.id ? COLORS.primary : 'white',
                  color: formationSelectionnee === f.id ? 'white' : COLORS.primary,
                  border: `1.5px solid ${COLORS.primary}`,
                  borderRadius: '20px', padding: '6px 16px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>
                  {f.id}
                </button>
              ))}
            </div>
          </Card>

          {formation && (
            <div>
              {/* En-tête formation */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: COLORS.primary }}>{formation.formation}</h2>
                <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>{formation.niveau} — Session {formation.session}</p>
              </div>

              {/* Indicateurs de résultats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: '1° Taux d\'obtention du TP', value: `${formation.tauxObtention}%`, color: formation.tauxObtention >= 75 ? COLORS.primary : '#e53e3e', detail: `${formation.nbObtenu}/${formation.nbPresentes} candidats` },
                  { label: '2° Taux de poursuite d\'études', value: `${formation.tauxPoursuiteEtudes}%`, color: COLORS.secondary, detail: 'après obtention du titre' },
                  { label: '3° Taux d\'interruption', value: `${formation.tauxInterruption}%`, color: formation.tauxInterruption > 15 ? '#e53e3e' : COLORS.primary, detail: 'en cours de formation' },
                  { label: '4° Taux d\'insertion pro', value: `${formation.tauxInsertionPro}%`, color: formation.tauxInsertionPro >= 60 ? COLORS.primary : COLORS.secondary, detail: '6 mois après la formation' },
                  { label: '5° Valeur ajoutée', value: formation.valeurAjoutee, color: COLORS.primary, detail: 'vs niveau d\'entrée' },
                  { label: '6° Taux de rupture', value: `${formation.tauxRupture}%`, color: formation.tauxRupture > 10 ? '#e53e3e' : COLORS.primary, detail: 'contrats rompus' },
                ].map((ind) => (
                  <div key={ind.label} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `4px solid ${ind.color}` }}>
                    <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>{ind.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: ind.color, marginBottom: '4px' }}>{ind.value}</div>
                    <div style={{ fontSize: '11px', color: COLORS.textMuted }}>{ind.detail}</div>
                  </div>
                ))}
              </div>

              {/* Résultats par CCP */}
              <Card style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
                  Résultats par CCP — {formation.formation}
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                      {['CCP', 'Libellé', 'Présentés', 'Obtenus', 'Taux', 'Progression'].map((col) => (
                        <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formation.ccps.map((ccp) => (
                      <tr key={ccp.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700', color: COLORS.primary }}>{ccp.id}</td>
                        <td style={{ padding: '12px', fontSize: '13px', color: COLORS.text }}>{ccp.libelle}</td>
                        <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted, textAlign: 'center' }}>{ccp.nbPresentes}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', textAlign: 'center', color: COLORS.primary }}>{ccp.nbObtenu}</td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700', color: ccp.taux >= 80 ? COLORS.primary : ccp.taux >= 60 ? COLORS.secondary : '#e53e3e' }}>
                          {ccp.taux}%
                        </td>
                        <td style={{ padding: '12px', minWidth: '150px' }}>
                          <TauxBar taux={ccp.taux} color={ccp.taux >= 80 ? COLORS.primary : ccp.taux >= 60 ? COLORS.secondary : '#e53e3e'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              {/* Comparaison toutes formations */}
              <Card>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
                  Comparaison — Taux d'obtention toutes formations
                </h2>
                {RESULTATS_FORMATIONS.map((f) => (
                  <div key={f.id} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>{f.formation}</span>
                      <span style={{ fontSize: '12px', color: COLORS.textMuted }}>{f.nbObtenu}/{f.nbPresentes} candidats</span>
                    </div>
                    <TauxBar taux={f.tauxObtention} color={f.tauxObtention >= 80 ? COLORS.primary : f.tauxObtention >= 60 ? COLORS.secondary : '#e53e3e'} />
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ===== ONGLET 4 — Preuves documentaires ===== */}
      {onglet === 3 && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
              Registre des preuves ({preuves.length})
            </h2>
            <button
              onClick={() => setAjoutNouvellePreuve(!ajoutNouvellePreuve)}
              style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              + Ajouter une preuve
            </button>
          </div>

          {/* Formulaire ajout preuve */}
          {ajoutNouvellePreuve && (
            <div style={{ backgroundColor: COLORS.background, borderRadius: '10px', padding: '16px', marginBottom: '16px', border: `2px solid ${COLORS.primary}` }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
                📎 Nouvelle preuve documentaire
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Indicateur</label>
                  <select
                    value={nouvellePreuveForm.indicateur}
                    onChange={e => setNouvellePreuveForm(prev => ({ ...prev, indicateur: e.target.value }))}
                    style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', width: '100%', backgroundColor: 'white' }}
                  >
                    <option value="">Choisir...</option>
                    {indicateurs.map(ind => (
                      <option key={ind.id} value={ind.id}>{ind.id} — {ind.libelle.substring(0, 40)}...</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Type de preuve</label>
                  <select
                    value={nouvellePreuveForm.type}
                    onChange={e => setNouvellePreuveForm(prev => ({ ...prev, type: e.target.value }))}
                    style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', width: '100%', backgroundColor: 'white' }}
                  >
                    <option value="Document">📄 Document</option>
                    <option value="Lien web">🔗 Lien web</option>
                    <option value="Photo">📷 Photo</option>
                    <option value="Attestation">✅ Attestation</option>
                    <option value="Procès-verbal">📋 Procès-verbal</option>
                    <option value="Enquête">📊 Enquête satisfaction</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Statut</label>
                  <select
                    value={nouvellePreuveForm.statut}
                    onChange={e => setNouvellePreuveForm(prev => ({ ...prev, statut: e.target.value }))}
                    style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', width: '100%', backgroundColor: 'white' }}
                  >
                    <option value="Validé">✅ Validé</option>
                    <option value="À compléter">⚠️ À compléter</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Libellé de la preuve</label>
                <input
                  value={nouvellePreuveForm.libelle}
                  onChange={e => setNouvellePreuveForm(prev => ({ ...prev, libelle: e.target.value }))}
                  placeholder="Ex: Programme de formation SC 2026, Enquête satisfaction S1..."
                  style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Upload fichier ou lien */}
              {nouvellePreuveForm.type === 'Lien web' ? (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>URL du lien</label>
                  <input
                    value={nouvellePreuveForm.lien}
                    onChange={e => setNouvellePreuveForm(prev => ({ ...prev, lien: e.target.value }))}
                    placeholder="https://www.pamoi.re/..."
                    style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Fichier (PDF, JPG, PNG, Word)</label>
                  <label style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }}>
                    ⬆ Choisir un fichier
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setNouvellePreuveForm(prev => ({ ...prev, fichierNom: f.name }));
                      }}
                    />
                  </label>
                  {nouvellePreuveForm.fichierNom && (
                    <span style={{ marginLeft: '10px', fontSize: '13px', color: COLORS.primary, fontWeight: '600' }}>
                      ✅ {nouvellePreuveForm.fichierNom}
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setAjoutNouvellePreuve(false); setNouvellePreuveForm({ indicateur: '', libelle: '', type: 'Document', statut: 'Validé', lien: '', fichierNom: '' }); }}
                  style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (!nouvellePreuveForm.indicateur || !nouvellePreuveForm.libelle) return;
                    setPreuves(prev => [...prev, {
                      id: prev.length + 1,
                      indicateur: nouvellePreuveForm.indicateur,
                      libelle: nouvellePreuveForm.libelle,
                      type: nouvellePreuveForm.type,
                      dateAjout: new Date().toLocaleDateString('fr-FR'),
                      statut: nouvellePreuveForm.statut,
                      lien: nouvellePreuveForm.lien,
                      fichierNom: nouvellePreuveForm.fichierNom,
                    }]);
                    setAjoutNouvellePreuve(false);
                    setNouvellePreuveForm({ indicateur: '', libelle: '', type: 'Document', statut: 'Validé', lien: '', fichierNom: '' });
                  }}
                  style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  ✅ Ajouter la preuve
                </button>
              </div>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                {['Indicateur', 'Preuve', 'Type', 'Date ajout', 'Statut', 'Actions'].map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preuves.map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: '12px', fontSize: '12px', fontWeight: '700', color: COLORS.primary }}>{p.indicateur}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '13px', color: COLORS.text }}>{p.libelle}</div>
                    {p.fichierNom && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>📄 {p.fichierNom}</div>}
                    {p.lien && <a href={p.lien} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#3a5bc7', marginTop: '2px', display: 'block' }}>🔗 {p.lien}</a>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: COLORS.background, color: COLORS.primary, padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{p.type}</span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: COLORS.textMuted }}>{p.dateAjout}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: p.statut === 'Validé' ? '#e6f4f1' : '#fef6e4', color: p.statut === 'Validé' ? '#006B68' : '#C8A23A', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {p.statut}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {p.lien && (
                        <a href={p.lien} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#3a5bc7', color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}>
                          🔗 Ouvrir
                        </a>
                      )}
                      {p.fichierNom && (
                        <button style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                          📄 Voir
                        </button>
                      )}
                      <button
                        onClick={() => setPreuves(prev => prev.filter(pr => pr.id !== p.id))}
                        style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        🗑 Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

{/* ===== ONGLET 5 — Évaluation des enseignements (indicateur 33) ===== */}
      {onglet === 4 && (
        <GestionEvaluationsEnseignements
          interventions={interventionsDb}
          sessions={sessionsDb}
          apprenants={apprenantsDb}
          analysePar="Paméla MAILLOT"
        />
      )}

      {/* ⚠️ Ancien onglet Examens — code conservé mais inatteignable (onglet === 99).
          À supprimer lors de la refonte de la page Qualiopi : il fait doublon
          avec la page Examens, désormais alimentée par des données réelles. */}
      {onglet === 99 && (
        <div>
          {/* Sélecteur session */}
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Sessions d'examens</h2>
              <button style={btnPrimary}>+ Nouvelle session examen</button>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {SESSIONS_EXAMENS.map((s) => (
                <div key={s.id} onClick={() => { setSessionExamenId(s.id); setCandidatSelectionne(null); }} style={{ padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', border: sessionExamenId === s.id ? `2px solid ${COLORS.primary}` : '2px solid #e0e0e0', backgroundColor: sessionExamenId === s.id ? COLORS.background : 'white', minWidth: '220px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '2px' }}>{s.formation}</div>
                  <div style={{ fontSize: '12px', color: COLORS.textMuted }}>📅 {s.dateExamen} — {s.lieu}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: COLORS.textMuted }}>{s.candidats.length} candidat(s)</span>
                    <span style={{ backgroundColor: s.statut === 'Terminée' ? '#e6f4f1' : s.statut === 'En cours' ? '#fef6e4' : '#f0f4ff', color: s.statut === 'Terminée' ? '#006B68' : s.statut === 'En cours' ? '#C8A23A' : '#3a5bc7', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{s.statut}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {(() => {
            const session = SESSIONS_EXAMENS.find(s => s.id === sessionExamenId);
            if (!session) return null;
            const epreuves = EPREUVES_PAR_FORMATION[session.formationId] ?? [];
            const numeroCERES = numerosCERES[session.id] ?? '';
            const joursAvant = Math.ceil((new Date(session.dateExamen.split('/').reverse().join('-')).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            const nbInscrits = session.candidats.length;
            const nbConvoques = session.candidats.filter(c => ['Convoqué', 'Présent', 'Réussite', 'Réussite partielle', 'Échec', 'Absent', 'Rattrapage'].includes(c.statut)).length;
            const nbReussite = session.candidats.filter(c => c.statut === 'Réussite').length;
            const nbPartielle = session.candidats.filter(c => c.statut === 'Réussite partielle').length;
            const nbRattrapage = session.candidats.filter(c => c.statut === 'Rattrapage').length;

            const STATUT_CANDIDAT: Record<string, { bg: string; color: string }> = {
              'Inscrit': { bg: '#f0f4ff', color: '#3a5bc7' },
              'Convoqué': { bg: '#fef6e4', color: '#C8A23A' },
              'Présent': { bg: '#e6f4f1', color: '#006B68' },
              'Réussite': { bg: '#b8ddd9', color: '#004744' },
              'Réussite partielle': { bg: '#fef6e4', color: '#C8A23A' },
              'Échec': { bg: '#fde8e8', color: '#e53e3e' },
              'Absent': { bg: '#f0f0f0', color: '#888' },
              'Rattrapage': { bg: '#f5f0ff', color: '#7c3aed' },
            };

            return (
              <div>
                {/* Alerte 31 jours */}
                {joursAvant <= 31 && joursAvant > 0 && (
                  <div style={{ padding: '12px 16px', backgroundColor: '#fef6e4', borderRadius: '8px', borderLeft: `4px solid ${COLORS.secondary}`, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.secondary }}>⏰ Examen dans {joursAvant} jours — Convocations à envoyer !</div>
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>Les convocations doivent être envoyées 31 jours avant l'examen.</div>
                    </div>
                  </div>
                )}

                {/* Numéro CERES */}
                <Card style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Numéro de session CERES</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          value={numeroCERES}
                          onChange={e => setNumerosCERES(prev => ({ ...prev, [session.id]: e.target.value }))}
                          placeholder="En attente CERES — Saisir après génération sur la plateforme"
                          style={{ border: `1.5px solid ${numeroCERES ? COLORS.primary : '#C8A23A'}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '400px', color: '#1a1a1a', backgroundColor: numeroCERES ? '#e6f4f1' : '#fffbf0' }}
                        />
                        {!numeroCERES && <span style={{ fontSize: '12px', color: '#C8A23A', fontWeight: '600' }}>⚠️ Obligatoire avant envoi des convocations</span>}
                        {numeroCERES && <span style={{ fontSize: '12px', color: '#006B68', fontWeight: '600' }}>✅ Numéro enregistré</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Date examen</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>{session.dateExamen}</div>
                      <div style={{ fontSize: '11px', color: joursAvant <= 31 ? '#C8A23A' : COLORS.textMuted }}>
                        {joursAvant > 0 ? `Dans ${joursAvant} jours` : 'Examen passé'}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Gestion jury */}
                <Card style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>👨‍⚖️ Composition du jury</h2>
                    <button onClick={() => setAfficherGestionJury(!afficherGestionJury)} style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      {afficherGestionJury ? '✕ Fermer' : '+ Ajouter un juré'}
                    </button>
                  </div>

                  {afficherGestionJury && (
                    <div style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '8px' }}>
                        {[
                          { champ: 'nom', label: 'Nom', placeholder: 'NOM' },
                          { champ: 'prenom', label: 'Prénom', placeholder: 'Prénom' },
                          { champ: 'qualite', label: 'Qualité', placeholder: 'Président jury, Membre...' },
                          { champ: 'telephone', label: 'Téléphone', placeholder: '06 XX XX XX XX' },
                          { champ: 'email', label: 'Email', placeholder: 'email@domaine.fr' },
                        ].map((f) => (
                          <div key={f.champ}>
                            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '3px' }}>{f.label}</div>
                            <input
                              value={(nouveauJure as any)[f.champ]}
                              onChange={e => setNouveauJure(prev => ({ ...prev, [f.champ]: e.target.value }))}
                              placeholder={f.placeholder}
                              style={{ border: '1.5px solid #e0e0e0', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          if (nouveauJure.nom && nouveauJure.qualite) {
                            setJury(prev => [...prev, nouveauJure]);
                            setNouveauJure({ nom: '', prenom: '', qualite: '', telephone: '', email: '' });
                            setAfficherGestionJury(false);
                          }
                        }}
                        style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        ✅ Ajouter au jury
                      </button>
                    </div>
                  )}

                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                        {['Nom', 'Prénom', 'Qualité', 'Téléphone', 'Email', ''].map((col) => (
                          <th key={col} style={{ textAlign: 'left', padding: '6px 10px', fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jury.map((j, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: '8px 10px', fontSize: '13px', fontWeight: '700' }}>{j.nom}</td>
                          <td style={{ padding: '8px 10px', fontSize: '13px' }}>{j.prenom}</td>
                          <td style={{ padding: '8px 10px', fontSize: '12px', color: COLORS.textMuted }}>{j.qualite}</td>
                          <td style={{ padding: '8px 10px', fontSize: '12px', color: COLORS.textMuted }}>{j.telephone}</td>
                          <td style={{ padding: '8px 10px', fontSize: '12px', color: COLORS.textMuted }}>{j.email}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <button onClick={() => setJury(prev => prev.filter((_, idx) => idx !== i))} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                {/* Épreuves */}
                <Card style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>📋 Épreuves — {session.formation}</h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                        {['Épreuve', 'Durée'].map((col) => (
                          <th key={col} style={{ textAlign: 'left', padding: '6px 12px', fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {epreuves.map((e, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}`, backgroundColor: e.duree === 'Sans objet' ? '#f9f9f9' : 'white' }}>
                          <td style={{ padding: '8px 12px', fontSize: '13px', color: e.duree === 'Sans objet' ? '#aaa' : COLORS.text }}>{e.libelle}</td>
                          <td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: e.duree === 'Sans objet' ? '400' : '700', color: e.duree === 'Sans objet' ? '#aaa' : COLORS.primary }}>{e.duree}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'Inscrits', value: nbInscrits, color: '#3a5bc7' },
                    { label: 'Convoqués', value: nbConvoques, color: COLORS.secondary },
                    { label: 'Réussite TP', value: nbReussite, color: '#004744' },
                    { label: 'Réussite partielle', value: nbPartielle, color: COLORS.secondary },
                    { label: 'Rattrapage', value: nbRattrapage, color: '#7c3aed' },
                  ].map((s) => (
                    <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `4px solid ${s.color}`, textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tableau candidats */}
                <Card>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
                    Candidats — {session.formation} — {session.dateExamen}
                  </h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                        {['Nom', 'Prénom', 'Type candidature', 'CCP à passer', 'Statut', 'PV importé', 'TP obtenu', 'Convocation'].map((col) => (
                          <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {session.candidats.map((c) => {
                        const sc = STATUT_CANDIDAT[c.statut] ?? { bg: '#f0f0f0', color: '#888' };
                        const ccpsARattraper = c.resultats.filter((r: any) => r.statut === 'Échoué' || r.statut === 'Rattrapage').map((r: any) => r.ccpId);
                        const typeCandidature = ccpsARattraper.length > 0 ? 'Rattrapage CCP' : 'Titre complet';
                        const ccpsPassés = ccpsARattraper.length > 0 ? ccpsARattraper : c.resultats.map((r: any) => r.ccpId);

                        return (
                          <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700' }}>{c.nom}</td>
                            <td style={{ padding: '10px', fontSize: '13px' }}>{c.prenom}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ backgroundColor: ccpsARattraper.length > 0 ? '#f5f0ff' : '#e6f4f1', color: ccpsARattraper.length > 0 ? '#7c3aed' : '#006B68', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                                {typeCandidature}
                              </span>
                            </td>
                            <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>
                              {ccpsARattraper.length > 0 ? ccpsARattraper.join(', ') : 'Tous les CCP'}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ backgroundColor: sc.bg, color: sc.color, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                {c.statut}
                              </span>
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              {c.pvImporte
                                ? <span style={{ color: '#006B68', fontWeight: '700', fontSize: '12px' }}>✅ {c.dateImportPV}</span>
                                : <span style={{ color: '#e53e3e', fontSize: '12px', fontWeight: '600' }}>Non importé</span>
                              }
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              {c.obtentionTP
                                ? <span style={{ backgroundColor: '#b8ddd9', color: '#004744', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>✅ Obtenu</span>
                                : <span style={{ backgroundColor: '#f0f0f0', color: '#888', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>En cours</span>
                              }
                            </td>
                            <td style={{ padding: '10px' }}>
                              <BoutonPdfConvocation
                                candidat={{ nom: c.nom, prenom: c.prenom, dateNaissance: c.dateNaissance, email: c.emailApprenant ?? 'email@exemple.fr' }}
                                formation={session.formation}
                                formationId={session.formationId}
                                typeCandidature={typeCandidature}
                                ccpsPassés={ccpsPassés}
                                dateExamen={session.dateExamen}
                                heureConvocation="08:00"
                                lieu={session.lieu}
                                numeroSession={numeroCERES || 'En attente CERES'}
                                jury={jury}
                                epreuves={epreuves}
                                documentsAApporter={DOCUMENTS_EXAMEN}
                                nomFichier={`Convocation_${c.nom}_${session.formationId}_${session.dateExamen.replace(/\//g, '-')}.pdf`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              </div>
            );
          })()}
        </div>
      )}
      </div>
  );
}