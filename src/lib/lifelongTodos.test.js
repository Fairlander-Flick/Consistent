import { describe, it, expect } from 'vitest'
import { lifelongTodosForDate } from './lifelongTodos'

// New tree shape: pursuits (categories) holding leaf nodes. A leaf surfaces on a
// date when it is scheduled on that weekday and isn't finished.
const NODES = [
  {
    id: 'g1', title: 'Math', children: [
      { id: 'i1', title: 'Rogawski — Calculus', kind: 'book', total: 1300, current: 0, days: ['Mon', 'Wed', 'Fri'], children: [] },
      { id: 'i2', title: 'Problem Set', kind: 'habit', days: ['Sat'], children: [] },
    ],
  },
  {
    id: 'g2', title: 'NeuroGolf', children: [
      { id: 'i3', title: 'ARC task', kind: 'task', done: false, days: ['Mon', 'Thu'], children: [] },
    ],
  },
  {
    id: 'g3', title: 'Done Pursuit', children: [
      { id: 'i4', title: 'Should never appear', kind: 'task', done: true, days: ['Mon'], children: [] },
    ],
  },
]

describe('lifelongTodosForDate', () => {
  it('returns empty for null inputs', () => {
    expect(lifelongTodosForDate(null, NODES)).toEqual([])
    expect(lifelongTodosForDate('2026-05-25', null)).toEqual([])
  })

  it('returns matching leaves for Monday 2026-05-25', () => {
    const todos = lifelongTodosForDate('2026-05-25', NODES)
    expect(todos).toHaveLength(2)
    expect(todos[0]).toEqual({
      key: 'lifelong|i1',
      label: 'Rogawski — Calculus',
      goalTitle: 'Math',
      goalId: 'g1',
      itemId: 'i1',
      crumb: ['Math'],
    })
    expect(todos[1].key).toBe('lifelong|i3')
  })

  it('skips finished leaves', () => {
    const todos = lifelongTodosForDate('2026-05-25', NODES)
    expect(todos.every(t => t.itemId !== 'i4')).toBe(true)
  })

  it('returns empty for days with nothing scheduled (Tuesday 2026-05-26)', () => {
    expect(lifelongTodosForDate('2026-05-26', NODES)).toHaveLength(0)
  })

  it('returns the Saturday leaf for 2026-05-30', () => {
    const todos = lifelongTodosForDate('2026-05-30', NODES)
    expect(todos).toHaveLength(1)
    expect(todos[0].key).toBe('lifelong|i2')
  })

  it('each todo has key, label, goalTitle, goalId, itemId', () => {
    const todos = lifelongTodosForDate('2026-05-25', NODES)
    for (const t of todos) {
      expect(t).toHaveProperty('key')
      expect(t).toHaveProperty('label')
      expect(t).toHaveProperty('goalTitle')
      expect(t).toHaveProperty('goalId')
      expect(t).toHaveProperty('itemId')
    }
  })

  it('labels a leaf directly under a pursuit with that pursuit (parent == root)', () => {
    const todos = lifelongTodosForDate('2026-05-25', NODES)
    expect(todos[0].goalTitle).toBe('Math')
    expect(todos[0].goalId).toBe('g1')
  })
})

// A deep tree: Academy › AI Bachelor › Second Semester › Deutsch B2.1 › leaf.
// The badge should read the immediate parent (Deutsch B2.1), not the root.
const NESTED = [
  {
    id: 'academy', title: 'Academy', children: [
      {
        id: 'ai', title: 'AI Bachelor', children: [
          {
            id: 'sem2', title: 'Second Semester', children: [
              {
                id: 'deutsch', title: 'Deutsch B2.1', children: [
                  { id: 'lh', title: 'Lecture & Homework', kind: 'habit', days: ['Mon'], children: [] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

describe('lifelongTodosForDate — nested pursuits', () => {
  it('labels a deep leaf with its immediate parent, not the root pursuit', () => {
    const todos = lifelongTodosForDate('2026-05-25', NESTED)
    expect(todos).toHaveLength(1)
    expect(todos[0]).toMatchObject({
      label: 'Lecture & Homework',
      goalTitle: 'Deutsch B2.1',
      goalId: 'deutsch',
      itemId: 'lh',
    })
  })

  it('carries the full ancestor crumb for a where-from tooltip', () => {
    const todos = lifelongTodosForDate('2026-05-25', NESTED)
    expect(todos[0].crumb).toEqual(['Academy', 'AI Bachelor', 'Second Semester', 'Deutsch B2.1'])
  })
})
