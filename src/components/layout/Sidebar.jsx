import { NavLink } from 'react-router-dom'
import { useSettingsStore } from '../../store/useSettingsStore'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/consistency', label: 'Consistency', icon: '◎' },
  { to: '/finance', label: 'Finance', icon: '€' },
]

export function Sidebar() {
  const { theme, toggleTheme } = useSettingsStore()

  return (
    <nav style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      padding: '20px 0',
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.5px' }}>Consistent</span>
      </div>
      <div style={{ flex: 1, padding: '12px 8px' }}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
              background: isActive ? 'var(--bg)' : 'transparent',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              marginBottom: '2px',
              transition: 'color var(--transition), background var(--transition)',
            })}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>
      <div style={{ padding: '0 20px' }}>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            fontSize: '12px',
            padding: '8px 0',
          }}
        >
          {theme === 'dark' ? '☀ Light mode' : '☾ Dark mode'}
        </button>
      </div>
    </nav>
  )
}
