// Pure time-budget maths for the Free Time card. No React, no storage.
//
// A "session" is a scheduled lifelong leaf: it appears on the weekdays in its
// `days` array and consumes `sessionHours` of that day. Done leaves still count
// (the time was planned/spent). Free time = daily available − scheduled hours.
import { isoWeekDates, todayISO } from './dateUtils'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function round1(n) {
  return Math.round(n * 10) / 10
}

export function weekdayKey(dateISO) {
  const d = new Date(dateISO + 'T00:00:00')
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

// Hours free for goals on any given day, from the essentials config.
export function dailyAvailableHours(essentials = {}) {
  const sleep = Number(essentials.sleepPerDay) || 0
  const weekly = (essentials.factors || []).reduce((s, f) => s + (Number(f.hoursPerWeek) || 0), 0)
  return Math.max(0, round1(24 - sleep - weekly / 7))
}

// Walk the tree; collect leaves scheduled on weekday `wd`, tagged with their
// root pursuit. `root` is the top-level ancestor (null at the roots themselves).
function collect(node, wd, root, out) {
  const isLeaf = !(node.children && node.children.length)
  if (isLeaf) {
    if ((node.days || []).includes(wd)) {
      const r = root || node
      out.push({ id: node.id, title: node.title, hours: Number(node.sessionHours) || 0, rootId: r.id, rootTitle: r.title })
    }
    return
  }
  for (const child of node.children) collect(child, wd, root || node, out)
}

// A leaf is "untimed" when it's scheduled on at least one day but has no
// session length — it silently counts as 0h and quietly skews the budget.
export function isUntimed(node) {
  const isLeaf = !(node.children && node.children.length)
  return isLeaf && node.kind != null && (node.days || []).length > 0 && node.sessionHours == null
}

// Every untimed leaf in the tree, tagged with its root pursuit. Drives the
// "needs a time" prompt on the Goals page.
export function untimedScheduled(nodes = []) {
  const out = []
  function walk(node, root) {
    if (isUntimed(node)) {
      const r = root || node
      out.push({ id: node.id, title: node.title, rootId: r.id, rootTitle: r.title })
    }
    for (const child of node.children || []) walk(child, root || node)
  }
  for (const r of nodes) walk(r, null)
  return out
}

export function sessionsForDate(date, nodes = []) {
  const wd = weekdayKey(date)
  const out = []
  for (const r of nodes) collect(r, wd, null, out)
  return out
}

export function dayUsedHours(date, nodes = []) {
  return round1(sessionsForDate(date, nodes).reduce((s, x) => s + x.hours, 0))
}

// Hours grouped by root pursuit, descending. Empty (0h) groups dropped.
export function dayBreakdown(date, nodes = []) {
  const map = new Map()
  for (const s of sessionsForDate(date, nodes)) {
    const cur = map.get(s.rootId) || { pursuitId: s.rootId, title: s.rootTitle, hours: 0 }
    cur.hours = round1(cur.hours + s.hours)
    map.set(s.rootId, cur)
  }
  return [...map.values()].filter(x => x.hours > 0).sort((a, b) => b.hours - a.hours)
}

// 7 days (Mon..Sun) for the week containing refDate, each with free-time stats.
export function buildWeekFree(refDate, nodes = [], essentials = {}, today = todayISO()) {
  const available = dailyAvailableHours(essentials)
  const base = refDate ? new Date(refDate + 'T00:00:00') : new Date()
  return isoWeekDates(base).map((date, i) => {
    const used = dayUsedHours(date, nodes)
    return {
      date,
      weekday: WEEKDAYS[i],
      available,
      used,
      free: round1(available - used),
      over: used > available,
      isToday: date === today,
    }
  })
}
