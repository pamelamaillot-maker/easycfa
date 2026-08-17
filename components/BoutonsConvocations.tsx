'use client';

// components/BoutonsConvocations.tsx
// Génération des convocations d'une session d'examen :
//   - une convocation par candidat (épreuves, documents à apporter, identifiant)
//   - une convocation par membre du jury (mission, obligations, cadre légal)
//
// Les épreuves proviennent du référentiel via epreuvesAEmarger : elles diffèrent
// entre une session titre et une session CCP.

import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfConvocation from './PdfConvocation';
import PdfConvocationJury, { type DonneesConvocationJury } from './PdfConvocationJury';
import { epreuvesAEmarger, identifiantCandidat, dureeTotale } from '../lib/emargementsExamen';
import { referentielParSigle, ccpsDuTP } from '../lib/referentielsTP';

const DOCUMENTS_CANDIDAT = [
  "Pièce d'identité valide (CNI, passeport ou titre de séjour en cours de validité)",
  'Dossier professionnel (DP) complet et signé',
  'Livret ECF (Évaluation en Cours de Formation) complété',
  'Tenue professionnelle adaptée au métier visé',
];

const lienStyle: React.CSSProperties = {
  backgroundColor: '#006B68', color: 'white', borderRadius: '8px',
  padding: '5px 11px', fontSize: '11px', fontWeight: 600,
  cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
};

/** Jours restants avant la session, d'après une date JJ/MM/AAAA. */
function joursAvant(dateFr?: string): number | null {
  const p = (dateFr ?? '').split('/');
  if (p.length !== 3) return null;
  const a = p[2].length === 2 ? 2000 + parseInt(p[2]) : parseInt(p[2]);
  const d = new Date(a, parseInt(p[1]) - 1, parseInt(p[0]));
  if (isNaN(d.getTime())) return null;
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - auj.getTime()) / 86400000);
}

