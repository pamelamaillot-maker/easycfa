'use client';

// components/AlertesQualiopi.tsx
// Ce qui exige une action pour rester conforme.
//
// Principe : une alerte n'a de valeur que si elle est actionnable. Chaque
// ligne dit ce qui manque, où, et depuis quand — pas seulement qu'il manque
// quelque chose. Les alertes sont classées par urgence, non par module.

import { useEffect, useState } from 'react';
import Card from './Card';
import {
  chargerAudits,
  chargerIndicateurs,
  chargerPreuves,
  type AuditQualiopi,
} from '../data/qualiopiSupabase';
import { REFERENTIELS_TP, tpEcheanceProche } from '../lib/referentielsTP';

const C = { primary: '#006B68', or: '#C8A23A', rouge: '#e53e3e', vert: '#16a34a', fond: '#EAF4F3' };

type Niveau = 'critique' | 'important' | 'vigilance';

interface Alerte {
  niveau: Niveau;
  categorie: string;
  titre: string;
  detail: string;
  lien?: string;
}

const STYLE: Record<Niveau, { bg: string; bord: string; couleur: string; icone: string; libelle: string }> = {
  critique:   { bg: '#fde8e8', bord: '#e53e3e', couleur: '#c53030', icone: '🔴', libelle: 'Critique' },
  important:  { bg: '#fef6e4', bord: '#C8A23A', couleur: '#8a6d1f', icone: '🟠', libelle: 'Important' },
  vigilance:  { bg: '#EAF4F3', bord: '#006B68', couleur: '#006B68', icone: '🔵', libelle: 'Vigilance' },
};

function joursAvant(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const auj = new Date(); auj.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - auj.getTime()) / 86400000);
}

function joursAvantFr(fr?: string): number | null {
  const p = (fr ?? '').split('/');
  if (p.length !== 3) return null;
  const a = p[2].length === 2 ? 2000 + parseInt(p[2]) : parseInt(p[2]);
  const d = new Date(a, parseInt(p[1]) - 1, parseInt(p[0]));
  if (isNaN(d.getTime())) return null;
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - auj.getTime()) / 86400000);
}

