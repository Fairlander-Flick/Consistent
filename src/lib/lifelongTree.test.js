import { describe, it, expect } from 'vitest'
import {
  isDescendant, moveNode, reorderWithin, groupNodes, ungroupNode,
  duplicateNode, convertNode, convertLosesData, indentNode, outdentNode,
  flattenVisible, siblingsOf, findParentNode, findNode,
} from './lifelongTree'

// Build a small tree by hand (ids are stable for assertions).
function tree() {
  return [
    {
      id: 'math', title: 'Math', kind: null, children: [
        {
          id: 'reading', title: 'Reading', kind: null, children: [
            { id: 'sapiens', title: 'Sapiens', kind: 'book', total: 1300, current: 200, logs: [{ date: '2026-01-01', value: 200 }], children: [] },
            { id: 'atomic', title: 'Atomic Habits', kind: 'book', total: 300, current: 0, logs: [], children: [] },
          ],
        },
      ],
    },
    { id: 'fitness', title: 'Fitness', kind: 'task', done: false, children: [] },
  ]
}

describe('lookups', () => {
  it('siblingsOf finds root and nested', () => {
    const t = tree()
    expect(siblingsOf(t, 'math')).toMatchObject({ index: 0, parentId: null })
    expect(siblingsOf(t, 'fitness')).toMatchObject({ index: 1, parentId: null })
    expect(siblingsOf(t, 'atomic')).toMatchObject({ index: 1, parentId: 'reading' })
  })

  it('findParentNode returns the parent object or null at root', () => {
    const t = tree()
    expect(findParentNode(t, 'sapiens').id).toBe('reading')
    expect(findParentNode(t, 'math')).toBeNull()
  })

  it('isDescendant detects subtree membership and self', () => {
    const t = tree()
    expect(isDescendant(t, 'math', 'sapiens')).toBe(true)
    expect(isDescendant(t, 'math', 'math')).toBe(true)
    expect(isDescendant(t, 'reading', 'fitness')).toBe(false)
  })
})

describe('moveNode', () => {
  it('reparents a node under a new parent', () => {
    const t = moveNode(tree(), 'sapiens', 'fitness', 0)
    expect(findNode(t, 'fitness').children.map(c => c.id)).toEqual(['sapiens'])
    expect(findNode(t, 'reading').children.map(c => c.id)).toEqual(['atomic'])
  })

  it('moves a node to root', () => {
    const t = moveNode(tree(), 'sapiens', null, 0)
    expect(t.map(n => n.id)).toEqual(['sapiens', 'math', 'fitness'])
  })

  it('refuses to move a node into its own subtree', () => {
    const t = tree()
    expect(moveNode(t, 'math', 'sapiens', 0)).toBe(t) // unchanged reference
  })
})

describe('reorderWithin', () => {
  it('reorders root siblings', () => {
    const t = reorderWithin(tree(), null, 0, 1)
    expect(t.map(n => n.id)).toEqual(['fitness', 'math'])
  })
  it('reorders children of a parent', () => {
    const t = reorderWithin(tree(), 'reading', 0, 1)
    expect(findNode(t, 'reading').children.map(c => c.id)).toEqual(['atomic', 'sapiens'])
  })
})

describe('groupNodes', () => {
  it('wraps same-parent siblings in a new category', () => {
    const t = groupNodes(tree(), ['sapiens', 'atomic'], 'Books')
    const reading = findNode(t, 'reading')
    expect(reading.children).toHaveLength(1)
    const group = reading.children[0]
    expect(group.title).toBe('Books')
    expect(group.children.map(c => c.id)).toEqual(['sapiens', 'atomic'])
  })
  it('refuses to group across different parents', () => {
    const t = tree()
    expect(groupNodes(t, ['sapiens', 'fitness'])).toBe(t)
  })
})

describe('ungroupNode', () => {
  it('lifts children into the parent slot and removes the category', () => {
    const t = ungroupNode(tree(), 'reading')
    expect(findNode(t, 'math').children.map(c => c.id)).toEqual(['sapiens', 'atomic'])
    expect(findNode(t, 'reading')).toBeNull()
  })
})

describe('duplicateNode', () => {
  it('clones a subtree with fresh ids and reset progress, after the original', () => {
    const t = duplicateNode(tree(), 'reading')
    const kids = findNode(t, 'math').children
    expect(kids).toHaveLength(2)
    const copy = kids[1]
    expect(copy.id).not.toBe('reading')
    expect(copy.title).toBe('Reading (copy)')
    // nested book progress reset
    const copiedSapiens = copy.children[0]
    expect(copiedSapiens.current).toBe(0)
    expect(copiedSapiens.logs).toEqual([])
    expect(copiedSapiens.id).not.toBe('sapiens')
  })
})

describe('convertNode', () => {
  it('book → task clears total/logs and keeps title', () => {
    const sapiens = findNode(tree(), 'sapiens')
    const t = convertNode(sapiens, 'task')
    expect(t.kind).toBe('task')
    expect(t.total).toBeNull()
    expect(t.logs).toEqual([])
    expect(t.title).toBe('Sapiens')
  })
  it('to category nulls the kind', () => {
    const sapiens = findNode(tree(), 'sapiens')
    expect(convertNode(sapiens, 'category').kind).toBeNull()
  })
  it('convertLosesData flags loss for measured→task', () => {
    const sapiens = findNode(tree(), 'sapiens')
    expect(convertLosesData(sapiens, 'task')).toBe(true)
    expect(convertLosesData(sapiens, 'custom')).toBe(false)
  })
})

describe('indent / outdent', () => {
  it('indent nests a node under the sibling above it', () => {
    const t = indentNode(tree(), 'atomic')
    expect(findNode(t, 'sapiens').children.map(c => c.id)).toEqual(['atomic'])
  })
  it('indent of the first child is a no-op', () => {
    const t = tree()
    expect(indentNode(t, 'sapiens')).toBe(t)
  })
  it('outdent makes a node a sibling of its parent', () => {
    const t = outdentNode(tree(), 'sapiens')
    // sapiens lifts to be a child of math, right after reading
    expect(findNode(t, 'math').children.map(c => c.id)).toEqual(['reading', 'sapiens'])
  })
  it('outdent of a root node is a no-op', () => {
    const t = tree()
    expect(outdentNode(t, 'math')).toBe(t)
  })
})

describe('flattenVisible', () => {
  it('produces ordered depth-tagged rows', () => {
    const rows = flattenVisible(tree())
    expect(rows.map(r => [r.id, r.depth])).toEqual([
      ['math', 0], ['reading', 1], ['sapiens', 2], ['atomic', 2], ['fitness', 0],
    ])
  })
  it('hides descendants of collapsed nodes', () => {
    const t = tree()
    t[0].collapsed = true
    const rows = flattenVisible(t)
    expect(rows.map(r => r.id)).toEqual(['math', 'fitness'])
  })
})
