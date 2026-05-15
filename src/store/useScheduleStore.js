import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const KEY = 'consistent:schedule'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DEFAULT = {
  recurring: Object.fromEntries(DAYS.map(d => [d, []])),
  oneoffs: [],
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function weekdayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return DAYS[(d.getDay() + 6) % 7]
}

function persist(get, patch) {
  const next = {
    recurring: get().recurring,
    oneoffs: get().oneoffs,
    ...patch,
  }
  saveData(KEY, { recurring: next.recurring, oneoffs: next.oneoffs })
  return next
}

export const useScheduleStore = create((set, get) => {
  const stored = loadData(KEY, DEFAULT)
  return {
    recurring: { ...DEFAULT.recurring, ...(stored.recurring || {}) },
    oneoffs: stored.oneoffs || [],

    addRecurringBlock: (day, { kind, label, start, end }) => {
      const block = { id: genId(), kind, label, start, end }
      const recurring = { ...get().recurring, [day]: [...get().recurring[day], block] }
      set(persist(get, { recurring }))
    },

    updateRecurringBlock: (day, id, patch) => {
      const recurring = {
        ...get().recurring,
        [day]: get().recurring[day].map(b => b.id === id ? { ...b, ...patch } : b),
      }
      set(persist(get, { recurring }))
    },

    removeRecurringBlock: (day, id) => {
      const recurring = {
        ...get().recurring,
        [day]: get().recurring[day].filter(b => b.id !== id),
      }
      set(persist(get, { recurring }))
    },

    addOneoff: ({ date, kind, label, start, end }) => {
      const oneoffs = [...get().oneoffs, { id: genId(), date, kind, label, start, end }]
      set(persist(get, { oneoffs }))
    },

    removeOneoff: (id) => {
      const oneoffs = get().oneoffs.filter(o => o.id !== id)
      set(persist(get, { oneoffs }))
    },

    weekBlocks: (weekDates) => {
      const { recurring, oneoffs } = get()
      return weekDates.map(date => {
        const rec = (recurring[weekdayKey(date)] || []).map(b => ({ ...b, source: 'recurring' }))
        const one = oneoffs
          .filter(o => o.date === date)
          .map(o => ({ id: o.id, kind: o.kind, label: o.label, start: o.start, end: o.end, source: 'oneoff' }))
        return [...rec, ...one]
      })
    },
  }
})
