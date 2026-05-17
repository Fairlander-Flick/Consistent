export function recurringMonthTotals(recurring) {
  let income = 0
  let expense = 0
  for (const r of recurring) {
    if (r.type === 'income') income += r.amount
    else if (r.type === 'expense') expense += r.amount
  }
  return { income, expense, items: recurring }
}

// Returns recurring items that fall on a specific day-of-month.
// Clamps items with dayOfMonth > numDaysInMonth to the last day.
export function recurringForDay(recurring, day, numDaysInMonth) {
  return recurring.filter(r =>
    r.dayOfMonth === day || (r.dayOfMonth > numDaysInMonth && day === numDaysInMonth)
  )
}
