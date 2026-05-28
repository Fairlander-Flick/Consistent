import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useLifelongStore } from './useLifelongStore'

describe('useLifelongStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useLifelongStore.setState({ goals: [] })
  })

  it('starts empty', () => {
    const { result } = renderHook(() => useLifelongStore())
    expect(result.current.goals).toEqual([])
  })

  it('addGoal appends with id, done:false, steps:[]', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Rogawski', '2026-08-01'))
    expect(result.current.goals).toHaveLength(1)
    const g = result.current.goals[0]
    expect(g.title).toBe('Rogawski')
    expect(g.deadline).toBe('2026-08-01')
    expect(g.done).toBe(false)
    expect(g.steps).toEqual([])
    expect(typeof g.id).toBe('string')
  })

  it('addGoal with no deadline stores null', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Ongoing', ''))
    expect(result.current.goals[0].deadline).toBeNull()
  })

  it('deleteGoal removes by id', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Rogawski', null))
    const id = result.current.goals[0].id
    act(() => result.current.deleteGoal(id))
    expect(result.current.goals).toHaveLength(0)
  })

  it('markGoalDone sets done:true and moves goal to end', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('First', null))
    act(() => result.current.addGoal('Second', null))
    const firstId = result.current.goals[0].id
    act(() => result.current.markGoalDone(firstId))
    const goals = result.current.goals
    expect(goals[goals.length - 1].id).toBe(firstId)
    expect(goals[goals.length - 1].done).toBe(true)
  })

  it('addStep appends to correct goal', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Rogawski', null))
    const goalId = result.current.goals[0].id
    act(() => result.current.addStep(goalId, '20 Sayfa', ['Mon', 'Wed']))
    const step = result.current.goals[0].steps[0]
    expect(step.title).toBe('20 Sayfa')
    expect(step.days).toEqual(['Mon', 'Wed'])
  })

  it('updateStep merges patch into step', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('G', null))
    const goalId = result.current.goals[0].id
    act(() => result.current.addStep(goalId, 'Step', ['Mon']))
    const stepId = result.current.goals[0].steps[0].id
    act(() => result.current.updateStep(goalId, stepId, { days: ['Mon', 'Fri'] }))
    expect(result.current.goals[0].steps[0].days).toEqual(['Mon', 'Fri'])
  })

  it('deleteStep removes step from goal', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('G', null))
    const goalId = result.current.goals[0].id
    act(() => result.current.addStep(goalId, 'Step', ['Mon']))
    const stepId = result.current.goals[0].steps[0].id
    act(() => result.current.deleteStep(goalId, stepId))
    expect(result.current.goals[0].steps).toHaveLength(0)
  })
})
