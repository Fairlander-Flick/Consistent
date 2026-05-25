import { useState, useRef, useMemo } from 'react'
import { useGoalsStore } from '../../store/useGoalsStore'
import { useDashboard } from '../../lib/DashboardContext'
import { useScheduleStore } from '../../store/useScheduleStore'
import { useScheduleDoneStore } from '../../store/useScheduleDoneStore'
import { todosForDate } from '../../lib/scheduleTodos'
import { todayISO, getWeekStart } from '../../lib/dateUtils'
import { IconEdit } from '../ui/Icons'

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly']

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const KEY_FIELDS = {
  daily:   'dailyDate',
  weekly:  'weeklyDate',
  monthly: 'monthlyDate',
  yearly:  'yearlyDate',
}

function isoFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateLabel(iso) {
  const d = new Date(iso + 'T00:00:00')
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()} · ${DAY_SHORT[d.getDay()]}`
}

// Returns the log key for a given period + date string
function viewKey(period, dateStr) {
  if (period === 'daily')   return dateStr
  if (period === 'weekly')  return isoFromDate(getWeekStart(new Date(dateStr + 'T00:00:00')))
  if (period === 'monthly') return dateStr.slice(0, 7)
  return dateStr.slice(0, 4)
}

// Human-readable label for the period being shown
function periodLabel(period, dateStr) {
  if (period === 'daily') return dateLabel(dateStr)
  if (period === 'weekly') {
    const ws = getWeekStart(new Date(dateStr + 'T00:00:00'))
    const we = new Date(ws)
    we.setDate(we.getDate() + 6)
    return ws.getMonth() === we.getMonth()
      ? `${MONTH_SHORT[ws.getMonth()]} ${ws.getDate()} – ${we.getDate()}`
      : `${MONTH_SHORT[ws.getMonth()]} ${ws.getDate()} – ${MONTH_SHORT[we.getMonth()]} ${we.getDate()}`
  }
  if (period === 'monthly') {
    const d = new Date(dateStr + 'T00:00:00')
    return `${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`
  }
  return dateStr.slice(0, 4)
}

export function GoalsCard() {
  const { goals, goalsLog, toggleTodo, deleteTodo, replacePeriod } = useGoalsStore()
  const { viewDate } = useDashboard()
  const todayStr     = todayISO()
  const isViewingPast = viewDate !== todayStr

  const [period, setPeriod] = useState('daily')
  const [editOpen, setEditOpen]   = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editTodos, setEditTodos] = useState([])
  const [addText, setAddText]     = useState('')
  const addInputRef = useRef(null)

  // Schedule store (consulted only when showing today's daily live view)
  const recurring          = useScheduleStore(s => s.recurring)
  const oneoffs            = useScheduleStore(s => s.oneoffs)
  const done               = useScheduleDoneStore(s => s.done)
  const toggleScheduleDone = useScheduleDoneStore(s => s.toggle)
  const today = todayISO()

  // Resolve which data to display for the current period + viewDate
  const key              = viewKey(period, viewDate)
  const isCurrentPeriod  = goals[KEY_FIELDS[period]] === key
  const viewedData       = isCurrentPeriod
    ? goals[period]
    : (goalsLog?.[period]?.[key] ?? null)

  const hasGoals  = (viewedData?.todos?.length ?? 0) > 0 || !!viewedData?.title
  const goalSet   = hasGoals ? viewedData : null
  const goalTitle = goalSet?.title || ''
  const goalTasks = goalSet?.todos || []
  const goalDone  = goalTasks.filter(t => t.done).length

  // Editing is only allowed when showing the current live period from today's view
  const canEdit = isCurrentPeriod && !isViewingPast

  // Schedule todos: daily + live + viewing today
  const showSchedule = period === 'daily' && isCurrentPeriod && !isViewingPast
  const scheduleTodos = useMemo(
    () => showSchedule ? todosForDate(today, { recurring, oneoffs }) : [],
    [showSchedule, today, recurring, oneoffs]
  )
  const scheduleDoneCount = scheduleTodos.filter(st => done[today]?.[st.key]).length
  const totalCount = goalTasks.length + scheduleTodos.length
  const totalDone  = goalDone + scheduleDoneCount

  function openEdit() {
    const defaultTitle = period === 'daily' && !goals[period]?.title
      ? dateLabel(todayStr)
      : (goals[period]?.title || '')
    setEditTitle(defaultTitle)
    setEditTodos(goals[period]?.todos ? [...goals[period].todos] : [])
    setAddText('')
    setEditOpen(true)
  }

  function handleSave() {
    replacePeriod(period, { title: editTitle, todos: editTodos })
    setEditOpen(false)
  }

  function handleAddTodo() {
    const text = addText.trim()
    if (!text) return
    setEditTodos(prev => [...prev, { id: Date.now().toString(), text, done: false }])
    setAddText('')
    addInputRef.current?.focus()
  }

  function handleRemoveEditTodo(id) {
    setEditTodos(prev => prev.filter(t => t.id !== id))
  }

  return (
    <>
      <div className="card area-goals">
        <div className="card-h">
          <h3>Goals</h3>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <div className="tabs">
              {PERIODS.map(t => (
                <button key={t} className={period === t ? 'active' : ''} onClick={() => setPeriod(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {canEdit && (
              <button className="btn icon" onClick={openEdit} title="Edit goals">
                <IconEdit size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Period label when viewing past */}
        {isViewingPast && (
          <div style={{
            fontSize: 11, background: 'var(--faint)', border: '1px solid var(--border)',
            borderRadius: 5, padding: '5px 8px', marginBottom: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text-mid)' }}>{periodLabel(period, viewDate)}</span>
            {isCurrentPeriod && (
              <span style={{ color: 'var(--accent)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>live</span>
            )}
          </div>
        )}

        <div className="row between" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{goalTitle || '—'}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
            {totalDone} / {totalCount} done
          </div>
        </div>

        <div className="col" style={{ gap: 0 }}>
          {scheduleTodos.map(st => {
            const isDone = !!done[today]?.[st.key]
            return (
              <div
                key={'sch-' + st.key}
                className={'todo' + (isDone ? ' done' : '')}
                onClick={() => toggleScheduleDone(today, st.key)}
                title="From your calendar"
              >
                <div className="chk"></div>
                <div className="lbl">{st.label}</div>
              </div>
            )
          })}
          {goalTasks.slice(0, 6).map(t => (
            <div
              key={t.id}
              className={'todo' + (t.done ? ' done' : '')}
              onClick={() => canEdit && hasGoals && toggleTodo(period, t.id)}
              style={{ cursor: canEdit ? 'pointer' : 'default' }}
            >
              <div className="chk" style={{ pointerEvents: canEdit ? undefined : 'none' }} />
              <div className="lbl">{t.text}</div>
              {canEdit && hasGoals && (
                <div
                  className="x"
                  style={{ color: 'var(--negative)', fontSize: 16 }}
                  onClick={e => { e.stopPropagation(); deleteTodo(period, t.id) }}
                >
                  ×
                </div>
              )}
            </div>
          ))}
          {totalCount === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 4px' }}>
              {isViewingPast
                ? 'No goals recorded.'
                : <>No goals yet.{' '}<button className="btn ghost sm" style={{ padding: '2px 6px' }} onClick={openEdit}>Add one</button></>
              }
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <div style={{ marginTop: 12, height: 3, background: 'var(--faint)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              width: `${(totalDone / totalCount) * 100}%`,
              height: '100%', background: 'var(--accent)', transition: 'width 300ms',
            }} />
          </div>
        )}
      </div>

      {editOpen && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal" style={{ width: 340 }} onClick={e => e.stopPropagation()}>
            <h4>{period[0].toUpperCase() + period.slice(1)} Goals</h4>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Title</div>
              <input
                className="input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="e.g. This week's focus"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div className="col" style={{ gap: 0 }}>
                {editTodos.map(t => (
                  <div key={t.id} className="todo">
                    <div className="chk" style={{ pointerEvents: 'none' }} />
                    <div className="lbl">{t.text}</div>
                    <div
                      className="x"
                      style={{ color: 'var(--negative)', fontSize: 16, opacity: 1 }}
                      onClick={() => handleRemoveEditTodo(t.id)}
                    >×</div>
                  </div>
                ))}
                {editTodos.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', padding: '6px 4px' }}>No tasks yet.</div>
                )}
              </div>
            </div>

            <div className="row" style={{ gap: 6, marginBottom: 16 }}>
              <input
                ref={addInputRef}
                className="input"
                style={{ flex: 1 }}
                placeholder="Add a task..."
                value={addText}
                onChange={e => setAddText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
              />
              <button className="btn primary sm" onClick={handleAddTodo}>Add</button>
            </div>

            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="btn primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
