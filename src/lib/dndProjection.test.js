import { describe, it, expect } from 'vitest'
import { arrayMove, removeSubtree, computeDrop } from './dndProjection'

// A flat depth-tagged list, mirroring flattenVisible output:
//   math(0)
//     reading(1)
//       sapiens(2)
//       atomic(2)
//   fitness(0)
function flat() {
  return [
    { id: 'math', depth: 0, parentId: null },
    { id: 'reading', depth: 1, parentId: 'math' },
    { id: 'sapiens', depth: 2, parentId: 'reading' },
    { id: 'atomic', depth: 2, parentId: 'reading' },
    { id: 'fitness', depth: 0, parentId: null },
  ]
}

describe('arrayMove', () => {
  it('moves an item to a new index', () => {
    expect(arrayMove([1, 2, 3], 0, 2)).toEqual([2, 3, 1])
  })
})

describe('removeSubtree', () => {
  it('drops the active row descendants but keeps the row itself', () => {
    const out = removeSubtree(flat(), 'reading')
    expect(out.map(i => i.id)).toEqual(['math', 'reading', 'fitness'])
  })
  it('leaf removal keeps everything else', () => {
    const out = removeSubtree(flat(), 'atomic')
    expect(out.map(i => i.id)).toEqual(['math', 'reading', 'sapiens', 'atomic', 'fitness'])
  })
})

describe('computeDrop', () => {
  const INDENT = 24

  it('drops onto a root sibling with no x-offset → root level', () => {
    const d = computeDrop(flat(), 'fitness', 'math', 0, INDENT)
    expect(d.parentId).toBeNull()
    expect(d.depth).toBe(0)
  })

  it('indenting under the previous row makes it a child', () => {
    const d = computeDrop(flat(), 'fitness', 'atomic', INDENT * 2, INDENT)
    expect(d.depth).toBe(2)
    expect(d.parentId).toBe('reading')
  })

  it('clamps depth so it cannot exceed prev.depth + 1', () => {
    // Dropping fitness onto sapiens from below inserts it *above* sapiens, so the
    // row above the slot is reading (depth 1). Even with a huge x-offset, depth
    // is clamped to prev.depth + 1 = 2, landing it as reading's child.
    const d = computeDrop(flat(), 'fitness', 'sapiens', INDENT * 99, INDENT)
    expect(d.depth).toBe(2)
    expect(d.parentId).toBe('reading')
  })

  it('computes sibling index at root (subtree stripped first)', () => {
    const stripped = removeSubtree(flat(), 'math') // → [math, reading, fitness] minus math's kids? no: keeps reading
    // math has children, so stripping removes reading/sapiens/atomic; keeps math + fitness
    expect(stripped.map(i => i.id)).toEqual(['math', 'fitness'])
    const d = computeDrop(stripped, 'math', 'fitness', 0, INDENT)
    expect(d.parentId).toBeNull()
    expect(d.index).toBe(1)
  })
})
