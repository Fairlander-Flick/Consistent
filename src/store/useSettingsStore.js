import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const KEY = 'consistent:settings'

export const useSettingsStore = create((set, get) => ({
  theme: loadData(KEY, { theme: 'dark' }).theme,
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    saveData(KEY, { theme: next })
    set({ theme: next })
    document.documentElement.setAttribute('data-theme', next)
  },
  init: () => {
    const theme = loadData(KEY, { theme: 'dark' }).theme
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },
}))
