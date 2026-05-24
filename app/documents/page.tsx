'use client';

import { useState, useEffect, useMemo } from 'react';
import { COLORS } from '../../lib/constants';
import Card from '../../components/Card';
import { chargerApprentis, supprimerDocApprenant } from '../../data/apprentisSupabase';
import { chargerEntreprises, supprimerConventionApprenant } from '../../data/entreprisesSupabase';
import { chargerEntretiensApprenant } from '../../data/entretiensSupabase';
import { chargerApcs } from '../../data/apcsSupabase';
import { chargerInterventions } from '../../data/interventionsSupabase';

const FAMILLES = ['Tous', 'Apprenti', 'Entreprise', 'Pédagogique', 'Comptable'];

const STATUT_DOC: Record<string, { bg: string; color: string }> = {
  'Disponible':     { bg: '#e6f4f1', color: '#006B68' },
  'À importer':     { bg: '#fde8e8', color: '#e53e3e' },
  'Signé':          { bg: '#b8ddd9', color: '#004744' },
  'En attente':     { bg: '#fef6e4', color: '#C8A23A' },
};

const FAMILLE_STYLE: Record<string, { bg: string; color: string }> = {
  'Apprenti':    { bg: '#e6f4f1', color: '#006B68' },
  'Entreprise':  { bg: '#fef6e4', color: '#C8A23A' },
  'Pédagogique': { bg: '#f0f4ff', color: '#3a5bc7' },
  'Comptable':   { bg: '#fce7f3', color: '#9333ea' },
};

const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: COLORS.text, backgroundColor: 'white', width: '100%' };

interface DocRow {
  id: string;
  famille: string;
  type: string;
  concerne: string;
  apprenantId?: string;
  entrepriseId?: string;
  origine: string;
  statut: string;
  dateAjout: string;
  url?: string;
  source: string;
  sortieId?: string;
}

