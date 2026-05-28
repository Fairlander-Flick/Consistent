import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const KEY = 'consistent:lifelong'

export const useLifelongStore = create((set, get) => ({
  goals: loadData(KEY, []),

  addGoal: (title, deadline) => {
    const next = [...get().goals, {
      id: Date.now().toString(),
      title,
      deadline: deadline || null,
      done: false,
      steps: [],
    }]
    saveData(KEY, next)
    set({ goals: next })
  },

  updateGoal: (id, patch) => {
    const next = get().goals.map(g => g.id === id ? { ...g, ...patch } : g)
    saveData(KEY, next)
    set({ goals: next })
  },

  deleteGoal: (id) => {
    const next = get().goals.filter(g => g.id !== id)
    saveData(KEY, next)
    set({ goals: next })
  },

  markGoalDone: (id) => {
    const active = get().goals.filter(g => g.id !== id && !g.done)
    const completed = get().goals.filter(g => g.id !== id && g.done)
    const target = get().goals.find(g => g.id === id)
    if (!target) return
    const next = [...active, { ...target, done: true }, ...completed]
    saveData(KEY, next)
    set({ goals: next })
  },

  addStep: (goalId, title, days) => {
    const next = get().goals.map(g =>
      g.id === goalId
        ? { ...g, steps: [...g.steps, { id: Date.now().toString(), title, days }] }
        : g
    )
    saveData(KEY, next)
    set({ goals: next })
  },

  updateStep: (goalId, stepId, patch) => {
    const next = get().goals.map(g =>
      g.id === goalId
        ? { ...g, steps: g.steps.map(s => s.id === stepId ? { ...s, ...patch } : s) }
        : g
    )
    saveData(KEY, next)
    set({ goals: next })
  },

  restoreGoal: (id) => {
    const target = get().goals.find(g => g.id === id)
    if (!target) return
    const active = get().goals.filter(g => g.id !== id && !g.done)
    const completed = get().goals.filter(g => g.id !== id && g.done)
    const next = [...active, { ...target, done: false }, ...completed]
    saveData(KEY, next)
    set({ goals: next })
  },

  deleteStep: (goalId, stepId) => {
    const next = get().goals.map(g =>
      g.id === goalId
        ? { ...g, steps: g.steps.filter(s => s.id !== stepId) }
        : g
    )
    saveData(KEY, next)
    set({ goals: next })
  },
}))
