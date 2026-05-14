export function Checkbox({ checked, onChange, label, strikethrough = true }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', userSelect: 'none' }}>
      <span
        onClick={onChange}
        style={{
          width: '15px',
          height: '15px',
          borderRadius: '4px',
          border: checked ? 'none' : '1.5px solid var(--border)',
          background: checked ? 'var(--accent-green)' : 'transparent',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background var(--transition), border-color var(--transition)',
        }}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="#05160e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span
        onClick={onChange}
        style={{
          color: checked ? 'var(--text-muted)' : 'var(--text)',
          textDecoration: checked && strikethrough ? 'line-through' : 'none',
          fontSize: '13px',
          lineHeight: 1.4,
          transition: 'color var(--transition)',
        }}
      >
        {label}
      </span>
    </label>
  )
}
