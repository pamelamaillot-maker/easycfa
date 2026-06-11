'use client';
import { SESSIONS } from '../../../data/mockData';
import { APPRENANTS_REELS } from '../../../data/mockApprenants_reels';
import Badge from '../../../components/Badge';
import Card from '../../../components/Card';
import { COLORS } from '../../../lib/constants';
import React, { use, useState, useEffect } from 'react';
import { chargerSession as chargerSessionSupabase, modifierSession } from '../../../data/sessionsSupabase';

// ✅ Charge la session depuis localStorage avec fallback sur le seed
function trouverSession(id: string): any | null {
  if (typeof window === 'undefined') {
    return (SESSIONS as any[]).find(s => String(s.id) === id) || null;
  }
  try {
    const liste = JSON.parse(localStorage.getItem('easycfa_sessions_v2') || '[]');
    const trouve = liste.find((s: any) => String(s.id) === id);
    if (trouve) return trouve;
  } catch {}
  return (SESSIONS as any[]).find(s => String(s.id) === id) || null;
}

// ✅ Charge tous les apprenants depuis localStorage + seed
function chargerTousApprenants(): any[] {
  if (typeof window === 'undefined') return APPRENANTS_REELS as any[];
  const ids = new Set();
  const liste: any[] = [];
  (APPRENANTS_REELS as any[]).forEach(a => { liste.push(a); ids.add(a.id); });
  try {
    const persistee = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
    persistee.forEach((a: any) => { if (!ids.has(a.id)) { liste.push(a); ids.add(a.id); } });
  } catch {}
  return liste.map(a => {
    try {
      const fiche = localStorage.getItem(`apprenant_${a.id}`);
      if (fiche) return { ...a, ...JSON.parse(fiche) };
    } catch {}
    return a;
  });
}

