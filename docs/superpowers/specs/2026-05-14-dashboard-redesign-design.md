# Dashboard Redesign — Design Spec

**Date:** 2026-05-14
**Scope:** `src/pages/Dashboard.jsx` and the stores / settings surfaces it depends on. Other pages (Consistency, Finance, Training, Settings) are touched only where the dashboard needs them.

## Goal

Replace the current dashboard cards with a more focused set:

1. **Graph** — replaces the Weight-only chart. Three tabs (Weight / Finance / Volume), drag-to-select range with delta summary, multi-series toggle on Finance.
2. **This Week** — remove "pending" state. Rest days are derived automatically from the training program and rendered green. A quick "Mark done" button appears for today.
3. **Today's Journal** — todos are removed. Free-text feelings, 1–10 day score, sleep hours, and a 3-option nutrition pill.
4. **Goals** — hover-to-delete with a confirm dialog. The confirm dialog has a "Don't ask again" checkbox wired to a new Settings preference.
5. **Consistency** — GitHub-style daily-only grid with year pills (2026, 2027, …). Weekly / Monthly / Yearly rows are removed.

Only the Dashboard is in scope for this iteration. Required supporting changes (Settings page additions, training duration field, journal store reshape) are listed below.

---

## 1. Graph card

Replaces the current `area-weight` card.

### Layout

- Header: `<h3>Graph</h3>` · segmented tab control (Weight / Finance / Volume) · right side shows the *headline number* for the active tab.
- Body: 200px chart area with drag-to-select range.
- Below body: per-tab controls (multi-series toggles for Finance / Volume; nothing for Weight).
- Default tab: **Weight**.

### Tab — Weight

- Single line, last 28 days, identical data shape to today's `WeightChart`.
- Headline: latest weight + delta vs previous entry (existing logic).

### Tab — Finance

- Source: `useFinanceStore.transactions`, last 28 days.
- Three derived series, all drawn on the same chart:
  - **Income** (green `--accent`) — daily sum of `type === 'income'`.
  - **Expense** (red `--negative`) — daily sum of `type === 'expense'`.
  - **Balance** (white, dashed) — running cumulative `Σ income − Σ expense` from day 0 of the window.
- Below the chart: 3 toggle pills (Income / Expense / Balance). Tapping a pill hides/shows that series. State is component-local (resets when leaving the tab).
- Headline: net of the 28-day window (`+412 €` style), green if positive, red if negative.

### Tab — Volume

- Source: `useTrainingStore.log`, last ~12 sessions (chronological).
- Two series, dual encoding:
  - **Volume** (bars, green soft) — `Σ reps × weight` per session.
  - **Duration** (line, white) — minutes per session.
- Toggle pills below: Volume / Duration. Same hide/show behavior as Finance.
- Headline: last session's `volume kg · duration min`.
- **Requires new field:** `session.durationMinutes`. See Training store changes below.

### Drag-to-select range

The chart supports a range brush:

- Pointer down on chart body → start range. Pointer move → extend. Pointer up → freeze selection.
- Selection is visualized as a translucent green rectangle (`rgba(74,222,128,0.10)`) with two dashed vertical edges and small handle dots at mid-height.
- A floating label appears at the top of the chart, anchored to the start of the selection. Content is tab-specific:
  - **Weight**: `start kg`, `end kg`, `change` (signed Δ + percent).
  - **Finance**: for each *visible* series, the appropriate aggregate — `income Σ`, `expense Σ`, `balance Δ`.
  - **Volume**: `volume Σ`, `duration Σ`, `avg / session` (combined volume kg + duration min).
- Handles on the rectangle edges can be dragged to resize.
- Clicking anywhere outside the rectangle, or pressing `Escape`, clears the selection.
- A small `↔ drag to select` hint sits next to the tabs.

### Component shape

A new `<GraphCard />` component owns:

- Active tab state.
- Per-tab series-visibility state.
- Selected range (`{ start: number, end: number } | null` in data-index space).

The chart primitives stay in `src/components/ui/Widgets.jsx`; add a thin `RangeOverlay` that takes pointer events and the chart's x-scale.

---

## 2. This Week card

### State derivation per day

For each day of the current ISO week, derive one of three states:

