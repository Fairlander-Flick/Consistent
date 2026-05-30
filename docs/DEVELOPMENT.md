# Development

Internal notes for working on Consistent.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 19 | latest stable; the React Compiler handles memoization |
| Build | Vite 8 | fast HMR, ESM-first, minimal config |
| Routing | React Router 7 | basic `Routes` is enough; no data router |
| State | Zustand 5 | one store per domain, all persisted to localStorage |
| Charts | hand-rolled SVG | no chart library — see `components/ui/Widgets.jsx` and `GraphCard` |
| Styling | CSS custom properties | no framework, all tokens in `src/styles/tokens.css` |
| Auth / sync | Supabase (optional) | email auth + a single `user_data` row per user |
| Tests | Vitest + Testing Library | jsdom env, logic-correctness only |

The dependency graph is intentionally shallow. Auth and sync are optional: with no Supabase keys the app runs fully local with zero network calls.

## Scripts

```bash
npm run dev       # Vite dev server on port 5175 (strictPort)
npm run build     # Production build to dist/
npm run preview   # Serve the built dist/ locally
npm run lint      # ESLint
npm test          # Vitest watch mode
npm test -- --run # Vitest single run (CI-style)
npm run test:ui   # Vitest browser UI
```

## Project layout

```
src/
├── App.jsx                  router + ErrorBoundary, guest vs. signed-in routes
├── main.jsx                 entry, service worker registration
├── pages/                   one file per top-level route
│   ├── Dashboard.jsx        the bento overview
│   ├── Consistency.jsx      weight log + wellbeing
│   ├── Journal.jsx          daily entry editor + history
│   ├── Finance.jsx
│   ├── Settings.jsx
│   └── Login.jsx
├── components/
│   ├── auth/                AuthForm, BrandPanel
│   ├── dashboard/           cards composed into Dashboard
│   ├── journal/             JournalTodayEditor (shared by card + page)
│   ├── layout/              AppShell, Sidebar, BottomNav
│   └── ui/                  ErrorBoundary, Icons, Widgets (SVG charts)
├── store/                   Zustand stores, one per domain
│   ├── useAuthStore.js
│   ├── useWeightStore.js
│   ├── useJournalStore.js
│   ├── useGoalsStore.js
│   ├── useLifelongStore.js
│   ├── useFinanceStore.js
│   ├── useScheduleDoneStore.js   (legacy key; holds daily-todo done state)
│   └── useSettingsStore.js
├── lib/                     pure utilities + thin hooks
│   ├── backup.js            export / import contract (STORE_KEYS)
│   ├── cloudSync.js         Supabase push/pull of the same keys
│   ├── lifelongProgress.js  pct / pace / ETA for measurable items
│   ├── lifelongTodos.js     items → Daily-goal todos by weekday
│   ├── journalMood.js       5-level mood ↔ numeric score mapping
│   ├── recap.js             period summary builder
│   ├── wellbeing.js         sleep × mood correlation
│   ├── weightGoal.js        target progress + ETA
│   ├── reminders.js         daily notification scheduling
│   ├── financeUtils.js, currency.js, dateUtils.js, deltaTone.js
│   └── storage.js           localStorage wrapper (debounced cloud sync)
└── styles/
    ├── tokens.css           design tokens + component styles
    └── login.css
public/
├── manifest.webmanifest     PWA manifest
└── sw.js                    service worker
```

## Storage model

Everything lives in `localStorage` under keys prefixed `consistent:`. The canonical
list is `src/lib/backup.js → STORE_KEYS`; anything outside it is ignored by
Export/Import and by cloud sync.

```
consistent:weight          weight log
consistent:journal         daily entries (mood/sleep/nutrition/note)
consistent:goals           current daily/weekly/monthly/yearly checklists
consistent:goals-log       past goal periods
consistent:finance         income + expense ledger, categories, budgets, recurring
consistent:lifelong        pursuits → measurable items / habits
consistent:schedule-done   per-day done state for ephemeral daily todos
consistent:settings        app preferences
```

Per-origin caveat: localStorage is scoped to scheme+host+**port**. The dev server is
pinned to `5175` in `vite.config.js` so the same browser tab keeps its storage across
restarts. Don't change the port without exporting first.

## Lifelong goals model

A goal (pursuit) is `{ id, title, deadline?, done, collapsed, items: [] }`. Each item is:

```
{ id, title, unit, total, current, logs: [{ date, value }], days: [] }
```

- `total == null` → a non-measurable habit (no progress bar). Otherwise the item is
  measurable and `current` is its latest logged reading.
- `logs` is the reading history; `lib/lifelongProgress.js` derives pct, pace
  (units/day), ETA, and a "behind deadline" flag from it.
- `days` are the weekdays the item shows up as a check-off in the Daily goals list
  (`lib/lifelongTodos.js`).

Older data used `goal.steps`; `useLifelongStore.js → normalizeGoal()` migrates those to
habit items on load, so no manual migration is needed.

## Cloud sync

`lib/cloudSync.js` mirrors the same `localStorage` keys to a single `user_data` row in
Supabase. `saveData()` schedules a debounced push; sign-in pulls the row down first.
Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` the Supabase client is inert and
the app stays fully local.

## Backup contract

`exportBackup()` produces:

```json
{
  "app": "consistent",
  "version": 1,
  "exportedAt": "<ISO timestamp>",
  "data": { "consistent:<key>": <parsed value>, ... }
}
```

`parseBackup()` validates the envelope (`app === "consistent"`, `data` is an object).
`restoreBackup()` writes only keys present in `data` that match `STORE_KEYS`; keys absent
from the backup are left untouched — restore is **additive, not destructive**.

## Tests

```bash
npm test -- --run
```

Each domain store and pure utility has a colocated `*.test.js`. UI components are not
unit-tested — Vitest is used as a logic-correctness tool, not a render harness. Two
`currency.test.js` cases are locale-dependent (assert `€12.34`, Windows formats `€12,34`)
and unrelated to feature code.

## Adding a new feature

1. Domain logic → new file in `src/lib/`, write tests first.
2. Persistent state → new Zustand store in `src/store/`, keyed under `consistent:<name>`
   and added to `STORE_KEYS` (backup) and `KEY_MAP` (cloud sync) so both cover it.
3. UI → a new page in `src/pages/` (add a route in `App.jsx`) or a dashboard card in
   `src/components/dashboard/`.

## Commit conventions

Conventional Commits prefixes: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`.

## Personal artifacts

`consistent-backup-*.json` and `.env.local` are git-ignored. Treat them as
never-committed by default.
