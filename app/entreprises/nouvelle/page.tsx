'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS } from '../../../lib/constants';

const SECTIONS = [
  { id: 'identite', label: '🏢 Identification', description: 'Infos légales entreprise' },
  { id: 'cerfa', label: '📋 CERFA employeur', description: 'Données contrat apprentissage' },
  { id: 'contacts', label: '👥 Contacts', description: 'Dirigeant, tuteur, RH' },
  { id: 'convention', label: '📄 Convention', description: 'Paramètres de facturation' },
];

const inputStyle: React.CSSProperties = {
  border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '10px 12px',
  fontSize: '13px', width: '100%', color: '#1a1a1a', backgroundColor: 'white',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', color: '#888', textTransform: 'uppercase',
  fontWeight: '600', display: 'block', marginBottom: '6px',
};

function Champ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Grille({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px' }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px', paddingBottom: '8px', borderBottom: `2px solid ${COLORS.background}` }}>
      {children}
    </h3>
  );
}

export default function NouvelleEntreprise() {
  const router = useRouter();
  const [section, setSection] = useState('identite');
  const [sauvegarde, setSauvegarde] = useState(false);

  const [form, setForm] = useState({
    // Identification
    raisonSociale: '',
    siret: '',
    codeApe: '',
    libelleApe: '',
    formeJuridique: '',
    effectif: '',
    adresse: '',
    codePostal: '',
    ville: '',
    pays: 'France',
    telephone: '',
    email: '',
    siteWeb: '',
    // CERFA employeur
    idcc: '',
    libelleConventionCollective: '',
    opco: '',
    faf: '',
    caisseRetraite: '',
    caisseCongesPayes: '',
    regimePrevoyance: '',
    regimeProtectionSociale: '10',
    secteur: 'prive',
    employeurPublic: 'non',
    travailDangereux: 'non',
    // Contacts
    dirigeantCivilite: '',
    dirigeantNom: '',
    dirigeantPrenom: '',
    dirigeantFonction: '',
    dirigeantTelephone: '',
    dirigeantEmail: '',
    tuteurCivilite: '',
    tuteurNom: '',
    tuteurPrenom: '',
    tuteurFonction: '',
    tuteurTelephone: '',
    tuteurEmail: '',
    tuteurNiveauDiplome: '',
    tuteurAnneeExperience: '',
    rhNom: '',
    rhTelephone: '',
    rhEmail: '',
    // Convention
    opcoContact: '',
    opcoNumeroAdherent: '',
    facturationEmail: '',
    iban: '',
    bic: '',
    mandatSepa: 'non',
    tarifHoraire: '',
    notes: '',
  });

  function update(champ: string, valeur: string) {
    setForm(prev => ({ ...prev, [champ]: valeur }));
  }

  const sectionsCompletees: Record<string, boolean> = {
    identite: !!(form.raisonSociale && form.siret && form.adresse && form.codePostal && form.ville),
    cerfa: !!(form.idcc && form.opco && form.regimeProtectionSociale),
    contacts: !!(form.dirigeantNom && form.tuteurNom && form.tuteurTelephone),
    convention: !!(form.facturationEmail),
  };

  const nbCompletes = Object.values(sectionsCompletees).filter(Boolean).length;
  const progression = Math.round((nbCompletes / SECTIONS.length) * 100);

  function sauvegarder() {
    setSauvegarde(true);
    setTimeout(() => router.push('/entreprises'), 1500);
  }

  const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
  const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <a href="/entreprises" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>← Retour aux entreprises</a>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px', marginTop: '8px' }}>Nouvelle entreprise</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>Fiche employeur — Informations CERFA apprentissage</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', marginRight: '8px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Progression</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: progression === 100 ? COLORS.primary : COLORS.secondary }}>{progression}%</div>
          </div>
          <button onClick={sauvegarder} style={btnPrimary}>✅ Enregistrer</button>
        </div>
      </div>

      {sauvegarde && (
        <div style={{ padding: '14px 16px', backgroundColor: '#e6f4f1', border: '2px solid #006B68', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          ✅ Entreprise enregistrée avec succès ! Redirection en cours...
        </div>
      )}

      {/* Barre progression */}
      <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', height: '6px', marginBottom: '24px' }}>
        <div style={{ width: `${progression}%`, backgroundColor: progression === 100 ? COLORS.primary : COLORS.secondary, borderRadius: '4px', height: '6px', transition: 'width 0.5s' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>

        {/* Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SECTIONS.map((s) => {
            const complete = sectionsCompletees[s.id];
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', backgroundColor: active ? COLORS.background : 'white', border: active ? `2px solid ${COLORS.primary}` : '2px solid #e0e0e0', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: active ? COLORS.primary : '#333' }}>{s.label}</span>
                  <span style={{ fontSize: '16px' }}>{complete ? '✅' : '⏳'}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{s.description}</div>
              </button>
            );
          })}

          <div style={{ marginTop: '8px', padding: '12px', backgroundColor: COLORS.background, borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>Sections complètes</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: COLORS.primary }}>{nbCompletes}/{SECTIONS.length}</div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
              {progression === 100 ? '🎉 Fiche complète !' : `${SECTIONS.length - nbCompletes} section(s) restante(s)`}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

          {/* ===== IDENTIFICATION ===== */}
          {section === 'identite' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary }}>🏢 Identification de l'entreprise</h2>

              <Champ label="Raison sociale" required>
                <input style={inputStyle} value={form.raisonSociale} onChange={e => update('raisonSociale', e.target.value.toUpperCase())} placeholder="RAISON SOCIALE" />
              </Champ>

              <Grille cols={2}>
                <Champ label="Numéro SIRET" required>
                  <input style={inputStyle} value={form.siret} onChange={e => update('siret', e.target.value)} placeholder="XXX XXX XXX XXXXX" maxLength={14} />
                </Champ>
                <Champ label="Forme juridique">
                  <select style={inputStyle} value={form.formeJuridique} onChange={e => update('formeJuridique', e.target.value)}>
                    <option value="">Choisir...</option>
                    <option value="EI">Entreprise individuelle (EI)</option>
                    <option value="EIRL">EIRL</option>
                    <option value="EURL">EURL</option>
                    <option value="SARL">SARL</option>
                    <option value="SAS">SAS</option>
                    <option value="SASU">SASU</option>
                    <option value="SA">SA</option>
                    <option value="SNC">SNC</option>
                    <option value="Association">Association (loi 1901)</option>
                    <option value="Collectivite">Collectivité territoriale</option>
                    <option value="Etablissement public">Établissement public</option>
                    <option value="UNIFORMATION">UNIFORMATION (Cohésion sociale)</option>
                    <option value="Autre">Autre</option>
                  </select>
                </Champ>
              </Grille>

              <Grille cols={2}>
                <Champ label="Code APE / NAF" required>
                  <input style={inputStyle} value={form.codeApe} onChange={e => update('codeApe', e.target.value)} placeholder="Ex: 8559A" maxLength={5} />
                </Champ>
                <Champ label="Libellé activité principale">
                  <input style={inputStyle} value={form.libelleApe} onChange={e => update('libelleApe', e.target.value)} placeholder="Ex: Formation continue d'adultes" />
                </Champ>
              </Grille>

              <Champ label="Effectif de l'entreprise">
                <select style={inputStyle} value={form.effectif} onChange={e => update('effectif', e.target.value)}>
                  <option value="">Choisir...</option>
                  <option value="1">1 à 4 salariés</option>
                  <option value="2">5 à 9 salariés</option>
                  <option value="3">10 à 19 salariés</option>
                  <option value="4">20 à 49 salariés</option>
                  <option value="5">50 à 99 salariés</option>
                  <option value="6">100 à 249 salariés</option>
                  <option value="7">250 salariés et plus</option>
                </select>
              </Champ>

              <SectionTitle>Adresse du siège social</SectionTitle>

              <Champ label="Adresse" required>
                <input style={inputStyle} value={form.adresse} onChange={e => update('adresse', e.target.value)} placeholder="Numéro et nom de rue" />
              </Champ>

              <Grille cols={3}>
                <Champ label="Code postal" required>
                  <input style={inputStyle} value={form.codePostal} onChange={e => update('codePostal', e.target.value)} placeholder="97400" />
                </Champ>
                <div style={{ gridColumn: 'span 2' }}>
                  <Champ label="Ville" required>
                    <input style={inputStyle} value={form.ville} onChange={e => update('ville', e.target.value)} placeholder="Saint-Denis" />
                  </Champ>
                </div>
              </Grille>

              <Grille cols={3}>
                <Champ label="Téléphone">
                  <input style={inputStyle} value={form.telephone} onChange={e => update('telephone', e.target.value)} placeholder="02 62 XX XX XX" />
                </Champ>
                <Champ label="Email général">
                  <input type="email" style={inputStyle} value={form.email} onChange={e => update('email', e.target.value)} placeholder="contact@entreprise.fr" />
                </Champ>
                <Champ label="Site web">
                  <input style={inputStyle} value={form.siteWeb} onChange={e => update('siteWeb', e.target.value)} placeholder="www.entreprise.fr" />
                </Champ>
              </Grille>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setSection('cerfa')} style={btnPrimary}>Section suivante →</button>
              </div>
            </div>
          )}

          {/* ===== CERFA EMPLOYEUR ===== */}
          {section === 'cerfa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary }}>📋 Informations CERFA employeur</h2>

              <SectionTitle>Convention collective et branche</SectionTitle>

              <Grille cols={2}>
                <Champ label="IDCC — Code convention collective" required>
                  <input style={inputStyle} value={form.idcc} onChange={e => update('idcc', e.target.value)} placeholder="Ex: 0016" maxLength={4} />
                </Champ>
                <Champ label="Libellé de la convention collective">
                  <input style={inputStyle} value={form.libelleConventionCollective} onChange={e => update('libelleConventionCollective', e.target.value)} placeholder="Ex: Commerce de détail" />
                </Champ>
              </Grille>

              <Grille cols={2}>
                <Champ label="OPCO de rattachement" required>
                  <select style={inputStyle} value={form.opco} onChange={e => update('opco', e.target.value)}>
                    <option value="">Choisir...</option>
                    <option value="AKTO">AKTO (Services à forte intensité de main d'oeuvre)</option>
                    <option value="AFDAS">AFDAS (Culture, communication, médias)</option>
                    <option value="ATLAS">ATLAS (Finance, conseil, expertise)</option>
                    <option value="CONSTRUCTYS">CONSTRUCTYS (Construction)</option>
                    <option value="EP">OPCO EP (Entreprises de proximité)</option>
                    <option value="MOBILITES">OPCO Mobilités (Transport)</option>
                    <option value="2I">OPCO 2i (Industries)</option>
                    <option value="SANTE">OPCO Santé</option>
                    <option value="UNIFORMATION">UNIFORMATION (Cohésion sociale)</option>
                    <option value="OCAPIAT">OCAPIAT (Agriculture)</option>
                    <option value="OPCOMMERCE">OPCOMMERCE (Commerce)</option>
                    <option value="FIF-PL">FIF-PL (Professions libérales)</option>
                    <option value="Autre">Autre</option>
                  </select>
                </Champ>
                <Champ label="FAF (Fonds d'Assurance Formation)">
                  <input style={inputStyle} value={form.faf} onChange={e => update('faf', e.target.value)} placeholder="Si applicable" />
                </Champ>
              </Grille>

              <SectionTitle>Régime et protection sociale</SectionTitle>

              <Grille cols={2}>
                <Champ label="Régime de protection sociale" required>
                  <select style={inputStyle} value={form.regimeProtectionSociale} onChange={e => update('regimeProtectionSociale', e.target.value)}>
                    <option value="10">Régime général de Sécurité Sociale</option>
                    <option value="20">MSA (Agriculture)</option>
                    <option value="30">Régime spécial SNCF</option>
                    <option value="40">Régime spécial RATP</option>
                    <option value="50">Régime spécial Mines</option>
                    <option value="60">Régime spécial Marine marchande</option>
                    <option value="70">Régime Militaires</option>
                    <option value="80">Fonctionnaires civils de l'État</option>
                    <option value="90">Collectivités locales — CNRACL</option>
                  </select>
                </Champ>
                <Champ label="Caisse de retraite complémentaire">
                  <input style={inputStyle} value={form.caisseRetraite} onChange={e => update('caisseRetraite', e.target.value)} placeholder="Ex: AGIRC-ARRCO" />
                </Champ>
              </Grille>

              <Grille cols={2}>
                <Champ label="Caisse de congés payés">
                  <input style={inputStyle} value={form.caisseCongesPayes} onChange={e => update('caisseCongesPayes', e.target.value)} placeholder="Si applicable (BTP...)" />
                </Champ>
                <Champ label="Régime de prévoyance">
                  <input style={inputStyle} value={form.regimePrevoyance} onChange={e => update('regimePrevoyance', e.target.value)} placeholder="Nom de l'organisme" />
                </Champ>
              </Grille>

              <SectionTitle>Caractéristiques de l'employeur</SectionTitle>

              <Grille cols={3}>
                <Champ label="Secteur">
                  <select style={inputStyle} value={form.secteur} onChange={e => update('secteur', e.target.value)}>
                    <option value="prive">Secteur privé</option>
                    <option value="public">Secteur public</option>
                  </select>
                </Champ>
                <Champ label="Employeur public">
                  <select style={inputStyle} value={form.employeurPublic} onChange={e => update('employeurPublic', e.target.value)}>
                    <option value="non">Non</option>
                    <option value="oui">Oui</option>
                  </select>
                </Champ>
                <Champ label="Travaux dangereux (mineur)">
                  <select style={inputStyle} value={form.travailDangereux} onChange={e => update('travailDangereux', e.target.value)}>
                    <option value="non">Non</option>
                    <option value="oui">Oui — dérogation nécessaire</option>
                  </select>
                </Champ>
              </Grille>

              {form.travailDangereux === 'oui' && (
                <div style={{ padding: '12px 16px', backgroundColor: '#fde8e8', borderRadius: '8px', borderLeft: '4px solid #e53e3e', fontSize: '13px', color: '#c53030', fontWeight: '600' }}>
                  ⚠️ Travaux dangereux — Une dérogation préfectorale est nécessaire pour les apprentis mineurs. Contacter la DREETS.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => setSection('identite')} style={btnSecondary}>← Section précédente</button>
                <button onClick={() => setSection('contacts')} style={btnPrimary}>Section suivante →</button>
              </div>
            </div>
          )}

          {/* ===== CONTACTS ===== */}
          {section === 'contacts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary }}>👥 Contacts de l'entreprise</h2>

              <SectionTitle>Dirigeant / Signataire du contrat</SectionTitle>

              <Grille cols={3}>
                <Champ label="Civilité">
                  <select style={inputStyle} value={form.dirigeantCivilite} onChange={e => update('dirigeantCivilite', e.target.value)}>
                    <option value="">...</option>
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                  </select>
                </Champ>
                <Champ label="Nom" required>
                  <input style={inputStyle} value={form.dirigeantNom} onChange={e => update('dirigeantNom', e.target.value.toUpperCase())} placeholder="NOM" />
                </Champ>
                <Champ label="Prénom">
                  <input style={inputStyle} value={form.dirigeantPrenom} onChange={e => update('dirigeantPrenom', e.target.value)} placeholder="Prénom" />
                </Champ>
              </Grille>

              <Grille cols={3}>
                <Champ label="Fonction / Qualité">
                  <input style={inputStyle} value={form.dirigeantFonction} onChange={e => update('dirigeantFonction', e.target.value)} placeholder="Ex: Gérant, DRH..." />
                </Champ>
                <Champ label="Téléphone direct">
                  <input style={inputStyle} value={form.dirigeantTelephone} onChange={e => update('dirigeantTelephone', e.target.value)} placeholder="06 XX XX XX XX" />
                </Champ>
                <Champ label="Email direct">
                  <input type="email" style={inputStyle} value={form.dirigeantEmail} onChange={e => update('dirigeantEmail', e.target.value)} placeholder="dirigeant@entreprise.fr" />
                </Champ>
              </Grille>

              <SectionTitle>Maître d'apprentissage / Tuteur</SectionTitle>

              <div style={{ padding: '10px 14px', backgroundColor: '#fef6e4', borderRadius: '8px', fontSize: '12px', color: '#7a5c00', marginBottom: '4px' }}>
                💡 Le maître d'apprentissage doit justifier d'une expérience professionnelle de 2 ans minimum et d'un niveau de qualification suffisant.
              </div>

              <Grille cols={3}>
                <Champ label="Civilité">
                  <select style={inputStyle} value={form.tuteurCivilite} onChange={e => update('tuteurCivilite', e.target.value)}>
                    <option value="">...</option>
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                  </select>
                </Champ>
                <Champ label="Nom" required>
                  <input style={inputStyle} value={form.tuteurNom} onChange={e => update('tuteurNom', e.target.value.toUpperCase())} placeholder="NOM" />
                </Champ>
                <Champ label="Prénom">
                  <input style={inputStyle} value={form.tuteurPrenom} onChange={e => update('tuteurPrenom', e.target.value)} placeholder="Prénom" />
                </Champ>
              </Grille>

              <Grille cols={3}>
                <Champ label="Fonction dans l'entreprise">
                  <input style={inputStyle} value={form.tuteurFonction} onChange={e => update('tuteurFonction', e.target.value)} placeholder="Ex: Comptable, RH..." />
                </Champ>
                <Champ label="Téléphone" required>
                  <input style={inputStyle} value={form.tuteurTelephone} onChange={e => update('tuteurTelephone', e.target.value)} placeholder="06 XX XX XX XX" />
                </Champ>
                <Champ label="Email">
                  <input type="email" style={inputStyle} value={form.tuteurEmail} onChange={e => update('tuteurEmail', e.target.value)} placeholder="tuteur@entreprise.fr" />
                </Champ>
              </Grille>

              <Grille cols={2}>
                <Champ label="Niveau de diplôme du tuteur">
                  <select style={inputStyle} value={form.tuteurNiveauDiplome} onChange={e => update('tuteurNiveauDiplome', e.target.value)}>
                    <option value="">Choisir...</option>
                    <option value="3">Niveau 3 — CAP/BEP</option>
                    <option value="4">Niveau 4 — BAC</option>
                    <option value="5">Niveau 5 — BAC+2</option>
                    <option value="6">Niveau 6 — Licence</option>
                    <option value="7">Niveau 7 — Master</option>
                    <option value="8">Niveau 8 — Doctorat</option>
                  </select>
                </Champ>
                <Champ label="Années d'expérience professionnelle">
                  <input style={inputStyle} value={form.tuteurAnneeExperience} onChange={e => update('tuteurAnneeExperience', e.target.value)} placeholder="Ex: 5 ans" />
                </Champ>
              </Grille>

              <SectionTitle>Contact RH (optionnel)</SectionTitle>

              <Grille cols={3}>
                <Champ label="Nom du contact RH">
                  <input style={inputStyle} value={form.rhNom} onChange={e => update('rhNom', e.target.value)} placeholder="Nom Prénom" />
                </Champ>
                <Champ label="Téléphone RH">
                  <input style={inputStyle} value={form.rhTelephone} onChange={e => update('rhTelephone', e.target.value)} placeholder="06 XX XX XX XX" />
                </Champ>
                <Champ label="Email RH">
                  <input type="email" style={inputStyle} value={form.rhEmail} onChange={e => update('rhEmail', e.target.value)} placeholder="rh@entreprise.fr" />
                </Champ>
              </Grille>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => setSection('cerfa')} style={btnSecondary}>← Section précédente</button>
                <button onClick={() => setSection('convention')} style={btnPrimary}>Section suivante →</button>
              </div>
            </div>
          )}

          {/* ===== CONVENTION ===== */}
          {section === 'convention' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary }}>📄 Convention et facturation</h2>

              <SectionTitle>Contact OPCO</SectionTitle>

              <Grille cols={2}>
                <Champ label="Interlocuteur OPCO">
                  <input style={inputStyle} value={form.opcoContact} onChange={e => update('opcoContact', e.target.value)} placeholder="Nom du conseiller OPCO" />
                </Champ>
                <Champ label="Numéro adhérent OPCO">
                  <input style={inputStyle} value={form.opcoNumeroAdherent} onChange={e => update('opcoNumeroAdherent', e.target.value)} placeholder="Numéro d'adhérent" />
                </Champ>
              </Grille>

              <SectionTitle>Facturation</SectionTitle>

              <Champ label="Email de facturation" required>
                <input type="email" style={inputStyle} value={form.facturationEmail} onChange={e => update('facturationEmail', e.target.value)} placeholder="facturation@entreprise.fr" />
              </Champ>

              <div style={{ padding: '12px 16px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '13px', color: '#555' }}>
                💡 Les factures des frais pédagogiques sont adressées directement à l'OPCO. Les informations bancaires ci-dessous concernent uniquement les éventuels frais annexes.
              </div>

              <Grille cols={2}>
                <Champ label="IBAN (frais annexes)">
                  <input style={inputStyle} value={form.iban} onChange={e => update('iban', e.target.value)} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
                </Champ>
                <Champ label="BIC">
                  <input style={inputStyle} value={form.bic} onChange={e => update('bic', e.target.value)} placeholder="XXXXXXXX" />
                </Champ>
              </Grille>

              <Champ label="Mandat SEPA signé">
                <select style={inputStyle} value={form.mandatSepa} onChange={e => update('mandatSepa', e.target.value)}>
                  <option value="non">Non</option>
                  <option value="oui">Oui — mandat signé</option>
                  <option value="en-cours">En cours de signature</option>
                </select>
              </Champ>

              <SectionTitle>Notes internes</SectionTitle>

              <Champ label="Notes / Observations">
                <textarea
                  style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                  placeholder="Informations complémentaires sur l'entreprise..."
                />
              </Champ>

              {/* Récapitulatif */}
              <div style={{ backgroundColor: COLORS.background, borderRadius: '10px', padding: '16px', marginTop: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '12px' }}>
                  📋 Récapitulatif du dossier entreprise
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Raison sociale', value: form.raisonSociale || '—' },
                    { label: 'SIRET', value: form.siret || '—' },
                    { label: 'IDCC', value: form.idcc || '—' },
                    { label: 'OPCO', value: form.opco || '—' },
                    { label: 'Dirigeant', value: form.dirigeantNom ? `${form.dirigeantCivilite} ${form.dirigeantNom} ${form.dirigeantPrenom}` : '—' },
                    { label: 'Tuteur', value: form.tuteurNom ? `${form.tuteurCivilite} ${form.tuteurNom} ${form.tuteurPrenom}` : '—' },
                  ].map((info) => (
                    <div key={info.label} style={{ padding: '8px 10px', backgroundColor: 'white', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>{info.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: info.value === '—' ? '#ccc' : COLORS.text, marginTop: '2px' }}>{info.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => setSection('contacts')} style={btnSecondary}>← Section précédente</button>
                <button onClick={sauvegarder} style={{ ...btnPrimary, backgroundColor: progression === 100 ? COLORS.primary : COLORS.secondary }}>
                  {progression === 100 ? '✅ Enregistrer le dossier complet' : '💾 Enregistrer (dossier incomplet)'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}