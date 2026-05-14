const variantClass = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
}

export function Button({ children, variant = 'primary', onClick, style = {}, disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variantClass[variant] ?? 'btn-primary'}`}
      style={style}
    >
      {children}
    </button>
  )
}
