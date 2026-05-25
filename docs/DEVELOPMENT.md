# Development

Internal notes for working on Consistent.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 19 | latest stable, no Suspense gymnastics needed yet |
| Build | Vite 8 | fast HMR, ESM-first, minimal config |
| Routing | React Router 7 | data-router not required, basic `Routes` is enough |
| State | Zustand 5 | one store per domain, all persisted to localStorage |
| Charts | Recharts 3 | declarative, small enough |
| Styling | CSS custom properties | no framework, all tokens in `src/styles/tokens.css` |
| Tests | Vitest + Testing Library | jsdom env, forks pool |

No backend, no API client, no auth library. The dependency graph is intentionally shallow.

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
├── App.jsx                  router + ErrorBoundary wrapping per route
├── main.jsx                 entry, service worker registration
├── pages/                   one file per top-level route
│   ├── Dashboard.jsx
│   ├── Consistency.jsx      training / weight / wellbeing
│   ├── Calendar.jsx
│   ├── Finance.jsx
│   └── Settings.jsx
├── components/
│   ├── dashboard/           widgets composed into Dashboard
│   ├── layout/              AppShell, Sidebar, BottomNav
│   └── ui/                  Button, Card, Input, Modal, Icons, …
├── store/                   Zustand stores, one per domain
│   ├── useTrainingStore.js
│   ├── useWeightStore.js
│   ├── useJournalStore.js
│   ├── useGoalsStore.js
│   ├── useFinanceStore.js
│   ├── useScheduleStore.js
│   ├── useScheduleDoneStore.js
│   └── useSettingsStore.js
├── lib/                     pure utilities + thin hooks
│   ├── backup.js            export / import contract
│   ├── periodization.js     TM × multiplier rounding logic
│   ├── progression.js       PR + per-exercise series
│   ├── dateUtils.js
│   ├── icsImport.js         RFC 5545 subset parser
│   ├── recap.js             daily summary builder
│   ├── reminders.js         notification scheduling
│   ├── streaks.js
│   ├── wellbeing.js         sleep × mood correlation
│   ├── weightGoal.js
│   ├── financeUtils.js
│   ├── currency.js
│   └── storage.js           localStorage wrapper
├── data/
│   └── seedProgram.json     default weekly program (template values)
└── styles/
    └── tokens.css           design tokens
public/
├── manifest.webmanifest     PWA manifest
├── sw.js                    service worker
└── favicon.svg
```

## Storage model

Everything lives in `localStorage` under keys prefixed `consistent:`. Eight keys, listed in `src/lib/backup.js → STORE_KEYS`. Anything outside that list is ignored by Export/Import.

```
consistent:weight              weight log
consistent:training-program    weekly program shape
consistent:training-log        past sessions
consistent:journal             daily entries
consistent:goals               checklist
consistent:finance             income + expense ledger, categories
consistent:schedule            calendar events
consistent:settings            app preferences
```

Per-origin caveat: localStorage is scoped to scheme+host+**port**. The dev server is pinned to `5175` in `vite.config.js` so the same browser tab keeps its storage across restarts. Don't change the port without exporting first.

## Training store specifics

The program seed (`src/data/seedProgram.json`) loads only when the program key is absent **or** when all days are empty — both checks live in `loadProgram()` inside `useTrainingStore.js`. This makes the "Reset training program" action in Settings safe to call: it overwrites the program key with the seed without touching the training log or weight history.

Periodization: each periodized exercise stores `{ trainingMax, multipliers, step, currentWeek }`. On session log, completed periodized exercises that weren't already completed for that date advance `currentWeek` by one, wrapping back to 1 on cycle restart. See `periodization.js → nextWeek`.

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

`parseBackup()` validates the envelope (`app === "consistent"`, `data` is an object). `restoreBackup()` writes only keys present in `data` that match `STORE_KEYS`. Keys absent from the backup are left untouched — restore is **additive, not destructive**.

## Tests

```bash
npm test -- --run
```

134 of 136 currently pass on Windows. The two failures in `currency.test.js` are locale-dependent (the test asserts `€12.34` but Windows formats it `€12,34`) and unrelated to feature code. Will be patched by passing an explicit `locale` to `Intl.NumberFormat`.

Each domain store has a colocated `*.test.js`. Pure utilities in `lib/` are individually tested. UI components are not unit-tested — Vitest is used as a logic-correctness tool, not a render harness.

## Adding a new feature

1. Domain logic → new file in `src/lib/`, write tests first
2. Persistent state → new Zustand store in `src/store/`, keyed under `consistent:<name>` and added to `STORE_KEYS` so Export/Import covers it
3. UI → either a new page in `src/pages/` (add a route in `App.jsx`) or a dashboard widget in `src/components/dashboard/`
4. If the feature reads/writes localStorage on cold start, add a side-effect import in `App.jsx` so the store initializes on any route

## Commit conventions

Conventional Commits prefixes: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`. Co-authored commits use `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` when applicable.

## Roadmap notes (technical)

- **PWA install** — manifest + sw.js are already wired; Phase 2 is just hosting `dist/` on a CDN
- **Sync (Phase 3)** — likely Supabase: Postgres + Auth + row-level security. Backup envelope is already schema-versioned so server-side migration is tractable.
- **Mobile (Phase 4)** — Capacitor is the lowest-friction path; the React tree and Zustand stores would carry over unchanged. localStorage maps to native `Preferences` plugin.

## Personal artifacts

`calendar_*.ics`, `calendar_*.pdf`, `consistent-backup-*.json`, and `inject-program.js` are listed in `.gitignore`. Treat them as never-committed by default.
