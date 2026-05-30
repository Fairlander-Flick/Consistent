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

  it('addGoal appends with id, done:false, items:[]', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Math', '2026-08-01'))
    const g = result.current.goals[0]
    expect(g.title).toBe('Math')
    expect(g.deadline).toBe('2026-08-01')
    expect(g.done).toBe(false)
    expect(g.items).toEqual([])
    expect(typeof g.id).toBe('string')
  })

  it('addGoal with no deadline stores null', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Ongoing', ''))
    expect(result.current.goals[0].deadline).toBeNull()
  })

  it('deleteGoal removes by id', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Math', null))
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

  it('addItem appends a measurable item with current:0, logs:[], days:[]', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Math', null))
    const goalId = result.current.goals[0].id
    act(() => result.current.addItem(goalId, { title: 'Rogawski', unit: 'pages', total: '1300' }))
    const item = result.current.goals[0].items[0]
    expect(item.title).toBe('Rogawski')
    expect(item.unit).toBe('pages')
    expect(item.total).toBe(1300)
    expect(item.current).toBe(0)
    expect(item.logs).toEqual([])
    expect(item.days).toEqual([])
  })

  it('addItem with empty total stores a habit (total:null)', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Fitness', null))
    const goalId = result.current.goals[0].id
    act(() => result.current.addItem(goalId, { title: 'Gym', total: '' }))
    expect(result.current.goals[0].items[0].total).toBeNull()
  })

  it('toggleItemDay adds then removes a weekday', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Math', null))
    const goalId = result.current.goals[0].id
    act(() => result.current.addItem(goalId, { title: 'Rogawski', total: 1300 }))
    const itemId = result.current.goals[0].items[0].id
    act(() => result.current.toggleItemDay(goalId, itemId, 'Mon'))
    expect(result.current.goals[0].items[0].days).toEqual(['Mon'])
    act(() => result.current.toggleItemDay(goalId, itemId, 'Mon'))
    expect(result.current.goals[0].items[0].days).toEqual([])
  })

  it('logProgress sets current and records a log, clamped to total', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Math', null))
    const goalId = result.current.goals[0].id
    act(() => result.current.addItem(goalId, { title: 'Rogawski', total: 1300 }))
    const itemId = result.current.goals[0].items[0].id
    act(() => result.current.logProgress(goalId, itemId, 213, '2026-05-20'))
    expect(result.current.goals[0].items[0].current).toBe(213)
    expect(result.current.goals[0].items[0].logs).toEqual([{ date: '2026-05-20', value: 213 }])
    act(() => result.current.logProgress(goalId, itemId, 99999, '2026-05-21'))
    expect(result.current.goals[0].items[0].current).toBe(1300)
  })

  it('logProgress keeps one log per day (last write wins)', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Math', null))
    const goalId = result.current.goals[0].id
    act(() => result.current.addItem(goalId, { title: 'Rogawski', total: 1300 }))
    const itemId = result.current.goals[0].items[0].id
    act(() => result.current.logProgress(goalId, itemId, 100, '2026-05-20'))
    act(() => result.current.logProgress(goalId, itemId, 150, '2026-05-20'))
    expect(result.current.goals[0].items[0].logs).toEqual([{ date: '2026-05-20', value: 150 }])
  })

  it('bumpProgress increments current by 1', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('LA', null))
    const goalId = result.current.goals[0].id
    act(() => result.current.addItem(goalId, { title: 'Essence of LA', total: 12 }))
    const itemId = result.current.goals[0].items[0].id
    act(() => result.current.bumpProgress(goalId, itemId, 1))
    expect(result.current.goals[0].items[0].current).toBe(1)
  })

  it('deleteItem removes the item', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addGoal('Math', null))
    const goalId = result.current.goals[0].id
    act(() => result.current.addItem(goalId, { title: 'Rogawski', total: 1300 }))
    const itemId = result.current.goals[0].items[0].id
    act(() => result.current.deleteItem(goalId, itemId))
    expect(result.current.goals[0].items).toHaveLength(0)
  })
})
