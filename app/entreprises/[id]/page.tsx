'use client';
import React, { useState } from 'react';
import { ENTREPRISES_REELS } from '../../../data/mockEntreprises_reels';
import { APPRENANTS_REELS } from '../../../data/mockApprenants_reels';
import { COLORS } from '../../../lib/constants';
import Card from '../../../components/Card';
import StatCard from '../../../components/StatCard';

const DOC_STATUT: Record<string, { bg: string; color: string }> = {
  'Disponible': { bg: '#e6f4f1', color: '#006B68' },
  'À importer': { bg: '#fde8e8', color: '#e53e3e' },
  'À envoyer':  { bg: '#fef6e4', color: '#C8A23A' },
  'Signé':      { bg: '#b8ddd9', color: '#004744' },
};

const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

function InfoRow({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: alert ? '#e53e3e' : COLORS.text, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

export default function FicheEntreprise({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const e = ENTREPRISES_REELS.find(ent => ent.id === id);
  const [modeEdition, setModeEdition] = useState(false);
  const [form, setForm] = useState<any>(e ?? {});

  function genererMandat() {
    const a = document.createElement('a');
    a.href = '/modeles/Mandat_Recrutement.pdf';
    a.download = 'Mandat_' + (form.raisonSociale ?? 'entreprise') + '.pdf';
    a.click();
  }

  function sauvegarder() {
    localStorage.setItem('entreprise_' + id, JSON.stringify(form));
    setModeEdition(false);
  }

  if (!e) return (
    <div style={{ padding: '32px' }}>
      <a href="/entreprises" style={{ color: COLORS.primary, fontWeight: '600', textDecoration: 'none' }}>← Retour aux entreprises</a>
      <p style={{ marginTop: '16px', color: COLORS.textMuted }}>Entreprise introuvable.</p>
    </div>
  );

  return (
    <div>
      <a href="/entreprises" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
        ← Retour aux entreprises
      </a>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '16px 0 24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: COLORS.primary }}>{e.raisonSociale}</h1>
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
          <button onClick={() => setModeEdition(!modeEdition)} style={modeEdition ? btnPrimary : btnSecondary}>
            {modeEdition ? '✅ Enregistrer' : '✏️ Modifier'}
          </button>
        
          <button onClick={genererMandat} style={btnPrimary}>
            📄 Générer mandat
          </button>
        </div>
      </div>

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
{[{ label: 'OPCO', value: e.opco }, { label: 'IDCC', value: e.idcc }].map((s) => <StatCard key={s.label} {...s} />)}
          </div>
          <Card>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>Récapitulatif apprentis</h2>
            {(() => {
              const tous = APPRENANTS_REELS.filter(a => a.entreprise === e.raisonSociale);
              const enCours = tous.filter(a => a.statut === 'En cours');
              const p2s = tous.filter(a => a.statut === 'P2S');
              const rupture = tous.filter(a => a.statut === 'Rupture');
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
                  <div style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>📊 Total (données importées)</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#555' }}>{tous.length}</span>
                  </div>
                  <div style={{ marginTop: '4px', padding: '8px 10px', backgroundColor: '#fffbf0', borderRadius: '6px', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                    ℹ️ Les dossiers 2023-2024 (terminés au 31/12/2024) ne sont pas inclus dans ce récapitulatif.
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      </div>

      {/* BLOC CERFA ENTREPRISE */}
      <Card style={{ marginBottom: '24px', borderTop: `4px solid ${COLORS.secondary}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>
            Informations CERFA employeur
          </h2>
          <span style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
            Obligatoire CERFA apprentissage
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>

          {/* Colonne 1 — Identification */}
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '12px', paddingBottom: '6px', borderBottom: `2px solid ${COLORS.backgroundGold}` }}>
              Identification
            </h3>
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

          {/* Colonne 2 — Convention et OPCO */}
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '12px', paddingBottom: '6px', borderBottom: `2px solid ${COLORS.backgroundGold}` }}>
              Convention collective et OPCO
            </h3>
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

          {/* Colonne 3 — Contacts RH */}
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: '12px', paddingBottom: '6px', borderBottom: `2px solid ${COLORS.backgroundGold}` }}>
              Contacts RH
            </h3>
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

            {/* Alerte si champs manquants */}
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6f4f1', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                ✅ Données CERFA complètes
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                Tous les champs obligatoires sont renseignés pour cette entreprise.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tuteurs */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Tuteurs / maîtres d'apprentissage
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              {['Nom', 'Fonction', 'Email', 'Téléphone', 'Apprentis suivis', 'Statut'].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modeEdition ? (
              <tr>
                <td colSpan={6} style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { label: 'Nom', champ: 'tuteurNom' },
                      { label: 'Prénom', champ: 'tuteurPrenom' },
                      { label: 'Fonction', champ: 'tuteurFonction' },
                      { label: 'Email', champ: 'tuteurEmail' },
                      { label: 'Téléphone', champ: 'tuteurTelephone' },
                      { label: 'Niveau diplôme', champ: 'tuteurNiveauDiplome' },
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
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{e.tuteurFonction}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{e.tuteurEmail}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{e.tuteurTelephone}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{e.tuteurNiveauDiplome}</td>
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
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Apprentis rattachés
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              {['Nom', 'Prénom', 'Session', 'Formation', 'Début', 'Fin', 'Statut', 'Action'].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {APPRENANTS_REELS.filter(a => a.entreprise === e.raisonSociale).length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted, fontStyle: 'italic' }}>Aucun apprenti rattaché</td></tr>
            ) : APPRENANTS_REELS.filter(a => a.entreprise === e.raisonSociale).map((a, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '700' }}>{a.nom}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{a.prenom}</td>
                <td style={{ padding: '12px', fontSize: '12px', color: COLORS.primary, fontWeight: '600' }}>{a.session || '—'}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{a.formation}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{a.dateDebutContrat || '—'}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: COLORS.textMuted }}>{a.dateFinContrat || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: '#e6f4f1', color: '#006B68', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{a.statut}</span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <a href={`/apprenants/${a.id}`} style={{ backgroundColor: COLORS.background, color: COLORS.primary, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>Voir</a>
                      <a href={`/documents/convention?apprenant=${a.id}`} style={{ backgroundColor: COLORS.backgroundGold, color: COLORS.secondary, borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>📄 Générer convention</a>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'convention_signee', label: '📝 Convention signée' },
                        { id: 'contrat_signe', label: '📋 Contrat signé' },
                        { id: 'apc_opco', label: '💰 APC OPCO' },
                      ].map(doc => {
                        const saved = typeof window !== 'undefined' ? localStorage.getItem('doc_' + doc.id + '_' + a.id) : null;
                        const fichier = saved ? JSON.parse(saved) : null;
                        return (
                          <label key={doc.id} style={{ backgroundColor: fichier ? '#e6f4f1' : '#f0f0f0', color: fichier ? COLORS.primary : '#555', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'inline-block', whiteSpace: 'nowrap' }}
                            title={fichier ? `✅ ${fichier.nom}` : 'Importer'}>
                            {fichier ? '✅ ' : '⬆ '}{doc.label}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                              const f = ev.target.files?.[0];
                              if (f) {
                                const taille = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(f.size / 1024)} Ko`;
                                const docData = JSON.stringify({ nom: f.name, taille, date: new Date().toLocaleDateString('fr-FR') });
                                // Sauvegarder dans la fiche entreprise
                                localStorage.setItem('doc_' + doc.id + '_' + a.id, docData);
                                // Lier automatiquement à la fiche apprenant si contrat signé
                                if (doc.id === 'contrat_signe') {
                                  const ficheApprenant = JSON.parse(localStorage.getItem('apprenant_' + a.id) ?? '{}');
                                  ficheApprenant['piece_contrat'] = { nom: f.name, taille, date: new Date().toLocaleDateString('fr-FR'), source: 'Importé depuis fiche entreprise' };
                                  localStorage.setItem('apprenant_' + a.id, JSON.stringify(ficheApprenant));
                                }
                                // Lier convention signée à la fiche apprenant aussi
                                if (doc.id === 'convention_signee') {
                                  const ficheApprenant = JSON.parse(localStorage.getItem('apprenant_' + a.id) ?? '{}');
                                  ficheApprenant['piece_convention'] = { nom: f.name, taille, date: new Date().toLocaleDateString('fr-FR'), source: 'Importé depuis fiche entreprise' };
                                  localStorage.setItem('apprenant_' + a.id, JSON.stringify(ficheApprenant));
                                }
                                alert('✅ Document importé pour ' + a.prenom + ' ' + a.nom + (doc.id === 'contrat_signe' || doc.id === 'convention_signee' ? ' et lié automatiquement à sa fiche apprenant.' : '.'));
                              }
                            }} />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Pièces justificatives entreprise */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>📎 Pièces justificatives entreprise</h2>
          <span style={{ fontSize: '12px', color: '#888' }}>Formats acceptés : PDF, JPG, PNG — Max 5 Mo</span>
        </div>
        {[
          { id: 'fiche_renseignement', label: 'Fiche de renseignement', detail: 'Fiche employeur complétée et signée', obligatoire: true },
          { id: 'kbis', label: 'Extrait KBIS', detail: 'Moins de 3 mois', obligatoire: true },
          { id: 'mandat_signe', label: 'Mandat de recrutement signé', detail: 'Mandat signé par le recruteur final', obligatoire: false },
        ].map((piece) => {
          const fichier = (e as any)['piece_' + piece.id];
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
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e_input) => {
                  const f = e_input.target.files?.[0];
                  if (f) {
                    const taille = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(f.size / 1024)} Ko`;
                    const key = 'entreprise_' + e.id;
                    const saved = JSON.parse(localStorage.getItem(key) ?? '{}');
                    saved['piece_' + piece.id] = { nom: f.name, taille };
                    localStorage.setItem(key, JSON.stringify(saved));
                  }
                }} />
              </label>
            </div>
          );
        })}
        <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '12px', color: '#555' }}>
          📊 Dossier complet quand les pièces obligatoires sont importées
        </div>
      </Card>
    </div>
  );
}