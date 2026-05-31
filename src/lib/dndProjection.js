// Pure helpers for the drag-and-drop "sortable tree" on the Manage screen.
// Given a flat, depth-tagged list (from flattenVisible), figure out where a
// dragged row would land — its new depth, parent, and sibling index — based on
// the horizontal drag offset. Kept pure so it can be unit-tested without a DOM.
// This follows the canonical dnd-kit sortable-tree projection.

export function arrayMove(arr, from, to) {
  const copy = [...arr]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// Remove the active row's descendants from the flat list so it can't be dropped
// inside its own subtree. The active row itself stays (it gets repositioned).
// Descendants are the contiguous rows after `activeId` with greater depth.
export function removeSubtree(flat, activeId) {
  const idx = flat.findIndex(i => i.id === activeId)
  if (idx === -1) return flat
  const activeDepth = flat[idx].depth
  const out = flat.slice(0, idx + 1)
  let j = idx + 1
  while (j < flat.length && flat[j].depth > activeDepth) j++
  return out.concat(flat.slice(j))
}

// Compute the full drop target.
// flat: depth-tagged rows with the active subtree already removed
//       (call removeSubtree first).
// Returns { depth, parentId, index } where index is the position among the
// target parent's children — what store.moveNode(id, parentId, index) expects.
export function computeDrop(flat, activeId, overId, dragOffsetX, indentWidth) {
  const overIndex = flat.findIndex(i => i.id === overId)
  const activeIndex = flat.findIndex(i => i.id === activeId)
  if (overIndex === -1 || activeIndex === -1) return { depth: 0, parentId: null, index: 0 }

  // After the move the active row sits at overIndex, so its neighbours are the
  // rows directly before/after that slot.
  const moved = arrayMove(flat, activeIndex, overIndex)
  const prev = moved[overIndex - 1]
  const next = moved[overIndex + 1]

  const dragDepth = Math.round(dragOffsetX / indentWidth)
  const projected = flat[activeIndex].depth + dragDepth

  const maxDepth = prev ? prev.depth + 1 : 0
  const minDepth = next ? next.depth : 0
  const depth = clamp(projected, minDepth, maxDepth)

  let parentId = null
  if (depth !== 0 && prev) {
    if (depth === prev.depth) parentId = prev.parentId
    else if (depth > prev.depth) parentId = prev.id
    else {
      // Nearest earlier row at this depth supplies the parent.
      const candidate = moved.slice(0, overIndex).reverse().find(i => i.depth === depth)
      parentId = candidate ? candidate.parentId : null
    }
  }

  // Index = how many same-parent siblings precede the active row's new slot.
  let index = 0
  for (let i = 0; i < overIndex; i++) {
    if (moved[i].id !== activeId && (moved[i].parentId ?? null) === (parentId ?? null)) index++
  }

  return { depth, parentId: parentId ?? null, index }
}
