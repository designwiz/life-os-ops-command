self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  clients.claim();
});

// Optional: you can add caching here later if you want offline support.
// For now, this minimal worker is enough to tick the PWA box.
