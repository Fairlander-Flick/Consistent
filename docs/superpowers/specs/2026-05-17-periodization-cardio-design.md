# Periodization & Cardio — Design Spec

Date: 2026-05-17
Status: Approved (brainstorming complete, pending implementation plan)

## Goal

Replace the user's Excel-based training periodization with first-class support in
the app, and add a cardio exercise type.

The user runs a 3-week wave for certain lifts: each lift has a "training max"
(TM) and three weekly multipliers; the working weight for a given week is
`TM × multiplier`, rounded to the nearest 2.5 kg. Other exercises use a plain
hand-entered weight. Cardio is logged as a named activity with a duration only.

## Requirements (from brainstorming)

1. **Periodized strength exercises** — currently: bench press, pull-up, barbell
   squat, RDL, deadlift. Each has its **own** training max and its **own** set
   of 3 weekly multipliers (e.g. bench `.8193 / .861 / .9027`). Sets and reps
   are **fixed** across the 3 weeks; only weight changes.
   - Weekly weight = `roundToNearest(trainingMax × multipliers[week-1], 2.5)`.
   - Pull-up: weight means **added** weight (weighted pull-up); TM is the
     weighted-pull-up training max.
2. **Manual strength exercises** — unchanged current behaviour: fixed
   hand-entered `{ reps, weight }` per set.
3. **Cardio exercises** — new type. Fields: name + `durationMinutes`. No
   sets / reps / weight. Appears as a row inside a normal session, like any
   other exercise.
