import { useState, useRef } from 'react'
import { useLifelongStore, findNode, nodePath } from '../store/useLifelongStore'
import {
  nodePct, isCategory, nodeDone, progressSummary,
} from '../lib/lifelongProgress'
import { IconPlus, IconTrash, IconChevRight } from '../components/ui/Icons'
import { ManageTree } from '../components/goals/ManageTree'
import { TextSwap, PopNumber, SuccessCheck, useShake, useHoverSpring, useTabPill } from '../components/ui/transitions'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOT_THRESHOLD = 24

// Template palette shown when adding a node.
const KINDS = [
  { k: null,        label: 'Category',   hint: 'holds sub-goals' },
  { k: 'book',      label: 'Book',       hint: 'pages', fields: ['unit', 'total'] },
  { k: 'playlist',  label: 'Video list', hint: 'episodes', fields: ['total'] },
  { k: 'task',      label: 'Task',       hint: 'done / not done' },
  { k: 'checklist', label: 'Checklist',  hint: 'inline sub-items' },
  { k: 'habit',     label: 'Habit',      hint: 'weekly', fields: ['perWeek'] },
  { k: 'custom',    label: 'Custom',     hint: 'unit + total', fields: ['unit', 'total'] },
]

function fmtRate(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1) }
function monthYear(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function Goals() {
  const store = useLifelongStore()
  const { nodes } = store
  const [currentId, setCurrentId] = useState(null)
  const [mode, setMode] = useState('browse')

  // The focused node may have been deleted — fall back to the root level.
  const focused = currentId ? findNode(nodes, currentId) : null
  const path = focused ? nodePath(nodes, currentId) : []
  const children = focused ? (focused.children || []) : nodes
  const showLeafControls = focused && !isCategory(focused) && focused.kind != null

  const tabsRef = useRef(null)
  useHoverSpring(tabsRef)
  useTabPill(tabsRef)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Goals</h1>
          <div className="sub" style={{ marginTop: 4 }}>
            <TextSwap>
              {mode === 'manage'
                ? 'Reorganize freely — drag rows, or use the ⋯ menu.'
                : 'Your lifelong pursuits — nest them as deep as you like.'}
            </TextSwap>
          </div>
        </div>
        <div className="tabs" ref={tabsRef}>
          <button type="button" className={'t-avatar' + (mode === 'browse' ? ' active' : '')} onClick={() => setMode('browse')}>Browse</button>
          <button type="button" className={'t-avatar' + (mode === 'manage' ? ' active' : '')} onClick={() => setMode('manage')}>Manage</button>
        </div>
      </div>

      <div key={mode} className={'gl-mode ' + (mode === 'manage' ? 'from-right' : 'from-left')}>
      {mode === 'manage' ? <ManageTree store={store} /> : (
      <>
      {/* Breadcrumb */}
      <div className="gl-crumb">
        <button type="button" className={'gl-crumb-link' + (currentId ? '' : ' here')} onClick={() => setCurrentId(null)}>
          All pursuits
        </button>
        {path.map((n, i) => (
          <span key={n.id} className="gl-crumb-seg">
            <span className="gl-crumb-sep">›</span>
            <button
              type="button"
              className={'gl-crumb-link' + (i === path.length - 1 ? ' here' : '')}
              onClick={() => setCurrentId(n.id)}
            >
              {n.title}
            </button>
          </span>
        ))}
      </div>

      {/* Focused leaf: its own controls (a category instead rolls up children) */}
      {showLeafControls && <LeafDetail key={focused.id} node={focused} store={store} />}

      {/* Focused category: schedule it to recur so it groups on the daily list */}
      {focused && isCategory(focused) && <CategoryDetail key={focused.id} node={focused} store={store} />}

      {/* Children of the focused node (or root pursuits) */}
      <div className="gl-list">
        {children.map(node => (
          <NodeRow key={node.id} node={node} store={store} onOpen={() => setCurrentId(node.id)} />
        ))}
        {children.length === 0 && !showLeafControls && (
          <div className="gl-empty">Nothing here yet. Add the first {focused ? 'sub-goal' : 'pursuit'}.</div>
        )}
      </div>

      <AddNode parentId={currentId} store={store} isRoot={!focused} />
      </>
      )}
      </div>
    </>
  )
}

