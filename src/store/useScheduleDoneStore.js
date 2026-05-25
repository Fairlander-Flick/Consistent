import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const KEY = 'consistent:schedule-done'

// Per-day done state for calendar-derived todos.
// Shape: { 'YYYY-MM-DD': { 'label|start|end': true } }
// Each day is independent: recurring blocks re-appear unchecked the next day.

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
