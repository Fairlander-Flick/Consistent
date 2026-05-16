import { useState, useRef } from 'react'
import { useGoalsStore } from '../../store/useGoalsStore'
import { DUMMY_GOALS } from '../../lib/dummyData'
import { useDashboard } from '../../lib/DashboardContext'
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
  const [period, setPeriod] = useState('daily')

  const [editOpen, setEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editTodos, setEditTodos] = useState([])
  const [addText, setAddText] = useState('')
  const addInputRef = useRef(null)

  const storeData = goals[period]
  const hasGoals = (storeData?.todos?.length ?? 0) > 0 || storeData?.title
  const goalSet = hasGoals ? storeData : DUMMY_GOALS[period]
  const goalTitle = goalSet?.title || ''
  const goalTasks = goalSet?.todos || []
  const goalDone = goalTasks.filter(t => t.done).length

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
            <span className="meta">{dateLabel(viewDate)}</span>
          </div>
        </div>

        <div className="row between" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{goalTitle || '—'}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
            {goalDone} / {goalTasks.length} done
          </div>
        </div>

        <div className="col" style={{ gap: 0 }}>
          {goalTasks.slice(0, 6).map(t => (
            <div key={t.id} className={'todo' + (t.done ? ' done' : '')}>
              <div className="chk" style={{ pointerEvents: 'none' }}></div>
              <div className="lbl">{t.text}</div>
            </div>
          ))}
          {goalTasks.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 4px' }}>No goals set.</div>
          )}
        </div>

        {goalTasks.length > 0 && (
          <div style={{ marginTop: 12, height: 3, background: 'var(--faint)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              width: `${(goalDone / goalTasks.length) * 100}%`,
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
            {goalDone} / {goalTasks.length} done
          </div>
        </div>

        <div className="col" style={{ gap: 0 }}>
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
          {goalTasks.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 4px' }}>
              No goals yet.{' '}
              <button className="btn ghost sm" style={{ padding: '2px 6px' }} onClick={openEdit}>
                Add one
              </button>
            </div>
          )}
        </div>

        {goalTasks.length > 0 && (
          <div style={{ marginTop: 12, height: 3, background: 'var(--faint)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              width: `${(goalDone / goalTasks.length) * 100}%`,
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
