# Carbon + Parchment Redesign

**Date:** 2026-06-03  
**Scope:** Design token overhaul — dark mode (Carbon) + light mode (Parchment)  
**Files touched:** `src/styles/tokens.css` only (all components inherit via CSS custom properties)

---

## Goal

Replace the current warm-ink dark theme and its light-mode counterpart with two distinct, professional identities:

- **Carbon** — near-black, cold-neutral dark mode. Premium SaaS feel (Linear, Raycast). Green accent only on interactive fills.
- **Parchment** — warm cream light mode. Editorial, organic. Navy accent on interactive fills.

Typography stack (Space Grotesk + Inter + JetBrains Mono) and motion system (transitions-dev) are unchanged.

---

## Color Tokens

### Carbon (`:root` — dark, default)

| Token | New value | Notes |
|---|---|---|
| `--bg` | `#0A0A0C` | Near-black, no warm undertone |
| `--card` | `#111116` | Slightly lifted |
| `--card-hover` | `#15151B` | Subtle lift on hover |
| `--border` | `#1C1C22` | Cold dark border |
| `--border-strong` | `#2A2A32` | Interactive borders |
| `--text` | `#F8F8FA` | Pure near-white |
| `--text-mid` | `#A1A1AA` | Mid grey |
| `--muted` | `#71717A` | Subdued |
| `--faint` | `#1C1C22` | Background tint for hover states |
| `--cg-empty` | `#1C1C22` | Contribution grid empty cell |
| `--track` | `#1C1C22` | Progress track background |
| `--accent` | `oklch(64% 0.17 162)` | Emerald green — bars, indicators, primary btn only |
| `--accent-soft` | `color-mix(in oklab, var(--accent) 10%, transparent)` | |
| `--accent-line` | `color-mix(in oklab, var(--accent) 28%, transparent)` | |
| `--on-accent` | `#0A160F` | Text on green fill |
| `--negative` | `oklch(64% 0.18 27)` | Unchanged |
| `--negative-soft` | unchanged | |
| `--warn` | `oklch(78% 0.13 78)` | Unchanged |
| `--warn-soft` | unchanged | |
| `--shadow-1` | `0 1px 3px rgba(0,0,0,0.55)` | Deeper shadow on near-black |

### Parchment (`[data-theme='light']`)

| Token | New value | Notes |
|---|---|---|
| `--bg` | `#F7F3EE` | Warm cream |
| `--card` | `#FBF8F4` | Near-white paper |
| `--card-hover` | `#F4EFE8` | Slightly deeper on hover |
| `--border` | `#E3D9CE` | Warm light border |
| `--border-strong` | `#D0C4B8` | Interactive borders |
| `--text` | `#1A1410` | Deep warm ink |
| `--text-mid` | `#6B5F56` | Mid warm grey |
| `--muted` | `#9B8C80` | Subdued warm |
| `--faint` | `#EEE8E0` | Background tint for hover states |
| `--cg-empty` | `#E3D9CE` | Contribution grid empty cell |
| `--track` | `#E3D9CE` | Progress track background |
| `--accent` | `#1E3A5F` | Classic navy — bars, indicators, primary btn only |
| `--accent-soft` | `color-mix(in oklab, var(--accent) 10%, transparent)` | |
| `--accent-line` | `color-mix(in oklab, var(--accent) 28%, transparent)` | |
| `--on-accent` | `#EDF2FF` | Text on navy fill |
| `--negative` | `oklch(52% 0.20 27)` | Darkened for light bg contrast |
| `--negative-soft` | `color-mix(in oklab, var(--negative) 10%, transparent)` | |
| `--warn` | `oklch(58% 0.13 70)` | Darkened for light bg contrast |
| `--warn-soft` | `color-mix(in oklab, var(--warn) 12%, transparent)` | |
| `--shadow-1` | `0 1px 2px rgba(40,30,20,0.06), 0 4px 14px rgba(40,30,20,0.05)` | Warm shadow |

---

## Progress Heat Gradient

The `--prog` computed property drives bar and ring fills. Currently it sweeps from grey → orange → green based on `--p` (0–100).

- **Carbon**: Gradient endpoint lands on `--accent` (emerald). Keep the warm-to-green sweep — it reads well on near-black.
- **Parchment**: Override `--prog` in `[data-theme='light']` to sweep toward navy instead of green. Use `oklch` interpolation ending at the navy hue (≈ 248°).

```css
/* Parchment override — progress sweeps grey → navy (hue 248).
   At p=0: oklch(65% 0 248) = neutral grey
   At p=100: oklch(32% 0.14 248) ≈ #1E3A5F navy */
[data-theme='light'] .ll-bar,
[data-theme='light'] .ll-ring,
[data-theme='light'] .gl-row-ring,
[data-theme='light'] .gl-row-pct,
[data-theme='light'] .prog {
  --prog: oklch(calc(65% - var(--p, 0) * 0.33%) calc(var(--p, 0) * 0.0014) 248);
}
```

---

## Typography Adjustments

No font family changes. One tweak per theme:

- **Carbon** — `letter-spacing: -0.025em` on `.page-head h1` (tighter display heading, sharper at large size)
- **Parchment** — no change from current

---

## Light Mode Card Shadow

Parchment cards need a warm lift — replace the current cool-grey `box-shadow` with the warm shadow token:

```css
[data-theme='light'] .card {
  box-shadow: 0 1px 2px rgba(40,30,20,0.05), 0 6px 18px -10px rgba(40,30,20,0.12);
}
```

---

## Sidebar active indicator

Currently a green `--accent` bar. After the redesign:
- **Carbon**: stays `--accent` (green)
- **Parchment**: stays `--accent` (navy) — inherits automatically since we override `--accent` in `[data-theme='light']`

No code change needed here — it already uses `var(--accent)`.

---

## Acceptance Criteria

- [ ] `tokens.css` `:root` block reflects Carbon values
- [ ] `tokens.css` `[data-theme='light']` block reflects Parchment values
- [ ] Green text is gone from dark mode — only bars, indicators, and primary buttons carry `--accent`
- [ ] Navy accent renders correctly in all interactive elements in light mode
- [ ] Progress gradient ends on green in dark, navy in light
- [ ] Build passes (`npm run build`)
- [ ] Both themes toggled via Settings → no visual regressions on Dashboard, Goals, Planner, Consistency pages

---

## Out of Scope

- Typography font family changes
- Layout / spacing changes
- Motion system changes (transitions-dev already installed)
- Component restructuring
