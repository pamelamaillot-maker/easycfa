'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ENTREPRISES_REELS } from '../../../data/mockEntreprises_reels';
import { APPRENANTS_REELS } from '../../../data/mockApprenants_reels';
import { COLORS } from '../../../lib/constants';
import { chargerEntreprise as chargerEntrepriseSupabase, modifierEntreprise, supprimerEntreprise as supprimerEntrepriseSupabase } from '../../../data/entreprisesSupabase';
import Card from '../../../components/Card';
import StatCard from '../../../components/StatCard';
import BoutonSupprimer from '../../../components/BoutonSupprimer';

const DOC_STATUT: Record<string, { bg: string; color: string }> = {
  'Disponible': { bg: '#e6f4f1', color: '#006B68' },
  'À importer': { bg: '#fde8e8', color: '#e53e3e' },
  'À envoyer':  { bg: '#fef6e4', color: '#C8A23A' },
  'Signé':      { bg: '#b8ddd9', color: '#004744' },
};

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

/** ✅ Charge tous les apprentis depuis les 3 sources (mock + liste persistée + fiches individuelles) */
function chargerTousApprenants(): any[] {
  if (typeof window === 'undefined') return APPRENANTS_REELS as any[];
  const ids = new Set();
  const liste: any[] = [];
  // 1. Mock
  (APPRENANTS_REELS as any[]).forEach(a => { liste.push(a); ids.add(a.id); });
  // 2. Liste persistée
  try {
    const persistee = JSON.parse(localStorage.getItem('easycfa_apprenants_v2') || '[]');
    persistee.forEach((a: any) => { if (!ids.has(a.id)) { liste.push(a); ids.add(a.id); } });
  } catch {}
  // 3. Fusion avec fiches individuelles
  return liste.map(a => {
    try {
      const fiche = localStorage.getItem(`apprenant_${a.id}`);
      if (fiche) return { ...a, ...JSON.parse(fiche) };
    } catch {}
    return a;
  });
}

/** ✅ Compare 2 noms d'entreprise en ignorant casse, accents, espaces */
function memeEntreprise(n1: string, n2: string): boolean {
  if (!n1 || !n2) return false;
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  return norm(n1) === norm(n2);
}

/** Recherche une entreprise dans toutes les sources */
function trouverEntreprise(id: string): any | null {
  if (typeof window === 'undefined') {
    return (ENTREPRISES_REELS as any[]).find(e => e.id === id) || null;
  }
  // 1. Liste persistée (contient les nouvelles + modifs majeures)
  try {
    const liste = JSON.parse(localStorage.getItem('easycfa_entreprises_v2') || '[]');
    const trouve = liste.find((e: any) => e.id === id);
    if (trouve) {
      try {
        const fiche = localStorage.getItem(`entreprise_${id}`);
        if (fiche) return { ...trouve, ...JSON.parse(fiche) };
      } catch {}
      return trouve;
    }
  } catch {}

  // 2. Mock + fiche détail individuelle
  const mockE = (ENTREPRISES_REELS as any[]).find(e => e.id === id);
  if (mockE) {
    try {
      const fiche = localStorage.getItem(`entreprise_${id}`);
      if (fiche) return { ...mockE, ...JSON.parse(fiche) };
    } catch {}
    return mockE;
  }

  // 3. Cas limite : fiche orpheline
  try {
    const fiche = localStorage.getItem(`entreprise_${id}`);
    if (fiche) return JSON.parse(fiche);
  } catch {}

  return null;
}

function InfoRow({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: alert ? '#e53e3e' : COLORS.text, textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
    </div>
  );
}

