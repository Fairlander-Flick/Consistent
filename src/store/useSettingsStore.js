import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const KEY = 'consistent:settings'

const DEFAULT = {
  theme: 'dark',
  confirmGoalDelete: true,
  weightGoal: null,
  weightTarget: null,
  reminderEnabled: false,
  reminderTime: '20:00',
}

const PERSIST_KEYS = [
  'theme', 'confirmGoalDelete',
  'weightGoal', 'weightTarget', 'reminderEnabled', 'reminderTime',
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
      document.documentElement.setAttribute('data-theme', theme)
      set({ theme })
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
      })
    },
  }
})
