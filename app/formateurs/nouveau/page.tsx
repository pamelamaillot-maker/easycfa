'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS } from '../../../lib/constants';

const SECTIONS = [
  { id: 'identite', label: '👤 Identité', description: 'Informations personnelles' },
  { id: 'competences', label: '🎓 Compétences', description: 'Formations et expériences' },
  { id: 'contrat', label: '📋 Contrat', description: 'Type et conditions' },
  { id: 'pieces', label: '📎 Pièces jointes', description: 'Documents obligatoires' },
];

const PIECES_OBLIGATOIRES = [
  { id: 'cni', label: 'Pièce d\'identité valide', obligatoire: true, detail: 'CNI, passeport ou titre de séjour en cours de validité' },
  { id: 'rib', label: 'RIB', obligatoire: true, detail: 'Relevé d\'identité bancaire pour le règlement des prestations' },
  { id: 'assurance', label: 'Attestation d\'assurance RC Pro', obligatoire: true, detail: 'Responsabilité civile professionnelle en cours de validité' },
  { id: 'nda', label: 'NDA ou attestation d\'enregistrement', obligatoire: true, detail: 'Numéro de Déclaration d\'Activité si formateur indépendant' },
  { id: 'cv', label: 'CV à jour', obligatoire: true, detail: 'Curriculum vitae détaillant les expériences pédagogiques et métier' },
  { id: 'diplomes', label: 'Copies des diplômes', obligatoire: true, detail: 'Diplômes et certifications professionnelles obtenus' },
  { id: 'urssaf', label: 'Attestation URSSAF / KBIS', obligatoire: false, detail: 'Attestation de vigilance URSSAF ou extrait KBIS (indépendants)' },
  { id: 'casier', label: 'Extrait casier judiciaire B3', obligatoire: false, detail: 'Pour les formations auprès de mineurs' },
];

const FORMATIONS_PAM = ['SC', 'GCF', 'AD', 'ARH', 'EC', 'CV', 'CATL', 'FPA'];

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: '14px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px', paddingBottom: '8px', borderBottom: `2px solid ${COLORS.background}` }}>
      {children}
    </h3>
  );
}