// ── A row in the current level: drillable, shows rollup/status ───────
function NodeRow({ node, store, onOpen }) {
  const category = isCategory(node)
  const pct = nodePct(node)
  const pctTxt = pct != null ? `${Math.round(pct * 100)}%` : '—'
  const done = nodeDone(node)

  // A task with no children gets an inline checkbox (the common "task-focused"
  // leaf you just tick).
  const quickTask = !category && node.kind === 'task'
  const [confirmDone, setConfirmDone] = useState(false)

  // Ticking an unfinished task asks "Really done?" first; un-ticking is direct.
  function onTaskCheck() {
    if (node.done) { store.toggleTask(node.id); return }
    setConfirmDone(true)
  }

  if (quickTask && confirmDone) {
    return (
      <div className="gl-row">
        <span className="todo-chk" />
        <div className="gl-row-main" style={{ cursor: 'default' }}>
          <span className="gl-row-title">Really done?</span>
          <span className="gl-row-sub">{node.title}</span>
        </div>
        <button type="button" className="btn primary sm" onClick={() => { store.toggleTask(node.id); setConfirmDone(false) }}>Yes, done</button>
        <button type="button" className="btn ghost sm" onClick={() => setConfirmDone(false)}>Not yet</button>
      </div>
    )
  }

  return (
    <div className={'gl-row' + (done ? ' done' : '')}>
      {quickTask ? (
        <button
          type="button"
          className={'todo-chk' + (node.done ? ' on' : '')}
          onClick={onTaskCheck}
          title="Toggle done"
        >
          {node.done && <SuccessCheck size={11} style={{ '--check-y-amount': '10px' }} />}
        </button>
      ) : (
        <span className="gl-row-ring" style={{ '--p': pct != null ? Math.round(pct * 100) : 0 }}>
          <i>{pct != null ? <PopNumber value={Math.round(pct * 100)} /> : '·'}</i>
        </span>
      )}

      <button type="button" className="gl-row-main" onClick={onOpen}>
        <span className="gl-row-title">{node.title}</span>
        <span className="gl-row-sub">
          {category
            ? `${node.children.length} sub-goal${node.children.length === 1 ? '' : 's'} · ${pctTxt}`
            : kindLabel(node)}
        </span>
      </button>

      {!quickTask && <span className="gl-row-pct mono" style={{ '--p': pct != null ? Math.round(pct * 100) : 0 }}><PopNumber value={pctTxt} /></span>}
      <button type="button" className="btn ghost icon" title="Open" onClick={onOpen}><IconChevRight size={14} /></button>
      <button type="button" className="btn ghost icon" title="Delete" onClick={() => store.deleteNode(node.id)}>
        <IconTrash size={13} />
      </button>
    </div>
  )
}

function kindLabel(node) {
  switch (node.kind) {
    case 'book': return `${node.current ?? 0}/${node.total ?? '?'} ${node.unit || 'pages'}`
    case 'playlist': return `${node.current ?? 0}/${node.total ?? '?'} episodes`
    case 'custom': return `${node.current ?? 0}/${node.total ?? '?'} ${node.unit || ''}`.trim()
    case 'checklist': return `${(node.checklist || []).filter(i => i.done).length}/${(node.checklist || []).length} items`
    case 'habit': return `habit · ${node.perWeek || '?'}×/week`
    case 'task': return node.done ? 'done' : 'task'
    default: return 'empty — add sub-goals'
  }
}

