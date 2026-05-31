import { create } from 'zustand'

// Lightweight toast queue. Toasts stack at a screen corner, auto-dismiss, and
// never shift page layout. Reserve them for actions whose effect isn't already
// visible on screen (e.g. saving a journal entry) — not celebratory noise.
let nextId = 1
const DEFAULT_DURATION = 2800

export const useToastStore = create((set, get) => ({
  toasts: [],

  show: (message, { tone = 'default', duration = DEFAULT_DURATION } = {}) => {
    const id = nextId++
    set(s => ({ toasts: [...s.toasts, { id, message, tone }] }))
    if (duration > 0) setTimeout(() => get().dismiss(id), duration)
    return id
  },

  // Two-phase: flag the toast as leaving so it can animate out, then remove it
  // once the exit transition has run.
  dismiss: (id) => {
    set(s => ({ toasts: s.toasts.map(t => t.id === id ? { ...t, leaving: true } : t) }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 200)
  },
}))

// Convenience for callers that don't need the hook.
export const toast = (message, opts) => useToastStore.getState().show(message, opts)
