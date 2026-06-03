import { useMemo, useState } from 'react'
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
  const toggleTask    = useLifelongStore(s => s.toggleTask)
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

  // Days start collapsed — the user expands a day to see what's scheduled on it.
  const [expanded, setExpanded] = useState(() => new Set())
  const toggleExpand = (date) => setExpanded(prev => {
    const next = new Set(prev)
    if (next.has(date)) next.delete(date); else next.add(date)
    return next
  })

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
        {week.map(day => {
          const open = expanded.has(day.date)
          return (
          <div key={day.date} className={'wkp-group' + (day.isPast ? ' past' : '') + (open ? ' open' : '')}>
            <div
              className="wkp-group-h"
              role="button"
              tabIndex={0}
              aria-expanded={open}
              style={{ alignItems: 'center', cursor: 'pointer' }}
              onClick={() => toggleExpand(day.date)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(day.date) } }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconChevRight
                  size={11}
                  style={{ opacity: 0.55, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }}
                />
                <span className={'wkp-day' + (day.isToday ? ' today' : '')}>
                  {day.weekday}{day.isToday ? ' · today' : ''}
                </span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="wkp-date">{dayLabel(day.date, day.day)}</span>
                {day.total > 0 && (
                  <span className="wkp-date" style={{ color: day.doneCount === day.total ? 'var(--accent)' : 'var(--muted)' }}>
                    {day.doneCount}/{day.total}
                  </span>
                )}
              </span>
            </div>

            {open && (
              day.items.length === 0 ? (
                <div className="wkp-empty">—</div>
              ) : day.items.map(item => (
                <WeekTodoRow
                  key={item.key}
                  item={item}
                  onJustToday={() => toggle(day, item)}
                  onFullyDone={() => toggleTask(item.itemId)}
                />
              ))
            )}
          </div>
          )
        })}
      </div>
    </div>
  )
}

// One day's todo row. Ticking a lifelong TASK asks whether it's fully done
// (permanent) or just done for today (effort tick, returns next scheduled day).
function WeekTodoRow({ item, onJustToday, onFullyDone }) {
  const [confirm, setConfirm] = useState(false)
  const isTask = item.source === 'lifelong' && item.kind === 'task'

  if (isTask && confirm) {
    return (
      <div className="todo" style={{ cursor: 'default' }}>
        <div className="lbl" style={{ fontSize: 12 }}>Fully done, or continue?</div>
        <button type="button" className="btn primary sm" style={{ marginLeft: 'auto' }}
          onClick={() => { onFullyDone(); setConfirm(false) }}>Done</button>
        <button type="button" className="btn ghost sm"
          onClick={() => { onJustToday(); setConfirm(false) }}>Just today</button>
        <button type="button" className="btn ghost sm" aria-label="Cancel" onClick={() => setConfirm(false)}>✕</button>
      </div>
    )
  }

  const handle = () => { if (isTask && !item.done) setConfirm(true); else onJustToday() }

  return (
    <div
      className={'todo' + (item.done ? ' done' : '')}
      role="button"
      tabIndex={0}
      onClick={handle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle() } }}
      title={item.source === 'lifelong' ? `From: ${item.goalTitle}` : 'From: Planner'}
    >
      <div className="chk" />
      <div className="lbl">{item.label}</div>
      {item.source === 'lifelong'
        ? <span className="wkp-badge life">{item.goalTitle}</span>
        : <span className="wkp-badge plan">Planner</span>}
    </div>
  )
}
