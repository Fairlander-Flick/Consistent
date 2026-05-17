import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'
import { todayISO } from '../lib/dateUtils'

const KEY = 'consistent:journal'

const EMPTY_ENTRY = (date) => ({
  date,
  feelings: null,
  score: null,
  sleepHours: null,
  nutrition: null,
  submitted: false,
})

function upsertToday(entries, update) {
  const today = todayISO()
  const existing = entries.find(e => e.date === today)
  if (existing) {
    return entries.map(e => e.date === today ? { ...e, ...update } : e)
  }
  return [...entries, { ...EMPTY_ENTRY(today), ...update }]
}

export const useJournalStore = create((set, get) => ({
  entries: loadData(KEY, []),

  getTodayEntry: () => {
    const today = todayISO()
    return get().entries.find(e => e.date === today) || EMPTY_ENTRY(today)
  },

  setTodayFeelings: (feelings) => {
    const next = upsertToday(get().entries, { feelings })
    saveData(KEY, next)
    set({ entries: next })
  },

  setTodayScore: (score) => {
    const next = upsertToday(get().entries, { score })
    saveData(KEY, next)
    set({ entries: next })
  },

  setTodaySleepHours: (sleepHours) => {
    const next = upsertToday(get().entries, { sleepHours })
    saveData(KEY, next)
    set({ entries: next })
  },

  setTodayNutrition: (nutrition) => {
    const next = upsertToday(get().entries, { nutrition })
    saveData(KEY, next)
    set({ entries: next })
  },

  submitToday: ({ score, sleepHours, nutrition, feelings }) => {
    const next = upsertToday(get().entries, { score, sleepHours, nutrition, feelings, submitted: true })
    saveData(KEY, next)
    set({ entries: next })
  },

  editToday: () => {
    const next = upsertToday(get().entries, { submitted: false })
    saveData(KEY, next)
    set({ entries: next })
  },

}))
