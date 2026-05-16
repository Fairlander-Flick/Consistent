// Minimal offline service worker for Consistent.
//
// The app is a static SPA whose data lives in localStorage, so we only need
// the shell to be available offline. Vite fingerprints asset filenames, so
// instead of a precache manifest we cache at runtime:
//   - navigations: network-first, falling back to the cached shell
//   - other same-origin GETs: stale-while-revalidate
// Bump CACHE_VERSION to evict everything on the next activation.

const CACHE_VERSION = 'v1'
const CACHE = `consistent-${CACHE_VERSION}`
const SHELL = '/index.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll([SHELL, '/'])).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          caches.open(CACHE).then(c => c.put(SHELL, res.clone()))
          return res
        })
        .catch(() => caches.match(SHELL).then(r => r || caches.match('/')))
    )
    return
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE).then(c => c.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
