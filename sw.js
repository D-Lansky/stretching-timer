// --- Stretch Timer Service Worker (offline + safe updates) ---
const CACHE_VERSION = 'v9'; // ↑ bump this on each release
const PRECACHE = `stretch-precache-${CACHE_VERSION}`;
const RUNTIME  = `stretch-runtime-${CACHE_VERSION}`;

// 👇 Put your actual files here (edit paths to match your repo)
const PRECACHE_URLS = [
  '/',                // navigation shell
  '/index.html',
  '/style.css',
  '/main.js',         // or /script.js if you use a single file
  '/timer.js',
  '/audioManager.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Allow immediate activation from the page
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    // cache with "reload" to bypass HTTP cache
    await cache.addAll(PRECACHE_URLS.map(u => new Request(u, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // clean old caches
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => ![PRECACHE, RUNTIME].includes(k))
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // 1) Navigation requests: network-first, fallback to cached index.html
  const isNav = request.mode === 'navigate' || request.destination === 'document';
  if (isNav) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        // update cached shell for offline
        const cache = await caches.open(PRECACHE);
        cache.put('/index.html', fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(PRECACHE);
        return (await cache.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  // 2) Same-origin static assets: cache-first, then network (and cache)
  const sameOrigin = new URL(request.url).origin === self.location.origin;
  if (sameOrigin) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const resp = await fetch(request);
        // only cache ok responses
        if (resp && resp.status === 200 && resp.type === 'basic') {
          cache.put(request, resp.clone());
        }
        return resp;
      } catch {
        // last-resort: precache match (e.g., style.css/js)
        return (await caches.match(request)) || Response.error();
      }
    })());
  }
});
