import { describe, it, expect } from 'vitest'
import { levelForCount, activityCountForDate, buildActivityMap } from './activity'

const scheduleDone = {
  '2026-05-25': { 'lifelong|a': true, 'lifelong|b': true },
  '2026-05-26': { 'lifelong|a': true },
}
const dayPlan = {
  '2026-05-25': { todos: [{ id: 't1', done: true }, { id: 't2', done: false }] },
  '2026-05-27': { todos: [{ id: 't3', done: true }] },
}

describe('levelForCount', () => {
  it('buckets counts 0..4', () => {
    expect(levelForCount(0)).toBe(0)
    expect(levelForCount(1)).toBe(1)
    expect(levelForCount(2)).toBe(2)
    expect(levelForCount(3)).toBe(3)
    expect(levelForCount(9)).toBe(4)
  })
})

describe('activityCountForDate', () => {
  it('sums scheduled-done plus done one-offs', () => {
    expect(activityCountForDate('2026-05-25', scheduleDone, dayPlan)).toBe(3) // 2 + 1
    expect(activityCountForDate('2026-05-26', scheduleDone, dayPlan)).toBe(1)
    expect(activityCountForDate('2026-05-27', scheduleDone, dayPlan)).toBe(1)
    expect(activityCountForDate('2026-05-28', scheduleDone, dayPlan)).toBe(0)
  })
})

describe('buildActivityMap', () => {
  it('merges both sources, skipping empty days', () => {
    const m = buildActivityMap(scheduleDone, dayPlan)
    expect(m.get('2026-05-25')).toBe(3)
    expect(m.get('2026-05-26')).toBe(1)
    expect(m.get('2026-05-27')).toBe(1)
    expect(m.has('2026-05-28')).toBe(false)
  })
})
