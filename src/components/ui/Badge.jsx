export function Badge({ children, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 7px',
      borderRadius: '5px',
      fontSize: '11px',
      fontWeight: 500,
      color: color || 'var(--text-2)',
      background: bg || 'var(--bg-elevated)',
    }}>
      {children}
    </span>
  )
}
