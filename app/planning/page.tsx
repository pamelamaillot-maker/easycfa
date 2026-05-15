'use client';

import { useState, useEffect } from 'react';
import { COLORS } from '../../lib/constants';
import Card from '../../components/Card';

const btnPrimary: React.CSSProperties = { backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };

const FORMATIONS_CONFIG: Record<string, { couleur: string; label: string; jour: number }> = {
  SC:   { couleur: '#006B68', label: 'Secrétaire Comptable', jour: 3 },
  EC:   { couleur: '#0891b2', label: 'Employé Commercial', jour: 1 },
  CV:   { couleur: '#7c3aed', label: 'Conseiller de Vente', jour: 1 },
  AD:   { couleur: '#C8A23A', label: 'Assistant de Direction', jour: 4 },
  CATL: { couleur: '#ea580c', label: 'Chargé Accueil Touristique', jour: 4 },
  ARH:  { couleur: '#16a34a', label: 'Assistant RH', jour: 2 },
  GCF:  { couleur: '#dc2626', label: 'Gestionnaire Comptable et Fiscal', jour: 2 },
};

const JOURS_SEMAINE = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function parseDate(str: string): Date | null {
  if (!str) return null;
  const p = str.split('/');
  if (p.length === 3) return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  return null;
}

function memeJour(d1: Date, d2: Date): boolean {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

type Session = {
  id: string;
  numero: string;
  formation: string;
  dateDebut: string;
  dateFin: string;
  apprenantIds: string[];
  modules: { formateurNom: string; nom: string }[];
  planning: { date: string; type: 'cours' | 'revision' | 'examen' }[];
  statut: string;
  salle: string;
};

export default function Planning() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [formateurs, setFormateurs] = useState<any[]>([]);
  const [vue, setVue] = useState<'mois' | 'semaine'>('mois');
  const [dateRef, setDateRef] = useState(new Date());
  const [filtreFormation, setFiltreFormation] = useState('');
  const [filtreFormateur, setFiltreFormateur] = useState('');
  const [jourSelectionne, setJourSelectionne] = useState<Date | null>(null);
  const [sessionSelectionnee, setSessionSelectionnee] = useState<Session | null>(null);
  const [journalOuvert, setJournalOuvert] = useState<{ session: Session; date: Date } | null>(null);
  const [journal, setJournal] = useState({ activiteType: '', competences: '', objectif: '', contenus: '', evaluation: '', formatEval: '', outils: '', ressources: '', lienEnLigne: '', difficultes: '', retardataires: '', absents: '' });
  const [journalSauvegarde, setJournalSauvegarde] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('easycfa_sessions_v2');
      if (saved) setSessions(JSON.parse(saved));
      const fSaved = localStorage.getItem('easycfa_formateurs');
      if (fSaved) setFormateurs(JSON.parse(fSaved));
    } catch {}
  }, []);

  // Obtenir les sessions actives sur un jour donné
  function ouvrirJournal(session: Session, date: Date) {
    const dateStr = date.toLocaleDateString('fr-FR').replace(/\//g, '-');
    const key = `journal_${session.id}_${dateStr}`;
    try {
      const saved = localStorage.getItem(key);
      setJournal(saved ? JSON.parse(saved) : { activiteType: '', competences: '', objectif: '', contenus: '', evaluation: '', formatEval: '', outils: '', ressources: '', lienEnLigne: '', difficultes: '', retardataires: '', absents: '' });
    } catch { setJournal({ activiteType: '', competences: '', objectif: '', contenus: '', evaluation: '', formatEval: '', outils: '', ressources: '', lienEnLigne: '', difficultes: '', retardataires: '', absents: '' }); }
    setJournalOuvert({ session, date });
    setJournalSauvegarde(false);
  }

  function sauvegarderJournal() {
    if (!journalOuvert) return;
    const dateStr = journalOuvert.date.toLocaleDateString('fr-FR').replace(/\//g, '-');
    const key = `journal_${journalOuvert.session.id}_${dateStr}`;
    localStorage.setItem(key, JSON.stringify(journal));
    setJournalSauvegarde(true);
    setTimeout(() => setJournalOuvert(null), 1200);
  }

  function ouvrirJournal(session: Session, date: Date) {
    const dateStr = date.toLocaleDateString('fr-FR').replace(/\//g, '-');
    const key = `journal_${session.id}_${dateStr}`;
    try {
      const saved = localStorage.getItem(key);
      setJournal(saved ? JSON.parse(saved) : { activiteType: '', competences: '', objectif: '', contenus: '', evaluation: '', formatEval: '', outils: '', ressources: '', lienEnLigne: '', difficultes: '', retardataires: '', absents: '' });
    } catch { setJournal({ activiteType: '', competences: '', objectif: '', contenus: '', evaluation: '', formatEval: '', outils: '', ressources: '', lienEnLigne: '', difficultes: '', retardataires: '', absents: '' }); }
    setJournalOuvert({ session, date });
    setJournalSauvegarde(false);
  }

  function sauvegarderJournal() {
    if (!journalOuvert) return;
    const dateStr = journalOuvert.date.toLocaleDateString('fr-FR').replace(/\//g, '-');
    const key = `journal_${journalOuvert.session.id}_${dateStr}`;
    localStorage.setItem(key, JSON.stringify(journal));
    setJournalSauvegarde(true);
    setTimeout(() => setJournalOuvert(null), 1200);
  }

  function sessionsJour(date: Date): { session: Session; type: string }[] {
    return sessions
      .filter(s => {
        if (filtreFormation && s.formation !== filtreFormation) return false;
        if (filtreFormateur) {
          const hasFormateur = (s.modules || []).some(m => m.formateurNom?.toLowerCase().includes(filtreFormateur.toLowerCase()));
          if (!hasFormateur) return false;
        }
        return (s.planning || []).some(p => {
          const d = parseDate(p.date);
          return d && memeJour(d, date);
        });
      })
      .map(s => {
        const planJour = (s.planning || []).find(p => {
          const d = parseDate(p.date);
          return d && memeJour(d, date);
        });
        return { session: s, type: planJour?.type ?? 'cours' };
      });
  }

  // Navigation
  function precedent() {
    const d = new Date(dateRef);
    if (vue === 'mois') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setDateRef(d);
  }

  function suivant() {
    const d = new Date(dateRef);
    if (vue === 'mois') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setDateRef(d);
  }

  // Générer les jours du mois
  function joursduMois(): Date[] {
    const annee = dateRef.getFullYear();
    const mois = dateRef.getMonth();
    const premier = new Date(annee, mois, 1);
    const dernier = new Date(annee, mois + 1, 0);
    const jours: Date[] = [];
    // Jours du mois précédent pour compléter la première semaine
    const debutSemaine = premier.getDay() === 0 ? 6 : premier.getDay() - 1;
    for (let i = debutSemaine; i > 0; i--) {
      const d = new Date(annee, mois, 1 - i);
      jours.push(d);
    }
    for (let i = 1; i <= dernier.getDate(); i++) {
      jours.push(new Date(annee, mois, i));
    }
    // Compléter jusqu'à 42 jours (6 semaines)
    while (jours.length < 42) {
      const last = jours[jours.length - 1];
      const next = new Date(last);
      next.setDate(next.getDate() + 1);
      jours.push(next);
    }
    return jours;
  }

  // Générer les jours de la semaine
  function joursDeLaSemaine(): Date[] {
    const lundi = new Date(dateRef);
    const jour = lundi.getDay();
    const diff = jour === 0 ? -6 : 1 - jour;
    lundi.setDate(lundi.getDate() + diff);
    const jours: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lundi);
      d.setDate(d.getDate() + i);
      jours.push(d);
    }
    return jours;
  }

  const aujourd = new Date();
  const joursAffiches = vue === 'mois' ? joursduMois() : joursDeLaSemaine();
  const titre = vue === 'mois'
    ? `${MOIS_NOMS[dateRef.getMonth()]} ${dateRef.getFullYear()}`
    : `Semaine du ${joursDeLaSemaine()[0].toLocaleDateString('fr-FR')} au ${joursDeLaSemaine()[6].toLocaleDateString('fr-FR')}`;

  const sessionsJourSelectionne = jourSelectionne ? sessionsJour(jourSelectionne) : [];
  const formateursList = [...new Set(formateurs.map(f => f.prenom + ' ' + f.nom))].sort();

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#006B68', marginBottom: '4px' }}>🗓 Planning</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>{sessions.filter(s => s.statut === 'En cours').length} session(s) en cours</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setVue('mois')} style={{ ...btnSecondary, backgroundColor: vue === 'mois' ? '#006B68' : 'white', color: vue === 'mois' ? 'white' : '#006B68' }}>🗓 Mois</button>
          <button onClick={() => setVue('semaine')} style={{ ...btnSecondary, backgroundColor: vue === 'semaine' ? '#006B68' : 'white', color: vue === 'semaine' ? 'white' : '#006B68' }}>📅 Semaine</button>
        </div>
      </div>

      {/* Filtres */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filtreFormation} onChange={e => setFiltreFormation(e.target.value)} style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', backgroundColor: 'white' }}>
            <option value="">Toutes les formations</option>
            {Object.entries(FORMATIONS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{k} — {v.label}</option>
            ))}
          </select>
          <select value={filtreFormateur} onChange={e => setFiltreFormateur(e.target.value)} style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', backgroundColor: 'white' }}>
            <option value="">Tous les formateurs</option>
            {formateursList.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          {(filtreFormation || filtreFormateur) && (
            <button onClick={() => { setFiltreFormation(''); setFiltreFormateur(''); }} style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px' }}>✕ Réinitialiser</button>
          )}

          {/* Légende */}
          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {Object.entries(FORMATIONS_CONFIG).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: v.couleur, borderRadius: '2px' }} />
                <span style={{ fontSize: '10px', color: '#555', fontWeight: '600' }}>{k}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button onClick={precedent} style={btnSecondary}>← Précédent</button>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#006B68', textTransform: 'capitalize' }}>{titre}</h2>
          <button onClick={() => setDateRef(new Date())} style={{ ...btnSecondary, padding: '4px 10px', fontSize: '11px' }}>Aujourd'hui</button>
        </div>
        <button onClick={suivant} style={btnSecondary}>Suivant →</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: jourSelectionne ? '1fr 320px' : '1fr', gap: '16px' }}>

        {/* Calendrier */}
        <Card style={{ padding: '0' }}>
          {/* En-têtes jours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid #EAF4F3' }}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(j => (
              <div key={j} style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase' }}>{j}</div>
            ))}
          </div>

          {/* Grille jours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {joursAffiches.map((jour, i) => {
              const estMoisCourant = jour.getMonth() === dateRef.getMonth();
              const estAujourdhui = memeJour(jour, aujourd);
              const estSelectionne = jourSelectionne && memeJour(jour, jourSelectionne);
              const sessionsJ = sessionsJour(jour);
              const estWeekend = jour.getDay() === 0 || jour.getDay() === 6;

              return (
                <div key={i} onClick={() => { setJourSelectionne(estSelectionne ? null : jour); setSessionSelectionnee(null); }} style={{
                  minHeight: vue === 'mois' ? '90px' : '120px',
                  padding: '6px',
                  borderRight: '1px solid #f0f0f0',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: estSelectionne ? '#EAF4F3' : estWeekend ? '#fafafa' : 'white',
                  cursor: 'pointer',
                  opacity: estMoisCourant ? 1 : 0.4,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: estAujourdhui ? '800' : '600',
                      color: estAujourdhui ? 'white' : estWeekend ? '#bbb' : '#333',
                      backgroundColor: estAujourdhui ? '#006B68' : 'transparent',
                      borderRadius: '50%', width: '22px', height: '22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{jour.getDate()}</span>
                    {sessionsJ.length > 0 && vue === 'mois' && (
                      <span style={{ fontSize: '9px', color: '#888' }}>{sessionsJ.length} sess.</span>
                    )}
                  </div>

                  {/* Sessions du jour */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {(vue === 'mois' ? sessionsJ.slice(0, 3) : sessionsJ).map(({ session: s, type }) => {
                      const cfg = FORMATIONS_CONFIG[s.formation];
                      const formateur = (s.modules || [])[0]?.formateurNom || '';
                      const typeStyle = type === 'revision' ? { border: '2px dashed ' + cfg?.couleur } : type === 'examen' ? { border: '2px solid ' + cfg?.couleur, fontStyle: 'italic' } : {};
                      return (
                        <div key={s.id} onClick={e => { e.stopPropagation(); setJourSelectionne(jour); setSessionSelectionnee(s); }} style={{
                          backgroundColor: cfg?.couleur + '20',
                          borderLeft: `3px solid ${cfg?.couleur}`,
                          borderRadius: '3px',
                          padding: '2px 5px',
                          fontSize: '10px',
                          fontWeight: '600',
                          color: cfg?.couleur,
                          ...typeStyle,
                        }}>
                          <div>{s.formation} {type !== 'cours' ? `(${type === 'revision' ? 'Rév.' : 'Exam.'})` : ''}</div>
                          {vue === 'semaine' && (
                            <>
                              <div style={{ fontSize: '9px', color: '#555', fontWeight: '400' }}>{s.numero}</div>
                              {formateur && <div style={{ fontSize: '9px', color: '#555', fontWeight: '400' }}>👤 {formateur}</div>}
                              <div style={{ fontSize: '9px', color: '#555', fontWeight: '400' }}>👥 {s.apprenantIds.length} appr.</div>
                            </>
                          )}
                        </div>
                      );
                    })}
                    {vue === 'mois' && sessionsJ.length > 3 && (
                      <div style={{ fontSize: '9px', color: '#888' }}>+{sessionsJ.length - 3} autres</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Panneau détail jour */}
        {jourSelectionne && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>
                {jourSelectionne.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={() => { setJourSelectionne(null); setSessionSelectionnee(null); }} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
            </div>

            {sessionsJourSelectionne.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>
                Aucune session ce jour
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessionsJourSelectionne.map(({ session: s, type }) => {
                  const cfg = FORMATIONS_CONFIG[s.formation];
                  const isSelected = sessionSelectionnee?.id === s.id;
                  const typeLabel = type === 'cours' ? '📖 Cours' : type === 'revision' ? '📝 Révisions' : '🎓 Examen';
                  const formateurs_session = [...new Set((s.modules || []).map(m => m.formateurNom).filter(Boolean))];

                  return (
                    <div key={s.id} onClick={() => setSessionSelectionnee(isSelected ? null : s)} style={{ borderRadius: '10px', border: `2px solid ${isSelected ? cfg?.couleur : cfg?.couleur + '40'}`, backgroundColor: isSelected ? cfg?.couleur + '10' : 'white', cursor: 'pointer', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: cfg?.couleur, padding: '8px 12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>{s.numero} — {cfg?.label}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>{typeLabel} · 7h · {s.salle || 'Salle A'}</div>
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>
                          👥 <strong>{s.apprenantIds.length}</strong> apprenant(s) inscrit(s)
                        </div>
                        {formateurs_session.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>
                            👨‍🏫 {formateurs_session.join(', ')}
                          </div>
                        )}
                        {isSelected && (
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                            {(s.modules || []).map((mod, i) => (
                              <div key={i} style={{ fontSize: '10px', color: '#555', marginBottom: '3px' }}>
                                📚 {mod.nom || 'Module'}{mod.formateurNom ? ` — ${mod.formateurNom}` : ''}
                              </div>
                            ))}
                            <a href={`/sessions`} style={{ display: 'inline-block', marginTop: '8px', backgroundColor: cfg?.couleur, color: 'white', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}>
                              Voir la session →
                            </a>
                            <a href="/emargement" style={{ display: 'inline-block', marginTop: '8px', marginLeft: '6px', backgroundColor: 'white', color: cfg?.couleur, border: `1px solid ${cfg?.couleur}`, borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}>
                              📋 Émargement
                            </a>
                            <button onClick={e => { e.stopPropagation(); ouvrirJournal(s, jourSelectionne!); }} style={{ display: 'inline-block', marginTop: '8px', marginLeft: '6px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                              📓 Journal de bord
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Résumé du jour */}
            {sessionsJourSelectionne.length > 0 && (
              <div style={{ marginTop: '12px', backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#006B68', marginBottom: '4px' }}>Résumé</div>
                <div style={{ fontSize: '11px', color: '#555' }}>
                  {sessionsJourSelectionne.length} session(s) · {sessionsJourSelectionne.reduce((s, { session }) => s + session.apprenantIds.length, 0)} apprenant(s) · {sessionsJourSelectionne.length * 7}h de formation
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    {/* Modale Journal de bord */}
      {journalOuvert && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ backgroundColor: FORMATIONS_CONFIG[journalOuvert.session.formation]?.couleur ?? '#006B68', padding: '16px 20px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>📓 Journal de bord pédagogique</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                  {journalOuvert.session.numero} — {FORMATIONS_CONFIG[journalOuvert.session.formation]?.label} — {journalOuvert.date.toLocaleDateString('fr-FR')}
                </div>
              </div>
              <button onClick={() => setJournalOuvert(null)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>✕</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Pédagogie */}
              <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#006B68', textTransform: 'uppercase', marginBottom: '10px' }}>📚 Contenu pédagogique</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: '1. Activité Type concernée', champ: 'activiteType', placeholder: 'ex: AT1 — Gestion administrative...' },
                    { label: '2. Compétence(s) du jour', champ: 'competences', placeholder: 'ex: C1.1, C1.2...' },
                    { label: '3. Objectif de la séance', champ: 'objectif', placeholder: 'ex: Maîtriser la saisie comptable...' },
                    { label: '6. Outils utilisés', champ: 'outils', placeholder: 'ex: Tableur, logiciel comptable...' },
                  ].map(f => (
                    <div key={f.champ}>
                      <label style={{ fontSize: '10px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                      <input style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' }} value={(journal as any)[f.champ] ?? ''} placeholder={f.placeholder} onChange={e => setJournal(p => ({ ...p, [f.champ]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '10px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '3px' }}>4. Contenus vus lors de la séance</label>
                  <textarea style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white', minHeight: '70px', resize: 'vertical' }} value={journal.contenus} placeholder="Décrivez les contenus abordés..." onChange={e => setJournal(p => ({ ...p, contenus: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '3px' }}>7. Ressources de synthèse (lien)</label>
                    <input style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' }} value={journal.ressources} placeholder="https://..." onChange={e => setJournal(p => ({ ...p, ressources: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '3px' }}>8. Lien distanciel</label>
                    <input style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' }} value={journal.lienEnLigne} placeholder="https://meet.google.com/..." onChange={e => setJournal(p => ({ ...p, lienEnLigne: e.target.value }))} />
                  </div>
                </div>
              </div>
              {/* Évaluation */}
              <div style={{ backgroundColor: '#fef6e4', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#C8A23A', textTransform: 'uppercase', marginBottom: '10px' }}>✅ Évaluation</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '3px' }}>5a. Évaluation réalisée ?</label>
                    <select style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', backgroundColor: 'white' }} value={journal.evaluation} onChange={e => setJournal(p => ({ ...p, evaluation: e.target.value }))}>
                      <option value="">Choisir...</option>
                      <option value="Oui">Oui</option>
                      <option value="Non">Non</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '3px' }}>5b. Format</label>
                    <select style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', backgroundColor: 'white' }} value={journal.formatEval} onChange={e => setJournal(p => ({ ...p, formatEval: e.target.value }))}>
                      <option value="">Choisir...</option>
                      {['QCM','Exercice pratique','Mise en situation','Oral','Devoir maison','Quiz en ligne','Autre'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '10px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '3px' }}>9. Difficultés rencontrées</label>
                  <textarea style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white', minHeight: '60px', resize: 'vertical' }} value={journal.difficultes} placeholder="Difficultés pédagogiques, techniques ou comportementales..." onChange={e => setJournal(p => ({ ...p, difficultes: e.target.value }))} />
                </div>
              </div>
              {/* Présence */}
              <div style={{ backgroundColor: '#fde8e8', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#e53e3e', textTransform: 'uppercase', marginBottom: '10px' }}>👥 Présence & Ponctualité</div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '3px' }}>10-11. Retardataires (Nom — heure d'arrivée — durée — motif)</label>
                  <textarea style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white', minHeight: '70px', resize: 'vertical', fontFamily: 'monospace' }} value={journal.retardataires} placeholder={'Dupont Marie — arrivée 9h15 — retard 1h15 — transport'} onChange={e => setJournal(p => ({ ...p, retardataires: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '3px' }}>12. Absents (Nom — motif)</label>
                  <textarea style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white', minHeight: '60px', resize: 'vertical', fontFamily: 'monospace' }} value={journal.absents} placeholder={'Martin Jean — absence non justifiée'} onChange={e => setJournal(p => ({ ...p, absents: e.target.value }))} />
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {journalSauvegarde ? <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>✅ Journal sauvegardé !</span> : <span />}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setJournalOuvert(null)} style={{ backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                  <button onClick={sauvegarderJournal} style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>💾 Enregistrer</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}