const CACHE_NAME = "fittrack-v3.2"; // cambia versione ogni volta che aggiorni
const FILES_TO_CACHE = [
  "/fittrack/",
  "/fittrack/index.html",
  "/fittrack/style.css",
  "/fittrack/script.js",
  "/fittrack/program.json",
  "/fittrack/icon.png",
  "/fittrack/manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting(); // forza il nuovo SW subito
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // i client usano subito il nuovo SW
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).then(response => {
      // aggiorna cache con la nuova versione del file
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});
