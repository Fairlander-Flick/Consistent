import { describe, it, expect } from 'vitest'
import { pearson, trendSeries, sleepScoreInsight, correlationLabel } from './wellbeing'

describe('pearson', () => {
  it('returns null below 3 points', () => {
    expect(pearson([[1, 1], [2, 2]])).toBeNull()
  })

  it('is +1 for a perfect positive line', () => {
    expect(pearson([[1, 2], [2, 4], [3, 6], [4, 8]])).toBeCloseTo(1, 6)
  })

  it('is -1 for a perfect negative line', () => {
    expect(pearson([[1, 8], [2, 6], [3, 4], [4, 2]])).toBeCloseTo(-1, 6)
  })

  it('returns null when one variable is constant', () => {
    expect(pearson([[1, 5], [2, 5], [3, 5]])).toBeNull()
  })
})

describe('trendSeries', () => {
  it('sorts by date and drops null values', () => {
    const entries = [
      { date: '2026-01-03', sleepHours: 7 },
      { date: '2026-01-01', sleepHours: null },
      { date: '2026-01-02', sleepHours: 8 },
    ]
    expect(trendSeries(entries, 'sleepHours')).toEqual([
      { date: '2026-01-02', value: 8 },
      { date: '2026-01-03', value: 7 },
    ])
  })
})

describe('sleepScoreInsight', () => {
  it('splits rested vs short nights and correlates', () => {
    const entries = [
      { sleepHours: 8, score: 9 },
      { sleepHours: 7.5, score: 8 },
      { sleepHours: 5, score: 4 },
      { sleepHours: 6, score: 5 },
      { sleepHours: 9, score: 10 },
      { score: 7 }, // ignored, no sleep
    ]
    const r = sleepScoreInsight(entries)
    expect(r.n).toBe(5)
    expect(r.restedCount).toBe(3)
    expect(r.shortCount).toBe(2)
    expect(r.restedAvg).toBeCloseTo(9, 6)
    expect(r.shortAvg).toBeCloseTo(4.5, 6)
    expect(r.r).toBeGreaterThan(0.8)
  })
})

describe('correlationLabel', () => {
  it('describes strength and direction', () => {
    expect(correlationLabel(null)).toMatch(/not enough/)
    expect(correlationLabel(0.05)).toMatch(/no clear/)
    expect(correlationLabel(0.7)).toMatch(/strong positive/)
    expect(correlationLabel(-0.5)).toMatch(/moderate negative/)
  })
})
