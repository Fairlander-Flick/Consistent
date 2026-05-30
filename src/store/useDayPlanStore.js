import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

// One-off todos planned for a specific calendar date (past, today, or future).
// Shape: { 'YYYY-MM-DD': { todos: [{ id, text, done }] } }
const KEY = 'consistent:dayplan'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function load() {
  const raw = loadData(KEY, {})
  return raw && typeof raw === 'object' ? raw : {}
}

export const useDayPlanStore = create((set, get) => {
  const commit = (byDate) => { saveData(KEY, byDate); set({ byDate }) }
  const todosOf = (byDate, date) => byDate[date]?.todos ?? []

  return {
    byDate: load(),

    todosFor: (date) => get().byDate[date]?.todos ?? [],

    addTodo: (date, text) => {
      const t = text.trim()
      if (!t) return
      const byDate = get().byDate
      const todos = [...todosOf(byDate, date), { id: genId(), text: t, done: false }]
      commit({ ...byDate, [date]: { todos } })
    },

    toggleTodo: (date, id) => {
      const byDate = get().byDate
      const todos = todosOf(byDate, date).map(t => t.id === id ? { ...t, done: !t.done } : t)
      commit({ ...byDate, [date]: { todos } })
    },

    deleteTodo: (date, id) => {
      const byDate = get().byDate
      const todos = todosOf(byDate, date).filter(t => t.id !== id)
      const next = { ...byDate, [date]: { todos } }
      if (todos.length === 0) delete next[date]
      commit(next)
    },
  }
})
