# Consistent

A personal productivity dashboard for tracking the habits that compound over time — weight, training, goals, finances, and daily journaling in one minimal interface.

## What it does

**Dashboard** — Daily overview with weight trend chart, weekly training ring, goal checklist, GitHub-style contribution heatmap, and journal entries.

**Consistency** — Raw data entry for weight logs and training sessions. Log sets, reps, and weights; review full history.

**Finance** — Monthly income/expense tracking with custom categories. Navigate between months, filter by category, track balance at a glance.

## Tech

- React + Vite
- Zustand for state (persisted to localStorage)
- CSS custom properties design system (`tokens.css`)
- No backend — fully client-side

## Getting started

```bash
npm install
npm run dev
```

## Project structure

```
src/
  pages/          # Dashboard, Consistency, Finance
  components/
    dashboard/    # WeightChart, WeeklyRing, GoalsCard, ContributionGrid, Journal
    layout/       # AppShell, Sidebar, BottomNav
    ui/           # Button, Card, Input, Badge, Checkbox, TabBar
  store/          # Zustand stores (weight, training, goals, journal, finance, settings)
  styles/         # tokens.css — design tokens
```
