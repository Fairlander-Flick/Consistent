import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'
import { todayISO } from '../lib/dateUtils'

const PROGRAM_KEY = 'consistent:training-program'
const LOG_KEY = 'consistent:training-log'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DEFAULT_PROGRAM = Object.fromEntries(
  DAYS.map(d => [d, { name: '', exercises: [] }])
)

export const useTrainingStore = create((set, get) => ({
  program: loadData(PROGRAM_KEY, DEFAULT_PROGRAM),
  log: loadData(LOG_KEY, []),

  setDayName: (day, name) => {
    const program = { ...get().program, [day]: { ...get().program[day], name } }
    saveData(PROGRAM_KEY, program)
    set({ program })
  },

  addExercise: (day, exerciseName) => {
    const exercise = { id: Date.now().toString(), name: exerciseName, sets: [] }
    const exercises = [...get().program[day].exercises, exercise]
    const program = { ...get().program, [day]: { ...get().program[day], exercises } }
    saveData(PROGRAM_KEY, program)
    set({ program })
  },

  addSet: (day, exerciseId, reps, weight) => {
    const exercises = get().program[day].exercises.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: [...ex.sets, { reps: parseInt(reps), weight: parseFloat(weight) }] }
        : ex
    )
    const program = { ...get().program, [day]: { ...get().program[day], exercises } }
    saveData(PROGRAM_KEY, program)
    set({ program })
  },

  removeExercise: (day, exerciseId) => {
    const exercises = get().program[day].exercises.filter(ex => ex.id !== exerciseId)
    const program = { ...get().program, [day]: { ...get().program[day], exercises } }
    saveData(PROGRAM_KEY, program)
    set({ program })
  },

  logSession: (date, exercises) => {
    const existing = get().log.filter(l => l.date !== date)
    const next = [...existing, { date, exercises }].sort((a, b) => b.date.localeCompare(a.date))
    saveData(LOG_KEY, next)
    set({ log: next })
  },

  getSessionForDate: (date) => get().log.find(l => l.date === date) || null,

  isWorkedOut: (date) => !!get().log.find(l => l.date === date),
}))
