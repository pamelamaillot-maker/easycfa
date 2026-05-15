import { STATUT_COULEURS } from '../lib/constants';

export default function Badge({ statut }: { statut: string }) {
  const s = STATUT_COULEURS[statut] ?? { bg: '#f0f0f0', color: '#888' };
  return (
    <span style={{
      backgroundColor: s.bg,
      color: s.color,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
    }}>
      {statut}
    </span>
  );
}