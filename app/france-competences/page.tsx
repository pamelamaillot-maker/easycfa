'use client';

import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useUser } from '../../lib/UserContext';
import { useAcces } from '../../lib/useAcces';
import { COLORS } from '../../lib/constants';
import { REFERENTIEL_FORMATIONS } from '../../data/mockData';
import { getCfaIdentite, CfaIdentite, deduireSiren } from '../../lib/cfaConfig';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };

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

// Produits AUTRES (non liés aux ventes 706) - saisie manuelle
const PRODUITS_AUTRES_FIELDS = [
  { key: 'production_immob_72', label: 'Production immobilisée (compte 72)', placeholder: 'ex: 0', help: 'Montant du compte 72' },
  { key: 'subventions_74', label: 'Subventions d\'exploitation (compte 74)', placeholder: 'ex: 0', help: 'Somme des comptes 74' },
  { key: 'autres_produits_75', label: 'Autres produits de gestion courante (compte 75)', placeholder: 'ex: 0', help: 'Inclut compte 755 si financement OPCO d\'équipement pour le CFA (parc informatique)' },
  { key: 'reprises_78', label: 'Reprises sur amortissements et provisions (compte 78)', placeholder: 'ex: 0', help: 'Somme des comptes 78' },
  { key: 'transferts_79', label: 'Transferts de charges (compte 79)', placeholder: 'ex: 0', help: 'Somme des comptes 79' },
  { key: 'produits_financiers_76', label: 'Produits financiers (compte 76)', placeholder: 'ex: 0', help: 'Somme des comptes 76' },
  { key: 'produits_exceptionnels_77', label: 'Produits exceptionnels (compte 77)', placeholder: 'ex: 0', help: 'Somme des comptes 77' },
];

const INDICATEURS_FIELDS = [
  { key: 'immo_total', label: 'Montant total net des immobilisations (€)', help: 'Total des immobilisations en valeur nette dédiées à l\'activité d\'apprentissage' },
  { key: 'immo_pedago', label: 'Dont immobilisations destinées à la pédagogie (€)', help: 'Affectées à la formation des apprentis' },
  { key: 'invest_total', label: 'Montant total des investissements effectués (€)', help: 'Total lorsque l\'investissement est immobilisé' },
  { key: 'invest_pedago', label: 'Dont investissements à usage exclusif pédagogique (€)', help: 'Montants affectés exclusivement à la pédagogie' },
  { key: 'subv_invest_total', label: 'Subventions d\'investissement encaissées (€)', help: 'Total des subventions reçues (compte 131)' },
  { key: 'subv_invest_pedago', label: 'Dont subventions d\'investissement pédagogiques (€)', help: 'Uniquement pour la pédagogie' },
  { key: 'subv_invest_app', label: 'Subventions d\'investissement pour l\'apprentissage (€)', help: 'Subventions spécifiques apprentissage' },
  { key: 'reserve_invest', label: 'En réserves pour investissements pédagogiques (€)', help: 'Pour financer des investissements pédagogiques' },
  { key: 'reserve_treso', label: 'En réserves pour fonds de roulement (€)', help: 'Trésorerie et/ou fonds de roulement' },
  { key: 'reserve_autres', label: 'En réserves pour autres activités (€)', help: 'Autres activités' },
  { key: 'dividendes', label: 'En dividendes (€)', help: 'Cf. notice France Compétences' },
  { key: 'compensation_perte', label: 'Compensation de perte sur la période (€)', help: 'En compensation d\'une perte' },
  { key: 'dons_nature', label: 'Total dons en nature perçus (€)', help: 'Dons en nature reçus' },
];

function nombreFr(n: number | string | undefined): string {
  if (n === undefined || n === '' || n === null) return '';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '';
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function safeNum(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v.replace(/\s/g, '').replace(',', '.')) : v;
  return isNaN(n) ? 0 : n;
}

type EcheanceCalcul = {
  id: string;
  type: 'pedago' | 'equipement' | 'repas';
  label: string;
  datePaiement: string;
  montantPaye: number;
  apprenantNom: string;
  apprenantPrenom: string;
  opco: string;
  formation: string;
};

