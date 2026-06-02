import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

// Workspace "Life Essentials" — fixed weekly time not allocated to goals.
// Shape: { sleepPerDay: <h/day>, factors: [{ id, name, hoursPerWeek }] }
// Local-only in v1 (not in cloudSync); included in local backup.
const KEY = 'consistent:essentials'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

const DEFAULT = { sleepPerDay: 8, factors: [] }

function load() {
  const raw = loadData(KEY, DEFAULT)
  return {
    sleepPerDay: Number(raw?.sleepPerDay ?? DEFAULT.sleepPerDay),
    factors: Array.isArray(raw?.factors) ? raw.factors : [],
  }
}

export const useEssentialsStore = create((set, get) => {
  const commit = (next) => { saveData(KEY, next); set(next) }
  return {
    ...load(),

    setSleepPerDay: (h) => {
      const sleepPerDay = Math.max(0, Math.min(24, Number(h) || 0))
      commit({ sleepPerDay, factors: get().factors })
    },

    addFactor: (name = 'New factor', hoursPerWeek = 0) => {
      const factors = [...get().factors, { id: genId(), name, hoursPerWeek: Number(hoursPerWeek) || 0 }]
      commit({ sleepPerDay: get().sleepPerDay, factors })
    },

    updateFactor: (id, patch) => {
      const factors = get().factors.map(f => {
        if (f.id !== id) return f
        const next = { ...f, ...patch }
        if (patch.hoursPerWeek != null) next.hoursPerWeek = Math.max(0, Number(patch.hoursPerWeek) || 0)
        return next
      })
      commit({ sleepPerDay: get().sleepPerDay, factors })
    },

    removeFactor: (id) => {
      commit({ sleepPerDay: get().sleepPerDay, factors: get().factors.filter(f => f.id !== id) })
    },
  }
})
