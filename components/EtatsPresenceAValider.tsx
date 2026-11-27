'use client';

// components/EtatsPresenceAValider.tsx
// Registre des états de présence du mois :
//  - générés automatiquement le soir du dernier jour de formation (statut « À signer »)
//  - l'équipe les envoie sur sign.plus, puis importe ici les PDF signés (plusieurs d'un coup)
//  - EasyCFA les range dans ASSIDUITE et met le X cliquable dans le tableau (statut « Signé »)

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/constants';
import Card from './Card';

// Signataire PAM OI des états de présence (visa du CFA)
const SIGNATAIRE_CFA = { nom: 'Gaëlle MAILLOT', email: 'pamelamaillot@pamoi.re' };

type Signataire = { role: string; nom: string; email: string; source?: string };

type Etat = {
  id: string; apprenantId: string; annee: number; mois: number; sessionNumero: string | null;
  entreprise: string | null; heuresPrevues: number; heuresRealisees: number; tauxPresence: number;
  seancesNonSaisies: number; nomFichier: string | null; brouillonUrl: string | null;
  driveUrl: string | null; lienSheets: boolean; statut: 'a_signer' | 'signe' | 'erreur';
  erreur: string | null; dateImportSigne: string | null;
};

const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase' };
const td: React.CSSProperties = { padding: '10px', fontSize: 12, verticalAlign: 'top' };
const bouton = (couleur: string): React.CSSProperties => ({ backgroundColor: couleur, color: 'white', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' });

const cle = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\.pdf$/i, '').toUpperCase().replace(/[^A-Z0-9]/g, '');

function enBase64(f: File): Promise<string> {
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onloadend = () => ok(String(r.result).split(',')[1] || '');
    r.onerror = ko;
    r.readAsDataURL(f);
  });
}

async function appelApi(corps: object) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch('/api/etats-presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
    body: JSON.stringify(corps),
  });
  try { return await res.json(); }
  catch { return { success: false, error: 'Délai dépassé — relancez le même bouton : EasyCFA reprendra là où il s’est arrêté.' }; }
}

