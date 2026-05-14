import { NavLink } from 'react-router-dom'

const GridIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
    <rect x="1.5" y="1.5" width="6.5" height="6.5" rx="1.6" fill="currentColor"/>
    <rect x="11" y="1.5" width="6.5" height="6.5" rx="1.6" fill="currentColor"/>
    <rect x="1.5" y="11" width="6.5" height="6.5" rx="1.6" fill="currentColor"/>
    <rect x="11" y="11" width="6.5" height="6.5" rx="1.6" fill="currentColor"/>
  </svg>
)

const ActivityIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
    <path d="M1 9.5H3.5L6 4L9.5 16L12 6.5L14 9.5H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ChartIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
    <rect x="1.5" y="12" width="3.5" height="5.5" rx="1" fill="currentColor" opacity="0.45"/>
    <rect x="7.75" y="8" width="3.5" height="9.5" rx="1" fill="currentColor" opacity="0.7"/>
    <rect x="14" y="2" width="3.5" height="15.5" rx="1" fill="currentColor"/>
  </svg>
)

const navItems = [
  { to: '/', label: 'Dashboard', Icon: GridIcon },
  { to: '/consistency', label: 'Consistency', Icon: ActivityIcon },
  { to: '/finance', label: 'Finance', Icon: ChartIcon },
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
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 0 8px',
            color: isActive ? 'var(--accent-green)' : 'var(--text-muted)',
            fontSize: '10px',
            fontWeight: isActive ? 600 : 400,
            gap: '4px',
            transition: 'color var(--transition)',
            letterSpacing: '0.02em',
          })}
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
