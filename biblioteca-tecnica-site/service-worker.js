/* Service Worker — cópia gestão técnica (cache separado) */
const CACHE_NAME = 'gestao-biblio-site-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/db.js',
  './js/start-info.js',
  './js/app.js',
  './assets/logo.png',
  './assets/homag.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith('http') && !event.request.url.includes(self.location.hostname)) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ? Promise.resolve(cached) : fetch(event.request)
    )
  );
});
