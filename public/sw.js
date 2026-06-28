// Service Worker - Gestão Técnica Nonato Service (PWA offline)
// Bumpar CACHE_NAME em cada deploy que altere precache / lógica offline
const CACHE_NAME = 'nonato-pwa-v41'

const PRECACHE_ASSETS = ['/icon.svg', '/manifest.json']

const OFFLINE_HTML =
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nonato Service</title></head><body style="background:#000;color:#0f0;font-family:sans-serif;padding:24px;text-align:center;line-height:1.5"><h1 style="margin:0 0 12px">Sem ligação</h1><p style="color:#ccc;margin:0 0 16px">Se já abriu o sistema com internet neste aparelho, volte a abrir a app — os dados locais devem carregar.</p><p style="color:#888;font-size:14px;margin:0">Na primeira utilização é necessário internet para preparar o modo offline.</p></body></html>'

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
    caches
      .keys()
      .then((keys) => {
        return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      })
      .then(() => self.clients.claim())
  )
})

async function putInCache(request, response) {
  if (response.status === 200 && response.type === 'basic') {
    const clone = response.clone()
    const c = await caches.open(CACHE_NAME)
    await c.put(request, clone)
  }
  return response
}

async function navigateResponse(request) {
  const fromCache = async () => {
    const c = await caches.match(request, { ignoreSearch: true })
    if (c) return c
    const idx = await caches.match('/', { ignoreSearch: true })
    if (idx) return idx
    return new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  if (self.navigator.onLine) {
    try {
      const r = await fetch(request, { cache: 'no-cache' })
      return putInCache(request, r)
    } catch {
      return fromCache()
    }
  }

  const cached = await caches.match(request, { ignoreSearch: true })
  if (cached) return cached
  return fromCache()
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true })
  if (cached) return cached
  try {
    const r = await fetch(request, { cache: 'no-cache' })
    return putInCache(request, r)
  } catch {
    return caches.match(request, { ignoreSearch: true }).then((c) => c || new Response('', { status: 503, statusText: 'Offline' }))
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  if (event.request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/biblia-app')) return
  if (url.pathname.startsWith('/campo-app')) return

  const isNavigate = event.request.mode === 'navigate'

  if (isNavigate) {
    event.respondWith(navigateResponse(event.request))
    return
  }

  // JS/CSS do Next — cache-first para funcionar offline após uma visita online
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image')) {
    event.respondWith(cacheFirst(event.request))
    return
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((r) => putInCache(event.request, r))
      .catch(() => {
        return caches
          .match(event.request, { ignoreSearch: true })
          .then((c) => c || new Response('', { status: 503, statusText: 'Offline' }))
      })
  )
})
