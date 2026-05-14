import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/consistency', label: 'Consistency', icon: '◎' },
  { to: '/finance', label: 'Finance', icon: '€' },
]

export function BottomNav() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 100,
    }}>
      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 0',
            color: isActive ? 'var(--accent-green)' : 'var(--text-muted)',
            fontSize: '11px',
            gap: '3px',
          })}
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
