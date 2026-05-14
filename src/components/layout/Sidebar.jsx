import { NavLink } from 'react-router-dom'
import { useSettingsStore } from '../../store/useSettingsStore'

const GridIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="1" y="1" width="5.5" height="5.5" rx="1.3" fill="currentColor" opacity="0.9"/>
    <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.3" fill="currentColor" opacity="0.9"/>
    <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.3" fill="currentColor" opacity="0.9"/>
    <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.3" fill="currentColor" opacity="0.9"/>
  </svg>
)

const ActivityIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M1 7.5H3L5 3L7.5 12L9.5 5.5L11 7.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ChartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="1" y="9.5" width="3" height="5" rx="1" fill="currentColor" opacity="0.45"/>
    <rect x="6" y="6" width="3" height="8.5" rx="1" fill="currentColor" opacity="0.7"/>
    <rect x="11" y="1.5" width="3" height="13" rx="1" fill="currentColor"/>
  </svg>
)

const CheckMark = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 5L4 7.5L8 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SunIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="2.5" fill="currentColor"/>
    <path d="M6.5 1v1M6.5 11v1M1 6.5h1M11 6.5h1M2.76 2.76l.71.71M9.53 9.53l.71.71M2.76 10.24l.71-.71M9.53 3.47l.71-.71" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M10.5 7.5A5 5 0 115.5 2.5a3.5 3.5 0 005 5z" fill="currentColor" opacity="0.9"/>
  </svg>
)

const navItems = [
  { to: '/', label: 'Dashboard', Icon: GridIcon },
  { to: '/consistency', label: 'Consistency', Icon: ActivityIcon },
  { to: '/finance', label: 'Finance', Icon: ChartIcon },
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
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '24px', height: '24px',
            background: 'var(--accent-green)',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <CheckMark />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.2px' }}>Consistent</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <div style={{
          fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '8px 10px 6px',
        }}>
          Pages
        </div>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 8px 16px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={toggleTheme}
          className="btn btn-ghost"
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            padding: '8px 10px',
            fontSize: '12px',
            borderRadius: '8px',
            gap: '8px',
          }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </nav>
  )
}
