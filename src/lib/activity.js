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

const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Length of the run of consecutive active days ending today. A day you haven't
// logged yet shouldn't break a live streak, so if today is still empty we start
// counting from yesterday.
export function currentStreak(activityMap, todayStr) {
  if (!activityMap || activityMap.size === 0) return 0
  const cursor = new Date(todayStr + 'T00:00:00')
  if (!(activityMap.get(isoOf(cursor)) > 0)) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (activityMap.get(isoOf(cursor)) > 0) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
