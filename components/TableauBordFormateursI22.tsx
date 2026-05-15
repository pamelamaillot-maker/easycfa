// components/TableauBordFormateursI22.tsx
// Vue globale - Tableau de bord tous formateurs
// Indicateur 22 Qualiopi - CFA PAM OI Formation

import React, { useMemo, useState } from 'react';
import {
  FormationContinue,
  TypeFormationContinue,
  LABELS_TYPE_FORMATION,
  getStatutValidite,
} from '../types/formationContinue';
import { useFormationsContinues } from '../hooks/useFormationsContinues';
import { exporterPdfGlobal } from '../lib/exportPdfGlobal';

interface Formateur {
  id: string;
  nom: string;
  prenom: string;
}

interface Props {
  formateurs: Formateur[]; // injecté depuis votre store EasyCFA
}

interface LigneRecap {
  formateur: Formateur;
  total: number;
  heuresTotal: number;
  heuresAnnee: number;
  parType: Record<TypeFormationContinue, number>;
  certifsExpirees: number;
  certifsBientotExpirees: number;
}

export default function TableauBordFormateursI22({ formateurs }: Props) {
  const { toutesFormations } = useFormationsContinues();
  const [recherche, setRecherche] = useState('');
  const annee = new Date().getFullYear();

  const recapParFormateur: LigneRecap[] = useMemo(() => {
    return formateurs.map((formateur) => {
      const fs = toutesFormations.filter((f) => f.formateurId === formateur.id);
      const parType: Record<TypeFormationContinue, number> = {
        pedagogique: 0,
        technique: 0,
        certification: 0,
        veille: 0,
      };
      let certifsExpirees = 0;
      let certifsBientotExpirees = 0;
      fs.forEach((f) => {
        parType[f.type]++;
        if (f.type === 'certification' || f.dateExpiration) {
          const statut = getStatutValidite(f);
          if (statut === 'expire') certifsExpirees++;
          if (statut === 'bientot_expire') certifsBientotExpirees++;
        }
      });
      return {
        formateur,
        total: fs.length,
        heuresTotal: fs.reduce((s, f) => s + f.dureeHeures, 0),
        heuresAnnee: fs
          .filter((f) => new Date(f.dateFin).getFullYear() === annee)
          .reduce((s, f) => s + f.dureeHeures, 0),
        parType,
        certifsExpirees,
        certifsBientotExpirees,
      };
    });
  }, [formateurs, toutesFormations, annee]);

  const recapAffiche = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return recapParFormateur;
    return recapParFormateur.filter(
      (l) =>
        l.formateur.nom.toLowerCase().includes(q) ||
        l.formateur.prenom.toLowerCase().includes(q)
    );
  }, [recapParFormateur, recherche]);

  // Stats globales
  const statsGlobales = useMemo(() => {
    const totalH = recapParFormateur.reduce((s, l) => s + l.heuresTotal, 0);
    const totalHAnnee = recapParFormateur.reduce((s, l) => s + l.heuresAnnee, 0);
    const alertes = recapParFormateur.reduce(
      (s, l) => s + l.certifsExpirees + l.certifsBientotExpirees,
      0
    );
    const formateursSansFormation = recapParFormateur.filter((l) => l.total === 0).length;
    return { totalH, totalHAnnee, alertes, formateursSansFormation };
  }, [recapParFormateur]);

  function handleExportGlobal() {
    exporterPdfGlobal({ recap: recapParFormateur, annee });
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            📊 Tableau de bord — Formations continues formateurs
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Indicateur 22 Qualiopi · Vue globale tous formateurs
          </p>
        </div>
        <button
          onClick={handleExportGlobal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     text-sm font-medium transition-colors shadow-sm"
        >
          📄 Exporter le rapport global
        </button>
      </div>

      {/* Alertes */}
      {statsGlobales.alertes > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <p className="font-semibold text-orange-900">
              {statsGlobales.alertes} certification(s)/habilitation(s) à surveiller
            </p>
            <p className="text-sm text-orange-800 mt-1">
              Des justificatifs sont expirés ou expirent dans les 3 prochains mois.
              Consultez le détail par formateur ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* Cartes globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Formateurs suivis" value={String(formateurs.length)} />
        <StatCard label={`Heures cumulées (total)`} value={`${statsGlobales.totalH} h`} />
        <StatCard label={`Heures ${annee}`} value={`${statsGlobales.totalHAnnee} h`} />
        <StatCard
          label="Sans formation"
          value={String(statsGlobales.formateursSansFormation)}
          alert={statsGlobales.formateursSansFormation > 0}
        />
      </div>

      {/* Recherche */}
      <div>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="🔍 Rechercher un formateur..."
          className="w-full md:w-96 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Tableau récap */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Formateur</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Heures</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">{annee}</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">🎓 Péda.</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">🔧 Tech.</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">📜 Certif.</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">👁️ Veille</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Alertes</th>
              </tr>
            </thead>
            <tbody>
              {recapAffiche.map((l) => {
                const alertes = l.certifsExpirees + l.certifsBientotExpirees;
                return (
                  <tr
                    key={l.formateur.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      l.total === 0 ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {l.formateur.prenom} {l.formateur.nom}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{l.total}</td>
                    <td className="px-4 py-3 text-right">{l.heuresTotal} h</td>
                    <td className="px-4 py-3 text-right">{l.heuresAnnee} h</td>
                    <td className="px-4 py-3 text-center">{l.parType.pedagogique || '—'}</td>
                    <td className="px-4 py-3 text-center">{l.parType.technique || '—'}</td>
                    <td className="px-4 py-3 text-center">{l.parType.certification || '—'}</td>
                    <td className="px-4 py-3 text-center">{l.parType.veille || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {alertes > 0 ? (
                        <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-medium">
                          {alertes} ⚠️
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {recapAffiche.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Aucun formateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className={`border rounded-xl p-4 ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
      <div className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${alert ? 'text-red-700' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}