export default function Documents() {
  const [famille, setFamille] = useState('Tous');
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [chargement, setChargement] = useState(true);
  const [docs, setDocs] = useState<DocRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // Charger toutes les sources en parallèle
        const [apprenants, entreprises, apcs, interventions] = await Promise.all([
          chargerApprentis(),
          chargerEntreprises(),
          chargerApcs(),
          chargerInterventions(),
        ]);

        const rows: DocRow[] = [];

        // 1. PIÈCES JUSTIFICATIVES APPRENANTS
        apprenants.forEach((a: any) => {
          if (a.pieces) {
            Object.entries(a.pieces).forEach(([key, piece]: [string, any]) => {
              rows.push({
                id: `app_${a.id}_${key}`,
                famille: 'Apprenti',
                type: `Pièce : ${key.toUpperCase()}`,
                concerne: `${a.prenom || ''} ${a.nom || ''}`.trim(),
                apprenantId: a.id,
                origine: 'Importé',
                statut: 'Disponible',
                dateAjout: piece.dateUpload?.slice(0, 10) || '—',
                url: piece.url,
                source: 'apprenants.pieces',
              });
            });
          }
        });

        // 2. PIÈCES JUSTIFICATIVES ENTREPRISES
        entreprises.forEach((e: any) => {
          if (e.pieces) {
            Object.entries(e.pieces).forEach(([key, piece]: [string, any]) => {
              rows.push({
                id: `ent_${e.id}_${key}`,
                famille: 'Entreprise',
                type: `Pièce : ${key.replace(/_/g, ' ')}`,
                concerne: e.raisonSociale || '—',
                entrepriseId: e.id,
                origine: 'Importé',
                statut: 'Disponible',
                dateAjout: piece.dateUpload?.slice(0, 10) || '—',
                url: piece.url,
                source: 'entreprises.pieces',
              });
            });
          }
        });

        // 2bis. CONVENTIONS DE FORMATION (statut en_attente ou signée)
        entreprises.forEach((e: any) => {
          const finApps = (e as any).financementsApprenants || {};
          Object.entries(finApps).forEach(([apprenantId, fin]: [string, any]) => {
            const conv = fin?.convention;
            if (!conv || conv.statut === 'a_generer' || conv.archivee) return;
            const app = apprenants.find((a: any) => a.id === apprenantId);
            const nomApprenant = app ? `${app.prenom || ''} ${app.nom || ''}`.trim() : apprenantId;
            const statutLabel = conv.statut === 'signee' ? 'Signé' : 'En attente';
            const dateAjout = conv.statut === 'signee'
              ? (conv.dateSignature || '').slice(0, 10)
              : (conv.dateEnvoiEmail || conv.dateGeneration || '').slice(0, 10);
            rows.push({
              id: `conv_${e.id}_${apprenantId}`,
              famille: 'Entreprise',
              type: `Convention de formation`,
              concerne: `${nomApprenant} — ${e.raisonSociale || ''}`,
              apprenantId,
              entrepriseId: e.id,
              origine: 'Généré par EasyCFA',
              statut: statutLabel,
              dateAjout: dateAjout || '—',
              url: conv.fichierSigneUrl,
              source: 'conventions',
            });
          });
        });

        // 2ter. RUPTURES + DMF (sur apprenant)
        apprenants.forEach((a: any) => {
          // Rupture
          if (a.rupture && a.rupture.statut && a.rupture.statut !== 'a_generer' && !a.rupture.archive) {
            const conv = a.rupture;
            rows.push({
              id: `rupt_${a.id}`,
              famille: 'Apprenti',
              type: 'Formulaire de rupture',
              concerne: `${a.prenom || ''} ${a.nom || ''}`.trim(),
              apprenantId: a.id,
              origine: 'Généré par EasyCFA',
              statut: conv.statut === 'signee' ? 'Signé' : 'En attente',
              dateAjout: (conv.dateSignature || conv.dateEnvoiEmail || conv.dateGeneration || '').slice(0, 10),
              url: conv.fichierSigneUrl,
              source: 'rupture',
            });
          }
          // DMF
          if (a.dmf && a.dmf.statut && a.dmf.statut !== 'a_generer' && !a.dmf.archive) {
            const conv = a.dmf;
            rows.push({
              id: `dmf_${a.id}`,
              famille: 'Apprenti',
              type: 'DMF — Maintien en formation',
              concerne: `${a.prenom || ''} ${a.nom || ''}`.trim(),
              apprenantId: a.id,
              origine: 'Généré par EasyCFA',
              statut: conv.statut === 'signee' ? 'Signé' : 'En attente',
              dateAjout: (conv.dateSignature || conv.dateEnvoiEmail || conv.dateGeneration || '').slice(0, 10),
              url: conv.fichierSigneUrl,
              source: 'dmf',
            });
          }
          // Droit à l'image
          if (a.droitImage && a.droitImage.statut && a.droitImage.statut !== 'a_generer' && !a.droitImage.archive) {
            const conv = a.droitImage;
            rows.push({
              id: `droitimage_${a.id}`,
              famille: 'Apprenti',
              type: 'Droit à l\'image (RGPD)',
              concerne: `${a.prenom || ''} ${a.nom || ''}`.trim(),
              apprenantId: a.id,
              origine: 'Généré par EasyCFA',
              statut: conv.statut === 'signee' ? 'Signé' : 'En attente',
              dateAjout: (conv.dateSignature || conv.dateEnvoiEmail || conv.dateGeneration || '').slice(0, 10),
              url: conv.fichierSigneUrl,
              source: 'droitImage',
            });
          }
          // Sorties anticipées (liste)
          if (Array.isArray(a.sortiesAnticipees)) {
            a.sortiesAnticipees.forEach((s: any) => {
              if (s.archive) return;
              rows.push({
                id: `sortie_${a.id}_${s.id}`,
                famille: 'Apprenti',
                type: `Sortie anticipée — ${s.motifLabel || s.motifCle}`,
                concerne: `${a.prenom || ''} ${a.nom || ''}`.trim(),
                apprenantId: a.id,
                origine: 'Généré par EasyCFA',
                statut: s.statut === 'signee' ? 'Signé' : s.statut === 'en_attente' ? 'En attente' : 'À envoyer',
                dateAjout: (s.dateSignature || s.dateEnvoiEmail || s.dateCreation || '').slice(0, 10),
                url: s.fichierSigneUrl,
                source: 'sortieAnticipee',
                sortieId: s.id,
              });
            });
          }
        });

        // 3. ENTRETIENS — livrets signés (par apprenant)
        for (const a of apprenants) {
          try {
            const entretiens = await chargerEntretiensApprenant(a.id);
            entretiens.forEach((ent: any) => {
              const livret = ent.supportUtilise?.livretSigne;
              if (livret) {
                rows.push({
                  id: `entr_${ent.id}`,
                  famille: 'Pédagogique',
                  type: `Livret d'entretien signé (${ent.type})`,
                  concerne: `${a.prenom || ''} ${a.nom || ''}`.trim(),
                  apprenantId: a.id,
                  origine: 'Importé',
                  statut: 'Signé',
                  dateAjout: livret.dateImport?.slice(0, 10) || '—',
                  url: livret.url,
                  source: 'entretiens.livret',
                });
              }
            });
          } catch {}
        }

        // 4. APCs — décisions reçues + factures
        apcs.forEach((apc: any) => {
          if (apc.apcRecuUrl) {
            rows.push({
              id: `apc_${apc.id}_recu`,
              famille: 'Comptable',
              type: `Décision APC reçue`,
              concerne: `${apc.apprenantPrenom || ''} ${apc.apprenantNom || ''}`.trim() + ` — ${apc.formation || ''}`,
              apprenantId: apc.apprenantId,
              origine: 'Importé',
              statut: 'Disponible',
              dateAjout: apc.dateReception || '—',
              url: apc.apcRecuUrl,
              source: 'apcs.apcRecu',
            });
          }
          (apc.echeances || []).forEach((ech: any) => {
            if (ech.fichierFactureUrl) {
              rows.push({
                id: `apc_${apc.id}_fact_${ech.id}`,
                famille: 'Comptable',
                type: `Facture : ${ech.label || 'Échéance'}`,
                concerne: `${apc.apprenantPrenom || ''} ${apc.apprenantNom || ''}`.trim() + ` — ${apc.formation || ''}`,
                apprenantId: apc.apprenantId,
                origine: 'Importé',
                statut: ech.datePaiement ? 'Disponible' : 'En attente',
                dateAjout: ech.dateFacture || '—',
                url: ech.fichierFactureUrl,
                source: 'echeances.fichierFacture',
              });
            }
          });
        });

        // 5. FICHES D'INTERVENTION SIGNÉES
        interventions.forEach((fi: any) => {
          if (fi.dateSignature) {
            rows.push({
              id: `fi_${fi.id}`,
              famille: 'Pédagogique',
              type: `Fiche d'intervention pédagogique`,
              concerne: `${fi.formationLabel || ''} — ${fi.jour || ''} ${fi.date || ''} — ${fi.formateurNom || ''}`,
              origine: 'Généré par EasyCFA',
              statut: 'Signé',
              dateAjout: fi.dateSignature.slice(0, 10),
              source: 'interventions',
            });
          }
        });

        // Tri par date décroissante
        rows.sort((a, b) => (b.dateAjout || '').localeCompare(a.dateAjout || ''));

        setDocs(rows);
        console.log(`[Documents] ${rows.length} documents chargés depuis Supabase ✅`);
      } catch (e) {
        console.error('[Documents] Erreur chargement :', e);
      }
      setChargement(false);
    })();
  }, []);

  async function archiverDoc(doc: DocRow) {
    if (!confirm(`Archiver ce document ?\n\nConcerne : ${doc.concerne}\n\nIl disparaîtra du registre mais le PDF reste accessible sur la fiche source.`)) return;
    let res: { success: boolean; error?: string };
    if (doc.source === 'conventions' && doc.entrepriseId && doc.apprenantId) {
      res = await supprimerConventionApprenant(doc.entrepriseId, doc.apprenantId);
    } else if ((doc.source === 'rupture' || doc.source === 'dmf' || doc.source === 'droitImage') && doc.apprenantId) {
      res = await supprimerDocApprenant(doc.apprenantId, doc.source as 'rupture' | 'dmf' | 'droitImage');
    } else if (doc.source === 'sortieAnticipee' && doc.apprenantId && doc.sortieId) {
      const { supprimerSortieAnticipee } = await import('../../data/apprentisSupabase');
      res = await supprimerSortieAnticipee(doc.apprenantId, doc.sortieId);
    } else {
      alert('Type non archivable');
      return;
    }
    if (!res.success) { alert('Erreur : ' + (res.error || 'inconnue')); return; }
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  }

  const filtres = useMemo(() => docs.filter((d) => {
    const matchFamille = famille === 'Tous' || d.famille === famille;
    const matchStatut = filtreStatut === 'Tous' || d.statut === filtreStatut;
    const matchRecherche = recherche === '' ||
      d.type.toLowerCase().includes(recherche.toLowerCase()) ||
      d.concerne.toLowerCase().includes(recherche.toLowerCase());
    return matchFamille && matchStatut && matchRecherche;
  }), [docs, famille, filtreStatut, recherche]);

  const nbSignes = filtres.filter(d => d.statut === 'Signé').length;
  const nbGeneres = filtres.filter(d => d.origine === 'Généré par EasyCFA').length;

  if (chargement) {
    return <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>Chargement du registre documentaire...</div>;
  }

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
            Registre documentaire
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
            Tous les documents du CFA, agrégés depuis Supabase — Conforme Qualiopi
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href="/documents/apercu" style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
            📄 Générer AEF
          </a>
          <a href="/documents/convention" style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
            📄 Générer Convention
          </a>
          <a href="/documents/generation" style={{ backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
            📄 CR / DMF / Livrets
          </a>
          <a href="/documents/modeles" style={btnSecondary}>Voir les modèles</a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total documents', value: docs.length, color: COLORS.primary, bg: COLORS.background },
          { label: 'Apprentis', value: docs.filter(d => d.famille === 'Apprenti').length, color: '#006B68', bg: '#e6f4f1' },
          { label: 'Entreprises', value: docs.filter(d => d.famille === 'Entreprise').length, color: '#C8A23A', bg: '#fef6e4' },
          { label: 'Pédagogiques', value: docs.filter(d => d.famille === 'Pédagogique').length, color: '#3a5bc7', bg: '#f0f4ff' },
          { label: 'Comptables', value: docs.filter(d => d.famille === 'Comptable').length, color: '#9333ea', bg: '#fce7f3' },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres famille */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {FAMILLES.map((f) => (
          <button key={f} onClick={() => setFamille(f)} style={{
            backgroundColor: famille === f ? COLORS.primary : 'white',
            color: famille === f ? 'white' : COLORS.primary,
            border: `1.5px solid ${COLORS.primary}`,
            borderRadius: '20px', padding: '6px 18px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>
            {f === 'Tous' ? `Tous (${docs.length})` : `${f} (${docs.filter(d => d.famille === f).length})`}
          </button>
        ))}
      </div>

      {/* Filtres avancés */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
          <input style={inputStyle} placeholder="🔍 Rechercher type ou personne..."
            value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          <select style={inputStyle} value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
            <option value="Tous">Tous les statuts</option>
            {['Disponible', 'Signé', 'En attente', 'À importer'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '12px', color: COLORS.textMuted }}>
            {nbSignes} signés · {nbGeneres} générés par EasyCFA
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary }}>
            Documents ({filtres.length})
          </h2>
        </div>

        {filtres.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Aucun document dans cette catégorie</div>
            <div style={{ fontSize: '12px', marginTop: '8px', fontStyle: 'italic' }}>
              Importe des pièces justificatives depuis les fiches Apprenant ou Entreprise pour les voir ici.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
                  {['Famille', 'Type de document', 'Concerne', 'Origine', 'Statut', 'Date', 'Actions'].map((col) => (
                    <th key={col} style={{ textAlign: 'left', padding: '10px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtres.map((doc) => {
                  const ss = STATUT_DOC[doc.statut] ?? { bg: '#f0f0f0', color: '#888' };
                  const sf = FAMILLE_STYLE[doc.famille] ?? { bg: '#f0f0f0', color: '#888' };
                  return (
                    <tr key={doc.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '10px' }}>
                        <span style={{ backgroundColor: sf.bg, color: sf.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {doc.famille}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: '600' }}>{doc.type}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: COLORS.text }}>
                        {doc.apprenantId ? (
                          <a href={`/apprenants/${doc.apprenantId}`} style={{ color: COLORS.text, textDecoration: 'none', fontWeight: '600' }}>{doc.concerne}</a>
                        ) : doc.entrepriseId ? (
                          <a href={`/entreprises/${doc.entrepriseId}`} style={{ color: COLORS.text, textDecoration: 'none', fontWeight: '600' }}>{doc.concerne}</a>
                        ) : (
                          doc.concerne
                        )}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ backgroundColor: doc.origine === 'Généré par EasyCFA' ? '#e6f4f1' : '#f0f0f0', color: doc.origine === 'Généré par EasyCFA' ? '#006B68' : '#555', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600' }}>
                          {doc.origine === 'Généré par EasyCFA' ? '⚡ EasyCFA' : '📥 Importé'}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ backgroundColor: ss.bg, color: ss.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {doc.statut}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>{doc.dateAjout}</td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: COLORS.background, color: COLORS.primary, borderRadius: '5px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}>
                              🔍 Ouvrir
                            </a>
                          )}
                          {(doc.source === 'conventions' || doc.source === 'rupture' || doc.source === 'dmf' || doc.source === 'droitImage' || doc.source === 'sortieAnticipee') && (
                            <button
                              onClick={() => archiverDoc(doc)}
                              title="Marquer comme finalisé et retirer du registre"
                              style={{ backgroundColor: 'white', color: '#c00', border: '1px solid #c00', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                            >
                              🗂 Archiver
                            </button>
                          )}
                          {!doc.url && doc.source !== 'conventions' && doc.source !== 'rupture' && doc.source !== 'dmf' && doc.source !== 'droitImage' && doc.source !== 'sortieAnticipee' && (
                            <span style={{ color: '#aaa', fontSize: '11px', fontStyle: 'italic' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Règles documentaires */}
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: COLORS.background, borderRadius: '8px', borderLeft: `4px solid ${COLORS.primary}` }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '8px' }}>
            Règles documentaires EasyCFA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {[
              '🔒 Un document signé ne peut jamais être écrasé.',
              '📋 Toute correction crée automatiquement une nouvelle version.',
              '🗂 Le registre agrège automatiquement les pièces des dossiers.',
              '✅ Les documents peuvent servir de preuves Qualiopi.',
              '🔐 Les données sont stockées dans Supabase + Storage.',
              '🏷 Mention obligatoire : "Document généré avec EasyCFA — solution éditée par PAM GROUPE".',
            ].map((r, i) => (
              <div key={i} style={{ fontSize: '12px', color: COLORS.textMuted, padding: '4px 0' }}>{r}</div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}