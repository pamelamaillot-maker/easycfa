'use client';

import { useState, useEffect, useMemo } from 'react';
import { assemblerDonnees } from '../../../lib/documentData';
import { COLORS } from '../../../lib/constants';
import Card from '../../../components/Card';
import dynamic from 'next/dynamic';
import { chargerApprentis } from '../../../data/apprentisSupabase';
import { chargerEntreprises, sauvegarderFinancementApprenant, marquerConventionEnAttente } from '../../../data/entreprisesSupabase';
import { chargerNpec, type Npec } from '../../../data/npecSupabase';
import { extractRncp } from '../../../lib/financementConvention';

const BoutonPdfCF = dynamic(() => import('../../../components/BoutonPdfCF'), { ssr: false });

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', color: COLORS.text, backgroundColor: 'white' };

export default function ApercuCF() {
  const [apprenants, setApprenants] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [npecListe, setNpecListe] = useState<Npec[]>([]);
  const [apprenantId, setApprenantId] = useState('');
  const [entrepriseId, setEntrepriseId] = useState('');
  const [nDeca, setNDeca] = useState('');
  const [lieuSignature, setLieuSignature] = useState('Saint-Leu');
  const [dateSignature, setDateSignature] = useState(new Date().toLocaleDateString('fr-FR'));
  const [rncpCode, setRncpCode] = useState('');
  const [afficher, setAfficher] = useState(false);
  const [chargement, setChargement] = useState(true);

  // États de sauvegarde
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');

  // Données financières éditables
  const [finance, setFinance] = useState({
    coutPedagogiqueAnnee1: 0,
    coutPedagogiqueAnnee2: 0,
    coutTotalFraisPedagogiques: 0,
    fraisPremierEquipement: 0,
    nbRepasAnnee1: 0,
    fraisAnnexesRepasAnnee1: 0,
    nbRepasAnnee2: 0,
    fraisAnnexesRepasAnnee2: 0,
    totalFraisAnnexes: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [apps, ents, npecs] = await Promise.all([
          chargerApprentis(),
          chargerEntreprises(),
          chargerNpec(),
        ]);
        const appsTries = apps.sort((a: any, b: any) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`));
        const entsTries = ents.sort((a: any, b: any) => (a.raisonSociale || '').localeCompare(b.raisonSociale || ''));
        setApprenants(appsTries);
        setEntreprises(entsTries);
        setNpecListe(npecs);
        if (appsTries.length > 0) setApprenantId(appsTries[0].id);
        if (entsTries.length > 0) setEntrepriseId(entsTries[0].id);
        console.log(`[Convention] ${apps.length} apprenants + ${ents.length} entreprises + ${npecs.length} NPEC chargés ✅`);
      } catch (e) {
        console.error('[Convention] Erreur chargement:', e);
      }
      setChargement(false);
    })();
  }, []);

  // Auto-sélection de l'entreprise quand on change d'apprenant
  useEffect(() => {
    if (!apprenantId || apprenants.length === 0 || entreprises.length === 0) return;
    const a = apprenants.find(x => x.id === apprenantId);
    if (a?.entreprise) {
      const ent = entreprises.find(e =>
        (e.raisonSociale || '').toLowerCase().trim() === a.entreprise.toLowerCase().trim()
      );
      if (ent) setEntrepriseId(ent.id);
    }
  }, [apprenantId, apprenants, entreprises]);

  const apprenantObj = useMemo(() => apprenants.find(a => a.id === apprenantId) || null, [apprenants, apprenantId]);
  const entrepriseObj = useMemo(() => entreprises.find(e => e.id === entrepriseId) || null, [entreprises, entrepriseId]);

  // Auto-remplit le RNCP depuis l'entreprise (financementsApprenants[apprenantId]) ou l'apprenant
  useEffect(() => {
    if (!apprenantObj) return;
    const fEnt = entrepriseObj?.financementsApprenants?.[apprenantObj.id];
    const rncpAuto =
      fEnt?.codeRncpManuel ||
      apprenantObj.financement?.codeRncpManuel ||
      apprenantObj.rncpCode ||
      extractRncp(apprenantObj.formation || '');
    if (rncpAuto) setRncpCode(rncpAuto);
  }, [apprenantObj, entrepriseObj]);

  // Résout le NPEC selon le code RNCP saisi
  const npecMatch = useMemo<Npec | null>(() => {
    if (!rncpCode) return null;
    const norm = rncpCode.toUpperCase().replace(/\s+/g, '').replace('RNCP', '');
    return npecListe.find(n => n.codeRncp.toUpperCase().replace(/\s+/g, '').replace('RNCP', '').includes(norm)) || null;
  }, [npecListe, rncpCode]);

  // Remplissage unifié du panneau financier :
  // priorité 1 = entreprise.financementsApprenants[apprenantId] (source officielle)
  // priorité 2 = apprenant.financement (legacy)
  // priorité 3 = référentiel NPEC
  // priorité 4 = 0
  useEffect(() => {
    if (!apprenantObj) return;
    const fEnt = entrepriseObj?.financementsApprenants?.[apprenantObj.id] || {};
    const fLegacy = apprenantObj.financement || {};
    const pick = (val1: any, val2: any, npecVal: number = 0): number => {
      for (const v of [val1, val2]) {
        const n = Number(v);
        if (!isNaN(n) && n > 0) return n;
      }
      return npecVal || 0;
    };
    setFinance({
      coutPedagogiqueAnnee1: pick(fEnt.coutPedagogiqueAnnee1, fLegacy.coutPedagogiqueAnnee1),
      coutPedagogiqueAnnee2: pick(fEnt.coutPedagogiqueAnnee2, fLegacy.coutPedagogiqueAnnee2),
      coutTotalFraisPedagogiques: pick(fEnt.coutTotalFraisPedagogiques, fLegacy.coutTotalFraisPedagogiques),
      fraisPremierEquipement: pick(fEnt.fraisPremierEquipement, fLegacy.fraisPremierEquipement, npecMatch?.fpe),
      nbRepasAnnee1: pick(fEnt.nbRepasAnnee1, fLegacy.nbRepasAnnee1, npecMatch?.repasAnnee1),
      fraisAnnexesRepasAnnee1: pick(fEnt.fraisAnnexesRepasAnnee1, fLegacy.fraisAnnexesRepasAnnee1, npecMatch?.montantRepasAnnee1),
      nbRepasAnnee2: pick(fEnt.nbRepasAnnee2, fLegacy.nbRepasAnnee2, npecMatch?.repasAnnee2),
      fraisAnnexesRepasAnnee2: pick(fEnt.fraisAnnexesRepasAnnee2, fLegacy.fraisAnnexesRepasAnnee2, npecMatch?.montantRepasAnnee2),
      totalFraisAnnexes: pick(fEnt.totalFraisAnnexes, fLegacy.totalFraisAnnexes),
    });
    console.log('[Convention] Finance pré-remplie:', {
      source: fEnt.dateMaj ? 'entreprise' : (Object.keys(fLegacy).length ? 'apprenant (legacy)' : 'NPEC/défaut'),
      FPE: npecMatch?.fpe,
      rncp: rncpCode,
      npecTrouve: !!npecMatch,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apprenantObj?.id, entrepriseObj?.id, npecMatch?.id]);

  const donnees = useMemo(() => assemblerDonnees(
    apprenantObj,
    entrepriseObj,
    {
      N_DECA: nDeca,
      DATE_SIGNATURE_DOC: dateSignature,
      LIEU_SIGNATURE_DOC: lieuSignature,
      RNCP_CODE: rncpCode,
    },
    npecMatch,
    finance
  ), [apprenantObj, entrepriseObj, nDeca, dateSignature, lieuSignature, rncpCode, npecMatch, finance]);

  async function handleSauvegarderFinance() {
    if (!apprenantObj || !entrepriseObj) return;
    setSauvegarde('saving');
    const res = await sauvegarderFinancementApprenant(
      entrepriseObj.id,
      apprenantObj.id,
      {
        ...finance,
        codeRncpManuel: rncpCode,
      }
    );
    if (res.success) {
      setSauvegarde('ok');
      const entsMaj = await chargerEntreprises();
      setEntreprises(entsMaj.sort((a: any, b: any) => (a.raisonSociale || '').localeCompare(b.raisonSociale || '')));
      setTimeout(() => setSauvegarde('idle'), 2500);
    } else {
      setSauvegarde('error');
      alert('Erreur sauvegarde : ' + (res.error || 'inconnue'));
      setTimeout(() => setSauvegarde('idle'), 2500);
    }
  }

  async function handleMarquerEnAttente() {
    if (!apprenantObj || !entrepriseObj) return;
    const emailDest = entrepriseObj.email || entrepriseObj.dirigeantEmail || '';
    if (!confirm(
      `Marquer la convention comme envoyée à ${entrepriseObj.raisonSociale} ?\n\n` +
      `(Apprenant : ${apprenantObj.prenom} ${apprenantObj.nom})\n` +
      `Email destinataire : ${emailDest || 'non renseigné'}\n\n` +
      `Le statut passera en "En attente de signature" sur la fiche entreprise.`
    )) return;

    // 1) Sauvegarde le financement
    await sauvegarderFinancementApprenant(entrepriseObj.id, apprenantObj.id, {
      ...finance,
      codeRncpManuel: rncpCode,
    });
    // 2) Marque en attente
    const res = await marquerConventionEnAttente(entrepriseObj.id, apprenantObj.id, emailDest);
    if (res.success) {
      const entsMaj = await chargerEntreprises();
      setEntreprises(entsMaj.sort((a: any, b: any) => (a.raisonSociale || '').localeCompare(b.raisonSociale || '')));
      alert('✅ Convention marquée en attente de signature.\n\nElle apparaît maintenant sur la fiche entreprise.');
    } else {
      alert('Erreur : ' + (res.error || 'inconnue'));
    }
  }

  // Statut convention actuel (pour affichage)
  const conventionActuelle = entrepriseObj?.financementsApprenants?.[apprenantObj?.id || '']?.convention;

  if (chargement) {
    return <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>Chargement...</div>;
  }

  return (
    <div>
      {/* En-tête page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <a href="/documents" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>← Retour au registre</a>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px', marginTop: '8px' }}>
            Convention de Formation
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Par apprentissage — Prévisualisation et génération PDF</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnPrimary} onClick={() => setAfficher(true)}>👁 Prévisualiser</button>
          {afficher && (
            <BoutonPdfCF
              donnees={donnees}
              nomFichier={`CF_${donnees.ENTREPRISE_RAISON_SOCIALE}_${donnees.APPRENANT_NOM}_${donnees.DATE_SIGNATURE_DOC.replace(/\//g, '-')}.pdf`}
            />
          )}
          <button
            style={btnSecondary}
            onClick={handleMarquerEnAttente}
            disabled={!apprenantObj || !entrepriseObj}
          >
            📧 Marquer comme envoyée
          </button>
        </div>
      </div>

      {/* Statut convention */}
      {conventionActuelle && conventionActuelle.statut !== 'a_generer' && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          borderRadius: 8,
          backgroundColor: conventionActuelle.statut === 'signee' ? '#e8f5e9' : '#fff8e1',
          border: `1px solid ${conventionActuelle.statut === 'signee' ? '#a5d6a7' : '#ffe082'}`,
          fontSize: 13,
          color: COLORS.text,
        }}>
          {conventionActuelle.statut === 'signee' ? (
            <>✅ <strong>Convention signée</strong> le {new Date(conventionActuelle.dateSignature || '').toLocaleDateString('fr-FR')} — <a href={conventionActuelle.fichierSigneUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.primary, fontWeight: 600 }}>Voir le PDF signé</a></>
          ) : (
            <>⏳ <strong>En attente de signature</strong> — envoyée le {conventionActuelle.dateEnvoiEmail ? new Date(conventionActuelle.dateEnvoiEmail).toLocaleDateString('fr-FR') : '?'} à {conventionActuelle.emailDestinataire || '?'}</>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

        {/* Panneau gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Paramètres</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Apprenant ({apprenants.length})</label>
                <select style={inputStyle} value={apprenantId} onChange={(e) => { setApprenantId(e.target.value); setAfficher(false); }}>
                  <option value="">— Choisir un apprenant —</option>
                  {apprenants.map(a => (
                    <option key={a.id} value={a.id}>{a.nom} {a.prenom}{a.formation ? ` — ${a.formation}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Entreprise ({entreprises.length})</label>
                <select style={inputStyle} value={entrepriseId} onChange={(e) => { setEntrepriseId(e.target.value); setAfficher(false); }}>
                  <option value="">— Choisir une entreprise —</option>
                  {entreprises.map(e => (
                    <option key={e.id} value={e.id}>{e.raisonSociale || e.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Formation / Code RNCP ({npecListe.length} référencé{npecListe.length > 1 ? 's' : ''})
                </label>
                <select style={inputStyle} value={rncpCode} onChange={(e) => { setRncpCode(e.target.value); setAfficher(false); }}>
                  <option value="">— Choisir une formation —</option>
                  {npecListe.map(n => (
                    <option key={n.id} value={n.codeRncp}>
                      {n.codeInterne ? `[${n.codeInterne}] ` : ''}{n.codeRncp} — {n.intitule}
                    </option>
                  ))}
                </select>
                {npecMatch && (
                  <div style={{ marginTop: 4, fontSize: 10, color: '#888' }}>
                    Code diplôme : <strong>{npecMatch.codeDiplome || '—'}</strong> · {npecMatch.nbHeuresFormation}h · {npecMatch.dureeMois} mois
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Lieu de signature</label>
                <input style={inputStyle} value={lieuSignature} onChange={(e) => { setLieuSignature(e.target.value); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date de signature</label>
                <input style={inputStyle} value={dateSignature} onChange={(e) => { setDateSignature(e.target.value); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>N° DECA <span style={{ color: COLORS.secondary }}>(manuel)</span></label>
                <input style={inputStyle} placeholder="Ex : 974-25-00123" value={nDeca} onChange={(e) => { setNDeca(e.target.value); setAfficher(false); }} />
              </div>
              <button style={{ ...btnPrimary, textAlign: 'center' }} onClick={() => setAfficher(true)}>
                👁 Générer l'aperçu
              </button>
            </div>
          </Card>

          {/* Bloc Référentiel NPEC */}
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '8px' }}>
              Référentiel NPEC {npecMatch ? '✅' : '⚠️'}
            </h2>
            {npecMatch ? (
              <div style={{ fontSize: '12px', color: COLORS.text, lineHeight: '1.7' }}>
                <div><strong>{npecMatch.codeRncp}</strong> — {npecMatch.intitule}</div>
                <div style={{ marginTop: 6, color: COLORS.textMuted }}>
                  NPEC annuel : <strong style={{ color: COLORS.primary }}>{npecMatch.montantNpecAnnuel.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong> · {npecMatch.nbHeuresFormation}h · {npecMatch.dureeMois} mois
                </div>
                <div style={{ marginTop: 6, padding: '8px 10px', backgroundColor: COLORS.background, borderRadius: 6, fontSize: 11 }}>
                  <div><strong>Split OPCO calculé :</strong></div>
                  <div>Année 1 : {donnees.MONTANT_OPCO_ANNEE_1 || '—'} ({donnees.TOTAL_JOURS_PREMIERE_ANNEE || 0} j)</div>
                  <div>Année 2 : {donnees.MONTANT_OPCO_ANNEE_2 || '—'} ({donnees.TOTAL_JOURS_DEUXIEME_ANNEE || 0} j)</div>
                  <div style={{ marginTop: 4, fontWeight: 700, color: COLORS.primary }}>Total : {donnees.MONTANT_TOTAL_OPCO || '—'}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' }}>
                Aucun NPEC trouvé pour <strong>{rncpCode || '(code vide)'}</strong>.<br />
                <a href="/admin/npec" style={{ color: COLORS.primary, fontWeight: 600 }}>→ Ajouter ce RNCP dans le référentiel</a>
              </div>
            )}
          </Card>

          {/* Bloc Coûts apprenant éditables */}
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
              Coûts apprenant <span style={{ fontSize: 11, color: COLORS.secondary, fontWeight: 500 }}>(édition manuelle)</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Coût péda Année 1 (€)</label>
                <input type="number" step="0.01" style={inputStyle} value={finance.coutPedagogiqueAnnee1} onChange={e => { setFinance({ ...finance, coutPedagogiqueAnnee1: Number(e.target.value) }); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Coût péda Année 2 (€)</label>
                <input type="number" step="0.01" style={inputStyle} value={finance.coutPedagogiqueAnnee2} onChange={e => { setFinance({ ...finance, coutPedagogiqueAnnee2: Number(e.target.value) }); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Total frais péda (€)</label>
                <input type="number" step="0.01" style={inputStyle} value={finance.coutTotalFraisPedagogiques} onChange={e => { setFinance({ ...finance, coutTotalFraisPedagogiques: Number(e.target.value) }); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Premier équipement (€)</label>
                <input type="number" step="0.01" style={inputStyle} value={finance.fraisPremierEquipement} onChange={e => { setFinance({ ...finance, fraisPremierEquipement: Number(e.target.value) }); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Nb repas A1</label>
                <input type="number" style={inputStyle} value={finance.nbRepasAnnee1} onChange={e => { setFinance({ ...finance, nbRepasAnnee1: Number(e.target.value) }); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Montant repas A1 (€)</label>
                <input type="number" step="0.01" style={inputStyle} value={finance.fraisAnnexesRepasAnnee1} onChange={e => { setFinance({ ...finance, fraisAnnexesRepasAnnee1: Number(e.target.value) }); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Nb repas A2</label>
                <input type="number" style={inputStyle} value={finance.nbRepasAnnee2} onChange={e => { setFinance({ ...finance, nbRepasAnnee2: Number(e.target.value) }); setAfficher(false); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Montant repas A2 (€)</label>
                <input type="number" step="0.01" style={inputStyle} value={finance.fraisAnnexesRepasAnnee2} onChange={e => { setFinance({ ...finance, fraisAnnexesRepasAnnee2: Number(e.target.value) }); setAfficher(false); }} />
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                style={{
                  ...btnPrimary,
                  opacity: sauvegarde === 'saving' ? 0.6 : 1,
                  cursor: sauvegarde === 'saving' ? 'wait' : 'pointer',
                }}
                disabled={sauvegarde === 'saving' || !entrepriseObj || !apprenantObj}
                onClick={handleSauvegarderFinance}
              >
                {sauvegarde === 'saving' ? '⏳ Sauvegarde...' : '💾 Sauvegarder sur la fiche entreprise'}
              </button>
              {sauvegarde === 'ok' && (
                <span style={{ fontSize: 12, color: '#0a7c4a', fontWeight: 600 }}>
                  ✅ Enregistré sur {entrepriseObj?.raisonSociale}
                </span>
              )}
              {sauvegarde === 'error' && (
                <span style={{ fontSize: 12, color: '#c00', fontWeight: 600 }}>
                  ❌ Échec — vérifier la console
                </span>
              )}
            </div>
            <div style={{ marginTop: 8, padding: '6px 10px', backgroundColor: COLORS.backgroundGold, borderRadius: 6, fontSize: 10, color: COLORS.text }}>
              💡 Les données financières sont enregistrées sur la fiche <strong>entreprise</strong> (point de vue Convention CFA ↔ Entreprise), indexées par apprenant.
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>Données utilisées</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
              {Object.entries(donnees).filter(([, v]) => v !== '').map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: COLORS.background, borderRadius: '6px', gap: '8px' }}>
                  <code style={{ fontSize: '10px', color: COLORS.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{`{{${k}}}`}</code>
                  <span style={{ fontSize: '11px', color: COLORS.text, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Panneau droit */}
        <div>
          {!afficher ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: COLORS.primary }}>Aperçu de la Convention</div>
                <div style={{ fontSize: '14px', marginBottom: '24px' }}>Choisissez un apprenant et cliquez sur "Générer l'aperçu"</div>
                <button style={btnPrimary} onClick={() => setAfficher(true)}>👁 Générer l'aperçu</button>
              </div>
            </Card>
          ) : (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${COLORS.background}` }}>
                <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Convention de Formation</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>4 pages</span>
                  <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>Simulation</span>
                </div>
              </div>

              {/* Aperçu visuel */}
              <div style={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '32px', fontFamily: 'Georgia, serif', fontSize: '13px', lineHeight: '1.8', color: '#1a1a1a' }}>
                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #EAF4F3' }}>
                  <img src="/logo-pamoi.png" alt="PAM OI" style={{ height: '70px', objectFit: 'contain' }} />
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#555', lineHeight: '1.8' }}>
                    <div style={{ fontWeight: '700', color: '#006B68', fontSize: '13px' }}>PAM OI Formation</div>
                    <div>1 Chemin Dubuisson – 97436 Saint-Leu</div>
                    <div>SIRET : 881 279 392 00016 – NDA : 04973425197</div>
                    <div>Qualiopi n° 51971543-3</div>
                  </div>
                </div>

                {/* Titre */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#006B68', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #C8A23A', paddingBottom: '6px', display: 'inline-block' }}>
                    Convention de Formation
                  </div>
                  <div style={{ fontSize: '13px', color: '#C8A23A', marginTop: '4px' }}>Par apprentissage</div>
                </div>

                {/* Résumé */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>Le CFA</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>PAM OI Formation</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Représentée par Mme MAILLOT Gaëlle</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Directrice & référente handicap</div>
                  </div>
                  <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>L'Entreprise</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>{donnees.ENTREPRISE_RAISON_SOCIALE}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Représentée par {donnees.DIRIGEANT_NOM_COMPLET}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>OPCO : {donnees.OPCO}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#EAF4F3', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>Formation</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>{donnees.FORMATION_LIBELLE}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Apprenant : {donnees.APPRENANT_NOM_COMPLET}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Du {donnees.DATE_DEBUT_FORMATION} au {donnees.DATE_FIN_FORMATION} – {donnees.VOLUME_HORAIRE_TOTAL} heures</div>
                </div>

                <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '16px' }}>
                  Document complet sur 4 pages — cliquez sur "Télécharger PDF" pour obtenir la version complète
                </div>

                {/* Pied de page */}
                <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #e0e0e0', fontSize: '10px', color: '#888', textAlign: 'center' }}>
                  PAM OI Formation – 1 Chemin Dubuisson – 97436 Saint-Leu – SIRET : 881 279 392 00016 – NAF : 8559A
                </div>
              </div>

              <div style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: COLORS.background, borderRadius: '6px', fontSize: '11px', color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
                Document généré avec EasyCFA — solution éditée par PAM GROUPE
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <BoutonPdfCF
                  donnees={donnees}
                  nomFichier={`CF_${donnees.ENTREPRISE_RAISON_SOCIALE}_${donnees.APPRENANT_NOM}_${donnees.DATE_SIGNATURE_DOC.replace(/\//g, '-')}.pdf`}
                />
                <button style={btnPrimary} onClick={handleMarquerEnAttente} disabled={!apprenantObj || !entrepriseObj}>
                  📧 Marquer comme envoyée
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}