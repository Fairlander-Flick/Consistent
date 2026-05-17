import { describe, it, expect } from 'vitest'
import { roundToNearest, nextWeek } from './periodization'

describe('roundToNearest', () => {
  it('rounds to the nearest 2.5 by default', () => {
    expect(roundToNearest(142.47627)).toBe(142.5)
    expect(roundToNearest(149.7279)).toBe(150)
    expect(roundToNearest(156.97953)).toBe(157.5)
  })
  it('breaks ties away from zero', () => {
    expect(roundToNearest(1.25)).toBe(2.5)
    expect(roundToNearest(-1.25)).toBe(-2.5)
  })
  it('accepts a custom step', () => {
    expect(roundToNearest(103, 5)).toBe(105)
  })
})

describe('nextWeek', () => {
  it('advances 1 -> 2 -> 3 -> 1', () => {
    expect(nextWeek(1)).toBe(2)
    expect(nextWeek(2)).toBe(3)
    expect(nextWeek(3)).toBe(1)
  })
})
