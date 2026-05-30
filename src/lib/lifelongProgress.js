// Derived progress metrics for measurable lifelong items.
//
// An item: { total, current, logs: [{date, value}], unit, days }.
// `total == null` means a non-measurable habit item (no progress bar).

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

export function isMeasurable(item) {
  return item && item.total != null && item.total > 0
}

export function itemPct(item) {
  if (!isMeasurable(item)) return null
  return Math.max(0, Math.min(1, (item.current || 0) / item.total))
}

// Average units/day from the logged readings. Needs at least two readings on
// different days. Returns null when it can't be estimated.
export function itemPace(item) {
  const logs = (item.logs || [])
    .filter(l => l && l.value != null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  if (logs.length < 2) return null
  const first = logs[0]
  const last = logs[logs.length - 1]
  const span = daysBetween(first.date, last.date)
  if (span <= 0) return null
  const delta = last.value - first.value
  if (delta <= 0) return null
  return delta / span
}

// Projected completion date at the current pace.
export function itemEta(item, pace = itemPace(item)) {
  if (!isMeasurable(item) || pace == null || pace <= 0) return null
  const remaining = item.total - (item.current || 0)
  if (remaining <= 0) return null
  const days = Math.ceil(remaining / pace)
  const d = new Date()
  d.setDate(d.getDate() + days)
  return isoFrom(d)
}

// Units/day required to finish by `deadline` (YYYY-MM-DD). null if no deadline
// or already due/complete.
export function neededRate(item, deadline, today = isoFrom(new Date())) {
  if (!isMeasurable(item) || !deadline) return null
  const remaining = item.total - (item.current || 0)
  if (remaining <= 0) return null
  const daysLeft = daysBetween(today, deadline)
  if (daysLeft <= 0) return Infinity
  return remaining / daysLeft
}

// One-call summary used by the card. `behind` is true when the deadline needs a
// faster rate than the current pace.
export function progressSummary(item, deadline, today = isoFrom(new Date())) {
  const pct = itemPct(item)
  const pace = itemPace(item)
  const eta = itemEta(item, pace)
  const needed = neededRate(item, deadline, today)
  const behind = needed != null && (pace == null || needed > pace)
  return { pct, pace, eta, needed, behind, done: isMeasurable(item) && item.current >= item.total }
}

// Average completion across a pursuit's measurable items (0..1), or null.
export function goalAvgPct(goal) {
  const measurable = (goal.items || []).filter(isMeasurable)
  if (measurable.length === 0) return null
  return measurable.reduce((s, it) => s + itemPct(it), 0) / measurable.length
}
