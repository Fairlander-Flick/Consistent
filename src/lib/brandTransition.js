// One-shot handoff of the cream-panel logo's bounding rect to the
// Sidebar logo that mounts after the route swap. Lives in module
// scope (not React state) because the source unmounts before the
// destination mounts — there is no shared component to hold it.
let pending = null

export function captureBrandRect(rect) {
  pending = rect ? { rect, capturedAt: performance.now() } : null
}

export function consumeBrandRect() {
  const value = pending
  pending = null
  // Stale captures (older than 2s) are discarded — likely a stray
  // capture from a previous session or a navigation that never
  // completed.
  if (!value) return null
  if (performance.now() - value.capturedAt > 2000) return null
  return value.rect
}
