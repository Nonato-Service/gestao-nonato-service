const CACHE = "nonato-campo-v10";
const BASE = "/campo-app/";
const ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "styles.css",
  BASE + "manifest.json",
  BASE + "assets/icon.svg",
  BASE + "js/db.js",
  BASE + "js/i18n.js",
  BASE + "js/utils.js",
  BASE + "js/auth.js",
  BASE + "js/gestao.js",
  BASE + "js/pdf.js",
  BASE + "js/app.js",
];

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
  if (url.pathname.startsWith("/api/campo")) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((r) => {
          if (r && r.status === 200 && url.pathname.startsWith(BASE)) {
            const clone = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => caches.match(BASE + "index.html"));
    })
  );
});
