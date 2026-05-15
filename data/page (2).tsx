'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useUser } from '../../lib/UserContext';
import { useAcces } from '../../lib/useAcces';
import { COLORS } from '../../lib/constants';
import { REFERENTIEL_FORMATIONS } from '../../data/mockData';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };

// ============================================================================
// IDENTITÉ CFA (depuis Paramètres CFA — dur pour l'instant, à remonter dans config plus tard)
// ============================================================================
const CFA_IDENTITE = {
  siret: '88127939200016',
  siren: '881279392',
  raisonSociale: 'PAM',
  denominationUsuelle: 'PAM OI Formation',
  nda: '04973425197',
  adresse1: '1 Chemin Dubuisson',
  adresse2: '',
  codePostal: '97436',
  ville: 'SAINT-LEU',
  uai: '9741871R',
  representantLegal: 'MAILLOT Gaëlle Marie Paméla',
  emailRepresentant: 'pamelamaillot@pamoi.re',
  telephoneRepresentant: '0693556492',
  formeJuridique: 'Autre structure privée',
  cfaEntreprise: 'Non',
  region: 'Réunion',
};

// ============================================================================
// CONFIG ONGLET RÉSULTAT APPRENTISSAGE
// ============================================================================
const CHARGES_FIELDS = [
  { key: 'achats_60', label: 'Achats (comptes 60)', placeholder: 'ex: 17831', help: 'Somme des comptes 60 "achats"' },
  { key: 'locations_6132', label: 'Locations immobilières (compte 6132)', placeholder: 'ex: 35121', help: 'Montant du compte 6132 "locations immobilières"' },
  { key: 'services_61_62', label: 'Services extérieurs et autres (comptes 61, 62*)', placeholder: 'ex: 32799', help: 'Somme des comptes 61, 62 hors location immobilière' },
  { key: 'impots_63', label: 'Impôts, taxes et versements assimilés (comptes 63)', placeholder: 'ex: 1375', help: 'Somme des comptes 63' },
  { key: 'charges_personnel_64', label: 'Charges de personnel (comptes 64)', placeholder: 'ex: 63220', help: 'Somme des comptes 64 "charges de personnel"' },
  { key: 'dotations_681_pedago', label: 'Dotations aux amortissements (compte 681) immobilisations pédagogiques', placeholder: 'ex: 0', help: 'Pour les immobilisations destinées à la pédagogie' },
  { key: 'dotations_68', label: 'Dotations aux amortissements et provisions (comptes 68)', placeholder: 'ex: 7823', help: 'Total des comptes 68' },
  { key: 'autres_charges_65', label: 'Autres charges d\'exploitation (comptes 65)', placeholder: 'ex: 0', help: 'Somme des comptes 65' },
  { key: 'charges_financieres_66', label: 'Charges financières (comptes 66)', placeholder: 'ex: 0', help: 'Somme des comptes 66' },
  { key: 'charges_exceptionnelles_67', label: 'Charges exceptionnelles (comptes 67)', placeholder: 'ex: 0', help: 'Somme des comptes 67' },
  { key: 'impots_societes_69', label: 'Impôts sur les sociétés (compte 69)', placeholder: 'ex: 4069', help: 'Montant du compte 69' },
];

const PRODUITS_FIELDS = [
  { key: 'ventes_700_708', label: 'Ventes de produits et prestations (comptes 700-708)', placeholder: 'ex: 165084', help: 'Comptes 700 à 707, 709 et 708' },
  { key: 'production_immob_72', label: 'Production immobilisée (compte 72)', placeholder: 'ex: 0', help: 'Montant du compte 72' },
  { key: 'subventions_74', label: 'Subventions d\'exploitation (compte 74)', placeholder: 'ex: 0', help: 'Somme des comptes 74' },
  { key: 'autres_produits_75', label: 'Autres produits de gestion courante (compte 75)', placeholder: 'ex: 0', help: 'Somme des comptes 75' },
  { key: 'reprises_78', label: 'Reprises sur amortissements et provisions (compte 78)', placeholder: 'ex: 0', help: 'Somme des comptes 78' },
  { key: 'transferts_79', label: 'Transferts de charges (compte 79)', placeholder: 'ex: 0', help: 'Somme des comptes 79' },
  { key: 'produits_financiers_76', label: 'Produits financiers (compte 76)', placeholder: 'ex: 0', help: 'Somme des comptes 76' },
  { key: 'produits_exceptionnels_77', label: 'Produits exceptionnels (compte 77)', placeholder: 'ex: 0', help: 'Somme des comptes 77' },
];

