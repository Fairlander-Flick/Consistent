// Pure tree-structure operations for the lifelong-goals (pursuits) tree.
// No React, no storage — every function takes a nodes array and returns a new
// one, so they are trivially unit-testable and safe to compose in the store.
import { findNode, nodePath, newNode } from '../store/useLifelongStore'

export { findNode, nodePath }

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ── Lookups ─────────────────────────────────────────────────

function containsId(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return true
    if (n.children?.length && containsId(n.children, id)) return true
  }
  return false
}

// The sibling list `id` lives in, plus its index. Roots count as siblings.
export function siblingsOf(nodes, id) {
  if (nodes.some(n => n.id === id)) {
    return { list: nodes, index: nodes.findIndex(n => n.id === id), parentId: null }
  }
  let result = null
  const walk = (arr) => {
    for (const n of arr) {
      if (n.children?.length) {
        const idx = n.children.findIndex(c => c.id === id)
        if (idx !== -1) { result = { list: n.children, index: idx, parentId: n.id }; return }
        walk(n.children)
        if (result) return
      }
    }
  }
  walk(nodes)
  return result
}

// True if `maybeId` is `ancestorId` itself or anywhere in its subtree.
export function isDescendant(nodes, ancestorId, maybeId) {
  if (ancestorId === maybeId) return true
  const anc = findNode(nodes, ancestorId)
  if (!anc) return false
  return containsId(anc.children || [], maybeId)
}

// ── Structural edits (all return a new tree) ────────────────

// Detach the node with `id`, returning [treeWithout, detachedNode].
function detach(nodes, id) {
  let removed = null
  const strip = (arr) => {
    const out = []
    for (const n of arr) {
      if (n.id === id) { removed = n; continue }
      out.push(n.children?.length ? { ...n, children: strip(n.children) } : n)
    }
    return out
  }
  const next = strip(nodes)
  return [next, removed]
}

// Insert `child` under `parentId` (root when null) at position `index`
// (appended when index is null/undefined).
function insertAt(nodes, parentId, child, index) {
  if (parentId == null) {
    const arr = [...nodes]
    if (index == null || index > arr.length) arr.push(child)
    else arr.splice(Math.max(0, index), 0, child)
    return arr
  }
  return nodes.map(n => {
    if (n.id === parentId) {
      const arr = [...(n.children || [])]
      if (index == null || index > arr.length) arr.push(child)
      else arr.splice(Math.max(0, index), 0, child)
      return { ...n, children: arr }
    }
    if (n.children?.length) return { ...n, children: insertAt(n.children, parentId, child, index) }
    return n
  })
}

// Move `id` to be a child of `newParentId` at `index`. No-op (returns the same
// reference) when the move is illegal (into own subtree, or missing node).
export function moveNode(nodes, id, newParentId, index = null) {
  if (newParentId != null && isDescendant(nodes, id, newParentId)) return nodes
  const [without, node] = detach(nodes, id)
  if (!node) return nodes
  return insertAt(without, newParentId, node, index)
}

// Reorder within the parent that currently holds `id`.
export function reorderWithin(nodes, parentId, fromIndex, toIndex) {
  const move = (arr) => {
    const copy = [...arr]
    const [item] = copy.splice(fromIndex, 1)
    if (!item) return arr
    copy.splice(toIndex, 0, item)
    return copy
  }
  if (parentId == null) return move(nodes)
  return nodes.map(n => {
    if (n.id === parentId) return { ...n, children: move(n.children || []) }
    if (n.children?.length) return { ...n, children: reorderWithin(n.children, parentId, fromIndex, toIndex) }
    return n
  })
}

// Wrap the given sibling `ids` in a new category, placed where the first one was.
// v1 requires all ids to share a parent; otherwise returns the tree unchanged.
export function groupNodes(nodes, ids, title = 'New group') {
  if (!ids?.length) return nodes
  const parents = new Set(ids.map(id => siblingsOf(nodes, id)?.parentId))
  if (parents.size !== 1) return nodes
  const parentId = [...parents][0]
  const sibs = siblingsOf(nodes, ids[0])
  if (!sibs) return nodes

  const ordered = sibs.list.filter(n => ids.includes(n.id))
  const insertIndex = sibs.list.findIndex(n => n.id === ids[0])

  const group = { ...newNode({ title: title.trim() || 'New group' }), children: ordered }
  let next = nodes
  for (const id of ids) next = detach(next, id)[0]
  return insertAt(next, parentId, group, insertIndex)
}

