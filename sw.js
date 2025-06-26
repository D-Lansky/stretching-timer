const CACHE_NAME = 'stretch-timer-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap'
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to open cache or add URLs:', err);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Ensure new service worker takes control immediately
});

// Fetch event: Serve cached assets if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  // For Google Fonts, use a stale-while-revalidate strategy for the CSS file
  if (event.request.url.startsWith('https://fonts.googleapis.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise; // Serve from cache if available, otherwise fetch; update cache in background
        });
      })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }
        return fetch(event.request).then(
          networkResponse => {
            // Optionally, cache new requests dynamically if needed,
            // but for this basic setup, we rely on the initial cache.
            // Be careful with caching everything, especially third-party scripts or large assets.
            return networkResponse;
          }
        );
      })
      .catch(error => {
        // Fallback for failed fetch (e.g., offline and not in cache)
        // This could be a custom offline page, but for now, we'll just let the browser handle it.
        console.error('Fetching failed:', error);
        // For a basic offline experience, if it's a navigation request for an HTML page not in cache,
        // you might want to return a fallback offline.html page.
        // if (event.request.mode === 'navigate') {
        //   return caches.match('/offline.html'); // You would need to cache offline.html
        // }
      })
  );
});
