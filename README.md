# Consistent

A personal productivity dashboard built for the things that compound — your training, your weight, your money, your habits. One minimal interface, fully local, no account needed.

> The compounding interest of small daily actions. Track them, see them, keep showing up.

## Features

### Dashboard
The home screen pulls together everything at a glance.
- **Weight trend chart** — line chart over your entire log, with target line if set
- **Weekly training ring** — sessions logged this week against your target
- **Goals checklist** — short-term tasks you can tick off
- **Contribution heatmap** — GitHub-style grid of every active day (training, journal, weight log)
- **Streak counter** — current run of active days
- **Recap card** — what's coming up + what you did yesterday
- **Journal preview** — the latest entry

### Consistency
Raw data entry and analysis, three sub-tabs:
- **Training** — log today's session against your program, edit the weekly program (drag-style day picker + inline exercise editor), browse history, view progression charts (best 1RM / top weight / volume over time)
- **Weight log** — log a kg reading for any date, see the full timeline, project rate per week towards your target
- **Wellbeing** — sleep & mood trends pulled from journal entries, with a sleep × mood correlation insight

### Calendar
A week-grid calendar driven by recurring blocks (training days, classes, meetings) and one-off events.
- **Import .ics** — drop an exported Google/Apple/Outlook calendar in Settings; recurring events become recurring blocks, everything else lands as one-offs
- **Auto-schedule training** — your weekly program (Mon/Tue/Thu/Fri/Sat) shows up automatically as gym blocks

### Finance
Monthly income and expense ledger with custom categories.
- Month navigator with running balance, total in, total out
- Add/edit/delete transactions, custom categories with colors
- Per-category filter, sortable list
- Currency picker in Settings (EUR / USD / TRY / GBP / …)

### Settings
- **Weight goal** — Lose / Gain / No preference, with target kg
- **Currency** — affects the Finance display
- **Daily reminder** — browser notification at the time you pick (asks for OS permission)
- **Backup** — Export everything as a single JSON file, Import to restore
- **Import calendar** — load an .ics file
- **Reset training program** — restores the built-in default program (your training log and weights are kept)
- **Delete all data** — nuke localStorage for this app

## Quick start

```bash
git clone https://github.com/Fairlander-Flick/Consistent.git
cd Consistent
npm install
npm run dev
```

Open http://localhost:5175 — the dev server is **pinned** to this port so your localStorage stays attached to a single origin across restarts.

## Tech stack

- **React 19** + **Vite 8** — UI and build
- **React Router 7** — client-side routing
- **Zustand 5** — state management, persisted to localStorage
- **Recharts 3** — charts
- **CSS custom properties** (`src/styles/tokens.css`) — design tokens, no framework
- **Vitest + Testing Library** — unit tests

No backend. All data lives in your browser's localStorage. Nothing leaves your machine.

## Data & backups

### Where your data lives

Everything is in `localStorage` under these keys:

| Key | Contents |
|---|---|
| `consistent:weight` | Weight log entries |
| `consistent:training-program` | Your weekly program (days, exercises, periodization) |
| `consistent:training-log` | Past training sessions |
| `consistent:journal` | Daily journal entries (sleep, mood, notes) |
| `consistent:goals` | Goals checklist |
| `consistent:finance` | Income/expense ledger, categories |
| `consistent:schedule` | Calendar events |
| `consistent:settings` | App preferences |

### Backing up

Settings → **Export backup** downloads a single `consistent-backup-YYYY-MM-DD.json` containing every key above. Keep a copy somewhere off-device.

To restore on a new device or after a Delete-all: Settings → **Import backup** → pick the JSON file.

The backup is portable across browsers, machines, and operating systems. It will work in any future Consistent build (versioned schema).

### Important: per-origin storage

localStorage is scoped to **origin** = scheme + host + **port**. If you run the dev server on a different port (e.g. 5173 vs 5175), browsers treat them as separate sites with separate storage. That's why this repo pins Vite to port `5175` in `vite.config.js`. Don't change it without exporting your data first.

## How to use it day-to-day

