import { useState, useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { nodePct, isCategory } from '../../lib/lifelongProgress'
import { IconSwap, PopNumber, readMs } from '../ui/transitions'

const INDENT = 24

// One row in the Manage tree: drag handle, collapse chevron, progress ring,
// title, multi-select checkbox, and a ⋯ menu exposing every structural action.
export function ManageRow({ row, store, depth, selected, onToggleSelect, onAction, ghostDepth }) {
  const { node } = row
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id })
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuClosing, setMenuClosing] = useState(false)
  const menuRef = useRef(null)

  function closeMenu() {
    setMenuOpen(false)
    setMenuClosing(true)
    setTimeout(() => setMenuClosing(false), readMs('--dropdown-close-dur', 150))
  }

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = e => { if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu() }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const category = isCategory(node)
  const pct = nodePct(node)
  const pctTxt = pct != null ? `${Math.round(pct * 100)}%` : '—'
  const indent = (ghostDepth ?? depth) * INDENT

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginLeft: indent,
  }

  function act(action) { closeMenu(); onAction(action, node) }

  return (
    <div ref={setNodeRef} style={style} className={'mng-row' + (selected ? ' sel' : '')}>
      <button type="button" className="mng-handle" {...attributes} {...listeners} title="Drag to move" aria-label="Drag to move">⠿</button>

      {node.children?.length ? (
        <button type="button" className="mng-chev" onClick={() => store.toggleCollapsed(node.id)}
          title={node.collapsed ? 'Expand' : 'Collapse'}>
          <IconSwap state={node.collapsed ? 'b' : 'a'} a={<span>▾</span>} b={<span>▸</span>} />
        </button>
      ) : <span className="mng-chev-spacer" />}

      <input type="checkbox" className="mng-check" checked={selected}
        onChange={() => onToggleSelect(node.id)} aria-label="Select row" />

      <span className="mng-ring" style={{ '--p': pct != null ? Math.round(pct * 100) : 0 }}>
        <i>{pct != null ? <PopNumber value={Math.round(pct * 100)} /> : '·'}</i>
      </span>

      <div className="mng-main">
        <span className="mng-title">{node.title}</span>
        <span className="mng-sub">
          {category ? `${node.children.length} sub · ${pctTxt}` : (node.kind || 'item')}
        </span>
      </div>

      <div className="mng-menu-wrap" ref={menuRef}>
        <button type="button" className="mng-more" onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))} aria-label="Actions">⋯</button>
        <div className={'mng-menu t-dropdown' + (menuOpen ? ' is-open' : '') + (menuClosing ? ' is-closing' : '')}
          data-origin="top-right">
          <button type="button" onClick={() => act('edit')}>Edit / rename</button>
          <button type="button" onClick={() => act('move')}>Move to…</button>
          <button type="button" onClick={() => act('indent')}>Indent</button>
          <button type="button" onClick={() => act('outdent')}>Outdent</button>
          {node.children?.length > 0 && <button type="button" onClick={() => act('ungroup')}>Ungroup</button>}
          <button type="button" onClick={() => act('duplicate')}>Duplicate</button>
          <button type="button" className="danger" onClick={() => act('delete')}>Delete</button>
        </div>
      </div>
    </div>
  )
}
