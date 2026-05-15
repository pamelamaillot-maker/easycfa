import { COLORS } from '../lib/constants';

export default function PageHeader({
  title, subtitle, action
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
          {title}
        </h1>
        {subtitle && <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}