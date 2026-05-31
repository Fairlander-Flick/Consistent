import { isDescendant } from '../../lib/lifelongTree'
import { Modal } from '../ui/transitions'

// One selectable row in the move picker. Hoisted to module scope so it isn't
// redefined (and remounted, losing state) on every render of the modal.
function MoveRow({ n, depth, nodes, excludeId, onPick }) {
  const invalid = isDescendant(nodes, excludeId, n.id)
  return (
    <>
      <button
        type="button"
        className="mng-pick"
        style={{ paddingLeft: 12 + depth * 16 }}
        disabled={invalid}
        onClick={() => onPick(n.id)}
      >
        <span>{n.children?.length ? '▸' : '·'} {n.title}</span>
        {invalid && <span className="mng-pick-tag">can’t move here</span>}
      </button>
      {(n.children || []).map(c => (
        <MoveRow key={c.id} n={c} depth={depth + 1} nodes={nodes} excludeId={excludeId} onPick={onPick} />
      ))}
    </>
  )
}

// Tree picker for "Move to…": choose a new parent (or top level) for `node`.
// The drag-free path — primary on mobile. Invalid targets (the node itself or
// anything in its subtree) are disabled.
export function MoveToModal({ node, nodes, store, onClose }) {
  return (
    <Modal onClose={onClose} width={360}>
      {close => {
        const pick = (parentId) => { store.moveNode(node.id, parentId, null); close() }

        return (
          <>
            <h4>Move “{node.title}” to…</h4>
            <div className="mng-picklist">
              <button type="button" className="mng-pick" onClick={() => pick(null)}>⌂ Top level</button>
              {nodes.map(n => <MoveRow key={n.id} n={n} depth={0} nodes={nodes} excludeId={node.id} onPick={pick} />)}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn ghost" onClick={close}>Cancel</button>
            </div>
          </>
        )
      }}
    </Modal>
  )
}
