'use client';

import { useState, useEffect, useRef } from 'react';
import { ENTREPRISES_REELS } from '../../data/mockEntreprises_reels';
import { COLORS } from '../../lib/constants';
import { chargerEntreprises as chargerEntreprisesSupabase } from '../../data/entreprisesSupabase';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: COLORS.text, backgroundColor: 'white' };

/**
 * ✅ Charge toutes les entreprises en fusionnant 3 sources :
 *   1. ENTREPRISES_REELS (mock — les 47 d'origine)
 *   2. easycfa_entreprises_v2 (liste persistée — contient les nouvelles)
 *   3. entreprise_<id> (fiches modifiées individuellement)
 *
 * Et exclut les entreprises supprimées (marquées dans easycfa_entreprises_supprimees).
 */
function chargerEntreprisesMerges(): any[] {
  if (typeof window === 'undefined') return ENTREPRISES_REELS as any[];

  // Liste des IDs supprimés (pour ne plus les afficher)
  let supprimees: string[] = [];
  try {
    supprimees = JSON.parse(localStorage.getItem('easycfa_entreprises_supprimees') || '[]');
  } catch {}

  // Liste persistée (nouvelles entreprises créées)
  let listePersistee: any[] = [];
  try {
    const raw = localStorage.getItem('easycfa_entreprises_v2');
    if (raw) listePersistee = JSON.parse(raw);
  } catch {}

  // Construction de la liste de base : mock + nouvelles
  const idsExistants = new Set();
  const liste: any[] = [];

  // 1. Ajouter d'abord les entreprises du mock (sauf supprimées)
  (ENTREPRISES_REELS as any[]).forEach(e => {
    if (!supprimees.includes(e.id)) {
      liste.push(e);
      idsExistants.add(e.id);
    }
  });

  // 2. Ajouter les nouvelles entreprises persistées (sauf doublons et supprimées)
  listePersistee.forEach(e => {
    if (!supprimees.includes(e.id) && !idsExistants.has(e.id)) {
      liste.push(e);
      idsExistants.add(e.id);
    }
  });

  // 3. Fusionner avec les modifications individuelles
  return liste.map(e => {
    try {
      const fiche = localStorage.getItem(`entreprise_${e.id}`);
      if (fiche) return { ...e, ...JSON.parse(fiche) };
    } catch {}
    return e;
  });
}

