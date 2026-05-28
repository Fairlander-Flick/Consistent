import { describe, it, expect } from 'vitest'
import { lifelongTodosForDate } from './lifelongTodos'

const GOALS = [
  {
    id: 'g1',
    title: 'Rogawski Calculus',
    deadline: '2026-08-01',
    done: false,
    steps: [
      { id: 's1', title: '20 Sayfa Oku', days: ['Mon', 'Wed', 'Fri'] },
      { id: 's2', title: 'Problem Set', days: ['Sat'] },
    ],
  },
  {
    id: 'g2',
    title: 'NeuroGolf',
    deadline: null,
    done: false,
    steps: [
      { id: 's3', title: 'ARC task', days: ['Mon', 'Thu'] },
    ],
  },
  {
    id: 'g3',
    title: 'Done Goal',
    deadline: null,
    done: true,
    steps: [
      { id: 's4', title: 'Should never appear', days: ['Mon'] },
    ],
  },
]

describe('lifelongTodosForDate', () => {
  it('returns empty for null inputs', () => {
    expect(lifelongTodosForDate(null, GOALS)).toEqual([])
    expect(lifelongTodosForDate('2026-05-25', null)).toEqual([])
  })

  it('returns matching steps for Monday 2026-05-25', () => {
    const todos = lifelongTodosForDate('2026-05-25', GOALS)
    expect(todos).toHaveLength(2)
    expect(todos[0]).toEqual({
      key: 'lifelong|s1',
      label: '20 Sayfa Oku',
      goalTitle: 'Rogawski Calculus',
      goalId: 'g1',
      stepId: 's1',
    })
    expect(todos[1].key).toBe('lifelong|s3')
  })

  it('skips done goals', () => {
    const todos = lifelongTodosForDate('2026-05-25', GOALS)
    expect(todos.every(t => t.goalId !== 'g3')).toBe(true)
  })

  it('returns empty for days with no steps scheduled (Tuesday 2026-05-26)', () => {
    const todos = lifelongTodosForDate('2026-05-26', GOALS)
    expect(todos).toHaveLength(0)
  })

  it('returns Saturday step for 2026-05-30', () => {
    const todos = lifelongTodosForDate('2026-05-30', GOALS)
    expect(todos).toHaveLength(1)
    expect(todos[0].key).toBe('lifelong|s2')
  })

  it('each item has key, label, goalTitle, goalId, stepId', () => {
    const todos = lifelongTodosForDate('2026-05-25', GOALS)
    for (const t of todos) {
      expect(t).toHaveProperty('key')
      expect(t).toHaveProperty('label')
      expect(t).toHaveProperty('goalTitle')
      expect(t).toHaveProperty('goalId')
      expect(t).toHaveProperty('stepId')
    }
  })
})
