export function Card({ children, className = '', style = {} }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px',
        boxShadow: 'var(--shadow)',
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  )
}
