# Consistent

A local-first dashboard for the things that compound — training, weight, money, and the days you show up.

```
┌──────────────────────────────────────────────────────────────────┐
│  Dashboard                                  Today · Mon 25 May   │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│   Weight                          This week                        │
│   ──────                          ─────────                        │
│    78.4 kg     ▁▁▂▂▃▃▂▂            ●  ●  ○  ●  ○  ○  ○            │
│   −0.6 / 14d  ▔▔▔▔▔▔▔▔            M  T  W  T  F  S  S            │
│                                    3 sessions · target 4           │
│                                                                    │
│   Goals                                                            │
│   ─────                                                            │
│    □  Submit thesis draft                                          │
│    ☑  Finish bench periodization wave 2                            │
│    □  Quarterly tax filing                                         │
│                                                                    │
│   Activity · last 12 months                                        │
│   ─────────                                                        │
│   ▢▣▣▢▢▣▣▢▣▢▢▣▣▣▢▣▣▢▢▣▣▢▣▣▢▢▣▣▣▢▣▢▢▣▣▢▣▣▣▢▢▣▣▢▣▣▢▣              │
│   ▢▣▢▢▣▣▢▣▣▢▣▣▢▢▣▣▢▣▣▣▢▢▣▣▢▣▣▣▢▢▢▣▣▢▣▣▣▢▢▣▣▢▢▣▣▣▢              │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

Consistent is built around a single idea: small actions, tracked honestly over time, compound into outcomes. It runs entirely in your browser. No login, no cloud, no telemetry, no analytics. Your data is one JSON file you control.

---

## What it tracks

### Training

Your weekly program runs itself. Set a training max for the main lifts and the working weight for every set, every week of the cycle, is computed and rounded to the nearest plate. Accessory work is editable inline — per-set reps and kg, click to change, no save button.

```
┌── Program editor · Mon · Upper ──────────────────────────────────┐
│                                                                    │
│  Bench Press                              [ Periodized ] W 2 of 3 │
│    TM 100 kg · H1 0.8193 · H2 0.8610 · H3 0.9027 · step 2.5      │
│    #1   4   ×  86.0 kg  (auto)                                    │
│    #2   4   ×  86.0 kg  (auto)                                    │
│    #3   4   ×  86.0 kg  (auto)                                    │
│                                                                    │
│  Incline Smith Press                                  [ Manual ]  │
│    #1  [ 8 ]  ×  [ 80 ]  kg                                  🗑   │
│    #2  [ 8 ]  ×  [ 80 ]  kg                                  🗑   │
│                                                                    │
│  Scott Dumbbell Curl                                  [ Manual ]  │
│    #1  [ 12 ] ×  [ 22.5 ] kg                                 🗑   │
│    #2  [ 12 ] ×  [ 22.5 ] kg                                 🗑   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

A built-in 5-day Upper/Lower/Pull/Upper/Lower template ships out of the box. Replace it, edit it, or rebuild it from scratch in the editor.

### Weight

A single number per day, plotted as a continuous line against a target. Projects your rate per week and tells you whether you're on pace.

```
   Weight · 90 days
   ─────────────────
   82 │
   80 │  ●●
   78 │     ●●●●          ●●●●
   76 │          ●●●●●●●●     ●●●●●●●●
   74 │                                ──── target 74.0
   72 │
       └────────────────────────────────────────
        Feb            Mar            Apr
```

### Calendar

A weekly grid with recurring blocks (training, class, work) and one-off events. Import your existing calendar from a `.ics` export — Google, Apple, Outlook — and recurring events become recurring blocks; everything else lands as one-offs.

### Finance

Monthly ledger of what came in and what went out, with custom categories and colors. Per-month navigation, running balance, sortable transactions, per-category filter. Currency picker in Settings.

```
┌── February 2026 ───────────────────────  €1,234.50  ─┐
│                                                        │
│   In   €2,100.00              Out    €865.50          │
│                                                        │
│   ● Rent         €450.00     ● Groceries   €180.50    │
│   ● Transport     €68.00     ● Other       €167.00    │
│                                                        │
│   Recent                                               │
│   25 Feb  Groceries     Weekly shop          −32.40   │
│   24 Feb  Rent          February                −450  │
│   23 Feb  Salary        February          +2,100.00   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Journal & wellbeing

A short entry per day — sleep hours, day score 1–10, a note. Over time the app correlates sleep against your day score and tells you whether you actually feel different on rested days. Quiet input, useful output.

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
