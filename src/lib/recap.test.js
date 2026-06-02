import { describe, it, expect } from 'vitest'
import { periodRecap, monthDates } from './recap'

const activityByDate = new Map([
  ['2026-05-11', 3],
  ['2026-05-12', 1],
  ['2026-05-20', 5], // outside the week below
])

const week = ['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16', '2026-05-17']

describe('periodRecap', () => {
  it('sums completions and active days within the period only', () => {
    const r = periodRecap({ activityByDate, goalPeriod: { todos: [{ done: true }, { done: false }, { done: true }] } }, week)
    expect(r.sessionsDone).toBe(4) // 3 + 1 (the 5 on 05-20 is outside)
    expect(r.activeDays).toBe(2)
    expect(r.goalsDone).toBe(2)
    expect(r.goalsTotal).toBe(3)
  })

  it('returns zeroes when nothing logged', () => {
    const r = periodRecap({ activityByDate: new Map(), goalPeriod: null }, week)
    expect(r.sessionsDone).toBe(0)
    expect(r.activeDays).toBe(0)
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
