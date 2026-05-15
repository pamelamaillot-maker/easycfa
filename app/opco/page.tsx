'use client';

import { COLORS } from '../../lib/constants';
import Card from '../../components/Card';

const OPCOS = [
  {
    id: 'akto',
    nom: 'AKTO',
    description: 'Hôtellerie, restauration, tourisme, loisirs, sport',
    couleur: '#006B68',
    lien: 'https://www.akto.fr/mon-espace/',
    secteurs: ['Hôtellerie', 'Restauration', 'Tourisme', 'Sport'],
  },
  {
    id: 'atlas',
    nom: 'ATLAS',
    description: 'Banque, assurance, finance, conseil',
    couleur: '#1a56db',
    lien: 'https://myatlas.opco-atlas.fr',
    secteurs: ['Banque', 'Assurance', 'Finance', 'Conseil'],
  },
  {
    id: 'afdas',
    nom: 'AFDAS',
    description: 'Culture, communication, médias, sport, tourisme',
    couleur: '#e53e3e',
    lien: 'https://afdas.my.site.com/Prestataire/login?startURL=%2FPrestataire%2Fs%2F%3Ft%3D1772468834245',
    secteurs: ['Culture', 'Communication', 'Médias'],
  },
  {
    id: 'opcoep',
    nom: 'OPCO EP',
    description: 'Enseignement privé, formation professionnelle',
    couleur: '#7c3aed',
    lien: 'https://cfa.opcoep.fr/#/visitor/auth',
    secteurs: ['Enseignement privé', 'Formation'],
  },
  {
    id: 'ocapiat',
    nom: 'OCAPIAT',
    description: 'Agriculture, pêche, industries agroalimentaires',
    couleur: '#16a34a',
    lien: 'https://auth.ocapiat.fr/auth/realms/XTRPRD/protocol/openid-connect/auth?client_id=PortailOldAngular&redirect_uri=https%3A%2F%2Fpartnet.ocapiat.fr%2F&state=dc3025b1-ef5a-4e61-8456-33494aaffa4c&response_mode=fragment&response_type=code&scope=openid&nonce=34aa2125-3430-4558-8339-96fa23a01293',
    secteurs: ['Agriculture', 'Pêche', 'Agroalimentaire'],
  },
  {
    id: 'opcommerce',
    nom: 'OPCOMMERCE',
    description: 'Commerce de détail, grande distribution',
    couleur: '#C8A23A',
    lien: 'https://auth.lopcommerce.com/Home/Login?ReturnUrl=%2fhome%2flistesites',
    secteurs: ['Commerce', 'Distribution'],
  },
  {
    id: 'uniformation',
    nom: 'UNIFORMATION',
    description: 'Cohésion sociale, économie sociale et solidaire',
    couleur: '#0891b2',
    lien: 'https://opco.uniformation.fr/UniWebLegacy/',
    secteurs: ['Cohésion sociale', 'ESS'],
  },
  {
    id: 'cnfpt',
    nom: 'CNFPT',
    description: 'Fonction publique territoriale',
    couleur: '#dc2626',
    lien: 'https://apprentissage.cnfpt.fr/',
    secteurs: ['Fonction publique territoriale'],
  },
  {
    id: 'constructys',
    nom: 'CONSTRUCTYS',
    description: 'Construction, bâtiment, travaux publics',
    couleur: '#ea580c',
    lien: 'https://ogestion.constructys.fr/login?action=logout',
    secteurs: ['Construction', 'BTP'],
  },
  {
    id: 'opcomobilites',
    nom: 'OPCO MOBILITES',
    description: 'Transport, logistique, automobile',
    couleur: '#0369a1',
    lien: 'https://sso.opcomobilites.fr/?2fa=1&habilitationId=9b8680ac-e2ce-428f-aa10-5fc82b481516&2faEmail=pamelamaillot@pamoi.re&2faInvalidAuthCodeLeft=3&redirect=https://mgestion.opcomobilites.fr/login-check',
    secteurs: ['Transport', 'Logistique', 'Automobile'],
  },
  {
    id: 'opco2i',
    nom: 'OPCO 2i',
    description: 'Industrie, chimie, pharmacie, textile',
    couleur: '#7c3aed',
    lien: 'https://portail.opco2i.fr/login',
    secteurs: ['Industrie', 'Chimie', 'Pharmacie'],
  },
];

export default function Opco() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: COLORS.primary, marginBottom: '4px' }}>🏦 Espaces OPCO</h1>
        <p style={{ color: '#888', fontSize: '14px' }}>Accès direct à vos espaces organismes de formation — {OPCOS.length} OPCO partenaires</p>
      </div>

      {/* Info */}
      <div style={{ backgroundColor: '#EAF4F3', border: '1.5px solid #006B68', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#006B68', fontWeight: '600' }}>
        💡 Cliquez sur un OPCO pour accéder directement à votre espace organisme de formation. Les liens s'ouvrent dans un nouvel onglet.
      </div>

      {/* Grille OPCO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {OPCOS.map(opco => (
          <div key={opco.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e0e0e0' }}>
            {/* Bandeau couleur */}
            <div style={{ backgroundColor: opco.couleur, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>{opco.nom}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>Espace OF</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 10px', fontSize: '20px' }}>🏦</div>
            </div>

            {/* Contenu */}
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '13px', color: '#555', marginBottom: '12px', lineHeight: '1.4' }}>{opco.description}</p>

              {/* Secteurs */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {opco.secteurs.map(s => (
                  <span key={s} style={{ backgroundColor: '#f0f0f0', color: '#555', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>{s}</span>
                ))}
              </div>

              {/* Bouton */}
              <a
                href={opco.lien}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', backgroundColor: opco.couleur, color: 'white', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' }}
              >
                🔗 Accéder à mon espace {opco.nom}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div style={{ marginTop: '24px', padding: '14px 16px', backgroundColor: '#fef6e4', borderRadius: '10px', fontSize: '12px', color: '#7a5c00' }}>
        ⚠️ Si un lien de connexion ne fonctionne pas, il se peut que la session ait expiré. Reconnectez-vous directement sur le site de l'OPCO.
      </div>
    </div>
  );
}