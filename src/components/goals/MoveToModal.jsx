import { isDescendant } from '../../lib/lifelongTree'
import { Modal } from '../ui/transitions'

// Tree picker for "Move to…": choose a new parent (or top level) for `node`.
// The drag-free path — primary on mobile. Invalid targets (the node itself or
// anything in its subtree) are disabled.
export function MoveToModal({ node, nodes, store, onClose }) {
  return (
    <Modal onClose={onClose} width={360}>
      {close => {
        const pick = (parentId) => { store.moveNode(node.id, parentId, null); close() }

        const Row = ({ n, depth }) => {
          const invalid = isDescendant(nodes, node.id, n.id)
          return (
            <>
              <button
                className="mng-pick"
                style={{ paddingLeft: 12 + depth * 16 }}
                disabled={invalid}
                onClick={() => pick(n.id)}
              >
                <span>{n.children?.length ? '▸' : '·'} {n.title}</span>
                {invalid && <span className="mng-pick-tag">can’t move here</span>}
              </button>
              {(n.children || []).map(c => <Row key={c.id} n={c} depth={depth + 1} />)}
            </>
          )
        }

        return (
          <>
            <h4>Move “{node.title}” to…</h4>
            <div className="mng-picklist">
              <button className="mng-pick" onClick={() => pick(null)}>⌂ Top level</button>
              {nodes.map(n => <Row key={n.id} n={n} depth={0} />)}
            </div>
            <div className="modal-footer">
              <button className="btn ghost" onClick={close}>Cancel</button>
            </div>
          </>
        )
      }}
    </Modal>
  )
}