export default function BoutonsConvocations({
  session,
  situationsTitre,
  avecCandidats = true,
  avecJury = true,
}: {
  session: any;
  situationsTitre?: { id: string; label: string; duree: string; applicable: boolean }[];
  avecCandidats?: boolean;
  avecJury?: boolean;
}) {
  const sigle = session?.formation ?? '';
  const ref = referentielParSigle(sigle);
  const nbCcpDuTp = ccpsDuTP(sigle).length;

  const epreuves = epreuvesAEmarger(
    sigle,
    session?.typeSession,
    (session?.ccpVises ?? [])[0],
    session?.avecEntretienFinal,
    situationsTitre,
  );

  const candidats = session?.candidats ?? [];
  const jures = session?.jures ?? [];
  const jrs = joursAvant(session?.dateDebut);
  const cerisManquant = !(session?.numeroCERES ?? '').trim();

  // Épreuves au format attendu par PdfConvocation (composant existant).
  const epreuvesPourPdf = epreuves.map(e => ({ libelle: e.libelle, duree: e.duree }));

  const donneesJury = (index: number): DonneesConvocationJury => ({
    jure: jures[index] ?? { nom: '', prenom: '' },
    autresJures: jures.filter((_: any, i: number) => i !== index),
    formationLabel: ref?.intitule ?? sigle,
    formationSigle: sigle,
    codeTitre: ref?.codeTitre ?? '',
    typeSession: session?.typeSession ?? 'titre',
    ccpVise: (session?.ccpVises ?? [])[0],
    numeroCeres: session?.numeroCERES ?? '',
    dateDebut: session?.dateDebut ?? '',
    dateFin: session?.dateFin ?? '',
    heureConvocation: session?.heureConvocation ?? '',
    lieu: session?.lieu ?? '',
    responsableSession: `${session?.responsablePrenom ?? ''} ${session?.responsableNom ?? ''}`.trim(),
    nbCandidats: candidats.length,
    epreuves,
    dureeTotale: dureeTotale(epreuves),
  });

  if (epreuves.length === 0) {
    return (
      <span style={{ fontSize: '11px', color: '#C8A23A', fontWeight: 600 }}>
        ⚠️ Durées d&apos;épreuve non renseignées pour ce TP — convocations non générables.
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Alerte délai — règle interne PAM OI, non fixée par les textes */}
      {jrs !== null && jrs > 0 && jrs <= 31 && (
        <div style={{ backgroundColor: '#fef6e4', border: '1px solid #C8A23A', borderRadius: '8px', padding: '9px 11px', fontSize: '11px', color: '#8a6d1f', fontWeight: 600 }}>
          ⏰ Session dans {jrs} jour(s) — les convocations doivent être envoyées 31 jours avant
          (règle interne PAM OI).
        </div>
      )}

      {cerisManquant && (
        <div style={{ backgroundColor: '#fde8e8', border: '1px solid #e53e3e', borderRadius: '8px', padding: '9px 11px', fontSize: '11px', color: '#c53030', fontWeight: 600 }}>
          ⚠️ Numéro CERES manquant — il figurera « en attente » sur les convocations.
        </div>
      )}

      {/* Candidats — affiché uniquement si demandé (onglet Candidats) */}
      {avecCandidats && <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#006B68', textTransform: 'uppercase', marginBottom: '6px' }}>
          👥 Convocations candidats ({candidats.length})
        </div>
        {candidats.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
            Aucun candidat inscrit — ajoutez-les dans l&apos;onglet Candidats.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {candidats.map((c: any, i: number) => {
              const ccpsPasses = session?.typeSession === 'ccp'
                ? (session?.ccpVises ?? [])
                : ccpsDuTP(sigle).map(x => x.code);
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '9px', padding: '6px 9px', borderRadius: '8px', backgroundColor: '#fafafa', border: '1px solid #e0e0e0', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 220px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#006B68' }}>
                      {(c.nom ?? '').toUpperCase()} {c.prenom ?? ''}
                    </span>
                    <span style={{ fontSize: '10px', color: '#888', marginLeft: '7px' }}>
                      {identifiantCandidat(sigle, i + 1)}
                      {!c.email && ' · ⚠️ email manquant'}
                    </span>
                  </div>
                  <PDFDownloadLink
                    document={
                      <PdfConvocation
                        candidat={{
                          nom: c.nom ?? '',
                          prenom: c.prenom ?? '',
                          dateNaissance: c.dateNaissance ?? '',
                          email: c.email ?? '—',
                        }}
                        formation={ref?.intitule ?? sigle}
                        formationId={sigle}
                        typeCandidature={session?.typeSession === 'ccp' ? 'Session CCP (rattrapage)' : 'Titre complet'}
                        ccpsPassés={ccpsPasses}
                        dateExamen={session?.dateDebut ?? ''}
                        heureConvocation={session?.heureConvocation || '08:00'}
                        lieu={session?.lieu ?? ''}
                        numeroSession={session?.numeroCERES || 'En attente CERES'}
                        jury={jures.map((j: any) => ({ nom: j.nom ?? '', prenom: j.prenom ?? '', qualite: j.specialite ?? 'Membre du jury' }))}
                        epreuves={epreuvesPourPdf}
                        documentsAApporter={DOCUMENTS_CANDIDAT}
                      />
                    }
                    fileName={`Convocation_${(c.nom ?? 'candidat').replace(/\s/g, '_')}_${sigle}_${(session?.dateDebut ?? '').replace(/\//g, '-')}.pdf`}
                    style={lienStyle}
                  >
                    {({ loading }) => loading ? '⏳…' : '📄 Convocation'}
                  </PDFDownloadLink>
                </div>
              );
            })}
          </div>
        )}
      </div>}

      {/* Jury — affiché uniquement si demandé (onglet Jurés) */}
      {avecJury && <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#006B68', textTransform: 'uppercase', marginBottom: '6px' }}>
          👨‍⚖️ Convocations jury ({jures.length})
        </div>
        {jures.length < 2 && (
          <div style={{ backgroundColor: '#fde8e8', border: '1px solid #e53e3e', borderRadius: '8px', padding: '9px 11px', fontSize: '11px', color: '#c53030', fontWeight: 600, marginBottom: '6px' }}>
            ⚠️ {jures.length} juré(s) déclaré(s). Le jury doit comporter au minimum deux membres
            habilités (arrêté du 22 décembre 2015).
          </div>
        )}
        {jures.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
            Aucun juré — ajoutez-les depuis l&apos;onglet Jurés.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {jures.map((j: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '9px', padding: '6px 9px', borderRadius: '8px', backgroundColor: '#fafafa', border: '1px solid #e0e0e0', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#006B68' }}>
                    {(j.nom ?? '').toUpperCase()} {j.prenom ?? ''}
                  </span>
                  {!j.email && <span style={{ fontSize: '10px', color: '#C8A23A', marginLeft: '7px' }}>⚠️ email manquant</span>}
                </div>
                <PDFDownloadLink
                  document={<PdfConvocationJury donnees={donneesJury(i)} />}
                  fileName={`Convocation_jury_${(j.nom ?? 'jure').replace(/\s/g, '_')}_${sigle}_${(session?.dateDebut ?? '').replace(/\//g, '-')}.pdf`}
                  style={lienStyle}
                >
                  {({ loading }) => loading ? '⏳…' : '📄 Convocation'}
                </PDFDownloadLink>
              </div>
            ))}
          </div>
        )}
      </div>}
    </div>
  );
}
