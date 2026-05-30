import { describe, it, expect } from 'vitest'
import { buildWeek, weekdayKeyFor } from './weekPlanner'

// 2026-05-25 is a Monday → its week is Mon 05-25 … Sun 05-31.
const MON = '2026-05-25'
const WED = '2026-05-27'

const lifelongGoals = [
  {
    id: 'g1', title: 'Math', done: false, items: [
      { id: 'i1', title: 'Read book', days: ['Mon', 'Wed'] },
      { id: 'i2', title: 'Attend class', days: ['Tue', 'Thu'] },
    ],
  },
  { id: 'g2', title: 'Archived', done: true, items: [{ id: 'i3', title: 'x', days: ['Mon'] }] },
]

const dailyGoals = {
  dailyDate: WED,
  daily: { title: '', todos: [{ id: 't1', text: 'Buy milk', done: false }] },
}

const goalsLog = {
  daily: { [MON]: { todos: [{ id: 't0', text: 'Old task', done: true }] } },
}

const doneMap = { [WED]: { 'lifelong|i1': true } }

function week() {
  return buildWeek({ refDate: WED, lifelongGoals, dailyGoals, goalsLog, doneMap, today: WED })
}

describe('weekdayKeyFor', () => {
  it('maps ISO dates to Mon..Sun', () => {
    expect(weekdayKeyFor(MON)).toBe('Mon')
    expect(weekdayKeyFor(WED)).toBe('Wed')
    expect(weekdayKeyFor('2026-05-31')).toBe('Sun')
  })
})

describe('buildWeek', () => {
  it('returns 7 days starting Monday', () => {
    const w = week()
    expect(w).toHaveLength(7)
    expect(w[0].weekday).toBe('Mon')
    expect(w[0].date).toBe(MON)
    expect(w[6].weekday).toBe('Sun')
  })

  it('places recurring lifelong items on their scheduled weekdays', () => {
    const w = week()
    const mon = w[0].items.filter(it => it.source === 'lifelong').map(it => it.label)
    const tue = w[1].items.filter(it => it.source === 'lifelong').map(it => it.label)
    expect(mon).toContain('Read book')
    expect(tue).toContain('Attend class')
    expect(mon).not.toContain('Attend class')
  })

  it('skips items from goals marked done', () => {
    const w = week()
    const allLabels = w.flatMap(d => d.items.map(it => it.label))
    expect(allLabels).not.toContain('x')
  })

  it('shows live daily todos only on today and archived ones on past days', () => {
    const w = week()
    expect(w[2].items.some(it => it.source === 'daily' && it.label === 'Buy milk' && it.live)).toBe(true)
    expect(w[0].items.some(it => it.source === 'daily' && it.label === 'Old task' && it.done)).toBe(true)
    // future days get no daily todos
    expect(w[4].items.filter(it => it.source === 'daily')).toHaveLength(0)
  })

  it('reflects per-date done state for lifelong items', () => {
    const w = week()
    const wed = w[2]
    expect(wed.isToday).toBe(true)
    const readBook = wed.items.find(it => it.itemId === 'i1')
    expect(readBook.done).toBe(true)
    expect(wed.doneCount).toBe(1)
  })

  it('counts totals per day', () => {
    const w = week()
    expect(w[0].total).toBe(2) // Read book + archived Old task
    expect(w[5].total).toBe(0) // Saturday empty
  })
})
