'use client';

// components/TauxReussite.tsx
// Onglet « Taux de réussite » — composant autonome.
// Utilisé par la page Examens, et destiné à être réutilisé tel quel
// dans la page Qualiopi lors de sa refonte (indicateur 2 du RNQ).

import { useState } from 'react';
import Card from './Card';
import { ccpsDuTP } from '../lib/referentielsTP';
import {
  METHODE_PAR_DEFAUT,
  libelleMethode,
  tauxParTP,
  tauxParAnnee,
  tauxParCandidature,
  tauxParCcp,
  phrasePublication,
  type MethodeCalcul,
  type TauxDetail,
} from '../lib/tauxReussite';

const inputStyleLocal: React.CSSProperties = {
  border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '5px 7px',
  fontSize: '11px', boxSizing: 'border-box', backgroundColor: 'white',
};

function couleurTaux(taux: number | null): string {
  if (taux === null) return '#ccc';
  if (taux >= 80) return '#16a34a';
  if (taux >= 50) return '#C8A23A';
  return '#e53e3e';
}

function Tableau({ titre, lignes, note }: { titre: string; lignes: TauxDetail[]; note?: string }) {
  return (
    <Card>
      <div style={{ fontSize: '13px', fontWeight: '800', color: '#006B68', marginBottom: '4px' }}>{titre}</div>
      {note && <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px', fontStyle: 'italic' }}>{note}</div>}
      {lignes.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', padding: '10px 0' }}>
          Aucune donnée sur cette période.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #EAF4F3', color: '#888', textAlign: 'right' }}>
                <th style={{ textAlign: 'left', padding: '5px 4px' }}>&nbsp;</th>
                <th style={{ padding: '5px 4px' }}>Inscrits</th>
                <th style={{ padding: '5px 4px' }}>Présentés</th>
                <th style={{ padding: '5px 4px' }}>Abs.</th>
                <th style={{ padding: '5px 4px', color: '#16a34a' }}>Réussite</th>
                <th style={{ padding: '5px 4px', color: '#C8A23A' }}>Partielle</th>
                <th style={{ padding: '5px 4px', color: '#e53e3e' }}>Échec</th>
                <th style={{ padding: '5px 4px' }}>À saisir</th>
                <th style={{ padding: '5px 4px', fontWeight: '800' }}>Taux</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(t => (
                <tr key={t.cle} style={{ borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>
                  <td style={{ textAlign: 'left', padding: '6px 4px', fontWeight: '700', color: '#006B68' }}>{t.libelle}</td>
                  <td style={{ padding: '6px 4px' }}>{t.inscrits}</td>
                  <td style={{ padding: '6px 4px' }}>{t.presentes}</td>
                  <td style={{ padding: '6px 4px', color: t.absents > 0 ? '#888' : '#ccc' }}>{t.absents}</td>
                  <td style={{ padding: '6px 4px', color: '#16a34a', fontWeight: '600' }}>{t.reussites}</td>
                  <td style={{ padding: '6px 4px', color: '#C8A23A', fontWeight: '600' }}>{t.partielles}</td>
                  <td style={{ padding: '6px 4px', color: '#e53e3e', fontWeight: '600' }}>{t.echecs}</td>
                  <td style={{ padding: '6px 4px', color: t.nonRenseignes > 0 ? '#e53e3e' : '#ccc', fontWeight: t.nonRenseignes > 0 ? '700' : '400' }}>{t.nonRenseignes}</td>
                  <td style={{ padding: '6px 4px', fontWeight: '800', color: couleurTaux(t.taux) }}>
                    {t.taux === null ? '—' : t.taux + ' %'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function TauxReussite({
  sessions,
  filtreTP = '',
  filtreAnnee = '',
  formations = {},
}: {
  sessions: any[];
  filtreTP?: string;
  filtreAnnee?: string;
  formations?: Record<string, { label?: string; couleur?: string }>;
}) {
  const [methode, setMethode] = useState<MethodeCalcul>(METHODE_PAR_DEFAUT);

  const annees = Array.from(new Set(sessions.map(s => {
    const p = (s.dateDebut ?? '').split('/');
    return p.length === 3 ? (p[2].length === 2 ? '20' + p[2] : p[2]) : '';
  }).filter(Boolean))).sort();

  const anneeRef = filtreAnnee || annees[annees.length - 1] || '';
  const periode = anneeRef ? `en ${anneeRef}` : 'toutes années';

  const parTP = tauxParTP(sessions, methode, filtreAnnee || undefined);
  const parAnnee = tauxParAnnee(sessions, methode, filtreTP || undefined);
  const parCand = tauxParCandidature(sessions, methode, filtreAnnee || undefined, filtreTP || undefined);
  const totalNonRens = parTP.reduce((n, t) => n + t.nonRenseignes, 0);

  const siglesAffiches = filtreTP ? [filtreTP] : Object.keys(formations);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Portée réglementaire */}
      <div style={{ backgroundColor: '#EAF4F3', border: '1px solid #006B68', borderRadius: '10px', padding: '12px 14px', fontSize: '11px', color: '#333', lineHeight: '1.6' }}>
        <strong style={{ color: '#006B68' }}>⚖️ Portée de ces taux.</strong> Pour un CFA, les indicateurs de résultats
        obligatoires sont ceux de l&apos;article L. 6111-8 du code du travail : ils sont calculés par les ministères et
        publiés sur{' '}
        <a href="https://www.inserjeunes.education.gouv.fr/diffusion/accueil" target="_blank" rel="noopener noreferrer" style={{ color: '#006B68', fontWeight: '600' }}>
          InserJeunes
        </a>
        , dont le CFA informe le public. Les taux ci-dessous sont des <strong>outils de pilotage interne</strong>{' '}
        (indicateurs 2 et 30 à 32 du RNQ), et servent de substitut lorsque les données InserJeunes ne sont pas disponibles.
      </div>

      {/* Méthode paramétrable */}
      <Card>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#006B68', marginBottom: '8px' }}>⚙️ Méthode de calcul</div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <div>
            <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '3px', textTransform: 'uppercase' }}>Dénominateur</label>
            <select style={inputStyleLocal} value={methode.base} onChange={e => setMethode({ ...methode, base: e.target.value as any })}>
              <option value="presentes">Candidats présentés (absents exclus)</option>
              <option value="inscrits">Candidats inscrits (absents inclus)</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer', paddingTop: '16px' }}>
            <input type="checkbox" checked={methode.inclureNonRenseignes} onChange={e => setMethode({ ...methode, inclureNonRenseignes: e.target.checked })} />
            Inclure les dossiers sans résultat saisi
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer', paddingTop: '16px' }}>
            <input type="checkbox" checked={methode.partielCompteCommeReussite} onChange={e => setMethode({ ...methode, partielCompteCommeReussite: e.target.checked })} />
            Compter la réussite partielle comme une réussite
          </label>
        </div>
        <div style={{ backgroundColor: '#fafafa', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#555', fontStyle: 'italic' }}>
          📋 {libelleMethode(methode)}
          <div style={{ fontSize: '10px', marginTop: '4px' }}>
            Aucune formule n&apos;est imposée par le RNQ ni par la DEETS. Ce qui est exigé : afficher l&apos;effectif,
            la période de référence et la méthode retenue — cette phrase est à présenter à l&apos;auditeur.
          </div>
        </div>
      </Card>

      {totalNonRens > 0 && (
        <div style={{ backgroundColor: '#fde8e8', border: '1px solid #e53e3e', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#c53030', fontWeight: '600' }}>
          ⚠️ {totalNonRens} candidat(s) sans résultat CCP saisi — ces dossiers sont exclus du calcul.
          Complétez-les pour fiabiliser vos taux.
        </div>
      )}

      <Tableau titre={`Taux d'obtention du titre par TP ${filtreAnnee ? '— ' + filtreAnnee : '— toutes années'}`} lignes={parTP} />
      <Tableau titre={`Évolution par année ${filtreTP ? '— ' + filtreTP : '— tous TP'}`} lignes={parAnnee} />
      <Tableau
        titre="Par catégorie de candidature"
        lignes={parCand}
        note="⚠️ Ces catégories relèvent de populations de référence distinctes : ne jamais les agréger en un taux global."
      />

      {/* Réussite par CCP */}
      <Card>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#006B68', marginBottom: '4px' }}>
          🎯 Réussite par CCP — pilotage pédagogique
        </div>
        <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px', fontStyle: 'italic' }}>
          Donnée complémentaire : l&apos;indicateur 2 porte sur l&apos;obtention de la certification, non des blocs.
          Un CCP durablement bas désigne un module à revoir (indicateurs 30 à 32).
        </div>
        {siglesAffiches.map(sigle => {
          const lignes = tauxParCcp(sessions, sigle, filtreAnnee || undefined);
          if (lignes.length === 0 || lignes.every(l => l.presentes === 0)) return null;
          return (
            <div key={sigle} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: formations[sigle]?.couleur ?? '#006B68', marginBottom: '4px' }}>
                {sigle} — {formations[sigle]?.label ?? ''}
              </div>
              {lignes.map(l => (
                <div key={l.code} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0', fontSize: '11px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', color: '#006B68', flex: '0 0 46px' }}>{l.code}</span>
                  <span style={{ color: '#555', flex: '1 1 200px' }}>{l.intitule}</span>
                  <span style={{ color: '#888', flex: '0 0 100px', textAlign: 'right' }}>{l.obtenus}/{l.presentes} présenté(s)</span>
                  <div style={{ backgroundColor: '#e0e0e0', borderRadius: '4px', height: '5px', flex: '0 0 90px' }}>
                    <div style={{ height: '5px', borderRadius: '4px', width: (l.taux ?? 0) + '%', backgroundColor: couleurTaux(l.taux) }} />
                  </div>
                  <span style={{ fontWeight: '800', flex: '0 0 50px', textAlign: 'right', color: couleurTaux(l.taux) }}>
                    {l.taux === null ? '—' : l.taux + ' %'}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </Card>

      {/* Formulations prêtes à publier */}
      <Card>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#006B68', marginBottom: '4px' }}>
          📢 Formulations prêtes à publier
        </div>
        <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px', fontStyle: 'italic' }}>
          Un taux sans période de référence ni effectif de base n&apos;est pas recevable en audit.
          Ces phrases contiennent les deux.
        </div>
        {parTP.filter(t => t.taux !== null).map(t => (
          <div key={t.cle} style={{ backgroundColor: '#fafafa', borderRadius: '6px', padding: '7px 10px', marginBottom: '5px', fontSize: '11px', color: '#333' }}>
            {phrasePublication(t, periode)}
          </div>
        ))}
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#888' }}>{libelleMethode(methode)}</div>
      </Card>
    </div>
  );
}
