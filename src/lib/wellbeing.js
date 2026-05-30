// Analytics over journal entries: sleep & mood trends and their relationship.

// Pearson correlation coefficient for an array of [x, y] pairs.
// Returns null when there is too little or degenerate data.
export function pearson(pairs) {
  const n = pairs.length
  if (n < 3) return null
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0
  for (const [x, y] of pairs) {
    sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y
  }
  const cov = n * sxy - sx * sy
  const dx = n * sxx - sx * sx
  const dy = n * syy - sy * sy
  if (dx <= 0 || dy <= 0) return null
  return cov / Math.sqrt(dx * dy)
}

function avg(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

// Chronological series of { date, value } for a numeric journal field.
export function trendSeries(entries, field) {
  return entries
    .filter(e => e[field] != null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => ({ date: e.date, value: e[field] }))
}

const SLEEP_THRESHOLD = 7

// Compares day-score on well-rested vs short-sleep nights and reports the
// sleep↔score correlation. `entries` is the raw journal array.
export function sleepScoreInsight(entries) {
  const both = entries.filter(e => e.sleepHours != null && e.score != null)
  const r = pearson(both.map(e => [e.sleepHours, e.score]))

  const rested = []
  const short = []
  for (const e of both) {
    (e.sleepHours >= SLEEP_THRESHOLD ? rested : short).push(e.score)
  }

  return {
    n: both.length,
    r,
    threshold: SLEEP_THRESHOLD,
    restedAvg: avg(rested),
    shortAvg: avg(short),
    restedCount: rested.length,
    shortCount: short.length,
  }
}

export function correlationLabel(r) {
  if (r == null) return 'not enough data'
  const a = Math.abs(r)
  const strength = a < 0.2 ? 'no' : a < 0.4 ? 'a weak' : a < 0.6 ? 'a moderate' : 'a strong'
  if (strength === 'no') return 'no clear link'
  return `${strength} ${r > 0 ? 'positive' : 'negative'} link`
}
