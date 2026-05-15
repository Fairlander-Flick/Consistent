# Dashboard Redesign v2 — Design Spec

**Date:** 2026-05-15
**Scope:** `src/pages/Dashboard.jsx` and the cards it composes, plus the supporting stores, the Settings page, and a new recurring-schedule editor on the Consistency page. Iterates on `2026-05-14-dashboard-redesign-design.md`.

## Goals

1. **Bento layout (B1):** asymmetric but void-free — a tall Graph paired with a Goals+Journal stack of equal combined height; full-width Weekly band; Consistency below the fold.
2. **This Week → weekly time-grid:** Google-Calendar-style grid timing class + work + one-off events; training shown as an untimed per-day pill.
3. **Journal:** explicit Submit instead of auto-save; after submit, a read-only view + "Edit today" until the day rolls over.
4. **Graph color semantics:** finance profit/loss green/red on headline *and* drag-Δ; weight neutral white unless a weight goal is set; volume neutral.
5. **Settings:** add a Weight-goal preference (Lose / Gain / No preference).
6. **Consistency:** one continuous flat GitHub grid (no per-month blocks).
7. **English-only:** remove the two Turkish strings.
8. **Audit fixes:** items 1–7 from the audit (below).

Everything is approved; this spec is implementation-ready.

---

## 1. Bento layout

`src/styles/tokens.css` — rewrite the `.bento` grid. Keep existing area class names to minimise churn (`area-weight`=Graph, `area-goals`=Goals, `area-journal`=Journal, `area-workout`=This Week, `area-contrib`=Consistency).

```css
.bento {
  display: grid;
  gap: var(--gap-bento);
  grid-template-columns: repeat(12, 1fr);
  grid-template-areas:
    "p p p p p p p p o o o o"
    "p p p p p p p p j j j j"
    "k k k k k k k k k k k k"
    "c c c c c c c c c c c c";
}
.bento .area-weight  { grid-area: p; }  /* Graph  */
.bento .area-goals   { grid-area: o; }  /* Goals  */
.bento .area-journal { grid-area: j; }  /* Journal */
.bento .area-workout { grid-area: k; }  /* This Week */
.bento .area-contrib { grid-area: c; }  /* Consistency */

@media (max-width: 1023px) {
  .bento {
    grid-template-columns: 1fr;
    grid-template-areas: "p" "o" "j" "k" "c";
  }
}
```

Graph spans rows 1–2 on the left (8 cols). Goals occupies row 1 right (4 cols), Journal row 2 right (4 cols). Because Graph's row span equals the Goals+Journal stack, the columns end on the same line **by grid construction** — no card is stretched empty, no void. Weekly is a full-width band (row 3); Consistency full-width (row 4, naturally below the fold given the bands above it). Mobile: single column, order Graph → Goals → Journal → This Week → Consistency. Remove the now-unused old area mapping comment block.

`Dashboard.jsx` keeps its current structure (page-head + `<div className="bento">` composing the five cards). No JSX change required beyond what individual cards need.

---

## 2. This Week — weekly time-grid

### 2.1 New store: `useScheduleStore` (`src/store/useScheduleStore.js`)

Storage key `consistent:schedule`. Follows the existing `loadData`/`saveData` + zustand pattern used by the other stores.

```js
// shape
{
  recurring: {                       // keyed by weekday
    Mon: [ { id, kind, label, start, end } ], Tue: [...], ... Sun: []
  },
  oneoffs: [                         // non-recurring, date-specific
    { id, date: 'YYYY-MM-DD', kind, label, start, end }
  ]
}
// kind: 'class' | 'work' | 'other'
// start / end: 'HH:MM' 24h strings
```

Default `recurring` = the 7 weekday keys each mapped to `[]`. Actions:

- `addRecurringBlock(day, { kind, label, start, end })` — pushes with generated `id`.
- `updateRecurringBlock(day, id, patch)`
- `removeRecurringBlock(day, id)`
- `addOneoff({ date, kind, label, start, end })`
- `removeOneoff(id)`
- `weekBlocks(weekDates)` selector — given the 7 ISO-week date strings, returns per-date arrays: for each date, the recurring blocks for that weekday **plus** any one-offs whose `date` matches. Each returned block carries `{ id, kind, label, start, end, source: 'recurring' | 'oneoff' }`.