// ============================================================================
// CONFIG ONGLET INDICATEURS
// ============================================================================
const INDICATEURS_FIELDS = [
  { key: 'immo_total', label: 'Montant total net des immobilisations (€)', help: 'Total des immobilisations en valeur nette dédiées à l\'activité d\'apprentissage' },
  { key: 'immo_pedago', label: 'Dont immobilisations destinées à la pédagogie (€)', help: 'Affectées à la formation des apprentis (matériel, équipements, locaux pédagogiques)' },
  { key: 'invest_total', label: 'Montant total des investissements effectués (€)', help: 'Total lorsque l\'investissement est immobilisé' },
  { key: 'invest_pedago', label: 'Dont investissements à usage exclusif pédagogique (€)', help: 'Montants affectés exclusivement à la pédagogie' },
  { key: 'subv_invest_total', label: 'Subventions d\'investissement encaissées (€)', help: 'Total des subventions reçues pour l\'activité d\'apprentissage' },
  { key: 'subv_invest_pedago', label: 'Dont subventions d\'investissement pédagogiques (€)', help: 'Subventions uniquement pour la pédagogie' },
  { key: 'subv_invest_app', label: 'Subventions d\'investissement pour l\'apprentissage (€)', help: 'Subventions spécifiques apprentissage' },
  { key: 'reserve_invest', label: 'En réserves pour investissements pédagogiques (€)', help: 'Pour financer des investissements dédiés à l\'apprentissage' },
  { key: 'reserve_treso', label: 'En réserves pour fonds de roulement (€)', help: 'Trésorerie et/ou fonds de roulement' },
  { key: 'reserve_autres', label: 'En réserves pour autres activités (€)', help: 'Autres activités' },
  { key: 'dividendes', label: 'En dividendes (€)', help: 'Cf. notice France Compétences' },
  { key: 'compensation_perte', label: 'Compensation de perte sur la période (€)', help: 'En compensation d\'une perte générée par d\'autres activités' },
  { key: 'dons_nature', label: 'Total dons en nature perçus (€)', help: 'Dons en nature reçus en 2024' },
];

// ============================================================================
// HELPERS
// ============================================================================
function nombreFr(n: number | string | undefined): string {
  if (n === undefined || n === '' || n === null) return '';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '';
  return num.toLocaleString('fr-FR');
}

