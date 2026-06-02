// Shared builder for the GitHub-style year contribution grid. Used by the
// dashboard Consistency card and the Planner's week picker.
import { levelForCount } from './activity'

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Build column-major day cells for `year`, with leading blanks so weeks align to
// Monday rows. `byDate` maps ISO date → completion count (number).
export function buildYearGrid(year, byDate) {
  const jan1 = new Date(year, 0, 1)
  const leadingEmpty = (jan1.getDay() + 6) % 7
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInYear = isLeap ? 366 : 365

  const cells = Array.from({ length: leadingEmpty }, () => null)
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(year, 0, 1 + i)
    const dateStr = isoOf(d)
    const count = byDate.get(dateStr) || 0
    cells.push({ dateStr, level: levelForCount(count), count })
  }

  const monthCols = MONTH_LABELS.map((label, m) => {
    const firstOfMonth = new Date(year, m, 1)
    const diffDays = Math.round((firstOfMonth - jan1) / 86400000)
    return { label, col: Math.floor((leadingEmpty + diffDays) / 7) }
  })

  return { cells, monthCols, totalCols: Math.ceil(cells.length / 7) }
}
