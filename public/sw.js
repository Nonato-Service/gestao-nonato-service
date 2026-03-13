// Service Worker - Gestão Técnica Nonato Service (PWA offline)
// Bumpar CACHE_NAME ao atualizar layout mobile
const CACHE_NAME = 'nonato-pwa-v7'

const PRECACHE_ASSETS = [
  '/',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {})
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    }).then(() => self.clients.claim())
  )
})

// Para navegação (abrir o app): CACHE PRIMEIRO quando há cache — assim abre offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  if (event.request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return

  const isNavigate = event.request.mode === 'navigate'

  if (isNavigate) {
    // Pedido de página: tentar cache primeiro para funcionar offline ao reabrir
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then((cached) => {
          if (cached) {
            // Tem cache: devolver logo e atualizar em background (se online)
            fetch(event.request, { cache: 'no-cache' })
              .then((r) => {
                if (r.status === 200 && r.type === 'basic') {
                  const clone = r.clone()
                  caches.open(CACHE_NAME).then((c) => c.put(event.request, clone))
                }
              })
              .catch(() => {})
            return cached
          }
          // Sem cache: rede primeiro
          return fetch(event.request, { cache: 'no-cache' })
            .then((r) => {
              if (r.status === 200 && r.type === 'basic') {
                const clone = r.clone()
                caches.open(CACHE_NAME).then((c) => c.put(event.request, clone))
              }
              return r
            })
            .catch(() => {
              return caches.match('/', { ignoreSearch: true })
                .then((index) => index || new Response(
                  '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body style="background:#000;color:#0f0;font-family:sans-serif;padding:20px;text-align:center"><h1>Sem ligação</h1><p>Abra o app quando tiver internet para carregar os dados.</p></body></html>',
                  { headers: { 'Content-Type': 'text/html' } }
                ))
            })
        })
    )
    return
  }

  // Outros recursos: rede primeiro, cache como fallback
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((r) => {
        if (r.status === 200 && r.type === 'basic') {
          const clone = r.clone()
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone))
        }
        return r
      })
      .catch(() => {
        return caches.match(event.request, { ignoreSearch: true })
          .then((c) => c || new Response('', { status: 503, statusText: 'Offline' }))
      })
  )
})
