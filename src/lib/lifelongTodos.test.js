import { describe, it, expect } from 'vitest'
import { lifelongTodosForDate } from './lifelongTodos'

const GOALS = [
  {
    id: 'g1',
    title: 'Math',
    deadline: '2026-08-01',
    done: false,
    items: [
      { id: 'i1', title: 'Rogawski — Calculus', total: 1300, days: ['Mon', 'Wed', 'Fri'] },
      { id: 'i2', title: 'Problem Set', total: null, days: ['Sat'] },
    ],
  },
  {
    id: 'g2',
    title: 'NeuroGolf',
    deadline: null,
    done: false,
    items: [
      { id: 'i3', title: 'ARC task', total: null, days: ['Mon', 'Thu'] },
    ],
  },
  {
    id: 'g3',
    title: 'Done Goal',
    deadline: null,
    done: true,
    items: [
      { id: 'i4', title: 'Should never appear', total: null, days: ['Mon'] },
    ],
  },
]

describe('lifelongTodosForDate', () => {
  it('returns empty for null inputs', () => {
    expect(lifelongTodosForDate(null, GOALS)).toEqual([])
    expect(lifelongTodosForDate('2026-05-25', null)).toEqual([])
  })

  it('returns matching items for Monday 2026-05-25', () => {
    const todos = lifelongTodosForDate('2026-05-25', GOALS)
    expect(todos).toHaveLength(2)
    expect(todos[0]).toEqual({
      key: 'lifelong|i1',
      label: 'Rogawski — Calculus',
      goalTitle: 'Math',
      goalId: 'g1',
      itemId: 'i1',
    })
    expect(todos[1].key).toBe('lifelong|i3')
  })

  it('skips done goals', () => {
    const todos = lifelongTodosForDate('2026-05-25', GOALS)
    expect(todos.every(t => t.goalId !== 'g3')).toBe(true)
  })

  it('returns empty for days with nothing scheduled (Tuesday 2026-05-26)', () => {
    const todos = lifelongTodosForDate('2026-05-26', GOALS)
    expect(todos).toHaveLength(0)
  })

  it('returns the Saturday item for 2026-05-30', () => {
    const todos = lifelongTodosForDate('2026-05-30', GOALS)
    expect(todos).toHaveLength(1)
    expect(todos[0].key).toBe('lifelong|i2')
  })

  it('each todo has key, label, goalTitle, goalId, itemId', () => {
    const todos = lifelongTodosForDate('2026-05-25', GOALS)
    for (const t of todos) {
      expect(t).toHaveProperty('key')
      expect(t).toHaveProperty('label')
      expect(t).toHaveProperty('goalTitle')
      expect(t).toHaveProperty('goalId')
      expect(t).toHaveProperty('itemId')
    }
  })
})
