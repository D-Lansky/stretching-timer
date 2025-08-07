// Service worker providing offline capability with cached core assets.
const CACHE_VERSION = 'v1';
const CACHE_NAME = `stretching-timer-${CACHE_VERSION}`;

// Assets required for the app shell. Update the list when adding new files.
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