// ── Full controls for a focused leaf ─────────────────────────────────
function LeafDetail({ node, store }) {
  const measurable = ['book', 'playlist', 'custom'].includes(node.kind) && node.total > 0
  const useDots = node.kind === 'playlist' && node.total > 0 && node.total <= DOT_THRESHOLD
  const pct = nodePct(node)
  const [logging, setLogging] = useState(false)
  const [draft, setDraft] = useState(String(node.current ?? 0))
  const [newItem, setNewItem] = useState('')
  const [confirmDone, setConfirmDone] = useState(false)

  return (
    <div className="card gl-detail reveal">
      <div className="gl-detail-h">
        <h3>{node.title}</h3>
        <span className="chip">{kindLabel(node)}</span>
      </div>

      {/* book / playlist / custom */}
      {measurable && (useDots ? (
        <div className="ll-dots">
          {Array.from({ length: node.total }, (_, i) => (
            <button key={i} type="button"
              className={'ll-dot' + (i < (node.current ?? 0) ? ' on' : '')}
              onClick={() => store.logProgress(node.id, i + 1)} title={`Set to ${i + 1}`}
              aria-label={`Set to ${i + 1}`} />
          ))}
        </div>
      ) : (
        <>
          <div className="ll-bar" style={{ marginBottom: 10, '--p': Math.round((pct || 0) * 100) }}>
            <i style={{ width: `${Math.round((pct || 0) * 100)}%` }} />
          </div>
          <MeasuredFoot node={node} />
          {logging ? (
            <div className="ll-logrow reveal" style={{ marginTop: 10 }}>
              <input className="input" type="number" autoFocus value={draft}
                aria-label="Progress value"
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { store.logProgress(node.id, draft); setLogging(false) }
                  if (e.key === 'Escape') setLogging(false)
                }} />
              <span className="ll-of">/ {node.total}</span>
              <button type="button" className="btn primary sm" onClick={() => { store.logProgress(node.id, draft); setLogging(false) }}>Save</button>
              <button type="button" className="btn ghost sm" onClick={() => setLogging(false)}>Cancel</button>
            </div>
          ) : (
            <button type="button" className="btn sm" style={{ marginTop: 10 }}
              onClick={() => { setDraft(String(node.current ?? 0)); setLogging(true) }}>Log progress</button>
          )}
        </>
      ))}

      {/* playlist with a +1 affordance even when using dots */}
      {node.kind === 'playlist' && !useDots && measurable && (
        <button type="button" className="btn sm" style={{ marginTop: 8 }} onClick={() => store.bumpProgress(node.id, 1)}>+1 watched</button>
      )}

      {/* task — marking done asks "Really done?" first */}
      {node.kind === 'task' && (
        node.done ? (
          <button type="button" className="btn" onClick={() => store.toggleTask(node.id)}>
            <TextSwap>Mark not done</TextSwap>
          </button>
        ) : confirmDone ? (
          <div className="ll-logrow reveal" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 13 }}>Really done?</span>
            <button type="button" className="btn primary sm" onClick={() => { store.toggleTask(node.id); setConfirmDone(false) }}>Yes, done</button>
            <button type="button" className="btn ghost sm" onClick={() => setConfirmDone(false)}>Not yet</button>
          </div>
        ) : (
          <button type="button" className="btn primary" onClick={() => setConfirmDone(true)}>
            <TextSwap>Mark done</TextSwap>
          </button>
        )
      )}

      {/* checklist */}
      {node.kind === 'checklist' && (
        <div className="col" style={{ gap: 0 }}>
          {(node.checklist || []).map(it => (
            <div key={it.id} className={'todo' + (it.done ? ' done' : '')} role="button" tabIndex={0}
              onClick={() => store.toggleChecklistItem(node.id, it.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); store.toggleChecklistItem(node.id, it.id) } }}>
              <div className="chk" />
              <div className="lbl">{it.text}</div>
              <button type="button" className="x" aria-label="Delete item"
                style={{ color: 'var(--negative)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={e => { e.stopPropagation(); store.deleteChecklistItem(node.id, it.id) }}>×</button>
            </div>
          ))}
          <div className="row" style={{ gap: 6, marginTop: 8 }}>
            <input className="input" aria-label="Add a checklist item" placeholder="Add an item…" value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { store.addChecklistItem(node.id, newItem); setNewItem('') } }} />
            <button type="button" className="btn primary sm" onClick={() => { if (newItem.trim()) { store.addChecklistItem(node.id, newItem); setNewItem('') } }}>Add</button>
          </div>
        </div>
      )}

      {/* habit cadence */}
      {node.kind === 'habit' && (
        <div className="dim" style={{ fontSize: 13 }}>Target {node.perWeek || '?'}×/week. Pick the days below to schedule it on the Planner.</div>
      )}

      {/* how much time one session eats on an active day — feeds the time budget */}
      <SessionLength node={node} store={store} />

      {/* scheduling — any leaf can surface on planner/daily days */}
      <DaySchedule node={node} store={store} />
    </div>
  )
}

function MeasuredFoot({ node }) {
  const { pace, eta, needed, behind } = progressSummary(node)
  if (behind && needed != null && Number.isFinite(needed)) {
    return <span className="ll-chip warn">{fmtRate(needed)} {node.unit || 'u'}/day to hit deadline</span>
  }
  if (pace != null && eta) return <span className="ll-chip">+{fmtRate(pace)} {node.unit || 'u'}/day · ETA {monthYear(eta)}</span>
  if (pace != null) return <span className="ll-chip">+{fmtRate(pace)} {node.unit || 'u'}/day</span>
  return <span className="ll-chip">log twice to project pace</span>
}

// A focused category can be scheduled to recur. On its days it shows on the
// dashboard daily list as a collapsible group with its sub-tasks nested.
function CategoryDetail({ node, store }) {
  const n = node.children.length
  return (
    <div className="card gl-detail reveal">
      <div className="gl-detail-h">
        <h3>{node.title}</h3>
        <span className="chip">{n} sub-goal{n === 1 ? '' : 's'}</span>
      </div>
      <div className="dim" style={{ fontSize: 13 }}>
        Schedule this group to recur — on the chosen days it shows on your dashboard with its sub-tasks nested.
      </div>
      <DaySchedule node={node} store={store} />
    </div>
  )
}

