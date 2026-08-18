'use client';

// components/SuiviQualiopi.tsx
// Suivi des 33 indicateurs du Référentiel National Qualité — données réelles.
//
// Remplace l'ancien onglet figé sur mockQualiopi. Chaque modification est
// enregistrée en base : rien ne disparaît au rechargement.
//
// Un audit archivé conserve ses constats ; l'audit suivant repart d'une grille
// vierge. Les indicateurs « non applicables » sont exclus du taux de conformité.

import { useEffect, useState } from 'react';
import Card from './Card';
import {
  chargerAudits,
  chargerIndicateurs,
  modifierIndicateur,
  modifierAudit,
  ouvrirNouvelAudit,
  rafraichirCompteurs,
  tauxConformite,
  LIBELLE_CRITERE,
  LIBELLE_STATUT_IND,
  type AuditQualiopi,
  type IndicateurQualiopi,
  type StatutIndicateur,
} from '../data/qualiopiSupabase';

const C = { primary: '#006B68', or: '#C8A23A', fond: '#EAF4F3', rouge: '#e53e3e', vert: '#16a34a' };

const btnP: React.CSSProperties = { backgroundColor: C.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '7px 13px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' };
const btnS: React.CSSProperties = { backgroundColor: 'white', color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: '8px', padding: '7px 13px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' };
const champ: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };

function dateFr(iso?: string | null): string {
  if (!iso) return '—';
  const p = iso.slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

function joursAvant(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const auj = new Date(); auj.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - auj.getTime()) / 86400000);
}

