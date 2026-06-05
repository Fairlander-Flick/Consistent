import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLifelongStore } from '../../store/useLifelongStore'
import { useDayPlanStore } from '../../store/useDayPlanStore'
import { useScheduleDoneStore } from '../../store/useScheduleDoneStore'
import { buildWeek } from '../../lib/weekPlanner'
import { pursuitColorVar, PLANNER_COLOR } from '../../lib/pursuitColors'
import { IconChevRight } from '../ui/Icons'
import { CardTitleLink } from './CardTitleLink'
import { Swap } from '../ui/transitions'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function dayLabel(dateISO, day) {
  return `${MONTH_SHORT[Number(dateISO.slice(5, 7)) - 1]} ${day}`
}

// Week summary that drills into a single day. The list shows one row per day
// (weekday + count) with no task text; clicking a day swaps the card to that
// day's checkable todos with a "← This Week" button to return. Toggling writes
// straight back to the shared stores, so /planner stays in sync.
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

  // Which day is opened, by ISO date. null = the week list.
  const [openDate, setOpenDate] = useState(null)
  const openDay = openDate ? week.find(d => d.date === openDate) : null

  function toggle(day, item) {
    if (item.source === 'lifelong') toggleDone(day.date, item.key)
    else if (item.source === 'oneoff') toggleTodo(item.date, item.todoId)
  }

  return (
    <div className="card area-week">
      <div className="card-h">
        <CardTitleLink to="/planner">This Week</CardTitleLink>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          {openDay == null && total > 0 && <span className="meta">{doneCount}/{total} done</span>}
          <button type="button" className="btn ghost sm" onClick={() => navigate('/planner')}>
            Open Planner <IconChevRight size={12} style={{ verticalAlign: '-2px' }} />
          </button>
        </div>
      </div>

      <Swap swapKey={openDate || 'list'} className="wkp-swap">
        {openDay == null ? (
          <div className="wkp-list">
            {week.map(day => (
              <div
                key={day.date}
                className={'wkp-day-row' + (day.isToday ? ' today' : '') + (day.isPast ? ' past' : '')}
                role="button"
                tabIndex={0}
                onClick={() => setOpenDate(day.date)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenDate(day.date) } }}
              >
                <span className="wd">{day.weekday}{day.isToday ? ' · today' : ''}</span>
                <span className={'cnt' + (day.total > 0 && day.doneCount === day.total ? ' full' : '')}>
                  {day.total > 0 ? `${day.doneCount}/${day.total}` : '—'}
                </span>
                <span className="date">{dayLabel(day.date, day.day)}</span>
                <span className="wkp-chev-r" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="wkp-detail-h">
              <button type="button" className="wkp-back" onClick={() => setOpenDate(null)}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>←</span> This Week
              </button>
              <span className={'wkp-detail-title' + (openDay.isToday ? ' today' : '')}>
                {openDay.weekdayFull}{openDay.isToday ? ' · today' : ''}
              </span>
              <span className="wkp-detail-date">{dayLabel(openDay.date, openDay.day)}</span>
            </div>
            <div className="wkp-scroll">
              {openDay.items.length === 0 ? (
                <div className="wkp-empty">Nothing scheduled.</div>
              ) : openDay.items.map(item => (
                <WeekTodoRow
                  key={item.key}
                  item={item}
                  onJustToday={() => toggle(openDay, item)}
                  onFullyDone={() => toggleTask(item.itemId)}
                />
              ))}
            </div>
          </>
        )}
      </Swap>
    </div>
  )
}

// One day's todo row. Ticking a lifelong TASK asks whether it's fully done
// (permanent) or just done for today (effort tick, returns next scheduled day).
function WeekTodoRow({ item, onJustToday, onFullyDone }) {
  const [confirm, setConfirm] = useState(false)
  const isTask = item.source === 'lifelong' && item.kind === 'task'
  const dot = item.source === 'lifelong'
    ? pursuitColorVar(item.rootId ?? item.goalTitle)
    : PLANNER_COLOR

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
      <span className="pdot" style={{ background: dot }} />
      <div className="lbl">{item.label}</div>
      {item.source === 'lifelong'
        ? <span className="wkp-badge life">{item.goalTitle}</span>
        : <span className="wkp-badge plan">Planner</span>}
    </div>
  )
}
