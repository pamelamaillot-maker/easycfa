export default function Presence() {
  const sessions = [
    { id: 1, nom: 'BTS Comptabilité', formateur: 'M. Grondin', apprenants: 4 },
    { id: 2, nom: 'CAP Cuisine', formateur: 'Mme Payet', apprenants: 3 },
    { id: 3, nom: 'Bac Pro Commerce', formateur: 'M. Nativel', apprenants: 22 },
  ];

  const jours = ['Lun 04', 'Mar 05', 'Mer 06', 'Jeu 07', 'Ven 08'];

  const apprenants = [
    { nom: 'PAYET', prenom: 'Marie' },
    { nom: 'HOARAU', prenom: 'Jean' },
    { nom: 'DIJOUX', prenom: 'Sophie' },
    { nom: 'NATIVEL', prenom: 'Lucas' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#006B68', marginBottom: '4px' }}>
          États de présence
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Générez et consultez les feuilles de présence par session
        </p>
      </div>

      {/* Sélection session */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#006B68', marginBottom: '16px' }}>
          Sélectionner une session
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {sessions.map((s) => (
            <div key={s.id} style={{ border: s.id === 1 ? '2px solid #006B68' : '2px solid #f0f0f0', borderRadius: '10px', padding: '16px', cursor: 'pointer', backgroundColor: s.id === 1 ? '#EAF4F3' : 'white' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a', marginBottom: '4px' }}>
                {s.nom}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                {s.formateur}
              </div>
              <div style={{ fontSize: '12px', color: '#006B68', fontWeight: '600' }}>
                {s.apprenants} apprenants
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau de présence */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#006B68' }}>
            BTS Comptabilité — Semaine du 04/05/2026
          </h2>
          <button style={{ backgroundColor: '#C8A23A', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Générer PDF
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #EAF4F3' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>
                Apprenant
              </th>
              {jours.map((j) => (
                <th key={j} style={{ textAlign: 'center', padding: '8px 12px', fontSize: '12px', color: '#999', fontWeight: '600' }}>
                  {j}
                </th>
              ))}
              <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: '12px', color: '#999', fontWeight: '600' }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {apprenants.map((a, i) => {
              const presences = [true, true, false, true, true];
              const total = presences.filter(Boolean).length;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>
                    {a.prenom} {a.nom}
                  </td>
                  {presences.map((present, j) => (
                    <td key={j} style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: present ? '#e6f4f1' : '#fde8e8', color: present ? '#006B68' : '#e53e3e', fontSize: '14px', lineHeight: '28px', fontWeight: '700' }}>
                        {present ? '✓' : '✗'}
                      </span>
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: total >= 4 ? '#006B68' : '#C8A23A' }}>
                    {total}/5
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bouton génération */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
            Générer l'état de présence officiel
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            Export PDF prêt à imprimer et à signer
          </div>
        </div>
        <button style={{ backgroundColor: '#006B68', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          Télécharger le PDF
        </button>
      </div>
    </div>
  );
}