export default function FicheSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<any>(null);
  const [apprenants, setApprenants] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modeEditionPlanning, setModeEditionPlanning] = useState(false);
  const [planningBrouillon, setPlanningBrouillon] = useState<any[]>([]);
  const [sauvegardePlanning, setSauvegardePlanning] = useState(false);

  useEffect(() => {
    (async () => {
      // 1. Tentative Supabase d'abord
      let s: any = null;
      try {
        s = await chargerSessionSupabase(id);
        if (s) console.log(`[FicheSession ${id}] Chargée depuis Supabase ✅`);
      } catch (e) {
        console.error('[FicheSession] Erreur Supabase, fallback localStorage', e);
      }
      // 2. Fallback localStorage
      if (!s) {
        s = trouverSession(id);
        if (s) console.warn(`[FicheSession ${id}] Chargée depuis localStorage (fallback)`);
      }
      setSession(s);
      if (s) {
        const tous = chargerTousApprenants();
        const lies = s.apprenantIds && Array.isArray(s.apprenantIds)
          ? tous.filter(a => s.apprenantIds.includes(a.id))
          : [];
        setApprenants(lies);
      }
      setChargement(false);
    })();
  }, [id]);

  const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' };
  const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' };

  function entrerEdition() {
    setPlanningBrouillon(session.planning ? JSON.parse(JSON.stringify(session.planning)) : []);
    setModeEditionPlanning(true);
  }

  function annulerEdition() {
    setPlanningBrouillon([]);
    setModeEditionPlanning(false);
  }

  async function sauvegarderPlanning() {
    try {
      // Supabase d'abord
      const res = await modifierSession(id, { planning: planningBrouillon } as any);
      if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
      else console.log(`[FicheSession ${id}] Planning sauvegardé dans Supabase ✅`);
      // localStorage en miroir
      const liste = JSON.parse(localStorage.getItem('easycfa_sessions_v2') || '[]');
      const idx = liste.findIndex((s: any) => String(s.id) === id);
      if (idx >= 0) {
        liste[idx].planning = planningBrouillon;
        localStorage.setItem('easycfa_sessions_v2', JSON.stringify(liste));
      }
      setSession({ ...session, planning: planningBrouillon });
      setModeEditionPlanning(false);
      setSauvegardePlanning(true);
      setTimeout(() => setSauvegardePlanning(false), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde planning:', err);
      alert('Erreur lors de la sauvegarde du planning.');
    }
  }

  if (chargement) return <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>Chargement...</div>;
  if (!session) return <div style={{ padding: '32px', color: COLORS.primary }}>Session introuvable (ID : {id}).</div>;

  // Normalisation des champs (compatibilité seed vs localStorage)
  const dateDebut = session.dateDebut || session.debut || '—';
  const dateFin = session.dateFin || session.fin || '—';
  const nomSession = session.numero || session.nom || session.formation || `Session ${id}`;
  const formateur = session.formateur || '—';
  const salle = session.salle || '—';
  const statut = session.statut || 'En cours';

  return (
    <div>
      {/* En-tête */}
      <div style={{ marginBottom: '24px' }}>
        <a href="/sessions" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
          ← Retour aux sessions
        </a>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary }}>{nomSession}</h1>
            <Badge statut={statut} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href="/emargement" style={btnPrimary}>📋 Feuille émargement</a>
            <a href="/documents/generation" style={btnPrimary}>📄 Générer documents</a>
            <a href="/documents/convention" style={btnSecondary}>📄 Convention</a>
          </div>
        </div>
      </div>

      {/* Informations générales */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Informations générales
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          {[
            { label: 'Date de début', value: dateDebut },
            { label: 'Date de fin', value: dateFin },
            { label: 'Formateur', value: formateur },
            { label: 'Salle', value: salle },
          ].map((info) => (
            <div key={info.label} style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>{info.label}</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: COLORS.text }}>{info.value}</div>
            </div>
          ))}
        </div>

        {/* Stats session */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Apprenants inscrits', value: String(apprenants.length), color: COLORS.primary },
            { label: 'Planning (entrées)', value: String(session.planning?.length || 0), color: COLORS.primary },
            { label: 'Modules', value: String(session.modules?.length || 0), color: COLORS.secondary },
            { label: 'Statut', value: statut, color: '#16a34a' },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {sauvegardePlanning && (
        <div style={{ padding: '12px 16px', backgroundColor: '#e6f4f1', border: '2px solid #006B68', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          ✅ Planning mis à jour avec succès
        </div>
      )}

      {sauvegardePlanning && (
        <div style={{ padding: '12px 16px', backgroundColor: '#e6f4f1', border: '2px solid #006B68', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          ✅ Planning mis à jour avec succès
        </div>
      )}

      {/* 📅 Planning de la session */}
      <Card style={{ marginBottom: '24px', borderTop: `4px solid ${COLORS.secondary}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
              📅 Planning ({modeEditionPlanning ? planningBrouillon.length : (session.planning?.length || 0)} entrées)
            </h2>
            {modeEditionPlanning ? (
              <>
                <button onClick={sauvegarderPlanning} style={btnPrimary}>✅ Enregistrer le planning</button>
                <button onClick={annulerEdition} style={btnSecondary}>Annuler</button>
              </>
            ) : (
              <button onClick={entrerEdition} style={btnSecondary}>✏️ Modifier le planning</button>
            )}
          </div>
          {session.planning?.length > 0 && (() => {
            const stats: Record<string, number> = {};
            session.planning.forEach((p: any) => { stats[p.type] = (stats[p.type] || 0) + 1; });
            return (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(stats).map(([type, n]) => {
                  const couleurs: Record<string, { bg: string; col: string; emoji: string }> = {
                    cours: { bg: '#e6f4f1', col: '#006B68', emoji: '📚' },
                    revision: { bg: '#fef6e4', col: '#C8A23A', emoji: '📖' },
                    examen: { bg: '#fde8e8', col: '#e53e3e', emoji: '🎓' },
                  };
                  const c = couleurs[type] || { bg: '#f3f4f6', col: '#555', emoji: '📌' };
                  return <span key={type} style={{ backgroundColor: c.bg, color: c.col, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{c.emoji} {type} : {n}</span>;
                })}
              </div>
            );
          })()}
        </div>
        {session.planning?.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: COLORS.background, zIndex: 1 }}>
                <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                  {['#', 'Date', 'Type', 'Semaine'].map((col) => (
                    <th key={col} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...session.planning].sort((a: any, b: any) => {
                  const da = a.date.split('/').reverse().join('-');
                  const db = b.date.split('/').reverse().join('-');
                  return da.localeCompare(db);
                }).map((p: any, i: number) => {
                  const couleurs: Record<string, { bg: string; col: string; emoji: string }> = {
                    cours: { bg: '#e6f4f1', col: '#006B68', emoji: '📚' },
                    revision: { bg: '#fef6e4', col: '#C8A23A', emoji: '📖' },
                    examen: { bg: '#fde8e8', col: '#e53e3e', emoji: '🎓' },
                  };
                  const c = couleurs[p.type] || { bg: '#f3f4f6', col: '#555', emoji: '📌' };
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '8px 12px', fontSize: '12px', color: '#aaa' }}>{i + 1}</td>
                      <td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '600' }}>{p.date}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ backgroundColor: c.bg, color: c.col, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{c.emoji} {p.type}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: '12px', color: COLORS.textMuted }}>S{p.semaine}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px' }}>
            Aucune entrée dans le planning.
          </div>
        )}
      </Card>

      {/* Apprenants */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
            Apprenants inscrits ({apprenants.length})
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/apprenants" style={btnPrimary}>+ Ajouter un apprenant</a>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              {['#', 'Nom', 'Prénom', 'Entreprise', 'Statut', ''].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apprenants.length > 0 ? apprenants.map((a, i) => (
              <tr key={a.id || i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: '12px', fontSize: '13px', color: '#aaa' }}>{i + 1}</td>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700' }}>{a.nom}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: COLORS.textMuted }}>{a.prenom}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{a.entreprise || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: a.statut === 'Terminé' ? '#f3f4f6' : a.statut === 'Rupture' ? '#fde8e8' : '#e6f4f1', color: a.statut === 'Terminé' ? '#6b7280' : a.statut === 'Rupture' ? '#e53e3e' : '#006B68', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{a.statut || 'En cours'}</span>
                </td>
                <td style={{ padding: '12px' }}>
                  <a href={`/apprenants/${a.id}`} style={{ color: COLORS.primary, fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                    Voir →
                  </a>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px' }}>
                  Aucun apprenant inscrit dans cette session.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Actions rapides */}
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Actions rapides
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: '📋 Feuille d\'émargement', desc: 'Générer et télécharger', href: '/emargement', color: COLORS.primary },
            { label: '📄 Convention de formation', desc: 'Générer le PDF', href: '/documents/convention', color: COLORS.primary },
            { label: '📄 Certificat de réalisation', desc: 'Générer le PDF', href: '/documents/generation', color: COLORS.primary },
            { label: '📚 Livrets apprentissage', desc: 'Remplir dans Google Docs', href: '/documents/generation', color: '#4285F4' },
            { label: '📊 État de présence mensuel', desc: 'Générer pour les entreprises', href: '/emargement/mensuel', color: COLORS.secondary },
            { label: '🎓 Résultats Qualiopi', desc: 'Voir les indicateurs', href: '/qualiopi', color: COLORS.primary },
          ].map((action) => (
            <a key={action.label} href={action.href} style={{ backgroundColor: COLORS.background, borderRadius: '10px', padding: '16px', textDecoration: 'none', display: 'block', borderLeft: `4px solid ${action.color}` }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: action.color, marginBottom: '4px' }}>{action.label}</div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted }}>{action.desc}</div>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}