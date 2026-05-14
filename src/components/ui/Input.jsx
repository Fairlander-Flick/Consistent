export function Input({ value, onChange, placeholder = '', type = 'text', style = {} }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text)',
        padding: '6px 10px',
        fontSize: '13px',
        outline: 'none',
        width: '100%',
        ...style,
      }}
    />
  )
}
