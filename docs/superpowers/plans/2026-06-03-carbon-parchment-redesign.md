# Carbon + Parchment Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current warm-ink dark/light theme pair with Carbon (near-black, cold-neutral dark) and Parchment (warm cream, navy accent light).

**Architecture:** All changes are confined to `src/styles/tokens.css` — the single source of truth for CSS custom properties. Every component inherits via `var(--token)` so no component files need touching. Two exceptions: `.prog` and `.gl-row-pct` currently read `color: var(--prog)` which doubles as a bar fill; we decouple text and fill coloring with a light-mode override.

**Tech Stack:** CSS custom properties, oklch/hex colors, Vite build.

---

## File Map

| File | Action | Scope |
|---|---|---|
| `src/styles/tokens.css` | Modify | All tasks — single file, multiple sections |

---

### Task 1: Carbon dark mode — surface tokens

Update the `:root` base colour block (lines ~10–24 in `tokens.css`) with Carbon values.

**Files:**
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Replace surface tokens in `:root`**

Find the block that starts with `/* Color — dark (primary). Warm-neutral ink, not flat #111/#fff. */` and replace the surface variables:

```css
/* Color — dark (primary). Cold-neutral, near-black. */
--bg: #0A0A0C;
--card: #111116;
--card-hover: #15151B;
--border: #1C1C22;
--border-strong: #2A2A32;
--text: #F8F8FA;
--text-mid: #A1A1AA;
--muted: #71717A;
--faint: #1C1C22;
--cg-empty: #1C1C22;
--track: #1C1C22;
```

- [ ] **Step 2: Update shadow token in `:root`**

Find `--shadow-1: 0 1px 3px rgba(0, 0, 0, 0.32);` and replace:

```css
--shadow-1: 0 1px 3px rgba(0, 0, 0, 0.55);
```

- [ ] **Step 3: Verify build**

```bash
cd consistent && npm run build
```

Expected: `✓ built in …ms` with no errors.

- [ ] **Step 4: Commit**

```bash
git add consistent/src/styles/tokens.css
git commit -m "design: Carbon dark — surface tokens"
```

---

### Task 2: Carbon dark mode — accent and semantic tokens

Update the accent/semantic block in `:root` (the `--accent`, `--negative`, `--warn`, `--on-accent` lines).

**Files:**
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Replace accent + semantic tokens in `:root`**

Find the block starting with `/* Semantic — calibrated green … */` and replace:

```css
/* Semantic — emerald accent, cold-neutral negatives. */
--accent: oklch(64% 0.17 162);
--accent-soft: color-mix(in oklab, var(--accent) 10%, transparent);
--accent-line: color-mix(in oklab, var(--accent) 28%, transparent);
--negative: oklch(64% 0.18 27);
--negative-soft: color-mix(in oklab, var(--negative) 13%, transparent);
--warn: oklch(78% 0.13 78);
--warn-soft: color-mix(in oklab, var(--warn) 10%, transparent);
--on-accent: #0A160F;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add consistent/src/styles/tokens.css
git commit -m "design: Carbon dark — accent + semantic tokens"
```

---

### Task 3: Decouple progress text from bar fill colour

Currently `.prog { color: var(--prog); }` and `.gl-row-pct { … color: var(--prog); }` make percentage text green in dark mode. In Carbon the user wants neutral text; bars stay coloured. We override the text rule per theme.

**Files:**
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Neutralise `.prog` text in dark mode**

Find the line:
```css
.prog { color: var(--prog); }
```

Replace with:
```css
/* Carbon: percentages read as text-mid — colour lives only on bar/ring fills. */
.prog { color: var(--text-mid); }
```

- [ ] **Step 2: Neutralise `.gl-row-pct` text in dark mode**

Find inside `.gl-row-pct { … }` the `color: var(--prog);` property. Change it to:

```css
color: var(--text-mid);
```

- [ ] **Step 3: Add light-mode overrides that restore coloured text**

Directly below the `[data-theme='light']` block closing brace (or appended at the end of that block), add:

```css
/* Parchment: restore coloured progress text on paper background. */
[data-theme='light'] .prog { color: var(--prog); }
[data-theme='light'] .gl-row-pct { color: var(--prog); }
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add consistent/src/styles/tokens.css
git commit -m "design: decouple progress text from fill — neutral in Carbon"
```

---

### Task 4: Parchment light mode — all tokens

Replace the entire `[data-theme='light']` block with Parchment values.

**Files:**
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Replace the surface tokens inside `[data-theme='light']`**

Find the block `[data-theme='light'] {` and replace its surface variables:

```css
[data-theme='light'] {
  /* Warm cream paper — Parchment theme. */
  --bg: #F7F3EE;
  --card: #FBF8F4;
  --card-hover: #F4EFE8;
  --border: #E3D9CE;
  --border-strong: #D0C4B8;
  --text: #1A1410;
  --text-mid: #6B5F56;
  --muted: #9B8C80;
  --faint: #EEE8E0;
  --cg-empty: #E3D9CE;
  --track: #E3D9CE;
```

- [ ] **Step 2: Replace accent + semantic tokens inside `[data-theme='light']`**

Continuing the same block, replace accent/semantic/shadow:

