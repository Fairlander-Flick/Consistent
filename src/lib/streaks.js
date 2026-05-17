// Streak math over a set of "active" ISO dates (YYYY-MM-DD).
//
// current: consecutive days ending today, or ending yesterday if today is
//   not yet logged (the streak isn't broken until a whole day is missed).
// longest: the longest run of consecutive days anywhere in the set.

function shiftISO(iso, deltaDays) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + deltaDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function computeStreak(isoDates, today) {
  const set = new Set(isoDates)
  if (set.size === 0) return { current: 0, longest: 0 }

  // Current streak — anchor on today, falling back to yesterday.
  let current = 0
  let anchor = set.has(today) ? today : (set.has(shiftISO(today, -1)) ? shiftISO(today, -1) : null)
  while (anchor && set.has(anchor)) {
    current++
    anchor = shiftISO(anchor, -1)
  }

  // Longest streak — walk sorted dates, counting consecutive runs.
  const sorted = [...set].sort()
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === shiftISO(sorted[i - 1], 1)) {
      run++
    } else {
      run = 1
    }
    if (run > longest) longest = run
  }

  return { current, longest }
}

// Dates with a submitted journal entry (or at least a recorded day score).
export function journalDates(entries) {
  return entries
    .filter(e => e.submitted || e.score != null)
    .map(e => e.date)
}

// Dates with a logged training session (excludes mark-done sessions with 0 exercises).
export function trainingDates(log) {
  return log
    .filter(s => (s.exercises?.length ?? 0) > 0)
    .map(s => s.date)
}
