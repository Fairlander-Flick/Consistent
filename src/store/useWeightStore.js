import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const KEY = 'consistent:weight'

export const useWeightStore = create((set, get) => ({
  entries: loadData(KEY, []),
  addEntry: (date, kg) => {
    const existing = get().entries.filter(e => e.date !== date)
    const next = [...existing, { date, kg: parseFloat(kg) }]
      .sort((a, b) => b.date.localeCompare(a.date))
    saveData(KEY, next)
    set({ entries: next })
  },
  deleteEntry: (date) => {
    const next = get().entries.filter(e => e.date !== date)
    saveData(KEY, next)
    set({ entries: next })
  },
}))