- **`workout`** — `useTrainingStore.log` has an entry for that date.
- **`rest`** — no log entry AND the training program for that weekday has no exercises (`program[day].exercises.length === 0`). Both past and future days can be `rest`.
- **`upcoming`** — no log entry, future date, and the program for that weekday has exercises. (Past days that match this case stay `upcoming` visually — the user simply missed them; they don't auto-flip to workout.)

Rest is fully derived. There is no rest-log button and no rest-log record anywhere.

### Visual states

| State    | Background                        | Border                  | Icon |
|----------|-----------------------------------|-------------------------|------|
| workout  | solid `--accent`                  | none                    | `✓` (dark) |
| rest     | `rgba(74,222,128,0.18)`           | `rgba(74,222,128,0.35)` | `○` (accent) |
| upcoming | `#111`                            | `#222`                  | `·` (muted) |

Today gets a 2px white inset ring on top of any state.

### Today block

Below the 7-day row, a wider block describes today:

- **Today is a workout day, not yet logged:** "Today · Wednesday" / "Push Day (Chest + Shoulders)" / two buttons: **Mark done** (primary, green) and **Open program →** (ghost). "Mark done" creates a minimal session entry for today (no exercises, no volume) so the day flips to `workout` immediately; the user can still open the Training page to add detail.
- **Today is a rest day:** "Today · Wednesday" / "Rest day — kaliteli dinlen" / **no buttons**. Purely informational.
- **Today's workout already logged:** card border tints green; left side shows session summary `✓ Push Day logged · 14,250 kg · 62 min`; right side shows **Undo** (ghost), which deletes today's log entry.

Legend strip at the bottom: Workout · Rest · Upcoming. No "Pending".

---

## 3. Today's Journal card

### Data model

The current per-day journal entry shape changes from todo-based to structured-fields:

```js
{
  date: 'YYYY-MM-DD',
  feelings: string,       // free text
  score: number | null,   // 1..10
  sleepHours: number | null, // 0.0..24.0, step 0.5
  nutrition: 'good' | 'mid' | 'bad' | null,
}
```

Old todo arrays are not migrated forward into the new fields. The Consistency card's `Daily` row, which historically read from `journal.todos`, switches to reading `score / 10` as its completion ratio (see Consistency below). Historical entries with `todos` are left in storage but ignored by the new dashboard — a follow-up migration can clean them up later if needed.

### Layout

- Header: `<h3>Today's Journal</h3>` · right-side meta shows the date (`May 14 · Thu`).
- 3-column metric strip (12px gap, each tile gets its own `#111` bordered panel):
  1. **Day score** — large numeric `7 / 10` in mono, a 6px slider underneath with a green fill + white-on-green knob. Drag to set. Empty state: `— / 10` muted, no knob.
  2. **Sleep** — large numeric `7.5 h`. Below, `−` / `+` stepper buttons (step 0.5). Tapping the number opens an inline numeric input.
  3. **Nutrition** — three pills: 🟢 İyi / 🟡 Orta / 🔴 Kötü. Single-select. Active pill tints by color (green/yellow/red soft-bg).
- Label `How are you feeling today?` (small caps muted) above a textarea (min 110px, vertical resize, monospace placeholder).
- Footer: `● saved 2s ago` (right-aligned, muted) after a successful debounced save.

Auto-save: 800ms debounce on any field change. No explicit save button.

---

## 4. Goals card

Behavior is unchanged except:

- On hover over a todo row, a `×` button fades in on the right edge (red-tinted on hover).
- Clicking `×` opens a confirm dialog:
  - Title: **Delete goal?**
  - Body: `You're about to remove <item text> from your <period> goals.` (item text highlighted in a red soft-pill).
  - **`☐ Don't ask again (you can re-enable in Settings)`** checkbox below the body.
  - Buttons: **Cancel** (ghost) · **Delete** (red, primary).
- If the checkbox is ticked and Delete is confirmed, the corresponding Settings toggle (`confirmGoalDelete`) flips to OFF. Future deletes from the Goals card skip the dialog and remove immediately.
- The Yearly tab stays in the period control (the redesign does not touch the period model; only Consistency's rows are reduced).

---

## 5. Consistency card

### Layout

- Header: `<h3>Consistency</h3>` · right-side **year pills** (`2026`, `2027`, …, active highlighted).
- Year pills always start at 2026 and extend forward as years pass. Past years before 2026 are not shown.
- Body: a GitHub-style daily grid for the selected year.

### Grid

- 12 month blocks laid out horizontally with a 4px gap between months so month boundaries are visible.
- Each month is a CSS grid of 7 rows × N columns (N = number of weeks the month spans), 11px cells with 3px gaps.
- The first month leaves empty cells at the top of its first column until the year's January 1st weekday is reached.
- Month labels (`Jan Feb …`) above the grid, aligned to each month block.
- Day-of-week labels (`Mon`, `Wed`, `Fri`) in a left gutter.

### Cell fill — completion level

Source: `useJournalStore.entries` for the selected year.

- Level 0: no entry, or entry has no `score`.
- Level 1: `score` 1–3.
- Level 2: `score` 4–5.
- Level 3: `score` 6–7.
- Level 4: `score` 8–10.

(Switching the source from todo-completion to `score / 10` is what makes the Daily row meaningful after the journal data-model change.)

Today's cell gets a 1.5px white outset ring.

### Hover tooltip

Pointing at a cell shows a 10px monospace tooltip above:

```
Thu · May 14, 2026
Week: May 11 – May 17 · 72%
```

Line 1: weekday · `MMM D, YYYY`.
Line 2: ISO-week range (Monday → Sunday) · the average score-completion of that week, rounded.

### Year switching

Tapping a year pill swaps the rendered year. Default = current year.

### Removed

The previous Weekly / Monthly / Yearly contribution rows and `GoalHistory`-driven derivation are removed from this card. `useGoalsStore.history` itself is left in place — it's still written by goal toggles — but the Dashboard stops reading it.

---

## 6. Settings additions

A new `Settings` page (or section) called **Confirmations** under app settings:

| Setting                                       | Default | Storage key                       |
|-----------------------------------------------|---------|-----------------------------------|
| Confirm before deleting a goal                | `true`  | `settings.confirmGoalDelete`      |
| Confirm before deleting a transaction         | `true`  | `settings.confirmTxDelete`        |
| Confirm before deleting a journal entry       | `true`  | `settings.confirmJournalDelete`   |

This iteration only wires the **first** toggle to actual delete flows (Goals card). The other two are scaffolded UI for parity — they live in `useSettingsStore` but their corresponding delete sites are out of scope. Marked clearly in the spec so future work picks them up.

Each toggle is a simple boolean. The Goals confirm dialog reads `confirmGoalDelete`; clicking the in-dialog "Don't ask again" sets it to `false`.

---

## 7. Store / data changes

### `useJournalStore`

Add new fields to the entry shape, plus targeted setters:

```js
setTodayFeelings(text)
setTodayScore(n)         // 1..10
setTodaySleepHours(h)    // 0..24, step 0.5
setTodayNutrition(opt)   // 'good' | 'mid' | 'bad'
```

Each setter upserts today's entry. The old todo setters (`addTodayTodo`, `toggleTodayTodo`, `deleteTodayTodo`) stay until the rest of the app stops using them, but the dashboard no longer calls them.

### `useTrainingStore`

Add `durationMinutes` to session entries:

```js
logSession(date, exercises, durationMinutes)
```

Existing log entries without `durationMinutes` are treated as `0` for the Volume chart's duration line; the bar (volume) still works because `reps × weight` is computable. UI for entering duration belongs to the Training page; the dashboard's quick "Mark done" stores `durationMinutes = 0` along with an empty `exercises` array.

### `useSettingsStore`

Add the three confirm flags above.

---

## 8. Component layout summary

`src/pages/Dashboard.jsx` will compose:

- `<GraphCard />` (new)
- `<ThisWeekCard />` (rewrite of the existing inline `area-workout` block)
- `<JournalCard />` (rewrite — no todos)
- `<GoalsCard />` (mostly unchanged; adds hover-X + confirm modal)
- `<ConsistencyCard />` (rewrite — GitHub daily grid + year pills)

Each card is a self-contained component file under `src/components/dashboard/`. Today these are inline in `Dashboard.jsx` (≈300 lines) — splitting them out keeps each unit focused and testable. `Dashboard.jsx` shrinks to the page-head + bento layout grid.

The bento CSS grid keeps its current 5-area layout; only the contents of each area change.

---

## 9. Non-goals (this iteration)

- Migrating historical journal todos to scores.
- Adding duration UI to the Training page.
- Wiring `confirmTxDelete` / `confirmJournalDelete` to actual delete sites.
- Multi-year Consistency comparison (each pill shows one year).
- Persisting Graph card range selections.
- Mobile-specific drag refinements for the range brush.

These are deliberately deferred so this redesign stays focused on Dashboard surface area.
