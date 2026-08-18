// Service Worker - Gestão Técnica Nonato Service (PWA offline)
// CACHE_NAME sincronizado a partir de pwa-version.json (npm run pwa:sync / prebuild)
const CACHE_NAME = 'nonato-pwa-v343'

const PRECACHE_ASSETS = [
  '/',
  '/icon.svg',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/apple-touch-icon.png',
  '/brand/nonato-logo-original.png',
  '/brand/nonato-watermark-gears.svg',
]

/** Página offline neutra (PT + EN) — o resto da UI já está nos 6 idiomas na app. */
const OFFLINE_HTML =
  '<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nonato Service</title></head><body style="margin:0;background:#000;color:#00ff00;font-family:Segoe UI,system-ui,sans-serif;padding:28px 20px;text-align:center;line-height:1.55;min-height:100vh;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center"><div style="max-width:420px"><div style="font-size:42px;margin-bottom:12px" aria-hidden="true">⚙</div><h1 style="margin:0 0 10px;font-size:22px;letter-spacing:0.04em">NONATO SERVICE</h1><p style="color:#fff;margin:0 0 8px;font-size:16px">Sem ligação / Offline</p><p style="color:#bbb;margin:0 0 18px;font-size:14px">Se já abriu o sistema com internet neste aparelho, volte a abrir a app — os dados locais devem carregar.<br><span style="color:#888">If you already opened the app online on this device, reopen it — local data should load.</span></p><p style="color:#666;font-size:12px;margin:0">1.ª utilização / First use: precisa de internet para preparar o modo offline.</p></div></body></html>'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            /* recurso opcional — não falhar o install todo */
          })
        )
      )
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

async function networkFirstStatic(request) {
  if (self.navigator.onLine) {
    try {
      const r = await fetch(request, { cache: 'no-cache' })
      return putInCache(request, r)
    } catch {
      /* cair para cache */
    }
  }
  const cached = await caches.match(request, { ignoreSearch: true })
  if (cached) return cached
  try {
    const r = await fetch(request, { cache: 'no-cache' })
    return putInCache(request, r)
  } catch {
    return new Response('', { status: 503, statusText: 'Offline' })
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

  // JS/CSS do Next — online: rede primeiro (actualizações); offline: cache
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image')) {
    event.respondWith(networkFirstStatic(event.request))
    return
  }

  // Capturas do manual — sempre rede (cada página tem ficheiro diferente)
  if (url.pathname.startsWith('/manual/assets/')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }))
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
