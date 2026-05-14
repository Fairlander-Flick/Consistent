import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSettingsStore } from './useSettingsStore'

describe('useSettingsStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({
      theme: 'dark',
      confirmGoalDelete: true,
      confirmTxDelete: true,
      confirmJournalDelete: true,
    })
  })

  it('default theme is dark', () => {
    const { result } = renderHook(() => useSettingsStore())
    expect(result.current.theme).toBe('dark')
  })

  it('toggleTheme switches dark→light', () => {
    const { result } = renderHook(() => useSettingsStore())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })

  it('toggleTheme switches light→dark', () => {
    useSettingsStore.setState({ theme: 'light' })
    const { result } = renderHook(() => useSettingsStore())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
  })
})

describe('useSettingsStore — confirm flags', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({
      theme: 'dark',
      confirmGoalDelete: true,
      confirmTxDelete: true,
      confirmJournalDelete: true,
    })
  })

  it('default confirmGoalDelete is true', () => {
    const { result } = renderHook(() => useSettingsStore())
    expect(result.current.confirmGoalDelete).toBe(true)
  })

  it('setConfirmGoalDelete sets to false', () => {
    const { result } = renderHook(() => useSettingsStore())
    act(() => result.current.setConfirmGoalDelete(false))
    expect(result.current.confirmGoalDelete).toBe(false)
  })

  it('toggleTheme preserves confirmGoalDelete', () => {
    const { result } = renderHook(() => useSettingsStore())
    act(() => result.current.setConfirmGoalDelete(false))
    act(() => result.current.toggleTheme())
    expect(result.current.confirmGoalDelete).toBe(false)
  })
})
