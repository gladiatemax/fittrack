// sw.js
const CACHE_NAME = "fittrack-cache-v1";
const URLS_TO_CACHE = [
  "/fittrack/",          // homepage (importante per GitHub Pages)
  "/fittrack/index.html",
  "/fittrack/style.css",
  "/fittrack/script.js",
  "/fittrack/manifest.json",
  "/fittrack/icon-192.png",
  "/fittrack/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
