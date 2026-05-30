import { useMemo, useState } from 'react'
import { useLifelongStore } from '../../store/useLifelongStore'
import { useDayPlanStore } from '../../store/useDayPlanStore'
import { useScheduleDoneStore } from '../../store/useScheduleDoneStore'
import { buildMonth, itemsForDate } from '../../lib/weekPlanner'
import { todayISO } from '../../lib/dateUtils'
import { IconPlus } from '../ui/Icons'

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function matchesFilter(item, filter) {
  if (filter === 'oneoff') return item.source === 'oneoff'
  if (filter === 'recurring') return item.source === 'lifelong'
  return true
}

// Calendar month view: dots flag days with one-off (accent) / recurring (muted)
// items; clicking a day opens its agenda below.
export function MonthBoard({ refDate, filter = 'all' }) {
  const today = todayISO()
  const ref = refDate || today

  const lifelongNodes = useLifelongStore(s => s.nodes)
  const dayPlan    = useDayPlanStore(s => s.byDate)
  const addTodo    = useDayPlanStore(s => s.addTodo)
  const toggleTodo = useDayPlanStore(s => s.toggleTodo)
  const deleteTodo = useDayPlanStore(s => s.deleteTodo)
  const done       = useScheduleDoneStore(s => s.done)
  const toggleDone = useScheduleDoneStore(s => s.toggle)

  const { month, cells } = useMemo(
    () => buildMonth({ refDate: ref, lifelongGoals: lifelongNodes, dayPlan, doneMap: done }),
    [ref, lifelongNodes, dayPlan, done],
  )

  const [selected, setSelected] = useState(() => (ref.slice(0, 7) === today.slice(0, 7) ? today : null))
  const [addText, setAddText] = useState('')

  const agenda = useMemo(
    () => selected
      ? itemsForDate(selected, { lifelongGoals: lifelongNodes, dayPlan, doneMap: done }).filter(it => matchesFilter(it, filter))
      : [],
    [selected, lifelongNodes, dayPlan, done, filter],
  )

  function submitAdd() {
    if (selected && addText.trim()) addTodo(selected, addText)
    setAddText('')
  }

  return (
    <div className="mo-wrap">
      <div className="mo-cal card">
        <div className="mo-title">{MONTHS[month]}</div>
        <div className="mo-grid mo-head">
          {WD.map(d => <div key={d} className="mo-wd">{d}</div>)}
        </div>
        <div className="mo-grid">
          {cells.map(c => {
            const showOne = (filter !== 'recurring') && c.oneoffCount > 0
            const showRec = (filter !== 'oneoff') && c.recurringCount > 0
            return (
              <button
                key={c.date}
                className={'mo-cell'
                  + (c.inMonth ? '' : ' out')
                  + (c.isToday ? ' today' : '')
                  + (c.date === selected ? ' sel' : '')}
                onClick={() => setSelected(c.date)}
              >
                <span className="mo-day">{c.day}</span>
                <span className="mo-dots">
                  {showOne && <i className="mo-dot one" />}
                  {showRec && <i className="mo-dot rec" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mo-agenda card">
        {!selected ? (
          <div className="wk-done-empty">Pick a day to see and plan its todos.</div>
        ) : (
          <>
            <div className="card-h">
              <h3>{selected}</h3>
              <span className="meta">{agenda.length} item{agenda.length === 1 ? '' : 's'}</span>
            </div>

            <div className="col" style={{ gap: 0 }}>
              {agenda.map(item => (
                <div
                  key={item.key}
                  className={'todo' + (item.done ? ' done' : '')}
                  onClick={() => item.source === 'oneoff' ? toggleTodo(item.date, item.todoId) : toggleDone(selected, item.key)}
                >
                  <div className="chk" />
                  <div className="lbl">{item.label}</div>
                  {item.source === 'lifelong'
                    ? <span className="chip" style={{ fontSize: 10 }}>🔁</span>
                    : <div className="x" style={{ color: 'var(--negative)', fontSize: 16 }}
                        onClick={e => { e.stopPropagation(); deleteTodo(item.date, item.todoId) }}>×</div>}
                </div>
              ))}
              {agenda.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 4px' }}>Nothing planned.</div>
              )}
            </div>

            {filter !== 'recurring' && (
              <div className="row" style={{ gap: 6, marginTop: 10 }}>
                <input className="input" placeholder="Add a todo for this day…" value={addText}
                  onChange={e => setAddText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitAdd()} />
                <button className="btn primary sm" onClick={submitAdd}><IconPlus size={12} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
