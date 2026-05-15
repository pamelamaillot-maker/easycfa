import { FORMATEURS, SESSIONS_FORMATEURS } from '../../../data/mockData';
import Badge from '../../../components/Badge';
import Card from '../../../components/Card';
import { COLORS } from '../../../lib/constants';

export default async function FicheFormateur({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formateur = FORMATEURS.find(f => f.id === Number(id));
  const sessions = SESSIONS_FORMATEURS[id] ?? [];

  if (!formateur) return <div style={{ padding: '32px', color: COLORS.primary }}>Formateur introuvable.</div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <a href="/formateurs" style={{ color: COLORS.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
          ← Retour aux formateurs
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: COLORS.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: COLORS.primary }}>
            {formateur.prenom[0]}{formateur.nom[0]}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary }}>{formateur.prenom} {formateur.nom}</h1>
            <div style={{ color: COLORS.secondary, fontWeight: '600', fontSize: '14px' }}>{formateur.specialite}</div>
          </div>
          <Badge statut={formateur.statut} />
        </div>
      </div>
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>Coordonnées</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[
            { label: 'Email', value: formateur.email },
            { label: 'Téléphone', value: formateur.telephone },
          ].map((info) => (
            <div key={info.label} style={{ backgroundColor: COLORS.background, borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>{info.label}</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: COLORS.text }}>{info.value}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.primary, marginBottom: '16px' }}>
          Sessions assignées ({sessions.length})
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              {['Formation', 'Période', 'Statut'].map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>{s.nom}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: COLORS.textMuted }}>{s.periode}</td>
                <td style={{ padding: '12px' }}><Badge statut={s.statut} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}