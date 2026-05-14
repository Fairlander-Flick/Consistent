import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTrainingStore } from './useTrainingStore'

const DEFAULT_PROGRAM = Object.fromEntries(
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => [d, { name: '', exercises: [] }])
)

describe('useTrainingStore — logSession updates', () => {
  beforeEach(() => {
    localStorage.clear()
    useTrainingStore.setState({ log: [], program: DEFAULT_PROGRAM })
  })

  it('logSession stores durationMinutes', () => {
    const { result } = renderHook(() => useTrainingStore())
    act(() => result.current.logSession('2026-05-14', [], 45))
    expect(result.current.log[0].durationMinutes).toBe(45)
  })

  it('logSession defaults durationMinutes to 0', () => {
    const { result } = renderHook(() => useTrainingStore())
    act(() => result.current.logSession('2026-05-14', []))
    expect(result.current.log[0].durationMinutes).toBe(0)
  })

  it('deleteSession removes the entry', () => {
    const { result } = renderHook(() => useTrainingStore())
    act(() => result.current.logSession('2026-05-14', [], 30))
    act(() => result.current.deleteSession('2026-05-14'))
    expect(result.current.log).toHaveLength(0)
  })

  it('deleteSession does not remove other entries', () => {
    const { result } = renderHook(() => useTrainingStore())
    act(() => {
      result.current.logSession('2026-05-13', [], 40)
      result.current.logSession('2026-05-14', [], 50)
    })
    act(() => result.current.deleteSession('2026-05-14'))
    expect(result.current.log).toHaveLength(1)
    expect(result.current.log[0].date).toBe('2026-05-13')
  })
})
