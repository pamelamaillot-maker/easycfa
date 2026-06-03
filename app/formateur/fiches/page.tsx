'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '../../../lib/UserContext';
import { chargerInterventionsFormateur } from '../../../data/interventionsSupabase';

const btnSecondary: React.CSSProperties = { backgroundColor: 'white', color: '#006B68', border: '1.5px solid #006B68', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block' };

export default function FormateurFiches() {
  const { utilisateur } = useUser();
  const [fiches, setFiches] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!utilisateur?.formateurId) {
      setFiches([]);
      setChargement(false);
      return;
    }
    setChargement(true);
    chargerInterventionsFormateur(utilisateur.formateurId)
      .then(f => setFiches(f))
      .catch(() => setFiches([]))
      .finally(() => setChargement(false));
  }, [utilisateur?.formateurId]);

  const contenu = (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#006B68', marginBottom: 4 }}>
        📝 Mes fiches d&apos;intervention
      </h1>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
        Retrouvez et signez vos fiches d&apos;intervention pédagogique.
      </p>

      {!utilisateur?.formateurId ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888', backgroundColor: 'white', borderRadius: 12, fontSize: 13 }}>
          Votre compte n&apos;est pas encore relié à un profil formateur. Contactez l&apos;administration.
        </div>
      ) : chargement ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888', backgroundColor: 'white', borderRadius: 12, fontSize: 13 }}>
          Chargement de vos fiches…
        </div>
      ) : fiches.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888', backgroundColor: 'white', borderRadius: 12, fontSize: 13, fontStyle: 'italic' }}>
          Aucune fiche d&apos;intervention pour le moment. Elles apparaîtront ici dès qu&apos;une feuille d&apos;émargement vous sera attribuée.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fiches
            .slice()
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            .map(fi => {
              const signee = !!fi.dateSignature;
              return (
                <div key={fi.id} style={{ backgroundColor: signee ? '#e6f4f1' : '#fffbf0', borderRadius: 8, padding: '12px 14px', border: `1px solid ${signee ? '#006B68' : '#C8A23A'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#006B68' }}>
                      {fi.jour} {fi.date}{fi.sessionNumero ? ` — ${fi.sessionNumero}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                      {fi.formationLabel || '—'}{fi.seance ? ` • ${fi.seance}` : ''}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>
                      {signee ? (
                        <span style={{ color: '#15803d', fontWeight: 600 }}>
                          ✅ Signée le {new Date(fi.dateSignature).toLocaleDateString('fr-FR')} à {fi.heureSignature}
                        </span>
                      ) : (
                        <span style={{ color: '#C8A23A', fontWeight: 600 }}>⏳ À compléter et signer</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/emargement?feuille=${fi.id}`} style={btnSecondary}>
                    {signee ? 'Voir →' : 'Compléter →'}
                  </Link>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );

  return contenu;
}