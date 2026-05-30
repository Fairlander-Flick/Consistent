import { useState } from 'react'
import { WeekBoard } from '../components/planner/WeekBoard'
import { PlannerConsistency } from '../components/planner/PlannerConsistency'
import { useLifelongStore } from '../store/useLifelongStore'
import { todayISO, isoWeekDates } from '../lib/dateUtils'
import { IconChevLeft, IconChevRight, IconTrash } from '../components/ui/Icons'

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function shiftISO(iso, days) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function rangeLabel(refDate) {
  const week = isoWeekDates(new Date(refDate + 'T00:00:00'))
  const a = new Date(week[0] + 'T00:00:00')
  const b = new Date(week[6] + 'T00:00:00')
  const left = `${MONTH_SHORT[a.getMonth()]} ${a.getDate()}`
  const right = a.getMonth() === b.getMonth()
    ? `${b.getDate()}`
    : `${MONTH_SHORT[b.getMonth()]} ${b.getDate()}`
  return `${left} – ${right}, ${b.getFullYear()}`
}

export function Planner() {
  const todayStr = todayISO()
  const [refDate, setRefDate] = useState(todayStr)
  const isThisWeek = isoWeekDates(new Date(refDate + 'T00:00:00')).includes(todayStr)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Planner</h1>
          <div className="sub" style={{ marginTop: 4 }}>
            Your week at a glance — every day, what's scheduled.
          </div>
        </div>
        <div className="wk-nav">
          <button className="btn icon" onClick={() => setRefDate(r => shiftISO(r, -7))} title="Previous week">
            <IconChevLeft size={14} />
          </button>
          <button
            className={'btn sm' + (isThisWeek ? '' : ' primary')}
            onClick={() => setRefDate(todayStr)}
            disabled={isThisWeek}
          >
            This week
          </button>
          <button className="btn icon" onClick={() => setRefDate(r => shiftISO(r, 7))} title="Next week">
            <IconChevRight size={14} />
          </button>
        </div>
      </div>

      <div className="wk-range">{rangeLabel(refDate)}</div>

      <WeekBoard refDate={refDate} />

      <div className="wk-legend">
        <span><i className="wk-leg-dot lifelong" /> Lifelong item</span>
        <span><i className="wk-leg-dot daily" /> Daily todo</span>
        <span className="wk-leg-hint">Drag an item from the tray onto a day to schedule it · drag back to the tray to remove.</span>
      </div>

      <div className="wk-lower">
        <PlannerConsistency refDate={refDate} onPick={setRefDate} />
        <CompletedSection />
      </div>
    </>
  )
}

// Finished task leaves, grouped by their top-level pursuit. Restore unchecks
// the task (its schedule is preserved); delete removes it for good.
function CompletedSection() {
  const nodes = useLifelongStore(s => s.nodes)
  const toggleTask = useLifelongStore(s => s.toggleTask)
  const deleteNode = useLifelongStore(s => s.deleteNode)

  const groups = nodes
    .map(root => {
      const items = []
      const walk = (n) => {
        if (!(n.children && n.children.length)) {
          if (n.kind === 'task' && n.done) items.push(n)
        } else n.children.forEach(walk)
      }
      walk(root)
      return { goal: root, items }
    })
    .filter(g => g.items.length > 0)
  const total = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="card">
      <div className="card-h">
        <h3>Completed</h3>
        <span className="meta">{total} {total === 1 ? 'sub-goal' : 'sub-goals'}</span>
      </div>

      {total === 0 ? (
        <div className="wk-done-empty">
          Nothing finished yet. Check off a task on the Goals page and it lands here.
        </div>
      ) : (
        groups.map(({ goal, items }) => (
          <div key={goal.id} className="wk-done-group">
            <div className="wk-done-goal">{goal.title}</div>
            {items.map(it => (
              <div key={it.id} className="wk-done-item">
                <span className="wk-done-lbl">{it.title}</span>
                <button className="btn ghost sm" onClick={() => toggleTask(it.id)}>Restore</button>
                <button className="btn ghost icon" title="Delete permanently" onClick={() => deleteNode(it.id)}>
                  <IconTrash size={12} />
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
