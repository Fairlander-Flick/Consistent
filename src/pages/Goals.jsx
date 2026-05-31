import { useState } from 'react'
import { useLifelongStore, findNode, nodePath } from '../store/useLifelongStore'
import {
  nodePct, isCategory, nodeDone, progressSummary,
} from '../lib/lifelongProgress'
import { IconPlus, IconTrash, IconCheck, IconChevRight } from '../components/ui/Icons'

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

  // The focused node may have been deleted — fall back to the root level.
  const focused = currentId ? findNode(nodes, currentId) : null
  const path = focused ? nodePath(nodes, currentId) : []
  const children = focused ? (focused.children || []) : nodes
  const showLeafControls = focused && !isCategory(focused) && focused.kind != null

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Goals</h1>
          <div className="sub" style={{ marginTop: 4 }}>
            Your lifelong pursuits — nest them as deep as you like.
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="gl-crumb">
        <button className={'gl-crumb-link' + (currentId ? '' : ' here')} onClick={() => setCurrentId(null)}>
          All pursuits
        </button>
        {path.map((n, i) => (
          <span key={n.id} className="gl-crumb-seg">
            <span className="gl-crumb-sep">›</span>
            <button
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

      {/* Children of the focused node (or root pursuits) */}
      <div className="gl-list">
        {children.map(node => (
          <NodeRow key={node.id} node={node} store={store} onOpen={() => setCurrentId(node.id)} />
        ))}
        {children.length === 0 && !showLeafControls && (
          <div className="gl-empty">Nothing here yet — add the first {focused ? 'sub-goal' : 'pursuit'}.</div>
        )}
      </div>

      <AddNode parentId={currentId} store={store} isRoot={!focused} />
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

  return (
    <div className={'gl-row' + (done ? ' done' : '')}>
      {quickTask ? (
        <button
          className={'todo-chk' + (node.done ? ' on' : '')}
          onClick={() => store.toggleTask(node.id)}
          title="Toggle done"
        >
          {node.done && <IconCheck size={11} />}
        </button>
      ) : (
        <span className="gl-row-ring" style={{ '--p': pct != null ? Math.round(pct * 100) : 0 }}>
          <i>{pct != null ? Math.round(pct * 100) : '·'}</i>
        </span>
      )}

      <button className="gl-row-main" onClick={onOpen}>
        <span className="gl-row-title">{node.title}</span>
        <span className="gl-row-sub">
          {category
            ? `${node.children.length} sub-goal${node.children.length === 1 ? '' : 's'} · ${pctTxt}`
            : kindLabel(node)}
        </span>
      </button>

      {!quickTask && <span className="gl-row-pct mono" style={{ '--p': pct != null ? Math.round(pct * 100) : 0 }}>{pctTxt}</span>}
      <button className="btn ghost icon" title="Open" onClick={onOpen}><IconChevRight size={14} /></button>
      <button className="btn ghost icon" title="Delete" onClick={() => store.deleteNode(node.id)}>
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

  return (
    <div className="card gl-detail">
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
              onClick={() => store.logProgress(node.id, i + 1)} title={`Set to ${i + 1}`} />
          ))}
        </div>
      ) : (
        <>
          <div className="ll-bar" style={{ marginBottom: 10, '--p': Math.round((pct || 0) * 100) }}>
            <i style={{ width: `${Math.round((pct || 0) * 100)}%` }} />
          </div>
          <MeasuredFoot node={node} />
          {logging ? (
            <div className="ll-logrow" style={{ marginTop: 10 }}>
              <input className="input" type="number" autoFocus value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { store.logProgress(node.id, draft); setLogging(false) }
                  if (e.key === 'Escape') setLogging(false)
                }} />
              <span className="ll-of">/ {node.total}</span>
              <button className="btn primary sm" onClick={() => { store.logProgress(node.id, draft); setLogging(false) }}>Save</button>
              <button className="btn ghost sm" onClick={() => setLogging(false)}>Cancel</button>
            </div>
          ) : (
            <button className="btn sm" style={{ marginTop: 10 }}
              onClick={() => { setDraft(String(node.current ?? 0)); setLogging(true) }}>Log progress</button>
          )}
        </>
      ))}

      {/* playlist with a +1 affordance even when using dots */}
      {node.kind === 'playlist' && !useDots && measurable && (
        <button className="btn sm" style={{ marginTop: 8 }} onClick={() => store.bumpProgress(node.id, 1)}>+1 watched</button>
      )}

      {/* task */}
      {node.kind === 'task' && (
        <button className={'btn' + (node.done ? '' : ' primary')} onClick={() => store.toggleTask(node.id)}>
          {node.done ? 'Mark not done' : 'Mark done'}
        </button>
      )}

      {/* checklist */}
      {node.kind === 'checklist' && (
        <div className="col" style={{ gap: 0 }}>
          {(node.checklist || []).map(it => (
            <div key={it.id} className={'todo' + (it.done ? ' done' : '')} onClick={() => store.toggleChecklistItem(node.id, it.id)}>
              <div className="chk" />
              <div className="lbl">{it.text}</div>
              <div className="x" style={{ color: 'var(--negative)', fontSize: 16 }}
                onClick={e => { e.stopPropagation(); store.deleteChecklistItem(node.id, it.id) }}>×</div>
            </div>
          ))}
          <div className="row" style={{ gap: 6, marginTop: 8 }}>
            <input className="input" placeholder="Add an item…" value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { store.addChecklistItem(node.id, newItem); setNewItem('') } }} />
            <button className="btn primary sm" onClick={() => { if (newItem.trim()) { store.addChecklistItem(node.id, newItem); setNewItem('') } }}>Add</button>
          </div>
        </div>
      )}

      {/* habit cadence */}
      {node.kind === 'habit' && (
        <div className="dim" style={{ fontSize: 13 }}>Target {node.perWeek || '?'}×/week. Pick the days below to schedule it on the Planner.</div>
      )}

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

