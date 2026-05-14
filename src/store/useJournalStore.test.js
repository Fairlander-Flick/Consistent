import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useJournalStore } from './useJournalStore'

describe('useJournalStore — new fields', () => {
  beforeEach(() => {
    localStorage.clear()
    useJournalStore.setState({ entries: [] })
  })

  it('getTodayEntry returns null for new fields by default', () => {
    const { result } = renderHook(() => useJournalStore())
    const entry = result.current.getTodayEntry()
    expect(entry.score).toBeNull()
    expect(entry.feelings).toBeNull()
    expect(entry.sleepHours).toBeNull()
    expect(entry.nutrition).toBeNull()
  })

  it('setTodayScore upserts entry', () => {
    const { result } = renderHook(() => useJournalStore())
    act(() => result.current.setTodayScore(7))
    expect(result.current.getTodayEntry().score).toBe(7)
  })

  it('setTodayFeelings upserts entry', () => {
    const { result } = renderHook(() => useJournalStore())
    act(() => result.current.setTodayFeelings('great day'))
    expect(result.current.getTodayEntry().feelings).toBe('great day')
  })

  it('setTodaySleepHours upserts entry', () => {
    const { result } = renderHook(() => useJournalStore())
    act(() => result.current.setTodaySleepHours(7.5))
    expect(result.current.getTodayEntry().sleepHours).toBe(7.5)
  })

  it('setTodayNutrition upserts entry', () => {
    const { result } = renderHook(() => useJournalStore())
    act(() => result.current.setTodayNutrition('good'))
    expect(result.current.getTodayEntry().nutrition).toBe('good')
  })

  it('multiple setters accumulate on same entry', () => {
    const { result } = renderHook(() => useJournalStore())
    act(() => result.current.setTodayScore(8))
    act(() => result.current.setTodaySleepHours(6.5))
    const entry = result.current.getTodayEntry()
    expect(entry.score).toBe(8)
    expect(entry.sleepHours).toBe(6.5)
    expect(result.current.entries).toHaveLength(1)
  })
})
