'use client';

// components/SelecteurJure.tsx
// Sélection d'un juré depuis le répertoire, avec création à la volée.
//
// Priorité d'affichage : les jurés déjà intervenus sur le TP de la session
// apparaissent en tête, les autres ensuite. Les jurés inactifs sont masqués.
//
// Création : contrôle de doublon sur la clé nom+prénom normalisée AVANT
// enregistrement. Un homonyme est signalé, jamais créé silencieusement.

import { useEffect, useState } from 'react';
import {
  chargerJures,
  creerJure,
  genererIdJure,
  cleJure,
  type Jure as JureDb,
} from '../data/juresSupabase';

const champStyle: React.CSSProperties = {
  border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '6px 9px',
  fontSize: '12px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white',
};

export interface JureSession {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  specialite?: string;
  disponible?: boolean;
  mailEnvoye?: string;
  confirme?: boolean;
}

export default function SelecteurJure({
  formation,
  dejaPresents = [],
  onAjouter,
  onFermer,
}: {
  formation: string;
  dejaPresents?: JureSession[];
  onAjouter: (jure: JureSession) => void;
  onFermer: () => void;
}) {
  const [repertoire, setRepertoire] = useState<JureDb[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [modeCreation, setModeCreation] = useState(false);
  const [form, setForm] = useState<Partial<JureDb>>({});
  const [alerte, setAlerte] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    (async () => {
      const liste = await chargerJures();
      setRepertoire(liste.filter(j => !j.archive && j.actif !== false));
      setChargement(false);
    })();
  }, []);

  // Clés des jurés déjà dans la session : on ne les propose plus.
  const clesPresentes = new Set(dejaPresents.map(j => cleJure(j.nom ?? '', j.prenom ?? '')));

  const filtres = repertoire.filter(j => {
    if (clesPresentes.has(j.cle ?? cleJure(j.nom, j.prenom))) return false;
    if (!recherche.trim()) return true;
    const q = recherche.trim().toLowerCase();
    return `${j.nom} ${j.prenom} ${j.specialite ?? ''} ${j.entreprise ?? ''}`.toLowerCase().includes(q);
  });

  // Les jurés déjà intervenus sur ce TP d'abord.
  const connait = (j: JureDb) => (j.formations ?? []).includes(formation);
  const prioritaires = filtres.filter(connait).sort((a, b) => (b.nbInterventions ?? 0) - (a.nbInterventions ?? 0));
  const autres = filtres.filter(j => !connait(j)).sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? ''));

  function selectionner(j: JureDb) {
    onAjouter({
      id: Date.now().toString(),
      nom: j.nom,
      prenom: j.prenom,
      telephone: j.telephone ?? '',
      email: j.email ?? '',
      specialite: j.specialite ?? '',
      disponible: false,
      mailEnvoye: '',
      confirme: false,
    });
    onFermer();
  }

  async function creerEtAjouter() {
    const nom = (form.nom ?? '').trim();
    const prenom = (form.prenom ?? '').trim();
    if (!nom || !prenom) { setAlerte('Le nom et le prénom sont obligatoires.'); return; }

    // Contrôle de doublon AVANT enregistrement.
    const cle = cleJure(nom, prenom);
    const existant = repertoire.find(j => (j.cle ?? cleJure(j.nom, j.prenom)) === cle);
    if (existant) {
      setAlerte(`${existant.nom} ${existant.prenom} figure déjà au répertoire. Sélectionnez-le dans la liste plutôt que d'en créer un second.`);
      setModeCreation(false);
      setRecherche(nom);
      return;
    }

    setEnregistrement(true);
    const fiche: JureDb = {
      id: genererIdJure(nom, prenom),
      nom, prenom,
      telephone: form.telephone,
      email: form.email,
      specialite: form.specialite,
      entreprise: form.entreprise,
      fonction: form.fonction,
      formations: [formation],
    };
    const r = await creerJure(fiche);
    setEnregistrement(false);

    if (!r.success) { setAlerte('Enregistrement impossible : ' + r.error); return; }

    setRepertoire(prev => [...prev, fiche]);
    onAjouter({
      id: Date.now().toString(),
      nom, prenom,
      telephone: form.telephone ?? '',
      email: form.email ?? '',
      specialite: form.specialite ?? '',
      disponible: false,
      mailEnvoye: '',
      confirme: false,
    });
    onFermer();
  }

  const Ligne = ({ j, prioritaire }: { j: JureDb; prioritaire: boolean }) => (
    <div
      onClick={() => selectionner(j)}
      style={{
        padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '5px',
        border: `1px solid ${prioritaire ? '#006B68' : '#e0e0e0'}`,
        backgroundColor: prioritaire ? '#e6f4f1' : 'white',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#006B68' }}>{j.nom} {j.prenom}</span>
          {j.specialite && <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px' }}>· {j.specialite}</span>}
        </div>
        <div style={{ fontSize: '10px', color: '#888', textAlign: 'right' }}>
          {(j.nbInterventions ?? 0) > 0 && <span>{j.nbInterventions} session(s)</span>}
          {(j.formations ?? []).length > 0 && <span> · {(j.formations ?? []).join(', ')}</span>}
          {j.dernierExamen && <span> · dernier : {j.dernierExamen}</span>}
        </div>
      </div>
      {(j.telephone || j.email) && (
        <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
          {j.telephone && <span>📞 {j.telephone}</span>}
          {j.telephone && j.email && <span> · </span>}
          {j.email && <span>✉️ {j.email}</span>}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '22px', width: '620px', maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#006B68' }}>
            {modeCreation ? '➕ Nouveau juré' : '👨‍⚖️ Choisir un juré'}
          </h2>
          <button onClick={onFermer} style={{ backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '5px 9px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
        </div>

        {alerte && (
          <div style={{ backgroundColor: '#fef6e4', border: '1px solid #C8A23A', borderRadius: '8px', padding: '9px 11px', marginBottom: '12px', fontSize: '11px', color: '#8a6d1f' }}>
            ⚠️ {alerte}
            <button onClick={() => setAlerte(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {!modeCreation ? (
          <>
            <input
              style={{ ...champStyle, marginBottom: '12px' }}
              value={recherche}
              placeholder="🔍 Rechercher par nom, spécialité, entreprise..."
              onChange={e => setRecherche(e.target.value)}
              autoFocus
            />

            {chargement ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '12px' }}>Chargement du répertoire…</div>
            ) : (
              <>
                {prioritaires.length > 0 && (
                  <>
                    <div style={{ fontSize: '10px', color: '#006B68', fontWeight: '700', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Déjà intervenus sur {formation}
                    </div>
                    {prioritaires.map(j => <Ligne key={j.id} j={j} prioritaire />)}
                  </>
                )}

                {autres.length > 0 && (
                  <>
                    <div style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', marginTop: '12px', marginBottom: '5px' }}>
                      Autres jurés du répertoire
                    </div>
                    {autres.map(j => <Ligne key={j.id} j={j} prioritaire={false} />)}
                  </>
                )}

                {prioritaires.length === 0 && autres.length === 0 && (
                  <div style={{ padding: '18px', textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '12px' }}>
                    {recherche.trim()
                      ? 'Aucun juré ne correspond à cette recherche.'
                      : 'Le répertoire est vide. Créez un juré ou alimentez-le depuis les sessions.'}
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #EAF4F3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#888' }}>Le juré ne figure pas dans la liste ?</span>
              <button
                onClick={() => { setModeCreation(true); setAlerte(null); setForm({ nom: recherche.trim() }); }}
                style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 13px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                ➕ Nouveau juré
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px', fontStyle: 'italic' }}>
              La fiche sera enregistrée immédiatement dans le répertoire, et le juré ajouté à cette session.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { l: 'Nom *', k: 'nom' },
                { l: 'Prénom *', k: 'prenom' },
                { l: 'Téléphone', k: 'telephone' },
                { l: 'Email', k: 'email' },
                { l: 'Entreprise', k: 'entreprise' },
                { l: 'Fonction', k: 'fonction' },
              ].map(f => (
                <div key={f.k}>
                  <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>{f.l}</label>
                  <input
                    style={champStyle}
                    value={(form as any)[f.k] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                  />
                </div>
              ))}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '3px' }}>Spécialité</label>
                <input
                  style={champStyle}
                  value={form.specialite ?? ''}
                  placeholder={`ex. ${formation}`}
                  onChange={e => setForm(p => ({ ...p, specialite: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                onClick={() => { setModeCreation(false); setAlerte(null); }}
                style={{ backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                ← Retour à la liste
              </button>
              <button
                onClick={creerEtAjouter}
                disabled={!form.nom || !form.prenom || enregistrement}
                style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: enregistrement ? 'wait' : 'pointer', opacity: (!form.nom || !form.prenom || enregistrement) ? 0.5 : 1 }}
              >
                {enregistrement ? '⏳ Enregistrement…' : '✅ Créer et ajouter'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
