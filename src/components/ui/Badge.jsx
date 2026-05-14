export function Badge({ children, color = 'var(--text-muted)', bg = 'var(--bg)' }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 500,
      color,
      background: bg,
      border: '1px solid var(--border)',
    }}>
      {children}
    </span>
  )
}
