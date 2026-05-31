import { useNavigate } from 'react-router-dom'
import { WeekBoard } from '../planner/WeekBoard'
import { IconChevRight } from '../ui/Icons'

// Compact week summary for the dashboard bento. Full interactions live on the
// dedicated /planner page, which this card links to.
export function WeekPlannerCard() {
  const navigate = useNavigate()
  return (
    <div className="card area-week">
      <div className="card-h">
        <h3>This Week</h3>
        <button className="btn ghost sm" onClick={() => navigate('/planner')}>
          Open Planner <IconChevRight size={12} style={{ verticalAlign: '-2px' }} />
        </button>
      </div>
      <WeekBoard compact />
    </div>
  )
}
