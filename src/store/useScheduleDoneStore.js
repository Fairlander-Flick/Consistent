import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

// Storage key is legacy ('schedule-done') and kept as-is so existing data survives.
const KEY = 'consistent:schedule-done'

// Per-day done state for the ephemeral daily todos surfaced in the Goals card
// (the recurring steps of lifelong goals).
// Shape: { 'YYYY-MM-DD': { '<todo-key>': true } }
// Each day is independent: a recurring step re-appears unchecked the next day.

export const useScheduleDoneStore = create((set, get) => ({
  done: loadData(KEY, {}),

  toggle: (date, key) => {
    const dayMap = { ...(get().done[date] || {}) }
    if (dayMap[key]) delete dayMap[key]
    else dayMap[key] = true
    const next = { ...get().done }
    if (Object.keys(dayMap).length === 0) delete next[date]
    else next[date] = dayMap
    saveData(KEY, next)
    set({ done: next })
  },

  isDone: (date, key) => !!get().done[date]?.[key],

  doneCountForDate: (date) => Object.keys(get().done[date] || {}).length,
}))
