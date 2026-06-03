import { nodeDone } from './lifelongProgress'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function weekdayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

// Walk a pursuit's subtree, collecting leaf nodes scheduled on `wd` that aren't
// finished. `trail` is the ancestor chain (root → … → immediate parent), so a
// "Lecture & Homework" leaf under Academy › … › Deutsch B2.1 is labelled
// "Deutsch B2.1" (its immediate parent) rather than the distant root pursuit,
// and carries the full `crumb` of ancestor titles for a "where from" tooltip.
// A root that is itself a leaf has no parent, so it falls back to its own title.
function collectScheduled(node, wd, trail, out) {
  const isLeaf = !(node.children && node.children.length)
  if (isLeaf) {
    if (!nodeDone(node) && new Set(node.days || []).has(wd)) {
      const parent = trail[trail.length - 1] || null
      out.push({
        key: `lifelong|${node.id}`,
        label: node.title,
        kind: node.kind,
        goalTitle: parent ? parent.title : node.title,
        goalId: parent ? parent.id : node.id,
        itemId: node.id,
        crumb: trail.map(n => n.title),
      })
    }
    return
  }
  for (const child of node.children) collectScheduled(child, wd, [...trail, node], out)
}

// Lifelong leaves scheduled to show in the Daily list / planner for a date.
// `nodes` is the root pursuit array (useLifelongStore.nodes).
export function lifelongTodosForDate(date, nodes) {
  if (!date || !nodes) return []
  const wd = weekdayKey(date)
  const result = []
  for (const root of nodes) collectScheduled(root, wd, [], result)
  return result
}

// All unfinished leaf descendants of a node (used to fill a scheduled parent).
function collectLeaves(node, trail, out) {
  const isLeaf = !(node.children && node.children.length)
  if (isLeaf) {
    if (!nodeDone(node)) {
      const parent = trail[trail.length - 1] || null
      out.push({
        key: `lifelong|${node.id}`,
        label: node.title,
        kind: node.kind,
        itemId: node.id,
        goalTitle: parent ? parent.title : node.title,
        crumb: trail.map(n => n.title),
      })
    }
    return
  }
  for (const child of node.children) collectLeaves(child, [...trail, node], out)
}

// Daily list grouped by scheduled parent. A node that has children AND is
// scheduled on `date` (its own `days`) becomes one collapsible group holding all
// its unfinished leaf descendants; plain scheduled leaves surface standalone.
// Returns a mix of { type:'parent', id, title, children:[…] } and
// { type:'leaf', key, label, kind, itemId, goalTitle, crumb }.
export function dailyGroupsForDate(date, nodes) {
  if (!date || !nodes) return []
  const wd = weekdayKey(date)
  const out = []

  const walk = (node, trail) => {
    const hasChildren = !!(node.children && node.children.length)
    if (hasChildren && new Set(node.days || []).has(wd)) {
      const children = []
      for (const child of node.children) collectLeaves(child, [...trail, node], children)
      if (children.length) out.push({ type: 'parent', id: node.id, title: node.title, children })
      return // its descendants belong to the group, not the top level
    }
    if (!hasChildren) {
      if (!nodeDone(node) && new Set(node.days || []).has(wd)) {
        const parent = trail[trail.length - 1] || null
        out.push({
          type: 'leaf',
          key: `lifelong|${node.id}`,
          label: node.title,
          kind: node.kind,
          itemId: node.id,
          goalTitle: parent ? parent.title : node.title,
          crumb: trail.map(n => n.title),
        })
      }
      return
    }
    for (const child of node.children) walk(child, [...trail, node])
  }
  for (const root of nodes) walk(root, [])
  return out
}
