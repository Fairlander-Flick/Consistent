// Per-day activity = work you actually completed that day. Replaces the old
// journal mood-score signal as the input to the Consistency heatmap and Recap.
//
// Sources:
//   scheduleDone : useScheduleDoneStore.done — { 'YYYY-MM-DD': { '<key>': true } }
//                  (recurring lifelong steps checked off that day)
//   dayPlan      : useDayPlanStore.byDate    — { 'YYYY-MM-DD': { todos:[{done}] } }
//                  (one-off todos; only the done ones count)

// Heatmap fill level (0–4) from a completion count, GitHub-style.
export function levelForCount(n) {
  if (!n) return 0
  return n >= 4 ? 4 : n >= 3 ? 3 : n >= 2 ? 2 : 1
}

// Completions on a single date.
export function activityCountForDate(date, scheduleDone = {}, dayPlan = {}) {
  const sched = Object.keys(scheduleDone[date] || {}).length
  const oneoff = (dayPlan[date]?.todos || []).filter(t => t.done).length
  return sched + oneoff
}

// Map<dateStr, count> across every date that has any completion.
export function buildActivityMap(scheduleDone = {}, dayPlan = {}) {
  const map = new Map()
  const add = (date, n) => { if (n) map.set(date, (map.get(date) || 0) + n) }
  for (const date of Object.keys(scheduleDone)) add(date, Object.keys(scheduleDone[date] || {}).length)
  for (const date of Object.keys(dayPlan)) add(date, (dayPlan[date]?.todos || []).filter(t => t.done).length)
  return map
}
