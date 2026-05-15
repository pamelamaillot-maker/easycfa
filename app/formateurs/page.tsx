'use client';

import { useState, useEffect } from 'react';
import { COLORS } from '../../lib/constants';
import Card from '../../components/Card';

const inputStyle: React.CSSProperties = { border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' };
const btnPrimary: React.CSSProperties = { backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };

const FORMATIONS_CODES = ['SC', 'ARH', 'AD', 'GCF', 'CATL', 'EC', 'CV', 'FPA'];

type PieceJustificative = { nom: string; date: string };

type Intervention = {
  id: string;
  date: string;
  formation: string;
  module: string;
  heures: number;
  type: 'presentiel' | 'distanciel';
  emargement: string;
  sessionId: string;
};

type SuiviMensuel = {
  mois: string;
  heuresPresence: number;
  heuresDistanciel: number;
  montantDu: number;
  facture: string;
  dateFacture: string;
  datePaiement: string;
};

type Formateur = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  siret: string;
  nda: string;
  specialites: string[];
  statut: 'Actif' | 'Inactif' | 'Archivé';
  notes: string;
  interventions: Intervention[];
  suiviMensuel: SuiviMensuel[];
  pieces: {
    cni: PieceJustificative | null;
    cv: PieceJustificative | null;
    kbis: PieceJustificative | null;
    recepisse_nda: PieceJustificative | null;
    attestation: PieceJustificative | null;
    rc_pro: PieceJustificative | null;
    rib: PieceJustificative | null;
    contrat_prestation: PieceJustificative | null;
  };
};

const PIECES_CONFIG = [
  { id: 'cni', label: 'Pièce d\'identité valide', detail: 'CNI recto/verso ou passeport en cours de validité', obligatoire: true },
  { id: 'cv', label: 'CV à jour', detail: 'Curriculum vitae actualisé', obligatoire: true },
  { id: 'kbis', label: 'Extrait KBIS', detail: 'Moins de 3 mois', obligatoire: true },
  { id: 'recepisse_nda', label: 'Récépissé NDA', detail: 'Numéro de déclaration d\'activité', obligatoire: true },
  { id: 'attestation', label: 'Attestation', detail: 'Attestation de compétences ou diplôme', obligatoire: true },
  { id: 'rc_pro', label: 'RC Professionnelle', detail: 'Responsabilité civile professionnelle en cours de validité', obligatoire: true },
  { id: 'rib', label: 'RIB', detail: 'Relevé d\'identité bancaire pour paiement des prestations', obligatoire: true },
  { id: 'contrat_prestation', label: 'Contrat de prestation annuel', detail: 'Contrat signé par les deux parties pour l\'année en cours', obligatoire: true },
];

