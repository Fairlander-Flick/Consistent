import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'
import { todayISO, getWeekStart } from '../lib/dateUtils'

const GOALS_KEY = 'consistent:goals'

const DEFAULT_GOALS = {
  dailyDate: '',
  weeklyDate: '',
  monthlyDate: '',
  yearlyDate: '',
  daily: { title: '', todos: [] },
  weekly: { title: '', todos: [] },
  monthly: { title: '', todos: [] },
  yearly: { title: '', todos: [] },
}

function loadGoals() {
  const stored = loadData(GOALS_KEY, DEFAULT_GOALS)
  const today = todayISO()
  const weekKey = getWeekStart().toISOString().slice(0, 10)
  const monthKey = today.slice(0, 7)
  const yearKey = today.slice(0, 4)

  let next = stored
  if ((stored.dailyDate || '') !== today)
    next = { ...next, dailyDate: today, daily: { title: '', todos: [] } }
  if ((stored.weeklyDate || '') !== weekKey)
    next = { ...next, weeklyDate: weekKey, weekly: { title: '', todos: [] } }
  if ((stored.monthlyDate || '') !== monthKey)
    next = { ...next, monthlyDate: monthKey, monthly: { title: '', todos: [] } }
  if ((stored.yearlyDate || '') !== yearKey)
    next = { ...next, yearlyDate: yearKey, yearly: { title: '', todos: [] } }

  if (next !== stored) saveData(GOALS_KEY, next)
  return next
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
