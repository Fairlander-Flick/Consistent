# Pursuits Manage Mode — Design

**Date:** 2026-05-31
**Status:** Approved (user authorized full build without per-section gates)

## Goal

Give the user deep editing power over the lifelong-goals (pursuits) tree on
`/goals`: rename, edit fields, convert type, move/reparent, reorder, group
(add parent), ungroup (remove parent), indent/outdent, duplicate, multi-select
bulk actions, safe delete with undo. Works on desktop (mouse drag) and mobile
(long-press drag + menu fallback).

Today `/goals` only supports add, delete, and progress logging via layer-by-layer
drill-in. There is no edit UI at all (`updateNode` exists in the store but is
unused), and no structural operations.

## Capabilities (the full list the user can do)

**Content**
- Rename any node.
- Edit measure fields: unit / total / ×week.
- Add/remove deadline.
- Convert type: Category ↔ Book / Playlist / Task / Checklist / Habit / Custom.
  Irrelevant fields cleared; logs kept if still measurable.

**Structure**
- Move / reparent (drag onto a row → child; or "Move to…" picker).
- Reorder within a parent (drag between rows).
- Group: wrap one or more selected nodes in a new parent category.
- Ungroup: dissolve a category, lifting its children up, then remove it.
- Indent / Outdent: keyboard/touch alternatives to drag.
- Guard: a node can never be dropped into its own subtree.

**Bulk & convenience**
- Duplicate a node and its whole subtree (new IDs, progress/logs reset).
- Multi-select (checkboxes) → bulk Move, Group, or Delete.
- Safe delete: confirm when node has children; Undo toast after every
  destructive op.

**Mode & navigation**
- `[ Browse | Manage ]` toggle at the top of `/goals`.
  - Browse = today's drill-in (log progress, quick view) — unchanged.
  - Manage = full indented tree on one screen, drag handle + `⋯` menu per row.
- Expand / collapse branches in Manage (reuses existing `collapsed` flag).

## Architecture

Three layers, UI-independent core.

### 1. `src/lib/lifelongTree.js` (new) — pure tree functions

All structural logic, no React, fully unit-tested. Functions return new trees.

- `isDescendant(nodes, ancestorId, maybeId)` — cycle guard.
- `moveNode(nodes, id, newParentId, index)` — detach + insert at index.
- `reorderWithin(nodes, parentId, fromIndex, toIndex)`.
- `groupNodes(nodes, ids, title)` — wrap selected siblings in a new category at
  the first selected node's position. (v1: only groups nodes sharing a parent.)
- `ungroupNode(nodes, id)` — lift children to the node's position, remove node.
- `duplicateNode(nodes, id)` — deep clone subtree with fresh IDs, reset
  `current`/`logs`/`done`/checklist-done, insert right after the original.
- `convertNode(node, newKind)` — return a node with kind changed and stale
  fields cleared per a field-map.
- `indentNode(nodes, id)` / `outdentNode(nodes, id)`.
- Re-exports the existing `findNode`, `nodePath`, plus a `flattenVisible(nodes)`
  helper that produces the ordered, depth-tagged row list dnd-kit needs.

### 2. `useLifelongStore.js` — new actions wrapping the pure fns

`moveNode`, `reorderWithin`, `groupNodes`, `ungroupNode`, `duplicateNode`,
`convertNode`, `indentNode`, `outdentNode`. Plus undo:
- Each destructive action snapshots the prior tree into `_undo` (single level).
- `undo()` restores `_undo`.
No existing action changes. Existing helpers stay.

### 3. UI — Manage mode on `/goals`

- `Goals.jsx` gains a `[ Browse | Manage ]` segmented toggle (local state).
- New `src/components/goals/ManageTree.jsx`:
  - Uses `@dnd-kit/core` + `@dnd-kit/sortable` for flat-list-with-depth dragging
    (the well-known "sortable tree" pattern). Touch via `PointerSensor` with an
    activation delay (long-press) so scrolling still works; mouse via the same
    sensor with a small distance threshold.
  - Renders `flattenVisible(nodes)` as indented rows. Collapsed branches hide
    their descendants from the flat list.
  - Drag changes both depth (reparent) and order; on drop, compute target parent
    + index and call `moveNode` / `reorderWithin`.
- New `src/components/goals/ManageRow.jsx`: drag handle (`⠿`), collapse chevron,
  ring/title, multi-select checkbox, and a `⋯` menu (Rename, Edit, Move to…,
  Group, Ungroup, Convert, Duplicate, Indent, Outdent, Delete).
- New `src/components/goals/NodeEditModal.jsx`: rename + fields + deadline +
  convert in one modal (reused by Browse-mode edit too).
- New `src/components/goals/MoveToModal.jsx`: tree picker for "Move to…" (the
  no-drag path, primary on mobile).
- A bulk action bar appears when ≥1 row is selected: Move / Group / Delete.
- Undo toast uses the existing `useToastStore` / `Toaster`.

## Dependency

`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (~10kb gz total).
This is the project's first UI dependency; chosen because correct nested
touch+mouse+keyboard drag is too error-prone to hand-roll.

## Error handling & edge cases

- Drop into own subtree → rejected by `isDescendant`, drag snaps back.
- Delete with children → confirm modal; then undo available.
- Convert that loses data (e.g. book→task drops total/logs) → confirm if data
  would be lost.
- Empty group title → defaults to "New group".
- Reordering/grouping across different parents in v1: Group only allows nodes
  with a shared parent; if selection spans parents, Group is disabled with a hint.

## Testing

- `src/lib/lifelongTree.test.js` (new): unit tests for every pure fn —
  move, reorder, group, ungroup, duplicate, convert, indent/outdent, and the
  `isDescendant` guard.
- `useLifelongStore.test.js`: add tests for the new actions + `undo()`.
- Manual: drag on desktop + mobile emulation; verify Browse mode unchanged.
- `npm run lint`, `npm run build`, `npm test` all green before push.

## Out of scope (v1)

- Cross-parent multi-select Group (only same-parent in v1).
- Multi-level undo (single snapshot only).
- Drag between Browse and Manage.
