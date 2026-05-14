const variants = {
  primary: {
    background: 'var(--accent-green)',
    color: '#111',
    fontWeight: 600,
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: 'none',
  },
}

export function Button({ children, variant = 'primary', onClick, style = {}, disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        borderRadius: 'var(--radius-sm)',
        padding: '6px 12px',
        fontSize: '13px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity var(--transition)',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
