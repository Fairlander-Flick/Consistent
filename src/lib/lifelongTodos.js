const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function weekdayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

// Lifelong items scheduled to show in the Daily goals list for a given date.
// Any item (a book, a video playlist, a habit) that lists this weekday in its
// `days` surfaces as a check-off todo.
export function lifelongTodosForDate(date, goals) {
  if (!date || !goals) return []
  const wd = weekdayKey(date)
  const result = []
  for (const goal of goals) {
    if (goal.done) continue
    for (const item of goal.items || []) {
      if ((item.days || []).includes(wd)) {
        result.push({
          key: `lifelong|${item.id}`,
          label: item.title,
          goalTitle: goal.title,
          goalId: goal.id,
          itemId: item.id,
        })
      }
    }
  }
  return result
}
