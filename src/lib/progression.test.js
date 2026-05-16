import { describe, it, expect } from 'vitest'
import { epley1RM, listExercises, exerciseProgression, personalRecords } from './progression'

const log = [
  { date: '2026-01-10', exercises: [
    { name: 'Squat', sets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 100 }] },
    { name: 'Bench', sets: [{ reps: 8, weight: 60 }] },
  ] },
  { date: '2026-01-17', exercises: [
    { name: 'Squat', sets: [{ reps: 5, weight: 110 }, { reps: 3, weight: 120 }] },
  ] },
  { date: '2026-01-24', exercises: [
    { name: 'Squat', sets: [{ reps: 0, weight: 0 }] }, // no valid sets
    { name: 'Curl', sets: [{ reps: 12, weight: 15 }] },
  ] },
]

describe('epley1RM', () => {
  it('returns weight for a single rep', () => {
    expect(epley1RM(100, 1)).toBeCloseTo(103.33, 1)
  })
  it('is zero for empty input', () => {
    expect(epley1RM(0, 5)).toBe(0)
    expect(epley1RM(100, 0)).toBe(0)
  })
})

describe('listExercises', () => {
  it('lists weighted exercises by frequency', () => {
    expect(listExercises(log)).toEqual(['Squat', 'Bench', 'Curl'])
  })
})

describe('exerciseProgression', () => {
  it('summarizes each session chronologically', () => {
    const p = exerciseProgression(log, 'Squat')
    expect(p).toHaveLength(2)
    expect(p[0]).toMatchObject({ date: '2026-01-10', volume: 1000, topWeight: 100, setCount: 2 })
    expect(p[1]).toMatchObject({ date: '2026-01-17', topWeight: 120 })
    expect(p[1].best1RM).toBeCloseTo(132, 0) // 120 * (1 + 3/30)
  })

  it('skips sessions with no valid sets', () => {
    expect(exerciseProgression(log, 'Squat').map(p => p.date))
      .not.toContain('2026-01-24')
  })
})

describe('personalRecords', () => {
  it('reports all-time bests with their dates', () => {
    const pr = personalRecords(log, 'Squat')
    expect(pr.topWeight).toBe(120)
    expect(pr.topWeightDate).toBe('2026-01-17')
    expect(pr.bestVolume).toBe(1000)
    expect(pr.sessions).toBe(2)
  })
  it('returns null for an unknown exercise', () => {
    expect(personalRecords(log, 'Nope')).toBeNull()
  })
})
