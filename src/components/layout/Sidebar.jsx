import { NavLink } from 'react-router-dom'
import { useSettingsStore } from '../../store/useSettingsStore'
import {
  IconDashboard, IconConsistency, IconWallet,
  IconPlus, IconScale, IconSun, IconMoon, IconSettings,
} from '../ui/Icons'

const navItems = [
  { to: '/', label: 'Dashboard', Icon: IconDashboard, end: true },
  { to: '/consistency', label: 'Consistency', Icon: IconConsistency },
  { to: '/finance', label: 'Finance', Icon: IconWallet },
]

export function Sidebar() {
  const { theme, toggleTheme } = useSettingsStore()
  const dark = theme === 'dark'

  return (
    <aside className="sb">
      <div className="sb-brand">
        <img src="/sisyphus.png" alt="logo" className="sb-brand-mark" style={{ background: 'none', objectFit: 'contain' }} />
        <div className="sb-brand-name">Consistent<span className="dim">+Potent</span></div>
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

      <div className="sb-section">Quick</div>
      <NavLink to="/consistency" className="sb-item">
        <IconPlus size={14} />
        <span>Log today</span>
        <span style={{ marginLeft: 'auto' }} className="kbd">⌘L</span>
      </NavLink>
      <NavLink to="/consistency" className="sb-item">
        <IconScale size={14} />
        <span>Weigh-in</span>
        <span style={{ marginLeft: 'auto' }} className="kbd">⌘W</span>
      </NavLink>

      <div className="sb-foot">
        <div className="sb-item" onClick={toggleTheme} role="button">
          {dark ? <IconSun size={14} /> : <IconMoon size={14} />}
          <span>{dark ? 'Light' : 'Dark'} mode</span>
        </div>
        <NavLink to="/settings" className={({ isActive }) => 'sb-item' + (isActive ? ' active' : '')}>
          <IconSettings size={14} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
