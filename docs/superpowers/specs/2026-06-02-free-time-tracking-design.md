# Free Time — replacing Journal with a daily time-budget view

**Date:** 2026-06-02
**Status:** Approved (design), pending implementation plan
**Branch (suggested):** `feature/free-time-replace-journal`

## Problem

The dashboard's Journal card (mood/sleep/feelings check-in) is being removed. In
its place the user wants to see, at a glance: **how much free time they really
have each day**, **what their committed time is being spent on**, and **how the
week is balanced** so they can plan. No mood journaling.

Earlier framings ("how much free time is left this week") felt hollow because the
hours were invented. This design makes every number real: the user supplies a
**weekly capacity** (via fixed life-essentials) and a **per-session duration** on
each goal/habit; scheduling those sessions onto days is what consumes time. Free
time is then a true residual, not a guess.

## Core model

```
day available hours = 24 − sleep/day − (sum of weekly essentials ÷ 7)
day used hours      = Σ sessionHours of scheduled, not-done leaves on that day
day free hours      = day available − day used
```

- **Life Essentials** (Workspace/Settings): fixed weekly time the user does not
  allocate to goals — `sleep` (entered as h/day) plus an editable list of weekly
  factors (`Meals`, `Getting ready`, `Commute`, …, each h/week). v1 applies the
  same `available` figure to every weekday. Per-day overrides (e.g. no weekend
  commute) are a deliberate **non-goal** for v1.
- **Session length** (`sessionHours`): a number on each leaf goal/habit — how long
  one session of it takes (e.g. `Rogawski Calculus → 2h`, `Gym → 1.5h`). There is
  **no total estimate** field. Set when adding/editing the pursuit.
- **Scheduling = the existing weekly planner.** A leaf already carries a `days`
  array (Mon..Sun) via `toggleNodeDay`. A leaf scheduled on a weekday contributes
  its `sessionHours` to that day. No new "sessions" store is introduced; the
  weekly plan the user already builds is the source of truth.
- One-off day-plan todos (`useDayPlanStore`) stay **hourless** in v1 and do not
  affect the budget. (Optional hours on one-offs is a later enhancement.)

## The "Free time" card (dashboard)

Replaces `JournalCard` in the bento `area-journal` slot (renamed `area-free`),
bottom-right beside the Consistency heatmap. Read-only — **no "add session"
button**; sessions are managed in the planner.

Layout (top → bottom):
1. **Today ring** (~120px). Coloured arcs = today's scheduled sessions grouped by
   their root pursuit; the unfilled track = free time. Centre shows the hero
   number **`8h` / `FREE`**. Arcs animate in on mount (stroke draw, staggered),
   honouring `prefers-reduced-motion`.
2. **Today legend** — up to ~4 rows: pursuit dot + name + hours. Overflow collapses
   to "+N more".
3. **Week strip** — 7 tiny day rings (Mon..Sun), today highlighted, with each day's
   **free hours** beneath. Days at/over capacity render their figure in
   `--negative` (e.g. "Thu · 3" red) so overload is obvious for planning.

**Colour:** ring segments use the app's **green ramp** (accent at descending
lightness, like the contribution heatmap) so the card blends with the rest of the
green-themed dashboard. The free hero number uses `--accent`. (A categorical
palette is a possible later toggle but is out of scope.) Light mode is driven
entirely by existing `tokens.css` variables — no hard-coded colours.

## New / changed files

**New**
- `store/useEssentialsStore.js` — `{ sleepPerDay, factors: [{id,name,hoursPerWeek}] }`
  with add/update/remove actions; persisted via `storage` under
  `consistent:essentials`. Local-only in v1 (mirrors `dayplan` — not in
  `cloudSync`); flagged as a sync follow-up.
- `lib/timeBudget.js` (pure, unit-tested):
  - `dailyAvailableHours(essentials)`
  - `dayUsedHours(date, nodes)` and `dayBreakdown(date, nodes)` → segments grouped
    by root pursuit `{ pursuitId, title, hours }`
  - `buildWeekFree(refDate, nodes, essentials, today)` → 7× `{ date, weekday,
    available, used, free, isToday, over }`
