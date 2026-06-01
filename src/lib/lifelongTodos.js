import { nodeDone } from './lifelongProgress'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function weekdayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

// Walk a pursuit's subtree, collecting leaf nodes scheduled on `wd` that aren't
// finished. `parent` is the leaf's immediate container (the last breadcrumb
// element), so a "Lecture & Homework" leaf under Academy › … › Deutsch B2.1 is
// labelled "Deutsch B2.1" rather than the distant root pursuit. A root that is
// itself a leaf has no parent, so it falls back to its own title.
function collectScheduled(node, wd, parent, out) {
  const isLeaf = !(node.children && node.children.length)
  if (isLeaf) {
    if (!nodeDone(node) && new Set(node.days || []).has(wd)) {
      out.push({
        key: `lifelong|${node.id}`,
        label: node.title,
        goalTitle: parent ? parent.title : node.title,
        goalId: parent ? parent.id : node.id,
        itemId: node.id,
      })
    }
    return
  }
  for (const child of node.children) collectScheduled(child, wd, node, out)
}

// Lifelong leaves scheduled to show in the Daily list / planner for a date.
// `nodes` is the root pursuit array (useLifelongStore.nodes).
export function lifelongTodosForDate(date, nodes) {
  if (!date || !nodes) return []
  const wd = weekdayKey(date)
  const result = []
  for (const root of nodes) collectScheduled(root, wd, null, result)
  return result
}
