import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'
import { todayISO } from '../lib/dateUtils'

const KEY = 'consistent:journal'

export const useJournalStore = create((set, get) => ({
  entries: loadData(KEY, []),

  getTodayEntry: () => {
    const today = todayISO()
    return get().entries.find(e => e.date === today) || { date: today, todos: [] }
  },

  addTodayTodo: (text) => {
    const today = todayISO()
    const entries = get().entries
    const existing = entries.find(e => e.date === today)
    const todo = { id: Date.now().toString(), text, done: false }
    let next
    if (existing) {
      next = entries.map(e =>
        e.date === today ? { ...e, todos: [...e.todos, todo] } : e
      )
    } else {
      next = [...entries, { date: today, todos: [todo] }]
    }
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