- `components/dashboard/FreeTimeCard.jsx`

**Changed**
- `store/useLifelongStore.js` — `newNode` gains `sessionHours: null`; existing
  generic `updateNode` already persists it.
- `components/goals/NodeEditModal.jsx` — add a `sessionHours` input shown for leaf
  kinds (goal/habit/etc.); not shown for categories.
- `lib/lifelongTodos.js` — include `sessionHours` on each returned item so the
  planner can render an hour tag (e.g. `2h`).
- `lib/weekPlanner.js` — surface per-item hours / per-day used total for hour tags
  in `WeekBoard` (display only; no behaviour change).
- `pages/Dashboard.jsx` — swap `JournalCard` → `FreeTimeCard`.
- `pages/Settings.jsx` — add a **Life Essentials** section (sleep stepper +
  add/remove weekly factor rows, with a live "available per day" readout).
- `styles/tokens.css` — rename bento `area-journal` → `area-free`; add `.free-*`
  card + week-strip styles; remove journal-only styles (see below).

## Journal removal (mirror the Finance-removal pattern)

Delete and de-reference everything Journal, in one pass:
- Files: `pages/Journal.jsx`, `components/journal/JournalTodayEditor.jsx`,
  `components/dashboard/JournalCard.jsx`, `store/useJournalStore.js`
  (+ `useJournalStore.test.js`), `lib/journalMood.js`.
- `App.jsx` — remove the `Journal` import and `/journal` route.
- `components/layout/Sidebar.jsx` + `BottomNav.jsx` — remove the Journal nav item;
  add a Free-time entry only if a nav slot is wanted (default: no new nav item, the
  card lives on the dashboard).
- `lib/cloudSync.js` + `lib/backup.js` — drop the `consistent:journal` key; add
  `consistent:essentials` to backup (local) export/import.
- `styles/tokens.css` — remove `.journal-grid`, `.jx-*`, `.jm-*`, `.score-range`.

## Components & boundaries

- `timeBudget.js` is **pure** and is the single place budget maths lives; the card
  and the (optional) planner hour-tags both read from it. Fully unit-testable
  without React.
- `FreeTimeCard` only *reads* — from `useLifelongStore`, `useEssentialsStore`, and
  the dashboard `viewDate` context. When `viewDate` is a past day it shows that
  day as "today ring" for consistency with the other cards.
- `useEssentialsStore` owns only essentials config; session hours live on the
  lifelong nodes they belong to (no duplication).

## Edge cases & errors

- **No sessions today** → ring is empty track, hero shows full `available` as free.
- **Over budget** (used > available) → free clamps display to `0h`, the day-strip
  figure shows `−Xh` in `--negative`; ring caps the filled arc at 100%.
- **No essentials configured** → default `sleepPerDay = 8`, no factors ⇒ available
  = 16h/day, with a one-line prompt in the card linking to Settings.
- **Done sessions**: a completed leaf still *counts* as used time for the day (it
  consumed the hours); `dayBreakdown` includes done + not-done. (Decision: counting
  planned time, matching the planner.)
- Fractional hours (`1.5h`) supported; display trims trailing `.0`.

## Testing

- `timeBudget.test.js`: available-hours maths; per-day used/free with mixed
  cadences; week build with an over-budget day; empty/no-essentials defaults;
  fractional sums.
- Update/remove `useJournalStore.test.js`; ensure suite stays green.
- Manual: schedule a 2h goal on Thu, confirm Thu free drops and turns red at
  capacity; toggle theme for light-mode contrast.

## Non-goals (v1)

Per-day essentials overrides; one-off todo hours; total-estimate/progress-vs-budget;
categorical ring palette; cloud sync of essentials; a dedicated Free-time page.

## Open setting confirmed during design

- Capacity model: **derived per day** from Life Essentials (sleep h/day + weekly
  factors ÷ 7), uniform across the week. Sleep entered as h/day, other factors as
  h/week.
- Ring colour: **green ramp** (site-consistent), not the categorical orange/pink
  palette.
- Card placement: **the old Journal slot** (compact, bottom-right).
