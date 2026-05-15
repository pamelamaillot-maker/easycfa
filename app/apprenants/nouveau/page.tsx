'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS } from '../../../lib/constants';

const SECTIONS = [
  { id: 'identite', label: '👤 Identité', description: 'Informations personnelles' },
  { id: 'cerfa', label: '📋 CERFA', description: 'Situation avant contrat' },
  { id: 'representant', label: '👨‍👩‍👧 Représentant légal', description: 'Si mineur' },
  { id: 'entreprise', label: '🏢 Entreprise', description: 'Rattachement' },
  { id: 'pieces', label: '📎 Pièces jointes', description: 'Documents obligatoires' },
];

const PIECES_OBLIGATOIRES = [
  { id: 'cni', label: 'Pièce d\'identité valide', obligatoire: true, detail: 'CNI, passeport ou titre de séjour en cours de validité' },
  { id: 'vitale', label: 'Carte vitale ou attestation SS', obligatoire: true, detail: 'Numéro de sécurité sociale obligatoire pour le CERFA' },
  { id: 'domicile', label: 'Justificatif de domicile', obligatoire: true, detail: 'Moins de 3 mois' },
  { id: 'diplomes', label: 'Diplômes obtenus', obligatoire: true, detail: 'Derniers diplômes ou attestations de réussite' },
  { id: 'cv', label: 'CV', obligatoire: true, detail: 'Curriculum vitae à jour' },
  { id: 'dpae', label: 'DPAE', obligatoire: false, detail: 'Déclaration Préalable à l\'Embauche — fournie par l\'employeur' },
  { id: 'rqth', label: 'Attestation RQTH', obligatoire: false, detail: 'Si reconnaissance qualité travailleur handicapé' },
  { id: 'photo', label: 'Photo d\'identité', obligatoire: false, detail: 'Pour le livret apprentissage' },
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
      <label style={labelStyle}>{label}{required && <span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>}</label>
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

export default function NouvelApprenant() {
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const statutInitial = searchParams?.get('statut') ?? 'CA';
  const isP2S = statutInitial === 'P2S';
  const [section, setSection] = useState('identite');
  const [sauvegarde, setSauvegarde] = useState(false);
  const [fichiers, setFichiers] = useState<Record<string, { nom: string; taille: string } | null>>({});

  const [form, setForm] = useState({
    statut: statutInitial,
    // Identité
    civilite: '',
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    departementNaissance: '',
    paysNaissance: 'France',
    nationalite: 'Française',
    nir: '',
    nirConfirm: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    email: '',
    rqth: 'non',
    sportifHautNiveau: 'non',
    // CERFA
    situationAvantContrat: '',
    dernierDiplome: '',
    intituleDernierDiplome: '',
    anneeObtention: '',
    derniereClasse: '',
    dernierEtablissement: '',
    formation: '',
    dateEntretien: '',
    // Représentant légal
    representantNom: '',
    representantPrenom: '',
    representantLien: '',
    representantAdresse: '',
    representantCodePostal: '',
    representantVille: '',
    representantTelephone: '',
    representantEmail: '',
    // Entreprise
    entreprise: '',
    tuteurNom: '',
    tuteurPrenom: '',
    tuteurTelephone: '',
    tuteurEmail: '',
    dateDebutContrat: '',
    dateFinContrat: '',
    dateDebutFormation: '',
  });

  function update(champ: string, valeur: string) {
    setForm(prev => ({ ...prev, [champ]: valeur }));
  }

  function calculerAge() {
    if (!form.dateNaissance) return null;
    const naissance = new Date(form.dateNaissance);
    const aujourdhui = new Date();
    const age = aujourdhui.getFullYear() - naissance.getFullYear();
    return age;
  }

  const age = calculerAge();
  const estMineur = age !== null && age < 18;

  const sectionsCompletees: Record<string, boolean> = {
    identite: !!(form.civilite && form.nom && form.prenom && form.dateNaissance && form.adresse && form.telephone && form.email),
    cerfa: !!(form.situationAvantContrat && form.dernierDiplome && form.formation),
    representant: estMineur ? !!(form.representantNom && form.representantPrenom && form.representantTelephone) : true,
    entreprise: !!(form.entreprise && form.tuteurNom && form.dateDebutContrat),
    pieces: !!(fichiers['cni'] && fichiers['vitale'] && fichiers['domicile']),
  };

  function simulerUpload(pieceId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (fichier) {
      const taille = fichier.size > 1024 * 1024
        ? `${(fichier.size / 1024 / 1024).toFixed(1)} Mo`
        : `${Math.round(fichier.size / 1024)} Ko`;
      setFichiers(prev => ({ ...prev, [pieceId]: { nom: fichier.name, taille } }));
    }
  }

  function sauvegarder() {
    setSauvegarde(true);
    setTimeout(() => {
      router.push('/apprenants');
    }, 1500);
  }

  const nbSections = SECTIONS.length;
  const nbCompletes = Object.values(sectionsCompletees).filter(Boolean).length;
  const progression = Math.round((nbCompletes / nbSections) * 100);

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <a href="/apprenants" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
            ← Retour aux apprenants
          </a>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px', marginTop: '8px' }}>
            {isP2S ? '⚠️ Nouveau stagiaire P2S' : '+ Nouvel apprenant (CA)'}
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>
            {isP2S ? 'Stagiaire en recherche d\'entreprise — Protection sociale 3 mois' : 'Dossier d\'inscription — Informations CERFA apprentissage'}
          </p>
          {isP2S && (
            <div style={{ backgroundColor: '#fef6e4', border: '1.5px solid #C8A23A', borderRadius: '8px', padding: '10px 14px', marginTop: '8px' }}>
              <div style={{ fontSize: '13px', color: '#7a5c00', fontWeight: '600', marginBottom: '10px' }}>
                ⚠️ Le stagiaire P2S bénéficie d'une protection sociale pendant 3 mois et d'un accompagnement PAM OI pour trouver une entreprise. Un formulaire P2S doit être signé.
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['SC', 'ARH', 'AD', 'GCF', 'CATL', 'EC', 'CV'].map(f => (
                  <a
                    key={f}
                    href={"/modeles/P2S_" + f + ".pdf"}
                    download={"Formulaire_P2S_" + f + ".pdf"}
                    style={{ backgroundColor: form.formation === f ? '#C8A23A' : 'white', color: form.formation === f ? 'white' : '#7a5c00', border: '1.5px solid #C8A23A', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}
                  >
                    📄 P2S {f}
                  </a>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '8px', fontStyle: 'italic' }}>
                💡 Le bouton de la formation sélectionnée est mis en surbrillance. Téléchargez, faites signer et importez dans les pièces justificatives.
              </div>
              <a
                href={"https://mail.google.com/mail/?view=cm&to=" + encodeURIComponent(form.email ?? '') + "&su=" + encodeURIComponent("Dossier d'inscription PAM OI — Formulaire P2S et pièces justificatives") + "&body=" + encodeURIComponent(
                  (form.civilite === 'M.' ? "Monsieur " : form.civilite === 'Mme' ? "Madame " : "Madame, Monsieur,") + (form.civilite ? (form.prenom ?? '') + " " + (form.nom ?? '') + "," : "") + "\n\n" +
                  "Suite à notre échange, veuillez trouver ci-joint le formulaire P2S " + (form.formation ?? '') + " à compléter et signer.\n\n" +
                  "Nous vous remercions de bien vouloir nous retourner par email les documents suivants :\n\n" +
                  "📄 FORMULAIRE P2S\n" +
                  "— Formulaire P2S (ci-joint) complété et signé\n\n" +
                  "🪪 PIÈCES JUSTIFICATIVES\n" +
                  "— Pièce d'identité en cours de validité (CNI recto/verso ou passeport)\n" +
                  "— Copie de carte vitale ou attestation de droits Sécurité Sociale\n" +
                  "— Justificatif de domicile de moins de 3 mois\n" +
                  "— Diplôme(s) obtenu(s) ou attestation de réussite\n" +
                  "— Attestation RQTH (si concerné(e))\n" +
                  "— Photo professionnelle pour carte étudiant\n\n" +
                  "Ces documents sont indispensables pour finaliser votre inscription et vous garantir une protection sociale durant votre période de recherche d'entreprise.\n\n" +
                  "Pour toute question, n'hésitez pas à nous contacter.\n\n" +
                  "Cordialement,\n" +
                  "PAM OI Formation\n" +
                  "pedagogie@pamoi.re\n" +
                  "06 93 55 64 97\n" +
                  "1 Chemin Dubuisson — 97436 Saint-Leu"
                )}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: '#3a5bc7', color: 'white', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', marginTop: '10px' }}
              >
                ✉️ Envoyer le formulaire P2S par email
              </a>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', marginRight: '8px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Progression du dossier</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: progression === 100 ? COLORS.primary : COLORS.secondary }}>
              {progression}%
            </div>
          </div>
          <button
            onClick={sauvegarder}
            style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            ✅ Enregistrer
          </button>
        </div>
      </div>

      {/* Message succès */}
      {sauvegarde && (
        <div style={{ padding: '14px 16px', backgroundColor: '#e6f4f1', border: '2px solid #006B68', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: COLORS.primary }}>
          ✅ Apprenant enregistré avec succès ! Redirection en cours...
        </div>
      )}

      {/* Barre de progression */}
      <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', height: '6px', marginBottom: '24px' }}>
        <div style={{ width: `${progression}%`, backgroundColor: progression === 100 ? COLORS.primary : COLORS.secondary, borderRadius: '4px', height: '6px', transition: 'width 0.5s' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>

        {/* Menu sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SECTIONS.map((s) => {
            const complete = sectionsCompletees[s.id];
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                  backgroundColor: active ? COLORS.background : 'white',
                  border: active ? `2px solid ${COLORS.primary}` : '2px solid #e0e0e0',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: active ? COLORS.primary : '#333' }}>{s.label}</span>
                  <span style={{ fontSize: '16px' }}>{complete ? '✅' : '⏳'}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{s.description}</div>
                {s.id === 'representant' && !estMineur && (
                  <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px', fontStyle: 'italic' }}>Non requis si majeur</div>
                )}
              </button>
            );
          })}

          {/* Résumé */}
          <div style={{ marginTop: '8px', padding: '12px', backgroundColor: COLORS.background, borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>Sections complètes</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: COLORS.primary }}>{nbCompletes}/{nbSections}</div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
              {progression === 100 ? '🎉 Dossier complet !' : `${nbSections - nbCompletes} section(s) restante(s)`}
            </div>
          </div>
        </div>

        {/* Contenu section */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

          {/* ===== SECTION IDENTITÉ ===== */}
          {section === 'identite' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                👤 Identité de l'apprenant(e)
              </h2>

              <Grille cols={3}>
                <Champ label="Civilité" required>
                  <select style={inputStyle} value={form.civilite} onChange={e => update('civilite', e.target.value)}>
                    <option value="">Choisir...</option>
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                  </select>
                </Champ>
                <Champ label="Nom de famille" required>
                  <input style={inputStyle} value={form.nom} onChange={e => update('nom', e.target.value.toUpperCase())} placeholder="NOM" />
                </Champ>
                <Champ label="Prénom" required>
                  <input style={inputStyle} value={form.prenom} onChange={e => update('prenom', e.target.value)} placeholder="Prénom" />
                </Champ>
              </Grille>

              <Grille cols={3}>
                <Champ label="Date de naissance" required>
                  <input type="date" style={inputStyle} value={form.dateNaissance} onChange={e => update('dateNaissance', e.target.value)} />
                </Champ>
                <Champ label="Lieu de naissance" required>
                  <input style={inputStyle} value={form.lieuNaissance} onChange={e => update('lieuNaissance', e.target.value)} placeholder="Commune" />
                </Champ>
                <Champ label="Département de naissance">
                  <input style={inputStyle} value={form.departementNaissance} onChange={e => update('departementNaissance', e.target.value)} placeholder="Ex: 974" />
                </Champ>
              </Grille>

              <Grille>
                <Champ label="Pays de naissance">
                  <input style={inputStyle} value={form.paysNaissance} onChange={e => update('paysNaissance', e.target.value)} />
                </Champ>
                <Champ label="Nationalité">
                  <input style={inputStyle} value={form.nationalite} onChange={e => update('nationalite', e.target.value)} />
                </Champ>
              </Grille>

              {age !== null && (
                <div style={{ padding: '10px 14px', backgroundColor: estMineur ? '#fef6e4' : '#e6f4f1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: estMineur ? COLORS.secondary : COLORS.primary }}>
                  {estMineur ? `⚠️ Apprenant mineur (${age} ans) — Section "Représentant légal" obligatoire` : `✅ Apprenant majeur (${age} ans)`}
                </div>
              )}

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
                  Numéro de Sécurité Sociale
                </h3>
                <Grille>
                  <Champ label="NIR (15 chiffres)" required>
                    <input style={inputStyle} value={form.nir} onChange={e => update('nir', e.target.value)} placeholder="X XX XX XX XXX XXX XX" maxLength={15} />
                  </Champ>
                  <Champ label="Confirmation NIR" required>
                    <input style={{ ...inputStyle, borderColor: form.nirConfirm && form.nir !== form.nirConfirm ? '#e53e3e' : '#e0e0e0' }} value={form.nirConfirm} onChange={e => update('nirConfirm', e.target.value)} placeholder="Confirmer le NIR" maxLength={15} />
                  </Champ>
                </Grille>
                {form.nirConfirm && form.nir !== form.nirConfirm && (
                  <div style={{ fontSize: '12px', color: '#e53e3e', marginTop: '4px' }}>⚠️ Les numéros de sécurité sociale ne correspondent pas</div>
                )}
                <div style={{ fontSize: '11px', color: '#888', marginTop: '6px', fontStyle: 'italic' }}>
                  🔒 Donnée sensible — accès restreint aux personnes habilitées
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Coordonnées</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  <Grille>
                    <Champ label="Téléphone" required>
                      <input style={inputStyle} value={form.telephone} onChange={e => update('telephone', e.target.value)} placeholder="06 XX XX XX XX" />
                    </Champ>
                    <Champ label="Email" required>
                      <input type="email" style={inputStyle} value={form.email} onChange={e => update('email', e.target.value)} placeholder="prenom.nom@email.fr" />
                    </Champ>
                  </Grille>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Situation particulière</h3>
                <Grille>
                  <Champ label="Reconnaissance Qualité Travailleur Handicapé (RQTH)">
                    <select style={inputStyle} value={form.rqth} onChange={e => update('rqth', e.target.value)}>
                      <option value="non">Non</option>
                      <option value="oui">Oui</option>
                      <option value="en-cours">En cours de démarche</option>
                    </select>
                  </Champ>
                  <Champ label="Sportif de haut niveau">
                    <select style={inputStyle} value={form.sportifHautNiveau} onChange={e => update('sportifHautNiveau', e.target.value)}>
                      <option value="non">Non</option>
                      <option value="oui">Oui — inscrit sur la liste nationale</option>
                    </select>
                  </Champ>
                </Grille>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setSection('cerfa')} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Section suivante →
                </button>
              </div>
            </div>
          )}

          {/* ===== SECTION CERFA ===== */}
          {section === 'cerfa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                📋 Informations CERFA apprentissage
              </h2>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Situation avant le contrat</h3>
                <Champ label="Situation avant le contrat d'apprentissage" required>
                  <select style={inputStyle} value={form.situationAvantContrat} onChange={e => update('situationAvantContrat', e.target.value)}>
                    <option value="">Choisir...</option>
                    <option value="1">Salarié(e)</option>
                    <option value="2">Demandeur(euse) d'emploi (+ 12 mois)</option>
                    <option value="3">Demandeur(euse) d'emploi (- 12 mois)</option>
                    <option value="4">Inactif(ve)</option>
                    <option value="5">Apprenti(e) sous contrat apprentissage</option>
                    <option value="6">Contrat de pro ou de qualification</option>
                    <option value="7">En formation initiale (lycée, CFA...)</option>
                    <option value="8">En service civique</option>
                  </select>
                </Champ>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Dernier diplôme ou titre obtenu</h3>
                <Grille>
                  <Champ label="Niveau du dernier diplôme" required>
                    <select style={inputStyle} value={form.dernierDiplome} onChange={e => update('dernierDiplome', e.target.value)}>
                      <option value="">Choisir...</option>
                      <option value="0">Sans diplôme</option>
                      <option value="1">BEPC, brevet des collèges, DNB</option>
                      <option value="2">CAP, BEP, Niveau 3</option>
                      <option value="3">BAC ou équivalent, Niveau 4</option>
                      <option value="4">BAC+2, BTS, DUT, Niveau 5</option>
                      <option value="5">BAC+3 ou +4, Licence, Niveau 6</option>
                      <option value="6">BAC+5 et plus, Master, Niveau 7</option>
                    </select>
                  </Champ>
                  <Champ label="Intitulé du diplôme">
                    <input style={inputStyle} value={form.intituleDernierDiplome} onChange={e => update('intituleDernierDiplome', e.target.value)} placeholder="Ex: Baccalauréat général" />
                  </Champ>
                </Grille>
                <Grille style={{ marginTop: '16px' }}>
                  <Champ label="Année d'obtention">
                    <input style={inputStyle} value={form.anneeObtention} onChange={e => update('anneeObtention', e.target.value)} placeholder="Ex: 2024" />
                  </Champ>
                  <Champ label="Dernière classe ou formation suivie">
                    <input style={inputStyle} value={form.derniereClasse} onChange={e => update('derniereClasse', e.target.value)} placeholder="Ex: Terminale, BTS 2ème année..." />
                  </Champ>
                </Grille>
                <div style={{ marginTop: '16px' }}>
                  <Champ label="Dernier établissement fréquenté">
                    <input style={inputStyle} value={form.dernierEtablissement} onChange={e => update('dernierEtablissement', e.target.value)} placeholder="Nom de l'établissement" />
                  </Champ>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Formation visée à PAM OI</h3>
                <Grille>
                  <Champ label="Formation" required>
                    <select style={inputStyle} value={form.formation} onChange={e => update('formation', e.target.value)}>
                      <option value="">Choisir...</option>
                      <option value="SC">Secrétaire Comptable (Niveau 4)</option>
                      <option value="GCF">Gestionnaire Comptable et Fiscal (Niveau 5)</option>
                      <option value="AD">Assistant(e) de Direction (Niveau 5)</option>
                      <option value="ARH">Assistant(e) Ressources Humaines (Niveau 5)</option>
                      <option value="EC">Employé(e) Commercial(e) (Niveau 3)</option>
                      <option value="CV">Conseiller(ère) de Vente (Niveau 4)</option>
                      <option value="CATL">Chargé(e) d'Accueil Touristique et de Loisirs (Niveau 4)</option>
                      <option value="FPA">Formateur(rice) Professionnel(le) d'Adultes (Niveau 5)</option>
                    </select>
                  </Champ>
                  <Champ label="Date d'entretien de positionnement">
                    <input type="date" style={inputStyle} value={form.dateEntretien} onChange={e => update('dateEntretien', e.target.value)} />
                  </Champ>
                </Grille>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => setSection('identite')} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  ← Section précédente
                </button>
                <button onClick={() => setSection('representant')} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Section suivante →
                </button>
              </div>
            </div>
          )}

          {/* ===== SECTION REPRÉSENTANT LÉGAL ===== */}
          {section === 'representant' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                👨‍👩‍👧 Représentant légal
              </h2>

              {!estMineur ? (
                <div style={{ padding: '20px', backgroundColor: '#e6f4f1', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: COLORS.primary }}>Apprenant majeur</div>
                  <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                    Cette section n'est pas obligatoire pour un apprenant majeur.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '12px 16px', backgroundColor: '#fef6e4', borderRadius: '8px', borderLeft: `4px solid ${COLORS.secondary}`, fontSize: '13px', color: '#7a5c00', fontWeight: '600' }}>
                    ⚠️ Apprenant mineur — Le représentant légal doit signer le contrat d'apprentissage
                  </div>

                  <Grille>
                    <Champ label="Nom du représentant légal" required>
                      <input style={inputStyle} value={form.representantNom} onChange={e => update('representantNom', e.target.value.toUpperCase())} placeholder="NOM" />
                    </Champ>
                    <Champ label="Prénom" required>
                      <input style={inputStyle} value={form.representantPrenom} onChange={e => update('representantPrenom', e.target.value)} placeholder="Prénom" />
                    </Champ>
                  </Grille>

                  <Champ label="Lien avec l'apprenant" required>
                    <select style={inputStyle} value={form.representantLien} onChange={e => update('representantLien', e.target.value)}>
                      <option value="">Choisir...</option>
                      <option value="Père">Père</option>
                      <option value="Mère">Mère</option>
                      <option value="Tuteur légal">Tuteur légal</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </Champ>

                  <Champ label="Adresse (si différente de celle de l'apprenant)">
                    <input style={inputStyle} value={form.representantAdresse} onChange={e => update('representantAdresse', e.target.value)} placeholder="Laisser vide si identique" />
                  </Champ>

                  <Grille cols={3}>
                    <Champ label="Code postal">
                      <input style={inputStyle} value={form.representantCodePostal} onChange={e => update('representantCodePostal', e.target.value)} />
                    </Champ>
                    <div style={{ gridColumn: 'span 2' }}>
                      <Champ label="Ville">
                        <input style={inputStyle} value={form.representantVille} onChange={e => update('representantVille', e.target.value)} />
                      </Champ>
                    </div>
                  </Grille>

                  <Grille>
                    <Champ label="Téléphone" required>
                      <input style={inputStyle} value={form.representantTelephone} onChange={e => update('representantTelephone', e.target.value)} placeholder="06 XX XX XX XX" />
                    </Champ>
                    <Champ label="Email">
                      <input type="email" style={inputStyle} value={form.representantEmail} onChange={e => update('representantEmail', e.target.value)} placeholder="email@exemple.fr" />
                    </Champ>
                  </Grille>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => setSection('cerfa')} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  ← Section précédente
                </button>
                <button onClick={() => setSection('entreprise')} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Section suivante →
                </button>
              </div>
            </div>
          )}

          {/* ===== SECTION ENTREPRISE ===== */}
          {section === 'entreprise' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                🏢 Entreprise d'accueil
              </h2>

              <div style={{ padding: '12px 16px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '13px', color: '#555' }}>
                💡 Si l'apprenant n'a pas encore trouvé d'entreprise, laissez ces champs vides — le statut sera "P2S" (Période Sans Entreprise).
              </div>

              <Champ label="Entreprise d'accueil" required>
                <select style={inputStyle} value={form.entreprise} onChange={e => update('entreprise', e.target.value)}>
                  <option value="">Choisir une entreprise ou saisir manuellement...</option>
                  <option value="entreprise-a">Entreprise A</option>
                  <option value="entreprise-b">Entreprise B</option>
                  <option value="entreprise-c">Entreprise C</option>
                  <option value="p2s">⚠️ P2S — Pas encore d'entreprise</option>
                </select>
              </Champ>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Maître d'apprentissage / Tuteur</h3>
                <Grille>
                  <Champ label="Nom du tuteur" required>
                    <input style={inputStyle} value={form.tuteurNom} onChange={e => update('tuteurNom', e.target.value.toUpperCase())} placeholder="NOM" />
                  </Champ>
                  <Champ label="Prénom du tuteur">
                    <input style={inputStyle} value={form.tuteurPrenom} onChange={e => update('tuteurPrenom', e.target.value)} placeholder="Prénom" />
                  </Champ>
                </Grille>
                <Grille style={{ marginTop: '16px' }}>
                  <Champ label="Téléphone du tuteur">
                    <input style={inputStyle} value={form.tuteurTelephone} onChange={e => update('tuteurTelephone', e.target.value)} placeholder="06 XX XX XX XX" />
                  </Champ>
                  <Champ label="Email du tuteur">
                    <input type="email" style={inputStyle} value={form.tuteurEmail} onChange={e => update('tuteurEmail', e.target.value)} placeholder="tuteur@entreprise.fr" />
                  </Champ>
                </Grille>
              </div>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Dates du contrat</h3>
                <Grille cols={3}>
                  <Champ label="Début du contrat" required>
                    <input type="date" style={inputStyle} value={form.dateDebutContrat} onChange={e => update('dateDebutContrat', e.target.value)} />
                  </Champ>
                  <Champ label="Fin du contrat">
                    <input type="date" style={inputStyle} value={form.dateFinContrat} onChange={e => update('dateFinContrat', e.target.value)} />
                  </Champ>
                  <Champ label="Début de la formation CFA">
                    <input type="date" style={inputStyle} value={form.dateDebutFormation} onChange={e => update('dateDebutFormation', e.target.value)} />
                  </Champ>
                </Grille>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                  💡 La date de début de formation peut être antérieure au contrat (cas P2S)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => setSection('representant')} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  ← Section précédente
                </button>
                <button onClick={() => setSection('pieces')} style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Section suivante →
                </button>
              </div>
            </div>
          )}

          {/* ===== SECTION PIÈCES JOINTES ===== */}
          {section === 'pieces' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                📎 Pièces jointes
              </h2>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
                Formats acceptés : PDF, JPG, PNG — Taille max : 5 Mo par fichier
              </p>

              {PIECES_OBLIGATOIRES.map((piece) => {
                const fichier = fichiers[piece.id];
                return (
                  <div key={piece.id} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '14px 16px', borderRadius: '10px',
                    backgroundColor: fichier ? '#e6f4f1' : piece.obligatoire ? '#fffbf0' : '#fafafa',
                    border: `1.5px solid ${fichier ? '#006B68' : piece.obligatoire ? '#C8A23A' : '#e0e0e0'}`,
                  }}>
                    <div style={{ fontSize: '24px', flexShrink: 0 }}>
                      {fichier ? '✅' : piece.obligatoire ? '⚠️' : '📄'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: fichier ? COLORS.primary : '#333' }}>
                        {piece.label}
                        {piece.obligatoire && <span style={{ color: '#e53e3e', marginLeft: '6px', fontSize: '11px' }}>OBLIGATOIRE</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{piece.detail}</div>
                      {fichier && (
                        <div style={{ fontSize: '12px', color: COLORS.primary, marginTop: '4px', fontWeight: '600' }}>
                          📄 {fichier.nom} ({fichier.taille})
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ backgroundColor: fichier ? 'white' : COLORS.primary, color: fichier ? COLORS.primary : 'white', border: fichier ? `1.5px solid ${COLORS.primary}` : 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }}>
                        {fichier ? '🔄 Remplacer' : '⬆ Importer'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => simulerUpload(piece.id, e)} />
                      </label>
                    </div>
                  </div>
                );
              })}

              {/* Résumé pièces */}
              <div style={{ marginTop: '8px', padding: '14px 16px', backgroundColor: COLORS.background, borderRadius: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                  {Object.keys(fichiers).length} pièce(s) importée(s) sur {PIECES_OBLIGATOIRES.length}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Pièces obligatoires manquantes : {PIECES_OBLIGATOIRES.filter(p => p.obligatoire && !fichiers[p.id]).map(p => p.label).join(', ') || 'Aucune ✅'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => setSection('entreprise')} style={{ backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  ← Section précédente
                </button>
                <button
                  onClick={sauvegarder}
                  style={{ backgroundColor: progression === 100 ? COLORS.primary : COLORS.secondary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
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