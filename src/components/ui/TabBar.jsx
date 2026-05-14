export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: active === tab ? 600 : 400,
            color: active === tab ? 'var(--text)' : 'var(--text-muted)',
            borderBottom: active === tab ? '2px solid var(--accent-green)' : '2px solid transparent',
            marginBottom: '-1px',
            background: 'none',
            transition: 'color var(--transition)',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
