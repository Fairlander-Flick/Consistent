import { useState, useRef } from 'react'
import { convertLosesData } from '../../lib/lifelongTree'
import { Modal, useShake, useHoverSpring } from '../ui/transitions'

// Full editor for one node: rename, change type (convert), edit measure fields,
// and set a deadline. Used from Manage mode.
const KINDS = [
  { k: 'category', label: 'Category', hint: 'holds sub-goals', fields: [] },
  { k: 'book', label: 'Book', hint: 'pages', fields: ['unit', 'total'] },
  { k: 'playlist', label: 'Video list', hint: 'episodes', fields: ['total'] },
  { k: 'task', label: 'Task', hint: 'done / not done', fields: [] },
  { k: 'checklist', label: 'Checklist', hint: 'inline items', fields: [] },
  { k: 'habit', label: 'Habit', hint: 'weekly', fields: ['perWeek'] },
  { k: 'custom', label: 'Custom', hint: 'unit + total', fields: ['unit', 'total'] },
]

function kindKey(node) {
  return node.kind == null ? 'category' : node.kind
}

export function NodeEditModal({ node, store, onClose }) {
  const [title, setTitle] = useState(node.title || '')
  const [kind, setKind] = useState(kindKey(node))
  const [unit, setUnit] = useState(node.unit || 'pages')
  const [total, setTotal] = useState(node.total ?? '')
  const [perWeek, setPerWeek] = useState(node.perWeek ?? '')
  const [deadline, setDeadline] = useState(node.deadline || '')

  const tmpl = KINDS.find(t => t.k === kind) || KINDS[0]
  const fields = tmpl.fields
  const kindChanged = kind !== kindKey(node)
  const willLose = kindChanged && convertLosesData(node, kind)

  const kindsRef = useRef(null)
  const { inputRef, trigger } = useShake()
  useHoverSpring(kindsRef)

  function save(close) {
    if (!title.trim()) { trigger(); return }
    if (kindChanged) store.convertNode(node.id, kind)
    store.updateNode(node.id, {
      title: title.trim(),
      unit: fields.includes('unit') ? unit : (kind === 'playlist' ? 'episodes' : null),
      total: fields.includes('total') ? (total === '' ? null : Number(total)) : null,
      perWeek: fields.includes('perWeek') ? (perWeek === '' ? null : Number(perWeek)) : null,
      deadline: deadline || null,
    })
    close()
  }

  return (
    <Modal onClose={onClose} width={380}>
      {close => (
        <>
          <h4>Edit</h4>

          <div style={{ marginBottom: 14 }}>
            <div className="mng-field-l">Title</div>
            <input ref={inputRef} className="input t-input" style={{ width: '100%', boxSizing: 'border-box' }}
              autoFocus value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save(close)} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div className="mng-field-l">Type</div>
            <div className="gl-kinds" ref={kindsRef}>
              {KINDS.map(t => (
                <button key={t.k} className={'gl-kind t-avatar' + (kind === t.k ? ' on' : '')} onClick={() => setKind(t.k)}>
                  <span className="gl-kind-l">{t.label}</span>
                  <span className="gl-kind-h">{t.hint}</span>
                </button>
              ))}
            </div>
            {willLose && (
              <div className="mng-warn">Changing type clears logged progress / checklist on this item.</div>
            )}
          </div>

          {(fields.includes('unit') || fields.includes('total') || fields.includes('perWeek')) && (
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {fields.includes('unit') && (
                <input className="input" placeholder="unit" value={unit} style={{ width: 100 }}
                  onChange={e => setUnit(e.target.value)} />
              )}
              {fields.includes('total') && (
                <input className="input" type="number" placeholder="total" value={total} style={{ width: 110 }}
                  onChange={e => setTotal(e.target.value)} />
              )}
              {fields.includes('perWeek') && (
                <input className="input" type="number" placeholder="×/week" value={perWeek} style={{ width: 110 }}
                  onChange={e => setPerWeek(e.target.value)} />
              )}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div className="mng-field-l">Deadline (optional)</div>
            <input className="input" type="date" value={deadline}
              onChange={e => setDeadline(e.target.value)} style={{ width: 'auto' }} />
            {deadline && (
              <button className="btn ghost sm" style={{ marginLeft: 8 }} onClick={() => setDeadline('')}>Clear</button>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn ghost" onClick={close}>Cancel</button>
            <button className="btn primary" onClick={() => save(close)}>Save</button>
          </div>
        </>
      )}
    </Modal>
  )
}
