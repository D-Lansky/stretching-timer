// sw.js – dumb service‐worker: claims control, but never caches.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate',  event => self.clients.claim());
// All fetches go straight to the network; if offline, let the browser decide.
