# Free Time — Replace Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard Journal card with a daily "Free time" card that shows, from real per-session hours, how much free time remains today and across the week.

**Architecture:** Each lifelong leaf gains a `sessionHours` value. Scheduling a leaf on a weekday (existing `days` array) consumes that many hours of that day. A pure `timeBudget.js` computes available/used/free per day from a Workspace "Life Essentials" config (`useEssentialsStore`). A read-only `FreeTimeCard` renders today's ring + a 7-day strip. Journal is removed wholesale (Finance-removal pattern), and the journal-bound daily reminder is repurposed to nudge about unfinished planned tasks.

**Tech Stack:** React 19, Zustand 5, Vite, Vitest, plain CSS (`tokens.css`, oklch design tokens). Tests run with `npx vitest run <file>`.

**Spec:** `docs/superpowers/specs/2026-06-02-free-time-tracking-design.md`

**Working dir:** all paths are relative to `consistent/` (the git repo root). Run all commands from there.

---

### Task 1: Branch

- [ ] **Step 1: Create the feature branch**

Run:
```bash
git checkout -b feature/free-time-replace-journal
```
Expected: `Switched to a new branch 'feature/free-time-replace-journal'`

- [ ] **Step 2: Confirm clean baseline**

Run: `npx vitest run`
Expected: all suites PASS (the green baseline before changes).

---

### Task 2: `sessionHours` on the node model

**Files:**
- Modify: `src/store/useLifelongStore.js` (the `newNode` factory, ~line 24-46)
- Modify: `src/components/goals/NodeEditModal.jsx`
- Test: `src/store/useLifelongStore.test.js` (add one case)

- [ ] **Step 1: Write the failing test**

Add to `src/store/useLifelongStore.test.js` (inside the top-level `describe`, or append a new one):

```js
import { newNode } from './useLifelongStore'

describe('newNode sessionHours', () => {
  it('defaults sessionHours to null and accepts a number', () => {
    expect(newNode({ title: 'x' }).sessionHours).toBe(null)
    expect(newNode({ title: 'x', sessionHours: 2 }).sessionHours).toBe(2)
    expect(newNode({ title: 'x', sessionHours: '1.5' }).sessionHours).toBe(1.5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/useLifelongStore.test.js`
Expected: FAIL — `newNode(...).sessionHours` is `undefined`, not `null`.

- [ ] **Step 3: Add the field to `newNode`**

In `src/store/useLifelongStore.js`, update the `newNode` signature and returned object:

```js
export function newNode({ title, kind = null, unit = null, total = null, perWeek = null, deadline = null, sessionHours = null }) {
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
    // time budgeting: hours one session of this leaf takes
    sessionHours: sessionHours != null && sessionHours !== '' ? Number(sessionHours) : null,
    collapsed: false,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/useLifelongStore.test.js`
Expected: PASS.

- [ ] **Step 5: Add the `sessionHours` input to `NodeEditModal`**

In `src/components/goals/NodeEditModal.jsx`:

Add state after the `deadline` state (~line 27):
```js
  const [sessionHours, setSessionHours] = useState(node.sessionHours ?? '')
```

Add `sessionHours` to the `store.updateNode` patch inside `save` (the object passed to `updateNode`, ~line 41-47). The field applies to any leaf (not categories), so gate on `kind !== 'category'`:
```js
    store.updateNode(node.id, {
      title: title.trim(),
      unit: fields.includes('unit') ? unit : (kind === 'playlist' ? 'episodes' : null),
      total: fields.includes('total') ? (total === '' ? null : Number(total)) : null,
      perWeek: fields.includes('perWeek') ? (perWeek === '' ? null : Number(perWeek)) : null,
      deadline: deadline || null,
      sessionHours: kind === 'category' ? null : (sessionHours === '' ? null : Number(sessionHours)),
    })
```

Add the input block immediately before the Deadline block (before `<div style={{ marginBottom: 16 }}>` that holds the Deadline label, ~line 96). Shown for every non-category kind:
```jsx
          {kind !== 'category' && (
            <div style={{ marginBottom: 14 }}>
              <div className="mng-field-l">Session length (hours)</div>
              <input
                className="input"
                type="number"
                min="0"
                step="0.25"
                aria-label="Session length in hours"
                placeholder="e.g. 2"
                value={sessionHours}
                onChange={e => setSessionHours(e.target.value)}
                style={{ width: 120 }}
              />
            </div>
          )}
```