function dateFr(iso?: string | null): string {
  if (!iso) return '—';
  const p = iso.slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

export default function AlertesQualiopi({
  examens = [],
  campagnes = [],
  agrements = [],
}: {
  examens?: any[];
  campagnes?: any[];
  agrements?: any[];
}) {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [audit, setAudit] = useState<AuditQualiopi | null>(null);

  useEffect(() => {
    (async () => {
      const liste: Alerte[] = [];
      const audits = await chargerAudits();
      const courant = audits.find(a => a.statut === 'en_cours') ?? audits[0] ?? null;
      setAudit(courant);

      // ── Audit en cours ──
      if (courant) {
        const inds = await chargerIndicateurs(courant.id);
        const preuves = await chargerPreuves(courant.id);
        const jrs = joursAvant(courant.datePeriodeFin);

        const aVerifier = inds.filter(i => i.statut === 'a_verifier');
        const nonConformes = inds.filter(i => i.statut === 'non_conforme');
        const sansPreuve = inds.filter(i =>
          i.statut !== 'non_applicable' &&
          !preuves.some(p => p.indicateurNumero === i.numero) &&
          !(i.elementsPreuve ?? '').trim());

        if (nonConformes.length > 0) {
          liste.push({
            niveau: 'critique',
            categorie: 'Audit',
            titre: `${nonConformes.length} indicateur(s) non conforme(s)`,
            detail: `Indicateurs ${nonConformes.map(i => i.numero).join(', ')}. Une non-conformité majeure non levée empêche la certification.`,
          });
        }

        if (jrs !== null && jrs <= 365 && aVerifier.length > 0) {
          liste.push({
            niveau: jrs <= 180 ? 'critique' : 'important',
            categorie: 'Audit',
            titre: `${aVerifier.length} indicateur(s) restent à vérifier`,
            detail: `Audit à passer avant le ${dateFr(courant.datePeriodeFin)}, soit ${jrs} jour(s). Indicateurs ${aVerifier.slice(0, 8).map(i => i.numero).join(', ')}${aVerifier.length > 8 ? '…' : ''}.`,
          });
        }

        if (sansPreuve.length > 0) {
          liste.push({
            niveau: 'important',
            categorie: 'Preuves',
            titre: `${sansPreuve.length} indicateur(s) sans élément de preuve`,
            detail: `Indicateurs ${sansPreuve.slice(0, 10).map(i => i.numero).join(', ')}${sansPreuve.length > 10 ? '…' : ''}. Un indicateur sans preuve consultable ne peut pas être déclaré conforme.`,
          });
        }

        if (jrs !== null && jrs < 0) {
          liste.push({
            niveau: 'critique',
            categorie: 'Audit',
            titre: 'Période de surveillance dépassée',
            detail: `La période s'achevait le ${dateFr(courant.datePeriodeFin)}. Contactez votre certificateur sans délai.`,
          });
        }
      }

      // ── Agréments TP ──
      for (const ag of agrements) {
        const j = joursAvantFr(ag.dateFin);
        if (j === null) continue;
        if (j < 0) {
          liste.push({
            niveau: 'critique', categorie: 'Agréments',
            titre: `Agrément ${ag.formationCode} expiré`,
            detail: `Échu depuis le ${ag.dateFin}. Aucune session d'examen ne peut être organisée sur ce TP.`,
          });
        } else if (j <= 180) {
          liste.push({
            niveau: j <= 90 ? 'critique' : 'important', categorie: 'Agréments',
            titre: `Agrément ${ag.formationCode} à renouveler`,
            detail: `Expire le ${ag.dateFin}, soit dans ${j} jour(s). Le renouvellement se demande auprès de la DEETS.`,
          });
        }
      }

      // ── Échéance d'enregistrement RNCP ──
      for (const e of tpEcheanceProche(540)) {
        liste.push({
          niveau: e.jours <= 180 ? 'important' : 'vigilance',
          categorie: 'Référentiels',
          titre: `Enregistrement RNCP du TP ${e.sigle} à échéance`,
          detail: `Échéance le ${dateFr(e.echeance)}, soit ${e.jours} jour(s). Au-delà, aucun nouveau parcours ne peut être ouvert sur cette fiche.`,
        });
      }

      // ── Sessions d'examen ──
      for (const s of examens) {
        const j = joursAvantFr(s.dateDebut);
        const nom = `${s.formation} — ${s.dateDebut}`;
        if (j !== null && j >= 0) {
          if (!s.dateCmdDTE && j <= 120) liste.push({ niveau: j <= 60 ? 'critique' : 'important', categorie: 'Examens', titre: `DTE non commandé — ${nom}`, detail: `Session dans ${j} jour(s).` });
          if (!s.dateCmdJury && j <= 90) liste.push({ niveau: j <= 45 ? 'critique' : 'important', categorie: 'Examens', titre: `Jurés non commandés — ${nom}`, detail: `Session dans ${j} jour(s).` });
          if (!s.dateEnvoiConvocations && j <= 40) liste.push({ niveau: 'critique', categorie: 'Examens', titre: `Convocations non envoyées — ${nom}`, detail: `Session dans ${j} jour(s). Délai interne de 31 jours.` });
          if ((s.jures ?? []).length < 2 && j <= 60) liste.push({ niveau: 'critique', categorie: 'Examens', titre: `Jury incomplet — ${nom}`, detail: `${(s.jures ?? []).length} juré(s) déclaré(s). Le jury doit comporter au minimum deux membres habilités (arrêté du 22 décembre 2015).` });
        }
        // Sessions passées au dossier incomplet
        if (j !== null && j < 0 && s.statut !== 'Clôturée') {
          liste.push({ niveau: 'important', categorie: 'Examens', titre: `Session passée non clôturée — ${nom}`, detail: `Terminée depuis ${-j} jour(s), statut « ${s.statut} ».` });
        }
        if (s.pvSigne && !s.pvSigneUrl) {
          liste.push({ niveau: 'important', categorie: 'Preuves', titre: `PV non archivé — ${nom}`, detail: `Le fichier « ${s.pvSigne} » est référencé mais n'a jamais été téléversé. À reverser.` });
        }
      }

      // ── Campagnes d'évaluation (indicateur 33) ──
      const cloturees = campagnes.filter((c: any) => c.statut === 'cloturee');
      if (cloturees.length > 0) {
        liste.push({
          niveau: 'important', categorie: 'Indicateur 33',
          titre: `${cloturees.length} campagne(s) clôturée(s) sans synthèse`,
          detail: `L'indicateur 33 n'est satisfait que si les résultats sont partagés avec les équipes pédagogiques et donnent lieu à des actions d'amélioration.`,
        });
      }
      const faibles = campagnes.filter((c: any) =>
        c.statut === 'envoyee' && (c.nbApprenantsAttendus ?? 0) > 0 &&
        ((c.nbReponses ?? 0) / c.nbApprenantsAttendus) < 0.3);
      if (faibles.length > 0) {
        liste.push({
          niveau: 'vigilance', categorie: 'Indicateur 33',
          titre: `${faibles.length} campagne(s) à faible taux de réponse`,
          detail: `Moins de 30 % de réponses. Une relance est préférable à une clôture : un taux trop faible ne permet pas de conclure.`,
        });
      }
      if (campagnes.length === 0) {
        liste.push({
          niveau: 'important', categorie: 'Indicateur 33',
          titre: 'Aucune campagne d\'évaluation des enseignements',
          detail: `L'indicateur 33 s'applique aux CFA depuis le décret du 1er août 2026. Créez une campagne depuis l'onglet Éval. enseignements.`,
        });
      }

      const ordre: Record<Niveau, number> = { critique: 0, important: 1, vigilance: 2 };
      liste.sort((a, b) => ordre[a.niveau] - ordre[b.niveau]);
      setAlertes(liste);
      setChargement(false);
    })();
  }, [examens, campagnes, agrements]);

  if (chargement) {
    return <Card><div style={{ textAlign: 'center', color: C.primary, fontWeight: 600, padding: '20px' }}>⏳ Analyse en cours…</div></Card>;
  }

  const parNiveau = (n: Niveau) => alertes.filter(a => a.niveau === n);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Synthèse */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        {(['critique', 'important', 'vigilance'] as Niveau[]).map(n => (
          <div key={n} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '14px', borderTop: `4px solid ${STYLE[n].bord}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: STYLE[n].couleur }}>{parNiveau(n).length}</div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{STYLE[n].icone} {STYLE[n].libelle}</div>
          </div>
        ))}
      </div>

      {alertes.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '26px' }}>
            <div style={{ fontSize: '34px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: C.vert, marginBottom: '4px' }}>Aucune alerte</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Tous les points de vigilance sont couverts à ce jour.
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ fontSize: '13px', fontWeight: 800, color: C.primary, marginBottom: '4px' }}>
            Points à traiter ({alertes.length})
          </div>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '11px', fontStyle: 'italic' }}>
            Classés par urgence. Chaque ligne indique ce qui manque et l&apos;échéance associée.
          </div>
          {alertes.map((a, k) => {
            const s = STYLE[a.niveau];
            return (
              <div key={k} style={{ backgroundColor: s.bg, border: `1px solid ${s.bord}`, borderRadius: '9px', padding: '10px 12px', marginBottom: '7px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '9px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: s.couleur }}>
                      {s.icone} {a.titre}
                    </div>
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '3px', lineHeight: 1.5 }}>{a.detail}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: s.couleur, backgroundColor: 'white', padding: '2px 9px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                    {a.categorie}
                  </span>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {audit && (
        <div style={{ fontSize: '10px', color: '#888', textAlign: 'center', fontStyle: 'italic' }}>
          Analyse fondée sur l&apos;audit « {audit.libelle} », vos sessions d&apos;examen, vos agréments TP
          et vos campagnes d&apos;évaluation.
        </div>
      )}
    </div>
  );
}
