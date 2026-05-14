import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSettingsStore } from './useSettingsStore'

describe('useSettingsStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({ theme: 'dark' })
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
