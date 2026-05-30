# Consistent+Potent — Redesign Design Spec

**Date:** 2026-05-30
**Status:** Approved (pending written-spec review)

Four-part redesign:
1. Lifelong Goals → unlimited-depth tree with typed leaf goals + auto-rollup
2. Daily planning → per-date ad-hoc todos; Planner gains Week + Month views with one-off/recurring filter
3. Remove the Finance feature entirely
4. Unify the design system; rebuild light mode for readability (Direction A + larger type)

Decisions locked during brainstorming. **Clean start** — no migration of old data; new storage keys.

---

## 1 · Lifelong Goals — nested tree + typed goals

### Data model

Single recursive `node`, unlimited nesting. New storage key `consistent:lifelong:v2`.

```js
node = {
  id, title,
  children: [node, ...],              // non-empty → category (auto-rollup)
  kind: 'book'|'playlist'|'task'|'checklist'|'habit'|'custom'|null,
  // measurement fields, used per kind:
  unit, total, current, logs: [{date, value}],  // book / playlist / custom
  checklist: [{id, text, done}],                 // checklist
  cadence: { perWeek, days: [], streak },        // habit
  done,                                          // task
  deadline,                                      // optional (task/book/custom)
  collapsed,
}
```

**Clean separation rule:**
- `children.length > 0` → **category**. Progress is computed (auto-rollup), never entered directly.
- otherwise → **leaf**, measured by `kind`.
- Adding a child to a leaf converts it to a category (its own metric is dropped from display; rollup takes over).

**6 templates → measurement primitives:**

| kind | primitive | UI |
|---|---|---|
| `book` | `current/total` | progress bar, pace, ETA |
| `playlist` | `current/total` | dot-grid if total ≤ 24, else bar; `+1` button |
| `task` | `done` boolean | checkbox; optional deadline chip — **the task-focused leaf** |
| `checklist` | `n done / m` of inline sub-items | inline checkable rows inside one node |
| `habit` | weekly `cadence` | weekday dots, streak; feeds Planner schedule |
| `custom` | `current/total` + free `unit` | bar (covers hours, km, problems, words…) |

### Progress computation (`lib/lifelongProgress.js`, extended)

- `nodePct(node)`:
  - leaf: by kind — `current/total` clamped 0..1; `task` → 0 or 1; `checklist` → done/total; `habit` → null (cadence, not %); `custom` → `current/total`.
  - category: **weighted average of children's `nodePct`** (skip null/habit children, or weight by descendant leaf count — use simple mean of non-null children for v1).
- `pace`/`eta`/`neededRate` logic retained for `current/total` kinds (book/playlist/custom) — recurse only matters at leaves.
- `task` rollup: a category of tasks shows `% of done descendants`.

### Navigation & placement

- **New page** `/goals` (sidebar item "Goals"). Full tree, **drill-in + breadcrumb**: click a category → show its children, breadcrumb (`Academy › AI Bachelor › …`) to go back. Add/edit/delete at every level. Leaf detail (log progress) inline.
- **Dashboard card** becomes a **summary**: top 2-3 active pursuits + overall avg %, "open all →" link to `/goals`.

### Store (`store/useLifelongStore.js`, rewritten)

Recursive helpers operating on a node tree: `addNode(parentId, partial)`, `updateNode(id, patch)`, `deleteNode(id)`, `moveNode`, `toggleCollapsed(id)`, `logProgress(id, value)`, `toggleTask(id)`, `toggleChecklistItem(id, itemId)`, `toggleHabitDay(id, day)`. Persist whole tree to `consistent:lifelong:v2`.

---

## 2 · Daily planning — Planner with Week + Month

### Day-plan store (new `store/useDayPlanStore.js`)

```js
{ 'YYYY-MM-DD': { todos: [{ id, text, done }] } }   // key: consistent:dayplan
```

Replaces the "today only, archive on rollover" model in `useGoalsStore` daily handling. Any date — past/today/future — holds its own one-off todos.

### Two item kinds on a day (already conceptually present)