function safeNum(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v.replace(/\s/g, '').replace(',', '.')) : v;
  return isNaN(n) ? 0 : n;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function FranceCompetences() {
  const { utilisateur } = useUser();
  const { peutAccederFacturation } = useAcces();
  const [exercice, setExercice] = useState<string>('2024');
  const [onglet, setOnglet] = useState<'identite' | 'certif' | 'resultat' | 'indicateurs' | 'analytique' | 'ufa'>('identite');
  const [charges, setCharges] = useState<Record<string, string>>({});
  const [produits, setProduits] = useState<Record<string, string>>({});
  const [indicateurs, setIndicateurs] = useState<Record<string, string>>({});
  const [sauvegarde, setSauvegarde] = useState(false);

  // Clé localStorage par exercice
  const storageKey = `easycfa_france_competences_${exercice}`;

  // Chargement à l'arrivée + changement d'exercice
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        setCharges(data.charges ?? {});
        setProduits(data.produits ?? {});
        setIndicateurs(data.indicateurs ?? {});
      } else {
        setCharges({});
        setProduits({});
        setIndicateurs({});
      }
    } catch {
      setCharges({});
      setProduits({});
      setIndicateurs({});
    }
  }, [storageKey]);

  function sauvegarderDonnees() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ charges, produits, indicateurs, dateUpdate: new Date().toISOString() }));
      setSauvegarde(true);
      setTimeout(() => setSauvegarde(false), 3000);
    } catch (err) {
      alert("Erreur de sauvegarde : " + (err as any)?.message);
    }
  }

  // === Calculs automatiques ===
  const totalChargesExploit = CHARGES_FIELDS.slice(0, 8).reduce((s, f) => s + safeNum(charges[f.key]), 0);
  const totalCharges = totalChargesExploit + safeNum(charges.charges_financieres_66) + safeNum(charges.charges_exceptionnelles_67) + safeNum(charges.impots_societes_69);
  const totalProduitsExploit = PRODUITS_FIELDS.slice(0, 6).reduce((s, f) => s + safeNum(produits[f.key]), 0);
  const totalProduits = totalProduitsExploit + safeNum(produits.produits_financiers_76) + safeNum(produits.produits_exceptionnels_77);
  const resultatNet = totalProduits - totalCharges;

  // Formations actives (non archivées) pour l'onglet certifications
  const formationsActives = REFERENTIEL_FORMATIONS.filter((f: any) => !f.archive);

  // ==========================================================================
  // EXPORT EXCEL au format officiel France Compétences
  // ==========================================================================
  function exporterExcel() {
    const wb = XLSX.utils.book_new();

    // ===== Onglet 1 : Identité organisme =====
    const identiteRows: any[][] = [
      [`Déclaration ${parseInt(exercice) + 1} au titre de ${exercice}`],
      ['DECLARATION DES DONNEES FINANCIERES (comptables et analytiques) ET DES INDICATEURS COMPLEMENTAIRES'],
      [],
      ['Identification de la structure juridique de l\'organisme déclarant', 'Données à renseigner', 'Précisions pour l\'OFA'],
      ['SIRET de l\'organisme déclarant', CFA_IDENTITE.siret, 'Saisie automatique'],
      ['SIREN de l\'organisme déclarant', CFA_IDENTITE.siren, 'Saisie automatique'],
      ['Raison sociale de l\'organisme déclarant', CFA_IDENTITE.raisonSociale, 'Saisie automatique'],
      ['Dénomination usuelle de l\'organisme déclarant', CFA_IDENTITE.denominationUsuelle, 'Saisie libre'],
      ['Numéro de Déclaration d\'Activité (NDA)', CFA_IDENTITE.nda, 'NDA à 11 chiffres'],
      ['Adresse 1 (siège social)', CFA_IDENTITE.adresse1, ''],
      ['Adresse 2', CFA_IDENTITE.adresse2, ''],
      ['Code postal', CFA_IDENTITE.codePostal, ''],
      ['Ville', CFA_IDENTITE.ville, ''],
      ['Coordonnées du représentant légal (NOM Prénom)', CFA_IDENTITE.representantLegal, ''],
      ['Coordonnées de la personne référente pour la remontée', CFA_IDENTITE.representantLegal, ''],
      ['Courriel de la personne référente', CFA_IDENTITE.emailRepresentant, ''],
      ['Coordonnées téléphoniques de la personne référente', CFA_IDENTITE.telephoneRepresentant, ''],
      ['Code UAI de l\'organisme déclarant', CFA_IDENTITE.uai, ''],
      ['Forme juridique', CFA_IDENTITE.formeJuridique, 'Menu déroulant'],
      ['CFA d\'entreprise ?', CFA_IDENTITE.cfaEntreprise, 'Menu déroulant'],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(identiteRows);
    ws1['!cols'] = [{ wch: 60 }, { wch: 30 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Identité organisme');

    // ===== Onglet 2 : Identité établissement =====
    const etabRows: any[][] = [
      [],
      ['Etablissements rattachés à l\'organisme déclarant', '', 'A renseigner', 'Précisions'],
      ['Etablissement 1 (organisme déclarant)', 'Raison sociale', CFA_IDENTITE.raisonSociale, 'Saisie automatique'],
      ['', 'Code postal', CFA_IDENTITE.codePostal, ''],
      ['', 'Code UAI', CFA_IDENTITE.uai, ''],
      ['', 'N° SIRET', CFA_IDENTITE.siret, ''],
      ['', 'Nombre total de certifications rattachées', formationsActives.length, ''],
      ['', 'Nombre de certifications en apprentissage', formationsActives.length, ''],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(etabRows);
    ws2['!cols'] = [{ wch: 35 }, { wch: 40 }, { wch: 25 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Identité établissement');

    // ===== Onglet 3 : Liste des certifications =====
    const certifRows: any[][] = [
      [`Liste des certifications (diplômes et titres) en apprentissage rattachées à cet établissement`, '', '', '', '', '', '', ''],
      ['Code RNCP', 'Code diplôme', 'Libellé de la certification', 'Type de certification', 'Niveau', 'Code spécialité', 'Date d\'ouverture', `Taux de réussite ${exercice}`],
    ];
    formationsActives.forEach((f: any) => {
      certifRows.push([
        f.rncp ?? '',
        f.codeDiplome ?? '',
        f.intitule?.replace(/^Titre Professionnel /, '') ?? '',
        'TP',
        f.niveau ?? '',
        f.codeDiplome ? f.codeDiplome.substring(0, 2) : '',
        '',
        f.tauxCertification ? f.tauxCertification.toFixed(2) : '',
      ]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(certifRows);
    ws3['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 45 }, { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'liste des certifications');

    // ===== Onglet 4 : Résultat apprentissage =====
    const resultatRows: any[][] = [
      [`EXERCICE ${exercice} - du 1er janvier ${exercice} au 31 décembre ${exercice}`],
      ['COMPTE ACTIVITE APPRENTISSAGE SELON PLAN COMPTABLE GENERAL', 'Données de l\'organisme pour l\'activité apprentissage'],
      ['Charges', 'Total en €', 'Précisions pour l\'OFA'],
      ...CHARGES_FIELDS.slice(0, 8).map(f => [f.label, safeNum(charges[f.key]) || '', f.help]),
      ['Total des charges d\'exploitation', totalChargesExploit, 'Total automatique'],
      ['Charges financières (comptes 66)', safeNum(charges.charges_financieres_66) || '', ''],
      ['Charges exceptionnelles (comptes 67)', safeNum(charges.charges_exceptionnelles_67) || '', ''],
      ['Impôts sur les sociétés (compte 69)', safeNum(charges.impots_societes_69) || '', ''],
      ['TOTAL DES CHARGES', totalCharges, 'Total automatique'],
      [],
      ['Produits', 'Total en €', 'Précisions pour l\'OFA'],
      ...PRODUITS_FIELDS.slice(0, 6).map(f => [f.label, safeNum(produits[f.key]) || '', f.help]),
      ['Total des produits d\'exploitation', totalProduitsExploit, 'Total automatique'],
      ['Produits financiers (compte 76)', safeNum(produits.produits_financiers_76) || '', ''],
      ['Produits exceptionnels (compte 77)', safeNum(produits.produits_exceptionnels_77) || '', ''],
      ['TOTAL DES PRODUITS', totalProduits, 'Total automatique'],
      [],
      ['RESULTAT NET', resultatNet, 'Produits - Charges'],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(resultatRows);
    ws4['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'résultat apprentissage');

    // ===== Onglet 5 : Indicateurs =====
    const indicRows: any[][] = [
      [`EXERCICE ${exercice} - du 1er janvier ${exercice} au 31 décembre ${exercice}`],
      ['Indicateurs complémentaires', `Données au 31/12/${exercice}`, 'Précisions pour l\'OFA'],
      ...INDICATEURS_FIELDS.map(f => [f.label, safeNum(indicateurs[f.key]) || '', f.help]),
      ['Résultat net (depuis onglet résultat apprentissage)', resultatNet, 'Calcul automatique'],
    ];
    const ws5 = XLSX.utils.aoa_to_sheet(indicRows);
    ws5['!cols'] = [{ wch: 60 }, { wch: 18 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Indicateurs');

    // ===== Téléchargement =====
    const nomFichier = `France_Competences_PAM_OI_${exercice}.xlsx`;
    XLSX.writeFile(wb, nomFichier);
  }

  return (
    <div>
      <PageHeader title="🇫🇷 France Compétences" subtitle="Déclaration annuelle des données financières (apprentissage)" />

      {/* Sélecteur d'exercice + bouton export */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Exercice à déclarer</label>
            <select style={{ ...inputStyle, width: '180px' }} value={exercice} onChange={e => setExercice(e.target.value)}>
              {['2023', '2024', '2025', '2026'].map(y => <option key={y} value={y}>Exercice {y} (déclaration {parseInt(y) + 1})</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {sauvegarde && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>✅ Enregistré</span>}
            <button onClick={sauvegarderDonnees} style={btnSecondary}>💾 Enregistrer</button>
            <button onClick={exporterExcel} style={btnPrimary}>📥 Exporter au format officiel (.xlsx)</button>
          </div>
        </div>

        <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '12px', color: '#555' }}>
          💡 Cette déclaration est à déposer chaque année sur le portail France Compétences avant le <strong>31 mars de l'année suivante</strong>. Source : <a href="https://www.francecompetences.fr" target="_blank" rel="noopener" style={{ color: COLORS.primary, fontWeight: '600' }}>francecompetences.fr</a>
        </div>
      </Card>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'identite', label: '🏢 Identité', auto: true },
          { id: 'certif', label: '📚 Certifications', auto: true },
          { id: 'resultat', label: '💰 Résultat apprentissage' },
          { id: 'indicateurs', label: '📊 Indicateurs' },
          { id: 'analytique', label: '🔍 Analytique' },
          { id: 'ufa', label: '🏫 UFA' },
        ].map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id as any)} style={{ backgroundColor: onglet === o.id ? COLORS.primary : 'white', color: onglet === o.id ? 'white' : COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', position: 'relative' }}>
            {o.label}
            {o.auto && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#16a34a', color: 'white', fontSize: '9px', padding: '1px 6px', borderRadius: '8px', fontWeight: '700' }}>AUTO</span>}
          </button>
        ))}
      </div>

      {/* ===== ONGLET IDENTITÉ ===== */}
      {onglet === 'identite' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Identification du CFA</h2>
            <span style={{ backgroundColor: '#e6f4f1', color: COLORS.primary, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>✅ Pré-rempli depuis Paramètres CFA</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { label: 'SIRET', value: CFA_IDENTITE.siret },
              { label: 'SIREN', value: CFA_IDENTITE.siren },
              { label: 'Raison sociale', value: CFA_IDENTITE.raisonSociale },
              { label: 'Dénomination usuelle', value: CFA_IDENTITE.denominationUsuelle },
              { label: 'NDA', value: CFA_IDENTITE.nda },
              { label: 'Code UAI', value: CFA_IDENTITE.uai },
              { label: 'Adresse', value: `${CFA_IDENTITE.adresse1} - ${CFA_IDENTITE.codePostal} ${CFA_IDENTITE.ville}` },
              { label: 'Forme juridique', value: CFA_IDENTITE.formeJuridique },
              { label: 'Représentant légal', value: CFA_IDENTITE.representantLegal },
              { label: 'Email du référent', value: CFA_IDENTITE.emailRepresentant },
              { label: 'Téléphone', value: CFA_IDENTITE.telephoneRepresentant },
              { label: 'CFA d\'entreprise', value: CFA_IDENTITE.cfaEntreprise },
            ].map(info => (
              <div key={info.label} style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>{info.label}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.text }}>{info.value || '—'}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '14px', padding: '10px 14px', backgroundColor: '#fef6e4', borderRadius: '8px', fontSize: '12px', color: '#7a5c00' }}>
            💡 Ces informations sont gérées dans <strong>Paramètres → Paramètres CFA</strong>. Toute modification doit être faite à cet endroit pour être prise en compte dans l'export.
          </div>
        </Card>
      )}

      {/* ===== ONGLET CERTIFICATIONS ===== */}
      {onglet === 'certif' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Certifications en apprentissage</h2>
            <span style={{ backgroundColor: '#e6f4f1', color: COLORS.primary, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>✅ Pré-rempli depuis Formations</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: COLORS.primary, color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>RNCP</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Code diplôme</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Intitulé</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Niveau</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Taux certif. {exercice}</th>
                </tr>
              </thead>
              <tbody>
                {formationsActives.map((f: any) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px', fontWeight: '600' }}>{f.rncp}</td>
                    <td style={{ padding: '8px' }}>{f.codeDiplome}</td>
                    <td style={{ padding: '8px' }}>{f.intitule}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{f.niveau}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: f.tauxCertification ? '#16a34a' : '#aaa' }}>
                      {f.tauxCertification ? f.tauxCertification.toFixed(2) + ' %' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '14px', padding: '10px 14px', backgroundColor: '#fef6e4', borderRadius: '8px', fontSize: '12px', color: '#7a5c00' }}>
            💡 Pour mettre à jour les taux de certification, va dans <strong>Formations → Onglet Résultats</strong>.
          </div>
        </Card>
      )}

      {/* ===== ONGLET RÉSULTAT APPRENTISSAGE ===== */}
      {onglet === 'resultat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Charges */}
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#e53e3e', marginBottom: '14px' }}>💸 Charges</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {CHARGES_FIELDS.map(f => (
                <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>{f.label}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>{f.help}</div>
                  </div>
                  <input
                    style={{ ...inputStyle, textAlign: 'right' }}
                    type="number"
                    placeholder={f.placeholder}
                    value={charges[f.key] ?? ''}
                    onChange={e => setCharges(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fde8e8', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#7a1f1f' }}>Total charges d'exploitation</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#7a1f1f' }}>{nombreFr(totalChargesExploit)} €</span>
            </div>
            <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#7a1f1f', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>TOTAL DES CHARGES</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: 'white' }}>{nombreFr(totalCharges)} €</span>
            </div>
          </Card>

          {/* Produits */}
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#16a34a', marginBottom: '14px' }}>💰 Produits</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PRODUITS_FIELDS.map(f => (
                <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>{f.label}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>{f.help}</div>
                  </div>
                  <input
                    style={{ ...inputStyle, textAlign: 'right' }}
                    type="number"
                    placeholder={f.placeholder}
                    value={produits[f.key] ?? ''}
                    onChange={e => setProduits(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803d' }}>Total produits d'exploitation</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#15803d' }}>{nombreFr(totalProduitsExploit)} €</span>
            </div>
            <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#15803d', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>TOTAL DES PRODUITS</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: 'white' }}>{nombreFr(totalProduits)} €</span>
            </div>
          </Card>

          {/* Résultat */}
          <Card>
            <div style={{ padding: '16px', backgroundColor: resultatNet >= 0 ? '#dcfce7' : '#fde8e8', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `2px solid ${resultatNet >= 0 ? '#16a34a' : '#e53e3e'}` }}>
              <div>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Résultat net de l'activité d'apprentissage</div>
                <div style={{ fontSize: '13px', color: '#555' }}>{resultatNet >= 0 ? '✅ Excédent' : '⚠️ Déficit'} pour l'exercice {exercice}</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: resultatNet >= 0 ? '#15803d' : '#7a1f1f' }}>
                {resultatNet >= 0 ? '+' : ''}{nombreFr(resultatNet)} €
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===== ONGLET INDICATEURS ===== */}
      {onglet === 'indicateurs' && (
        <Card>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '14px' }}>📊 Indicateurs complémentaires</h2>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '14px' }}>
            Données au 31/12/{exercice} concernant l'activité d'apprentissage.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {INDICATEURS_FIELDS.map(f => (
              <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>{f.label}</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>{f.help}</div>
                </div>
                <input
                  style={{ ...inputStyle, textAlign: 'right' }}
                  type="number"
                  placeholder="0"
                  value={indicateurs[f.key] ?? ''}
                  onChange={e => setIndicateurs(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {/* Résultat net (rappel) */}
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: COLORS.background, borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>Résultat net (depuis Résultat apprentissage)</span>
            <span style={{ fontSize: '15px', fontWeight: '700', color: resultatNet >= 0 ? '#15803d' : '#7a1f1f' }}>
              {resultatNet >= 0 ? '+' : ''}{nombreFr(resultatNet)} €
            </span>
          </div>
        </Card>
      )}

      {/* ===== ONGLETS ANALYTIQUE & UFA — placeholders ===== */}
      {(onglet === 'analytique' || onglet === 'ufa') && (
        <Card>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '14px' }}>
            {onglet === 'analytique' ? '🔍 Résultat analytique' : '🏫 UFA (Unités de Formation par Apprentissage)'}
          </h2>
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: COLORS.background, borderRadius: '10px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>{onglet === 'analytique' ? '🔍' : '🏫'}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.primary, marginBottom: '6px' }}>
              {onglet === 'analytique' ? 'Ventilation par section analytique' : 'Déclaration des UFA'}
            </div>
            <div style={{ fontSize: '12px', color: '#888', maxWidth: '500px', margin: '0 auto' }}>
              {onglet === 'analytique'
                ? 'Cet onglet permet de ventiler les charges et produits par section analytique (par formation, par certification, etc.). À compléter manuellement dans le fichier officiel téléchargé via le bouton "Exporter".'
                : 'Les UFA sont des établissements rattachés au CFA principal mais n\'ayant pas leur propre SIRET. PAM OI Formation n\'a pas d\'UFA, cette section est donc vide.'
              }
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
