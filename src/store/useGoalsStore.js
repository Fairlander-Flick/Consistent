import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'
import { todayISO } from '../lib/dateUtils'

const GOALS_KEY = 'consistent:goals'

const DEFAULT_GOALS = {
  dailyDate: '',
  daily: { title: '', todos: [] },
  weekly: { title: '', todos: [] },
  monthly: { title: '', todos: [] },
  yearly: { title: '', todos: [] },
}

function loadGoals() {
  const stored = loadData(GOALS_KEY, DEFAULT_GOALS)
  const today = todayISO()
  if ((stored.dailyDate || '') !== today) {
    const reset = { ...stored, dailyDate: today, daily: { title: '', todos: [] } }
    saveData(GOALS_KEY, reset)
    return reset
  }
  return stored
}

export const useGoalsStore = create((set, get) => ({
  goals: loadGoals(),

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
