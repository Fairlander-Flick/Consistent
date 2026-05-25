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

    importEvents: (events, { replace = false } = {}) => {
      const { recurring, oneoffs } = get()
      const nextRecurring = replace
        ? Object.fromEntries(DAYS.map(d => [d, []]))
        : Object.fromEntries(DAYS.map(d => [d, [...(recurring[d] || [])]]))
      const nextOneoffs = replace ? [] : [...oneoffs]

      const seenRecurring = new Set(
        DAYS.flatMap(d => nextRecurring[d].map(b => `${d}|${b.label}|${b.start}|${b.end}`))
      )
      const seenOneoffs = new Set(
        nextOneoffs.map(o => `${o.date}|${o.label}|${o.start}|${o.end}`)
      )

      let added = 0
      let skipped = 0
      for (const ev of events) {
        if (!ev.start || !ev.end || !ev.label) { skipped++; continue }
        if (ev.recurring) {
          const day = ev.weekday
          if (!day || !nextRecurring[day]) { skipped++; continue }
          const key = `${day}|${ev.label}|${ev.start}|${ev.end}`
          if (seenRecurring.has(key)) { skipped++; continue }
          seenRecurring.add(key)
          nextRecurring[day].push({ id: genId(), kind: ev.kind || 'oneoff', label: ev.label, start: ev.start, end: ev.end })
          added++
        } else {
          const key = `${ev.date}|${ev.label}|${ev.start}|${ev.end}`
          if (seenOneoffs.has(key)) { skipped++; continue }
          seenOneoffs.add(key)
          nextOneoffs.push({ id: genId(), date: ev.date, kind: ev.kind || 'oneoff', label: ev.label, start: ev.start, end: ev.end })
          added++
        }
      }

      set(persist(get, { recurring: nextRecurring, oneoffs: nextOneoffs }))
      return { added, skipped }
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
