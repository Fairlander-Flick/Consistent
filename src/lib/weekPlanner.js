import { isoWeekDates, todayISO } from './dateUtils'
import { lifelongTodosForDate } from './lifelongTodos'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Weekday key (Mon..Sun) for an ISO date, matching lifelongTodos' convention.
export function weekdayKeyFor(dateISO) {
  const d = new Date(dateISO + 'T00:00:00')
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

// Resolve the free-form daily todos that apply to a date:
//   - today  → the live daily goal set (only if its key matches today)
//   - past   → the archived set in goalsLog.daily[date]
//   - future → none (daily todos are written for the current day only)
function resolveDaily(date, today, dailyGoals, goalsLog) {
  if (!dailyGoals) return null
  if (date === today) {
    return dailyGoals.dailyDate === today ? dailyGoals.daily : null
  }
  if (date > today) return null
  return goalsLog?.daily?.[date] ?? null
}

// Pivot all existing data into a 7-day board for the week containing `refDate`.
// No new data model — this only reads:
//   lifelongGoals : useLifelongStore.goals
//   dailyGoals    : useGoalsStore.goals  ({ dailyDate, daily, ... })
//   goalsLog      : useGoalsStore.goalsLog
//   doneMap       : useScheduleDoneStore.done  ({ 'YYYY-MM-DD': { key: true } })
// `today` is injectable so the result is deterministic in tests.
export function buildWeek({
  refDate,
  lifelongGoals = [],
  dailyGoals = null,
  goalsLog = null,
  doneMap = {},
  today = todayISO(),
} = {}) {
  const base = refDate ? new Date(refDate + 'T00:00:00') : new Date()
  const dates = isoWeekDates(base)

  return dates.map((date, i) => {
    const dayDone = doneMap[date] || {}
    const items = []

    // Recurring lifelong items scheduled on this weekday.
    for (const lt of lifelongTodosForDate(date, lifelongGoals)) {
      items.push({
        key: lt.key,
        label: lt.label,
        source: 'lifelong',
        goalId: lt.goalId,
        itemId: lt.itemId,
        goalTitle: lt.goalTitle,
        done: !!dayDone[lt.key],
        draggable: true,
      })
    }

    // Free-form daily todos (live today / archived for earlier this week).
    const daily = resolveDaily(date, today, dailyGoals, goalsLog)
    if (daily) {
      for (const t of daily.todos || []) {
        items.push({
          key: `daily|${t.id}`,
          label: t.text,
          source: 'daily',
          todoId: t.id,
          done: !!t.done,
          live: date === today,
          draggable: false,
        })
      }
    }

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
    }
  })
}
