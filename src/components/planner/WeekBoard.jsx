import { useMemo, useState } from 'react'
import { useLifelongStore } from '../../store/useLifelongStore'
import { useDayPlanStore } from '../../store/useDayPlanStore'
import { useScheduleDoneStore } from '../../store/useScheduleDoneStore'
import { buildWeek } from '../../lib/weekPlanner'
import { todayISO } from '../../lib/dateUtils'
import { nodeDone } from '../../lib/lifelongProgress'
import { IconCheck, IconPlus } from '../ui/Icons'

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

function matchesFilter(item, filter) {
  if (filter === 'oneoff') return item.source === 'oneoff'
  if (filter === 'recurring') return item.source === 'lifelong'
  return true
}

// 7-column weekly board. `compact` renders a read-only summary for the bento.
// `filter` is 'all' | 'oneoff' | 'recurring'.
export function WeekBoard({ refDate, compact = false, filter = 'all' }) {
  const ref = refDate || todayISO()

  const lifelongNodes = useLifelongStore(s => s.nodes)
  const toggleNodeDay = useLifelongStore(s => s.toggleNodeDay)
  const moveNodeDay   = useLifelongStore(s => s.moveNodeDay)

  const dayPlan      = useDayPlanStore(s => s.byDate)
  const addTodo      = useDayPlanStore(s => s.addTodo)
  const toggleTodo   = useDayPlanStore(s => s.toggleTodo)
  const deleteTodo   = useDayPlanStore(s => s.deleteTodo)

  const done       = useScheduleDoneStore(s => s.done)
  const toggleDone = useScheduleDoneStore(s => s.toggle)

  const week = useMemo(
    () => buildWeek({ refDate: ref, lifelongGoals: lifelongNodes, dayPlan, doneMap: done }),
    [ref, lifelongNodes, dayPlan, done],
  )

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
  const [addFor, setAddFor] = useState(null)   // date whose add-input is open
  const [addText, setAddText] = useState('')

  function onItemToggle(item) {
    if (item.source === 'lifelong') toggleDone(item._date, item.key)
    else if (item.source === 'oneoff') toggleTodo(item.date, item.todoId)
  }

  function startDrag(e, payload) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(payload))
  }
  function readPayload(e) {
    try { return JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return null }
  }

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
  function onDropTray(e) {
    e.preventDefault()
    setTrayOver(false)
    const data = readPayload(e)
    if (data?.nodeId && data.fromDay) toggleNodeDay(data.nodeId, data.fromDay)
  }

  function submitAdd(date) {
    if (addText.trim()) addTodo(date, addText)
    setAddText('')
    setAddFor(null)
  }

  const board = (
    <div className={'wk-board' + (compact ? ' compact' : '')}>
      {week.map(day => {
        const items = day.items.filter(it => matchesFilter(it, filter))
        const doneCount = items.filter(it => it.done).length
        return (
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
              {items.length > 0 && <span className="wk-count">{doneCount}/{items.length}</span>}
            </div>

            <div className="wk-col-body">
              {items.length === 0 && <div className="wk-empty">{compact ? '·' : '—'}</div>}

              {items.map(item => {
                const interactive = item.source === 'lifelong' || item.source === 'oneoff'
                return (
                  <div
                    key={item.key}
                    className={'wk-item ' + item.source + (item.done ? ' done' : '') + (interactive ? '' : ' static')}
                    draggable={!compact && item.draggable}
                    onDragStart={!compact && item.draggable
                      ? (e) => startDrag(e, { nodeId: item.itemId, fromDay: day.weekday })
                      : undefined}
                    onClick={interactive ? () => onItemToggle({ ...item, _date: day.date }) : undefined}
                  >
                    <span className="wk-chk">{item.done && <IconCheck size={10} />}</span>
                    <span className="wk-lbl">{item.label}</span>
                    {!compact && item.source === 'oneoff' && (
                      <span className="wk-x" onClick={e => { e.stopPropagation(); deleteTodo(item.date, item.todoId) }}>×</span>
                    )}
                  </div>
                )
              })}

              {!compact && filter !== 'recurring' && (
                addFor === day.date ? (
                  <input
                    className="wk-add-input" autoFocus value={addText}
                    placeholder="New todo…"
                    onChange={e => setAddText(e.target.value)}
                    onBlur={() => submitAdd(day.date)}
                    onKeyDown={e => { if (e.key === 'Enter') submitAdd(day.date); if (e.key === 'Escape') { setAddText(''); setAddFor(null) } }}
                  />
                ) : (
                  <button className="wk-add" onClick={() => { setAddText(''); setAddFor(day.date) }}>
                    <IconPlus size={11} /> add
                  </button>
                )
              )}
            </div>
          </div>
        )
      })}
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

// Backlog of all schedulable lifelong leaves, grouped by pursuit.
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