All mutating actions persist via `saveData` then `set`, exactly like the other stores. Add `src/store/useScheduleStore.test.js` covering: recurring add/remove, one-off add/remove, and `weekBlocks` merging recurring + one-off for a week.

### 2.2 ThisWeekCard rewrite (`src/components/dashboard/ThisWeekCard.jsx`)

Header: `This Week` + week range (`May 11 – 17`) + totals derived from blocks (`{workHours}h work · {classHours}h class`, summed from block durations by kind across the visible week).

**Training pill row** — at the top of each day column, reuse the existing derivation (`useTrainingStore` log/program → `workout` | `rest` | `upcoming`) and the existing visual treatment + today's **Mark done** / **Undo**. This is unchanged behaviour, just relocated to the top of each column instead of a separate 7-cell strip + today block. "Rest day" copy is fixed to English (§7).

**Time grid** — below the pills:

- Gather all class/work/one-off blocks for the current ISO week via `weekBlocks(isoWeekDates())`.
- Compute `gridStart` = floor-to-hour of the earliest block start, `gridEnd` = ceil-to-hour of the latest block end. Clamp so the window is never tiny or empty: `gridStart = min(gridStart, 08:00)`, `gridEnd = max(gridEnd, 18:00)`. If there are no blocks at all, use `08:00–18:00`. This guarantees a sensible non-empty grid with no dead extremes (matches the "no dead space" requirement).
- Layout: an hour-row scale (`HOUR_PX`, e.g. 26px) on a left axis; 7 day columns. Each block is absolutely positioned: `top = (startMin − gridStartMin)/60 · HOUR_PX`, `height = (endMin − startMin)/60 · HOUR_PX` (min height clamp ~16px so very short blocks stay readable).
- Block colors: class = blue (`rgba(96,165,250,*)` / `#93c5fd`), work = amber (`rgba(250,204,21,*)` / `#facc15`), one-off/other = violet (`rgba(168,85,247,*)` / `#c084fc`). These three accent colors are added as CSS custom properties in `tokens.css` (`--sched-class`, `--sched-work`, `--sched-oneoff`, plus soft/line variants) so they live with the other tokens, not inline-hardcoded.
- Today's column gets the accent border treatment already used for "today".

**One-off add** — each day-column header has a `+` button opening a small popover/inline form anchored to that column: fields = kind (`Class` / `Work` / `Other`), label (text), start (time), end (time); **Save** calls `addOneoff({ date, ... })` for that column's date, **Cancel** dismisses. One-offs are only added for dates in the visible week. A one-off block shows a small `×` on hover that calls `removeOneoff(id)` (recurring blocks are read-only here — they're edited on the Consistency page, §2.3).

Remove the old legend strip and the separate "Today block"; their information is now carried by the per-column pill + the grid.

### 2.3 Recurring editor on the Consistency page