- [ ] **Step 6: Lint + commit**

Run: `npm run lint`
Expected: no errors.
```bash
git add src/store/useLifelongStore.js src/store/useLifelongStore.test.js src/components/goals/NodeEditModal.jsx
git commit -m "feat: add sessionHours to lifelong nodes and the edit modal

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `timeBudget.js` (pure budget maths)

**Files:**
- Create: `src/lib/timeBudget.js`
- Test: `src/lib/timeBudget.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/timeBudget.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  dailyAvailableHours, sessionsForDate, dayUsedHours, dayBreakdown, buildWeekFree,
} from './timeBudget'

// 2026-05-25 is Monday → week Mon 05-25 … Sun 05-31.
const MON = '2026-05-25'
const TUE = '2026-05-26'

const nodes = [
  {
    id: 'math', title: 'Math', children: [
      { id: 'rog', title: 'Rogawski', kind: 'book', days: ['Mon', 'Wed'], sessionHours: 2, children: [] },
      { id: 'la',  title: 'Linear',   kind: 'book', days: ['Mon'],        sessionHours: 1, children: [] },
    ],
  },
  { id: 'gym', title: 'Gym', kind: 'habit', days: ['Mon', 'Tue'], sessionHours: 1.5, children: [] },
]

describe('dailyAvailableHours', () => {
  it('is 24 minus sleep minus weekly factors averaged over 7 days', () => {
    expect(dailyAvailableHours({})).toBe(24)
    expect(dailyAvailableHours({ sleepPerDay: 8 })).toBe(16)
    // 24 - 8 - (10+7+5)/7 = 16 - 3.142857 = 12.857 → 12.9
    expect(dailyAvailableHours({
      sleepPerDay: 8,
      factors: [{ hoursPerWeek: 10 }, { hoursPerWeek: 7 }, { hoursPerWeek: 5 }],
    })).toBe(12.9)
  })
  it('never goes negative', () => {
    expect(dailyAvailableHours({ sleepPerDay: 30 })).toBe(0)
  })
})

describe('sessions + used hours', () => {
  it('collects scheduled leaves (done or not) for the weekday', () => {
    const mon = sessionsForDate(MON, nodes).map(s => s.id).sort()
    expect(mon).toEqual(['gym', 'la', 'rog'])
    expect(sessionsForDate(TUE, nodes).map(s => s.id)).toEqual(['gym'])
  })
  it('sums session hours per day', () => {
    expect(dayUsedHours(MON, nodes)).toBe(4.5) // 2 + 1 + 1.5
    expect(dayUsedHours(TUE, nodes)).toBe(1.5)
  })
})

describe('dayBreakdown', () => {
  it('groups by root pursuit, sorted desc', () => {
    const b = dayBreakdown(MON, nodes)
    expect(b).toEqual([
      { pursuitId: 'math', title: 'Math', hours: 3 },
      { pursuitId: 'gym',  title: 'Gym',  hours: 1.5 },
    ])
  })
})

