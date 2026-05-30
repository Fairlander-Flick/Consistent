import { describe, it, expect } from 'vitest'
import { periodRecap, monthDates } from './recap'

const data = {
  journalEntries: [
    { date: '2026-05-11', sleepHours: 8, score: 9 },
    { date: '2026-05-12', sleepHours: 6, score: 5 },
    { date: '2026-05-12', score: null, sleepHours: null },
  ],
  goalPeriod: { todos: [{ done: true }, { done: false }, { done: true }] },
}

const week = ['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16', '2026-05-17']

describe('periodRecap', () => {
  it('aggregates only entries within the period', () => {
    const r = periodRecap(data, week)
    expect(r.sleepAvg).toBeCloseTo(7, 6)
    expect(r.moodAvg).toBeCloseTo(7, 6)
    expect(r.goalsDone).toBe(2)
    expect(r.goalsTotal).toBe(3)
  })

  it('returns null averages when nothing logged', () => {
    const r = periodRecap({ journalEntries: [], goalPeriod: null }, week)
    expect(r.sleepAvg).toBeNull()
    expect(r.moodAvg).toBeNull()
    expect(r.goalsTotal).toBe(0)
  })
})

describe('monthDates', () => {
  it('returns every day of the month', () => {
    const feb = monthDates(2026, 1) // Feb 2026, 28 days
    expect(feb).toHaveLength(28)
    expect(feb[0]).toBe('2026-02-01')
    expect(feb[27]).toBe('2026-02-28')
  })

  it('handles 31-day months', () => {
    expect(monthDates(2026, 0)).toHaveLength(31) // January
  })
})
