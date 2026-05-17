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

describe('useTrainingStore — periodization config', () => {
  beforeEach(() => {
    localStorage.clear()
    useTrainingStore.setState({ log: [], program: PROG_BLANK })
  })

  const seedStrength = (result) => {
    act(() => result.current.addExercise('Mon', 'Squat'))
    return result.current.program.Mon.exercises[0].id
  }

  it('setPeriodization enables periodization and sets currentWeek to 1', () => {
    const { result } = renderHook(() => useTrainingStore())
    const id = seedStrength(result)
    act(() => result.current.setPeriodization('Mon', id, {
      trainingMax: 173.9, multipliers: [0.8193, 0.861, 0.9027],
    }))
    const p = result.current.program.Mon.exercises[0].periodization
    expect(p.trainingMax).toBe(173.9)
    expect(p.multipliers).toEqual([0.8193, 0.861, 0.9027])
    expect(p.currentWeek).toBe(1)
  })

  it('setPeriodization(null) reverts to manual strength but keeps sets', () => {
    const { result } = renderHook(() => useTrainingStore())
    const id = seedStrength(result)
    act(() => result.current.addSet('Mon', id, 5, 100))
    act(() => result.current.setPeriodization('Mon', id, {
      trainingMax: 173.9, multipliers: [0.8193, 0.861, 0.9027],
    }))
    act(() => result.current.setPeriodization('Mon', id, null))
    const ex = result.current.program.Mon.exercises[0]
    expect(ex.periodization).toBeUndefined()
    expect(ex.sets).toEqual([{ reps: 5, weight: 100 }])
  })

  it('setExerciseWeek clamps to 1..3', () => {
    const { result } = renderHook(() => useTrainingStore())
    const id = seedStrength(result)
    act(() => result.current.setPeriodization('Mon', id, {
      trainingMax: 100, multipliers: [1, 1, 1],
    }))
    act(() => result.current.setExerciseWeek('Mon', id, 3))
    expect(result.current.program.Mon.exercises[0].periodization.currentWeek).toBe(3)
    act(() => result.current.setExerciseWeek('Mon', id, 9))
    expect(result.current.program.Mon.exercises[0].periodization.currentWeek).toBe(3)
    act(() => result.current.setExerciseWeek('Mon', id, 0))
    expect(result.current.program.Mon.exercises[0].periodization.currentWeek).toBe(1)
  })

  it('setCardioDuration sets the template default duration', () => {
    const { result } = renderHook(() => useTrainingStore())
    act(() => result.current.addExercise('Mon', 'Bike', 'cardio'))
    const id = result.current.program.Mon.exercises[0].id
    act(() => result.current.setCardioDuration('Mon', id, 25))
    expect(result.current.program.Mon.exercises[0].durationMinutes).toBe(25)
  })
})
