# Consistent

A calm, local-first tracker for the things that compound — your lifelong goals, daily habits, plans, and the days you actually show up.

Consistent is built around one idea: small actions, tracked honestly over time, add up to real outcomes. It runs entirely in your browser and keeps your data on your device, with optional cloud sync when you want it on more than one machine.

🔗 **Live app:** [consistent-five.vercel.app](https://consistent-five.vercel.app/)

## Features

- **Dashboard** — Everything on one screen: a week recap, your weight graph, lifelong goals, today's tasks, a GitHub-style consistency heatmap, the week planner, and today's journal.
- **Goals** — Five tabs in one place:
  - *Lifelong* — a nested goal tree (unlimited depth) with progress that rolls up from children.
  - *Daily / Weekly / Monthly / Yearly* — simple checklists for each horizon.
- **Planner** — Plan your day, week, and month so you always know what's next.
- **Consistency** — A heatmap of every day you showed up, so streaks are obvious at a glance.
- **Journal** — A short daily entry: mood, sleep, and a free note, with wellbeing insights over time.
- **Settings** — Profile, dark/light theme, and one-click export/import of all your data.

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 8](https://vite.dev/) — dev server and build
- [React Router 7](https://reactrouter.com/) — client-side routing
- [Zustand 5](https://zustand-demo.pmnd.rs/) — state management
- [Supabase](https://supabase.com/) — optional auth and cloud sync
- [Vitest](https://vitest.dev/) — unit tests
- Plain CSS with design tokens (dark-first, accessible light mode)

## Local-first, optional sync

Your data lives in your browser's `localStorage` — no account required. The **Export** button in Settings writes everything to one JSON file, and **Import** reads it back, so you fully control your own backups.

Sign in (Supabase) and the same data syncs across devices. Sync is opt-in: without Supabase credentials the app runs completely local with no network calls.

## Getting Started

```bash
# install dependencies
npm install

# start the dev server (http://localhost:5175)
npm run dev

# build for production
npm run build

# preview the production build
npm run preview

# run unit tests / lint
npm test
npm run lint
```

The dev port is pinned to **5175** in `vite.config.js` so your browser's `localStorage` stays bound to one origin across restarts.

To enable cloud sync, add your Supabase keys to `.env.local`:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Leave them out to run fully local. Requires Node 20+ and a modern browser.

## Project Structure

```
src/
├── components/    # layout (Sidebar, BottomNav), dashboard cards, goals, planner, ui
├── pages/         # Dashboard, Goals, Planner, Consistency, Journal, Settings, Login
├── store/         # Zustand stores (goals, lifelong, planner, journal, weight, settings, auth…)
├── lib/           # date utils, backup, consistency grid, supabase, helpers
├── App.jsx        # routes + auth gate
└── main.jsx       # app entry
```

## Deployment

The app is a static SPA deployed on [Vercel](https://vercel.com/). Each push builds with `npm run build` and serves the `dist/` output.