export default function NouveauFormateur() {
  const router = useRouter();
  const [section, setSection] = useState('identite');
  const [sauvegarde, setSauvegarde] = useState(false);
  const [fichiers, setFichiers] = useState<Record<string, { nom: string; taille: string } | null>>({});
  const [formationsSelectionnees, setFormationsSelectionnees] = useState<string[]>([]);

  const [form, setForm] = useState({
    civilite: '',
    nom: '',
    prenom: '',
    dateNaissance: '',
    telephone: '',
    email: '',
    adresse: '',
    codePostal: '',
    ville: '',
    // Compétences
    type: 'Indépendant',
    nda: '',
    siret: '',
    niveauDiplome: '',
    specialite: '',
    anneesExperience: '',
    experiencePedagogique: '',
    biographie: '',
    // Contrat
    tarifPresentiel: '30',
    tarifDistanciel: '18',
    modaliteIntervention: 'Présentiel',
    disponibilite: '',
    dateDebutCollaboration: '',
    notes: '',
  });

  function update(champ: string, valeur: string) {
    setForm(prev => ({ ...prev, [champ]: valeur }));
  }

  function toggleFormation(f: string) {
    setFormationsSelectionnees(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  }

  function simulerUpload(pieceId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (fichier) {
      const taille = fichier.size > 1024 * 1024
        ? `${(fichier.size / 1024 / 1024).toFixed(1)} Mo`
        : `${Math.round(fichier.size / 1024)} Ko`;
      setFichiers(prev => ({ ...prev, [pieceId]: { nom: fichier.name, taille } }));
    }
  }

  const sectionsCompletees: Record<string, boolean> = {
    identite: !!(form.civilite && form.nom && form.prenom && form.telephone && form.email),
    competences: !!(form.specialite && form.niveauDiplome && formationsSelectionnees.length > 0),
    contrat: !!(form.type && form.tarifPresentiel && form.dateDebutCollaboration),
    pieces: !!(fichiers['cni'] && fichiers['rib'] && fichiers['assurance'] && fichiers['cv'] && fichiers['diplomes']),
  };

  const nbCompletes = Object.values(sectionsCompletees).filter(Boolean).length;
  const progression = Math.round((nbCompletes / SECTIONS.length) * 100);

  function sauvegarder() {
    setSauvegarde(true);
    setTimeout(() => router.push('/formateurs'), 1500);
  }

  const btnPrimary: React.CSSProperties = { backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
  const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <a href="/formateurs" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>← Retour aux formateurs</a>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px', marginTop: '8px' }}>Nouveau formateur</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>Fiche formateur — Pièces obligatoires et compétences</p>
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
          ✅ Formateur enregistré avec succès ! Redirection en cours...
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
              {progression === 100 ? '🎉 Dossier complet !' : `${SECTIONS.length - nbCompletes} section(s) restante(s)`}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

          {/* ===== IDENTITÉ ===== */}
          {section === 'identite' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary }}>👤 Identité du formateur</h2>

              <Grille cols={3}>
                <Champ label="Civilité" required>
                  <select style={inputStyle} value={form.civilite} onChange={e => update('civilite', e.target.value)}>
                    <option value="">...</option>
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                  </select>
                </Champ>
                <Champ label="Nom" required>
                  <input style={inputStyle} value={form.nom} onChange={e => update('nom', e.target.value.toUpperCase())} placeholder="NOM" />
                </Champ>
                <Champ label="Prénom" required>
                  <input style={inputStyle} value={form.prenom} onChange={e => update('prenom', e.target.value)} placeholder="Prénom" />
                </Champ>
              </Grille>

              <Grille cols={2}>
                <Champ label="Date de naissance">
                  <input type="date" style={inputStyle} value={form.dateNaissance} onChange={e => update('dateNaissance', e.target.value)} />
                </Champ>
                <Champ label="Type d'intervenant" required>
                  <select style={inputStyle} value={form.type} onChange={e => update('type', e.target.value)}>
                    <option value="Indépendant">Formateur indépendant</option>
                    <option value="Salarié">Salarié PAM OI</option>
                    <option value="Vacataire">Vacataire</option>
                    <option value="Sous-traitant">Sous-traitant (organisme)</option>
                  </select>
                </Champ>
              </Grille>

              {form.type === 'Indépendant' && (
                <div style={{ padding: '12px 16px', backgroundColor: '#fef6e4', borderRadius: '8px', borderLeft: `4px solid ${COLORS.secondary}` }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.secondary, marginBottom: '8px' }}>
                    ⚡ Formateur indépendant — Tarifs appliqués automatiquement
                  </div>
                  <div style={{ fontSize: '12px', color: '#555' }}>
                    Présentiel : <strong>{form.tarifPresentiel} €/h</strong> — Distanciel : <strong>{form.tarifDistanciel} €/h</strong>
                  </div>
                </div>
              )}

              <Grille cols={2}>
                <Champ label="Téléphone" required>
                  <input style={inputStyle} value={form.telephone} onChange={e => update('telephone', e.target.value)} placeholder="06 XX XX XX XX" />
                </Champ>
                <Champ label="Email professionnel" required>
                  <input type="email" style={inputStyle} value={form.email} onChange={e => update('email', e.target.value)} placeholder="formateur@email.fr" />
                </Champ>
              </Grille>

              <Champ label="Adresse">
                <input style={inputStyle} value={form.adresse} onChange={e => update('adresse', e.target.value)} placeholder="Adresse complète" />
              </Champ>

              <Grille cols={3}>
                <Champ label="Code postal">
                  <input style={inputStyle} value={form.codePostal} onChange={e => update('codePostal', e.target.value)} placeholder="97400" />
                </Champ>
                <div style={{ gridColumn: 'span 2' }}>
                  <Champ label="Ville">
                    <input style={inputStyle} value={form.ville} onChange={e => update('ville', e.target.value)} placeholder="Saint-Denis" />
                  </Champ>
                </div>
              </Grille>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setSection('competences')} style={btnPrimary}>Section suivante →</button>
              </div>
            </div>
          )}

          {/* ===== COMPÉTENCES ===== */}
          {section === 'competences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary }}>🎓 Compétences et qualifications</h2>

              <SectionTitle>Qualifications</SectionTitle>

              <Grille cols={2}>
                <Champ label="Niveau de diplôme" required>
                  <select style={inputStyle} value={form.niveauDiplome} onChange={e => update('niveauDiplome', e.target.value)}>
                    <option value="">Choisir...</option>
                    <option value="3">Niveau 3 — CAP/BEP</option>
                    <option value="4">Niveau 4 — BAC</option>
                    <option value="5">Niveau 5 — BAC+2</option>
                    <option value="6">Niveau 6 — Licence</option>
                    <option value="7">Niveau 7 — Master</option>
                    <option value="8">Niveau 8 — Doctorat</option>
                  </select>
                </Champ>
                <Champ label="Spécialité principale" required>
                  <input style={inputStyle} value={form.specialite} onChange={e => update('specialite', e.target.value)} placeholder="Ex: Comptabilité, RH, Commerce..." />
                </Champ>
              </Grille>

              <Grille cols={2}>
                <Champ label="Années d'expérience professionnelle">
                  <input style={inputStyle} value={form.anneesExperience} onChange={e => update('anneesExperience', e.target.value)} placeholder="Ex: 10 ans" />
                </Champ>
                <Champ label="Expérience pédagogique">
                  <input style={inputStyle} value={form.experiencePedagogique} onChange={e => update('experiencePedagogique', e.target.value)} placeholder="Ex: 5 ans en CFA" />
                </Champ>
              </Grille>

              <Champ label="Biographie / Présentation courte">
                <textarea
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  value={form.biographie}
                  onChange={e => update('biographie', e.target.value)}
                  placeholder="Parcours professionnel et pédagogique en quelques lignes..."
                />
              </Champ>

              <SectionTitle>Formations assurées chez PAM OI</SectionTitle>

              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                Sélectionnez les formations que ce formateur peut assurer :
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {FORMATIONS_PAM.map((f) => {
                  const selectionne = formationsSelectionnees.includes(f);
                  return (
                    <button
                      key={f}
                      onClick={() => toggleFormation(f)}
                      style={{
                        backgroundColor: selectionne ? COLORS.primary : 'white',
                        color: selectionne ? 'white' : COLORS.primary,
                        border: `2px solid ${COLORS.primary}`,
                        borderRadius: '20px', padding: '6px 16px',
                        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      }}
                    >
                      {selectionne ? '✓ ' : ''}{f}
                    </button>
                  );
                })}
              </div>

              {formationsSelectionnees.length === 0 && (
                <div style={{ fontSize: '12px', color: '#e53e3e', fontStyle: 'italic' }}>
                  ⚠️ Veuillez sélectionner au moins une formation
                </div>
              )}

              {form.type === 'Indépendant' && (
                <>
                  <SectionTitle>Numéro de déclaration d'activité</SectionTitle>
                  <Grille cols={2}>
                    <Champ label="NDA (Numéro Déclaration Activité)">
                      <input style={inputStyle} value={form.nda} onChange={e => update('nda', e.target.value)} placeholder="Ex: 04973XXXXXX" />
                    </Champ>
                    <Champ label="SIRET">
                      <input style={inputStyle} value={form.siret} onChange={e => update('siret', e.target.value)} placeholder="XXX XXX XXX XXXXX" />
                    </Champ>
                  </Grille>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => setSection('identite')} style={btnSecondary}>← Section précédente</button>
                <button onClick={() => setSection('contrat')} style={btnPrimary}>Section suivante →</button>
              </div>
            </div>
          )}

          {/* ===== CONTRAT ===== */}
          {section === 'contrat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary }}>📋 Conditions d'intervention</h2>

              <SectionTitle>Tarification</SectionTitle>

              <div style={{ padding: '12px 16px', backgroundColor: COLORS.background, borderRadius: '8px', fontSize: '13px', color: '#555', marginBottom: '4px' }}>
                💡 Les tarifs standards PAM OI sont : <strong>30 €/h en présentiel</strong> et <strong>18 €/h en distanciel</strong> pour les formateurs indépendants. Modifiez uniquement si conditions particulières négociées.
              </div>

              <Grille cols={3}>
                <Champ label="Tarif horaire présentiel (€/h)" required>
                  <input type="number" style={inputStyle} value={form.tarifPresentiel} onChange={e => update('tarifPresentiel', e.target.value)} />
                </Champ>
                <Champ label="Tarif horaire distanciel (€/h)" required>
                  <input type="number" style={inputStyle} value={form.tarifDistanciel} onChange={e => update('tarifDistanciel', e.target.value)} />
                </Champ>
                <Champ label="Modalité d'intervention">
                  <select style={inputStyle} value={form.modaliteIntervention} onChange={e => update('modaliteIntervention', e.target.value)}>
                    <option value="Présentiel">Présentiel uniquement</option>
                    <option value="Distanciel">Distanciel uniquement</option>
                    <option value="Mixte">Mixte (présentiel + distanciel)</option>
                  </select>
                </Champ>
              </Grille>

              <SectionTitle>Disponibilité et collaboration</SectionTitle>

              <Grille cols={2}>
                <Champ label="Date de début de collaboration" required>
                  <input type="date" style={inputStyle} value={form.dateDebutCollaboration} onChange={e => update('dateDebutCollaboration', e.target.value)} />
                </Champ>
                <Champ label="Disponibilité">
                  <input style={inputStyle} value={form.disponibilite} onChange={e => update('disponibilite', e.target.value)} placeholder="Ex: Lundi, Mardi — Toute la semaine..." />
                </Champ>
              </Grille>

              <SectionTitle>Notes internes</SectionTitle>

              <Champ label="Notes / Observations">
                <textarea
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                  placeholder="Informations complémentaires sur ce formateur..."
                />
              </Champ>

              {/* Récapitulatif coût */}
              {formationsSelectionnees.length > 0 && (
                <div style={{ backgroundColor: COLORS.background, borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '8px' }}>
                    💰 Récapitulatif tarification
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                    <div><span style={{ color: '#888' }}>Présentiel :</span> <strong>{form.tarifPresentiel} €/h</strong></div>
                    <div><span style={{ color: '#888' }}>Distanciel :</span> <strong>{form.tarifDistanciel} €/h</strong></div>
                    <div><span style={{ color: '#888' }}>Formations :</span> <strong>{formationsSelectionnees.join(', ')}</strong></div>
                    <div><span style={{ color: '#888' }}>Statut :</span> <strong>{form.type}</strong></div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => setSection('competences')} style={btnSecondary}>← Section précédente</button>
                <button onClick={() => setSection('pieces')} style={btnPrimary}>Section suivante →</button>
              </div>
            </div>
          )}

          {/* ===== PIÈCES JOINTES ===== */}
          {section === 'pieces' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: COLORS.primary }}>📎 Pièces obligatoires</h2>
              <p style={{ fontSize: '13px', color: '#888' }}>
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
                    <label style={{ backgroundColor: fichier ? 'white' : COLORS.primary, color: fichier ? COLORS.primary : 'white', border: fichier ? `1.5px solid ${COLORS.primary}` : 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-block', whiteSpace: 'nowrap' }}>
                      {fichier ? '🔄 Remplacer' : '⬆ Importer'}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => simulerUpload(piece.id, e)} />
                    </label>
                  </div>
                );
              })}

              {/* Résumé */}
              <div style={{ marginTop: '8px', padding: '14px 16px', backgroundColor: COLORS.background, borderRadius: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                  {Object.keys(fichiers).length} pièce(s) importée(s) sur {PIECES_OBLIGATOIRES.length}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Pièces obligatoires manquantes : {PIECES_OBLIGATOIRES.filter(p => p.obligatoire && !fichiers[p.id]).map(p => p.label).join(', ') || 'Aucune ✅'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={() => setSection('contrat')} style={btnSecondary}>← Section précédente</button>
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