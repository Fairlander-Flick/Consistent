// Local daily reminder. There is no backend/push, so this only fires while
// a tab is open; it re-arms itself each day with chained timeouts.

// The next Date at which `HH:MM` occurs strictly after `from`.
export function nextOccurrence(timeStr, from = new Date()) {
  const [h, m] = String(timeStr).split(':').map(Number)
  const next = new Date(from)
  next.setHours(h || 0, m || 0, 0, 0)
  if (next <= from) next.setDate(next.getDate() + 1)
  return next
}

// Schedules a recurring daily check. At each firing `shouldNotify()` decides
// whether to actually call `notify()` (e.g. skip if nothing is pending).
// Returns a cancel function. setTimeout is clamped to a 24h-safe delay.
export function scheduleDailyReminder({ time, shouldNotify, notify, now = () => new Date() }) {
  let timer = null
  let cancelled = false

  function arm() {
    if (cancelled) return
    const delay = nextOccurrence(time, now()) - now()
    timer = setTimeout(() => {
      if (cancelled) return
      try {
        if (shouldNotify()) notify()
      } catch {
        // never let a reminder error break the chain
      }
      arm()
    }, Math.max(0, delay))
  }

  arm()
  return () => {
    cancelled = true
    if (timer) clearTimeout(timer)
  }
}
