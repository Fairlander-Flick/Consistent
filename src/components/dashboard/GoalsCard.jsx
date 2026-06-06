import { useState, useRef, useMemo } from 'react'
import { useGoalsStore } from '../../store/useGoalsStore'
import { useDashboard } from '../../lib/DashboardContext'
import { useScheduleDoneStore } from '../../store/useScheduleDoneStore'
import { todayISO, getWeekStart } from '../../lib/dateUtils'
import { IconEdit } from '../ui/Icons'
import { useLifelongStore } from '../../store/useLifelongStore'
import { useDayPlanStore } from '../../store/useDayPlanStore'
import { lifelongTodosForDate } from '../../lib/lifelongTodos'
import { buildGoalsTree, treeCounts } from '../../lib/goalsTree'
import { pursuitColorVar, PLANNER_COLOR } from '../../lib/pursuitColors'
import { CardTitleLink } from './CardTitleLink'
import { Swap, Modal, PopNumber, useTabPill } from '../ui/transitions'

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly']

// Collapsed pursuit roots persist locally (UI preference only — not synced), so
// the tree stays the way you left it across reloads.
const COLLAPSE_KEY = 'consistent:goalsCollapsed'
const MANUAL_ROOT_ID = '__manual_goals__'
const PLANNER_ROOT_ID = '__planner__'
function loadCollapsed() {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY)
    if (raw === null) return new Set([MANUAL_ROOT_ID, PLANNER_ROOT_ID])
    return new Set(JSON.parse(raw))
  }
  catch { return new Set([MANUAL_ROOT_ID, PLANNER_ROOT_ID]) }
}
function saveCollapsed(set) {
  try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...set])) } catch { /* ignore */ }
}

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
  const tabsRef = useRef(null)
  useTabPill(tabsRef)

  // Persisted collapsed state for the pursuit tree roots.
  const [collapsed, setCollapsed] = useState(loadCollapsed)
  const toggleRoot = (rootId) => setCollapsed(prev => {
    const next = new Set(prev)
    if (next.has(rootId)) next.delete(rootId); else next.add(rootId)
    saveCollapsed(next)
    return next
  })

  // Per-day done state for ephemeral daily todos (lifelong-goal steps)
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

  // Lifelong-goal step todos: daily + live + viewing today
  const showSchedule = period === 'daily' && isCurrentPeriod && !isViewingPast
  const lifelongNodes = useLifelongStore(s => s.nodes)
  const toggleTask = useLifelongStore(s => s.toggleTask)
  // Flat scheduled leaves (each carries its ancestor crumb + root id) → rebuild
  // the pursuit tree so the card shows where every task comes from.
  const lifelongLeaves = useMemo(
    () => showSchedule ? lifelongTodosForDate(today, lifelongNodes) : [],
    [showSchedule, today, lifelongNodes]
  )
  const lifelongTree = useMemo(() => buildGoalsTree(lifelongLeaves), [lifelongLeaves])
  const lifelongDoneCount = lifelongLeaves.filter(lt => done[today]?.[lt.key]).length

  // One-off todos planned on the Planner for this day surface here too, kept in
  // sync via the shared day-plan store — toggling here updates the Planner, and
  // vice-versa. Daily period only; reads whatever date the dashboard is viewing.
  const dayPlanByDate = useDayPlanStore(s => s.byDate)
  const toggleDayTodo = useDayPlanStore(s => s.toggleTodo)
  const deleteDayTodo = useDayPlanStore(s => s.deleteTodo)
  const planTodos = period === 'daily' ? (dayPlanByDate[viewDate]?.todos ?? []) : []
  const planDone  = planTodos.filter(t => t.done).length

  const totalCount = goalTasks.length + lifelongLeaves.length + planTodos.length
  const totalDone  = goalDone + lifelongDoneCount + planDone

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
    // Closing (with its exit animation) is handled by the Modal shell's `close`.
    replacePeriod(period, { title: editTitle, todos: editTodos })
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
          <CardTitleLink to="/goals">Goals</CardTitleLink>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <div className="tabs" ref={tabsRef}>
              {PERIODS.map(t => (
                <button type="button" key={t} className={period === t ? 'active' : ''} onClick={() => setPeriod(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {canEdit && (
              <button type="button" className="btn icon" onClick={openEdit} title="Edit goals">
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

        <Swap swapKey={`${period}:${key}`} className="goals-body">
        <div className="row between" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{goalTitle || periodLabel(period, viewDate)}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
            <PopNumber value={totalDone} /> / {totalCount} done
          </div>
        </div>

        <div className="col goals-scroll" style={{ gap: 0 }}>
          {lifelongTree.map(root => (
            <GoalsTreeRoot
              key={'gt-' + root.rootId}
              node={root}
              open={!collapsed.has(root.rootId)}
              onToggle={() => toggleRoot(root.rootId)}
              done={done}
              today={today}
              toggleScheduleDone={toggleScheduleDone}
              toggleTask={toggleTask}
            />
          ))}
          {planTodos.length > 0 && (
            <PlannerRoot
              todos={planTodos}
              open={!collapsed.has(PLANNER_ROOT_ID)}
              onToggle={() => toggleRoot(PLANNER_ROOT_ID)}
              isViewingPast={isViewingPast}
              viewDate={viewDate}
              toggleDayTodo={toggleDayTodo}
              deleteDayTodo={deleteDayTodo}
            />
          )}
          {goalTasks.length > 0 && (
            <ManualGoalsRoot
              title={goalTitle || periodLabel(period, viewDate)}
              tasks={goalTasks.slice(0, 6)}
              open={!collapsed.has(MANUAL_ROOT_ID)}
              onToggle={() => toggleRoot(MANUAL_ROOT_ID)}
              canEdit={canEdit}
              hasGoals={hasGoals}
              toggleTodo={toggleTodo}
              deleteTodo={deleteTodo}
              period={period}
            />
          )}
          {totalCount === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 4px' }}>
              {isViewingPast
                ? 'No goals recorded.'
                : <>No goals yet.{' '}<button type="button" className="btn ghost sm" style={{ padding: '2px 6px' }} onClick={openEdit}>Add one</button></>
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
        </Swap>
      </div>

      {editOpen && (
        <Modal onClose={() => setEditOpen(false)} width={340}>
          {close => (
            <>
              <h4>{period[0].toUpperCase() + period.slice(1)} Goals</h4>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Title</div>
                <input
                  className="input"
                  aria-label="Goal set title"
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
                      <button
                        type="button"
                        className="x"
                        aria-label="Remove task"
                        style={{ color: 'var(--negative)', fontSize: 16, opacity: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => handleRemoveEditTodo(t.id)}
                      >×</button>
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
                  aria-label="Add a task"
                  style={{ flex: 1 }}
                  placeholder="Add a task..."
                  value={addText}
                  onChange={e => setAddText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                />
                <button type="button" className="btn primary sm" onClick={handleAddTodo}>Add</button>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn ghost" onClick={close}>Cancel</button>
                <button type="button" className="btn primary" onClick={() => { handleSave(); close() }}>Save</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}

// Manual goals (added via the edit modal) wrapped in the same collapsible
// root style as the pursuit tree, so they don't appear bare.
function PlannerRoot({ todos, open, onToggle, isViewingPast, viewDate, toggleDayTodo, deleteDayTodo }) {
  const live = !isViewingPast
  const doneCount = todos.filter(t => t.done).length
  return (
    <div className={'gtree-root' + (open ? ' open' : '')}>
      <div
        className="gtree-root-h"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      >
        <span className="gtree-chev" />
        <span className="gtree-root-name">
          <span className="pdot" style={{ background: PLANNER_COLOR }} />
          <span>Planner</span>
        </span>
        <span className="gtree-cnt">{doneCount}/{todos.length}</span>
      </div>
      <div className="gtree-root-body-wrap">
        <div className="gtree-root-body">
          {todos.map(t => (
            <div
              key={'pl-' + t.id}
              className={'todo' + (t.done ? ' done' : '')}
              role="button"
              tabIndex={live ? 0 : -1}
              onClick={() => live && toggleDayTodo(viewDate, t.id)}
              onKeyDown={e => { if (live && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleDayTodo(viewDate, t.id) } }}
              style={{ cursor: live ? 'pointer' : 'default' }}
            >
              <div className="chk" style={{ pointerEvents: live ? undefined : 'none' }} />
              <div className="lbl">{t.text}</div>
              {live && (
                <button
                  type="button"
                  className="x"
                  aria-label="Delete todo"
                  style={{ color: 'var(--negative)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={e => { e.stopPropagation(); deleteDayTodo(viewDate, t.id) }}
                >×</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ManualGoalsRoot({ title, tasks, open, onToggle, canEdit, hasGoals, toggleTodo, deleteTodo, period }) {
  const doneCount = tasks.filter(t => t.done).length
  return (
    <div className={'gtree-root' + (open ? ' open' : '')}>
      <div
        className="gtree-root-h"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      >
        <span className="gtree-chev" />
        <span className="gtree-root-name">
          <span className="pdot" style={{ background: 'var(--text)' }} />
          <span>{title}</span>
        </span>
        <span className="gtree-cnt">{doneCount}/{tasks.length}</span>
      </div>
      <div className="gtree-root-body-wrap">
        <div className="gtree-root-body">
          {tasks.map(t => (
            <div
              key={t.id}
              className={'todo' + (t.done ? ' done' : '')}
              role="button"
              tabIndex={canEdit ? 0 : -1}
              onClick={() => canEdit && hasGoals && toggleTodo(period, t.id)}
              onKeyDown={e => { if (canEdit && hasGoals && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleTodo(period, t.id) } }}
              style={{ cursor: canEdit ? 'pointer' : 'default' }}
            >
              <div className="chk" style={{ pointerEvents: canEdit ? undefined : 'none' }} />
              <div className="lbl">{t.text}</div>
              {canEdit && hasGoals && (
                <button
                  type="button"
                  className="x"
                  aria-label="Delete task"
                  style={{ color: 'var(--negative)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={e => { e.stopPropagation(); deleteTodo(period, t.id) }}
                >×</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// A pursuit root in the Goals tree — collapsible, with a colour dot and a
// done/total count for everything under it. Its branches indent to show the
// path from the root pursuit down to each task ("where it comes from").
function GoalsTreeRoot({ node, open, onToggle, done, today, toggleScheduleDone, toggleTask }) {
  const doneMap = done[today] || {}
  const { total, done: doneN } = treeCounts(node, doneMap)

  return (
    <div className={'gtree-root' + (open ? ' open' : '')}>
      <div
        className="gtree-root-h"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      >
        <span className="gtree-chev" />
        <span className="gtree-root-name">
          <span className="pdot" style={{ background: pursuitColorVar(node.rootId) }} />
          <span>{node.title}</span>
        </span>
        <span className="gtree-cnt">{doneN}/{total}</span>
      </div>
      <div className="gtree-root-body-wrap">
        <div className="gtree-root-body">
          <GoalsTreeBody node={node} done={done} today={today}
            toggleScheduleDone={toggleScheduleDone} toggleTask={toggleTask} />
        </div>
      </div>
    </div>
  )
}

// The leaves directly under a node, then each child branch (label + indent).
function GoalsTreeBody({ node, done, today, toggleScheduleDone, toggleTask }) {
  return (
    <>
      {node.leaves.map(lt => (
        <LifelongTodoRow
          key={'lf-' + lt.key}
          lt={lt}
          ticked={!!done[today]?.[lt.key]}
          onJustToday={() => toggleScheduleDone(today, lt.key)}
          onFullyDone={() => toggleTask(lt.itemId)}
        />
      ))}
      {node.nodes.map(child => (
        <div key={'br-' + child.title} className="gtree-branch">
          <div className="gtree-label">{child.title}</div>
          <GoalsTreeBody node={child} done={done} today={today}
            toggleScheduleDone={toggleScheduleDone} toggleTask={toggleTask} />
        </div>
      ))}
    </>
  )
}

// A scheduled lifelong leaf in the tree. Ticking a TASK asks whether it's fully
// done (→ permanent, leaves every day) or just done for today (→ effort tick,
// comes back on its next scheduled day). Non-task leaves toggle directly. The
// pursuit colour dot ties it back to its root in the tree / Time card.
function LifelongTodoRow({ lt, ticked, onJustToday, onFullyDone }) {
  const [confirm, setConfirm] = useState(false)
  const isTask = lt.kind === 'task'

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

  // A task that hasn't been touched yet → ask; otherwise (non-task, or un-ticking) toggle today's effort.
  const handle = () => { if (isTask && !ticked) setConfirm(true); else onJustToday() }

  return (
    <div
      className={'todo' + (ticked ? ' done' : '')}
      role="button"
      tabIndex={0}
      onClick={handle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle() } }}
      title={`From: ${lt.goalTitle}`}
    >
      <div className="chk"></div>
      <span className="pdot" style={{ background: pursuitColorVar(lt.rootId ?? lt.goalTitle) }} />
      <div className="lbl">{lt.label}</div>
    </div>
  )
}
