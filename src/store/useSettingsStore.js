import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const KEY = 'consistent:settings'

const DEFAULT_DASHBOARD_CARDS = {
  recap: true, week: true, weight: true, pursuits: true, free: true, consistency: true,
}

const DEFAULT = {
  theme: 'dark',
  confirmGoalDelete: true,
  weightGoal: null,
  weightTarget: null,
  reminderEnabled: false,
  reminderTime: '20:00',
  dashboardCards: DEFAULT_DASHBOARD_CARDS,
}

const PERSIST_KEYS = [
  'theme', 'confirmGoalDelete',
  'weightGoal', 'weightTarget', 'reminderEnabled', 'reminderTime',
  'dashboardCards',
]

function persist(get, patch) {
  const merged = { ...get(), ...patch }
  const out = {}
  PERSIST_KEYS.forEach(k => { out[k] = merged[k] })
  saveData(KEY, out)
}

export const useSettingsStore = create((set, get) => {
  const stored = loadData(KEY, DEFAULT)
  return {
    theme: stored.theme ?? DEFAULT.theme,
    confirmGoalDelete: stored.confirmGoalDelete ?? DEFAULT.confirmGoalDelete,
    weightGoal: stored.weightGoal ?? DEFAULT.weightGoal,
    weightTarget: stored.weightTarget ?? DEFAULT.weightTarget,
    reminderEnabled: stored.reminderEnabled ?? DEFAULT.reminderEnabled,
    reminderTime: stored.reminderTime ?? DEFAULT.reminderTime,
    dashboardCards: { ...DEFAULT_DASHBOARD_CARDS, ...(stored.dashboardCards ?? {}) },

    setDashboardCard: (key, on) => {
      const dashboardCards = { ...get().dashboardCards, [key]: on }
      persist(get, { dashboardCards })
      set({ dashboardCards })
    },

    setWeightGoal: (val) => {
      persist(get, { weightGoal: val })
      set({ weightGoal: val })
    },

    setWeightTarget: (val) => {
      const n = val === null || val === '' ? null : parseFloat(val)
      const weightTarget = n != null && !isNaN(n) && n > 0 ? n : null
      persist(get, { weightTarget })
      set({ weightTarget })
    },

    setReminderEnabled: (val) => {
      persist(get, { reminderEnabled: val })
      set({ reminderEnabled: val })
    },

    setReminderTime: (val) => {
      persist(get, { reminderTime: val })
      set({ reminderTime: val })
    },

    toggleTheme: () => {
      const theme = get().theme === 'dark' ? 'light' : 'dark'
      persist(get, { theme })
      // Flip is purely CSS-variable driven (data-theme on <html>), so the colour
      // change is instant in the DOM; we wrap it in a View Transition so the
      // browser GPU-composites one smooth crossfade instead of repainting the
      // whole tree (which janked, especially in light mode).
      const apply = () => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      }
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (document.startViewTransition && !reduce) {
        document.startViewTransition(apply)
      } else {
        apply()
      }
    },

    setConfirmGoalDelete: (val) => {
      persist(get, { confirmGoalDelete: val })
      set({ confirmGoalDelete: val })
    },

    init: () => {
      const s = loadData(KEY, DEFAULT)
      document.documentElement.setAttribute('data-theme', s.theme ?? DEFAULT.theme)
      set({
        theme: s.theme ?? DEFAULT.theme,
        confirmGoalDelete: s.confirmGoalDelete ?? DEFAULT.confirmGoalDelete,
        weightGoal: s.weightGoal ?? DEFAULT.weightGoal,
        weightTarget: s.weightTarget ?? DEFAULT.weightTarget,
        reminderEnabled: s.reminderEnabled ?? DEFAULT.reminderEnabled,
        reminderTime: s.reminderTime ?? DEFAULT.reminderTime,
        dashboardCards: { ...DEFAULT_DASHBOARD_CARDS, ...(s.dashboardCards ?? {}) },
      })
    },
  }
})
