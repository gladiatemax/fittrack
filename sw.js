const CACHE_NAME = "fittrack-cache-v1";
const urlsToCache = [
  "/fittrack/",
  "/fittrack/index.html",
  "/fittrack/style.css",
  "/fittrack/script.js",
  "/fittrack/program.json",
  "/fittrack/icon.png",
  "/fittrack/manifest.json"
];

// Installazione
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Attivazione
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

// 🔥 Notifica update
self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({ type: "NEW_VERSION" });
      }
    })()
  );
});