```css
  /* Navy accent — bars, indicators, primary buttons only. */
  --accent: #1E3A5F;
  --accent-soft: color-mix(in oklab, var(--accent) 10%, transparent);
  --accent-line: color-mix(in oklab, var(--accent) 28%, transparent);
  --negative: oklch(52% 0.20 27);
  --negative-soft: color-mix(in oklab, var(--negative) 10%, transparent);
  --warn: oklch(58% 0.13 70);
  --warn-soft: color-mix(in oklab, var(--warn) 12%, transparent);
  --on-accent: #EDF2FF;
  --shadow-1: 0 1px 2px rgba(40, 30, 20, 0.06), 0 4px 14px rgba(40, 30, 20, 0.05);
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add consistent/src/styles/tokens.css
git commit -m "design: Parchment light — all tokens (navy accent)"
```

---

### Task 5: Parchment progress gradient → navy

The `--prog` gradient currently ends on green (hue ~150). Override it for light mode so bars sweep grey → navy.

**Files:**
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Locate the light-mode `--prog` overrides**

Find the block:
```css
[data-theme='light'] .ll-bar,
[data-theme='light'] .ll-ring,
[data-theme='light'] .gl-row-ring,
[data-theme='light'] .gl-row-pct,
[data-theme='light'] .prog {
  --prog: oklch(54% calc(var(--p, 0) * 0.0017) calc(40 + var(--p, 0) * 1.1));
}
```

Replace the `--prog` formula:

```css
[data-theme='light'] .ll-bar,
[data-theme='light'] .ll-ring,
[data-theme='light'] .gl-row-ring,
[data-theme='light'] .gl-row-pct,
[data-theme='light'] .prog {
  /* Grey (p=0) → navy #1E3A5F (p=100) at hue 248. */
  --prog: oklch(calc(65% - var(--p, 0) * 0.33%) calc(var(--p, 0) * 0.0014) 248);
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add consistent/src/styles/tokens.css
git commit -m "design: Parchment progress gradient → navy (hue 248)"
```

---

### Task 6: Parchment card shadow + Carbon heading letter-spacing

Two finishing-detail tweaks: warmer card shadow in Parchment, tighter display heading in Carbon.

**Files:**
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Warm the Parchment card shadow**

Find:
```css
[data-theme='light'] .card {
  box-shadow: 0 1px 2px rgba(40, 34, 22, 0.05), 0 8px 20px -12px rgba(40, 34, 22, 0.14);
}
```

Replace:
```css
[data-theme='light'] .card {
  box-shadow: 0 1px 2px rgba(40, 30, 20, 0.05), 0 6px 18px -10px rgba(40, 30, 20, 0.12);
}
```

- [ ] **Step 2: Tighten Carbon's display heading**

Find the `.page-head h1 {` rule. Add `letter-spacing` after the existing `letter-spacing: -0.02em;` — it's already set; confirm the value is at least `-0.025em`:

```css
.page-head h1 {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.025em;   /* tighter for Carbon's cold-precision feel */
  line-height: 1.05;
  margin: 0;
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add consistent/src/styles/tokens.css
git commit -m "design: Parchment card shadow + Carbon heading letter-spacing"
```

---

### Task 7: Visual verification — both themes

No automated tests exist for visual token changes. Manually verify both themes across all five pages.

**Files:**
- No edits — observation only.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open: `http://localhost:5173`

- [ ] **Step 2: Dark mode (Carbon) checklist**

Toggle to dark mode (or confirm it is default). Walk through each page and confirm:

| Check | Pass? |
|---|---|
| Background is near-black `#0A0A0C`, not warm brown | |
| Card backgrounds are `#111116` — visible but not warm | |
| All text is near-white or mid-grey — no large green numbers | |
| Progress bars and rings are green — bars coloured, text neutral | |
| Sidebar active indicator: green left bar visible | |
| Primary buttons: green fill with dark text | |
| `.delta.pos` still shows accent green (small deltas keep semantic colour) | |
| Today's date in week view shows accent green | |
| Dashboard, Goals, Planner, Consistency, Settings — no layout breaks | |

- [ ] **Step 3: Light mode (Parchment) checklist**

Toggle to light mode in Settings. Walk through each page:

| Check | Pass? |
|---|---|
| Background is warm cream `#F7F3EE` — not cool white | |
| Cards are near-white `#FBF8F4` with warm borders | |
| Text is deep ink `#1A1410` — legible, warm | |
| Progress bars sweep from grey → navy as value increases | |
| Sidebar active indicator: navy left bar | |
| Primary buttons: navy fill with light text | |
| Card hover shadow is warm, not cool-grey | |
| Dashboard, Goals, Planner, Consistency, Settings — no layout breaks | |

- [ ] **Step 4: Commit final state**

If any visual issues were fixed in steps 2–3, commit them now:

```bash
git add consistent/src/styles/tokens.css
git commit -m "design: visual verification fixes — Carbon + Parchment"
```

If no fixes were needed, skip this step.

---

## Acceptance Criteria Summary

- [ ] `:root` block reflects Carbon values (surface + accent)
- [ ] `[data-theme='light']` block reflects Parchment values (surface + navy accent)
- [ ] Green text absent from Carbon — only bars, indicators, and primary buttons
- [ ] Navy accent renders correctly on all interactive elements in Parchment
- [ ] Progress gradient ends on green in dark, navy in light
- [ ] `npm run build` passes cleanly after each task
- [ ] Both themes verified visually across all five pages
