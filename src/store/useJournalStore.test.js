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

describe('useJournalStore — submit / edit', () => {
  beforeEach(() => {
    localStorage.clear()
    useJournalStore.setState({ entries: [] })
  })

  it('getTodayEntry defaults submitted to false', () => {
    const { result } = renderHook(() => useJournalStore())
    expect(result.current.getTodayEntry().submitted).toBe(false)
  })

  it('submitToday writes all four fields and submitted:true in one entry', () => {
    const { result } = renderHook(() => useJournalStore())
    act(() => result.current.submitToday({ score: 7, sleepHours: 7.5, nutrition: 'good', feelings: 'solid day' }))
    const e = result.current.getTodayEntry()
    expect(e).toMatchObject({ score: 7, sleepHours: 7.5, nutrition: 'good', feelings: 'solid day', submitted: true })
    expect(result.current.entries).toHaveLength(1)
  })

  it('editToday flips submitted back to false keeping values', () => {
    const { result } = renderHook(() => useJournalStore())
    act(() => result.current.submitToday({ score: 8, sleepHours: 6, nutrition: 'mid', feelings: 'ok' }))
    act(() => result.current.editToday())
    const e = result.current.getTodayEntry()
    expect(e.submitted).toBe(false)
    expect(e.score).toBe(8)
    expect(e.feelings).toBe('ok')
  })
})