export default function FicheEntreprise({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [entreprise, setEntreprise] = useState<any>(null);
  const [modeEdition, setModeEdition] = useState(false);
  const [form, setForm] = useState<any>({});
  const [sauvegarde, setSauvegarde] = useState(false);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      let trouve: any = null;
      try {
        trouve = await chargerEntrepriseSupabase(id);
        if (trouve) console.log(`[FicheEntreprise ${id}] Chargée depuis Supabase ✅`);
      } catch (e) {
        console.error('[FicheEntreprise] Erreur Supabase, fallback localStorage', e);
      }
      if (!trouve) {
        trouve = trouverEntreprise(id);
        if (trouve) console.warn(`[FicheEntreprise ${id}] Chargée depuis localStorage (fallback)`);
      }
      setEntreprise(trouve);
      setForm(trouve ?? {});
      setChargement(false);
    })();
  }, [id]);

  function genererMandat() {
    const a = document.createElement('a');
    a.href = '/modeles/Mandat_Recrutement.pdf';
    a.download = 'Mandat_' + (form.raisonSociale ?? 'entreprise') + '.pdf';
    a.click();
  }

  /**
   * ✅ SAUVEGARDE — met à jour à la fois entreprise_<id> ET easycfa_entreprises_v2
   */
  async function sauvegarder() {
    // Supabase d'abord (en filtrant les champs orphelins)
    const pourSupabase: any = { ...form };
    ['libelleApe', 'pays', 'siteWeb', 'libelleConventionCollective', 'faf',
     'caisseRetraite', 'caisseCongesPayes', 'regimePrevoyance',
     'employeurPublic', 'travailDangereux',
     'dirigeantCivilite', 'dirigeantTelephone',
     'tuteurCivilite', 'tuteurAnneeExperience',
     'rhTelephone', 'opcoContact', 'mandatSepa', 'tarifHoraire', 'notes']
      .forEach(k => delete pourSupabase[k]);
    Object.keys(pourSupabase).forEach(k => { if (k.startsWith('piece_')) delete pourSupabase[k]; });

    try {
      const res = await modifierEntreprise(id, pourSupabase);
      if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
      else console.log(`[FicheEntreprise ${id}] Sauvegardée dans Supabase ✅`);
    } catch (e) {
      console.error('[FicheEntreprise] Erreur Supabase', e);
    }

    // localStorage en miroir (avec TOUS les champs)
    localStorage.setItem('entreprise_' + id, JSON.stringify(form));
    try {
      const liste = JSON.parse(localStorage.getItem('easycfa_entreprises_v2') || '[]');
      const idx = liste.findIndex((e: any) => e.id === id);
      if (idx >= 0) {
        liste[idx] = { ...liste[idx], ...form };
      } else {
        liste.push(form);
      }
      localStorage.setItem('easycfa_entreprises_v2', JSON.stringify(liste));
    } catch {}

    setEntreprise(form);
    setSauvegarde(true);
    setModeEdition(false);
    setTimeout(() => setSauvegarde(false), 3000);
  }

  /**
   * ✅ SUPPRESSION — retire de la liste persistée + ajoute dans la liste des supprimées
   * (le mock ne peut pas être effacé, on marque l'ID comme supprimé pour le filtrer)
   */
  async function supprimerEntreprise() {
    // Supabase d'abord
    try {
      const res = await supprimerEntrepriseSupabase(id);
      if (!res.success) alert(`⚠️ Erreur Supabase : ${res.error}`);
      else console.log(`[FicheEntreprise ${id}] Supprimée de Supabase ✅`);
    } catch (e) {
      console.error('[FicheEntreprise] Erreur Supabase suppression', e);
    }
    // localStorage en miroir
    try {
      // 1. Retirer de la liste persistée
      const liste = JSON.parse(localStorage.getItem('easycfa_entreprises_v2') || '[]');
      const filtree = liste.filter((e: any) => e.id !== id);
      localStorage.setItem('easycfa_entreprises_v2', JSON.stringify(filtree));

      // 2. Supprimer la fiche détail
      localStorage.removeItem(`entreprise_${id}`);

      // 3. Marquer dans la liste des supprimées (pour exclure du mock)
      const supprimees = JSON.parse(localStorage.getItem('easycfa_entreprises_supprimees') || '[]');
      if (!supprimees.includes(id)) {
        supprimees.push(id);
        localStorage.setItem('easycfa_entreprises_supprimees', JSON.stringify(supprimees));
      }

      // 4. Redirection
      router.push('/entreprises');
    } catch (err) {
      console.error('Erreur suppression entreprise:', err);
      alert('Erreur lors de la suppression. Voir la console (F12).');
    }
  }

  if (chargement) {
    return <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>Chargement...</div>;
  }

  if (!entreprise) return (
    <div style={{ padding: '32px' }}>
      <a href="/entreprises" style={{ color: COLORS.primary, fontWeight: '600', textDecoration: 'none' }}>← Retour aux entreprises</a>
      <p style={{ marginTop: '16px', color: COLORS.textMuted }}>Entreprise introuvable (ID : {id}).</p>
    </div>
  );

  const e = entreprise;

  return (
    <div>
      <a href="/entreprises" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
        ← Retour aux entreprises
      </a>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '16px 0 24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: COLORS.primary }}>{form.raisonSociale}</h1>
            {[
              { label: 'Active', bg: '#e6f4f1', color: '#006B68' },
              { label: 'Apprentis rattachés', bg: COLORS.backgroundGold, color: COLORS.secondary },
              { label: 'Dossier OK', bg: '#e6f4f1', color: '#006B68' },
            ].map((b) => (
              <span key={b.label} style={{ backgroundColor: b.bg, color: b.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{b.label}</span>
            ))}
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Fiche entreprise — Entreprise d'accueil apprentissage</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {modeEdition ? (
            <>
              <button onClick={sauvegarder} style={btnPrimary}>✅ Enregistrer</button>
              <button onClick={() => { setForm(entreprise); setModeEdition(false); }} style={btnSecondary}>Annuler</button>
            </>
          ) : (
            <>
              <button onClick={() => setModeEdition(true)} style={btnSecondary}>✏️ Modifier</button>
              <button onClick={genererMandat} style={btnPrimary}>📄 Générer mandat</button>

              {/* ✅ Bouton Supprimer — visible PAMA uniquement */}
              <BoutonSupprimer
                type="entreprise"
                id={id}
                libelle={`${form.raisonSociale ?? ''} (SIRET ${form.siret ?? ''})`}
                onSupprimer={supprimerEntreprise}
              />
            </>
          )}
        </div>
      </div>

      {sauvegarde && (
        <div style={{ padding: '12px 16px', backgroundColor: '#e6f4f1', border: '2px solid #006B68', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          ✅ Modifications enregistrées avec succès
        </div>
      )}

      {/* Infos générales + Suivi */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Card>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>Informations entreprise</h2>
          {modeEdition ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Raison sociale', champ: 'raisonSociale' },
                { label: 'SIRET', champ: 'siret' },
                { label: 'Adresse', champ: 'adresse' },
                { label: 'Code postal', champ: 'codePostal' },
                { label: 'Ville', champ: 'ville' },
                { label: 'Email', champ: 'email' },
                { label: 'Téléphone', champ: 'telephone' },
                { label: 'Code APE', champ: 'codeApe' },
                { label: 'OPCO', champ: 'opco' },
                { label: 'IDCC', champ: 'idcc' },
              ].map(f => (
                <div key={f.champ}>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                  <input
                    style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                    value={form[f.champ] ?? ''}
                    onChange={ev => setForm((p: any) => ({ ...p, [f.champ]: ev.target.value }))}
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <InfoRow label="Raison sociale" value={e.raisonSociale} />
              <InfoRow label="SIRET" value={e.siret} />
              <InfoRow label="Adresse" value={e.adresse} />
              <InfoRow label="Code postal" value={e.codePostal} />
              <InfoRow label="Ville" value={e.ville} />
              <InfoRow label="Email" value={e.email} />
              <InfoRow label="Téléphone" value={e.telephone} />
              <InfoRow label="Code APE" value={e.codeApe} />
              <InfoRow label="OPCO" value={e.opco} />
              <InfoRow label="IDCC" value={e.idcc} />
            </>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[{ label: 'OPCO', value: e.opco || '—' }, { label: 'IDCC', value: e.idcc || '—' }].map((s) => <StatCard key={s.label} {...s} />)}
          </div>
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>Récapitulatif apprentis</h2>
            {(() => {
              const tous = chargerTousApprenants().filter(a => (a.entrepriseId && a.entrepriseId === id) || memeEntreprise(a.entreprise, e.raisonSociale));
              const enCours = tous.filter(a => a.statut === 'En cours');
              const p2s = tous.filter(a => a.statut === 'P2S');
              const rupture = tous.filter(a => a.statut === 'Rupture');
              const termine = tous.filter(a => a.statut === 'Terminé');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ backgroundColor: '#e6f4f1', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.primary }}>✅ En cours</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: COLORS.primary }}>{enCours.length}</span>
                  </div>
                  <div style={{ backgroundColor: '#fef6e4', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.secondary }}>⚠️ P2S</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: COLORS.secondary }}>{p2s.length}</span>
                  </div>
                  <div style={{ backgroundColor: '#fde8e8', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#e53e3e' }}>❌ Rupture</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#e53e3e' }}>{rupture.length}</span>
                  </div>
                  <div style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>📋 Terminé</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#6b7280' }}>{termine.length}</span>
                  </div>
                  <div style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>📊 Total</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#555' }}>{tous.length}</span>
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      </div>

      {/* CERFA */}
      <Card style={{ marginBottom: '24px', borderTop: `4px solid ${COLORS.secondary}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Informations CERFA employeur</h2>
          <span style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
            Obligatoire CERFA apprentissage
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '12px', paddingBottom: '6px', borderBottom: `2px solid ${COLORS.backgroundGold}` }}>Identification</h3>
            {modeEdition ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Code APE / NAF', champ: 'codeApe' },
                  { label: 'Forme juridique', champ: 'formeJuridique' },
                  { label: 'Effectif', champ: 'effectif' },
                  { label: 'Secteur', champ: 'secteur' },
                  { label: 'Régime protection sociale', champ: 'regimeProtectionSociale' },
                ].map(f => (
                  <div key={f.champ}>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                    <input style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} value={form[f.champ] ?? ''} onChange={ev => setForm((p: any) => ({ ...p, [f.champ]: ev.target.value }))} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <InfoRow label="Code APE / NAF" value={e.codeApe} />
                <InfoRow label="Forme juridique" value={e.formeJuridique} />
                <InfoRow label="Effectif" value={e.effectif} />
                <InfoRow label="Secteur" value={e.secteur} />
                <InfoRow label="Régime protection sociale" value={e.regimeProtectionSociale} />
              </>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '12px', paddingBottom: '6px', borderBottom: `2px solid ${COLORS.backgroundGold}` }}>Convention collective et OPCO</h3>
            {modeEdition ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'IDCC', champ: 'idcc' },
                  { label: 'OPCO', champ: 'opco' },
                  { label: 'N° adhérent OPCO', champ: 'opcoNumeroAdherent' },
                ].map(f => (
                  <div key={f.champ}>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                    <input style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} value={form[f.champ] ?? ''} onChange={ev => setForm((p: any) => ({ ...p, [f.champ]: ev.target.value }))} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <InfoRow label="IDCC" value={e.idcc} />
                <InfoRow label="OPCO" value={e.opco} />
                <InfoRow label="N° adhérent OPCO" value={e.opcoNumeroAdherent} />
              </>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '12px', paddingBottom: '6px', borderBottom: `2px solid ${COLORS.backgroundGold}` }}>Contacts RH</h3>
            {modeEdition ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Contact RH — Nom', champ: 'rhNom' },
                  { label: 'Contact RH — Email', champ: 'rhEmail' },
                  { label: 'Email facturation', champ: 'facturationEmail' },
                  { label: 'IBAN', champ: 'iban' },
                  { label: 'BIC', champ: 'bic' },
                ].map(f => (
                  <div key={f.champ}>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                    <input style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} value={form[f.champ] ?? ''} onChange={ev => setForm((p: any) => ({ ...p, [f.champ]: ev.target.value }))} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <InfoRow label="Contact RH — Nom" value={e.rhNom} />
                <InfoRow label="Contact RH — Email" value={e.rhEmail} />
                <InfoRow label="Email facturation" value={e.facturationEmail} />
                <InfoRow label="IBAN" value={e.iban} />
                <InfoRow label="BIC" value={e.bic} />
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Tuteurs */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Tuteurs / maîtres d'apprentissage</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              {['Nom', 'Fonction', 'Email', 'Téléphone', 'Statut'].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modeEdition ? (
              <tr>
                <td colSpan={5} style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { label: 'Nom', champ: 'tuteurNom' },
                      { label: 'Prénom', champ: 'tuteurPrenom' },
                      { label: 'Fonction', champ: 'tuteurFonction' },
                      { label: 'Email', champ: 'tuteurEmail' },
                      { label: 'Téléphone', champ: 'tuteurTelephone' },
                    ].map(f => (
                      <div key={f.champ}>
                        <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                        <input style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} value={form[f.champ] ?? ''} onChange={ev => setForm((p: any) => ({ ...p, [f.champ]: ev.target.value }))} />
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ) : (
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>{e.tuteurNom} {e.tuteurPrenom}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{e.tuteurFonction || '—'}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{e.tuteurEmail || '—'}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{e.tuteurTelephone || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Actif</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Apprentis rattachés */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Apprentis rattachés</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              {['Nom', 'Prénom', 'Formation', 'Début', 'Fin', 'Statut', ''].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const apprentisListe = chargerTousApprenants().filter(a => (a.entrepriseId && a.entrepriseId === id) || memeEntreprise(a.entreprise, e.raisonSociale));
              if (apprentisListe.length === 0) {
                return <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted, fontStyle: 'italic' }}>Aucun apprenti rattaché</td></tr>;
              }
              return apprentisListe.map((a, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700' }}>{a.nom}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{a.prenom}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{a.formation}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{a.dateDebutContrat || '—'}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{a.dateFinContrat || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{a.statut}</span>
                </td>
                <td style={{ padding: '12px' }}>
                  <a href={`/apprenants/${a.id}`} style={{ backgroundColor: COLORS.background, color: COLORS.primary, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>Voir →</a>
                </td>
              </tr>
            ));
            })()}
          </tbody>
        </table>
      </Card>

      {/* Pièces justificatives entreprise */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>📎 Pièces justificatives entreprise</h2>
          <span style={{ fontSize: '12px', color: '#888' }}>PDF, JPG, PNG — Max 5 Mo</span>
        </div>
        {[
          { id: 'fiche_renseignement', label: 'Fiche de renseignement', detail: 'Fiche employeur complétée et signée', obligatoire: true },
          { id: 'kbis', label: 'Extrait KBIS', detail: 'Moins de 3 mois', obligatoire: true },
          { id: 'mandat_signe', label: 'Mandat de recrutement signé', detail: 'Mandat signé par le recruteur final', obligatoire: false },
        ].map((piece) => {
          const fichier = form['piece_' + piece.id];
          return (
            <div key={piece.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', backgroundColor: fichier ? '#e6f4f1' : piece.obligatoire ? '#fffbf0' : '#fafafa', border: `1.5px solid ${fichier ? '#006B68' : piece.obligatoire ? '#C8A23A' : '#e0e0e0'}` }}>
              <div style={{ fontSize: '22px', flexShrink: 0 }}>{fichier ? '✅' : piece.obligatoire ? '⚠️' : '📄'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: fichier ? COLORS.primary : '#333' }}>
                  {piece.label}
                  {piece.obligatoire && <span style={{ color: '#e53e3e', marginLeft: '6px', fontSize: '11px' }}>OBLIGATOIRE</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{piece.detail}</div>
                {fichier && <div style={{ fontSize: '12px', color: COLORS.primary, marginTop: '4px', fontWeight: '600' }}>📄 {fichier.nom} ({fichier.taille})</div>}
              </div>
              <label style={{ backgroundColor: fichier ? 'white' : COLORS.primary, color: fichier ? COLORS.primary : 'white', border: fichier ? `1.5px solid ${COLORS.primary}` : 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-block', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {fichier ? '🔄 Remplacer' : '⬆ Importer'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  if (f) {
                    const taille = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(f.size / 1024)} Ko`;
                    const updated = { ...form, ['piece_' + piece.id]: { nom: f.name, taille } };
                    setForm(updated);
                    localStorage.setItem('entreprise_' + id, JSON.stringify(updated));
                  }
                }} />
              </label>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