export default function EtatsPresenceAValider({ annee, mois, apprenantId, sessionNumero }: { annee: number; mois: number; apprenantId?: string; sessionNumero?: string }) {
  const [etats, setEtats] = useState<Etat[]>([]);
  const [noms, setNoms] = useState<Record<string, string>>({});
  const [signataires, setSignataires] = useState<Record<string, Signataire[]>>({});
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [copie, setCopie] = useState('');
  const [occupe, setOccupe] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [liens, setLiens] = useState<Record<string, string>>({});
  const champImportLot = useRef<HTMLInputElement>(null);
  const champImportUn = useRef<HTMLInputElement>(null);
  const [cibleImport, setCibleImport] = useState<string | null>(null);

  async function charger() {
    const { data } = await supabase.from('etats_presence').select('*').eq('annee', annee).eq('mois', mois);
    const liste = (data || []) as Etat[];
    setEtats(liste);
    if (liste.length) {
      const { data: a } = await supabase.from('apprenants')
        .select('id,nom,prenom,email,entreprise,"tuteurNom","tuteurPrenom","tuteurEmail"')
        .in('id', liste.map(e => e.apprenantId));
      setNoms(Object.fromEntries((a || []).map((x: any) => [x.id, `${x.prenom} ${x.nom}`])));
      // Signataires : apprenant (fiche), tuteur (fiche, sinon fiche entreprise), PAM OI
      const { data: ents } = await supabase.from('entreprises')
        .select('"raisonSociale",email,"rhEmail","tuteurNom","tuteurPrenom","tuteurEmail","dirigeantNom","dirigeantPrenom","dirigeantEmail"');
      const norm = (t: string) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const carte: Record<string, Signataire[]> = {};
      (a || []).forEach((x: any) => {
        const ent: any = (ents || []).find((en: any) => norm(en.raisonSociale) === norm(x.entreprise));
        let tuteur: Signataire = { role: 'Tuteur entreprise', nom: [x.tuteurPrenom, x.tuteurNom].filter(Boolean).join(' '), email: x.tuteurEmail || '', source: 'fiche apprenant' };
        if (!tuteur.email && ent?.tuteurEmail) tuteur = { role: 'Tuteur entreprise', nom: [ent.tuteurPrenom, ent.tuteurNom].filter(Boolean).join(' ') || tuteur.nom, email: ent.tuteurEmail, source: 'fiche entreprise (tuteur)' };
        if (!tuteur.email && ent) {
          const repli = ent.dirigeantEmail || ent.email || ent.rhEmail || '';
          if (repli) tuteur = { role: 'Tuteur entreprise', nom: tuteur.nom || [ent.dirigeantPrenom, ent.dirigeantNom].filter(Boolean).join(' '), email: repli, source: 'adresse de l’entreprise — à vérifier' };
        }
        carte[x.id] = [
          { role: 'Apprenant', nom: `${x.prenom} ${x.nom}`, email: x.email || '', source: 'fiche apprenant' },
          tuteur,
          { role: 'PAM OI', nom: SIGNATAIRE_CFA.nom, email: SIGNATAIRE_CFA.email },
        ];
      });
      setSignataires(carte);
    }
  }
  useEffect(() => { charger(); }, [annee, mois]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtre d'affichage (fiche apprenant / session choisie) ; l'import en lot reste sur tout le mois
  const visibles = useMemo(() => etats.filter(e =>
    (!apprenantId || e.apprenantId === apprenantId) && (!sessionNumero || e.sessionNumero === sessionNumero)
  ), [etats, apprenantId, sessionNumero]);
  const triees = useMemo(() => [...visibles].sort((a, b) => (noms[a.apprenantId] || '').localeCompare(noms[b.apprenantId] || '')), [visibles, noms]);
  const nbSignes = visibles.filter(e => e.statut === 'signe').length;

  async function importer(fichiers: File[], idImpose?: string) {
    setOccupe('import');
    const bilan: string[] = [];
    let ok = 0;
    for (const f of fichiers) {
      const etat = idImpose
        ? etats.find(e => e.id === idImpose)
        : etats.find(e => e.nomFichier && cle(f.name).includes(cle(e.nomFichier)));
      if (!etat) { bilan.push(`${f.name} : aucun état correspondant (nom de fichier modifié ?)`); continue; }
      const r = await appelApi({ action: 'importer', id: etat.id, pdfBase64: await enBase64(f) });
      if (r.success) { ok++; if (r.detail) bilan.push(`${noms[etat.apprenantId] || etat.id} : ${r.detail}`); }
      else bilan.push(`${noms[etat.apprenantId] || etat.id} : ${r.detail || r.error || 'erreur'}`);
    }
    setOccupe(null);
    setMessage(`✅ ${ok}/${fichiers.length} PDF signé(s) rangé(s) dans Drive${bilan.length ? ' — ' + bilan.join(' · ') : ''}`);
    charger();
  }

  async function genererMois() {
    if (!confirm('Générer les états de présence de ce mois pour les sessions dont le dernier jour de formation est passé ?\n(Les états déjà signés ne sont pas touchés.)')) return;
    setOccupe('mois');
    const r = await appelApi({ action: 'generer_mois', annee, mois });
    setOccupe(null);
    setMessage(r.success
      ? `✅ ${r.bilan?.ok || 0} état(s) générés${r.bilan?.erreur ? `, ${r.bilan.erreur} en erreur` : ''}${r.bilan?.deja_signe ? `, ${r.bilan.deja_signe} déjà signés` : ''}${r.bilan?.existant ? `, ${r.bilan.existant} déjà générés` : ''}`
      : `⚠️ ${r.error || 'Erreur'}`);
    charger();
  }

  async function recupererSignes() {
    setOccupe('signes');
    const r = await appelApi({ action: 'recuperer_signes', annee, mois });
    setOccupe(null);
    setMessage(r.importes
      ? `✅ ${r.importes.length} PDF signé(s) récupéré(s) dans Drive et rangé(s)${r.erreurs?.length ? ` — ${r.erreurs.length} en erreur : ${r.erreurs.join(' · ')}` : ''}`
      : `⚠️ ${r.error || 'Erreur'}`);
    charger();
  }

  const boutonMois = (
    <button style={{ ...bouton('#888'), padding: '9px 14px', fontSize: 13 }} disabled={occupe === 'mois'} onClick={genererMois}
      title="Rattrapage : génère les états manquants (sessions dont le dernier jour du mois est passé)">
      {occupe === 'mois' ? '⏳ Génération… (1 à 2 min)' : '⚙️ Générer / compléter le mois'}
    </button>
  );

  async function regenerer(id: string) {
    if (!confirm('Recalculer cet état depuis les émargements ? Le PDF à signer sera remplacé.')) return;
    setOccupe(id);
    const r = await appelApi({ action: 'regenerer', id });
    setOccupe(null);
    setMessage(r.success ? '✅ État régénéré — pensez à renvoyer la nouvelle version sur sign.plus' : `⚠️ ${r.resultat?.detail || r.error || 'Erreur'}`);
    charger();
  }

  async function enregistrerDossier(e: Etat) {
    if (!liens[e.id]) return;
    setOccupe(e.id);
    const r = await appelApi({ action: 'dossier', apprenantId: e.apprenantId, lien: liens[e.id] });
    setOccupe(null);
    setMessage(r.success ? '✅ Dossier ASSIDUITE enregistré' : `⚠️ ${r.error}`);
    charger();
  }

  if (visibles.length === 0) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>
            🤖 Aucun état de présence généré pour ce mois. Ils apparaissent ici le soir du dernier jour de formation de chaque session.
          </div>
          {boutonMois}
        </div>
        {message && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: COLORS.primary }}>{message}</div>}
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: COLORS.primary, margin: 0 }}>
            🤖 États de présence — {nbSignes}/{visibles.length} signés et rangés
          </h2>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
            1. Envoyez les PDF « à signer » sur sign.plus · 2. Importez ici les PDF signés : rangement Drive et lien dans le tableau automatiques.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {boutonMois}
          <button style={{ ...bouton(COLORS.primary), padding: '9px 14px', fontSize: 13 }} disabled={occupe === 'signes'} onClick={recupererSignes}
            title="Cherche dans Drive les PDF signés avec la signature électronique Google (fait aussi chaque soir automatiquement)">
            {occupe === 'signes' ? '⏳ Recherche…' : '📥 Récupérer les signés Google'}
          </button>
          <button style={{ ...bouton('#C8A23A'), padding: '9px 14px', fontSize: 13 }} disabled={occupe === 'import'} onClick={() => champImportLot.current?.click()}>
            {occupe === 'import' ? '⏳ Import…' : '📤 Importer les PDF signés'}
          </button>
        </div>
        <input ref={champImportLot} type="file" accept="application/pdf" multiple style={{ display: 'none' }}
          onChange={ev => { const f = Array.from(ev.target.files || []); ev.target.value = ''; if (f.length) importer(f); }} />
        <input ref={champImportUn} type="file" accept="application/pdf" style={{ display: 'none' }}
          onChange={ev => { const f = Array.from(ev.target.files || []); ev.target.value = ''; if (f.length && cibleImport) importer(f, cibleImport); }} />
      </div>

      {message && <div style={{ padding: '10px 12px', backgroundColor: '#e6f4f1', borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600, color: COLORS.primary }}>{message}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>{['Apprenant', 'Entreprise', 'Heures', 'Présence', 'À signer', 'Signé (Drive)', 'Tableau', 'Statut', ''].map((c, i) => <th key={i} style={th}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {triees.map(e => (
              <Fragment key={e.id}>
              <tr style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td style={{ ...td, fontWeight: 700 }}>
                  <a href={`/apprenants/${e.apprenantId}`} style={{ color: COLORS.text, textDecoration: 'none' }}>{noms[e.apprenantId] || e.apprenantId}</a>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 400 }}>{e.sessionNumero}</div>
                </td>
                <td style={td}>{e.entreprise || '—'}</td>
                <td style={td}>{e.heuresRealisees}h / {e.heuresPrevues}h</td>
                <td style={td}>
                  <strong style={{ color: e.tauxPresence >= 90 ? '#006B68' : e.tauxPresence >= 75 ? '#C8A23A' : '#e53e3e' }}>{e.tauxPresence}%</strong>
                  {e.seancesNonSaisies > 0 && <div style={{ fontSize: 11, color: '#C8A23A' }}>⚠ {e.seancesNonSaisies} demi-journée(s) non saisie(s)</div>}
                </td>
                <td style={td}>{e.brouillonUrl ? <a href={e.brouillonUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.primary, fontWeight: 600 }}>📄 PDF</a> : '—'}</td>
                <td style={td}>{e.driveUrl ? <a href={e.driveUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.primary, fontWeight: 600 }}>✍️ Ouvrir</a> : '—'}</td>
                <td style={td}>{e.statut === 'signe' ? (e.lienSheets ? '✅' : '❌') : '—'}</td>
                <td style={td}>
                  {e.statut === 'signe' && <span style={{ color: '#006B68', fontWeight: 700 }}>Signé {e.dateImportSigne ? new Date(e.dateImportSigne).toLocaleDateString('fr-FR') : ''}</span>}
                  {e.statut === 'a_signer' && <span style={{ color: '#C8A23A', fontWeight: 700 }}>À signer</span>}
                  {e.statut === 'erreur' && <span style={{ color: '#e53e3e', fontWeight: 700 }}>Erreur</span>}
                  {e.erreur && <div style={{ fontSize: 11, color: '#7a1a1a', maxWidth: 260 }}>{e.erreur}</div>}
                  {(e.erreur || '').includes('ASSIDUITE') && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      <input placeholder="Lien du dossier ASSIDUITE" value={liens[e.id] || ''} onChange={ev => setLiens({ ...liens, [e.id]: ev.target.value })}
                        style={{ fontSize: 11, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, width: 170 }} />
                      <button style={bouton(COLORS.primary)} disabled={occupe === e.id} onClick={() => enregistrerDossier(e)}>OK</button>
                    </div>
                  )}
                </td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  <button style={{ ...bouton(ouvert === e.id ? '#555' : '#C8A23A'), marginRight: 4 }}
                    onClick={() => setOuvert(ouvert === e.id ? null : e.id)} title="E-mails à saisir dans la signature électronique Google">
                    ✍️ Signataires
                  </button>
                  {e.statut !== 'erreur' && (
                    <button style={{ ...bouton(COLORS.primary), marginRight: 4 }} disabled={occupe === 'import'}
                      onClick={() => { setCibleImport(e.id); champImportUn.current?.click(); }} title="Importer le PDF signé de cet apprenant">
                      📤 Signé
                    </button>
                  )}
                  <button style={bouton('#3a5bc7')} disabled={occupe === e.id} onClick={() => regenerer(e.id)} title="Recalculer depuis les émargements (ex. justificatif arrivé)">
                    {occupe === e.id ? '⏳' : '🔄'}
                  </button>
                </td>
              </tr>
              {ouvert === e.id && (
                <tr style={{ backgroundColor: '#fbf8ee' }}>
                  <td colSpan={9} style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, marginBottom: 6 }}>
                      ✍️ Signataires à saisir dans Drive › ⋮ › eSignature › Gérer les signataires
                    </div>
                    {(signataires[e.apprenantId] || []).map(s => (
                      <div key={s.role} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, padding: '3px 0' }}>
                        <span style={{ width: 130, color: COLORS.textMuted }}>{s.role}</span>
                        <span style={{ width: 180, fontWeight: 600 }}>{s.nom || '—'}</span>
                        {s.email
                          ? <>
                              <code style={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: 4, padding: '2px 6px' }}>{s.email}</code>
                              <button style={bouton(COLORS.primary)} onClick={() => { navigator.clipboard.writeText(s.email); setCopie(s.email); setTimeout(() => setCopie(''), 2000); }}>
                                {copie === s.email ? '✅ Copié' : '📋 Copier'}
                              </button>
                              {s.source && s.source.includes('vérifier') && <span style={{ color: '#C8A23A', fontSize: 11 }}>⚠ {s.source}</span>}
                            </>
                          : <span style={{ color: '#e53e3e', fontWeight: 600 }}>
                              ⚠ e-mail manquant — à compléter sur la <a href={s.role === 'Apprenant' ? `/apprenants/${e.apprenantId}` : `/apprenants/${e.apprenantId}`} style={{ color: '#e53e3e' }}>fiche apprenant</a>
                            </span>}
                      </div>
                    ))}
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
