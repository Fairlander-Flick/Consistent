import { useState, useRef, useEffect, useCallback } from 'react'
import { useLifelongStore } from '../../store/useLifelongStore'
import { IconPlus, IconTrash, IconCheck } from '../ui/Icons'
import {
  isMeasurable, itemPct, progressSummary, goalAvgPct,
} from '../../lib/lifelongProgress'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOT_THRESHOLD = 24 // items with a small total render as fill-dots

function monthYear(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function fmtRate(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

// ── A single trackable item (book / playlist / habit) ───────
function ItemRow({ goal, item, store }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(item.current ?? 0))
  const [confirming, setConfirming] = useState(false)
  // Focus the input as soon as it mounts (when the log box opens), without an
  // effect-as-event-handler.
  const focusInput = useCallback(el => { if (el) { el.focus(); el.select() } }, [])

  const measurable = isMeasurable(item)
  const useDots = measurable && item.total <= DOT_THRESHOLD
  const pct = itemPct(item)
  const { pace, eta, needed, behind } = progressSummary(item)

  const save = () => {
    store.logProgress(goal.id, item.id, draft)
    setEditing(false)
  }

  let chip = null
  if (measurable) {
    if (behind && needed != null && Number.isFinite(needed)) {
      chip = <span className="ll-chip warn">{fmtRate(needed)} {item.unit || 'u'}/day to hit deadline</span>
    } else if (pace != null && eta) {
      chip = <span className="ll-chip">+{fmtRate(pace)} {item.unit || 'u'}/day · ETA {monthYear(eta)}</span>
    } else if (pace != null) {
      chip = <span className="ll-chip">+{fmtRate(pace)} {item.unit || 'u'}/day</span>
    } else {
      chip = <span className="ll-chip">log twice to project pace</span>
    }
  }

  return (
    <div className="ll-item">
      <div className="ll-item-top">
        <div className="ll-item-name">{item.title}</div>
        {measurable ? (
          <div className="ll-frac">
            <b>{item.current ?? 0}</b> / {item.total}{item.unit && useDots ? ` ${item.unit}` : ''} · {Math.round(pct * 100)}%
          </div>
        ) : (
          <div className="ll-frac dim">habit</div>
        )}
      </div>

      {measurable && (useDots ? (
        <div className="ll-dots">
          {Array.from({ length: item.total }, (_, i) => (
            <button
              key={`${item.id}:slot${i + 1}`}
              type="button"
              className={'ll-dot' + (i < (item.current ?? 0) ? ' on' : '')}
              onClick={() => store.logProgress(goal.id, item.id, i + 1)}
              title={`Set to ${i + 1}`}
            />
          ))}
        </div>
      ) : (
        <div className="ll-bar"><i style={{ width: `${Math.round(pct * 100)}%` }} /></div>
      ))}

      {measurable && (
        <div className="ll-item-foot">
          {chip}
          {useDots ? (
            <button className="ll-log" onClick={() => store.bumpProgress(goal.id, item.id, 1)}>+1</button>
          ) : (
            <button className="ll-log" onClick={() => { setDraft(String(item.current ?? 0)); setEditing(true) }}>Log</button>
          )}
        </div>
      )}

      {editing && !useDots && (
        <div className="ll-logbox">
          <label>Where are you now?{item.unit ? ` (${item.unit})` : ''}</label>
          <div className="ll-logrow">
            <input
              ref={focusInput}
              type="number"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            />
            <span className="ll-of">/ {item.total}</span>
            <button className="btn primary sm" onClick={save}>Save</button>
            <button className="btn ghost sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="ll-acts">
        <button className="btn ghost sm" title="Mark this sub-goal complete"
                onClick={() => setConfirming(true)}>
          <IconCheck size={12} /> Complete
        </button>
        <button className="btn ghost icon" style={{ marginLeft: 'auto' }} title="Delete item"
                onClick={() => store.deleteItem(goal.id, item.id)}>
          <IconTrash size={12} />
        </button>
      </div>

      {confirming && (
        <div className="modal-overlay" onClick={() => setConfirming(false)}>
          <div className="modal" style={{ width: 300 }} onClick={e => e.stopPropagation()}>
            <h4>Complete sub-goal?</h4>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', margin: '6px 0 16px', lineHeight: 1.5 }}>
              Mark <strong>{item.title}</strong> as finished? It moves to the Planner's Completed list.
            </p>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="btn primary" onClick={() => { store.setItemDone(goal.id, item.id, true); setConfirming(false) }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Goal menu (complete / restore / delete) ─────────────────
function GoalMenu({ isDone, onComplete, onRestore, onDelete }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onOutside)
    // The menu is fixed-positioned, so close it if the page scrolls or resizes
    // (it would otherwise float away from its button).
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  // Anchor the dropdown to the button via fixed coordinates so it escapes the
  // pursuit card's overflow clipping and the Lifelong scroll container.
  const toggle = (e) => {
    e.stopPropagation()
    if (open) { setOpen(false); return }
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) })
    setOpen(true)
  }

  return (
    <div ref={ref} style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
      <button type="button" className="btn ghost sm" style={{ fontSize: 16, padding: '0 5px', color: 'var(--muted)', letterSpacing: 1 }}
              onClick={toggle} title="Options">···</button>
      {open && pos && (
        <div className="ll-menu" style={{ position: 'fixed', top: pos.top, right: pos.right }}>
          {isDone
            ? <button type="button" onClick={() => { onRestore(); setOpen(false) }}>Restore</button>
            : <button type="button" onClick={() => { onComplete(); setOpen(false) }}>Complete</button>}
          <button type="button" style={{ color: 'var(--negative)' }} onClick={() => { onDelete(); setOpen(false) }}>Delete</button>
        </div>
      )}
    </div>
  )
}

// ── A pursuit (category) ────────────────────────────────────
function GoalBlock({ goal, store }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('pages')
  const [total, setTotal] = useState('')

  const avg = goalAvgPct(goal)
  const ringPct = avg != null ? Math.round(avg * 100) : 0

  const handleAdd = () => {
    const t = name.trim()
    if (!t) return
    store.addItem(goal.id, { title: t, unit: unit.trim() || null, total })
    setName(''); setTotal(''); setAdding(false)
  }

  return (
    <div className={'ll-cat' + (goal.collapsed ? '' : ' open') + (goal.done ? ' done' : '')}>
      <div className="ll-cat-h" onClick={() => store.toggleCollapsed(goal.id)}>
        <span className="ll-chev" />
        <span className="ll-cat-title">{goal.title}</span>
        <span className="ll-cat-cnt">
          {goal.items.length} {goal.items.length === 1 ? 'item' : 'items'}
          {goal.deadline ? ` · ${monthYear(goal.deadline)}` : ''}
        </span>
        {avg != null && (
          <span className="ll-ring" style={{ '--p': ringPct }}><i>{ringPct}%</i></span>
        )}
        <GoalMenu
          isDone={goal.done}
          onComplete={() => store.markGoalDone(goal.id)}
          onRestore={() => store.restoreGoal(goal.id)}
          onDelete={() => store.deleteGoal(goal.id)}
        />
      </div>

      {!goal.collapsed && !goal.done && (
        <div className="ll-cat-body">
          {goal.items.filter(it => !it.done).map(item => (
            <ItemRow key={item.id} goal={goal} item={item} store={store} />
          ))}

          {adding ? (
            <div className="ll-additem-form">
              <input className="input" placeholder="Title (e.g. Rogawski — Calculus)" value={name} autoFocus
                     onChange={e => setName(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              <div className="row" style={{ gap: 6 }}>
                <input className="input" placeholder="unit" value={unit} style={{ width: 80 }}
                       onChange={e => setUnit(e.target.value)} />
                <input className="input" type="number" placeholder="total" value={total} style={{ width: 90 }}
                       onChange={e => setTotal(e.target.value)} />
                <button className="btn primary sm" onClick={handleAdd}>Add</button>
                <button className="btn ghost sm" onClick={() => setAdding(false)}>Cancel</button>
              </div>
              <div className="ll-hint">Leave total empty for a habit (day-scheduled, no progress).</div>
            </div>
          ) : (
            <div className="ll-additem" onClick={() => setAdding(true)}>
              <span>+</span> add book / video / habit
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Card ────────────────────────────────────────────────────
export function LifelongGoalsCard() {
  const store = useLifelongStore()
  const { goals } = store

  const [addingGoal, setAddingGoal] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  let avgSum = 0
  let avgCount = 0
  let pursuits = 0
  for (const g of goals) {
    if (g.done) continue
    pursuits++
    const p = goalAvgPct(g)
    if (p != null) { avgSum += p; avgCount++ }
  }
  const avg = avgCount ? Math.round((avgSum / avgCount) * 100) : null

  const handleAddGoal = () => {
    const t = newTitle.trim()
    if (!t) return
    store.addGoal(t, null)
    setNewTitle(''); setAddingGoal(false)
  }

  return (
    <div className="card area-life">
      <div className="card-h">
        <h3>Lifelong Goals</h3>
        <span className="meta">
          {pursuits} {pursuits === 1 ? 'pursuit' : 'pursuits'}{avg != null ? ` · ${avg}% avg` : ''}
        </span>
      </div>

      <div className="ll-scroll">
        {goals.map(goal => (
          <GoalBlock key={goal.id} goal={goal} store={store} />
        ))}
      </div>

      {addingGoal ? (
        <div className="ll-addgoal">
          <input className="input" placeholder="Pursuit (e.g. Math, Reading, Fitness)" value={newTitle} autoFocus
                 onChange={e => setNewTitle(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleAddGoal()} />
          <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn primary sm" onClick={handleAddGoal}>Add</button>
            <button className="btn ghost sm" onClick={() => setAddingGoal(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="ll-addcat" onClick={() => setAddingGoal(true)}>
          <IconPlus size={13} /> new pursuit
        </div>
      )}
    </div>
  )
}
