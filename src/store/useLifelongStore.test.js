import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useLifelongStore, findNode, newNode } from './useLifelongStore'

beforeEach(() => {
  localStorage.clear()
  useLifelongStore.setState({ nodes: [] })
})

describe('useLifelongStore — tree', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useLifelongStore())
    expect(result.current.nodes).toEqual([])
  })

  it('addNode at root creates a pursuit with empty children', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addNode(null, { title: 'Academy' }))
    const n = result.current.nodes[0]
    expect(n.title).toBe('Academy')
    expect(n.children).toEqual([])
    expect(typeof n.id).toBe('string')
  })

  it('addNode nests a child under a parent', () => {
    const { result } = renderHook(() => useLifelongStore())
    let rootId
    act(() => { rootId = result.current.addNode(null, { title: 'Academy' }) })
    act(() => result.current.addNode(rootId, { title: 'AI Bachelor' }))
    const root = result.current.nodes[0]
    expect(root.children).toHaveLength(1)
    expect(root.children[0].title).toBe('AI Bachelor')
  })

  it('addNode ignores a blank title', () => {
    const { result } = renderHook(() => useLifelongStore())
    act(() => result.current.addNode(null, { title: '   ' }))
    expect(result.current.nodes).toHaveLength(0)
  })

  it('deleteNode removes a deeply nested node', () => {
    const { result } = renderHook(() => useLifelongStore())
    let rootId, childId
    act(() => { rootId = result.current.addNode(null, { title: 'Academy' }) })
    act(() => { childId = result.current.addNode(rootId, { title: 'AI Bachelor' }) })
    act(() => result.current.deleteNode(childId))
    expect(result.current.nodes[0].children).toHaveLength(0)
  })

  it('logProgress sets current and a log, clamped to total', () => {
    const { result } = renderHook(() => useLifelongStore())
    let id
    act(() => { id = result.current.addNode(null, { title: 'Rogawski', kind: 'book', total: 1300 }) })
    act(() => result.current.logProgress(id, 213, '2026-05-20'))
    let n = findNode(result.current.nodes, id)
    expect(n.current).toBe(213)
    expect(n.logs).toEqual([{ date: '2026-05-20', value: 213 }])
    act(() => result.current.logProgress(id, 99999, '2026-05-21'))
    n = findNode(result.current.nodes, id)
    expect(n.current).toBe(1300)
  })

  it('logProgress keeps one log per day (last write wins)', () => {
    const { result } = renderHook(() => useLifelongStore())
    let id
    act(() => { id = result.current.addNode(null, { title: 'Rogawski', kind: 'book', total: 1300 }) })
    act(() => result.current.logProgress(id, 100, '2026-05-20'))
    act(() => result.current.logProgress(id, 150, '2026-05-20'))
    expect(findNode(result.current.nodes, id).logs).toEqual([{ date: '2026-05-20', value: 150 }])
  })

  it('bumpProgress increments current by 1', () => {
    const { result } = renderHook(() => useLifelongStore())
    let id
    act(() => { id = result.current.addNode(null, { title: 'Essence of LA', kind: 'playlist', total: 12 }) })
    act(() => result.current.bumpProgress(id, 1))
    expect(findNode(result.current.nodes, id).current).toBe(1)
  })

  it('toggleTask flips done', () => {
    const { result } = renderHook(() => useLifelongStore())
    let id
    act(() => { id = result.current.addNode(null, { title: 'Submit dashboard', kind: 'task' }) })
    act(() => result.current.toggleTask(id))
    expect(findNode(result.current.nodes, id).done).toBe(true)
    act(() => result.current.toggleTask(id))
    expect(findNode(result.current.nodes, id).done).toBe(false)
  })

  it('checklist items add, toggle, and delete', () => {
    const { result } = renderHook(() => useLifelongStore())
    let id
    act(() => { id = result.current.addNode(null, { title: 'Lectures', kind: 'checklist' }) })
    act(() => result.current.addChecklistItem(id, 'Week 1'))
    const itemId = findNode(result.current.nodes, id).checklist[0].id
    act(() => result.current.toggleChecklistItem(id, itemId))
    expect(findNode(result.current.nodes, id).checklist[0].done).toBe(true)
    act(() => result.current.deleteChecklistItem(id, itemId))
    expect(findNode(result.current.nodes, id).checklist).toHaveLength(0)
  })

  it('toggleNodeDay adds then removes a weekday', () => {
    const { result } = renderHook(() => useLifelongStore())
    let id
    act(() => { id = result.current.addNode(null, { title: 'Self Study', kind: 'habit', perWeek: 4 }) })
    act(() => result.current.toggleNodeDay(id, 'Mon'))
    expect(findNode(result.current.nodes, id).days).toEqual(['Mon'])
    act(() => result.current.toggleNodeDay(id, 'Mon'))
    expect(findNode(result.current.nodes, id).days).toEqual([])
  })
})

describe('newNode sessionHours', () => {
  it('defaults sessionHours to null and accepts a number', () => {
    expect(newNode({ title: 'x' }).sessionHours).toBe(null)
    expect(newNode({ title: 'x', sessionHours: 2 }).sessionHours).toBe(2)
    expect(newNode({ title: 'x', sessionHours: '1.5' }).sessionHours).toBe(1.5)
  })
})
