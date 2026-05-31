import { useNavigate } from 'react-router-dom'
import { WeekBoard } from '../planner/WeekBoard'
import { IconChevRight } from '../ui/Icons'
import { CardTitleLink } from './CardTitleLink'

// Compact week summary for the dashboard bento. Full interactions live on the
// dedicated /planner page, which this card links to.
export function WeekPlannerCard() {
  const navigate = useNavigate()
  return (
    <div className="card area-week">
      <div className="card-h">
        <CardTitleLink to="/planner">This Week</CardTitleLink>
        <button type="button" className="btn ghost sm" onClick={() => navigate('/planner')}>
          Open Planner <IconChevRight size={12} style={{ verticalAlign: '-2px' }} />
        </button>
      </div>
      <WeekBoard compact />
    </div>
  )
}