// Dissolve a category: lift its children into its slot, then drop the category.
export function ungroupNode(nodes, id) {
  const node = findNode(nodes, id)
  if (!node || !node.children?.length) return nodes
  const sibs = siblingsOf(nodes, id)
  if (!sibs) return nodes
  const kids = node.children
  let next = detach(nodes, id)[0]
  // insert children at the old position, in order
  const startIndex = sibs.index
  kids.forEach((kid, i) => { next = insertAt(next, sibs.parentId, kid, startIndex + i) })
  return next
}

// Deep-clone a subtree with fresh ids and reset progress; insert after original.
export function duplicateNode(nodes, id) {
  const node = findNode(nodes, id)
  if (!node) return nodes
  const clone = (n) => ({
    ...n,
    id: genId(),
    current: 0,
    logs: [],
    done: false,
    checklist: (n.checklist || []).map(i => ({ ...i, id: genId(), done: false })),
    children: (n.children || []).map(clone),
  })
  const copy = { ...clone(node), title: node.title + ' (copy)' }
  const sibs = siblingsOf(nodes, id)
  return insertAt(nodes, sibs?.parentId ?? null, copy, (sibs?.index ?? nodes.length - 1) + 1)
}

// Field map per leaf kind — fields that are meaningful for that kind.
const KIND_FIELDS = {
  book:      ['unit', 'total'],
  playlist:  ['total'],
  custom:    ['unit', 'total'],
  habit:     ['perWeek'],
  task:      [],
  checklist: ['checklist'],
  category:  [],
}

// Return whether converting `node` to `newKind` would discard logged data.
export function convertLosesData(node, newKind) {
  const keep = new Set(KIND_FIELDS[newKind ?? 'category'] || [])
  const hadProgress = (node.current ?? 0) > 0 || (node.logs?.length ?? 0) > 0
  const hadChecklist = (node.checklist?.length ?? 0) > 0
  if (hadProgress && !keep.has('total')) return true
  if (hadChecklist && !keep.has('checklist')) return true
  return false
}

// Convert a node to a new kind, clearing now-irrelevant fields. `null` kind
// (or 'category') turns it into a plain category.
export function convertNode(node, newKind) {
  const kind = newKind === 'category' ? null : newKind
  const keep = new Set(KIND_FIELDS[newKind ?? 'category'] || [])
  return {
    ...node,
    kind,
    unit: keep.has('unit') ? node.unit : null,
    total: keep.has('total') ? node.total : null,
    current: keep.has('total') ? node.current : 0,
    logs: keep.has('total') ? node.logs : [],
    checklist: keep.has('checklist') ? node.checklist : [],
    perWeek: keep.has('perWeek') ? node.perWeek : null,
    done: kind === 'task' ? node.done : false,
  }
}

// Outdent: make `id` a sibling of its parent (placed right after the parent).
export function outdentNode(nodes, id) {
  const parent = findParentNode(nodes, id)
  if (!parent) return nodes // already at root
  const grandSibs = siblingsOf(nodes, parent.id)
  const grandParentId = grandSibs?.parentId ?? null
  const grandIndex = grandSibs?.index ?? 0
  return moveNode(nodes, id, grandParentId, grandIndex + 1)
}

// Indent: make `id` a child of the sibling directly above it.
export function indentNode(nodes, id) {
  const sibs = siblingsOf(nodes, id)
  if (!sibs || sibs.index === 0) return nodes // nothing above to nest under
  const prev = sibs.list[sibs.index - 1]
  return moveNode(nodes, id, prev.id, (prev.children?.length ?? 0))
}

// Helper: the actual parent node object (null at root).
export function findParentNode(nodes, id) {
  const sibs = siblingsOf(nodes, id)
  if (!sibs || sibs.parentId == null) return null
  return findNode(nodes, sibs.parentId)
}

// ── Flattening for the drag list ────────────────────────────

// Ordered, depth-tagged list of visible rows. Collapsed nodes hide descendants.
// Each row also carries tree-guide metadata:
//   isLast  – true when the node is the last among its siblings (elbow vs tee)
//   prefix  – one boolean per ancestor (outermost → parent); true means that
//             ancestor has a following sibling, so its vertical rail keeps going
//             past this row. Lets ManageRow draw connected file-tree rails.
export function flattenVisible(nodes, depth = 0, parentId = null, out = [], prefix = []) {
  nodes.forEach((n, i) => {
    const isLast = i === nodes.length - 1
    out.push({ id: n.id, node: n, depth, parentId, isLast, prefix })
    if (n.children?.length && !n.collapsed) {
      flattenVisible(n.children, depth + 1, n.id, out, [...prefix, !isLast])
    }
  })
  return out
}
