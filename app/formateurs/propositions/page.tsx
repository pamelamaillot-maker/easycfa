'use client';

import { useEffect, useState } from 'react';
import { useUser } from '../../../lib/UserContext';
import { COLORS } from '../../../lib/constants';
import { supabase } from '../../../lib/supabaseClient';

type Proposition = {
  id: string;
  formateurId: string;
  proposeePar: string;
  dateProposition: string;
  champsModifies: Record<string, any>;
  notesFormateur: string | null;
  statut: 'en_attente' | 'validee' | 'refusee';
  validePar: string | null;
  dateValidation: string | null;
  motifRefus: string | null;
  formateur: { id: string; nom: string; prenom: string; email: string } | null;
};

export default function PropositionsAdmin() {
  const { utilisateur } = useUser();
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState<'en_attente' | 'validee' | 'refusee' | 'all'>('en_attente');
  const [enTraitement, setEnTraitement] = useState<string | null>(null);

  // Modale refus
  const [modaleRefus, setModaleRefus] = useState<Proposition | null>(null);
  const [motifRefus, setMotifRefus] = useState('');

  async function charger() {
    setChargement(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/propositions?statut=${filtre}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPropositions(data.propositions || []);
      } else {
        console.error('[Propositions] Erreur API :', res.status);
        setPropositions([]);
      }
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, [filtre]);

  async function validerOuRefuser(prop: Proposition, action: 'valider' | 'refuser', motif?: string) {
    setEnTraitement(prop.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/propositions/${prop.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, motif }),
      });

      if (res.ok) {
        await charger();
        setModaleRefus(null);
        setMotifRefus('');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.erreur || 'Erreur lors du traitement.');
      }
    } finally {
      setEnTraitement(null);
    }
  }

  // Vérifier que l'utilisateur a bien le bon role
  if (utilisateur && !['admin', 'pedagogique'].includes(utilisateur.role)) {
    return (
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.primary, marginBottom: 16 }}>
          📝 Propositions formateurs
        </h1>
        <div style={{ backgroundColor: '#fde8e8', borderRadius: 12, padding: 24, fontSize: 14, color: '#c33' }}>
          ⛔ Accès réservé à l'administration.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.primary, margin: 0 }}>
          📝 Propositions formateurs
        </h1>
        <button
          onClick={charger}
          style={{ backgroundColor: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          🔄 Rafraîchir
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'en_attente', label: '⏳ En attente', couleur: '#f59e0b' },
          { id: 'validee', label: '✅ Validées', couleur: '#10b981' },
          { id: 'refusee', label: '❌ Refusées', couleur: '#ef4444' },
          { id: 'all', label: '🗂️ Toutes', couleur: '#6b7280' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFiltre(f.id as any)}
            style={{
              backgroundColor: filtre === f.id ? f.couleur : 'white',
              color: filtre === f.id ? 'white' : '#666',
              border: `1.5px solid ${filtre === f.id ? f.couleur : '#e0e0e0'}`,
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {chargement && (
        <div style={{ padding: 32, textAlign: 'center', color: '#888', fontSize: 14 }}>
          ⏳ Chargement...
        </div>
      )}

      {!chargement && propositions.length === 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 40, textAlign: 'center', color: '#888', fontSize: 14 }}>
          Aucune proposition à afficher pour ce filtre.
        </div>
      )}

      {!chargement && propositions.map(prop => {
        const couleurStatut =
          prop.statut === 'en_attente' ? '#f59e0b' :
          prop.statut === 'validee' ? '#10b981' : '#ef4444';
        const labelStatut =
          prop.statut === 'en_attente' ? '⏳ En attente' :
          prop.statut === 'validee' ? '✅ Validée' : '❌ Refusée';
        const date = new Date(prop.dateProposition).toLocaleDateString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        return (
          <div key={prop.id} style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

            {/* En-tête : formateur + statut */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary }}>
                  {prop.formateur ? `${prop.formateur.prenom} ${prop.formateur.nom}` : 'Formateur inconnu'}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {prop.formateur?.email || ''} — proposée le {date}
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: couleurStatut, padding: '4px 10px', backgroundColor: `${couleurStatut}20`, borderRadius: 12, whiteSpace: 'nowrap' }}>
                {labelStatut}
              </div>
            </div>

            {/* Champs proposés */}
            <div style={{ backgroundColor: '#f7f9f9', borderLeft: `3px solid ${COLORS.primary}`, padding: '12px 16px', borderRadius: 6, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.4, marginBottom: 6 }}>
                Champs proposés
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#333', lineHeight: 1.7 }}>
                {Object.entries(prop.champsModifies).map(([cle, val]) => {
                  let valAffichee: string;
                  if (Array.isArray(val)) {
                    valAffichee = val.join(', ');
                  } else if (typeof val === 'object' && val !== null) {
                    valAffichee = JSON.stringify(val);
                  } else {
                    valAffichee = String(val ?? '');
                  }
                  return (
                    <li key={cle}>
                      <strong>{cle}</strong> : {valAffichee || <em style={{ color: '#aaa' }}>(vide)</em>}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Note du formateur */}
            {prop.notesFormateur && (
              <div style={{ backgroundColor: '#fff8e1', borderLeft: `3px solid ${COLORS.secondary}`, padding: '10px 16px', borderRadius: 6, marginBottom: 12, fontSize: 12, fontStyle: 'italic', color: '#555' }}>
                « {prop.notesFormateur} »
              </div>
            )}

            {/* Motif refus (si refusée) */}
            {prop.statut === 'refusee' && prop.motifRefus && (
              <div style={{ backgroundColor: '#fde8e8', borderLeft: '3px solid #ef4444', padding: '10px 16px', borderRadius: 6, marginBottom: 12, fontSize: 12, color: '#c33' }}>
                <strong>Motif du refus :</strong> {prop.motifRefus}
              </div>
            )}

            {/* Actions (uniquement si en attente) */}
            {prop.statut === 'en_attente' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => validerOuRefuser(prop, 'valider')}
                  disabled={enTraitement === prop.id}
                  style={{ flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: enTraitement === prop.id ? 0.6 : 1 }}
                >
                  {enTraitement === prop.id ? '⏳ Traitement...' : '✅ Valider'}
                </button>
                <button
                  onClick={() => { setModaleRefus(prop); setMotifRefus(''); }}
                  disabled={enTraitement === prop.id}
                  style={{ flex: 1, backgroundColor: 'white', color: '#ef4444', border: '1.5px solid #ef4444', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  ❌ Refuser
                </button>
              </div>
            )}

            {/* Footer (si traitée) */}
            {prop.statut !== 'en_attente' && prop.dateValidation && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
                Traitée le {new Date(prop.dateValidation).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}

          </div>
        );
      })}

      {/* MODALE REFUS */}
      {modaleRefus && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 28, width: 480, maxWidth: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary, marginBottom: 8 }}>
              Refuser la proposition
            </h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
              Indiquez le motif du refus. Le formateur sera notifié de votre décision.
            </p>

            <textarea
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              placeholder="Ex : merci de fournir le justificatif officiel avant validation."
              rows={4}
              style={{ border: '1.5px solid #ddd', borderRadius: 8, padding: 12, fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 16 }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setModaleRefus(null); setMotifRefus(''); }}
                style={{ backgroundColor: '#f0f0f0', color: '#666', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={() => validerOuRefuser(modaleRefus, 'refuser', motifRefus.trim())}
                disabled={!motifRefus.trim() || enTraitement === modaleRefus.id}
                style={{ backgroundColor: motifRefus.trim() ? '#ef4444' : '#ccc', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: motifRefus.trim() ? 'pointer' : 'not-allowed' }}
              >
                {enTraitement === modaleRefus.id ? '⏳ Envoi...' : '❌ Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}