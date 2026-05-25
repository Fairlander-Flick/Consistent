# Consistent

A local-first dashboard for the things that compound — training, weight, money, and the days you show up.

Consistent is built around a single idea: small actions, tracked honestly over time, compound into outcomes. It runs entirely in your browser. No login, no cloud, no telemetry, no analytics. Your data is one JSON file you control.

---

## What it tracks

### Training

Your weekly program runs itself. Set a training max for the main lifts and the working weight for every set, every week of the cycle, is computed and rounded to the nearest plate. Accessory work is editable inline — per-set reps and kg, click to change, no save button.

A built-in 5-day Upper/Lower/Pull/Upper/Lower template ships out of the box. Replace it, edit it, or rebuild it from scratch in the editor. Strength and cardio exercises live side by side. Periodization runs a 3-week wave that auto-advances when you mark a session done.

### Weight

A single number per day, plotted as a continuous line against a target. Projects your rate per week and tells you whether you're on pace.

### Calendar

A weekly grid with recurring blocks (training, class, work) and one-off events. Import your existing calendar from a `.ics` export — Google, Apple, Outlook — and recurring events become recurring blocks; everything else lands as one-offs. Your weekly training program auto-fills as gym blocks on the right days.

### Finance

Monthly ledger of what came in and what went out, with custom categories and colors. Per-month navigation, running balance, sortable transactions, per-category filter. Currency picker in Settings.

### Journal & wellbeing

A short entry per day — sleep hours, day score 1–10, a note. Over time the app correlates sleep against your day score and tells you whether you actually feel different on rested days. Quiet input, useful output.

### Dashboard

Everything above, surfaced. Weight trend, weekly training ring against your target, goals checklist, GitHub-style activity heatmap, streak counter, today's plan, yesterday's recap, latest journal entry. One screen, no navigation needed for the daily check-in.

---

## Built local-first

No account. No cloud. No telemetry. Your training maxes, your weight history, your spending — all of it lives in `localStorage` on the device you're using. Eight keys, one origin, no external network calls in the entire codebase.

The **Export** button writes every key to one JSON file. The **Import** button reads it back. That's the whole sync story. You can carry your data on a USB stick, version it in a private git repo, encrypt it, or delete it.

If you don't like this and want sync, that's on the roadmap — opt-in, not by default.

---

## Run it

```bash
git clone https://github.com/Fairlander-Flick/Consistent.git
cd Consistent
npm install
npm run dev
```

Then open **http://localhost:5175**. The port is pinned in `vite.config.js` so your browser's localStorage stays bound to one origin across restarts.

Requirements: Node 20+ and a modern browser. That's it.

---

## What's coming

- **Phase 1** · Local web app, single device — *current*
- **Phase 2** · Hosted at a stable URL, installable as a PWA on phone and desktop
- **Phase 3** · Opt-in account + sync, so the same data follows you across devices
- **Phase 4** · Native mobile companion sharing the same codebase

Nothing in Phase 1 breaks when later phases land — every step is additive.

---

## Under the hood

React 19 · Vite 8 · React Router 7 · Zustand 5 · Recharts 3 · Vitest. Pure CSS via design tokens, no framework. Service worker for offline PWA install.

Developer setup, scripts, project layout, and conventions live in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

---

## License

Personal project. No formal license yet — open an issue if you want to use parts of it.
