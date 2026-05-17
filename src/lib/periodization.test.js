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

import { computeWeight, weeklyPreview } from './periodization'

const SQUAT = { trainingMax: 173.9, multipliers: [0.8193, 0.861, 0.9027], currentWeek: 1 }
const BENCH = { trainingMax: 116, multipliers: [0.8193, 0.861, 0.9027], currentWeek: 1 }

describe('computeWeight', () => {
  it('uses the real squat numbers (TM 173.9)', () => {
    expect(computeWeight({ ...SQUAT, currentWeek: 1 })).toBe(142.5)
    expect(computeWeight({ ...SQUAT, currentWeek: 2 })).toBe(150)
    expect(computeWeight({ ...SQUAT, currentWeek: 3 })).toBe(157.5)
  })
  it('works for bench multipliers likewise (TM 116)', () => {
    expect(computeWeight({ ...BENCH, currentWeek: 1 })).toBe(95)
    expect(computeWeight({ ...BENCH, currentWeek: 2 })).toBe(100)
    expect(computeWeight({ ...BENCH, currentWeek: 3 })).toBe(105)
  })
  it('returns 0 for missing/invalid periodization', () => {
    expect(computeWeight(null)).toBe(0)
    expect(computeWeight({ trainingMax: 0, multipliers: [1], currentWeek: 1 })).toBe(0)
  })
})

describe('weeklyPreview', () => {
  it('returns the three weekly weights regardless of currentWeek', () => {
    expect(weeklyPreview(SQUAT)).toEqual([142.5, 150, 157.5])
    expect(weeklyPreview({ ...SQUAT, currentWeek: 3 })).toEqual([142.5, 150, 157.5])
  })
  it('returns [0,0,0] for missing periodization', () => {
    expect(weeklyPreview(null)).toEqual([0, 0, 0])
  })
})

import { exerciseType, isCardio, isPeriodized, resolveProgramSets } from './periodization'

const manual = { id: '1', name: 'Curl', sets: [{ reps: 12, weight: 16 }] }
const periodized = {
  id: '2', name: 'Squat', type: 'strength',
  periodization: { trainingMax: 173.9, multipliers: [0.8193, 0.861, 0.9027], currentWeek: 2 },
  sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }],
}
const cardio = { id: '3', name: 'Bike', type: 'cardio', durationMinutes: 20 }

describe('exerciseType / isCardio / isPeriodized', () => {
  it('treats a missing type as strength', () => {
    expect(exerciseType(manual)).toBe('strength')
    expect(isCardio(manual)).toBe(false)
    expect(isPeriodized(manual)).toBe(false)
  })
  it('detects cardio', () => {
    expect(exerciseType(cardio)).toBe('cardio')
    expect(isCardio(cardio)).toBe(true)
    expect(isPeriodized(cardio)).toBe(false)
  })
  it('detects periodized strength', () => {
    expect(isPeriodized(periodized)).toBe(true)
    expect(isCardio(periodized)).toBe(false)
  })
})

describe('resolveProgramSets', () => {
  it('fills the computed weight for periodized exercises (week 2 -> 150)', () => {
    expect(resolveProgramSets(periodized)).toEqual([
      { reps: 5, weight: 150 }, { reps: 5, weight: 150 }, { reps: 5, weight: 150 },
    ])
  })
  it('passes manual sets through unchanged (cloned)', () => {
    const r = resolveProgramSets(manual)
    expect(r).toEqual([{ reps: 12, weight: 16 }])
    expect(r[0]).not.toBe(manual.sets[0])
  })
  it('yields no sets for cardio', () => {
    expect(resolveProgramSets(cardio)).toEqual([])
  })
})
