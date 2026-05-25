'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../../../lib/UserContext';
import { COLORS } from '../../../lib/constants';
import {
  CHAMPS_LIBRES,
  CHAMPS_VALIDATION,
  CHAMPS_ADMIN_ONLY,
  ChampFormateur,
} from '../../../lib/formateurChamps';
import {
  chargerFormateur,
  majChampsLibres,
  creerProposition,
  chargerMesPropositions,
  Formateur,
  Proposition,
} from '../../../lib/formateurService';

export default function FormateurProfil() {
  const { utilisateur } = useUser();
  const [formateur, setFormateur] = useState<Formateur | null>(null);
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  // --- Édition libre (téléphone)
  const [editLibre, setEditLibre] = useState(false);
  const [valeursLibres, setValeursLibres] = useState<Record<string, any>>({});
  const [enregistrement, setEnregistrement] = useState(false);

  // --- Modale "Proposer modification"
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [champEnEdition, setChampEnEdition] = useState<ChampFormateur | null>(null);
  const [valeurProposee, setValeurProposee] = useState<any>('');
  const [notesFormateur, setNotesFormateur] = useState('');
  const [envoiProposition, setEnvoiProposition] = useState(false);

  // --- Chargement initial
  useEffect(() => {
    if (!utilisateur?.formateurId) {
      setErreur(
        "Votre compte n'est pas encore relié à une fiche formateur. " +
        "Contactez l'administration (pamelamaillot@pamoi.re)."
      );
      setChargement(false);
      return;
    }

    (async () => {
      const [f, props] = await Promise.all([
        chargerFormateur(utilisateur.formateurId!),
        chargerMesPropositions(utilisateur.formateurId!),
      ]);
      if (f) {
        setFormateur(f);
        // Initialiser les valeurs des champs libres
        const init: Record<string, any> = {};
        CHAMPS_LIBRES.forEach((c) => {
          init[c.cle] = (f as any)[c.cle] ?? '';
        });
        setValeursLibres(init);
      } else {
        setErreur("Impossible de charger votre fiche formateur.");
      }
      setPropositions(props);
      setChargement(false);
    })();
  }, [utilisateur?.formateurId]);

  // --- Recharger les propositions après création
  async function recharger() {
    if (!utilisateur?.formateurId) return;
    const props = await chargerMesPropositions(utilisateur.formateurId);
    setPropositions(props);
  }

  // --- Sauvegarder les champs libres
  async function handleSaveLibre() {
    if (!formateur) return;
    setEnregistrement(true);
    const res = await majChampsLibres(formateur.id, valeursLibres);
    if (res.ok) {
      setFormateur({ ...formateur, ...valeursLibres });
      setEditLibre(false);
    } else {
      setErreur(res.erreur || 'Erreur enregistrement.');
    }
    setEnregistrement(false);
  }

  // --- Ouvrir modale proposition
  function ouvrirModale(champ: ChampFormateur) {
    setChampEnEdition(champ);
    const valActuelle = (formateur as any)?.[champ.cle];
    if (champ.type === 'jsonb_array') {
      setValeurProposee(Array.isArray(valActuelle) ? valActuelle.join('\n') : '');
    } else {
      setValeurProposee(valActuelle ?? '');
    }
    setNotesFormateur('');
    setModaleOuverte(true);
  }

  // --- Envoyer la proposition
  async function handleEnvoyerProposition() {
    if (!champEnEdition || !formateur) return;
    setEnvoiProposition(true);
    let valeurFinale: any = valeurProposee;
    if (champEnEdition.type === 'jsonb_array') {
      valeurFinale = (valeurProposee as string)
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    const res = await creerProposition({
      formateurId: formateur.id,
      champsModifies: { [champEnEdition.cle]: valeurFinale },
      notesFormateur: notesFormateur || undefined,
    });

    if (res.ok) {
      setModaleOuverte(false);
      await recharger();
    } else {
      setErreur(res.erreur || 'Erreur envoi proposition.');
    }
    setEnvoiProposition(false);
  }

  // ============================================================
  // RENDUS
  // ============================================================

  if (chargement) {
    return (
      <div style={{ padding: 32, color: COLORS.primary, fontWeight: 600 }}>
        ⏳ Chargement de votre profil...
      </div>
    );
  }

  if (erreur && !formateur) {
    return (
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.primary, marginBottom: 16 }}>
          👤 Mon profil
        </h1>
        <div style={{ backgroundColor: '#fff3e0', borderRadius: 12, padding: 24, fontSize: 14, color: '#8a4b00' }}>
          ⚠️ {erreur}
        </div>
      </div>
    );
  }

  if (!formateur) return null;

  return (
    <div style={{ maxWidth: 880 }}>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.primary, marginBottom: 16 }}>
        👤 Mon profil
      </h1>

      {/* Bandeau identité */}
      <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: COLORS.secondary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, flexShrink: 0 }}>
          {(formateur.prenom?.[0] || '') + (formateur.nom?.[0] || '')}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.primary }}>
            {formateur.prenom} {formateur.nom}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
            Formateur — {formateur.email || 'email non renseigné'}
          </div>
          {formateur.statut && (
            <div style={{ display: 'inline-block', marginTop: 8, backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {formateur.statut}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1 : ÉDITION LIBRE */}
      <section style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.6 }}>
              🟢 ÉDITION LIBRE
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary, marginTop: 2 }}>
              Informations directes
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              Vous pouvez modifier ces champs immédiatement, sans validation.
            </div>
          </div>
          {!editLibre && (
            <button
              onClick={() => setEditLibre(true)}
              style={{ backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              ✏️ Modifier
            </button>
          )}
        </div>

        {CHAMPS_LIBRES.map((champ) => (
          <div key={champ.cle} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              {champ.label}
            </label>
            {editLibre ? (
              <input
                type={champ.type === 'tel' ? 'tel' : 'text'}
                value={valeursLibres[champ.cle] || ''}
                onChange={(e) => setValeursLibres({ ...valeursLibres, [champ.cle]: e.target.value })}
                placeholder={champ.description}
                style={{ border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, width: '100%', maxWidth: 400, boxSizing: 'border-box' }}
              />
            ) : (
              <div style={{ fontSize: 14, color: '#333', padding: '6px 0' }}>
                {(formateur as any)[champ.cle] || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Non renseigné</span>}
              </div>
            )}
            {champ.description && editLibre && (
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{champ.description}</div>
            )}
          </div>
        ))}

        {editLibre && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={handleSaveLibre}
              disabled={enregistrement}
              style={{ backgroundColor: enregistrement ? '#ccc' : COLORS.primary, color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: enregistrement ? 'not-allowed' : 'pointer' }}
            >
              {enregistrement ? '⏳ Enregistrement...' : '✅ Enregistrer'}
            </button>
            <button
              onClick={() => setEditLibre(false)}
              style={{ backgroundColor: '#f0f0f0', color: '#666', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Annuler
            </button>
          </div>
        )}
      </section>

      {/* SECTION 2 : PROPOSITIONS (validation admin) */}
      <section style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.6 }}>
            🟡 INFOS SOUMISES À VALIDATION
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary, marginTop: 2 }}>
            Demander une modification
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Pour ces champs, votre demande sera validée par l'administration avant prise en compte.
          </div>
        </div>

        {CHAMPS_VALIDATION.map((champ) => {
          const valActuelle = (formateur as any)[champ.cle];
          let valAffichee: React.ReactNode;
          if (valActuelle === null || valActuelle === undefined || valActuelle === '') {
            valAffichee = <span style={{ color: '#bbb', fontStyle: 'italic' }}>Non renseigné</span>;
          } else if (Array.isArray(valActuelle)) {
            valAffichee = valActuelle.length > 0 ? valActuelle.join(', ') : <span style={{ color: '#bbb', fontStyle: 'italic' }}>Aucune entrée</span>;
          } else if (typeof valActuelle === 'object') {
            valAffichee = <span style={{ fontSize: 13, color: '#666' }}>{Object.keys(valActuelle).length} élément(s)</span>;
          } else {
            valAffichee = String(valActuelle);
          }
          return (
            <div key={champ.cle} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  {champ.label}
                </label>
                <div style={{ fontSize: 14, color: '#333' }}>
                  {valAffichee || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Non renseigné</span>}
                </div>
              </div>
              <button
                onClick={() => ouvrirModale(champ)}
                style={{ backgroundColor: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                ✏️ Proposer
              </button>
            </div>
          );
        })}
      </section>

      {/* SECTION 3 : ADMIN ONLY (lecture seule) */}
      <section style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.6 }}>
            🔴 INFOS OFFICIELLES
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary, marginTop: 2 }}>
            Gérées par l'administration
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Ces informations sont en lecture seule. Pour les modifier, contactez pamelamaillot@pamoi.re.
          </div>
        </div>

        {CHAMPS_ADMIN_ONLY.map((champ) => {
          const valActuelle = (formateur as any)[champ.cle];
          let valAffichee: React.ReactNode;
          if (valActuelle === null || valActuelle === undefined || valActuelle === '') {
            valAffichee = <span style={{ color: '#bbb', fontStyle: 'italic' }}>Non renseigné</span>;
          } else if (Array.isArray(valActuelle)) {
            valAffichee = valActuelle.length > 0 ? valActuelle.join(', ') : <span style={{ color: '#bbb', fontStyle: 'italic' }}>Aucune entrée</span>;
          } else if (typeof valActuelle === 'object') {
            // Cas des objets structurés (ex: pieces avec cv, cni, kbis...)
            const cles = Object.keys(valActuelle);
            valAffichee = cles.length > 0
              ? <span style={{ fontSize: 13, color: '#666' }}>{cles.length} élément(s) : {cles.join(', ')}</span>
              : <span style={{ color: '#bbb', fontStyle: 'italic' }}>Aucune entrée</span>;
          } else {
            valAffichee = String(valActuelle);
          }
          return (
            <div key={champ.cle} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                {champ.label}
              </label>
              <div style={{ fontSize: 14, color: '#333' }}>
                {valAffichee}
              </div>
              {champ.description && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{champ.description}</div>
              )}
            </div>
          );
        })}
      </section>

      {/* SECTION 4 : MES PROPOSITIONS */}
      <section style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.6 }}>
            📋 HISTORIQUE
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary, marginTop: 2 }}>
            Mes propositions
          </div>
        </div>

        {propositions.length === 0 ? (
          <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', padding: 16, textAlign: 'center' }}>
            Vous n'avez pas encore soumis de modification.
          </div>
        ) : (
          propositions.map((p) => {
            const couleurStatut =
              p.statut === 'en_attente' ? '#f59e0b' :
              p.statut === 'validee' ? '#10b981' : '#ef4444';
            const labelStatut =
              p.statut === 'en_attente' ? '⏳ En attente' :
              p.statut === 'validee' ? '✅ Validée' : '❌ Refusée';
            const date = new Date(p.dateProposition).toLocaleDateString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            return (
              <div key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>{date}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: couleurStatut, padding: '3px 10px', backgroundColor: `${couleurStatut}20`, borderRadius: 12 }}>
                    {labelStatut}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#333' }}>
                  <strong>Champs proposés :</strong>{' '}
                  {Object.keys(p.champsModifies).join(', ')}
                </div>
                {p.notesFormateur && (
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic' }}>
                    « {p.notesFormateur} »
                  </div>
                )}
                {p.motifRefus && (
                  <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                    Motif du refus : {p.motifRefus}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* MODALE PROPOSITION */}
      {modaleOuverte && champEnEdition && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 32, width: 520, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary, marginBottom: 8 }}>
              Proposer une modification : {champEnEdition.label}
            </h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.5 }}>
              Votre demande sera soumise à validation par l'administration.
              Vous serez notifié(e) du résultat dans votre historique.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Nouvelle valeur
              </label>
              {champEnEdition.type === 'jsonb_array' ? (
                <textarea
                  value={valeurProposee}
                  onChange={(e) => setValeurProposee(e.target.value)}
                  placeholder="Une entrée par ligne..."
                  rows={6}
                  style={{ border: '1.5px solid #ddd', borderRadius: 8, padding: 12, fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              ) : (
                <input
                  type={champEnEdition.type}
                  value={valeurProposee}
                  onChange={(e) => setValeurProposee(e.target.value)}
                  style={{ border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 14px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                />
              )}
              {champEnEdition.description && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{champEnEdition.description}</div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Notes pour l'administration (optionnel)
              </label>
              <textarea
                value={notesFormateur}
                onChange={(e) => setNotesFormateur(e.target.value)}
                placeholder="Précisez le motif ou ajoutez des informations utiles..."
                rows={3}
                style={{ border: '1.5px solid #ddd', borderRadius: 8, padding: 12, fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModaleOuverte(false)}
                style={{ backgroundColor: '#f0f0f0', color: '#666', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleEnvoyerProposition}
                disabled={envoiProposition || !valeurProposee}
                style={{ backgroundColor: envoiProposition || !valeurProposee ? '#ccc' : COLORS.primary, color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: envoiProposition || !valeurProposee ? 'not-allowed' : 'pointer' }}
              >
                {envoiProposition ? '⏳ Envoi...' : '📩 Envoyer la proposition'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}