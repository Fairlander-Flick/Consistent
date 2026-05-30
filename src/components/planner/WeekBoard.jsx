import { useMemo, useState } from 'react'
import { useLifelongStore } from '../../store/useLifelongStore'
import { useGoalsStore } from '../../store/useGoalsStore'
import { useScheduleDoneStore } from '../../store/useScheduleDoneStore'
import { buildWeek } from '../../lib/weekPlanner'
import { todayISO } from '../../lib/dateUtils'
import { nodeDone } from '../../lib/lifelongProgress'
import { IconCheck } from '../ui/Icons'

const DAY_LETTER = { Mon: 'M', Tue: 'T', Wed: 'W', Thu: 'T', Fri: 'F', Sat: 'S', Sun: 'S' }

// Flatten the tree into { pursuit, leaves:[{id,title,days}] } groups for the
// drag tray. Only unfinished leaves (no children) are schedulable.
function leafGroups(nodes) {
  const out = []
  for (const root of nodes) {
    const leaves = []
    const walk = (node) => {
      const isLeaf = !(node.children && node.children.length)
      if (isLeaf) {
        if (!nodeDone(node)) leaves.push({ id: node.id, title: node.title, days: node.days || [] })
        return
      }
      node.children.forEach(walk)
    }
    walk(root)
    if (leaves.length) out.push({ id: root.id, title: root.title, leaves })
  }
  return out
}

// 7-column weekly board. `compact` renders a read-only summary for the bento.
export function WeekBoard({ refDate, compact = false }) {
  const ref = refDate || todayISO()

  const lifelongNodes = useLifelongStore(s => s.nodes)
  const toggleNodeDay = useLifelongStore(s => s.toggleNodeDay)
  const moveNodeDay   = useLifelongStore(s => s.moveNodeDay)

  const dailyGoals = useGoalsStore(s => s.goals)
  const goalsLog   = useGoalsStore(s => s.goalsLog)
  const toggleTodo = useGoalsStore(s => s.toggleTodo)

  const done       = useScheduleDoneStore(s => s.done)
  const toggleDone = useScheduleDoneStore(s => s.toggle)

  const week = useMemo(
    () => buildWeek({ refDate: ref, lifelongGoals: lifelongNodes, dailyGoals, goalsLog, doneMap: done }),
    [ref, lifelongNodes, dailyGoals, goalsLog, done],
  )

  // Fast lookup of a node's current scheduled days, to guard add-vs-remove.
  const daysOf = useMemo(() => {
    const m = new Map()
    const walk = (n) => {
      if (!(n.children && n.children.length)) m.set(n.id, new Set(n.days || []))
      else n.children.forEach(walk)
    }
    lifelongNodes.forEach(walk)
    return m
  }, [lifelongNodes])

  const [dragOver, setDragOver] = useState(null)
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
    if (!data?.nodeId) return
    if (data.fromDay) {
      if (data.fromDay !== targetDay.weekday) moveNodeDay(data.nodeId, data.fromDay, targetDay.weekday)
    } else if (!daysOf.get(data.nodeId)?.has(targetDay.weekday)) {
      toggleNodeDay(data.nodeId, targetDay.weekday)
    }
  }

  // Drop back onto the tray: unschedule that occurrence.
  function onDropTray(e) {
    e.preventDefault()
    setTrayOver(false)
    const data = readPayload(e)
    if (data?.nodeId && data.fromDay) toggleNodeDay(data.nodeId, data.fromDay)
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
                    ? (e) => startDrag(e, { nodeId: item.itemId, fromDay: day.weekday })
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
        groups={leafGroups(lifelongNodes)}
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

// Backlog of all schedulable lifelong leaves, grouped by pursuit. Drag a chip
// onto a day to schedule it; drag a scheduled chip back here to unschedule.
function ItemTray({ groups, over, onDragStart, onDragOver, onDragLeave, onDrop }) {
  return (
    <div
      className={'wk-tray' + (over ? ' over' : '')}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="wk-tray-h">Items</div>
      {groups.length === 0 && (
        <div className="wk-tray-empty">
          No lifelong items yet. Add some on the Goals page.
        </div>
      )}
      {groups.map(g => (
        <div key={g.id} className="wk-tray-group">
          <div className="wk-tray-goal">{g.title}</div>
          {g.leaves.map(it => (
            <div
              key={it.id}
              className="wk-chip"
              draggable
              onDragStart={(e) => onDragStart(e, { nodeId: it.id })}
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
