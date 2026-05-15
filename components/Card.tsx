export default function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      ...style,
    }}>
      {children}
    </div>
  );
}