import { describe, it, expect, beforeEach } from 'vitest'
import { buildBackup, parseBackup, restoreBackup, STORE_KEYS } from './backup'

describe('backup', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('builds a backup of only known keys with parsed values', () => {
    localStorage.setItem('consistent:weight', JSON.stringify([{ date: '2026-01-01', kg: 80 }]))
    localStorage.setItem('unrelated:key', 'nope')

    const b = buildBackup(new Date('2026-05-16T10:00:00Z'))

    expect(b.app).toBe('consistent')
    expect(b.version).toBe(1)
    expect(b.exportedAt).toBe('2026-05-16T10:00:00.000Z')
    expect(b.data['consistent:weight']).toEqual([{ date: '2026-01-01', kg: 80 }])
    expect(b.data['unrelated:key']).toBeUndefined()
  })

  it('skips corrupt entries instead of throwing', () => {
    localStorage.setItem('consistent:weight', '{ not json')
    const b = buildBackup()
    expect(b.data['consistent:weight']).toBeUndefined()
  })

  it('parseBackup rejects non-Consistent files', () => {
    expect(() => parseBackup('not json')).toThrow(/valid JSON/)
    expect(() => parseBackup('{"app":"other"}')).toThrow(/Consistent backup/)
    expect(() => parseBackup('{"app":"consistent"}')).toThrow(/data section/)
  })

  it('round-trips through build and restore', () => {
    const goals = { daily: { title: 'x', todos: [] } }
    localStorage.setItem('consistent:goals', JSON.stringify(goals))
    const b = buildBackup()
    localStorage.clear()

    const restored = restoreBackup(parseBackup(JSON.stringify(b)))

    expect(restored).toEqual(['consistent:goals'])
    expect(JSON.parse(localStorage.getItem('consistent:goals'))).toEqual(goals)
  })

  it('restore only writes keys present in the backup, leaving others intact', () => {
    localStorage.setItem('consistent:weight', JSON.stringify(['keep']))
    restoreBackup({ 'consistent:goals': { a: 1 }, 'evil:key': 'x' })

    expect(JSON.parse(localStorage.getItem('consistent:weight'))).toEqual(['keep'])
    expect(JSON.parse(localStorage.getItem('consistent:goals'))).toEqual({ a: 1 })
    expect(localStorage.getItem('evil:key')).toBeNull()
  })

  it('STORE_KEYS includes settings so preferences travel with the backup', () => {
    expect(STORE_KEYS).toContain('consistent:settings')
  })
})
