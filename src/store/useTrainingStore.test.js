import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTrainingStore } from './useTrainingStore'

const PROG_BLANK = Object.fromEntries(
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => [d, { name: '', exercises: [] }])
)

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

describe('useTrainingStore — exercise type', () => {
  beforeEach(() => {
    localStorage.clear()
    useTrainingStore.setState({ log: [], program: PROG_BLANK })
  })

  it('addExercise defaults to strength with an empty sets array', () => {
    const { result } = renderHook(() => useTrainingStore())
    act(() => result.current.addExercise('Mon', 'Bench'))
    const ex = result.current.program.Mon.exercises[0]
    expect(ex.type).toBe('strength')
    expect(ex.sets).toEqual([])
  })

  it('addExercise can create a cardio exercise', () => {
    const { result } = renderHook(() => useTrainingStore())
    act(() => result.current.addExercise('Mon', 'Run', 'cardio'))
    const ex = result.current.program.Mon.exercises[0]
    expect(ex.type).toBe('cardio')
    expect(ex.durationMinutes).toBe(0)
    expect(ex.sets).toBeUndefined()
  })

  it('setExerciseType to cardio drops sets and periodization', () => {
    const { result } = renderHook(() => useTrainingStore())
    act(() => result.current.addExercise('Mon', 'Bench'))
    const id = result.current.program.Mon.exercises[0].id
    act(() => result.current.setExerciseType('Mon', id, 'cardio'))
    const ex = result.current.program.Mon.exercises[0]
    expect(ex.type).toBe('cardio')
    expect(ex.sets).toBeUndefined()
    expect(ex.periodization).toBeUndefined()
    expect(ex.durationMinutes).toBe(0)
  })

  it('setExerciseType to strength gives an empty sets array', () => {
    const { result } = renderHook(() => useTrainingStore())
    act(() => result.current.addExercise('Mon', 'Run', 'cardio'))
    const id = result.current.program.Mon.exercises[0].id
    act(() => result.current.setExerciseType('Mon', id, 'strength'))
    const ex = result.current.program.Mon.exercises[0]
    expect(ex.type).toBe('strength')
    expect(ex.sets).toEqual([])
    expect(ex.durationMinutes).toBeUndefined()
  })
})
