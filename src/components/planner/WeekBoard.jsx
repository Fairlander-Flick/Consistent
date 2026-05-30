import { useMemo, useState } from 'react'
import { useLifelongStore } from '../../store/useLifelongStore'
import { useGoalsStore } from '../../store/useGoalsStore'
import { useScheduleDoneStore } from '../../store/useScheduleDoneStore'
import { buildWeek } from '../../lib/weekPlanner'
import { todayISO } from '../../lib/dateUtils'
import { IconCheck } from '../ui/Icons'

const DAY_LETTER = { Mon: 'M', Tue: 'T', Wed: 'W', Thu: 'T', Fri: 'F', Sat: 'S', Sun: 'S' }

// 7-column weekly board. Reads everything from existing stores — no new model.
// The full (non-compact) view pairs the board with an item tray you drag from:
// drop a lifelong item onto a day to schedule it there. `compact` renders a
// read-only summary for the bento card.
export function WeekBoard({ refDate, compact = false }) {
  const ref = refDate || todayISO()

  const lifelongGoals = useLifelongStore(s => s.goals)
  const toggleItemDay = useLifelongStore(s => s.toggleItemDay)
  const moveItemDay   = useLifelongStore(s => s.moveItemDay)

  const dailyGoals = useGoalsStore(s => s.goals)
  const goalsLog   = useGoalsStore(s => s.goalsLog)
  const toggleTodo = useGoalsStore(s => s.toggleTodo)

  const done       = useScheduleDoneStore(s => s.done)
  const toggleDone = useScheduleDoneStore(s => s.toggle)

  const week = useMemo(
    () => buildWeek({ refDate: ref, lifelongGoals, dailyGoals, goalsLog, doneMap: done }),
    [ref, lifelongGoals, dailyGoals, goalsLog, done],
  )

  // Fast lookup of an item's current days, for guarding add-vs-remove on drop.
  const daysOf = useMemo(() => {
    const m = new Map()
    for (const g of lifelongGoals) for (const it of g.items || []) m.set(it.id, new Set(it.days || []))
    return m
  }, [lifelongGoals])

  const [dragOver, setDragOver] = useState(null) // weekday hovered during a drag
  const [trayOver, setTrayOver] = useState(false)

  function onItemToggle(day, item) {
    if (item.source === 'lifelong') toggleDone(day.date, item.key)
    else if (item.live) toggleTodo('daily', item.todoId)
  }

  function startDrag(e, payload) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(payload))
  }

  function readPayload(e) {
    try { return JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return null }
  }

  // Drop onto a day column: move (from another day) or schedule (from the tray).
  function onDropDay(e, targetDay) {
    e.preventDefault()
    setDragOver(null)
    const data = readPayload(e)
    if (!data?.itemId) return
    if (data.fromDay) {
      if (data.fromDay !== targetDay.weekday) moveItemDay(data.goalId, data.itemId, data.fromDay, targetDay.weekday)
    } else if (!daysOf.get(data.itemId)?.has(targetDay.weekday)) {
      toggleItemDay(data.goalId, data.itemId, targetDay.weekday)
    }
  }

  // Drop back onto the tray: unschedule that occurrence.
  function onDropTray(e) {
    e.preventDefault()
    setTrayOver(false)
    const data = readPayload(e)
    if (data?.itemId && data.fromDay) toggleItemDay(data.goalId, data.itemId, data.fromDay)
  }

  const board = (
    <div className={'wk-board' + (compact ? ' compact' : '')}>
      {week.map(day => (
        <div
          key={day.date}
          className={
            'wk-col'
            + (day.isToday ? ' today' : '')
            + (day.isPast ? ' past' : '')
            + (dragOver === day.weekday ? ' dragover' : '')
          }
          onDragOver={compact ? undefined : (e) => { e.preventDefault(); if (dragOver !== day.weekday) setDragOver(day.weekday) }}
          onDragLeave={compact ? undefined : () => setDragOver(d => (d === day.weekday ? null : d))}
          onDrop={compact ? undefined : (e) => onDropDay(e, day)}
        >
          <div className="wk-col-h">
            <div className="wk-col-day">
              <span className="wk-col-wd">{compact ? day.weekday[0] : day.weekday}</span>
              <span className="wk-col-dt">{day.day}</span>
            </div>
            {day.total > 0 && <span className="wk-count">{day.doneCount}/{day.total}</span>}
          </div>

          <div className="wk-col-body">
            {day.items.length === 0 && <div className="wk-empty">{compact ? '·' : 'Drop here'}</div>}

            {day.items.map(item => {
              const interactive = item.source === 'lifelong' || item.live
              return (
                <div
                  key={item.key}
                  className={'wk-item ' + item.source + (item.done ? ' done' : '') + (interactive ? '' : ' static')}
                  draggable={!compact && item.draggable}
                  onDragStart={!compact && item.draggable
                    ? (e) => startDrag(e, { goalId: item.goalId, itemId: item.itemId, fromDay: day.weekday })
                    : undefined}
                  onClick={interactive ? () => onItemToggle(day, item) : undefined}
                >
                  <span className="wk-chk">{item.done && <IconCheck size={10} />}</span>
                  <span className="wk-lbl">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  if (compact) return board

  return (
    <div className="wk-layout">
      <ItemTray
        goals={lifelongGoals}
        over={trayOver}
        onDragStart={startDrag}
        onDragOver={(e) => { e.preventDefault(); if (!trayOver) setTrayOver(true) }}
        onDragLeave={() => setTrayOver(false)}
        onDrop={onDropTray}
      />
      <div className="wk-scroll">{board}</div>
    </div>
  )
}

// Backlog of all active lifelong items, grouped by goal. Drag a chip onto a day
// to schedule it; drag a scheduled chip from a day back here to unschedule it.
function ItemTray({ goals, over, onDragStart, onDragOver, onDragLeave, onDrop }) {
  const active = goals
    .filter(g => !g.done)
    .map(g => ({ ...g, items: (g.items || []).filter(it => !it.done) }))
    .filter(g => g.items.length > 0)
  return (
    <div
      className={'wk-tray' + (over ? ' over' : '')}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="wk-tray-h">Items</div>
      {active.length === 0 && (
        <div className="wk-tray-empty">
          No lifelong items yet. Add some under a goal in Lifelong Goals.
        </div>
      )}
      {active.map(g => (
        <div key={g.id} className="wk-tray-group">
          <div className="wk-tray-goal">{g.title}</div>
          {g.items.map(it => (
            <div
              key={it.id}
              className="wk-chip"
              draggable
              onDragStart={(e) => onDragStart(e, { goalId: g.id, itemId: it.id })}
              title="Drag onto a day to schedule"
            >
              <span className="wk-chip-lbl">{it.title}</span>
              {(it.days || []).length > 0 && (
                <span className="wk-chip-days">
                  {it.days.map(d => <i key={d} title={d}>{DAY_LETTER[d]}</i>)}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
