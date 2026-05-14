import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useWeightStore } from './useWeightStore'

describe('useWeightStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useWeightStore.setState({ entries: [] })
  })

  it('starts empty', () => {
    const { result } = renderHook(() => useWeightStore())
    expect(result.current.entries).toEqual([])
  })

  it('addEntry inserts sorted by date desc', () => {
    const { result } = renderHook(() => useWeightStore())
    act(() => result.current.addEntry('2026-05-13', 82.7))
    act(() => result.current.addEntry('2026-05-14', 82.4))
    expect(result.current.entries[0].date).toBe('2026-05-14')
  })

  it('deleteEntry removes by date', () => {
    const { result } = renderHook(() => useWeightStore())
    act(() => result.current.addEntry('2026-05-14', 82.4))
    act(() => result.current.deleteEntry('2026-05-14'))
    expect(result.current.entries).toHaveLength(0)
  })
})
