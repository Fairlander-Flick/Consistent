import { describe, it, expect, beforeEach } from 'vitest'
import { loadData, saveData } from './storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns default when key missing', () => {
    expect(loadData('consistent:weight', [])).toEqual([])
  })

  it('saves and loads data', () => {
    saveData('consistent:weight', [{ date: '2026-05-14', kg: 82.4 }])
    expect(loadData('consistent:weight', [])).toEqual([{ date: '2026-05-14', kg: 82.4 }])
  })
})