export default function FranceCompetences() {
  const { utilisateur } = useUser();
  const { peutAccederFacturation } = useAcces();
  const [exercice, setExercice] = useState<string>('2024');
  const [onglet, setOnglet] = useState<'identite' | 'certif' | 'resultat' | 'indicateurs' | 'analytique' | 'ufa'>('identite');
  const [charges, setCharges] = useState<Record<string, string>>({});
  const [produits, setProduits] = useState<Record<string, string>>({});
  const [indicateurs, setIndicateurs] = useState<Record<string, string>>({});
  const [sauvegarde, setSauvegarde] = useState(false);

  // Auto-calcul ventes : switch + données
  const [autoVentes, setAutoVentes] = useState<boolean>(true);
  const [ventesManuelles, setVentesManuelles] = useState<{ p7061: string; p7062: string; p7063: string }>({ p7061: '', p7062: '', p7063: '' });
  const [detailModale, setDetailModale] = useState<'7061' | '7062' | '7063' | null>(null);

  // Identité CFA
  const [cfa, setCfa] = useState<CfaIdentite>(() => getCfaIdentite());
  useEffect(() => {
    const refresh = () => setCfa(getCfaIdentite());
    refresh();
    window.addEventListener('easycfa-cfa-updated', refresh);
    return () => window.removeEventListener('easycfa-cfa-updated', refresh);
  }, []);

  // Chargement Facturation OPCO
  const [apcs, setApcs] = useState<any[]>([]);
  useEffect(() => {
    const refresh = () => {
      try {
        const s = localStorage.getItem('easycfa_apcs_v2');
        if (s) setApcs(JSON.parse(s));
        else setApcs([]);
      } catch {
        setApcs([]);
      }
    };
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const storageKey = `easycfa_france_competences_${exercice}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        setCharges(data.charges ?? {});
        setProduits(data.produits ?? {});
        setIndicateurs(data.indicateurs ?? {});
        setAutoVentes(data.autoVentes ?? true);
        // Migration : compat ancien format p706/p707/p708
        const vm = data.ventesManuelles ?? {};
        setVentesManuelles({
          p7061: vm.p7061 ?? vm.p706 ?? '',
          p7062: vm.p7062 ?? vm.p707 ?? '',
          p7063: vm.p7063 ?? vm.p708 ?? '',
        });
      } else {
        setCharges({});
        setProduits({});
        setIndicateurs({});
        setAutoVentes(true);
        setVentesManuelles({ p7061: '', p7062: '', p7063: '' });
      }
    } catch {
      setCharges({});
      setProduits({});
      setIndicateurs({});
    }
  }, [storageKey]);

  function sauvegarderDonnees() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        charges, produits, indicateurs,
        autoVentes, ventesManuelles,
        dateUpdate: new Date().toISOString(),
      }));
      setSauvegarde(true);
      setTimeout(() => setSauvegarde(false), 3000);
    } catch (err) {
      alert("Erreur de sauvegarde : " + (err as any)?.message);
    }
  }

  // ==========================================================================
  // CALCUL AUTOMATIQUE DES VENTES depuis Facturation OPCO
  // ==========================================================================
  const ventilationAuto = useMemo(() => {
    const result = {
      p7061: { total: 0, count: 0, echeances: [] as EcheanceCalcul[] }, // pédagogiques (NPEC)
      p7062: { total: 0, count: 0, echeances: [] as EcheanceCalcul[] }, // 1er équipement
      p7063: { total: 0, count: 0, echeances: [] as EcheanceCalcul[] }, // repas
    };

    apcs.forEach((apc: any) => {
      (apc.echeances ?? []).forEach((e: any) => {
        if (!e.datePaiement || !e.montantPaye) return;
        const p = e.datePaiement.split('/');
        if (p.length !== 3) return;
        const annee = p[2];
        if (annee !== exercice) return;

        const detail: EcheanceCalcul = {
          id: e.id,
          type: e.type,
          label: e.label,
          datePaiement: e.datePaiement,
          montantPaye: e.montantPaye,
          apprenantNom: apc.apprenantNom,
          apprenantPrenom: apc.apprenantPrenom,
          opco: apc.opco,
          formation: apc.formation,
        };

        if (e.type === 'pedago') {
          result.p7061.total += e.montantPaye;
          result.p7061.count++;
          result.p7061.echeances.push(detail);
        } else if (e.type === 'equipement') {
          result.p7062.total += e.montantPaye;
          result.p7062.count++;
          result.p7062.echeances.push(detail);
        } else if (e.type === 'repas') {
          result.p7063.total += e.montantPaye;
          result.p7063.count++;
          result.p7063.echeances.push(detail);
        }
      });
    });

    return result;
  }, [apcs, exercice]);

  const ventes7061 = autoVentes ? ventilationAuto.p7061.total : safeNum(ventesManuelles.p7061);
  const ventes7062 = autoVentes ? ventilationAuto.p7062.total : safeNum(ventesManuelles.p7062);
  const ventes7063 = autoVentes ? ventilationAuto.p7063.total : safeNum(ventesManuelles.p7063);
  const total706 = ventes7061 + ventes7062 + ventes7063;

  const totalChargesExploit = CHARGES_FIELDS.slice(0, 8).reduce((s, f) => s + safeNum(charges[f.key]), 0);
  const totalCharges = totalChargesExploit + safeNum(charges.charges_financieres_66) + safeNum(charges.charges_exceptionnelles_67) + safeNum(charges.impots_societes_69);
  const totalProduitsAutres = PRODUITS_AUTRES_FIELDS.slice(0, 5).reduce((s, f) => s + safeNum(produits[f.key]), 0);
  const totalProduitsExploit = total706 + totalProduitsAutres;
  const totalProduits = totalProduitsExploit + safeNum(produits.produits_financiers_76) + safeNum(produits.produits_exceptionnels_77);
  const resultatNet = totalProduits - totalCharges;

  const formationsActives = REFERENTIEL_FORMATIONS.filter((f: any) => !f.archive);

  // ==========================================================================
  // EXPORT EXCEL
  // ==========================================================================
  function exporterExcel() {
    const wb = XLSX.utils.book_new();
    const siren = cfa.siren || deduireSiren(cfa.siret);
    const representantComplet = `${cfa.representantLegalNom} ${cfa.representantLegalPrenom}`;

    const identiteRows: any[][] = [
      [`Déclaration ${parseInt(exercice) + 1} au titre de ${exercice}`],
      ['DECLARATION DES DONNEES FINANCIERES (comptables et analytiques) ET DES INDICATEURS COMPLEMENTAIRES'],
      [],
      ['Identification de la structure juridique de l\'organisme déclarant', 'Données à renseigner', 'Précisions pour l\'OFA'],
      ['SIRET de l\'organisme déclarant', cfa.siret, 'Saisie automatique'],
      ['SIREN de l\'organisme déclarant', siren, 'Saisie automatique'],
      ['Raison sociale de l\'organisme déclarant', cfa.raisonSociale, ''],
      ['Dénomination usuelle de l\'organisme déclarant', cfa.denominationUsuelle, ''],
      ['Numéro de Déclaration d\'Activité (NDA)', cfa.nda, ''],
      ['Adresse 1 (siège social)', cfa.adresse1, ''],
      ['Adresse 2', cfa.adresse2, ''],
      ['Code postal', cfa.codePostal, ''],
      ['Ville', cfa.ville, ''],
      ['Coordonnées du représentant légal (NOM Prénom)', representantComplet, ''],
      ['Coordonnées de la personne référente', representantComplet, ''],
      ['Courriel de la personne référente', cfa.representantLegalEmail, ''],
      ['Coordonnées téléphoniques', cfa.representantLegalTelephone, ''],
      ['Code UAI de l\'organisme déclarant', cfa.uai, ''],
      ['Forme juridique', cfa.formeJuridique, ''],
      ['CFA d\'entreprise ?', cfa.cfaEntreprise, ''],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(identiteRows);
    ws1['!cols'] = [{ wch: 60 }, { wch: 30 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Identité organisme');

    const etabRows: any[][] = [
      [],
      ['Etablissements rattachés à l\'organisme déclarant', '', 'A renseigner', 'Précisions'],
      ['Etablissement 1', 'Raison sociale', cfa.raisonSociale, ''],
      ['', 'Code postal', cfa.codePostal, ''],
      ['', 'Code UAI', cfa.uai, ''],
      ['', 'N° SIRET', cfa.siret, ''],
      ['', 'Nombre total de certifications rattachées', formationsActives.length, ''],
      ['', 'Nombre de certifications en apprentissage', formationsActives.length, ''],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(etabRows);
    ws2['!cols'] = [{ wch: 35 }, { wch: 40 }, { wch: 25 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Identité établissement');

    const certifRows: any[][] = [
      [`Liste des certifications`, '', '', '', '', '', '', ''],
      ['Code RNCP', 'Code diplôme', 'Libellé de la certification', 'Type', 'Niveau', 'Code spécialité', 'Date ouverture', `Taux réussite ${exercice}`],
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

    const resultatRows: any[][] = [
      [`EXERCICE ${exercice} - du 1er janvier ${exercice} au 31 décembre ${exercice}`],
      ['COMPTE ACTIVITE APPRENTISSAGE SELON PCG', 'Données activité apprentissage'],
      ['Charges', 'Total en €', 'Précisions'],
      ...CHARGES_FIELDS.slice(0, 8).map(f => [f.label, safeNum(charges[f.key]) || '', f.help]),
      ['Total des charges d\'exploitation', totalChargesExploit, 'Total automatique'],
      ['Charges financières (comptes 66)', safeNum(charges.charges_financieres_66) || '', ''],
      ['Charges exceptionnelles (comptes 67)', safeNum(charges.charges_exceptionnelles_67) || '', ''],
      ['Impôts sur les sociétés (compte 69)', safeNum(charges.impots_societes_69) || '', ''],
      ['TOTAL DES CHARGES', totalCharges, 'Total automatique'],
      [],
      ['Produits', 'Total en €', 'Précisions'],
      ['Ventes de produits et prestations (comptes 700 à 708)', total706, `Total compte 706 — ${autoVentes ? 'auto depuis Facturation OPCO' : 'saisie manuelle'}`],
      ['  • dont 7061 — Prestations pédagogiques (NPEC)', ventes7061, `${autoVentes ? ventilationAuto.p7061.count + ' encaissements' : 'saisie manuelle'}`],
      ['  • dont 7062 — Frais annexes : 1er équipement', ventes7062, `${autoVentes ? ventilationAuto.p7062.count + ' encaissements' : 'saisie manuelle'}`],
      ['  • dont 7063 — Frais annexes : repas / hébergement', ventes7063, `${autoVentes ? ventilationAuto.p7063.count + ' encaissements' : 'saisie manuelle'}`],
      ...PRODUITS_AUTRES_FIELDS.slice(0, 5).map(f => [f.label, safeNum(produits[f.key]) || '', f.help]),
      ['Total des produits d\'exploitation', totalProduitsExploit, 'Total automatique'],
      ['Produits financiers (compte 76)', safeNum(produits.produits_financiers_76) || '', ''],
      ['Produits exceptionnels (compte 77)', safeNum(produits.produits_exceptionnels_77) || '', ''],
      ['TOTAL DES PRODUITS', totalProduits, 'Total automatique'],
      [],
      ['RESULTAT NET', resultatNet, 'Produits - Charges'],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(resultatRows);
    ws4['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'résultat apprentissage');

    const indicRows: any[][] = [
      [`EXERCICE ${exercice}`],
      ['Indicateurs complémentaires', `Données au 31/12/${exercice}`, 'Précisions'],
      ...INDICATEURS_FIELDS.map(f => [f.label, safeNum(indicateurs[f.key]) || '', f.help]),
      ['Résultat net (depuis Résultat apprentissage)', resultatNet, 'Calcul automatique'],
    ];
    const ws5 = XLSX.utils.aoa_to_sheet(indicRows);
    ws5['!cols'] = [{ wch: 60 }, { wch: 18 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Indicateurs');

    XLSX.writeFile(wb, `France_Competences_PAM_OI_${exercice}.xlsx`);
  }

  const detailEcheances = detailModale === '7061' ? ventilationAuto.p7061.echeances
                        : detailModale === '7062' ? ventilationAuto.p7062.echeances
                        : detailModale === '7063' ? ventilationAuto.p7063.echeances : [];
  const detailTotal = detailModale === '7061' ? ventilationAuto.p7061.total
                    : detailModale === '7062' ? ventilationAuto.p7062.total
                    : detailModale === '7063' ? ventilationAuto.p7063.total : 0;
  const detailLabel = detailModale === '7061' ? '📚 7061 — Prestations pédagogiques (NPEC)'
                    : detailModale === '7062' ? '🎒 7062 — Frais annexes : 1er équipement'
                    : detailModale === '7063' ? '🍽 7063 — Frais annexes : repas / hébergement' : '';

  return (
    <div>
      <PageHeader title="🇫🇷 France Compétences" subtitle="Déclaration annuelle des données financières (apprentissage)" />

      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Exercice à déclarer</label>
            <select style={{ ...inputStyle, width: '220px' }} value={exercice} onChange={e => setExercice(e.target.value)}>
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
          💡 À déposer chaque année sur le portail France Compétences avant le <strong>31 mars de l'année suivante</strong>.
        </div>
      </Card>

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

      {/* ===== IDENTITÉ ===== */}
      {onglet === 'identite' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Identification du CFA</h2>
            <a href="/parametres" style={{ backgroundColor: '#e6f4f1', color: COLORS.primary, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textDecoration: 'none' }}>
              ✅ Pré-rempli depuis Paramètres CFA → cliquer pour modifier
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { label: 'SIRET', value: cfa.siret },
              { label: 'SIREN', value: cfa.siren || deduireSiren(cfa.siret) },
              { label: 'Raison sociale', value: cfa.raisonSociale },
              { label: 'Dénomination usuelle', value: cfa.denominationUsuelle },
              { label: 'NDA', value: cfa.nda },
              { label: 'Code UAI', value: cfa.uai },
              { label: 'Adresse', value: `${cfa.adresse1}${cfa.adresse2 ? ', ' + cfa.adresse2 : ''} - ${cfa.codePostal} ${cfa.ville}` },
              { label: 'Forme juridique', value: cfa.formeJuridique },
              { label: 'Représentant légal', value: `${cfa.representantLegalNom} ${cfa.representantLegalPrenom}` },
              { label: 'Email du référent', value: cfa.representantLegalEmail },
              { label: 'Téléphone', value: cfa.representantLegalTelephone },
              { label: 'CFA d\'entreprise', value: cfa.cfaEntreprise },
            ].map(info => (
              <div key={info.label} style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>{info.label}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.text }}>{info.value || '—'}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ===== CERTIFICATIONS ===== */}
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
        </Card>
      )}

      {/* ===== RÉSULTAT APPRENTISSAGE ===== */}
      {onglet === 'resultat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* === VENTES — COMPTE 706 === */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#16a34a' }}>💰 Ventes — Compte 706 (Prestations de services CFA)</h2>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  Toutes les facturations CFA → OPCO (NPEC + frais annexes) se ventilent en subdivisions du compte 706
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: autoVentes ? '#dcfce7' : '#f0f0f0', padding: '6px 12px', borderRadius: '8px', border: `1.5px solid ${autoVentes ? '#16a34a' : '#ccc'}` }}>
                <input type="checkbox" checked={autoVentes} onChange={e => setAutoVentes(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#16a34a' }} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: autoVentes ? '#15803d' : '#555' }}>
                  {autoVentes ? '✅ Calcul automatique depuis Facturation OPCO' : 'Saisie manuelle'}
                </span>
              </label>
            </div>

            {autoVentes && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px', fontSize: '12px', color: '#15803d' }}>
                📊 <strong>Comptabilité de trésorerie</strong> — les ventes sont calculées en additionnant tous les <strong>encaissements OPCO</strong> dont la date de paiement tombe dans l'exercice <strong>{exercice}</strong>.
                <br />
                💡 Les valeurs se mettent à jour automatiquement dès que tu enregistres un encaissement dans <a href="/precomptabilite" style={{ color: '#15803d', fontWeight: '700' }}>Facturation OPCO</a>.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 7061 — Pédagogiques */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 80px', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: '#f9fdf9', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d' }}>📚 7061 — Prestations pédagogiques (NPEC)</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    Niveau de prise en charge facturé linéairement sur la durée du contrat
                    {autoVentes && ` · ${ventilationAuto.p7061.count} encaissement${ventilationAuto.p7061.count > 1 ? 's' : ''} en ${exercice}`}
                  </div>
                </div>
                {autoVentes ? (
                  <div style={{ textAlign: 'right', fontSize: '15px', fontWeight: '800', color: '#15803d', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                    {nombreFr(ventes7061)} €
                  </div>
                ) : (
                  <input style={{ ...inputStyle, textAlign: 'right' }} type="number" placeholder="0" value={ventesManuelles.p7061} onChange={e => setVentesManuelles(p => ({ ...p, p7061: e.target.value }))} />
                )}
                {autoVentes && ventilationAuto.p7061.count > 0 ? (
                  <button onClick={() => setDetailModale('7061')} style={{ ...btnSecondary, padding: '6px 8px', fontSize: '11px' }}>👁️ Détail</button>
                ) : <div></div>}
              </div>

              {/* 7062 — 1er équipement */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 80px', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#7c3aed' }}>🎒 7062 — Frais annexes : 1er équipement</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    Forfait OPCO pour équipements pédagogiques individuels (ordinateur, kit...)
                    {autoVentes && ` · ${ventilationAuto.p7062.count} encaissement${ventilationAuto.p7062.count > 1 ? 's' : ''} en ${exercice}`}
                  </div>
                </div>
                {autoVentes ? (
                  <div style={{ textAlign: 'right', fontSize: '15px', fontWeight: '800', color: '#7c3aed', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e9d5ff' }}>
                    {nombreFr(ventes7062)} €
                  </div>
                ) : (
                  <input style={{ ...inputStyle, textAlign: 'right' }} type="number" placeholder="0" value={ventesManuelles.p7062} onChange={e => setVentesManuelles(p => ({ ...p, p7062: e.target.value }))} />
                )}
                {autoVentes && ventilationAuto.p7062.count > 0 ? (
                  <button onClick={() => setDetailModale('7062')} style={{ ...btnSecondary, padding: '6px 8px', fontSize: '11px' }}>👁️ Détail</button>
                ) : <div></div>}
              </div>

              {/* 7063 — Repas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 80px', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: '#fefce8', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#C8A23A' }}>🍽 7063 — Frais annexes : repas / hébergement</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    Forfait OPCO repas et nuitées (nombre réel × forfait)
                    {autoVentes && ` · ${ventilationAuto.p7063.count} encaissement${ventilationAuto.p7063.count > 1 ? 's' : ''} en ${exercice}`}
                  </div>
                </div>
                {autoVentes ? (
                  <div style={{ textAlign: 'right', fontSize: '15px', fontWeight: '800', color: '#C8A23A', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                    {nombreFr(ventes7063)} €
                  </div>
                ) : (
                  <input style={{ ...inputStyle, textAlign: 'right' }} type="number" placeholder="0" value={ventesManuelles.p7063} onChange={e => setVentesManuelles(p => ({ ...p, p7063: e.target.value }))} />
                )}
                {autoVentes && ventilationAuto.p7063.count > 0 ? (
                  <button onClick={() => setDetailModale('7063')} style={{ ...btnSecondary, padding: '6px 8px', fontSize: '11px' }}>👁️ Détail</button>
                ) : <div></div>}
              </div>

              {/* Total 706 */}
              <div style={{ padding: '12px', backgroundColor: '#15803d', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>TOTAL Compte 706 (= 7061 + 7062 + 7063)</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{nombreFr(total706)} €</span>
              </div>
            </div>

            <div style={{ marginTop: '14px', padding: '10px 14px', backgroundColor: '#fef9e7', borderRadius: '8px', fontSize: '11px', color: '#7a5c00', borderLeft: '3px solid #C8A23A' }}>
              ⚠️ <strong>Note comptable</strong> : selon le règlement ANC, toutes les facturations OPCO d'un CFA (NPEC + frais annexes : 1er équipement, repas, mobilité...) sont comptabilisées en <strong>subdivisions du compte 706</strong>. Le ministère du Travail (Précis de l'apprentissage) confirme cette approche.
              <br />
              💡 Si l'OPCO finance un parc d'ordinateurs immobilisé pour tout le CFA (et non pas un ordi par apprenti), c'est différent : ça relève du <strong>compte 755</strong> (contribution financière) ou <strong>131</strong> (subvention d'investissement) à saisir dans le bloc "Autres produits" ci-dessous.
            </div>
          </Card>

          {/* === AUTRES PRODUITS === */}
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#16a34a', marginBottom: '14px' }}>💵 Autres produits (saisie manuelle)</h2>
            <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '11px', color: '#0c4a6e' }}>
              💡 Subventions d'exploitation, contributions financières (compte 755 si OPCO finance un parc équipement CFA), transferts de charges, produits financiers... à compléter depuis ta comptabilité Indy.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PRODUITS_AUTRES_FIELDS.map(f => (
                <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>{f.label}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>{f.help}</div>
                  </div>
                  <input style={{ ...inputStyle, textAlign: 'right' }} type="number" placeholder={f.placeholder} value={produits[f.key] ?? ''} onChange={e => setProduits(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#dcfce7', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#15803d' }}>Total autres produits d'exploitation</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#15803d' }}>{nombreFr(totalProduitsAutres)} €</span>
            </div>
            <div style={{ marginTop: '6px', padding: '10px', backgroundColor: '#15803d', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>TOTAL DES PRODUITS</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: 'white' }}>{nombreFr(totalProduits)} €</span>
            </div>
          </Card>

          {/* === CHARGES === */}
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#e53e3e', marginBottom: '14px' }}>💸 Charges (saisie manuelle)</h2>
            <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '8px', fontSize: '11px', color: '#7a1f1f' }}>
              💡 À compléter depuis Indy — chaque ligne correspond à un compte du PCG.
              <br />🔜 Bientôt : import CSV bancaire avec catégorisation automatique.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {CHARGES_FIELDS.map(f => (
                <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>{f.label}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>{f.help}</div>
                  </div>
                  <input style={{ ...inputStyle, textAlign: 'right' }} type="number" placeholder={f.placeholder} value={charges[f.key] ?? ''} onChange={e => setCharges(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#fde8e8', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#7a1f1f' }}>Total charges d'exploitation</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#7a1f1f' }}>{nombreFr(totalChargesExploit)} €</span>
            </div>
            <div style={{ marginTop: '6px', padding: '10px', backgroundColor: '#7a1f1f', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>TOTAL DES CHARGES</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: 'white' }}>{nombreFr(totalCharges)} €</span>
            </div>
          </Card>

          {/* === RÉSULTAT === */}
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

      {/* ===== INDICATEURS ===== */}
      {onglet === 'indicateurs' && (
        <Card>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '14px' }}>📊 Indicateurs complémentaires</h2>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '14px' }}>Données au 31/12/{exercice} concernant l'activité d'apprentissage.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {INDICATEURS_FIELDS.map(f => (
              <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: COLORS.text }}>{f.label}</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>{f.help}</div>
                </div>
                <input style={{ ...inputStyle, textAlign: 'right' }} type="number" placeholder="0" value={indicateurs[f.key] ?? ''} onChange={e => setIndicateurs(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ===== ANALYTIQUE / UFA ===== */}
      {(onglet === 'analytique' || onglet === 'ufa') && (
        <Card>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '14px' }}>
            {onglet === 'analytique' ? '🔍 Résultat analytique' : '🏫 UFA'}
          </h2>
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: COLORS.background, borderRadius: '10px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>{onglet === 'analytique' ? '🔍' : '🏫'}</div>
            <div style={{ fontSize: '12px', color: '#888', maxWidth: '500px', margin: '0 auto' }}>
              {onglet === 'analytique'
                ? 'À compléter manuellement dans le fichier officiel téléchargé via le bouton "Exporter".'
                : 'PAM OI Formation n\'a pas d\'UFA, cette section est vide.'
              }
            </div>
          </div>
        </Card>
      )}

      {/* === MODALE DÉTAIL === */}
      {detailModale && (
        <div onClick={() => setDetailModale(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', width: '90vw', maxWidth: '900px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>{detailLabel} — Exercice {exercice}</h2>
                <div style={{ fontSize: '12px', color: '#888' }}>{detailEcheances.length} encaissement{detailEcheances.length > 1 ? 's' : ''} pour un total de <strong>{nombreFr(detailTotal)} €</strong></div>
              </div>
              <button onClick={() => setDetailModale(null)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✕ Fermer</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                  <tr style={{ borderBottom: '2px solid ' + COLORS.primary }}>
                    <th style={{ padding: '8px', textAlign: 'left', color: COLORS.primary, fontWeight: '700' }}>Date paiement</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: COLORS.primary, fontWeight: '700' }}>Apprenant</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: COLORS.primary, fontWeight: '700' }}>Formation</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: COLORS.primary, fontWeight: '700' }}>OPCO</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: COLORS.primary, fontWeight: '700' }}>Échéance</th>
                    <th style={{ padding: '8px', textAlign: 'right', color: COLORS.primary, fontWeight: '700' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {detailEcheances.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ padding: '8px' }}>{e.datePaiement}</td>
                      <td style={{ padding: '8px', fontWeight: '600' }}>{e.apprenantPrenom} {e.apprenantNom}</td>
                      <td style={{ padding: '8px' }}>{e.formation}</td>
                      <td style={{ padding: '8px' }}>{e.opco}</td>
                      <td style={{ padding: '8px', fontSize: '11px', color: '#666' }}>{e.label}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>{nombreFr(e.montantPaye)} €</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: COLORS.primary, color: 'white' }}>
                    <td colSpan={5} style={{ padding: '10px', fontWeight: '700' }}>TOTAL {detailModale}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', fontSize: '14px' }}>{nombreFr(detailTotal)} €</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
