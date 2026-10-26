export default function StatCard({ title, value, icon: Icon, iconBg = '#eff6ff', iconColor = '#3b82f6' }) {
  return (
    <div style={{
      background: '#fffdf5',
      border: '3px solid #252b3a',
      borderRadius: 22,
      padding: 22,
      boxShadow: '8px 8px 0 0 #252b3a',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 150,
      minHeight: 150,
      fontFamily: 'var(--dp-typography-reading), sans-serif',
    }}>
      <div>
        {Icon && (
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: iconBg,
            color: iconColor,
            border: '3px solid #252b3a',
            boxShadow: '4px 4px 0 0 rgba(37, 43, 58, 0.18)',
          }}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{
          fontSize: 42,
          fontWeight: 900,
          color: '#252b3a',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          fontFamily: 'var(--dp-typography-display), sans-serif',
        }}>
          {value}
        </div>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#253044',
          marginTop: 8,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: 0.8,
        }}>
          {title}
        </div>
      </div>
    </div>
  );
}