export default function SuiviQualiopi({ verifiePar = '' }: { verifiePar?: string }) {
  const [audits, setAudits] = useState<AuditQualiopi[]>([]);
  const [auditId, setAuditId] = useState<string>('');
  const [inds, setInds] = useState<IndicateurQualiopi[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState<string>('tous');
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [brouillon, setBrouillon] = useState<{ preuve: string; commentaire: string }>({ preuve: '', commentaire: '' });

  useEffect(() => {
    (async () => {
      const a = await chargerAudits();
      console.log(`[Qualiopi] ${a.length} audit(s) chargé(s) ✅`);
      setAudits(a);
      const courant = a.find(x => x.statut === 'en_cours') ?? a[0];
      if (courant?.id) setAuditId(courant.id);
      setChargement(false);
    })();
  }, []);

  useEffect(() => {
    if (!auditId) return;
    (async () => {
      const i = await chargerIndicateurs(auditId);
      console.log(`[Qualiopi] ${i.length} indicateur(s) pour ${auditId} ✅`);
      setInds(i);
    })();
  }, [auditId]);

  const audit = audits.find(a => a.id === auditId);
  const { taux, base } = tauxConformite(inds);
  const nbConformes = inds.filter(i => i.statut === 'conforme').length;
  const nbAVerifier = inds.filter(i => i.statut === 'a_verifier').length;
  const nbNonConformes = inds.filter(i => i.statut === 'non_conforme').length;
  const nbSansPreuve = inds.filter(i => !(i.elementsPreuve ?? '').trim() && i.statut !== 'non_applicable').length;

  const visibles = inds.filter(i => filtre === 'tous' || i.statut === filtre);

  async function majIndicateur(id: string, mods: Partial<IndicateurQualiopi>) {
    setEnCours(true);
    const r = await modifierIndicateur(id, mods);
    setEnCours(false);
    if (!r.success) { setMessage('❌ ' + r.error); return; }
    setInds(prev => prev.map(i => i.id === id ? { ...i, ...mods } : i));
    await rafraichirCompteurs(auditId);
  }

  async function validerAudit() {
    if (nbAVerifier > 0 && !confirm(`${nbAVerifier} indicateur(s) restent « à vérifier ». Valider quand même ?`)) return;
    setEnCours(true);
    const r = await modifierAudit(auditId, { statut: 'valide' });
    setEnCours(false);
    if (!r.success) { setMessage('❌ ' + r.error); return; }
    setMessage('✅ Audit validé.');
    setAudits(prev => prev.map(a => a.id === auditId ? { ...a, statut: 'valide' } : a));
  }

  async function archiverAudit() {
    if (!confirm('Archiver cet audit ? Ses constats seront conservés en lecture seule.')) return;
    setEnCours(true);
    const r = await modifierAudit(auditId, { statut: 'archive' });
    setEnCours(false);
    if (!r.success) { setMessage('❌ ' + r.error); return; }
    setMessage('✅ Audit archivé.');
    setAudits(prev => prev.map(a => a.id === auditId ? { ...a, statut: 'archive' } : a));
  }

  async function nouvelAudit() {
    const libelle = prompt('Libellé du nouvel audit :', `Audit de surveillance ${new Date().getFullYear() + 1}`);
    if (!libelle) return;
    const debut = prompt('Début de la période (AAAA-MM-JJ) :', '');
    const fin = prompt('Fin de la période (AAAA-MM-JJ) :', '');
    setEnCours(true);
    const id = `AUDIT_${Date.now()}`;
    const r = await ouvrirNouvelAudit({
      id, libelle,
      typeAudit: 'surveillance',
      certificateur: audit?.certificateur,
      numeroCertificat: audit?.numeroCertificat,
      datePeriodeDebut: debut || null,
      datePeriodeFin: fin || null,
      statut: 'en_cours',
    }, auditId);
    setEnCours(false);
    if (!r.success) { setMessage('❌ ' + r.error); return; }
    setMessage('✅ Nouvel audit ouvert : les 33 indicateurs sont à vérifier.');
    const a = await chargerAudits();
    setAudits(a);
    setAuditId(id);
  }

  if (chargement) {
    return <Card><div style={{ textAlign: 'center', color: C.primary, fontWeight: 600, padding: '20px' }}>⏳ Chargement…</div></Card>;
  }

  if (audits.length === 0) {
    return <Card><div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>Aucun audit enregistré.</div></Card>;
  }

  const jrsFin = joursAvant(audit?.datePeriodeFin);
  const lectureSeule = audit?.statut === 'archive';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {message && (
        <div style={{ backgroundColor: message.startsWith('❌') ? '#fde8e8' : '#e6f4f1', border: `1px solid ${message.startsWith('❌') ? C.rouge : C.primary}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px' }}>
          {message}
          <button onClick={() => setMessage(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Sélecteur d'audit */}
      <Card>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '3px' }}>Audit</label>
            <select style={champ} value={auditId} onChange={e => { setAuditId(e.target.value); setOuvert(null); }}>
              {audits.map(a => (
                <option key={a.id} value={a.id}>
                  {a.libelle} — {a.statut === 'archive' ? 'archivé' : a.statut === 'valide' ? 'validé' : 'en cours'}
                </option>
              ))}
            </select>
          </div>
          <button onClick={nouvelAudit} disabled={enCours} style={btnS}>+ Ouvrir un nouvel audit</button>
          {audit?.statut === 'en_cours' && <button onClick={validerAudit} disabled={enCours} style={btnP}>✅ Valider l&apos;audit</button>}
          {audit?.statut === 'valide' && <button onClick={archiverAudit} disabled={enCours} style={btnS}>📦 Archiver</button>}
        </div>
      </Card>

      {/* Bandeau certification */}
      <div style={{ backgroundColor: C.primary, borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '3px' }}>
            {audit?.libelle}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
            {audit?.certificateur} — certificat n° {audit?.numeroCertificat ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
            {audit?.dateDebut
              ? <>Réalisé du {dateFr(audit.dateDebut)} au {dateFr(audit.dateFin)}</>
              : <>Période : {dateFr(audit?.datePeriodeDebut)} → {dateFr(audit?.datePeriodeFin)}</>}
          </div>
          {jrsFin !== null && audit?.statut === 'en_cours' && (
            <div style={{ fontSize: '12px', color: jrsFin <= 180 ? '#ffd9d9' : C.or, marginTop: '4px', fontWeight: 600 }}>
              {jrsFin > 0 ? `⏳ ${jrsFin} jour(s) avant la fin de la période` : '⚠️ Période dépassée'}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '40px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{taux === null ? '—' : taux + ' %'}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>
            {nbConformes}/{base} indicateurs conformes
          </div>
        </div>
      </div>

      {/* Chiffres clés */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {[
          { l: 'Conformes', v: nbConformes, c: C.primary },
          { l: 'À vérifier', v: nbAVerifier, c: C.or },
          { l: 'Non conformes', v: nbNonConformes, c: C.rouge },
          { l: 'Sans élément de preuve', v: nbSansPreuve, c: nbSansPreuve > 0 ? C.or : '#888' },
        ].map(s => (
          <div key={s.l} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '13px', borderTop: `4px solid ${s.c}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Avancement par critère */}
      <Card>
        <div style={{ fontSize: '13px', fontWeight: 800, color: C.primary, marginBottom: '10px' }}>Avancement par critère</div>
        {[1, 2, 3, 4, 5, 6, 7].map(cr => {
          const l = inds.filter(i => i.critere === cr);
          const applicables = l.filter(i => i.statut !== 'non_applicable');
          const ok = l.filter(i => i.statut === 'conforme').length;
          const t = applicables.length > 0 ? Math.round((ok / applicables.length) * 100) : 0;
          return (
            <div key={cr} style={{ marginBottom: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>Critère {cr} — {LIBELLE_CRITERE[cr]}</span>
                <span style={{ fontSize: '11px', color: '#888' }}>{ok}/{applicables.length}</span>
              </div>
              <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', height: '7px' }}>
                <div style={{ width: `${t}%`, backgroundColor: t === 100 ? C.primary : t >= 70 ? C.or : C.rouge, borderRadius: '4px', height: '7px' }} />
              </div>
            </div>
          );
        })}
      </Card>

      {/* Liste des indicateurs */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: C.primary }}>
            Indicateurs ({visibles.length}/{inds.length})
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {[
              { k: 'tous', l: 'Tous' },
              { k: 'conforme', l: '✅ Conformes' },
              { k: 'a_verifier', l: '⏳ À vérifier' },
              { k: 'non_conforme', l: '❌ Non conformes' },
              { k: 'non_applicable', l: '⬜ N/A' },
            ].map(f => (
              <button key={f.k} onClick={() => setFiltre(f.k)} style={{
                backgroundColor: filtre === f.k ? C.primary : C.fond,
                color: filtre === f.k ? 'white' : C.primary,
                border: 'none', borderRadius: '6px', padding: '4px 10px',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              }}>{f.l}</button>
            ))}
          </div>
        </div>

        {lectureSeule && (
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '8px 11px', fontSize: '11px', color: '#666', marginBottom: '10px', fontStyle: 'italic' }}>
            📦 Audit archivé — consultation seule. Ouvrez un nouvel audit pour saisir de nouveaux constats.
          </div>
        )}

        {visibles.map(i => {
          const st = LIBELLE_STATUT_IND[(i.statut ?? 'a_verifier') as StatutIndicateur];
          const estOuvert = ouvert === i.id;
          return (
            <div key={i.id} style={{ border: `1px solid ${estOuvert ? C.primary : '#e8e8e8'}`, borderRadius: '9px', padding: '9px 11px', marginBottom: '6px', backgroundColor: estOuvert ? C.fond : 'white' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '9px', cursor: 'pointer', flexWrap: 'wrap' }}
                onClick={() => { setOuvert(estOuvert ? null : i.id); setBrouillon({ preuve: i.elementsPreuve ?? '', commentaire: i.commentaire ?? '' }); }}
              >
                <div style={{ flex: '1 1 280px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: C.primary, marginRight: '7px' }}>Ind. {i.numero}</span>
                  <span style={{ fontSize: '12px', color: '#333' }}>{i.libelle}</span>
                  <span style={{ fontSize: '10px', color: '#999', marginLeft: '7px' }}>· critère {i.critere}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  {!(i.elementsPreuve ?? '').trim() && i.statut !== 'non_applicable' && (
                    <span style={{ fontSize: '10px', color: C.or, fontWeight: 700 }}>⚠️ sans preuve</span>
                  )}
                  <span style={{ backgroundColor: st.bg, color: st.couleur, padding: '2px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {st.texte}
                  </span>
                </div>
              </div>

              {estOuvert && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #d0e8e6' }}>
                  {!lectureSeule && (
                    <div style={{ display: 'flex', gap: '7px', marginBottom: '9px', flexWrap: 'wrap' }}>
                      {(['conforme', 'a_verifier', 'non_conforme', 'non_applicable'] as StatutIndicateur[]).map(s => (
                        <button key={s} onClick={() => majIndicateur(i.id, { statut: s, dateVerification: new Date().toISOString().slice(0, 10), verifiePar })}
                          style={{
                            backgroundColor: i.statut === s ? LIBELLE_STATUT_IND[s].couleur : 'white',
                            color: i.statut === s ? 'white' : LIBELLE_STATUT_IND[s].couleur,
                            border: `1.5px solid ${LIBELLE_STATUT_IND[s].couleur}`,
                            borderRadius: '7px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          }}>
                          {LIBELLE_STATUT_IND[s].texte}
                        </button>
                      ))}
                    </div>
                  )}

                  <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                    Éléments de preuve consultés
                  </label>
                  <textarea rows={4} readOnly={lectureSeule} value={estOuvert ? brouillon.preuve : (i.elementsPreuve ?? '')}
                    onChange={e => setBrouillon(p => ({ ...p, preuve: e.target.value }))}
                    placeholder="Documents, liens, échantillons vus lors de la vérification…"
                    style={{ ...champ, fontFamily: 'inherit', resize: 'vertical', backgroundColor: lectureSeule ? '#fafafa' : 'white' }} />

                  <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', margin: '8px 0 3px' }}>
                    Commentaire interne
                  </label>
                  <textarea rows={2} readOnly={lectureSeule} value={estOuvert ? brouillon.commentaire : (i.commentaire ?? '')}
                    onChange={e => setBrouillon(p => ({ ...p, commentaire: e.target.value }))}
                    placeholder="Ce qui reste à faire, points de vigilance…"
                    style={{ ...champ, fontFamily: 'inherit', resize: 'vertical', backgroundColor: lectureSeule ? '#fafafa' : 'white' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', color: '#888' }}>
                      {i.dateVerification ? `Vérifié le ${dateFr(i.dateVerification)}${i.verifiePar ? ' par ' + i.verifiePar : ''}` : 'Jamais vérifié'}
                    </span>
                    {!lectureSeule && (
                      <button onClick={() => majIndicateur(i.id, { elementsPreuve: brouillon.preuve, commentaire: brouillon.commentaire })} disabled={enCours} style={btnP}>
                        💾 Enregistrer
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
