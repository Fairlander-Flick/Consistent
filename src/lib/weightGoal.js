// Progress and ETA toward a target weight, from logged weight entries.
// `entries` is [{ date, kg }]; order does not matter (sorted internally).

export function weightProgress(entries, target) {
  if (target == null || entries.length === 0) return null
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const start = sorted[0].kg
  const current = sorted[sorted.length - 1].kg

  const span = target - start
  const fraction = span === 0
    ? (current === target ? 1 : 0)
    : (current - start) / span
  const pct = Math.max(0, Math.min(1, fraction))
  const remaining = target - current
  const reached = Math.abs(remaining) < 0.05

  // Recent rate: linear over the last window of up to 14 entries.
  const window = sorted.slice(-14)
  let ratePerWeek = null
  let etaDate = null
  if (window.length >= 2) {
    const a = window[0]
    const b = window[window.length - 1]
    const days = (new Date(b.date) - new Date(a.date)) / 86400000
    if (days > 0) {
      ratePerWeek = ((b.kg - a.kg) / days) * 7
      const movingToward = !reached && Math.sign(ratePerWeek) === Math.sign(remaining)
      if (movingToward && Math.abs(ratePerWeek) > 1e-6) {
        const weeks = remaining / ratePerWeek // same sign → positive
        const eta = new Date(b.date)
        eta.setDate(eta.getDate() + Math.ceil(weeks * 7))
        const y = eta.getFullYear()
        const m = String(eta.getMonth() + 1).padStart(2, '0')
        const d = String(eta.getDate()).padStart(2, '0')
        etaDate = `${y}-${m}-${d}`
      }
    }
  }

  return {
    start,
    current,
    target,
    remaining,
    reached,
    pct,
    ratePerWeek,
    etaDate,
  }
}
