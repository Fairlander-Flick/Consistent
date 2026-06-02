import { describe, it, expect, beforeEach } from 'vitest'
import { useEssentialsStore } from './useEssentialsStore'

beforeEach(() => {
  localStorage.clear()
  useEssentialsStore.setState({ sleepPerDay: 8, factors: [] })
})

describe('useEssentialsStore', () => {
  it('clamps sleep to 0..24', () => {
    useEssentialsStore.getState().setSleepPerDay(30)
    expect(useEssentialsStore.getState().sleepPerDay).toBe(24)
    useEssentialsStore.getState().setSleepPerDay(-5)
    expect(useEssentialsStore.getState().sleepPerDay).toBe(0)
  })
  it('adds, updates and removes factors', () => {
    useEssentialsStore.getState().addFactor('Meals', 10)
    const f = useEssentialsStore.getState().factors[0]
    expect(f).toMatchObject({ name: 'Meals', hoursPerWeek: 10 })
    useEssentialsStore.getState().updateFactor(f.id, { hoursPerWeek: 12 })
    expect(useEssentialsStore.getState().factors[0].hoursPerWeek).toBe(12)
    useEssentialsStore.getState().removeFactor(f.id)
    expect(useEssentialsStore.getState().factors).toHaveLength(0)
  })
  it('persists to localStorage', () => {
    useEssentialsStore.getState().addFactor('Commute', 5)
    expect(JSON.parse(localStorage.getItem('consistent:essentials')).factors).toHaveLength(1)
  })
})
