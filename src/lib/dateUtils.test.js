import { describe, it, expect } from 'vitest'
import { todayISO, isoToDisplay, weekDays, getWeekStart } from './dateUtils'

describe('dateUtils', () => {
  it('todayISO returns YYYY-MM-DD format', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('isoToDisplay formats date for UI', () => {
    expect(isoToDisplay('2026-05-14')).toBe('14 May 2026')
  })

  it('weekDays returns Mon–Sun labels', () => {
    expect(weekDays()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  })

  it('getWeekStart returns Monday of current week', () => {
    const start = getWeekStart(new Date('2026-05-14T12:00:00'))
    const y = start.getFullYear()
    const m = String(start.getMonth() + 1).padStart(2, '0')
    const d = String(start.getDate()).padStart(2, '0')
    expect(`${y}-${m}-${d}`).toBe('2026-05-11')
  })
})