export default function Formateurs() {
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [selectionne, setSelectionne] = useState<Formateur | null>(null);
  const [modale, setModale] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [form, setForm] = useState<Partial<Formateur>>({ statut: 'Actif', specialites: [], pieces: { cni: null, cv: null, kbis: null, recepisse_nda: null, attestation: null, rc_pro: null, rib: null, contrat_prestation: null } });
  const [ongletFormateur, setOngletFormateur] = useState('pieces');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('easycfa_formateurs');
      if (saved) setFormateurs(JSON.parse(saved));
    } catch {}
  }, []);

  function sauvegarder(liste: Formateur[]) {
    setFormateurs(liste);
    localStorage.setItem('easycfa_formateurs', JSON.stringify(liste));
  }

  function creerFormateur() {
    if (!form.nom || !form.prenom) return;
    const nouveau: Formateur = {
      id: Date.now().toString(),
      nom: form.nom ?? '',
      prenom: form.prenom ?? '',
      telephone: form.telephone ?? '',
      email: form.email ?? '',
      siret: form.siret ?? '',
      nda: form.nda ?? '',
      specialites: form.specialites ?? [],
      statut: form.statut as any ?? 'Actif',
      notes: form.notes ?? '',
      interventions: [],
      suiviMensuel: [],
      pieces: form.pieces ?? { cni: null, cv: null, kbis: null, recepisse_nda: null, attestation: null, rc_pro: null, rib: null, contrat_prestation: null },
    };
    sauvegarder([...formateurs, nouveau]);
    setModale(false);
    setForm({ statut: 'Actif', specialites: [], pieces: { cni: null, cv: null, kbis: null, recepisse_nda: null, attestation: null, rc_pro: null } });
    setSelectionne(nouveau);
  }

  function mettreAJour(champ: string, valeur: any) {
    if (!selectionne) return;
    const updated = { ...selectionne, [champ]: valeur };
    setSelectionne(updated);
    sauvegarder(formateurs.map(f => f.id === updated.id ? updated : f));
  }

  function importerPiece(pieceId: string, fichier: File) {
    if (!selectionne) return;
    const piece = { nom: fichier.name, date: new Date().toLocaleDateString('fr-FR') };
    const updated = { ...selectionne, pieces: { ...selectionne.pieces, [pieceId]: piece } };
    setSelectionne(updated);
    sauvegarder(formateurs.map(f => f.id === updated.id ? updated : f));
  }

  function supprimerFormateur(id: string) {
    if (!confirm('Supprimer ce formateur ?')) return;
    sauvegarder(formateurs.filter(f => f.id !== id));
    if (selectionne?.id === id) setSelectionne(null);
  }

  const formateursFiltres = formateurs.filter(f => {
    const matchStatut = filtreStatut === 'Tous' || f.statut === filtreStatut;
    const matchRecherche = !recherche || (f.nom + ' ' + f.prenom + ' ' + f.email + ' ' + f.specialites.join(' ')).toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchRecherche;
  });

  const nbPiecesOk = (f: Formateur) => PIECES_CONFIG.filter(p => f.pieces[p.id as keyof typeof f.pieces]).length;
  const dossierComplet = (f: Formateur) => nbPiecesOk(f) === PIECES_CONFIG.length;

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#006B68', marginBottom: '4px' }}>👨‍🏫 Formateurs</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>{formateurs.filter(f => f.statut === 'Actif').length} actif(s) — {formateurs.length} au total</p>
        </div>
        <button onClick={() => setModale(true)} style={btnPrimary}>+ Nouveau formateur</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: formateurs.length, color: '#006B68' },
          { label: 'Actifs', value: formateurs.filter(f => f.statut === 'Actif').length, color: '#16a34a' },
          { label: 'Dossiers complets', value: formateurs.filter(f => dossierComplet(f)).length, color: '#0891b2' },
          { label: 'Dossiers incomplets', value: formateurs.filter(f => !dossierComplet(f) && f.statut === 'Actif').length, color: '#C8A23A' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center', borderTop: '4px solid ' + s.color }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher..." style={{ ...inputStyle, paddingLeft: '32px' }} />
          </div>
          {['Tous', 'Actif', 'Inactif', 'Archivé'].map(s => (
            <button key={s} onClick={() => setFiltreStatut(s)} style={{ ...btnSecondary, backgroundColor: filtreStatut === s ? '#006B68' : 'white', color: filtreStatut === s ? 'white' : '#006B68', padding: '6px 14px', fontSize: '12px' }}>
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* Contenu */}
      <div style={{ display: 'grid', gridTemplateColumns: selectionne ? '1fr 1fr' : '1fr', gap: '24px' }}>

        {/* Liste */}
        <Card>
          {formateursFiltres.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
              {formateurs.length === 0 ? 'Aucun formateur — cliquez sur "+ Nouveau formateur"' : 'Aucun résultat'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {formateursFiltres.map(f => {
                const complet = dossierComplet(f);
                const nbOk = nbPiecesOk(f);
                const isOpen = selectionne?.id === f.id;
                const statutColor = f.statut === 'Actif' ? '#16a34a' : f.statut === 'Inactif' ? '#C8A23A' : '#888';
                const statutBg = f.statut === 'Actif' ? '#dcfce7' : f.statut === 'Inactif' ? '#fef6e4' : '#f0f0f0';
                return (
                  <div key={f.id} onClick={() => { setSelectionne(isOpen ? null : f); setModeEdition(false); }} style={{ padding: '14px 16px', borderRadius: '10px', border: '1.5px solid ' + (isOpen ? '#006B68' : '#e0e0e0'), backgroundColor: isOpen ? '#EAF4F3' : 'white', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#EAF4F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#006B68', flexShrink: 0 }}>
                          {f.prenom[0]}{f.nom[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>{f.prenom} {f.nom}</div>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{f.email}</div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {f.specialites.map(s => (
                              <span key={s} style={{ backgroundColor: '#EAF4F3', color: '#006B68', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: '600' }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ backgroundColor: statutBg, color: statutColor, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>{f.statut}</span>
                        <span style={{ fontSize: '10px', color: complet ? '#16a34a' : '#C8A23A', fontWeight: '600' }}>
                          {complet ? '✅ Dossier complet' : `📎 ${nbOk}/${PIECES_CONFIG.length} pièces`}
                        </span>
                        <button onClick={e => { e.stopPropagation(); supprimerFormateur(f.id); }} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Fiche formateur */}
        {selectionne && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#EAF4F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#006B68' }}>
                    {selectionne.prenom[0]}{selectionne.nom[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#006B68' }}>{selectionne.prenom} {selectionne.nom}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{selectionne.specialites.join(' • ')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setModeEdition(!modeEdition)} style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px', backgroundColor: modeEdition ? '#006B68' : 'white', color: modeEdition ? 'white' : '#006B68' }}>
                    {modeEdition ? '✏️ Édition...' : '✏️ Modifier'}
                  </button>
                  {modeEdition && (
                    <button onClick={() => setModeEdition(false)} style={{ ...btnPrimary, padding: '6px 12px', fontSize: '12px' }}>✅ OK</button>
                  )}
                  <button onClick={() => setSelectionne(null)} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                </div>
              </div>

              {/* Statut */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Statut</label>
                <select value={selectionne.statut} onChange={e => mettreAJour('statut', e.target.value)} style={inputStyle}>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="Archivé">Archivé</option>
                </select>
              </div>

              {/* Infos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                {[
                  { label: 'Nom', champ: 'nom' },
                  { label: 'Prénom', champ: 'prenom' },
                  { label: 'Téléphone', champ: 'telephone' },
                  { label: 'Email', champ: 'email' },
                  { label: 'N° SIRET', champ: 'siret' },
                  { label: 'N° NDA', champ: 'nda' },
                ].map(f => (
                  <div key={f.champ}>
                    <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '2px' }}>{f.label}</label>
                    {modeEdition ? (
                      <input style={inputStyle} value={(selectionne as any)[f.champ] ?? ''} onChange={e => mettreAJour(f.champ, e.target.value)} />
                    ) : (
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', padding: '6px 0' }}>{(selectionne as any)[f.champ] || '—'}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Spécialités */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Formations dispensées</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {FORMATIONS_CODES.map(code => {
                    const actif = selectionne.specialites.includes(code);
                    return (
                      <button key={code} onClick={() => {
                        if (!modeEdition) return;
                        const updated = actif ? selectionne.specialites.filter(s => s !== code) : [...selectionne.specialites, code];
                        mettreAJour('specialites', updated);
                      }} style={{ backgroundColor: actif ? '#006B68' : '#f0f0f0', color: actif ? 'white' : '#555', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: modeEdition ? 'pointer' : 'default' }}>
                        {code}
                      </button>
                    );
                  })}
                </div>
                {modeEdition && <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>Cliquez pour activer/désactiver</div>}
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Notes</label>
                {modeEdition ? (
                  <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={selectionne.notes ?? ''} onChange={e => mettreAJour('notes', e.target.value)} />
                ) : (
                  <div style={{ fontSize: '12px', color: '#555', padding: '6px 0' }}>{selectionne.notes || '—'}</div>
                )}
              </div>
            </Card>

            {/* Onglets interventions / suivi / pièces */}
            {(() => {
              const [ongletFiche, setOngletFiche] = window['React']?.useState?.('pieces') ?? ['pieces', () => {}];
              return null;
            })()}
            <Card style={{ padding: '0' }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #EAF4F3' }}>
                {[
                  { id: 'interventions', label: '📅 Interventions' },
                  { id: 'suivi', label: '📊 Suivi mensuel' },
                  { id: 'pieces', label: '📎 Pièces justificatives' },
                ].map(o => (
                  <button key={o.id} onClick={() => setOngletFormateur(o.id)} style={{ flex: 1, padding: '12px', fontSize: '12px', fontWeight: '600', border: 'none', borderBottom: ongletFormateur === o.id ? '3px solid #006B68' : '3px solid transparent', backgroundColor: 'white', color: ongletFormateur === o.id ? '#006B68' : '#888', cursor: 'pointer' }}>
                    {o.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '16px' }}>
              {/* INTERVENTIONS */}
              {ongletFormateur === 'interventions' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>Sessions animées</h3>
                    <button onClick={() => {
                      const nouv: Intervention = { id: Date.now().toString(), date: '', formation: '', module: '', heures: 0, type: 'presentiel', emargement: '', sessionId: '' };
                      mettreAJour('interventions', [...(selectionne.interventions || []), nouv]);
                    }} style={{ ...btnPrimary, padding: '5px 10px', fontSize: '11px' }}>+ Ajouter</button>
                  </div>
                  {(selectionne.interventions || []).length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>Aucune intervention enregistrée</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(selectionne.interventions || []).map(iv => {
                        const tarif = iv.type === 'presentiel' ? 30 : 18;
                        const montant = iv.heures * tarif;
                        return (
                          <div key={iv.id} style={{ backgroundColor: '#fafafa', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                              {[
                                { label: 'Date', champ: 'date', type: 'text', placeholder: 'JJ/MM/AAAA' },
                                { label: 'Formation', champ: 'formation', type: 'select' },
                                { label: 'Module/CCP', champ: 'module', type: 'text', placeholder: 'ex: CCP1 - Comptabilité' },
                              ].map(f => (
                                <div key={f.champ}>
                                  <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>{f.label}</label>
                                  {f.type === 'select' ? (
                                    <select style={{ ...inputStyle, fontSize: '11px', padding: '4px 6px' }} value={iv[f.champ as keyof Intervention] as string} onChange={e => {
                                      const updated = (selectionne.interventions || []).map(i => i.id === iv.id ? { ...i, [f.champ]: e.target.value } : i);
                                      mettreAJour('interventions', updated);
                                    }}>
                                      <option value="">Choisir...</option>
                                      {selectionne.specialites.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  ) : (
                                    <input type="text" placeholder={f.placeholder} style={{ ...inputStyle, fontSize: '11px', padding: '4px 6px' }} value={iv[f.champ as keyof Intervention] as string} onChange={e => {
                                      const updated = (selectionne.interventions || []).map(i => i.id === iv.id ? { ...i, [f.champ]: e.target.value } : i);
                                      mettreAJour('interventions', updated);
                                    }} />
                                  )}
                                </div>
                              ))}
                              <div>
                                <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Nb heures</label>
                                <input type="number" step="0.5" style={{ ...inputStyle, fontSize: '11px', padding: '4px 6px' }} value={iv.heures} onChange={e => {
                                  const updated = (selectionne.interventions || []).map(i => i.id === iv.id ? { ...i, heures: parseFloat(e.target.value) || 0 } : i);
                                  mettreAJour('interventions', updated);
                                }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Type</label>
                                <select style={{ ...inputStyle, fontSize: '11px', padding: '4px 6px' }} value={iv.type} onChange={e => {
                                  const updated = (selectionne.interventions || []).map(i => i.id === iv.id ? { ...i, type: e.target.value as any } : i);
                                  mettreAJour('interventions', updated);
                                }}>
                                  <option value="presentiel">Présentiel — 30€/h</option>
                                  <option value="distanciel">Distanciel — 18€/h</option>
                                </select>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Montant</label>
                                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#006B68', padding: '4px 0' }}>{montant.toLocaleString('fr-FR')} €</div>
                                </div>
                                <button onClick={() => mettreAJour('interventions', (selectionne.interventions || []).filter(i => i.id !== iv.id))} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                              </div>
                            </div>
                            {/* Import émargement */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <label style={{ backgroundColor: iv.emargement ? '#e6f4f1' : '#f0f0f0', color: iv.emargement ? '#006B68' : '#555', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {iv.emargement ? `✅ ${iv.emargement}` : '📎 Importer feuille émargement'}
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                                  const f = ev.target.files?.[0];
                                  if (f) {
                                    const updated = (selectionne.interventions || []).map(i => i.id === iv.id ? { ...i, emargement: f.name } : i);
                                    mettreAJour('interventions', updated);
                                  }
                                }} />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                      {/* Total interventions */}
                      <div style={{ backgroundColor: '#006B68', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>Total — {(selectionne.interventions || []).reduce((s, i) => s + i.heures, 0)}h</span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#C8A23A' }}>
                          {(selectionne.interventions || []).reduce((s, i) => s + i.heures * (i.type === 'presentiel' ? 30 : 18), 0).toLocaleString('fr-FR')} €
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUIVI MENSUEL */}
              {ongletFormateur === 'suivi' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>Suivi mensuel des heures et paiements</h3>
                    <button onClick={() => {
                      const mois = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                      const hP = (selectionne.interventions || []).filter(i => i.type === 'presentiel').reduce((s, i) => s + i.heures, 0);
                      const hD = (selectionne.interventions || []).filter(i => i.type === 'distanciel').reduce((s, i) => s + i.heures, 0);
                      const montant = hP * 30 + hD * 18;
                      const nouv: SuiviMensuel = { mois, heuresPresence: hP, heuresDistanciel: hD, montantDu: montant, facture: '', dateFacture: '', datePaiement: '' };
                      mettreAJour('suiviMensuel', [...(selectionne.suiviMensuel || []), nouv]);
                    }} style={{ ...btnPrimary, padding: '5px 10px', fontSize: '11px' }}>+ Ajouter mois</button>
                  </div>
                  {(selectionne.suiviMensuel || []).length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>Aucun suivi mensuel</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(selectionne.suiviMensuel || []).map((sm, idx) => (
                        <div key={idx} style={{ backgroundColor: sm.datePaiement ? '#e6f4f1' : '#fafafa', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${sm.datePaiement ? '#006B68' : '#e0e0e0'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#006B68' }}>{sm.mois}</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed' }}>{sm.heuresPresence}h présentiel + {sm.heuresDistanciel}h distanciel</span>
                              <span style={{ fontSize: '13px', fontWeight: '800', color: '#006B68' }}>{sm.montantDu.toLocaleString('fr-FR')} €</span>
                              <button onClick={() => mettreAJour('suiviMensuel', (selectionne.suiviMensuel || []).filter((_, i) => i !== idx))} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {[
                              { label: 'N° Facture', champ: 'facture', type: 'text' },
                              { label: 'Date facture', champ: 'dateFacture', type: 'text', placeholder: 'JJ/MM/AAAA' },
                              { label: 'Date paiement', champ: 'datePaiement', type: 'text', placeholder: 'JJ/MM/AAAA' },
                            ].map(f => (
                              <div key={f.champ}>
                                <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>{f.label}</label>
                                <input type="text" placeholder={(f as any).placeholder || ''} style={{ ...inputStyle, fontSize: '11px', padding: '4px 6px' }} value={(sm as any)[f.champ] ?? ''} onChange={e => {
                                  const updated = (selectionne.suiviMensuel || []).map((s, i) => i === idx ? { ...s, [f.champ]: e.target.value } : s);
                                  mettreAJour('suiviMensuel', updated);
                                }} />
                              </div>
                            ))}
                          </div>
                          {/* Import facture formateur */}
                          <div style={{ marginTop: '8px' }}>
                            <label style={{ backgroundColor: sm.facture ? '#e6f4f1' : '#f0f0f0', color: sm.facture ? '#006B68' : '#555', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>
                              {sm.facture ? `✅ Facture importée` : '📎 Importer facture formateur'}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                                const f = ev.target.files?.[0];
                                if (f) {
                                  const updated = (selectionne.suiviMensuel || []).map((s, i) => i === idx ? { ...s, facture: f.name } : s);
                                  mettreAJour('suiviMensuel', updated);
                                }
                              }} />
                            </label>
                          </div>
                        </div>
                      ))}
                      {/* Total annuel */}
                      <div style={{ backgroundColor: '#006B68', borderRadius: '8px', padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {[
                          { label: 'Total heures', value: (selectionne.suiviMensuel || []).reduce((s, m) => s + m.heuresPresence + m.heuresDistanciel, 0) + 'h' },
                          { label: 'Total dû', value: (selectionne.suiviMensuel || []).reduce((s, m) => s + m.montantDu, 0).toLocaleString('fr-FR') + ' €' },
                          { label: 'Payé', value: (selectionne.suiviMensuel || []).filter(m => m.datePaiement).reduce((s, m) => s + m.montantDu, 0).toLocaleString('fr-FR') + ' €' },
                        ].map(t => (
                          <div key={t.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '2px' }}>{t.label}</div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#C8A23A' }}>{t.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PIÈCES JUSTIFICATIVES */}
              {ongletFormateur === 'pieces' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#006B68' }}>📎 Pièces justificatives</h3>
                <span style={{ fontSize: '12px', color: dossierComplet(selectionne) ? '#16a34a' : '#C8A23A', fontWeight: '600' }}>
                  {nbPiecesOk(selectionne)}/{PIECES_CONFIG.length} pièces
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PIECES_CONFIG.map(piece => {
                  const fichier = selectionne.pieces[piece.id as keyof typeof selectionne.pieces];
                  return (
                    <div key={piece.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', backgroundColor: fichier ? '#e6f4f1' : '#fffbf0', border: `1px solid ${fichier ? '#006B68' : '#C8A23A'}` }}>
                      <span style={{ fontSize: '18px', flexShrink: 0 }}>{fichier ? '✅' : '⚠️'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: fichier ? '#006B68' : '#333' }}>{piece.label}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>{fichier ? `${fichier.nom} — importé le ${fichier.date}` : piece.detail}</div>
                      </div>
                      <label style={{ backgroundColor: fichier ? 'white' : '#006B68', color: fichier ? '#006B68' : 'white', border: fichier ? '1px solid #006B68' : 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {fichier ? '🔄 Remplacer' : '⬆ Importer'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={ev => {
                          const f = ev.target.files?.[0];
                          if (f) importerPiece(piece.id, f);
                        }} />
                      </label>
                    </div>
                  );
                })}
              </div>
              </div>
              )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modale création */}
      {modale && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '520px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#006B68', marginBottom: '20px' }}>+ Nouveau formateur</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Nom *', champ: 'nom' },
                  { label: 'Prénom *', champ: 'prenom' },
                  { label: 'Téléphone', champ: 'telephone' },
                  { label: 'Email', champ: 'email' },
                  { label: 'N° SIRET', champ: 'siret' },
                  { label: 'N° NDA', champ: 'nda' },
                ].map(f => (
                  <div key={f.champ}>
                    <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                    <input style={inputStyle} value={(form as any)[f.champ] ?? ''} onChange={e => setForm(p => ({ ...p, [f.champ]: e.target.value }))} />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Formations dispensées</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {FORMATIONS_CODES.map(code => {
                    const actif = (form.specialites || []).includes(code);
                    return (
                      <button key={code} type="button" onClick={() => {
                        const updated = actif ? (form.specialites || []).filter(s => s !== code) : [...(form.specialites || []), code];
                        setForm(p => ({ ...p, specialites: updated }));
                      }} style={{ backgroundColor: actif ? '#006B68' : '#f0f0f0', color: actif ? 'white' : '#555', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Notes</label>
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setModale(false)} style={btnSecondary}>Annuler</button>
              <button onClick={creerFormateur} disabled={!form.nom || !form.prenom} style={{ ...btnPrimary, opacity: !form.nom || !form.prenom ? 0.5 : 1 }}>
                ✅ Créer le formateur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}