import { describe, it, expect } from 'vitest'
import { computeStreak, journalDates, trainingDates } from './streaks'

describe('computeStreak', () => {
  it('returns zeros for an empty set', () => {
    expect(computeStreak([], '2026-05-16')).toEqual({ current: 0, longest: 0 })
  })

  it('counts a run ending today', () => {
    const { current } = computeStreak(['2026-05-14', '2026-05-15', '2026-05-16'], '2026-05-16')
    expect(current).toBe(3)
  })

  it('keeps the streak alive when today is not yet logged but yesterday is', () => {
    const { current } = computeStreak(['2026-05-14', '2026-05-15'], '2026-05-16')
    expect(current).toBe(2)
  })

  it('breaks the streak when both today and yesterday are missing', () => {
    const { current } = computeStreak(['2026-05-10', '2026-05-11'], '2026-05-16')
    expect(current).toBe(0)
  })

  it('finds the longest historical run', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-02-01']
    expect(computeStreak(dates, '2026-05-16').longest).toBe(3)
  })

  it('handles month boundaries', () => {
    const dates = ['2026-01-30', '2026-01-31', '2026-02-01']
    expect(computeStreak(dates, '2026-02-01').current).toBe(3)
  })

  it('ignores duplicate dates', () => {
    const dates = ['2026-05-15', '2026-05-15', '2026-05-16']
    expect(computeStreak(dates, '2026-05-16').current).toBe(2)
  })
})

describe('date extractors', () => {
  it('journalDates picks submitted or scored entries', () => {
    const entries = [
      { date: 'a', submitted: true, score: null },
      { date: 'b', submitted: false, score: 7 },
      { date: 'c', submitted: false, score: null },
    ]
    expect(journalDates(entries)).toEqual(['a', 'b'])
  })

  it('trainingDates maps log dates with exercises', () => {
    expect(trainingDates([
      { date: 'x', exercises: [{ name: 'Squat' }] },
      { date: 'y', exercises: [{ name: 'Bench' }] },
    ])).toEqual(['x', 'y'])
  })

  it('trainingDates excludes mark-done sessions (0 exercises)', () => {
    const log = [
      { date: '2026-05-10', exercises: [{ name: 'Squat', sets: [] }] },
      { date: '2026-05-11', exercises: [] },
      { date: '2026-05-12', exercises: [{ name: 'Bench', sets: [] }] },
    ]
    expect(trainingDates(log)).toEqual(['2026-05-10', '2026-05-12'])
  })
})
