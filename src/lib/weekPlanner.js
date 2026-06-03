import { isoWeekDates, todayISO } from './dateUtils'
import { lifelongTodosForDate } from './lifelongTodos'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Weekday key (Mon..Sun) for an ISO date.
export function weekdayKeyFor(dateISO) {
  const d = new Date(dateISO + 'T00:00:00')
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Resolve every item that belongs on `date`: recurring lifelong leaves (their
// done state lives per-date in doneMap) and one-off todos from the day plan
// (their done state lives on the todo itself, editable on any date).
//   lifelongGoals : useLifelongStore.nodes
//   dayPlan       : useDayPlanStore.byDate ({ 'YYYY-MM-DD': { todos:[...] } })
//   doneMap       : useScheduleDoneStore.done
export function itemsForDate(date, { lifelongGoals = [], dayPlan = {}, doneMap = {} } = {}) {
  const dayDone = doneMap[date] || {}
  const items = []

  for (const lt of lifelongTodosForDate(date, lifelongGoals)) {
    items.push({
      key: lt.key,
      label: lt.label,
      kind: lt.kind,
      source: 'lifelong',
      goalTitle: lt.goalTitle,
      crumb: lt.crumb,
      itemId: lt.itemId,
      done: !!dayDone[lt.key],
      draggable: true,
    })
  }

  for (const t of dayPlan[date]?.todos ?? []) {
    items.push({
      key: `oneoff|${date}|${t.id}`,
      label: t.text,
      source: 'oneoff',
      date,
      todoId: t.id,
      done: !!t.done,
      live: true,
      draggable: false,
    })
  }

  return items
}

function decorate(date, i, today, opts) {
  const items = itemsForDate(date, opts)
  return {
    date,
    day: Number(date.slice(8, 10)),
    weekday: WEEKDAYS[i],
    weekdayFull: DAY_FULL[i],
    isToday: date === today,
    isPast: date < today,
    items,
    total: items.length,
    doneCount: items.filter(it => it.done).length,
    oneoffCount: items.filter(it => it.source === 'oneoff').length,
    recurringCount: items.filter(it => it.source === 'lifelong').length,
  }
}

// Pivot all data into a 7-day board for the week containing `refDate`.
export function buildWeek({
  refDate,
  lifelongGoals = [],
  dayPlan = {},
  doneMap = {},
  today = todayISO(),
} = {}) {
  const base = refDate ? new Date(refDate + 'T00:00:00') : new Date()
  const dates = isoWeekDates(base)
  const opts = { lifelongGoals, dayPlan, doneMap }
  return dates.map((date, i) => decorate(date, i, today, opts))
}

// Calendar grid (Monday-start, 6 rows × 7) for the month containing `refDate`.
// Cells outside the month are included with `inMonth:false` so the grid stays
// rectangular.
export function buildMonth({
  refDate,
  lifelongGoals = [],
  dayPlan = {},
  doneMap = {},
  today = todayISO(),
} = {}) {
  const base = refDate ? new Date(refDate + 'T00:00:00') : new Date()
  const year = base.getFullYear()
  const month = base.getMonth()
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7 // days before the 1st (Mon-start)
  const start = new Date(year, month, 1 - lead)
  const opts = { lifelongGoals, dayPlan, doneMap }

  const cells = []
  for (let k = 0; k < 42; k++) {
    const d = new Date(start)
    d.setDate(start.getDate() + k)
    const date = isoOf(d)
    const i = (d.getDay() + 6) % 7
    cells.push({
      ...decorate(date, i, today, opts),
      inMonth: d.getMonth() === month,
    })
  }
  // Trim a trailing empty week (some months only need 5 rows).
  while (cells.length > 35 && cells.slice(-7).every(c => !c.inMonth)) cells.length -= 7
  return { year, month, cells }
}
