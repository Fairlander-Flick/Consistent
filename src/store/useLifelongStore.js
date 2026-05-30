import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'
import { todayISO } from '../lib/dateUtils'

const KEY = 'consistent:lifelong'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// An item is one trackable thing under a pursuit (a book, a video playlist, a
// recurring habit). It optionally has a measurable `total` (pages, videos) and
// `current` position with a `logs` history, and optionally `days` it shows up
// in the Daily goals list.
function newItem({ title, unit = null, total = null }) {
  return {
    id: genId(),
    title,
    unit: unit || null,
    total: total != null && total !== '' ? Number(total) : null,
    current: 0,
    logs: [],
    days: [],
  }
}

// Migrate older shapes: goals used to carry `steps:[{id,title,days}]`. Convert
// those to habit items (no measurable total) so day-scheduling keeps working.
function normalizeGoal(g) {
  if (Array.isArray(g.items)) {
    return {
      collapsed: false,
      ...g,
      items: g.items.map(it => ({
        id: it.id || genId(),
        title: it.title,
        unit: it.unit ?? null,
        total: it.total != null && it.total !== '' ? Number(it.total) : null,
        current: Number(it.current) || 0,
        logs: Array.isArray(it.logs) ? it.logs : [],
        days: Array.isArray(it.days) ? it.days : [],
      })),
    }
  }
  const items = Array.isArray(g.steps)
    ? g.steps.map(s => ({
        id: s.id || genId(),
        title: s.title,
        unit: null, total: null, current: 0, logs: [],
        days: Array.isArray(s.days) ? s.days : [],
      }))
    : []
  return { id: g.id, title: g.title, deadline: g.deadline ?? null, done: !!g.done, collapsed: false, items }
}

function load() {
  const raw = loadData(KEY, [])
  return Array.isArray(raw) ? raw.map(normalizeGoal) : []
}

export const useLifelongStore = create((set, get) => {
  const commit = (goals) => { saveData(KEY, goals); set({ goals }) }
  const mapGoal = (id, fn) => get().goals.map(g => g.id === id ? fn(g) : g)
  const mapItem = (goalId, itemId, fn) =>
    mapGoal(goalId, g => ({ ...g, items: g.items.map(it => it.id === itemId ? fn(it) : it) }))

  return {
    goals: load(),

    addGoal: (title, deadline) => {
      commit([...get().goals, {
        id: genId(), title, deadline: deadline || null, done: false, collapsed: false, items: [],
      }])
    },

    updateGoal: (id, patch) => commit(mapGoal(id, g => ({ ...g, ...patch }))),

    deleteGoal: (id) => commit(get().goals.filter(g => g.id !== id)),

    toggleCollapsed: (id) => commit(mapGoal(id, g => ({ ...g, collapsed: !g.collapsed }))),

    markGoalDone: (id) => {
      const target = get().goals.find(g => g.id === id)
      if (!target) return
      const active = get().goals.filter(g => g.id !== id && !g.done)
      const completed = get().goals.filter(g => g.id !== id && g.done)
      commit([...active, { ...target, done: true }, ...completed])
    },

    restoreGoal: (id) => {
      const target = get().goals.find(g => g.id === id)
      if (!target) return
      const active = get().goals.filter(g => g.id !== id && !g.done)
      const completed = get().goals.filter(g => g.id !== id && g.done)
      commit([...active, { ...target, done: false }, ...completed])
    },

    addItem: (goalId, { title, unit, total }) =>
      commit(mapGoal(goalId, g => ({ ...g, items: [...g.items, newItem({ title, unit, total })] }))),

    updateItem: (goalId, itemId, patch) =>
      commit(mapItem(goalId, itemId, it => ({ ...it, ...patch }))),

    deleteItem: (goalId, itemId) =>
      commit(mapGoal(goalId, g => ({ ...g, items: g.items.filter(it => it.id !== itemId) }))),

    toggleItemDay: (goalId, itemId, day) =>
      commit(mapItem(goalId, itemId, it => ({
        ...it,
        days: it.days.includes(day) ? it.days.filter(d => d !== day) : [...it.days, day],
      }))),

    // Records an absolute reading (e.g. "now on page 213"). Keeps one log per
    // day (last write wins) and updates `current`.
    logProgress: (goalId, itemId, value, date = todayISO()) =>
      commit(mapItem(goalId, itemId, it => {
        const v = it.total != null ? Math.max(0, Math.min(it.total, Number(value) || 0)) : Math.max(0, Number(value) || 0)
        const logs = [...it.logs.filter(l => l.date !== date), { date, value: v }]
          .sort((a, b) => a.date.localeCompare(b.date))
        return { ...it, current: v, logs }
      })),

    // Convenience for countable items (+1 watched, etc.)
    bumpProgress: (goalId, itemId, by = 1) =>
      commit(mapItem(goalId, itemId, it => {
        const next = (it.current || 0) + by
        const v = it.total != null ? Math.max(0, Math.min(it.total, next)) : Math.max(0, next)
        const date = todayISO()
        const logs = [...it.logs.filter(l => l.date !== date), { date, value: v }]
          .sort((a, b) => a.date.localeCompare(b.date))
        return { ...it, current: v, logs }
      })),
  }
})