describe('buildWeekFree', () => {
  it('produces 7 days with free + over flag', () => {
    const week = buildWeekFree(MON, nodes, { sleepPerDay: 8 }, MON) // available 16
    expect(week).toHaveLength(7)
    const mon = week[0]
    expect(mon).toMatchObject({ weekday: 'Mon', used: 4.5, free: 11.5, over: false, isToday: true })
  })
  it('flags an over-budget day', () => {
    const week = buildWeekFree(MON, nodes, { sleepPerDay: 23 }, MON) // available 1
    expect(week[0]).toMatchObject({ over: true })
    expect(week[0].free).toBeLessThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/timeBudget.test.js`
Expected: FAIL — cannot import from `./timeBudget` (module missing).

- [ ] **Step 3: Implement `timeBudget.js`**

Create `src/lib/timeBudget.js`:

```js
// Pure time-budget maths for the Free Time card. No React, no storage.
//
// A "session" is a scheduled lifelong leaf: it appears on the weekdays in its
// `days` array and consumes `sessionHours` of that day. Done leaves still count
// (the time was planned/spent). Free time = daily available − scheduled hours.
import { isoWeekDates, todayISO } from './dateUtils'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function round1(n) {
  return Math.round(n * 10) / 10
}

export function weekdayKey(dateISO) {
  const d = new Date(dateISO + 'T00:00:00')
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

// Hours free for goals on any given day, from the essentials config.
export function dailyAvailableHours(essentials = {}) {
  const sleep = Number(essentials.sleepPerDay) || 0
  const weekly = (essentials.factors || []).reduce((s, f) => s + (Number(f.hoursPerWeek) || 0), 0)
  return Math.max(0, round1(24 - sleep - weekly / 7))
}

// Walk the tree; collect leaves scheduled on weekday `wd`, tagged with their
// root pursuit. `root` is the top-level ancestor (null at the roots themselves).
function collect(node, wd, root, out) {
  const isLeaf = !(node.children && node.children.length)
  if (isLeaf) {
    if ((node.days || []).includes(wd)) {
      const r = root || node
      out.push({ id: node.id, title: node.title, hours: Number(node.sessionHours) || 0, rootId: r.id, rootTitle: r.title })
    }
    return
  }
  for (const child of node.children) collect(child, wd, root || node, out)
}

export function sessionsForDate(date, nodes = []) {
  const wd = weekdayKey(date)
  const out = []
  for (const r of nodes) collect(r, wd, null, out)
  return out
}

export function dayUsedHours(date, nodes = []) {
  return round1(sessionsForDate(date, nodes).reduce((s, x) => s + x.hours, 0))
}

// Hours grouped by root pursuit, descending. Empty (0h) groups dropped.
export function dayBreakdown(date, nodes = []) {
  const map = new Map()
  for (const s of sessionsForDate(date, nodes)) {
    const cur = map.get(s.rootId) || { pursuitId: s.rootId, title: s.rootTitle, hours: 0 }
    cur.hours = round1(cur.hours + s.hours)
    map.set(s.rootId, cur)
  }
  return [...map.values()].filter(x => x.hours > 0).sort((a, b) => b.hours - a.hours)
}

// 7 days (Mon..Sun) for the week containing refDate, each with free-time stats.
export function buildWeekFree(refDate, nodes = [], essentials = {}, today = todayISO()) {
  const available = dailyAvailableHours(essentials)
  const base = refDate ? new Date(refDate + 'T00:00:00') : new Date()
  return isoWeekDates(base).map((date, i) => {
    const used = dayUsedHours(date, nodes)
    return {
      date,
      weekday: WEEKDAYS[i],
      available,
      used,
      free: round1(available - used),
      over: used > available,
      isToday: date === today,
    }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/timeBudget.test.js`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/timeBudget.js src/lib/timeBudget.test.js
git commit -m "feat: add pure timeBudget lib for daily free-time maths

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `useEssentialsStore` + backup

**Files:**
- Create: `src/store/useEssentialsStore.js`
- Test: `src/store/useEssentialsStore.test.js`
- Modify: `src/lib/backup.js` (`STORE_KEYS`)

- [ ] **Step 1: Write the failing test**

Create `src/store/useEssentialsStore.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useEssentialsStore } from './useEssentialsStore'

beforeEach(() => {
  localStorage.clear()
  useEssentialsStore.setState({ sleepPerDay: 8, factors: [] })
})

describe('useEssentialsStore', () => {
  it('clamps sleep to 0..24', () => {
    useEssentialsStore.getState().setSleepPerDay(30)
    expect(useEssentialsStore.getState().sleepPerDay).toBe(24)
    useEssentialsStore.getState().setSleepPerDay(-5)
    expect(useEssentialsStore.getState().sleepPerDay).toBe(0)
  })
  it('adds, updates and removes factors', () => {
    useEssentialsStore.getState().addFactor('Meals', 10)
    const f = useEssentialsStore.getState().factors[0]
    expect(f).toMatchObject({ name: 'Meals', hoursPerWeek: 10 })
    useEssentialsStore.getState().updateFactor(f.id, { hoursPerWeek: 12 })
    expect(useEssentialsStore.getState().factors[0].hoursPerWeek).toBe(12)
    useEssentialsStore.getState().removeFactor(f.id)
    expect(useEssentialsStore.getState().factors).toHaveLength(0)
  })
  it('persists to localStorage', () => {
    useEssentialsStore.getState().addFactor('Commute', 5)
    expect(JSON.parse(localStorage.getItem('consistent:essentials')).factors).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/useEssentialsStore.test.js`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement the store**

Create `src/store/useEssentialsStore.js`:

```js
import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

// Workspace "Life Essentials" — fixed weekly time not allocated to goals.
// Shape: { sleepPerDay: <h/day>, factors: [{ id, name, hoursPerWeek }] }
// Local-only in v1 (not in cloudSync); included in local backup.
const KEY = 'consistent:essentials'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

const DEFAULT = { sleepPerDay: 8, factors: [] }

function load() {
  const raw = loadData(KEY, DEFAULT)
  return {
    sleepPerDay: Number(raw?.sleepPerDay ?? DEFAULT.sleepPerDay),
    factors: Array.isArray(raw?.factors) ? raw.factors : [],
  }
}

export const useEssentialsStore = create((set, get) => {
  const commit = (next) => { saveData(KEY, next); set(next) }
  return {
    ...load(),

    setSleepPerDay: (h) => {
      const sleepPerDay = Math.max(0, Math.min(24, Number(h) || 0))
      commit({ sleepPerDay, factors: get().factors })
    },

    addFactor: (name = 'New factor', hoursPerWeek = 0) => {
      const factors = [...get().factors, { id: genId(), name, hoursPerWeek: Number(hoursPerWeek) || 0 }]
      commit({ sleepPerDay: get().sleepPerDay, factors })
    },

    updateFactor: (id, patch) => {
      const factors = get().factors.map(f => {
        if (f.id !== id) return f
        const next = { ...f, ...patch }
        if (patch.hoursPerWeek != null) next.hoursPerWeek = Math.max(0, Number(patch.hoursPerWeek) || 0)
        return next
      })
      commit({ sleepPerDay: get().sleepPerDay, factors })
    },

    removeFactor: (id) => {
      commit({ sleepPerDay: get().sleepPerDay, factors: get().factors.filter(f => f.id !== id) })
    },
  }
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/useEssentialsStore.test.js`
Expected: PASS.

- [ ] **Step 5: Add the key to local backup**

In `src/lib/backup.js`, add the essentials key to `STORE_KEYS` (after `'consistent:dayplan'`):
```js
export const STORE_KEYS = [
  'consistent:weight',
  'consistent:goals',
  'consistent:goals-log',
  'consistent:schedule-done',
  'consistent:settings',
  'consistent:lifelong:v2',
  'consistent:dayplan',
  'consistent:essentials',
]
```
(Note: `'consistent:journal'` is intentionally removed here — see Task 8.)

- [ ] **Step 6: Commit**

```bash
git add src/store/useEssentialsStore.js src/store/useEssentialsStore.test.js src/lib/backup.js
git commit -m "feat: add Life Essentials store and include it in backup

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `FreeTimeCard` component + styles + wire into Dashboard

**Files:**
- Create: `src/components/dashboard/FreeTimeCard.jsx`
- Modify: `src/styles/tokens.css` (rename bento slot, add `.ft-*` styles)
- Modify: `src/pages/Dashboard.jsx` (swap card)

- [ ] **Step 1: Add styles to `tokens.css`**

In `src/styles/tokens.css`, find the bento area rule:
```css
.bento .area-journal { grid-area: j; }  /* Today's journal (beside grid) */
```
Replace it with:
```css
.bento .area-free { grid-area: j; }  /* Free time (beside the consistency grid) */
```

Then append, at the end of the file, the Free Time card styles:
```css
/* ── Free Time card ─────────────────────────────────────── */
.ft-ring-wrap { display: flex; justify-content: center; margin: 6px 0 12px; }
.ft-ring { position: relative; width: 132px; height: 132px; }
.ft-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ft-center .ft-h { font-family: var(--font-display); font-size: 26px; font-weight: 700; line-height: 1; color: var(--text); }
.ft-center .ft-l { font-size: 10px; letter-spacing: 0.07em; color: var(--muted); margin-top: 2px; }
.ft-center .ft-h.over { color: var(--negative); }

.ft-leg { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 4px 0; }
.ft-leg .dot { width: 9px; height: 9px; border-radius: 3px; flex: none; }
.ft-leg .nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ft-leg .hr { font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--muted); }
.ft-more { font-size: 11px; color: var(--muted); padding-top: 2px; }

.ft-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
.ft-day { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.ft-day .wd { font-size: 9px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
.ft-day.today .wd { color: var(--accent); }
.ft-day .fr { font-family: var(--font-mono); font-size: 10px; font-variant-numeric: tabular-nums; color: var(--text-mid); }
.ft-day.over .fr { color: var(--negative); }

.ft-empty { font-size: 12px; color: var(--muted); text-align: center; padding: 8px 0 4px; }
.ft-empty a { color: var(--accent); }

/* Ring reveal — fades + lifts in on mount; collapses under reduced-motion. */
@keyframes ft-ring-in { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
.ft-ring-in { animation: ft-ring-in var(--dur-3) var(--ease-out) backwards; transform-origin: center; }
@media (prefers-reduced-motion: reduce) { .ft-ring-in { animation: none; } }
```

- [ ] **Step 2: Implement `FreeTimeCard`**

Create `src/components/dashboard/FreeTimeCard.jsx`:

```jsx
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLifelongStore } from '../../store/useLifelongStore'
import { useEssentialsStore } from '../../store/useEssentialsStore'
import { useDashboard } from '../../lib/DashboardContext'
import { todayISO } from '../../lib/dateUtils'
import {
  dailyAvailableHours, dayBreakdown, dayUsedHours, buildWeekFree,
} from '../../lib/timeBudget'
import { CardTitleLink } from './CardTitleLink'

const WD_INITIAL = { Mon: 'M', Tue: 'T', Wed: 'W', Thu: 'T', Fri: 'F', Sat: 'S', Sun: 'S' }

// Trim a trailing ".0" (e.g. 8.0 → "8", 1.5 → "1.5").
function fmt(n) {
  return Number.isInteger(n) ? String(n) : String(n)
}

// Descending green ramp derived from --accent, so segments read as one family.
function ramp(i) {
  const pct = Math.max(34, 100 - i * 18)
  return `color-mix(in oklab, var(--accent) ${pct}%, var(--track))`
}

// Donut segment geometry on a 100-unit circumference (r≈15.9 in a 42 viewBox).
function segments(breakdown, denom) {
  let start = 0
  return breakdown.map((b, i) => {
    const len = denom > 0 ? (b.hours / denom) * 100 : 0
    const seg = { len, offset: -start, color: ramp(i), ...b }
    start += len
    return seg
  })
}

export function FreeTimeCard() {
  const nodes = useLifelongStore(s => s.nodes)
  const essentials = useEssentialsStore()
  const { viewDate } = useDashboard()
  const date = viewDate || todayISO()

  const { available, used, free, over, breakdown, segs, week, hasEssentials } = useMemo(() => {
    const avail = dailyAvailableHours(essentials)
    const u = dayUsedHours(date, nodes)
    const bd = dayBreakdown(date, nodes)
    const denom = Math.max(avail, u) || 1
    return {
      available: avail,
      used: u,
      free: Math.round((avail - u) * 10) / 10,
      over: u > avail,
      breakdown: bd,
      segs: segments(bd, denom),
      week: buildWeekFree(date, nodes, essentials, todayISO()),
      hasEssentials: (Number(essentials.sleepPerDay) || 0) > 0 || (essentials.factors || []).length > 0,
    }
  }, [date, nodes, essentials])

  const shownLegend = breakdown.slice(0, 4)
  const moreCount = breakdown.length - shownLegend.length

  return (
    <div className="card area-free">
      <div className="card-h">
        <CardTitleLink to="/planner">Free time</CardTitleLink>
        <span className="meta">today</span>
      </div>

      <div className="ft-ring-wrap">
        <div className="ft-ring">
          <svg width="132" height="132" viewBox="0 0 42 42" className="ft-ring-in" role="img"
            aria-label={`${Math.max(0, free)} hours free of ${available} available today`}>
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--track)" strokeWidth="4.2" />
            {segs.map(s => (
              <circle key={s.pursuitId} cx="21" cy="21" r="15.9" fill="none"
                stroke={s.color} strokeWidth="4.2"
                strokeDasharray={`${s.len} ${100 - s.len}`} strokeDashoffset={s.offset}
                transform="rotate(-90 21 21)" />
            ))}
          </svg>
          <div className="ft-center">
            <div className={'ft-h' + (over ? ' over' : '')}>{Math.max(0, free)}h</div>
            <div className="ft-l">{over ? 'OVER' : 'FREE'}</div>
          </div>
        </div>
      </div>

      {breakdown.length === 0 ? (
        <div className="ft-empty">
          {hasEssentials
            ? <>No sessions scheduled today — all {available}h free.</>
            : <>Set your <Link to="/settings">Life Essentials</Link> to size your day.</>}
        </div>
      ) : (
        <>
          {shownLegend.map((b, i) => (
            <div className="ft-leg" key={b.pursuitId}>
              <span className="dot" style={{ background: ramp(i) }} />
              <span className="nm">{b.title}</span>
              <span className="hr">{fmt(b.hours)}h</span>
            </div>
          ))}
          {moreCount > 0 && <div className="ft-more">+{moreCount} more</div>}
        </>
      )}

      <div className="ft-week">
        {week.map(d => {
          const fillPct = d.available > 0 ? Math.min(100, (d.used / d.available) * 100) : 0
          return (
            <div className={'ft-day' + (d.isToday ? ' today' : '') + (d.over ? ' over' : '')} key={d.date}>
              <span className="wd">{WD_INITIAL[d.weekday]}</span>
              <svg width="22" height="22" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="17" fill="none" stroke="var(--track)" strokeWidth="6" />
                {fillPct > 0 && (
                  <circle cx="21" cy="21" r="17" fill="none"
                    stroke={d.over ? 'var(--negative)' : 'var(--accent)'} strokeWidth="6"
                    strokeDasharray={`${fillPct} ${100 - fillPct}`} transform="rotate(-90 21 21)" />
                )}
              </svg>
              <span className="fr">{fmt(Math.max(0, d.free))}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Swap the card in Dashboard**

In `src/pages/Dashboard.jsx`:
- Replace the import line `import { JournalCard } from '../components/dashboard/JournalCard'` with:
```js
import { FreeTimeCard } from '../components/dashboard/FreeTimeCard'
```
- In the bento JSX, replace `<JournalCard />` with `<FreeTimeCard />`.

- [ ] **Step 4: Verify build + lint**

Run: `npm run build`
Expected: build succeeds (no missing-import or syntax errors).
Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual check**

Run: `npm run dev`, open the dashboard. Expected: the bottom-right slot now shows the Free time ring + week strip (empty/È prompts if no data). Toggle theme (sidebar) → colours stay legible in light mode. Stop the dev server when done.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/FreeTimeCard.jsx src/styles/tokens.css src/pages/Dashboard.jsx
git commit -m "feat: add Free time card and place it in the dashboard journal slot

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Life Essentials section in Settings

**Files:**
- Modify: `src/pages/Settings.jsx`

- [ ] **Step 1: Import the store and budget helper**

At the top of `src/pages/Settings.jsx`, add:
```js
import { useEssentialsStore } from '../store/useEssentialsStore'
import { dailyAvailableHours } from '../lib/timeBudget'
```

- [ ] **Step 2: Read essentials in the component**

Inside `Settings()`, after the `useSettingsStore()` destructure (~line 36), add:
```js
  const { sleepPerDay, factors, setSleepPerDay, addFactor, updateFactor, removeFactor } = useEssentialsStore()
  const availablePerDay = dailyAvailableHours({ sleepPerDay, factors })
```

- [ ] **Step 3: Add the Life Essentials card**

Insert this card JSX immediately after the closing `</div>` of the "Weight goal" card and before the "Confirmations" card (i.e. between the first and second `<div className="card" …>` blocks, ~line 148-150):

```jsx
      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <div className="card-h">
          <h3>Life Essentials</h3>
          <span className="meta">{availablePerDay}h free / day</span>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Sleep</div>
            <div className="setting-desc">Hours per day. Subtracted from every day's budget.</div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <input
              type="number" className="input mono" aria-label="Sleep hours per day"
              min="0" max="24" step="0.5"
              value={sleepPerDay}
              onChange={e => setSleepPerDay(e.target.value)}
              style={{ width: 90, textAlign: 'right' }}
            />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>h/day</span>
          </div>
        </div>

        {factors.map(f => (
          <div className="setting-row" key={f.id}>
            <input
              className="input" aria-label="Factor name" value={f.name}
              onChange={e => updateFactor(f.id, { name: e.target.value })}
              style={{ maxWidth: 220 }}
            />
            <div className="row" style={{ gap: 6 }}>
              <input
                type="number" className="input mono" aria-label={`${f.name} hours per week`}
                min="0" step="0.5"
                value={f.hoursPerWeek}
                onChange={e => updateFactor(f.id, { hoursPerWeek: e.target.value })}
                style={{ width: 90, textAlign: 'right' }}
              />
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>h/wk</span>
              <button type="button" className="btn ghost sm" aria-label={`Remove ${f.name}`}
                onClick={() => removeFactor(f.id)}>✕</button>
            </div>
          </div>
        ))}

        <div className="setting-row" style={{ borderBottom: 0 }}>
          <div>
            <div className="setting-label">Add a factor</div>
            <div className="setting-desc">Weekly fixed time: meals, getting ready, commute, chores…</div>
          </div>
          <button type="button" className="btn" onClick={() => addFactor('New factor', 0)}>+ Add</button>
        </div>
      </div>
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build` then `npm run lint`
Expected: both succeed.

- [ ] **Step 5: Manual check**

`npm run dev` → Settings. Expected: Life Essentials card with a sleep stepper, add/remove factor rows, and a live "Xh free / day" readout that drops as factors are added. Confirm the dashboard Free time ring's totals reflect the change. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Settings.jsx
git commit -m "feat: add Life Essentials config to Settings

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Repurpose the daily reminder off Journal

**Files:**
- Modify: `src/lib/useDailyReminder.js`

The reminder currently checks the journal entry. Journal is being deleted (Task 8),
so re-point it at unfinished planned tasks for today. Do this **before** deleting
the journal store so the build never breaks.

- [ ] **Step 1: Rewrite `useDailyReminder.js`**

Replace the entire contents of `src/lib/useDailyReminder.js` with:

```js
import { useEffect } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useLifelongStore } from '../store/useLifelongStore'
import { useScheduleDoneStore } from '../store/useScheduleDoneStore'
import { useDayPlanStore } from '../store/useDayPlanStore'
import { lifelongTodosForDate } from './lifelongTodos'
import { scheduleDailyReminder } from './reminders'
import { todayISO } from './dateUtils'

// Arms the local daily reminder while the app is open. Nudges only if today
// still has unfinished planned work. Re-arms on enabled/time change.
export function useDailyReminder() {
  const reminderEnabled = useSettingsStore(s => s.reminderEnabled)
  const reminderTime = useSettingsStore(s => s.reminderTime)

  useEffect(() => {
    if (!reminderEnabled) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    return scheduleDailyReminder({
      time: reminderTime,
      shouldNotify: () => {
        const today = todayISO()
        const nodes = useLifelongStore.getState().nodes
        const doneMap = useScheduleDoneStore.getState().done[today] || {}
        const pendingScheduled = lifelongTodosForDate(today, nodes).some(it => !doneMap[it.key])
        const todos = useDayPlanStore.getState().byDate[today]?.todos || []
        const pendingOneoff = todos.some(t => !t.done)
        return pendingScheduled || pendingOneoff
      },
      notify: () => {
        const n = new Notification('Consistent', {
          body: 'You still have tasks planned for today.',
          tag: 'consistent-daily-reminder',
        })
        n.onclick = () => { window.focus(); n.close() }
      },
    })
  }, [reminderEnabled, reminderTime])
}
```

- [ ] **Step 2: Update the Settings reminder copy**

In `src/pages/Settings.jsx`, in the Reminders card, change the label/desc that say "journal":
- `Daily journal reminder` → `Daily reminder`
- The supported-description string `'Sends a notification if you haven't logged your journal yet. Fires only while the app is open in a tab.'` → `'Sends a notification if you still have tasks planned for today. Fires only while the app is open in a tab.'`

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds (still importing journal elsewhere — that's removed next task).

- [ ] **Step 4: Commit**

```bash
git add src/lib/useDailyReminder.js src/pages/Settings.jsx
git commit -m "refactor: point daily reminder at unfinished planned tasks, not journal

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Remove Journal entirely

**Files (delete):**
- `src/pages/Journal.jsx`
- `src/components/journal/JournalTodayEditor.jsx`
- `src/components/dashboard/JournalCard.jsx`
- `src/store/useJournalStore.js`
- `src/store/useJournalStore.test.js`
- `src/lib/journalMood.js`

**Files (modify):** `src/App.jsx`, `src/components/layout/Sidebar.jsx`, `src/components/layout/BottomNav.jsx`, `src/lib/cloudSync.js`, `src/styles/tokens.css`, `src/pages/Settings.jsx`

- [ ] **Step 1: Delete the journal files**

Run:
```bash
git rm src/pages/Journal.jsx src/components/journal/JournalTodayEditor.jsx src/components/dashboard/JournalCard.jsx src/store/useJournalStore.js src/store/useJournalStore.test.js src/lib/journalMood.js
```
(If `src/components/journal/` is now empty, that's fine — git tracks files, not dirs.)

- [ ] **Step 2: Remove the route in `App.jsx`**

In `src/App.jsx`:
- Delete the import: `import { Journal } from './pages/Journal'`
- Delete the route line: `<Route path="/journal" element={<ErrorBoundary><Journal /></ErrorBoundary>} />`

- [ ] **Step 3: Remove the nav items**

In `src/components/layout/Sidebar.jsx`:
- Remove `IconJournal` from the `import { … } from '../ui/Icons'` list.
- Delete the nav entry `{ to: '/journal', label: 'Journal', Icon: IconJournal },` from `navItems`.

In `src/components/layout/BottomNav.jsx`:
- Remove `IconJournal` from the import.
- Delete the `{ to: '/journal', label: 'Journal', Icon: IconJournal },` entry from `items`.

- [ ] **Step 4: Drop the journal key from cloud sync**

In `src/lib/cloudSync.js`, delete this line from `KEY_MAP`:
```js
  'consistent:journal':          'journal',
```
(The Supabase `journal` column can stay; it simply stops being read/written.)

- [ ] **Step 5: Remove journal CSS from `tokens.css`**

In `src/styles/tokens.css`, delete these whole blocks (search by the leading comment / selector):
- The block starting `/* ── Journal (compact mood editor + history) ─────────── */` down to and including the `.jx-past-text { … }` rule (the entire journal section: `.journal-grid`, `.jx-lbl`, `.jm-row`, `.jm`, `.jm-dot`, `.jm-l`, `.jm.on …`, `.jx-row`, `.stepper`, `.jx-nut`, `.jx-chip…`, `.jx-ta`, `.jx-foot`, `.jx-summary`, `.jx-mood…`, `.jx-quote`, `.jx-past…`).
- The block starting `/* ── Score range slider (JournalCard) ─────────────────── */` down to and including the `.score-range::-moz-range-thumb { … }` rule.

Leave all other rules (including `.stat-strip`, `.setting-row`, the today-ring rule) intact. Do **not** delete `.stepper` if any non-journal code uses it — verify first:

Run: `grep -rn "stepper" src --include=*.jsx`
- If no `.jsx` references remain, remove the `.stepper` rules with the journal block.
- If something still uses `stepper`, keep those rules.

- [ ] **Step 6: Fix the delete-dialog copy in Settings**

In `src/pages/Settings.jsx`, the delete-all modal text mentions journal:
`This will permanently remove all weight, journal, and goals data. This cannot be undone.` → `This will permanently remove all weight, goals, and planning data. This cannot be undone.`

- [ ] **Step 7: Verify no dangling references**

Run: `grep -rni "journal" src`
Expected: **no matches** (every reference removed). If any remain, remove them.

- [ ] **Step 8: Build, lint, full test run**

Run:
```bash
npm run build
npm run lint
npx vitest run
```
Expected: build OK, lint clean, all remaining suites PASS (journal test is gone; new timeBudget + essentials tests pass).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat!: remove Journal entirely (replaced by Free time)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full suite + build + lint**

Run:
```bash
npx vitest run
npm run build
npm run lint
```
Expected: all green.

- [ ] **Step 2: End-to-end manual smoke**

`npm run dev`, then:
1. Goals → edit a leaf → set **Session length** = 2h. Schedule it on today + Thursday.
2. Settings → Life Essentials → sleep 8, add Meals 10h/wk → readout shows ~15.6h/day.
3. Dashboard → Free time card: today's ring shows the 2h session, centre shows free hours; week strip shows today + Thursday reduced; overload day turns red.
4. Toggle light mode → contrast holds.
5. Confirm Journal is gone from the sidebar, bottom nav, and routes (`/journal` redirects to login-or-404 behaviour — i.e. no longer registered).

Stop the dev server.

- [ ] **Step 3: Done**

The branch `feature/free-time-replace-journal` now holds the full feature. Merge/PR per the user's preference (see superpowers:finishing-a-development-branch).

---

## Self-review notes

- **Spec coverage:** core model (Task 3), Life Essentials (Tasks 4, 6), session length on goals/habits (Task 2), Free time card with today ring + legend + week strip + green ramp + over-budget red (Task 5), Journal removal incl. cloudSync/backup/CSS/nav (Tasks 4, 8), reminder decoupling (Task 7, beyond spec but required to keep the build green). Edge cases (no sessions, over budget, no essentials, fractional hours) handled in `timeBudget.js` + card empty-state.
- **Deferred (spec "changed" list, moved to follow-ups to keep code exact):** per-item hour tags inside the WeekBoard planner (display-only polish). The Free time card reads `timeBudget` directly and does not need it. Not required for the feature to work.
- **Non-goals (unchanged):** per-day essentials overrides, one-off todo hours, total-estimate, categorical ring palette, cloud sync of essentials, dedicated Free-time page.
