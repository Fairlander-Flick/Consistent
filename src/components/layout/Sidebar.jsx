import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useAuthStore } from '../../store/useAuthStore'
import { consumeBrandRect } from '../../lib/brandTransition'
import {
  IconDashboard, IconConsistency, IconJournal,
  IconSun, IconMoon, IconSettings, IconChevRight, IconCalendar,
} from '../ui/Icons'

const navItems = [
  { to: '/', label: 'Dashboard', Icon: IconDashboard, end: true },
  { to: '/planner', label: 'Planner', Icon: IconCalendar },
  { to: '/consistency', label: 'Consistency', Icon: IconConsistency },
  { to: '/journal', label: 'Journal', Icon: IconJournal },
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
      <div className="sb-brand">
        <img
          ref={logoRef}
          src="/sisyphus.png"
          alt=""
          className="sb-brand-mark brand-mark"
          style={{ background: 'none', objectFit: 'contain' }}
        />
        <div className="sb-brand-name">Consistent</div>
      </div>

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
        <div className="sb-item" onClick={toggleTheme} role="button">
          {dark ? <IconSun size={14} /> : <IconMoon size={14} />}
          <span>{dark ? 'Light' : 'Dark'} mode</span>
        </div>
        <NavLink to="/settings" className={({ isActive }) => 'sb-item' + (isActive ? ' active' : '')}>
          <IconSettings size={14} />
          <span>Settings</span>
        </NavLink>
        {user && (
          <div className="sb-item" onClick={signOut} role="button" title={`@${user.username}`}>
            <IconChevRight size={14} />
            <span>Sign out</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)' }}>
              @{user.username}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