4. **Week tracking** — per **exercise** (not global). Each periodized exercise
   carries its own `currentWeek` (1..3). It auto-advances `1 → 2 → 3 → 1` when
   a session containing that exercise is logged with all of that exercise's
   sets completed. The user can override the week directly (a visible per-exercise
   week selector in the Daily Log) — the user stays in control ("this week we
   hit this weight, advance").
5. **Training max increase** — fully manual. The app never auto-changes TM.
   When the week wraps `3 → 1` the app shows a non-blocking hint suggesting the
   user may want to bump the TM; the user edits TM themselves in the Program
   Editor.
6. No migration: existing exercises without a `type` are treated as manual
   strength. Backward compatible.

## Architecture

Approach: **extend the existing exercise object in place** (chosen over a
separate periodization store and over a full mesocycle engine — YAGNI). State
stays in the existing Zustand `useTrainingStore`, persisted to localStorage as
today. Pure logic goes in a new, unit-testable module.

### Key principle: template vs. log snapshot

- The **program** (`program[day].exercises[]`) holds the *recipe*: TM,
  multipliers, `currentWeek`, target reps/sets, exercise type.
- The **log** (`log[].exercises[]`) holds a *snapshot of what was actually
  performed*: concrete `{ reps, weight }` per set for strength, and
  `durationMinutes` for cardio.

This keeps history correct forever even if the TM is changed later, and means
`progression.js` (which already reads concrete weights from the log) works
unchanged for periodized lifts.

## Data Model

Exercise objects gain two optional fields. Nothing existing is renamed or
removed.

**Manual strength (current / default — unchanged):**
```js
{ id, name, sets: [{ reps, weight }] }   // missing `type` ⇒ manual strength
```

**Periodized strength:**
```js
{
  id, name,
  type: 'strength',
  periodization: {
    trainingMax: 173.9,
    multipliers: [0.8193, 0.861, 0.9027], // exactly 3, exercise-specific
    currentWeek: 1                         // 1..3
  },
  sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }] // weight omitted; computed
}
```

**Cardio:**
```js
{ id, name, type: 'cardio', durationMinutes: 0 } // no sets/reps/weight
```

**Computed working weight** for a periodized exercise:
```
weight = roundToNearest(trainingMax × multipliers[currentWeek - 1], 2.5)
```
All sets of a periodized exercise share this one computed weight (sets/reps are
fixed; only weight varies by week).

## New module: `src/lib/periodization.js`

Pure, side-effect-free, unit-testable:

- `roundToNearest(value, step = 2.5)` — nearest, ties away from zero.
- `computeWeight(periodization)` →
  `roundToNearest(trainingMax × multipliers[currentWeek - 1], 2.5)`.
- `nextWeek(week)` → `1 → 2 → 3 → 1`.
- `exerciseType(ex)` → `'cardio'` if `ex.type === 'cardio'`, else `'strength'`.
- `isCardio(ex)`, `isPeriodized(ex)` (strength with a `periodization` object).
- `weeklyPreview(periodization)` → `[w1, w2, w3]` computed weights (for UI
  preview "H1 142.5 · H2 150 · H3 157.5").
- `resolveProgramSets(ex)` → returns the exercise's sets with concrete `weight`
  filled in (computed for periodized; pass-through for manual). Used to
  pre-fill the Daily Log.

## Store changes (`src/store/useTrainingStore.js`)

New / changed actions (all persist to localStorage and `set()` as existing
actions do):

- `addExercise(day, name, type = 'strength')` — accepts a type.
- `setExerciseType(day, exId, type)` — `'strength' | 'cardio'`. Switching to
  cardio drops sets/periodization; switching to strength gives an empty sets
  array.
- `setPeriodization(day, exId, config | null)` — `config =
  { trainingMax, multipliers }`. Sets `currentWeek` to 1 when first enabled;
  `null` disables periodization (reverts to manual strength, keeps sets).
- `setExerciseWeek(day, exId, week)` — manual override of `currentWeek` (1..3).
- `setCardioDuration(day, exId, minutes)` — optional default duration on the
  template (duration is normally entered at log time).
- `logSession(date, exercises, durationMinutes)` — extended: after saving the
  log, for each periodized exercise in the submitted session whose sets were
  **all completed**, advance that exercise's `currentWeek` via `nextWeek` in
  the program and persist the program.
  - **Idempotency guard:** re-logging / updating the same date must not
    advance twice. Only advance when the previously stored session for that
    date did **not** already have that exercise completed (i.e. the transition
    from "not completed" → "completed" for that date is what advances the
    week).

## UI changes (`src/pages/Consistency.jsx`)

### Program Editor

- Per-exercise type switch: **Strength / Cardio**.
- Strength + "Periodize" toggle:
  - When on: inputs for Training Max and 3 multipliers (defaults
    `0.8193 / 0.861 / 0.9027`), plus target sets count and reps. The weight
    input is hidden (weight is computed). Read-only preview line
    "H1 142.5 · H2 150 · H3 157.5 kg" and a `currentWeek` selector (1/2/3).
  - When off: existing manual set editor, unchanged.
- Cardio: name only; no sets UI (optional default duration field).

### Daily Log

- **Periodized row:** weight column is read-only (computed from TM ×
  multiplier for the selected week); reps editable; done checkbox per set as
  today. The exercise header shows TM, the 3-week preview, and a prominent
  **Week 1 / 2 / 3 selector** so the user picks/confirms the week.
- **Cardio row:** a single duration (min) input plus a done check; no sets
  grid.
- On "Log session":
  - Snapshot concrete performed values into the log (periodized → the computed
    concrete weight per set; cardio → `durationMinutes`).
  - Auto-advance week for completed periodized exercises (with the idempotency
    guard above).
  - When a week wraps `3 → 1`, show a non-blocking hint: "new cycle — update
    the training max?" (informational only).

## Analytics, history, calendar, dashboard

- `src/lib/progression.js` — unchanged. It reads concrete weights from the
  log, so periodized lifts work automatically. `validSets` already filters to
  sets with `weight > 0 && reps > 0`, so cardio (no sets) is naturally excluded
  from volume / 1RM / PRs.
- `HistoryList` and `Calendar` detail — render cardio exercises as
  "`name — X min`" instead of a sets list. Existing volume reducers tolerate
  exercises with empty/missing `sets` (contribute 0).
- The session-level `durationMinutes` field on a log entry is unchanged and
  independent of per-cardio-exercise duration (per-cardio duration is for
  display only; total session duration stays user-entered as today).

## Backward compatibility & sample data

- No migration step. Exercises with no `type` ⇒ manual strength. All reducers
  already tolerate missing `sets` / `weight`.
- `src/lib/dummyData.js` — add a few periodized exercises (e.g. bench press
  with `.8193 / .861 / .9027`, barbell squat with TM ≈ 173.9) and one cardio
  example, so the feature is visible with sample data.

## Testing

- Unit tests for `src/lib/periodization.js`:
  - `roundToNearest`: 2.5 rounding incl. tie behaviour.
  - `computeWeight`: the user's real numbers — `TM 173.9 × .8193 ≈ 142.5`,
    `× .861 ≈ 150`, `× .9027 ≈ 157.5`; bench multipliers likewise.
  - `nextWeek`: `1→2`, `2→3`, `3→1`.
  - `resolveProgramSets`: periodized fills computed weight; manual passes
    through; cardio yields no sets.
- Store test for `logSession` week auto-advance + idempotency guard
  (re-logging same date does not double-advance; updating an incomplete
  session to complete advances exactly once).
- Follow the repo's existing test setup/conventions (to be confirmed during
  the implementation plan).

## Out of scope (YAGNI)

Deload weeks, RPE, variable reps/sets per week, distance/intensity for cardio,
program templates (5/3/1 etc.), automatic TM progression, multi-week mesocycle
blocks beyond the fixed 3-week wave.
