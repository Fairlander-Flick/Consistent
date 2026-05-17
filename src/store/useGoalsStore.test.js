import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useGoalsStore } from './useGoalsStore'

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
    })
  })

  it('store does not expose history methods', () => {
    const store = useGoalsStore.getState()
    expect(store.isCompleted).toBeUndefined()
    expect(store.recordHistory).toBeUndefined()
    expect(store.history).toBeUndefined()
  })

  it('toggleTodo flips done state', () => {
    useGoalsStore.setState({
      goals: {
        daily: { title: '', todos: [{ id: '1', text: 'Run', done: false }] },
        weekly: { title: '', todos: [] },
        monthly: { title: '', todos: [] },
        yearly: { title: '', todos: [] },
      },
    })
    const { result } = renderHook(() => useGoalsStore())
    act(() => result.current.toggleTodo('daily', '1'))
    expect(result.current.goals.daily.todos[0].done).toBe(true)
  })
})
