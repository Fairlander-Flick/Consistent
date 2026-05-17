import { describe, it, expect } from 'vitest'
import { weightProgress } from './weightGoal'

describe('weightProgress', () => {
  it('returns null without a target or entries', () => {
    expect(weightProgress([{ date: '2026-01-01', kg: 80 }], null)).toBeNull()
    expect(weightProgress([], 75)).toBeNull()
  })

  it('computes fraction of the way from start to target (cutting weight)', () => {
    const entries = [
      { date: '2026-01-01', kg: 80 },
      { date: '2026-01-15', kg: 78 },
    ]
    const p = weightProgress(entries, 75) // 2 of 5 kg done
    expect(p.start).toBe(80)
    expect(p.current).toBe(78)
    expect(p.remaining).toBe(-3)
    expect(p.pct).toBeCloseTo(0.4, 6)
    expect(p.reached).toBe(false)
  })

  it('clamps progress to [0,1] when moving the wrong way', () => {
    const entries = [
      { date: '2026-01-01', kg: 80 },
      { date: '2026-01-15', kg: 82 },
    ]
    expect(weightProgress(entries, 75).pct).toBe(0)
  })

  it('marks the goal reached within tolerance', () => {
    const entries = [
      { date: '2026-01-01', kg: 80 },
      { date: '2026-02-01', kg: 75 },
    ]
    expect(weightProgress(entries, 75).reached).toBe(true)
  })

  it('estimates an ETA when trending toward the target', () => {
    const entries = [
      { date: '2026-01-01', kg: 80 },
      { date: '2026-01-08', kg: 79 },
      { date: '2026-01-15', kg: 78 },
    ]
    const p = weightProgress(entries, 75)
    expect(p.ratePerWeek).toBeCloseTo(-1, 6)
    expect(p.etaDate).toBeTruthy()
    expect(p.etaDate > '2026-01-15').toBe(true)
  })

  it('gives no ETA when stalled or moving away', () => {
    const entries = [
      { date: '2026-01-01', kg: 80 },
      { date: '2026-01-08', kg: 80 },
      { date: '2026-01-15', kg: 80 },
    ]
    expect(weightProgress(entries, 75).etaDate).toBeNull()
  })

  it('returns overshot=true and reached=false when past target (cutting weight overshoots)', () => {
    const entries = [
      { date: '2026-01-01', kg: 80 },
      { date: '2026-02-01', kg: 72 },
    ]
    const p = weightProgress(entries, 75)
    expect(p.pct).toBe(1)
    expect(p.reached).toBe(false)
    expect(p.overshot).toBe(true)
  })

  it('does not set overshot when within tolerance of target', () => {
    const entries = [
      { date: '2026-01-01', kg: 80 },
      { date: '2026-02-01', kg: 75 },
    ]
    const p = weightProgress(entries, 75)
    expect(p.reached).toBe(true)
    expect(p.overshot).toBe(false)
  })
})
