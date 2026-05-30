import { nodeDone } from './lifelongProgress'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function weekdayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

// Walk a pursuit's subtree, collecting leaf nodes scheduled on `wd` that aren't
// finished. `rootTitle`/`rootId` track the top-level pursuit for labelling.
function collectScheduled(node, wd, rootTitle, rootId, out) {
  const isLeaf = !(node.children && node.children.length)
  if (isLeaf) {
    if (!nodeDone(node) && new Set(node.days || []).has(wd)) {
      out.push({
        key: `lifelong|${node.id}`,
        label: node.title,
        goalTitle: rootTitle,
        goalId: rootId,
        itemId: node.id,
      })
    }
    return
  }
  for (const child of node.children) collectScheduled(child, wd, rootTitle, rootId, out)
}

// Lifelong leaves scheduled to show in the Daily list / planner for a date.
// `nodes` is the root pursuit array (useLifelongStore.nodes).
export function lifelongTodosForDate(date, nodes) {
  if (!date || !nodes) return []
  const wd = weekdayKey(date)
  const result = []
  for (const root of nodes) collectScheduled(root, wd, root.title, root.id, result)
  return result
}
