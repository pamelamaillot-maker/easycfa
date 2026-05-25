'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '../../../lib/UserContext';
import { COLORS } from '../../../lib/constants';
import {
  chargerMesSeances,
  filtrerParTemps,
  MaSeance,
  FiltreTemps,
} from '../../../lib/seancesService';

const LABELS_FILTRE: Record<FiltreTemps, string> = {
  aujourd_hui: "Aujourd'hui",
  a_venir: 'À venir',
  passees: 'Passées',
  toutes: 'Toutes',
};

const TYPE_STYLE: Record<string, { bg: string; color: string; icon: string; label: string }> = {
  cours:    { bg: '#e6f4f1', color: '#006B68', icon: '📖', label: 'Cours' },
  revision: { bg: '#fef6e4', color: '#C8A23A', icon: '📝', label: 'Révision' },
  examen:   { bg: '#fde8e8', color: '#e53e3e', icon: '🎓', label: 'Examen' },
};

export default function MesSeancesPage() {
  const { utilisateur } = useUser();
  const [seances, setSeances] = useState<MaSeance[]>([]);
  const [filtre, setFiltre] = useState<FiltreTemps>('aujourd_hui');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string>('');

  // Chargement des séances
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
      try {
        const data = await chargerMesSeances(utilisateur.formateurId!);
        setSeances(data);
      } catch (e) {
        console.error('[MesSeances] Erreur :', e);
        setErreur("Erreur lors du chargement de vos séances.");
      }
      setChargement(false);
    })();
  }, [utilisateur?.formateurId]);

  // Compteurs par filtre (pour les badges sur les boutons de filtre)
  const compteurs: Record<FiltreTemps, number> = {
    aujourd_hui: filtrerParTemps(seances, 'aujourd_hui').length,
    a_venir:     filtrerParTemps(seances, 'a_venir').length,
    passees:     filtrerParTemps(seances, 'passees').length,
    toutes:      seances.length,
  };

  const seancesAffichees = filtrerParTemps(seances, filtre);

  // Tri spécifique par filtre
  const seancesTriees = [...seancesAffichees].sort((a, b) => {
    const [jA, mA, aA] = a.date.split('/').map(Number);
    const [jB, mB, aB] = b.date.split('/').map(Number);
    const dateA = new Date(aA, mA - 1, jA).getTime();
    const dateB = new Date(aB, mB - 1, jB).getTime();
    // Passées : ordre décroissant (plus récente d'abord)
    if (filtre === 'passees') return dateB - dateA;
    // À venir / Aujourd'hui / Toutes : ordre croissant
    return dateA - dateB;
  });

  // RENDUS
  if (chargement) {
    return (
      <div style={{ padding: 32, color: COLORS.primary, fontWeight: 600 }}>
        ⏳ Chargement de vos séances...
      </div>
    );
  }

  if (erreur) {
    return (
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.primary, marginBottom: 16 }}>
          📅 Mes séances
        </h1>
        <div style={{ backgroundColor: '#fff3e0', borderRadius: 12, padding: 24, fontSize: 14, color: '#8a4b00' }}>
          ⚠️ {erreur}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960 }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.primary, margin: 0 }}>
            📅 Mes séances
          </h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            {compteurs.toutes} séance(s) au total — {compteurs.a_venir} à venir
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(Object.keys(LABELS_FILTRE) as FiltreTemps[]).map(f => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            style={{
              backgroundColor: filtre === f ? COLORS.primary : 'white',
              color: filtre === f ? 'white' : '#555',
              border: `1.5px solid ${filtre === f ? COLORS.primary : '#e0e0e0'}`,
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {LABELS_FILTRE[f]}
            <span style={{
              backgroundColor: filtre === f ? 'rgba(255,255,255,0.25)' : '#f0f0f0',
              color: filtre === f ? 'white' : '#888',
              borderRadius: 12,
              padding: '1px 8px',
              fontSize: 11,
              fontWeight: 800,
            }}>
              {compteurs[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Liste des séances */}
      {seancesTriees.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 14, color: '#555', fontWeight: 600 }}>
            {filtre === 'aujourd_hui' ? 'Aucune séance aujourd\'hui' :
             filtre === 'a_venir' ? 'Aucune séance à venir' :
             filtre === 'passees' ? 'Aucune séance passée' :
             'Aucune séance à afficher'}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
            {filtre === 'aujourd_hui' && 'Vérifiez "À venir" pour vos prochaines interventions.'}
            {filtre === 'a_venir' && 'Vos séances futures apparaîtront ici dès que PAMA aura mis à jour le planning.'}
          </div>
        </div>
      ) : (
        seancesTriees.map((seance, idx) => {
          const styleType = TYPE_STYLE[seance.type] || TYPE_STYLE.cours;
          const aFeuille = !!seance.feuilleEmargementId;

          return (
            <div
              key={`${seance.sessionId}-${seance.date}-${idx}`}
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 20,
                marginBottom: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${styleType.color}`,
              }}
            >
              {/* En-tête : date + type */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.primary }}>
                    📅 {seance.jour} {seance.date}
                  </div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                    📚 <strong>{seance.formation}</strong> — {seance.sessionNumero}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    📍 {seance.salle}
                    {seance.module && (
                      <> · 🎯 Module : <strong>{seance.module}</strong></>
                    )}
                    {seance.semaine !== undefined && (
                      <> · Semaine {seance.semaine}</>
                    )}
                  </div>
                </div>
                <span style={{
                  backgroundColor: styleType.bg,
                  color: styleType.color,
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  {styleType.icon} {styleType.label}
                </span>
              </div>

              {/* Statut feuille d'émargement */}
              <div style={{
                backgroundColor: aFeuille ? '#fef6e4' : '#f5f5f5',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                {aFeuille ? (
                  <>
                    <span style={{ fontSize: 16 }}>📝</span>
                    <span style={{ color: '#7a5c00', fontWeight: 600 }}>Feuille d'émargement disponible</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 16 }}>⚪</span>
                    <span style={{ color: '#666' }}>Pas encore de feuille d'émargement</span>
                  </>
                )}
              </div>

              {/* Bouton d'action */}
              {aFeuille ? (
                <Link
                  href={`/emargement?feuille=${seance.feuilleEmargementId}`}
                  style={{
                    display: 'inline-block',
                    backgroundColor: COLORS.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  ✍️ Compléter l'émargement
                </Link>
              ) : (
                <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                  La feuille sera créée par l'administration à l'approche de la séance.
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Footer info */}
      <div style={{
        marginTop: 24,
        padding: '12px 16px',
        backgroundColor: COLORS.background,
        borderRadius: 8,
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
      }}>
        💡 Vous voyez ici toutes les séances où vous êtes affecté(e) dans le planning des sessions.
        Pour toute modification de votre planning, contactez l'administration.
      </div>
    </div>
  );
}