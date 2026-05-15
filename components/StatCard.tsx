export default function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: '32px', fontWeight: '800', color, marginBottom: '8px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
        {label}
      </div>
    </div>
  );
}