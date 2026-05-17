import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const GOALS_KEY = 'consistent:goals'

const DEFAULT_GOALS = {
  daily: { title: '', todos: [] },
  weekly: { title: '', todos: [] },
  monthly: { title: '', todos: [] },
  yearly: { title: '', todos: [] },
}

export const useGoalsStore = create((set, get) => ({
  goals: loadData(GOALS_KEY, DEFAULT_GOALS),

  setTitle: (period, title) => {
    const goals = { ...get().goals, [period]: { ...get().goals[period], title } }
    saveData(GOALS_KEY, goals)
    set({ goals })
  },

  addTodo: (period, text) => {
    const id = Date.now().toString()
    const todos = [...get().goals[period].todos, { id, text, done: false }]
    const goals = { ...get().goals, [period]: { ...get().goals[period], todos } }
    saveData(GOALS_KEY, goals)
    set({ goals })
  },

  toggleTodo: (period, id) => {
    const todos = get().goals[period].todos.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    )
    const goals = { ...get().goals, [period]: { ...get().goals[period], todos } }
    saveData(GOALS_KEY, goals)
    set({ goals })
  },

  deleteTodo: (period, id) => {
    const todos = get().goals[period].todos.filter(t => t.id !== id)
    const goals = { ...get().goals, [period]: { ...get().goals[period], todos } }
    saveData(GOALS_KEY, goals)
    set({ goals })
  },

  replacePeriod: (period, data) => {
    const goals = { ...get().goals, [period]: data }
    saveData(GOALS_KEY, goals)
    set({ goals })
  },

}))
