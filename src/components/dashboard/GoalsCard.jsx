import { useState, useRef, useMemo } from 'react'
import { useGoalsStore } from '../../store/useGoalsStore'
import { useDashboard } from '../../lib/DashboardContext'
import { useScheduleStore } from '../../store/useScheduleStore'
import { useScheduleDoneStore } from '../../store/useScheduleDoneStore'
import { todosForDate } from '../../lib/scheduleTodos'
import { todayISO } from '../../lib/dateUtils'
import { IconEdit } from '../ui/Icons'

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly']

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function dateLabel(iso) {
  const d = new Date(iso + 'T00:00:00')
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()} · ${DAY_SHORT[d.getDay()]}`
}

export function GoalsCard() {
  const { goals, toggleTodo, deleteTodo, replacePeriod } = useGoalsStore()
  const { viewDate } = useDashboard()
  const todayStr = todayISO()
  const isViewingPast = viewDate !== todayStr
  const recurring = useScheduleStore(s => s.recurring)
  const oneoffs = useScheduleStore(s => s.oneoffs)
  const done = useScheduleDoneStore(s => s.done)
  const toggleScheduleDone = useScheduleDoneStore(s => s.toggle)
  const [period, setPeriod] = useState('daily')

  const [editOpen, setEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editTodos, setEditTodos] = useState([])
  const [addText, setAddText] = useState('')
  const addInputRef = useRef(null)

  const today = todayISO()

  const scheduleTodos = useMemo(
    () => period === 'daily' ? todosForDate(today, { recurring, oneoffs }) : [],
    [period, today, recurring, oneoffs]
  )
  const scheduleDoneCount = scheduleTodos.filter(st => done[today]?.[st.key]).length

  const storeData = goals[period]
  const hasGoals = (storeData?.todos?.length ?? 0) > 0 || !!storeData?.title
  const goalTitle = storeData?.title || ''
  const goalTasks = storeData?.todos || []
  const goalDone = goalTasks.filter(t => t.done).length
  const totalCount = goalTasks.length + scheduleTodos.length
  const totalDone = goalDone + scheduleDoneCount

  function openEdit() {
    const defaultTitle = period === 'daily' && !storeData?.title ? dateLabel(todayStr) : (storeData?.title || '')
    setEditTitle(defaultTitle)
    setEditTodos(storeData?.todos ? [...storeData.todos] : [])
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

  function handleAddKeyDown(e) {
    if (e.key === 'Enter') handleAddTodo()
  }

  function handleRemoveEditTodo(id) {
    setEditTodos(prev => prev.filter(t => t.id !== id))
  }

  function handleDeleteClick(task) {
    if (hasGoals) deleteTodo(period, task.id)
  }

  if (isViewingPast) {
    // Goals are not stored per date — show today's goals with a disclosure banner.
    const todayGoal = goals[period]
    const todayTasks = todayGoal?.todos ?? []
    const todayDone = todayTasks.filter(t => t.done).length
    const todayTitle = todayGoal?.title || ''

    return (
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
          </div>
        </div>

        <div style={{
          fontSize: 11, color: 'var(--text-mid)',
          background: 'var(--faint)', border: '1px solid var(--border)',
          borderRadius: 5, padding: '5px 8px', marginBottom: 10,
        }}>
          Current goals — historical goal data is not stored.
        </div>

        <div className="row between" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{todayTitle || '—'}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
            {todayDone} / {todayTasks.length} done
          </div>
        </div>

        <div className="col" style={{ gap: 0 }}>
          {todayTasks.slice(0, 6).map(t => (
            <div key={t.id} className={'todo' + (t.done ? ' done' : '')}>
              <div className="chk" style={{ pointerEvents: 'none' }}></div>
              <div className="lbl">{t.text}</div>
            </div>
          ))}
          {todayTasks.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 4px' }}>No goals set.</div>
          )}
        </div>

        {todayTasks.length > 0 && (
          <div style={{ marginTop: 12, height: 3, background: 'var(--faint)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              width: `${(todayDone / todayTasks.length) * 100}%`,
              height: '100%',
              background: 'var(--accent)',
              transition: 'width 300ms',
            }} />
          </div>
        )}
      </div>
    )
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
            <button className="btn icon" onClick={openEdit} title="Edit goals">
              <IconEdit size={13} />
            </button>
          </div>
        </div>

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
              onClick={() => hasGoals && toggleTodo(period, t.id)}
            >
              <div className="chk"></div>
              <div className="lbl">{t.text}</div>
              {hasGoals && (
                <div
                  className="x"
                  style={{ color: 'var(--negative)', fontSize: 16 }}
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(t) }}
                >
                  ×
                </div>
              )}
            </div>
          ))}
          {totalCount === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 4px' }}>
              No goals yet.{' '}
              <button className="btn ghost sm" style={{ padding: '2px 6px' }} onClick={openEdit}>
                Add one
              </button>
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <div style={{ marginTop: 12, height: 3, background: 'var(--faint)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              width: `${(totalDone / totalCount) * 100}%`,
              height: '100%',
              background: 'var(--accent)',
              transition: 'width 300ms',
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
                    <div className="chk" style={{ pointerEvents: 'none' }}></div>
                    <div className="lbl">{t.text}</div>
                    <div
                      className="x"
                      style={{ color: 'var(--negative)', fontSize: 16, opacity: 1 }}
                      onClick={() => handleRemoveEditTodo(t.id)}
                    >
                      ×
                    </div>
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
                onKeyDown={handleAddKeyDown}
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
