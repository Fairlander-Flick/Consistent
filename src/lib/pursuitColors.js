// A pursuit's accent colour, used to tie a root pursuit together across the
// dashboard (Goals tree dots, Time Management ring/bar/legend, week todo dots).
// The actual hues live as CSS custom properties (--p-1 … --p-6 with dark/light
// variants in tokens.css) so they stay theme-aware; here we just map a stable id
// to one of the slots deterministically, so the same pursuit always reads the
// same colour. One-off / planner items (no pursuit) get the neutral --p-plan.
const SLOTS = 6

export function pursuitColorVar(id) {
  if (id == null || id === '') return 'var(--p-plan)'
  const s = String(id)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return `var(--p-${(h % SLOTS) + 1})`
}

export const PLANNER_COLOR = 'var(--p-plan)'
