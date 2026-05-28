const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function weekdayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

export function lifelongTodosForDate(date, goals) {
  if (!date || !goals) return []
  const wd = weekdayKey(date)
  const result = []
  for (const goal of goals) {
    if (goal.done) continue
    for (const step of goal.steps) {
      if (step.days.includes(wd)) {
        result.push({
          key: `lifelong|${step.id}`,
          label: step.title,
          goalTitle: goal.title,
          goalId: goal.id,
          stepId: step.id,
        })
      }
    }
  }
  return result
}
