import { useState, useMemo } from 'react'
import {
  DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { flattenVisible, findNode } from '../../lib/lifelongTree'
import { removeSubtree, computeDrop } from '../../lib/dndProjection'
import { useToastStore } from '../../store/useToastStore'
import { ManageRow } from './ManageRow'
import { NodeEditModal } from './NodeEditModal'
import { MoveToModal } from './MoveToModal'
import { Modal } from '../ui/transitions'

const INDENT = 24

// Manage mode: the whole pursuits tree on one screen, with drag-to-reparent,
// multi-select bulk actions, and a per-row ⋯ menu covering every operation.
export function ManageTree({ store }) {
  const nodes = store.nodes
  const rows = useMemo(() => flattenVisible(nodes), [nodes])

  const [activeId, setActiveId] = useState(null)
  const [projection, setProjection] = useState(null) // { depth, parentId, index }
  const [selected, setSelected] = useState(() => new Set())
  const [editId, setEditId] = useState(null)
  const [moveId, setMoveId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // node pending delete
  const toast = useToastStore(s => s.show)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  // Flat list with the dragged subtree removed — what the projection works on.
  const flatForDrag = useMemo(
    () => (activeId ? removeSubtree(rows, activeId) : rows),
    [rows, activeId],
  )

  function onDragStart(e) {
    setActiveId(e.active.id)
    setSelected(new Set())
  }

  function onDragMove(e) {
    if (!e.over) return
    const offsetX = e.delta?.x ?? 0
    setProjection(computeDrop(flatForDrag, e.active.id, e.over.id, offsetX, INDENT))
  }

  function onDragEnd(e) {
    const drop = e.over
      ? computeDrop(flatForDrag, e.active.id, e.over.id, e.delta?.x ?? 0, INDENT)
      : null
    if (drop) {
      store.moveNode(e.active.id, drop.parentId, drop.index)
      withUndo('Moved')
    }
    setActiveId(null)
    setProjection(null)
  }

  function onDragCancel() { setActiveId(null); setProjection(null) }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function withUndo(label) { toast(label, { actionLabel: 'Undo', onAction: store.undo }) }

  function handleAction(action, node) {
    switch (action) {
      case 'edit': setEditId(node.id); break
      case 'move': setMoveId(node.id); break
      case 'indent': store.indentNode(node.id); withUndo('Indented'); break
      case 'outdent': store.outdentNode(node.id); withUndo('Outdented'); break
      case 'ungroup': store.ungroupNode(node.id); withUndo('Ungrouped'); break
      case 'duplicate': store.duplicateNode(node.id); withUndo('Duplicated'); break
      case 'delete':
        if (node.children?.length) setConfirmDelete(node)
        else { store.deleteNode(node.id); withUndo('Deleted') }
        break
      default: break
    }
  }

  // Bulk actions on the current selection.
  const selectedIds = [...selected]
  function bulkGroup() {
    store.groupNodes(selectedIds, 'New group')
    setSelected(new Set()); withUndo('Grouped')
  }
  function bulkDelete() {
    store.deleteMany(selectedIds)
    setSelected(new Set()); withUndo('Deleted')
  }

  const editNode = editId ? findNode(nodes, editId) : null
  const moveNodeObj = moveId ? findNode(nodes, moveId) : null
  const canGroup = selectedIds.length >= 2

  return (
    <>
      {selectedIds.length > 0 && (
        <div className="mng-bulkbar">
          <span>{selectedIds.length} selected</span>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn sm" disabled={!canGroup} onClick={bulkGroup}>Group</button>
            <button type="button" className="btn sm danger" onClick={bulkDelete}>Delete</button>
            <button type="button" className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="gl-empty">No pursuits yet. Switch to Browse to add your first one.</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <div className="mng-list">
              {rows.map(row => (
                <ManageRow
                  key={row.id}
                  row={row}
                  depth={row.depth}
                  ghostDepth={activeId === row.id && projection ? projection.depth : undefined}
                  store={store}
                  selected={selected.has(row.id)}
                  onToggleSelect={toggleSelect}
                  onAction={handleAction}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editNode && <NodeEditModal node={editNode} store={store} onClose={() => setEditId(null)} />}
      {moveNodeObj && <MoveToModal node={moveNodeObj} nodes={nodes} store={store} onClose={() => setMoveId(null)} />}

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          {close => (
            <>
              <h4>Delete “{confirmDelete.title}”?</h4>
              <p>This also removes its {countDescendants(confirmDelete)} nested item(s). You can undo right after.</p>
              <div className="modal-footer">
                <button type="button" className="btn ghost" onClick={close}>Cancel</button>
                <button type="button" className="btn primary" style={{ background: 'var(--negative)', borderColor: 'var(--negative)' }}
                  onClick={() => { store.deleteNode(confirmDelete.id); withUndo('Deleted'); close() }}>
                  Delete
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}

function countDescendants(node) {
  let n = 0
  for (const c of node.children || []) n += 1 + countDescendants(c)
  return n
}
