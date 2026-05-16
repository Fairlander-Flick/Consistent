// Registers the offline service worker. No-op in dev (the SW caches the
// built shell, which would interfere with HMR) and where unsupported.
export function registerSW() {
  if (!import.meta.env.PROD) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('[sw] registration failed:', err)
    })
  })
}
