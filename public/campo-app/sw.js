const CACHE = "nonato-campo-v9";
const BASE = "/campo-app/";
const ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "styles.css",
  BASE + "manifest.json",
  BASE + "assets/icon.svg",
  BASE + "assets/icon-192.png",
  BASE + "assets/icon-512.png",
  BASE + "js/db.js",
  BASE + "js/i18n.js",
  BASE + "js/utils.js",
  BASE + "js/pdf.js",
  BASE + "js/app.js",
];

function isAppShell(url) {
  const p = url.pathname;
  return (
    p.endsWith(".html") ||
    p.endsWith(".js") ||
    p.endsWith(".css") ||
    p === BASE.slice(0, -1) ||
    p === BASE + "index.html"
  );
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE)) return;

  if (e.request.mode === "navigate" || isAppShell(url)) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          if (r && r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => caches.match(e.request).then((m) => m || caches.match(BASE + "index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((r) => {
          if (r && r.status === 200) {
            const clone = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => caches.match(BASE + "index.html"));
    })
  );
});
