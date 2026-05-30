# Consistent

A local-first dashboard for the things that compound — your long-term pursuits, weight, money, and the days you show up.

Consistent is built around a single idea: small actions, tracked honestly over time, compound into outcomes. It runs in your browser and keeps your data in `localStorage`, with optional cloud sync if you want the same data on more than one device.

---

## What it tracks

### Lifelong Goals

The centre of the app. Group what you're working toward into **pursuits** (Math, Reading, Fitness…), and under each one add the concrete things you're moving through:

- **Measurable items** — a book with a page count, a video playlist, anything with a total. You don't tick it "done"; you **log where you are** ("now on page 213 / 1300") and the bar fills. From your logged history it derives your **pace** and a projected **ETA**, and warns you when a deadline needs a faster rate than you're holding.
- **Adaptive display** — a progress bar for large totals, fill-dots for small counts (a 12-video series), nothing for pure habits.
- **Day scheduling** — give any item the weekdays it should appear on, and it surfaces as a check-off in the Daily goals list on those days.

Pursuits collapse so a long reading list stays tidy, each showing a completion ring.

### Weight

A single number per day, plotted as a continuous line against a target. Projects your rate per week and tells you whether you're on pace, with a compact stats strip and full history.

### Finance

Monthly ledger of what came in and what went out, with custom categories, colors, and per-category budgets. Per-month navigation, running balance, recurring items on a monthly timeline, daily/list views, and a currency picker in Settings.

### Journal & wellbeing

A short entry per day — a five-level **mood**, sleep hours, nutrition, and a free note. Over time the app correlates sleep against your mood and tells you whether you actually feel different on rested days.

### Goals

Daily, weekly, monthly, and yearly checklists. The daily view also pulls in the lifelong-goal items scheduled for today, so one list answers "what do I do today?"

### Dashboard

Everything above on one screen: this-week recap, a draggable weight/finance graph, your lifelong pursuits, today's goals, a GitHub-style consistency heatmap, and today's journal (with a one-tap **Log now** when you haven't written yet).

---

## Local-first, optional sync

Your data lives in `localStorage` on the device you're using — a handful of keys, one origin. The **Export** button writes every key to one JSON file; **Import** reads it back. That alone is a complete, offline sync story you fully control.

If you sign in, the same data also syncs through Supabase so it follows you across devices. Sync is opt-in: skip the login and the app is fully local with no network calls.

---

## Run it

```bash
git clone https://github.com/Fairlander-Flick/Consistent.git
cd Consistent
npm install
npm run dev
```

Then open **http://localhost:5175**. The port is pinned in `vite.config.js` so your browser's localStorage stays bound to one origin across restarts.

To enable cloud sync, copy your Supabase URL and anon key into `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Leave them empty to run fully local.

Requirements: Node 20+ and a modern browser.

```bash
npm run build   # production build
npm test        # unit tests (Vitest)
npm run lint    # ESLint
```

---

## What's coming

- **Phase 1** · Local web app with optional sync — *current*
- **Phase 2** · Installable PWA on phone and desktop, hosted at a stable URL
- **Phase 3** · Richer per-pursuit history and insights
- **Phase 4** · Native mobile companion sharing the same codebase

Every step is additive — nothing in the current phase breaks when later ones land.

---

## Under the hood

React 19 · Vite 8 · React Router 7 · Zustand 5 · Supabase · Vitest. Charts are hand-rolled SVG; styling is pure CSS via design tokens, no UI framework. A service worker enables offline PWA install.

Developer setup, scripts, project layout, and conventions live in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

---

## License

Personal project. No formal license yet — open an issue if you want to use parts of it.
