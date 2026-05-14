import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useGoalsStore } from './useGoalsStore'

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly']

describe('useGoalsStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useGoalsStore.setState({
      goals: {
        daily: { title: '', todos: [] },
        weekly: { title: '', todos: [] },
        monthly: { title: '', todos: [] },
        yearly: { title: '', todos: [] },
      },
      history: [],
    })
  })

  it('isCompleted returns false when todos empty', () => {
    const { result } = renderHook(() => useGoalsStore())
    expect(result.current.isCompleted('daily')).toBe(false)
  })

  it('isCompleted returns true when all todos checked', () => {
    useGoalsStore.setState({
      goals: {
        daily: { title: 'Day', todos: [{ id: '1', text: 'Run', done: true }] },
        weekly: { title: '', todos: [] },
        monthly: { title: '', todos: [] },
        yearly: { title: '', todos: [] },
      },
      history: [],
    })
    const { result } = renderHook(() => useGoalsStore())
    expect(result.current.isCompleted('daily')).toBe(true)
  })

  it('toggleTodo flips done state', () => {
    useGoalsStore.setState({
      goals: {
        daily: { title: '', todos: [{ id: '1', text: 'Run', done: false }] },
        weekly: { title: '', todos: [] },
        monthly: { title: '', todos: [] },
        yearly: { title: '', todos: [] },
      },
      history: [],
    })
    const { result } = renderHook(() => useGoalsStore())
    act(() => result.current.toggleTodo('daily', '1'))
    expect(result.current.goals.daily.todos[0].done).toBe(true)
  })
})
