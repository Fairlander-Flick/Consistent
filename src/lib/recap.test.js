import { describe, it, expect } from 'vitest'
import { periodRecap, monthDates } from './recap'

const data = {
  log: [
    { date: '2026-05-11', durationMinutes: 60, exercises: [{ name: 'Squat', sets: [{ reps: 5, weight: 100 }] }] },
    { date: '2026-05-13', durationMinutes: 45, exercises: [{ name: 'Bench', sets: [{ reps: 5, weight: 80 }] }] },
    { date: '2026-04-30', durationMinutes: 30, exercises: [{ name: 'DL', sets: [] }] }, // out of week
  ],
  journalEntries: [
    { date: '2026-05-11', sleepHours: 8, score: 9 },
    { date: '2026-05-12', sleepHours: 6, score: 5 },
    { date: '2026-05-12', score: null, sleepHours: null },
  ],
  transactions: [
    { date: '2026-05-11', type: 'expense', amount: 40 },
    { date: '2026-05-12', type: 'income', amount: 100 },
    { date: '2026-04-01', type: 'expense', amount: 999 }, // out of week
  ],
  goalPeriod: { todos: [{ done: true }, { done: false }, { done: true }] },
}

const week = ['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16', '2026-05-17']

describe('periodRecap', () => {
  it('aggregates only entries within the period', () => {
    const r = periodRecap(data, week)
    expect(r.trainingCount).toBe(2)
    expect(r.trainingMinutes).toBe(105)
    expect(r.sleepAvg).toBeCloseTo(7, 6)
    expect(r.moodAvg).toBeCloseTo(7, 6)
    expect(r.spend).toBe(40)
    expect(r.income).toBe(100)
    expect(r.net).toBe(60)
    expect(r.goalsDone).toBe(2)
    expect(r.goalsTotal).toBe(3)
  })

  it('returns null averages when nothing logged', () => {
    const r = periodRecap({ log: [], journalEntries: [], transactions: [], goalPeriod: null }, week)
    expect(r.sleepAvg).toBeNull()
    expect(r.moodAvg).toBeNull()
    expect(r.goalsTotal).toBe(0)
    expect(r.trainingCount).toBe(0)
  })

  it('excludes mark-done sessions from trainingCount', () => {
    const dates = ['2026-05-10', '2026-05-11']
    const log = [
      { date: '2026-05-10', exercises: [{ name: 'Squat', sets: [{ reps: 5, weight: 100 }] }], durationMinutes: 0 },
      { date: '2026-05-11', exercises: [], durationMinutes: 0 },
    ]
    const r = periodRecap({ log, journalEntries: [], transactions: [], goalPeriod: null }, dates)
    expect(r.trainingCount).toBe(1)
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
