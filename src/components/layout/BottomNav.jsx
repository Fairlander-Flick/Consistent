import { NavLink } from 'react-router-dom'
import { IconDashboard, IconConsistency, IconJournal, IconCalendar } from '../ui/Icons'

const items = [
  { to: '/', label: 'Dashboard', Icon: IconDashboard, end: true },
  { to: '/planner', label: 'Planner', Icon: IconCalendar },
  { to: '/consistency', label: 'Consistency', Icon: IconConsistency },
  { to: '/journal', label: 'Journal', Icon: IconJournal },
]

export function BottomNav() {
  return (
    <nav className="bn">
      {items.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => 'bn-item' + (isActive ? ' active' : '')}
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