// Hours one session of this leaf takes on an active day. Editable on the leaf
// itself so you don't have to open the Manage editor.
function SessionLength({ node, store }) {
  return (
    <div className="gl-days" style={{ marginTop: 8 }}>
      <span className="gl-days-l">Time / active day</span>
      <input
        className="input"
        type="number"
        min="0"
        step="0.25"
        aria-label="Session length in hours"
        placeholder="hours"
        value={node.sessionHours ?? ''}
        style={{ width: 90 }}
        onChange={e => store.updateNode(node.id, { sessionHours: e.target.value === '' ? null : Number(e.target.value) })}
      />
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>h</span>
    </div>
  )
}

function DaySchedule({ node, store }) {
  const set = new Set(node.days || [])
  const ref = useRef(null)
  useHoverSpring(ref)
  return (
    <div className="gl-days" ref={ref}>
      <span className="gl-days-l">Schedule</span>
      {WEEKDAYS.map(d => (
        <button type="button" key={d} className={'gl-day t-avatar' + (set.has(d) ? ' on' : '')}
          onClick={() => store.toggleNodeDay(node.id, d)}>{d[0]}</button>
      ))}
    </div>
  )
}

// ── Add a node at the current level ──────────────────────────────────
function AddNode({ parentId, store, isRoot }) {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState(isRoot ? null : 'task')
  const [title, setTitle] = useState('')
  const [unit, setUnit] = useState('pages')
  const [total, setTotal] = useState('')
  const [perWeek, setPerWeek] = useState('')
  const [sessionHours, setSessionHours] = useState('')

  const tmpl = KINDS.find(t => t.k === kind) || KINDS[0]
  const fields = tmpl.fields || []

  const kindsRef = useRef(null)
  const { inputRef, trigger } = useShake()
  useHoverSpring(kindsRef, [open])

  function reset() { setTitle(''); setTotal(''); setPerWeek(''); setSessionHours(''); setOpen(false) }
  function add() {
    if (!title.trim()) { trigger(); return }
    store.addNode(parentId, {
      title, kind,
      unit: fields.includes('unit') ? unit : (kind === 'playlist' ? 'episodes' : null),
      total: fields.includes('total') ? total : null,
      perWeek: fields.includes('perWeek') ? perWeek : null,
      sessionHours: kind === null ? null : sessionHours,
    })
    reset()
  }

  if (!open) {
    return (
      <button type="button" className="gl-add" onClick={() => setOpen(true)}>
        <IconPlus size={14} /> add {isRoot ? 'pursuit' : 'sub-goal'}
      </button>
    )
  }

  return (
    <div className="card gl-addform reveal">
      <div className="gl-kinds" ref={kindsRef}>
        {KINDS.map(t => (
          <button type="button" key={String(t.k)} className={'gl-kind t-avatar' + (kind === t.k ? ' on' : '')} onClick={() => setKind(t.k)}>
            <span className="gl-kind-l">{t.label}</span>
            <span className="gl-kind-h">{t.hint}</span>
          </button>
        ))}
      </div>

      <div className="col gap-2" style={{ marginTop: 12 }}>
        <input ref={inputRef} className="input t-input" autoFocus aria-label="Title"
          placeholder={kind === null ? 'Category name (e.g. AI Bachelor)' : 'Title'}
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} />

        {/* Time one session of this goal takes on an active day — feeds the time budget. */}
        {kind !== null && (
          <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Session length</span>
            <input className="input" type="number" min="0" step="0.25" aria-label="Session length in hours"
              placeholder="hours / active day" value={sessionHours} style={{ width: 150 }}
              onChange={e => setSessionHours(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()} />
          </div>
        )}

        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {fields.includes('unit') && (
            <input className="input" aria-label="Unit" placeholder="unit" value={unit} style={{ width: 90 }}
              onChange={e => setUnit(e.target.value)} />
          )}
          {fields.includes('total') && (
            <input className="input" type="number" aria-label="Total" placeholder="total" value={total} style={{ width: 100 }}
              onChange={e => setTotal(e.target.value)} />
          )}
          {fields.includes('perWeek') && (
            <input className="input" type="number" aria-label="Times per week" placeholder="×/week" value={perWeek} style={{ width: 100 }}
              onChange={e => setPerWeek(e.target.value)} />
          )}
          <button type="button" className="btn primary sm" onClick={add}>Add</button>
          <button type="button" className="btn ghost sm" onClick={reset}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
