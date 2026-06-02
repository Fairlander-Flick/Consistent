import { useEffect, useRef } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useAuthStore } from '../../store/useAuthStore'
import { consumeBrandRect } from '../../lib/brandTransition'
import {
  IconDashboard, IconConsistency, IconTarget,
  IconSun, IconMoon, IconSettings, IconChevRight, IconCalendar,
} from '../ui/Icons'
import { IconSwap, TextSwap } from '../ui/transitions'

const navItems = [
  { to: '/', label: 'Dashboard', Icon: IconDashboard, end: true },
  { to: '/goals', label: 'Goals', Icon: IconTarget },
  { to: '/planner', label: 'Planner', Icon: IconCalendar },
  { to: '/consistency', label: 'Consistency', Icon: IconConsistency },
]

export function Sidebar() {
  const { theme, toggleTheme } = useSettingsStore()
  const { user, signOut } = useAuthStore()
  const dark = theme === 'dark'

  const logoRef = useRef(null)

  useEffect(() => {
    const from = consumeBrandRect()
    if (!from || !logoRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const node = logoRef.current
    const to = node.getBoundingClientRect()

    const dx = from.left + from.width  / 2 - (to.left + to.width  / 2)
    const dy = from.top  + from.height / 2 - (to.top  + to.height / 2)
    const sx = from.width  / to.width
    const sy = from.height / to.height
    const scale = Math.max(sx, sy)

    node.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      ],
      {
        duration: 700,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both',
      }
    )
  }, [])

  return (
    <aside className="sb">
      <Link to="/" className="sb-brand" aria-label="Go to dashboard">
        <img
          ref={logoRef}
          src="/sisyphus.png"
          alt=""
          className="sb-brand-mark brand-mark"
          style={{ background: 'none', objectFit: 'contain' }}
        />
        <div className="sb-brand-name">Consistent</div>
      </Link>

      <div className="sb-section">Workspace</div>
      {navItems.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => 'sb-item' + (isActive ? ' active' : '')}
        >
          <Icon size={14} />
          <span>{label}</span>
        </NavLink>
      ))}

      <div className="sb-foot">
        <button type="button" className="sb-item" onClick={toggleTheme}
          style={{ background: 'none', border: 'none', width: '100%', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
          <IconSwap state={dark ? 'a' : 'b'} a={<IconSun size={14} />} b={<IconMoon size={14} />} />
          <TextSwap>{`${dark ? 'Light' : 'Dark'} mode`}</TextSwap>
        </button>
        <NavLink to="/settings" className={({ isActive }) => 'sb-item' + (isActive ? ' active' : '')}>
          <IconSettings size={14} />
          <span>Settings</span>
        </NavLink>
        {user && (
          <button type="button" className="sb-item" onClick={signOut} title={`@${user.username}`}
            style={{ background: 'none', border: 'none', width: '100%', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
            <IconChevRight size={14} />
            <span>Sign out</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)' }}>
              @{user.username}
            </span>
          </button>
        )}
      </div>
    </aside>
  )
}
