'use client';

import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useUser } from '../../lib/UserContext';
import { COLORS } from '../../lib/constants';
import { APPRENANTS_REELS, dateVersIso, calculerAnneeScolaire, deduireSexe, estMineur, verifierConformiteSifa } from '../../data/mockApprenants_reels';
import { REFERENTIEL_FORMATIONS } from '../../data/mockData';
import { getCfaIdentite, getReferentHandicap, CfaIdentite, ReferentHandicapCfa } from '../../lib/cfaConfig';
import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: 'white' };

function anneeScolaireDe(date: Date): string {
  const m = date.getMonth();
  const y = date.getFullYear();
  return m >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function estDansAnneeScolaire(apprenant: any, anneeScol: string): boolean {
  if (!apprenant.dateDebutFormation || !apprenant.dateFinFormation) return false;
  const [an1, an2] = anneeScol.split('-').map(Number);
  if (!an1 || !an2) return false;
  const debutAnnee = new Date(an1, 8, 1);
  const finAnnee = new Date(an2, 7, 31);
  const parts = (s: string) => s.split('/');
  const dDeb = parts(apprenant.dateDebutFormation);
  const dFin = parts(apprenant.dateFinFormation);
  if (dDeb.length !== 3 || dFin.length !== 3) return false;
  const debutForm = new Date(+dDeb[2], +dDeb[1] - 1, +dDeb[0]);
  const finForm = new Date(+dFin[2], +dFin[1] - 1, +dFin[0]);
  return debutForm <= finAnnee && finForm >= debutAnnee;
}

export default function SIFA() {
  const { utilisateur } = useUser();
  const [anneeScolaire, setAnneeScolaire] = useState<string>(() => anneeScolaireDe(new Date()));
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [filtreConformite, setFiltreConformite] = useState<string>('tous');

  // === Lecture dynamique du CFA + référent handicap ===
  const [cfa, setCfa] = useState<CfaIdentite>(() => getCfaIdentite());
  const [referent, setReferent] = useState<ReferentHandicapCfa>(() => getReferentHandicap());

  useEffect(() => {
    const refresh = () => {
      setCfa(getCfaIdentite());
      setReferent(getReferentHandicap());
    };
    refresh();
    window.addEventListener('easycfa-cfa-updated', refresh);
    return () => window.removeEventListener('easycfa-cfa-updated', refresh);
  }, []);

  const anneesScolaires = useMemo(() => {
    const yearNow = new Date().getFullYear();
    const list = [];
    for (let y = yearNow - 3; y <= yearNow + 1; y++) {
      list.push(`${y}-${y + 1}`);
    }
    return list;
  }, []);

  const apprenantsFiltres = useMemo(() => {
    return APPRENANTS_REELS
      .filter(a => !((a as any).archive))
      .filter(a => estDansAnneeScolaire(a, anneeScolaire))
      .map(a => ({
        ...a,
        _conformite: verifierConformiteSifa(a),
      }))
      .filter(a => {
        if (filtreStatut === 'tous') return true;
        if (filtreStatut === 'en_cours') return a.statut === 'En cours';
        if (filtreStatut === 'p2s') return a.statut === 'P2S';
        if (filtreStatut === 'rupture') return a.statut === 'Rupture';
        if (filtreStatut === 'termine') return a.statut === 'Terminé';
        return true;
      })
      .filter(a => {
        if (filtreConformite === 'tous') return true;
        if (filtreConformite === 'conformes') return a._conformite.length === 0;
        if (filtreConformite === 'non_conformes') return a._conformite.length > 0;
        return true;
      });
  }, [anneeScolaire, filtreStatut, filtreConformite]);

  const totalApprenants = apprenantsFiltres.length;
  const conformes = apprenantsFiltres.filter(a => a._conformite.length === 0).length;
  const nonConformes = totalApprenants - conformes;

  function libelleFormation(code: string): string {
    const f = REFERENTIEL_FORMATIONS.find((f: any) => f.id === code);
    return f?.intitule?.replace(/^Titre Professionnel /, '') ?? code;
  }

  function rncpFormation(code: string): string {
    const f = REFERENTIEL_FORMATIONS.find((f: any) => f.id === code);
    return f?.rncp ?? '';
  }

  function dureeFormation(code: string): number {
    const f = REFERENTIEL_FORMATIONS.find((f: any) => f.id === code);
    if (!f?.dureeContrat) return 0;
    const m = f.dureeContrat.match(/(\d+)/);
    return m ? parseInt(m[1]) : 0;
  }

  function exporterSIFA() {
    if (apprenantsFiltres.length === 0) {
      alert('Aucun apprenant à exporter pour cette année scolaire.');
      return;
    }

    if (nonConformes > 0) {
      const ok = confirm(`⚠️ Attention : ${nonConformes} apprenant(s) ont des champs obligatoires SIFA manquants.\n\nL'export sera quand même généré, mais ces données manqueront dans le fichier final.\n\nVeux-tu quand même exporter ?`);
      if (!ok) return;
    }

    const headers = [
      'nom_apprenant *', 'prenom_apprenant *', 'date_de_naissance_apprenant *', 'sexe_apprenant *',
      'code_postal_de_naissance_apprenant', 'email_contact *', 'adresse_apprenant *', 'code_postal_apprenant *',
      'ine_apprenant', 'tel_apprenant', 'rqth_apprenant', 'date_rqth_apprenant',
      'responsable_apprenant_mail1', 'responsable_apprenant_mail2', 'dernier_organisme_uai',
      'derniere_situation', 'type_cfa',
      'etablissement_responsable_uai *', 'etablissement_responsable_siret *',
      'etablissement_formateur_uai *', 'etablissement_formateur_siret *',
      'etablissement_lieu_de_formation_uai', 'etablissement_lieu_de_formation_siret',
      'etablissement_lieu_de_formation_adresse', 'etablissement_lieu_de_formation_code_postal',
      'annee_scolaire *', 'annee_formation *', 'formation_rncp *', 'formation_cfd',
      'date_inscription_formation *', 'date_entree_formation *', 'date_fin_formation *',
      'duree_theorique_formation_mois *', 'libelle_court_formation',
      'obtention_diplome_formation', 'date_obtention_diplome_formation',
      'date_exclusion_formation **', 'cause_exclusion_formation', 'formation_presentielle',
      'nom_referent_handicap_formation', 'prenom_referent_handicap_formation', 'email_referent_handicap_formation',
      'contrat_date_debut **', 'contrat_date_fin **', 'siret_employeur **',
      'contrat_date_rupture **', 'cause_rupture_contrat',
      'contrat_date_debut_2 **', 'contrat_date_fin_2**', 'siret_employeur_2 **',
      'contrat_date_rupture_2 **', 'cause_rupture_contrat_2',
      'contrat_date_debut_3 **', 'contrat_date_fin_3 **', 'siret_employeur_3 **',
      'contrat_date_rupture_3 **', 'cause_rupture_contrat_3',
      'contrat_date_debut_4 **', 'contrat_date_fin_4 **', 'siret_employeur_4 **',
      'contrat_date_rupture_4 **', 'cause_rupture_contrat_4',
    ];

    const rows: any[][] = [headers];
    apprenantsFiltres.forEach(a => {
      const sexe = a.sexe ?? deduireSexe(a);
      const codeFormation = a.formation;
      const dureeMois = dureeFormation(codeFormation);

      rows.push([
        a.nom ?? '',
        a.prenom ?? '',
        dateVersIso(a.dateNaissance ?? ''),
        sexe,
        a.codePostalNaissance ?? '',
        a.email ?? '',
        a.adresse ?? '',
        a.codePostal ?? '',
        a.ine ?? '',
        a.telephone ?? '',
        a.rqth === 'OUI' ? 'OUI' : 'NON',
        a.dateRqth ? dateVersIso(a.dateRqth) : '',
        a.responsableEmail1 ?? a.representantEmail ?? '',
        a.responsableEmail2 ?? '',
        a.dernierOrganismeUai ?? '',
        a.derniereSituationCode ?? '',
        cfa.typeCfa,
        cfa.uai,
        cfa.siret,
        cfa.uai,
        cfa.siret,
        cfa.uai,
        cfa.siret,
        cfa.adresse1,
        cfa.codePostal,
        anneeScolaire,
        '1',
        rncpFormation(codeFormation).replace('RNCP', ''),
        '',
        dateVersIso(a.dateDebutFormation ?? a.dateDebutContrat ?? ''),
        dateVersIso(a.dateDebutFormation ?? ''),
        dateVersIso(a.dateFinFormation ?? ''),
        dureeMois,
        libelleFormation(codeFormation),
        a.statut === 'Terminé' ? 'OUI' : '',
        '',
        '',
        '',
        'presentiel',
        referent.nom,
        referent.prenom,
        referent.email,
        dateVersIso(a.dateDebutContrat ?? ''),
        dateVersIso(a.dateFinContrat ?? ''),
        '',
        a.dateRupture ? dateVersIso(a.dateRupture) : '',
        a.dateRupture ? 'rupture' : '',
        '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '',
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Modèle');

    const descRows: any[][] = [
      ['', 'Nom du champ', 'Obligatoire', 'Description', 'Format', 'Exemple'],
      ['Informations concernant l\'apprenant', 'nom_apprenant *', 'Oui', 'Nom de famille (nom d\'usage)', 'Alpha', 'Dupuis'],
      ['', 'prenom_apprenant *', 'Oui', 'Prénom (uniquement le premier)', 'Alpha', 'Gaston'],
      ['', 'date_de_naissance_apprenant *', 'Oui', 'Date de naissance', 'AAAA-MM-JJ', '1998-01-24'],
      ['', 'sexe_apprenant *', 'Oui', 'Genre/sexe', 'M ou F', 'F'],
    ];
    const wsDesc = XLSX.utils.aoa_to_sheet(descRows);
    XLSX.utils.book_append_sheet(wb, wsDesc, 'Description des données');

    XLSX.writeFile(wb, `SIFA_PAM_OI_${anneeScolaire}.xlsx`);
  }

  return (
    <div>
      <PageHeader title="📊 SIFA" subtitle="Système d'Information sur la Formation des Apprentis — déclaration annuelle" />

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Année scolaire</label>
              <select style={{ ...inputStyle, width: '160px' }} value={anneeScolaire} onChange={e => setAnneeScolaire(e.target.value)}>
                {anneesScolaires.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Statut</label>
              <select style={{ ...inputStyle, width: '140px' }} value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
                <option value="tous">Tous</option>
                <option value="en_cours">En cours</option>
                <option value="p2s">P2S</option>
                <option value="rupture">Rupture</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Conformité</label>
              <select style={{ ...inputStyle, width: '160px' }} value={filtreConformite} onChange={e => setFiltreConformite(e.target.value)}>
                <option value="tous">Tous</option>
                <option value="conformes">✅ Conformes</option>
                <option value="non_conformes">⚠️ Non conformes</option>
              </select>
            </div>
          </div>
          <button onClick={exporterSIFA} style={btnPrimary}>📥 Exporter au format SIFA (.xlsx)</button>
        </div>

        <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '12px', color: '#555' }}>
          💡 Déclaration SIFA à transmettre <strong>fin novembre</strong> au ministère de l'Éducation Nationale.
          {' '}Référent handicap : <strong>{referent.prenom} {referent.nom}</strong> ({referent.email}) — modifiable dans <a href="/parametres" style={{ color: COLORS.primary }}>Paramètres CFA</a>.
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <Card>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>Apprenants concernés</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: COLORS.primary, marginTop: '4px' }}>{totalApprenants}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>pour l'année scolaire {anneeScolaire}</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>✅ Conformes SIFA</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
            {conformes}
            <span style={{ fontSize: '14px', color: '#888', fontWeight: '600', marginLeft: '8px' }}>/ {totalApprenants}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>tous les champs obligatoires remplis</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>⚠️ Non conformes</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: nonConformes > 0 ? '#e53e3e' : '#16a34a', marginTop: '4px' }}>{nonConformes}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>champs SIFA manquants</div>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Apprenants pour la déclaration SIFA</h2>
          <div style={{ fontSize: '11px', color: '#888' }}>
            ⚪ optionnel · 🟢 conforme · 🔴 manquant
          </div>
        </div>

        {apprenantsFiltres.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Aucun apprenant pour cette année scolaire</div>
            <div style={{ fontSize: '12px' }}>Vérifie le filtre ou change d'année scolaire.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: COLORS.primary, color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Apprenant</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Formation</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Statut</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Sexe</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>INE</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Resp. légal</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Conformité SIFA</th>
                </tr>
              </thead>
              <tbody>
                {apprenantsFiltres.map(a => {
                  const conformite = a._conformite;
                  const mineur = estMineur(a);
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px' }}>
                        <a href={`/apprenants/${a.id}`} style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: '600' }}>
                          {a.nom} {a.prenom}
                        </a>
                        <div style={{ fontSize: '10px', color: '#888' }}>{a.dateNaissance} {mineur && '👶 Mineur'}</div>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: '600' }}>{a.formation}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>{a.entreprise || 'P2S — sans entreprise'}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: a.statut === 'En cours' ? '#e6f4f1' : a.statut === 'P2S' ? '#fef6e4' : a.statut === 'Rupture' ? '#fde8e8' : '#f0f0f0', color: a.statut === 'En cours' ? '#006B68' : a.statut === 'P2S' ? '#C8A23A' : a.statut === 'Rupture' ? '#e53e3e' : '#666', padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>{a.statut}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {a.sexe ? (
                          <span style={{ color: '#16a34a', fontWeight: '700' }}>✅ {a.sexe}</span>
                        ) : (
                          <span style={{ color: '#e53e3e', fontWeight: '700' }} title="Sexe non renseigné">🔴 ?</span>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {a.ine ? <span style={{ color: '#16a34a' }}>✅</span> : <span style={{ color: '#888' }}>⚪</span>}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {(a.responsableEmail1 || a.representantEmail) ? (
                          <span style={{ color: '#16a34a' }}>✅</span>
                        ) : mineur ? (
                          <span style={{ color: '#e53e3e', fontWeight: '700' }} title="Obligatoire pour mineur">🔴</span>
                        ) : (
                          <span style={{ color: '#888' }}>⚪</span>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {conformite.length === 0 ? (
                          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                            ✅ Conforme
                          </span>
                        ) : (
                          <span title={`Champs manquants : ${conformite.join(', ')}`} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', cursor: 'help' }}>
                            ⚠️ {conformite.length} manquant{conformite.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {nonConformes > 0 && (
        <Card style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#e53e3e', marginBottom: '12px' }}>
            ⚠️ Détail des champs manquants ({nonConformes} apprenants concernés)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {apprenantsFiltres.filter(a => a._conformite.length > 0).map(a => (
              <div key={a.id} style={{ padding: '8px 12px', backgroundColor: '#fef6e4', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div>
                  <a href={`/apprenants/${a.id}`} style={{ color: COLORS.primary, fontWeight: '700', textDecoration: 'none', fontSize: '12px' }}>
                    {a.nom} {a.prenom}
                  </a>
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: '#7a5c00' }}>
                    Manque : {a._conformite.join(', ')}
                  </span>
                </div>
                <a href={`/apprenants/${a.id}`} style={{ ...btnSecondary, fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}>
                  ✏️ Compléter
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
