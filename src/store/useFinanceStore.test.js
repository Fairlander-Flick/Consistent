import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFinanceStore } from './useFinanceStore'

describe('useFinanceStore budgets', () => {
  beforeEach(() => {
    localStorage.clear()
    useFinanceStore.setState({
      categories: ['Food', 'Gym'],
      transactions: [],
      recurring: [],
      budgets: {},
    })
  })

  it('setBudget stores a positive budget', () => {
    const { result } = renderHook(() => useFinanceStore())
    act(() => result.current.setBudget('Food', '300'))
    expect(result.current.budgets).toEqual({ Food: 300 })
  })

  it('setBudget with 0 or empty removes the budget', () => {
    const { result } = renderHook(() => useFinanceStore())
    act(() => result.current.setBudget('Food', '300'))
    act(() => result.current.setBudget('Food', '0'))
    expect(result.current.budgets.Food).toBeUndefined()

    act(() => result.current.setBudget('Gym', '50'))
    act(() => result.current.setBudget('Gym', ''))
    expect(result.current.budgets.Gym).toBeUndefined()
  })

  it('renameCategory migrates the budget key', () => {
    const { result } = renderHook(() => useFinanceStore())
    act(() => result.current.setBudget('Food', '300'))
    act(() => result.current.renameCategory('Food', 'Groceries'))
    expect(result.current.budgets).toEqual({ Groceries: 300 })
  })

  it('deleteCategory removes its budget', () => {
    const { result } = renderHook(() => useFinanceStore())
    act(() => result.current.setBudget('Food', '300'))
    act(() => result.current.deleteCategory('Food'))
    expect(result.current.budgets.Food).toBeUndefined()
  })

  it('persists budgets to localStorage', () => {
    const { result } = renderHook(() => useFinanceStore())
    act(() => result.current.setBudget('Food', '120'))
    const saved = JSON.parse(localStorage.getItem('consistent:finance'))
    expect(saved.budgets).toEqual({ Food: 120 })
  })
})
