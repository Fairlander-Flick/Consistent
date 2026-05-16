// Cross-store summary for a date range (a week or a month).
//
// `dates` is the list of YYYY-MM-DD strings the period covers.
// `goalPeriod` is the goals horizon object ({ todos: [...] }) that matches
// the period (weekly goals for a week recap, monthly for a month).

function avg(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

export function periodRecap({ log, journalEntries, transactions, goalPeriod }, dates) {
  const set = new Set(dates)
  const has = (d) => set.has(d)

  const sessions = log.filter(s => has(s.date))
  const trainingMinutes = sessions.reduce((m, s) => m + (s.durationMinutes || 0), 0)

  const periodJournal = journalEntries.filter(e => has(e.date))
  const sleepAvg = avg(periodJournal.filter(e => e.sleepHours != null).map(e => e.sleepHours))
  const moodAvg = avg(periodJournal.filter(e => e.score != null).map(e => e.score))

  const periodTx = transactions.filter(t => has(t.date))
  const spend = periodTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const income = periodTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  const todos = goalPeriod?.todos ?? []
  const goalsTotal = todos.length
  const goalsDone = todos.filter(t => t.done).length

  return {
    trainingCount: sessions.length,
    trainingMinutes,
    sleepAvg,
    moodAvg,
    spend,
    income,
    net: income - spend,
    goalsTotal,
    goalsDone,
    journalCount: periodJournal.length,
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
