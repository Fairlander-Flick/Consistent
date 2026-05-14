import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'
import { todayISO } from '../lib/dateUtils'

const KEY = 'consistent:journal'

const EMPTY_ENTRY = (date) => ({
  date,
  todos: [],
  feelings: null,
  score: null,
  sleepHours: null,
  nutrition: null,
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

  addTodayTodo: (text) => {
    const today = todayISO()
    const entries = get().entries
    const existing = entries.find(e => e.date === today)
    const todo = { id: Date.now().toString(), text, done: false }
    const next = existing
      ? entries.map(e => e.date === today ? { ...e, todos: [...e.todos, todo] } : e)
      : [...entries, { ...EMPTY_ENTRY(today), todos: [todo] }]
    saveData(KEY, next)
    set({ entries: next })
  },

  toggleTodayTodo: (id) => {
    const today = todayISO()
    const next = get().entries.map(e =>
      e.date === today
        ? { ...e, todos: e.todos.map(t => t.id === id ? { ...t, done: !t.done } : t) }
        : e
    )
    saveData(KEY, next)
    set({ entries: next })
  },

  deleteTodayTodo: (id) => {
    const today = todayISO()
    const next = get().entries.map(e =>
      e.date === today
        ? { ...e, todos: e.todos.filter(t => t.id !== id) }
        : e
    )
    saveData(KEY, next)
    set({ entries: next })
  },
}))
