import { useState } from 'react'
import { WeekBoard } from '../components/planner/WeekBoard'
import { MonthBoard } from '../components/planner/MonthBoard'
import { PlannerConsistency } from '../components/planner/PlannerConsistency'
import { useLifelongStore } from '../store/useLifelongStore'
import { todayISO, isoWeekDates } from '../lib/dateUtils'
import { IconChevLeft, IconChevRight, IconTrash } from '../components/ui/Icons'

const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const FILTERS = [
  { k: 'all', label: 'All' },
  { k: 'oneoff', label: '○ One-off' },
  { k: 'recurring', label: '🔁 Recurring' },
]

function shiftMonthISO(iso, months) {
  const d = new Date(iso + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

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
  const [mode, setMode] = useState('week')   // 'week' | 'month'
  const [filter, setFilter] = useState('all')

  const isThisWeek = isoWeekDates(new Date(refDate + 'T00:00:00')).includes(todayStr)
  const isThisMonth = refDate.slice(0, 7) === todayStr.slice(0, 7)
  const isCurrent = mode === 'week' ? isThisWeek : isThisMonth

  const step = (dir) => setRefDate(r => mode === 'week' ? shiftISO(r, dir * 7) : shiftMonthISO(r, dir))
  const rangeText = mode === 'week'
    ? rangeLabel(refDate)
    : `${MONTH_FULL[new Date(refDate + 'T00:00:00').getMonth()]} ${refDate.slice(0, 4)}`

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Planner</h1>
          <div className="sub" style={{ marginTop: 4 }}>
            {mode === 'week' ? 'Your week at a glance — every day, what’s scheduled.' : 'The whole month — dots flag days with plans.'}
          </div>
        </div>
        <div className="wk-nav">
          <div className="tabs">
            <button className={mode === 'week' ? 'active' : ''} onClick={() => setMode('week')}>Week</button>
            <button className={mode === 'month' ? 'active' : ''} onClick={() => setMode('month')}>Month</button>
          </div>
          <button className="btn icon" onClick={() => step(-1)} title={mode === 'week' ? 'Previous week' : 'Previous month'}>
            <IconChevLeft size={14} />
          </button>
          <button
            className={'btn sm' + (isCurrent ? '' : ' primary')}
            onClick={() => setRefDate(todayStr)}
            disabled={isCurrent}
          >
            Today
          </button>
          <button className="btn icon" onClick={() => step(1)} title={mode === 'week' ? 'Next week' : 'Next month'}>
            <IconChevRight size={14} />
          </button>
        </div>
      </div>

      <div className="row between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div className="wk-range" style={{ margin: 0 }}>{rangeText}</div>
        <div className="tabs">
          {FILTERS.map(f => (
            <button key={f.k} className={filter === f.k ? 'active' : ''} onClick={() => setFilter(f.k)}>{f.label}</button>
          ))}
        </div>
      </div>

      {mode === 'week'
        ? <WeekBoard refDate={refDate} filter={filter} />
        : <MonthBoard refDate={refDate} filter={filter} />}

      <div className="wk-legend">
        <span><i className="wk-leg-dot lifelong" /> 🔁 Recurring (lifelong / habit)</span>
        <span><i className="wk-leg-dot daily" /> ○ One-off todo</span>
        {mode === 'week' && (
          <span className="wk-leg-hint">Drag an item from the tray onto a day to schedule it · drag back to remove · “+ add” for a one-off.</span>
        )}
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
