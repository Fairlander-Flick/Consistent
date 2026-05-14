import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const KEY = 'consistent:settings'

const DEFAULT = {
  theme: 'dark',
  confirmGoalDelete: true,
  confirmTxDelete: true,
  confirmJournalDelete: true,
}

function persist(get, patch) {
  const { theme, confirmGoalDelete, confirmTxDelete, confirmJournalDelete } = { ...get(), ...patch }
  saveData(KEY, { theme, confirmGoalDelete, confirmTxDelete, confirmJournalDelete })
}

export const useSettingsStore = create((set, get) => {
  const stored = loadData(KEY, DEFAULT)
  return {
    theme: stored.theme ?? DEFAULT.theme,
    confirmGoalDelete: stored.confirmGoalDelete ?? DEFAULT.confirmGoalDelete,
    confirmTxDelete: stored.confirmTxDelete ?? DEFAULT.confirmTxDelete,
    confirmJournalDelete: stored.confirmJournalDelete ?? DEFAULT.confirmJournalDelete,

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

    setConfirmTxDelete: (val) => {
      persist(get, { confirmTxDelete: val })
      set({ confirmTxDelete: val })
    },

    setConfirmJournalDelete: (val) => {
      persist(get, { confirmJournalDelete: val })
      set({ confirmJournalDelete: val })
    },

    init: () => {
      const s = loadData(KEY, DEFAULT)
      document.documentElement.setAttribute('data-theme', s.theme ?? DEFAULT.theme)
      set({
        theme: s.theme ?? DEFAULT.theme,
        confirmGoalDelete: s.confirmGoalDelete ?? DEFAULT.confirmGoalDelete,
        confirmTxDelete: s.confirmTxDelete ?? DEFAULT.confirmTxDelete,
        confirmJournalDelete: s.confirmJournalDelete ?? DEFAULT.confirmJournalDelete,
      })
    },
  }
})