export default function Entreprises() {
  const [entreprises, setEntreprises] = useState<any[]>(ENTREPRISES_REELS as any[]);
  const [alertesContactes, setAlertesContacts] = useState<string[]>([]);
  const [afficherAlertes, setAfficherAlertes] = useState(false);
  const [importOk, setImportOk] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [rechercheTuteur, setRechercheTuteur] = useState('');
  const [filtreOpco, setFiltreOpco] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ✅ Charge depuis Supabase d'abord, fallback localStorage
  useEffect(() => {
    (async () => {
      try {
        const fromSupabase = await chargerEntreprisesSupabase();
        if (fromSupabase.length > 0) {
          console.log(`[Entreprises] ${fromSupabase.length} entreprises chargées depuis Supabase ✅`);
          setEntreprises(fromSupabase as any[]);
          return;
        }
        console.warn('[Entreprises] Supabase vide, fallback localStorage');
      } catch (e) {
        console.error('[Entreprises] Erreur Supabase, fallback localStorage', e);
      }
      setEntreprises(chargerEntreprisesMerges());
    })();
  }, []);

  function exporter() {
    const headers = ['Raison sociale', 'SIRET', 'Code APE', 'Adresse', 'Ville', 'Email', 'Téléphone', 'IDCC', 'OPCO', 'Tuteur Nom', 'Tuteur Prénom', 'Tuteur Email', 'Tuteur Téléphone'];
    const rows = entreprises.map(e => [
      e.raisonSociale, e.siret, e.codeApe, e.adresse, e.ville, e.email, e.telephone,
      e.idcc, e.opco, e.tuteurNom, e.tuteurPrenom, e.tuteurEmail, e.tuteurTelephone,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Entreprises_PAM_OI_' + new Date().toLocaleDateString('fr-FR').replace(/\//g, '-') + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function controlerContacts() {
    const alertes: string[] = [];
    entreprises.forEach(e => {
      if (!e.tuteurEmail) alertes.push(`⚠️ ${e.raisonSociale} — Email tuteur manquant`);
      if (!e.tuteurTelephone) alertes.push(`⚠️ ${e.raisonSociale} — Téléphone tuteur manquant`);
      if (!e.idcc || e.idcc === '9999') alertes.push(`⚠️ ${e.raisonSociale} — IDCC à vérifier (${e.idcc})`);
      if (!e.opco) alertes.push(`⚠️ ${e.raisonSociale} — OPCO manquant`);
      if (!e.facturationEmail) alertes.push(`⚠️ ${e.raisonSociale} — Email facturation manquant`);
    });
    setAlertesContacts(alertes);
    setAfficherAlertes(true);
  }

  return (
    <div>
      {importOk && (
        <div style={{ padding: '12px 16px', backgroundColor: '#e6f4f1', border: '2px solid #006B68', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          ✅ Fichier importé — Pour intégrer les nouvelles données, envoyez le fichier à l'administrateur EasyCFA.
        </div>
      )}

      {afficherAlertes && (
        <Card style={{ marginBottom: '16px', border: '2px solid #C8A23A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.secondary }}>🔍 Contrôle des contacts — {alertesContactes.length} anomalie(s)</h2>
            <button onClick={() => setAfficherAlertes(false)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>✕ Fermer</button>
          </div>
          {alertesContactes.length === 0 ? (
            <div style={{ color: COLORS.primary, fontWeight: '600', fontSize: '14px' }}>✅ Tous les contacts sont complets !</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
              {alertesContactes.map((a, i) => (
                <div key={i} style={{ padding: '8px 12px', backgroundColor: '#fffbf0', borderRadius: '6px', fontSize: '13px', color: '#7a5c00', borderLeft: '3px solid #C8A23A' }}>{a}</div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>Entreprises</h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Suivez les entreprises d'accueil, tuteurs, apprentis rattachés et documents associés.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href="/entreprises/nouvelle" style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
            + Ajouter une entreprise
          </a>
          <label style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }}>
            📥 Importer entreprises
            <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={() => { setImportOk(true); setTimeout(() => setImportOk(false), 3000); }} />
          </label>
          <button onClick={exporter} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            📤 Exporter CSV
          </button>
          <button onClick={controlerContacts} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            🔍 Contrôler les contacts
          </button>
        </div>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher entreprise, ville..."
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input
              value={rechercheTuteur}
              onChange={e => setRechercheTuteur(e.target.value)}
              placeholder="Rechercher tuteur..."
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
          </div>
          <select value={filtreOpco} onChange={e => setFiltreOpco(e.target.value)} style={inputStyle}>
            <option value="">Tous les OPCO</option>
            {[...new Set(entreprises.map(e => e.opco).filter(Boolean))].sort().map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {(recherche || rechercheTuteur || filtreOpco) && (
            <button onClick={() => { setRecherche(''); setRechercheTuteur(''); setFiltreOpco(''); }} style={{ backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', padding: '9px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total entreprises', value: entreprises.length, color: COLORS.primary },
          { label: 'OPCO différents', value: new Set(entreprises.map(e => e.opco).filter(Boolean)).size, color: COLORS.secondary },
        ].map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Liste des entreprises ({entreprises.length})
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                {['Entreprise', 'SIRET', 'Tuteur principal', 'Email', 'Téléphone', 'OPCO', 'IDCC', 'Statut', 'Actions'].map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entreprises.filter(e => {
                const matchRecherche = !recherche || (e.raisonSociale ?? '').toLowerCase().includes(recherche.toLowerCase()) || (e.ville ?? '').toLowerCase().includes(recherche.toLowerCase()) || (e.siret ?? '').includes(recherche);
                const matchTuteur = !rechercheTuteur || ((e.tuteurNom ?? '') + ' ' + (e.tuteurPrenom ?? '')).toLowerCase().includes(rechercheTuteur.toLowerCase());
                const matchOpco = !filtreOpco || e.opco === filtreOpco;
                return matchRecherche && matchTuteur && matchOpco;
              }).map((e) => {
                return (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '10px', fontSize: '14px', fontWeight: '700' }}>{e.raisonSociale}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{e.siret}</td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>{e.tuteurNom} {e.tuteurPrenom}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{e.email}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{e.telephone}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{e.opco}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{e.idcc}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Active</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <a href={`/entreprises/${e.id}`} style={{ backgroundColor: COLORS.background, color: COLORS.primary, border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' }}>Voir →</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