function DaySchedule({ node, store }) {
  const set = new Set(node.days || [])
  return (
    <div className="gl-days">
      <span className="gl-days-l">Schedule</span>
      {WEEKDAYS.map(d => (
        <button key={d} className={'gl-day' + (set.has(d) ? ' on' : '')}
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

  const tmpl = KINDS.find(t => t.k === kind) || KINDS[0]
  const fields = tmpl.fields || []

  function reset() { setTitle(''); setTotal(''); setPerWeek(''); setOpen(false) }
  function add() {
    if (!title.trim()) return
    store.addNode(parentId, {
      title, kind,
      unit: fields.includes('unit') ? unit : (kind === 'playlist' ? 'episodes' : null),
      total: fields.includes('total') ? total : null,
      perWeek: fields.includes('perWeek') ? perWeek : null,
    })
    reset()
  }

  if (!open) {
    return (
      <button className="gl-add" onClick={() => setOpen(true)}>
        <IconPlus size={14} /> add {isRoot ? 'pursuit' : 'sub-goal'}
      </button>
    )
  }

  return (
    <div className="card gl-addform">
      <div className="gl-kinds">
        {KINDS.map(t => (
          <button key={String(t.k)} className={'gl-kind' + (kind === t.k ? ' on' : '')} onClick={() => setKind(t.k)}>
            <span className="gl-kind-l">{t.label}</span>
            <span className="gl-kind-h">{t.hint}</span>
          </button>
        ))}
      </div>

      <div className="col gap-2" style={{ marginTop: 12 }}>
        <input className="input" autoFocus placeholder={kind === null ? 'Category name (e.g. AI Bachelor)' : 'Title'}
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} />

        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {fields.includes('unit') && (
            <input className="input" placeholder="unit" value={unit} style={{ width: 90 }}
              onChange={e => setUnit(e.target.value)} />
          )}
          {fields.includes('total') && (
            <input className="input" type="number" placeholder="total" value={total} style={{ width: 100 }}
              onChange={e => setTotal(e.target.value)} />
          )}
          {fields.includes('perWeek') && (
            <input className="input" type="number" placeholder="×/week" value={perWeek} style={{ width: 100 }}
              onChange={e => setPerWeek(e.target.value)} />
          )}
          <button className="btn primary sm" onClick={add}>Add</button>
          <button className="btn ghost sm" onClick={reset}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
