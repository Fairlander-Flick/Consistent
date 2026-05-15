import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const GOALS_KEY = 'consistent:goals'
const HISTORY_KEY = 'consistent:goals-history'

const DEFAULT_GOALS = {
  daily: { title: '', todos: [] },
  weekly: { title: '', todos: [] },
  monthly: { title: '', todos: [] },
  yearly: { title: '', todos: [] },
}

export const useGoalsStore = create((set, get) => ({
  goals: loadData(GOALS_KEY, DEFAULT_GOALS),
  history: loadData(HISTORY_KEY, []),

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

  isCompleted: (period) => {
    const { todos } = get().goals[period]
    return todos.length > 0 && todos.every(t => t.done)
  },

  recordHistory: (period, date, completed) => {
    const existing = get().history.filter(h => !(h.date === date && h.period === period))
    const history = [...existing, { date, period, completed }]
    saveData(HISTORY_KEY, history)
    set({ history })
  },
}))
