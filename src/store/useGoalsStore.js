import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'
import { todayISO, getWeekStart } from '../lib/dateUtils'

const GOALS_KEY     = 'consistent:goals'
const GOALS_LOG_KEY = 'consistent:goals-log'

const DEFAULT_GOALS = {
  dailyDate: '',
  weeklyDate: '',
  monthlyDate: '',
  yearlyDate: '',
  daily:   { title: '', todos: [] },
  weekly:  { title: '', todos: [] },
  monthly: { title: '', todos: [] },
  yearly:  { title: '', todos: [] },
}

const DEFAULT_LOG = {
  daily:   {},
  weekly:  {},
  monthly: {},
  yearly:  {},
}

function isoFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hasContent(data) {
  return (data?.todos?.length ?? 0) > 0 || !!data?.title
}

function loadGoalsAndLog() {
  const stored = loadData(GOALS_KEY, DEFAULT_GOALS)
  const log    = loadData(GOALS_LOG_KEY, DEFAULT_LOG)

  const today    = todayISO()
  const weekKey  = isoFromDate(getWeekStart())
  const monthKey = today.slice(0, 7)
  const yearKey  = today.slice(0, 4)

  let goals    = stored
  let goalsLog = log

  const checks = [
    { period: 'daily',   keyField: 'dailyDate',   currentKey: today },
    { period: 'weekly',  keyField: 'weeklyDate',  currentKey: weekKey },
    { period: 'monthly', keyField: 'monthlyDate', currentKey: monthKey },
    { period: 'yearly',  keyField: 'yearlyDate',  currentKey: yearKey },
  ]

  for (const { period, keyField, currentKey } of checks) {
    const storedKey = stored[keyField] || ''
    if (storedKey !== currentKey) {
      // Archive before wiping
      if (storedKey && hasContent(stored[period])) {
        goalsLog = {
          ...goalsLog,
          [period]: { ...(goalsLog[period] || {}), [storedKey]: stored[period] },
        }
      }
      goals = { ...goals, [keyField]: currentKey, [period]: { title: '', todos: [] } }
    }
  }

  if (goals    !== stored) saveData(GOALS_KEY,     goals)
  if (goalsLog !== log)    saveData(GOALS_LOG_KEY,  goalsLog)

  return { goals, goalsLog }
}

const { goals: initialGoals, goalsLog: initialLog } = loadGoalsAndLog()

export const useGoalsStore = create((set, get) => ({
  goals:    initialGoals,
  goalsLog: initialLog,

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