### Daily workflow (suggested)
1. Open the Dashboard — see what's on today
2. **Journal** the morning entry (sleep hours, day score 1–10, a note)
3. After gym: Consistency → Training → **Today's session** → tick the sets you completed
4. End of day: log weight if you stepped on the scale
5. Add/edit any goals you ticked off

### Setting up your training program
Out of the box, the seed program is a 5-day Upper/Lower/Pull/Upper/Lower split with periodization on the main lifts (Bench, Squat, RDL, Sumo, Pull-up). The Training Max for each periodized lift defaults to **100 kg** (and 0 for bodyweight pulls). To make it yours:

1. Consistency → Training → **Program editor**
2. Pick a day (Mon, Tue, etc.)
3. For each lift, set your **Training Max (TM)** — typically 90% of your true 1RM
4. The weekly weights are computed automatically from `TM × multiplier`, rounded to plate-friendly steps (2.5 kg or 1.25 kg).
5. For accessory work, set the working weight inline — each set has its own reps and kg input.

The periodization runs a 3-week wave: each completed session advances `currentWeek` by 1, then wraps back to W1 (and your TM gets bumped manually when the wave restarts at a higher level — classic linear periodization).

### Quick edits
- Set weights and reps are **inline-editable** in the Program editor — just click and type, auto-saves.
- Add or remove individual sets with the `+ Add` / 🗑 buttons.
- Toggle an exercise between **Strength** ↔ **Cardio** without losing the exercise.
- Toggle an exercise between **Manual** ↔ **Periodized** — manual means you set weights yourself; periodized means weights compute from TM.

## Roadmap

This is currently a single-user, local-first web app. The intended trajectory:

- **Phase 1 (current)** — Local web app, localStorage, no auth
- **Phase 2** — Hosted on a static CDN (Vercel/Netlify), accessible from any device as a PWA install
- **Phase 3** — Optional cloud backend (Supabase/Firebase) with auth, so the same account syncs across PC + mobile + tablet
- **Phase 4** — Native mobile companion (Capacitor or React Native + Expo) reusing the same React codebase

Until then: the Export/Import flow lets you move data between machines manually.

## Project structure

```
src/
├── App.jsx                  # Router + ErrorBoundary wrapping
├── main.jsx                 # Entry point, service worker registration
├── pages/
│   ├── Dashboard.jsx        # Home overview
│   ├── Consistency.jsx      # Training + Weight + Wellbeing
│   ├── Calendar.jsx         # Weekly grid + event editor
│   ├── Finance.jsx          # Monthly ledger
│   └── Settings.jsx         # Prefs + backup + reset
├── components/
│   ├── dashboard/           # WeightChart, WeeklyRing, GoalsCard, ContributionGrid, …
│   ├── layout/              # AppShell, Sidebar, BottomNav
│   └── ui/                  # Button, Card, Input, Badge, Modal, Icons, …
├── store/                   # Zustand stores (one per domain)
├── lib/                     # Pure utilities (dateUtils, periodization, backup, …)
├── data/
│   └── seedProgram.json     # Built-in default weekly program (template values)
└── styles/
    └── tokens.css           # Design tokens (colors, spacing, type)
public/
├── manifest.webmanifest     # PWA manifest
├── sw.js                    # Service worker
├── favicon.svg
└── icons.svg
```

## Scripts

```bash
npm run dev       # Vite dev server on port 5175 (strict)
npm run build     # Production build to dist/
npm run preview   # Serve the built dist/ locally
npm run lint      # ESLint
npm test          # Vitest in watch mode
npm run test:ui   # Vitest UI
```

## Notes

- **No tracking, no analytics, no telemetry.** Nothing is sent anywhere; the app runs entirely in your browser.
- The PWA manifest is wired so any modern browser can install the app to your desktop / home screen. Tested on Chrome, Edge, Firefox, Safari, mobile Chrome.
- If anything looks broken after a localStorage migration, Settings → Reset training program restores the seed structure (your training log + weight history are kept). Last resort: Settings → Delete all data.

## License

Personal project, no formal license yet.
