import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'
import { todayISO } from '../lib/dateUtils'

// v2 — recursive tree. Clean start: the old `consistent:lifelong` (2-level
// pursuit/item) shape is intentionally NOT migrated.
const KEY = 'consistent:lifelong:v2'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// A fresh node. `kind` null = a plain category until a leaf kind is chosen.
// Categories are simply nodes that end up with children.
export function newNode({ title, kind = null, unit = null, total = null, perWeek = null, deadline = null }) {
  return {
    id: genId(),
    title: (title || '').trim(),
    kind,
    children: [],
    // measured leaves (book / playlist / custom)
    unit: unit || null,
    total: total != null && total !== '' ? Number(total) : null,
    current: 0,
    logs: [],
    // checklist leaf
    checklist: [],
    // task leaf
    done: false,
    // habit leaf
    perWeek: perWeek != null && perWeek !== '' ? Number(perWeek) : null,
    // scheduling (any leaf can surface on planner/daily days)
    days: [],
    deadline: deadline || null,
    collapsed: false,
  }
}

function load() {
  const raw = loadData(KEY, [])
  return Array.isArray(raw) ? raw : []
}

// ── pure tree helpers ───────────────────────────────────────
// Return a new tree with node `id` replaced by fn(node).
function mapNode(nodes, id, fn) {
  return nodes.map(n => {
    if (n.id === id) return fn(n)
    if (n.children?.length) return { ...n, children: mapNode(n.children, id, fn) }
    return n
  })
}

// Return a new tree with node `id` removed.
function removeNode(nodes, id) {
  return nodes
    .filter(n => n.id !== id)
    .map(n => (n.children?.length ? { ...n, children: removeNode(n.children, id) } : n))
}

// Insert `child` under parent `id` (or at root when parentId is null).
function insertChild(nodes, parentId, child) {
  if (parentId == null) return [...nodes, child]
  return nodes.map(n => {
    if (n.id === parentId) return { ...n, children: [...(n.children || []), child] }
    if (n.children?.length) return { ...n, children: insertChild(n.children, parentId, child) }
    return n
  })
}

export function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children?.length) {
      const found = findNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

// Breadcrumb path (root → … → id), or [] if not found.
export function nodePath(nodes, id, trail = []) {
  for (const n of nodes) {
    const next = [...trail, n]
    if (n.id === id) return next
    if (n.children?.length) {
      const found = nodePath(n.children, id, next)
      if (found.length) return found
    }
  }
  return []
}

export const useLifelongStore = create((set, get) => {
  const commit = (nodes) => { saveData(KEY, nodes); set({ nodes }) }
  const patch = (id, fn) => commit(mapNode(get().nodes, id, fn))

  return {
    nodes: load(),

    addNode: (parentId, partial) => {
      const node = newNode(partial || {})
      if (!node.title) return null
      commit(insertChild(get().nodes, parentId, node))
      return node.id
    },

    updateNode: (id, p) => patch(id, n => ({ ...n, ...p })),

    deleteNode: (id) => commit(removeNode(get().nodes, id)),

    toggleCollapsed: (id) => patch(id, n => ({ ...n, collapsed: !n.collapsed })),

    // book / playlist / custom — record an absolute reading (one log per day).
    logProgress: (id, value, date = todayISO()) => patch(id, n => {
      const v = n.total != null ? Math.max(0, Math.min(n.total, Number(value) || 0)) : Math.max(0, Number(value) || 0)
      const logs = [...(n.logs || []).filter(l => l.date !== date), { date, value: v }]
        .sort((a, b) => a.date.localeCompare(b.date))
      return { ...n, current: v, logs }
    }),

    bumpProgress: (id, by = 1) => patch(id, n => {
      const next = (n.current || 0) + by
      const v = n.total != null ? Math.max(0, Math.min(n.total, next)) : Math.max(0, next)
      const date = todayISO()
      const logs = [...(n.logs || []).filter(l => l.date !== date), { date, value: v }]
        .sort((a, b) => a.date.localeCompare(b.date))
      return { ...n, current: v, logs }
    }),

    toggleTask: (id) => patch(id, n => ({ ...n, done: !n.done })),

    addChecklistItem: (id, text) => patch(id, n => ({
      ...n, checklist: [...(n.checklist || []), { id: genId(), text: text.trim(), done: false }],
    })),
    toggleChecklistItem: (id, itemId) => patch(id, n => ({
      ...n, checklist: (n.checklist || []).map(i => i.id === itemId ? { ...i, done: !i.done } : i),
    })),
    deleteChecklistItem: (id, itemId) => patch(id, n => ({
      ...n, checklist: (n.checklist || []).filter(i => i.id !== itemId),
    })),

    // scheduling on the planner/daily board (by weekday key Mon..Sun)
    toggleNodeDay: (id, day) => patch(id, n => ({
      ...n, days: (n.days || []).includes(day) ? n.days.filter(d => d !== day) : [...(n.days || []), day],
    })),
    moveNodeDay: (id, fromDay, toDay) => patch(id, n => {
      if (fromDay === toDay) return n
      const days = new Set(n.days || [])
      days.delete(fromDay); days.add(toDay)
      return { ...n, days: [...days] }
    }),
  }
})
