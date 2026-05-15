import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useScheduleStore } from './useScheduleStore'

const EMPTY = () => ({
  recurring: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] },
  oneoffs: [],
})

describe('useScheduleStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useScheduleStore.setState(EMPTY())
  })

  it('addRecurringBlock adds a block with an id to the given day', () => {
    const { result } = renderHook(() => useScheduleStore())
    act(() => result.current.addRecurringBlock('Mon', { kind: 'class', label: 'Algebra', start: '09:00', end: '10:30' }))
    const blocks = result.current.recurring.Mon
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ kind: 'class', label: 'Algebra', start: '09:00', end: '10:30' })
    expect(blocks[0].id).toBeTruthy()
  })

  it('removeRecurringBlock removes by id', () => {
    const { result } = renderHook(() => useScheduleStore())
    act(() => result.current.addRecurringBlock('Tue', { kind: 'work', label: 'Shift', start: '14:00', end: '18:00' }))
    const id = result.current.recurring.Tue[0].id
    act(() => result.current.removeRecurringBlock('Tue', id))
    expect(result.current.recurring.Tue).toHaveLength(0)
  })

  it('updateRecurringBlock patches fields', () => {
    const { result } = renderHook(() => useScheduleStore())
    act(() => result.current.addRecurringBlock('Wed', { kind: 'class', label: 'Old', start: '09:00', end: '10:00' }))
    const id = result.current.recurring.Wed[0].id
    act(() => result.current.updateRecurringBlock('Wed', id, { label: 'New', end: '11:00' }))
    expect(result.current.recurring.Wed[0]).toMatchObject({ label: 'New', start: '09:00', end: '11:00' })
  })

  it('addOneoff / removeOneoff manage the oneoffs list', () => {
    const { result } = renderHook(() => useScheduleStore())
    act(() => result.current.addOneoff({ date: '2026-05-13', kind: 'other', label: 'Dentist', start: '11:00', end: '12:00' }))
    expect(result.current.oneoffs).toHaveLength(1)
    const id = result.current.oneoffs[0].id
    act(() => result.current.removeOneoff(id))
    expect(result.current.oneoffs).toHaveLength(0)
  })

  it('weekBlocks merges recurring (by weekday) and one-offs (by date)', () => {
    const { result } = renderHook(() => useScheduleStore())
    // 2026-05-11 is a Monday; 2026-05-13 is a Wednesday
    act(() => result.current.addRecurringBlock('Mon', { kind: 'class', label: 'Algebra', start: '09:00', end: '10:30' }))
    act(() => result.current.addOneoff({ date: '2026-05-13', kind: 'other', label: 'Dentist', start: '11:00', end: '12:00' }))
    const week = ['2026-05-11','2026-05-12','2026-05-13','2026-05-14','2026-05-15','2026-05-16','2026-05-17']
    const blocks = result.current.weekBlocks(week)
    expect(blocks).toHaveLength(7)
    expect(blocks[0]).toHaveLength(1)
    expect(blocks[0][0]).toMatchObject({ label: 'Algebra', source: 'recurring' })
    expect(blocks[1]).toHaveLength(0)
    expect(blocks[2]).toHaveLength(1)
    expect(blocks[2][0]).toMatchObject({ label: 'Dentist', source: 'oneoff' })
  })

  it('persists recurring + oneoffs to localStorage', () => {
    const { result } = renderHook(() => useScheduleStore())
    act(() => result.current.addRecurringBlock('Fri', { kind: 'work', label: 'Shift', start: '08:00', end: '12:00' }))
    const stored = JSON.parse(localStorage.getItem('consistent:schedule'))
    expect(stored.recurring.Fri).toHaveLength(1)
  })
})
