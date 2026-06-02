// Cross-store summary for a date range (a week or a month).
//
// `dates` is the list of YYYY-MM-DD strings the period covers.
// `activityByDate` is a Map<dateStr, completionCount> (see lib/activity.js).
// `goalPeriod` is the goals horizon object ({ todos: [...] }) that matches
// the period (weekly goals for a week recap, monthly for a month).

export function periodRecap({ activityByDate, goalPeriod }, dates) {
  const counts = dates.map(d => activityByDate?.get(d) || 0)
  const sessionsDone = counts.reduce((a, b) => a + b, 0)
  const activeDays = counts.filter(c => c > 0).length

  const todos = goalPeriod?.todos ?? []
  const goalsTotal = todos.length
  const goalsDone = todos.filter(t => t.done).length

  return {
    sessionsDone,
    activeDays,
    goalsTotal,
    goalsDone,
  }
}

// All YYYY-MM-DD dates in a calendar month.
export function monthDates(year, month) {
  const days = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: days }, (_, i) => {
    const d = i + 1
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  })
}

// All YYYY-MM-DD dates in a calendar year.
export function yearDates(year) {
  const dates = []
  for (let m = 0; m < 12; m++) {
    const days = new Date(year, m + 1, 0).getDate()
    for (let d = 1; d <= days; d++) {
      dates.push(`${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
  }
  return dates
}
