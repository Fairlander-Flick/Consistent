import { describe, it, expect } from 'vitest'
import { QUOTES, getQuoteOfDay } from './quotes'

describe('QUOTES', () => {
  it('contains at least 10 entries', () => {
    expect(QUOTES.length).toBeGreaterThanOrEqual(10)
  })
  it('every entry has text and author', () => {
    for (const q of QUOTES) {
      expect(typeof q.text).toBe('string')
      expect(q.text.length).toBeGreaterThan(0)
      expect(typeof q.author).toBe('string')
      expect(q.author.length).toBeGreaterThan(0)
    }
  })
})

describe('getQuoteOfDay', () => {
  it('returns the same quote for the same date', () => {
    const d = new Date('2026-05-26T10:00:00Z')
    const a = getQuoteOfDay(d)
    const b = getQuoteOfDay(d)
    expect(a).toBe(b)
  })
  it('returns the same quote for any time on the same UTC day', () => {
    const morning = getQuoteOfDay(new Date('2026-05-26T00:00:01Z'))
    const evening = getQuoteOfDay(new Date('2026-05-26T23:59:59Z'))
    expect(morning).toBe(evening)
  })
  it('selection is one of QUOTES', () => {
    const q = getQuoteOfDay(new Date('2026-05-26T10:00:00Z'))
    expect(QUOTES).toContain(q)
  })
  it('different days can yield different quotes across a week', () => {
    const days = ['2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29',
                  '2026-05-30', '2026-05-31', '2026-06-01']
    const picks = new Set(days.map(d => getQuoteOfDay(new Date(d + 'T12:00:00Z'))))
    expect(picks.size).toBeGreaterThanOrEqual(2)
  })
  it('defaults to current date when no argument given', () => {
    const q = getQuoteOfDay()
    expect(QUOTES).toContain(q)
  })
})
