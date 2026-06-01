import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLifelongStore } from '../../store/useLifelongStore'
import { useDayPlanStore } from '../../store/useDayPlanStore'
import { useScheduleDoneStore } from '../../store/useScheduleDoneStore'
import { buildWeek } from '../../lib/weekPlanner'
import { IconChevRight } from '../ui/Icons'
import { CardTitleLink } from './CardTitleLink'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function dayLabel(dateISO, day) {
  return `${MONTH_SHORT[Number(dateISO.slice(5, 7)) - 1]} ${day}`
}

// Checkable week summary for the dashboard bento — the same todo rows as the
// Goals card, grouped by day. Lifelong leaves carry their immediate-parent
// badge; one-off Planner todos carry a "Planner" badge. Toggling here writes
// straight back to the shared stores, so the /planner page stays in sync. The
// card grows to fill the left column and scrolls internally (see .area-week).
export function WeekPlannerCard() {
  const navigate = useNavigate()

  const lifelongNodes = useLifelongStore(s => s.nodes)
  const dayPlan       = useDayPlanStore(s => s.byDate)
  const toggleTodo    = useDayPlanStore(s => s.toggleTodo)
  const done          = useScheduleDoneStore(s => s.done)
  const toggleDone    = useScheduleDoneStore(s => s.toggle)

  const week = useMemo(
    () => buildWeek({ lifelongGoals: lifelongNodes, dayPlan, doneMap: done }),
    [lifelongNodes, dayPlan, done],
  )

  const total = week.reduce((n, d) => n + d.total, 0)
  const doneCount = week.reduce((n, d) => n + d.doneCount, 0)

  function toggle(day, item) {
    if (item.source === 'lifelong') toggleDone(day.date, item.key)
    else if (item.source === 'oneoff') toggleTodo(item.date, item.todoId)
  }

  return (
    <div className="card area-week">
      <div className="card-h">
        <CardTitleLink to="/planner">This Week</CardTitleLink>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          {total > 0 && <span className="meta">{doneCount}/{total} done</span>}
          <button type="button" className="btn ghost sm" onClick={() => navigate('/planner')}>
            Open Planner <IconChevRight size={12} style={{ verticalAlign: '-2px' }} />
          </button>
        </div>
      </div>

      <div className="wkp-scroll">
        {week.map(day => (
          <div key={day.date} className={'wkp-group' + (day.isPast ? ' past' : '')}>
            <div className="wkp-group-h">
              <span className={'wkp-day' + (day.isToday ? ' today' : '')}>
                {day.weekday}{day.isToday ? ' · today' : ''}
              </span>
              <span className="wkp-date">{dayLabel(day.date, day.day)}</span>
            </div>

            {day.items.length === 0 ? (
              <div className="wkp-empty">—</div>
            ) : day.items.map(item => (
              <div
                key={item.key}
                className={'todo' + (item.done ? ' done' : '')}
                role="button"
                tabIndex={0}
                onClick={() => toggle(day, item)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(day, item) } }}
                title={item.source === 'lifelong' ? `From: ${item.goalTitle}` : 'From: Planner'}
              >
                <div className="chk" />
                <div className="lbl">{item.label}</div>
                {item.source === 'lifelong'
                  ? <span className="wkp-badge life">{item.goalTitle}</span>
                  : <span className="wkp-badge plan">Planner</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