- 🔁 **recurring** — habit / lifelong items scheduled on that weekday (from the tree's `habit` cadence + scheduled leaves). Auto-appear every matching week.
- ○ **one-off** — entries in `useDayPlanStore` for that specific date.

### Planner page

- Header: `Week | Month` segmented toggle + filter chips `All · ○ One-off · 🔁 Recurring`.
- **Week mode:** existing `WeekBoard` extended — each day cell gets `+ add` to write a one-off todo for that date. Drag-schedule of lifelong items retained.
- **Month mode:** calendar grid. Per-day dots — green = one-off present, grey = recurring present. Click a day → that day's agenda (one-off + recurring), editable.
- `buildWeek` / new `buildMonth` read lifelong tree (recurring) + `useDayPlanStore` (one-off) + done map.

### Dashboard "Goals" card (daily section)

The **daily** tab switches to a date-navigable agenda (‹ ›) sourced from `useDayPlanStore` + scheduled recurring items, so today's plan stays on the dashboard. The **weekly / monthly / yearly** tabs remain unchanged, still backed by the existing `useGoalsStore` (out of scope for this redesign beyond the new type/light tokens).

---

## 3 · Remove Finance entirely

**Delete:** `pages/Finance.jsx`, `store/useFinanceStore.js`, `store/useFinanceStore.test.js`, `lib/currency.js`, `lib/currency.test.js`, `lib/financeUtils.test.js`, `lib/useMoney.js`.

**Edit out finance:**
- `App.jsx` — drop `/finance` route + import.
- `components/layout/Sidebar.jsx`, `BottomNav.jsx` — remove Finance nav item.
- `components/dashboard/GraphCard.jsx`, `RecapCard.jsx` — remove finance series/metrics.
- `components/ui/Widgets.jsx` — remove money widgets if finance-only.
- `pages/Settings.jsx`, `store/useSettingsStore.js` — remove currency setting.
- `lib/cloudSync.js`, `lib/backup.js` — drop finance keys from sync/backup manifests.
- `lib/deltaTone.js` (+ test) — keep only if used outside finance; else remove.

**Acceptance:** `npm run build`, `npm run lint`, `npm test` all green; no dead imports; no Finance UI anywhere.

---

## 4 · Design unification + light mode

**Direction A (refined dark-first) + larger type.** Single source: `styles/tokens.css`.

### Type scale (bumped)
- body 13 → **15px**, label 11 → **12px**, numbers → **14px** (mono), progress bars 7 → **8px**.
- Headings/`card-h` keep hierarchy; recompute `--fs-*` tokens.

### Light mode rebuilt (AA contrast)
- `--accent` (light) → `#15a34a` (dark green, readable on white) while dark stays `#4ade80`.
- `--border` → `#dde1e8` (visible), `--border-strong` darker; `--text` `#14161b`; `--text-mid` `#5c626e`; `--muted` accordingly.
- `--bg` `#eef0f3`, `--card` `#ffffff`, soft card shadow lifts cards off bg.
- Kill grey-on-grey: every surface/text pair meets WCAG AA.

### Unification
- All cards/components align to one card shell, spacing scale, and the new type scale. Audit each component (`dashboard/*`, `planner/*`, `journal/*`, `ui/*`) for off-system colors/sizes and fold them into tokens.

---

## Build order (high level)

1. **Finance removal** (isolated, unblocks/clean baseline).
2. **Design tokens** (type scale + light mode) — visible everywhere, low risk.
3. **Lifelong tree** (model + store + `/goals` page + dashboard summary).
4. **Daily/Planner** (day-plan store + Week/Month + filter).

Detailed atomic steps, file paths, and acceptance criteria go in the implementation plan (writing-plans).

## Known risks

- Recursive rollup performance/edge cases (empty categories, all-habit children → null %). Define: category with no non-null children shows "—".
- Drill-in state (current node) must survive re-render; keep in page state, not store.
- Month view date math reuses `dateUtils`; verify week/locale start.
- Removing `deltaTone`/`Widgets` pieces — confirm no non-finance consumers before deleting.
