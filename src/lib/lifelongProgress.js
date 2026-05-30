// Derived progress metrics for the Lifelong Goals tree.
//
// A node is either a CATEGORY (has children → progress rolls up from them) or a
// LEAF measured by its `kind`:
//   book / playlist / custom : current / total           → fraction
//   checklist                : done items / total items  → fraction
//   task                     : done boolean              → 0 or 1
//   habit                    : weekly cadence            → no completion %
//
// `nodePct` returns 0..1, or null when a node has no measurable progress
// (an empty category, a habit, a leaf with no target). Null nodes are excluded
// from a parent's rollup so habits don't drag an average to zero.

const MEASURED_FRACTION = new Set(['book', 'playlist', 'custom'])

export function isCategory(node) {
  return Array.isArray(node?.children) && node.children.length > 0
}

export function isMeasurable(node) {
  if (!node || isCategory(node)) return false
  if (MEASURED_FRACTION.has(node.kind)) return node.total != null && node.total > 0
  if (node.kind === 'checklist') return (node.checklist || []).length > 0
  return node.kind === 'task'
}

// Fraction complete for a single node (0..1) or null when not measurable.
export function nodePct(node) {
  if (!node) return null
  if (isCategory(node)) {
    const kids = node.children.map(nodePct).filter(p => p != null)
    if (kids.length === 0) return null
    return kids.reduce((a, b) => a + b, 0) / kids.length
  }
  if (MEASURED_FRACTION.has(node.kind)) {
    if (!(node.total > 0)) return null
    return Math.max(0, Math.min(1, (node.current || 0) / node.total))
  }
  if (node.kind === 'checklist') {
    const items = node.checklist || []
    if (items.length === 0) return null
    return items.filter(i => i.done).length / items.length
  }
  if (node.kind === 'task') return node.done ? 1 : 0
  return null // habit or untyped
}

// Whole node finished? Used to grey out / move to "completed".
export function nodeDone(node) {
  if (node.kind === 'task') return !!node.done
  const p = nodePct(node)
  return p != null && p >= 1
}

function daysBetween(isoA, isoB) {
  const a = new Date(isoA + 'T00:00:00')
  const b = new Date(isoB + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}

function isoFrom(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Average units/day from logged readings (book/custom/playlist). Needs ≥2 logs
// on different days. Returns null when it can't be estimated.
export function nodePace(node) {
  const logs = (node.logs || [])
    .filter(l => l && l.value != null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  if (logs.length < 2) return null
  const span = daysBetween(logs[0].date, logs[logs.length - 1].date)
  if (span <= 0) return null
  const delta = logs[logs.length - 1].value - logs[0].value
  if (delta <= 0) return null
  return delta / span
}

// Projected completion date at the current pace (YYYY-MM-DD) or null.
export function nodeEta(node, pace = nodePace(node)) {
  if (!MEASURED_FRACTION.has(node.kind) || !(node.total > 0) || pace == null || pace <= 0) return null
  const remaining = node.total - (node.current || 0)
  if (remaining <= 0) return null
  const d = new Date()
  d.setDate(d.getDate() + Math.ceil(remaining / pace))
  return isoFrom(d)
}

// Units/day required to finish by `deadline`. null if no deadline/target, or
// Infinity if the deadline has passed with work remaining.
export function neededRate(node, today = isoFrom(new Date())) {
  if (!MEASURED_FRACTION.has(node.kind) || !(node.total > 0) || !node.deadline) return null
  const remaining = node.total - (node.current || 0)
  if (remaining <= 0) return null
  const daysLeft = daysBetween(today, node.deadline)
  if (daysLeft <= 0) return Infinity
  return remaining / daysLeft
}

// One-call summary for a measured leaf used by the goals UI.
export function progressSummary(node, today = isoFrom(new Date())) {
  const pct = nodePct(node)
  const pace = nodePace(node)
  const eta = nodeEta(node, pace)
  const needed = neededRate(node, today)
  const behind = needed != null && (pace == null || needed > pace)
  return { pct, pace, eta, needed, behind }
}

// Average completion across a tree's measurable descendants (0..1) or null.
// Same as nodePct on a synthetic root, but skips done/empty pursuits cleanly.
export function treeAvgPct(nodes) {
  const pcts = (nodes || []).map(nodePct).filter(p => p != null)
  if (pcts.length === 0) return null
  return pcts.reduce((a, b) => a + b, 0) / pcts.length
}