`src/pages/Consistency.jsx` — add a new section/card **"Weekly Schedule"** (placed alongside the existing Program editor; follow that section's card/markup conventions). For each of the 7 weekdays: list its recurring blocks (`kind` tag, label, `start–end`) each with a remove `×`, plus an inline add form (kind select, label input, start/end time inputs, Add button) calling the `useScheduleStore` recurring actions. This is the only place recurring class/work blocks are created/edited; the dashboard only displays them and manages one-offs.

---

## 3. Today's Journal — submit / edit flow

### 3.1 Store (`src/store/useJournalStore.js`)

Add a `submitted: boolean` to the entry shape (default `false` in `EMPTY_ENTRY`). New actions:

- `submitToday({ score, sleepHours, nutrition, feelings })` — upserts today's entry with all four fields **and** `submitted: true` (single write).
- `editToday()` — sets today's entry `submitted: false`, keeping existing field values (re-opens the form for editing).

The old per-field setters (`setTodayScore`, etc.) and todo setters remain in the store for any other callers/tests but are **no longer used by JournalCard**.

### 3.2 JournalCard (`src/components/dashboard/JournalCard.jsx`)

- **Remove the 800ms debounced auto-save effect entirely.** (This also fixes audit #3 — no more phantom empty entries written just by viewing the dashboard.)
- Derive `submitted` from `getTodayEntry().submitted`. Because entries are keyed by date, a new calendar day has no entry → `submitted` is false → the form shows automatically. No timer needed for the day-rollover; it's implicit in the per-date entry.
- **Form mode** (`!submitted`): the existing score slider / sleep stepper / nutrition pills / feelings textarea, editing local state, with a single primary **Submit** button at the bottom. Submit calls `submitToday(local)`.
- **Submitted mode** (`submitted`): a compact read-only summary (score `7 / 10`, sleep `7.5 h`, nutrition label, feelings text) + an **Edit today** button calling `editToday()` which flips back to form mode with the stored values prefilled.
- Replace the `● saved` footer with the Submit/Edit affordance.

---

## 4. Graph — color semantics

`src/components/dashboard/GraphCard.jsx` + `useSettingsStore`.

- Add `weightGoal: 'lose' | 'gain' | null` to `useSettingsStore` (default `null`, persisted with the other settings; add `setWeightGoal`).
- **Tone helper:** introduce `deltaTone(delta, mode)` → `'pos' | 'neg' | ''`:
  - `mode === 'finance'`: `delta >= 0 → 'pos'`, else `'neg'`.
  - `mode === 'weightLose'`: `delta < 0 → 'pos'`, `delta > 0 → 'neg'`, `0 → ''`.
  - `mode === 'weightGain'`: `delta > 0 → 'pos'`, `delta < 0 → 'neg'`, `0 → ''`.
  - `mode === 'neutral'` (weight with no goal, volume): always `''`.
- **Weight tab:** draw the line/area in a **neutral color** (`var(--text)`, white) instead of `var(--accent)` green. Headline delta and the drag-selection Δ line use `deltaTone` with `weightLose`/`weightGain`/`neutral` per the setting. Tone `''` renders with the plain (uncolored/muted) class — no green, no red.
- **Finance tab:** headline keeps profit/loss coloring. **Also color the drag-Δ balance line** (`balDelta`) via `deltaTone(balDelta, 'finance')` — currently it's plain text; this is the audit #2 fix. Income/expense series keep their fixed semantic colors (green/red) as today.
- **Volume tab:** unchanged, neutral.
- **RangeOverlay** (`src/components/ui/Widgets.jsx`): extend `labelLines` to accept either a string or `{ text, tone }`. When `tone` is `'pos'` render the line in `--accent`, `'neg'` in `--negative`, otherwise the existing default color. GraphCard passes toned objects for the weight Δ line and the finance balance line; other lines stay plain strings.

---

## 5. Settings

`src/pages/Settings.jsx` + `useSettingsStore`.

- New **"Weight goal"** card/section above or below Confirmations: a 3-option control (segmented buttons or radio) — **Lose** / **Gain** / **No preference** — bound to `weightGoal` (`'lose'` / `'gain'` / `null`). Short description: "Controls how weight changes are colored on the dashboard graph."
- **Audit #4:** remove the two non-functional toggles ("Confirm before deleting a transaction", "Confirm before deleting a journal entry") from the Settings UI — they advertise "coming in a future update" and do nothing. The `confirmTxDelete` / `confirmJournalDelete` flags **stay in `useSettingsStore`** (and their tests) for whenever those delete sites are wired; only the dead UI rows are removed. The "Confirm before deleting a goal" toggle stays (it is wired).

---

## 6. Consistency — flat GitHub grid

`src/components/dashboard/ConsistencyCard.jsx` — rewrite the grid to one continuous block.

- `buildYearGrid(year, entries)`: produce a single flat cell list. Leading empty cells = weekday of Jan 1 (Mon=0). Then one cell per day of the year (level from journal `score`, same thresholds as today). No per-month grouping.
- Render as a single CSS grid: `gridTemplateRows: repeat(7, 11px)`, `gridAutoFlow: column`, `gridAutoColumns: 11px`, uniform `gap: 3px` across the **whole** year (no 4px month gaps, no separate month `<div>` blocks).
- **Month labels:** a header row above the grid. For each month, compute the week-column index of its 1st (`floor((leadingEmpty + dayOfYearOfFirst) / 7)`) and position the `Jan Feb …` label at that column. Labels float above, aligned to where each month begins — the GitHub look.
- Keep: the Mon/Wed/Fri weekday gutter, today's ring, the hover tooltip (logic unchanged), the Less–More legend, and the year pills.
- Remove the `months.map(... month block ...)` structure and the inter-month gap entirely.

Result: a symmetric, evenly-spaced 7×~53 grid separated only by weeks, sitting below the fold.

---

## 7. English-only

- `JournalCard.jsx` nutrition options: `🟢 İyi` → `🟢 Good`, `🟡 Orta` → `🟡 Okay`, `🔴 Kötü` → `🔴 Bad`.
- `ThisWeekCard.jsx`: `Rest day — kaliteli dinlen` → `Rest day — recover well`.

A full repo scan confirmed these are the only two Turkish strings; em-dashes/arrows/symbols elsewhere are valid English typography.

---

## 8. Audit fixes (all in scope)

| # | Issue | Fix | Section |
|---|-------|-----|---------|
| 1 | Weight color hardcodes "down = good" (`pos: delta < 0`) | `weightGoal` setting + `deltaTone` | §4, §5 |
| 2 | Finance drag-Δ never colored (only headline) | color balance Δ via `deltaTone` | §4 |
| 3 | Journal auto-save writes phantom empty entries on mount | remove auto-save; write only on Submit | §3 |
| 4 | Dead Settings toggles ("coming in a future update") | remove the two unwired UI rows; keep flags in store | §5 |
| 5 | Silent dummy-data fallback looks like real data | when Graph/Goals fall back to `DUMMY_*`, show a small muted `Sample data` badge in the card header so it's clearly not real logged data | §8a |
| 6 | `useGoalsStore.history` written but unread | leave the store intact (Consistency-page history may use it); out of scope to remove — noted only | — |
| 7 | "Mark done" logs a 0-volume/0-min session that drags Volume avg | Volume chart excludes sessions with no exercises from the average/aggregate (still counts logged real sessions) | §8b |

### 8a. Sample-data badge
`GraphCard` (weight) and `GoalsCard` already fall back to `DUMMY_WEIGHT` / `DUMMY_GOALS`. When the fallback is active, render a small muted pill (`Sample data`) in that card's header. No behavior change, just honest labeling. Reuse a shared `.chip`/`.meta` style.

### 8b. Volume aggregate
In `GraphCard`'s `volumeData` / `labelLines` volume math, ignore sessions where `exercises.length === 0` when computing the per-session average (the auto "Mark done" placeholder). Bars for real sessions are unaffected.

---

## 9. Component / file summary

- **New:** `src/store/useScheduleStore.js` (+ test), recurring-schedule section in `src/pages/Consistency.jsx`.
- **Rewrite:** `ThisWeekCard.jsx` (time-grid + pills + one-off add), `ConsistencyCard.jsx` (flat grid), `JournalCard.jsx` (submit/edit).
- **Edit:** `GraphCard.jsx` (color tones, weight neutral, sample badge, volume filter), `Widgets.jsx` `RangeOverlay` (toned label lines), `useSettingsStore.js` (`weightGoal`), `useJournalStore.js` (`submitted` + `submitToday`/`editToday`), `Settings.jsx` (weight-goal section, remove dead toggles), `tokens.css` (`.bento` areas, schedule color tokens).
- **Unchanged store:** `useTrainingStore` (pill reuses existing derivation), `useGoalsStore`.

## 10. Non-goals (this iteration)

- Wiring `confirmTxDelete` / `confirmJournalDelete` to real delete sites (flags retained for later).
- Migrating historical journal todos.
- Removing the `useGoalsStore.history` write path.
- Drag-to-create events on the time grid (only the `+` popover for one-offs).
- Recurring one-off rules (one-offs are single-date only).
- Persisting Graph range selections; mobile drag refinements.

## 11. Acceptance checklist

- Bento renders B1 with no empty/stretched card at any viewport ≥1024px; single column below.
- This Week shows a dynamic-range time grid (never empty/over-tall), class/work/one-off colored blocks, per-day training pill with working Mark done/Undo today, weekly hour totals, working `+` one-off add and one-off removal.
- Recurring class/work blocks are created/edited only on the Consistency "Weekly Schedule" editor and appear on the dashboard grid.
- Journal: no auto-save; Submit persists once; submitted view + Edit today; new day → empty form automatically; no phantom entries created by viewing.
- Graph: weight line white; weight Δ/headline colored only per `weightGoal` (none = white); finance headline **and** drag-Δ colored; volume neutral; sample-data badge shows on dummy fallback; volume avg ignores empty sessions.
- Settings: weight-goal control persists and drives Graph; the two dead toggles are gone; goal-delete toggle still works.
- Consistency: one continuous evenly-gapped grid, floating month labels, today ring, tooltip, year pills — no per-month blocks.
- No Turkish strings remain (`grep` clean).
- `npm test` and `npm run lint` pass.

Each discrete change is committed atomically (per user preference).
