// Pure periodization helpers. No imports, no side effects, fully unit-testable.
//
// A periodized strength exercise carries:
//   periodization: { trainingMax, multipliers: [m1, m2, m3], currentWeek: 1..3 }
// Working weight for the current week is
//   roundToNearest(trainingMax * multipliers[currentWeek - 1], 2.5).

export function roundToNearest(value, step = 2.5) {
  if (!step) return value
  const q = value / step
  const rounded = Math.sign(q) * Math.round(Math.abs(q)) // ties away from zero
  return Math.round(rounded * step * 100) / 100
}

export function nextWeek(week) {
  return week >= 3 ? 1 : week + 1
}

export function computeWeight(periodization) {
  if (!periodization) return 0
  const { trainingMax, multipliers, currentWeek } = periodization
  const m = (multipliers || [])[(currentWeek || 1) - 1]
  if (!trainingMax || m == null) return 0
  return roundToNearest(trainingMax * m, 2.5)
}

export function weeklyPreview(periodization) {
  if (!periodization) return [0, 0, 0]
  return [1, 2, 3].map(w => computeWeight({ ...periodization, currentWeek: w }))
}
