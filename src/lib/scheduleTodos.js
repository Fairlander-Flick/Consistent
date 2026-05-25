// Helpers to project schedule blocks into per-day todo items.

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function blockKey(b) {
  return `${b.label}|${b.start}|${b.end}`
}

function weekdayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

// Returns todo-shaped items for the given date, sorted by start time.
//   schedule = { recurring: {Mon:[],Tue:[],...}, oneoffs: [...] }
export function todosForDate(date, schedule) {
  if (!date || !schedule) return []
  const wd = weekdayKey(date)
  const rec = (schedule.recurring?.[wd] || []).map(b => ({
    key: blockKey(b),
    label: b.label,
    start: b.start,
    end: b.end,
    source: 'recurring',
  }))
  const one = (schedule.oneoffs || [])
    .filter(o => o.date === date)
    .map(b => ({
      key: blockKey(b),
      label: b.label,
      start: b.start,
      end: b.end,
      source: 'oneoff',
    }))
  return [...rec, ...one].sort((a, b) => (a.start || '').localeCompare(b.start || ''))
}
