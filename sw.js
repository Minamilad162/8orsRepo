/* Generated at build time. Do not manually edit dist/sw.js. */
const CACHE_NAME = 'ghars-spin-offline-5fad55571c327afa';
const CACHE_PREFIX = 'ghars-spin-offline-';
const APP_SHELL = new URL('./index.html', self.registration.scope).href;
const PRECACHE_PATHS = [
  "./",
  "./assets/main.css",
  "./assets/main.js",
  "./ghars-logo.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./index.html",
  "./manifest.webmanifest"
];
const PRECACHE_URLS = PRECACHE_PATHS.map(path => new URL(path, self.registration.scope).href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // A worker never activates if any essential file fails to cache.
    await cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.endsWith('/sw.js')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      // Online navigation receives the newest hosted app; disconnected visitors
      // get the locally-installed shell instead of a network error page.
      try {
        const response = await fetch(request);
        if (response.ok) return response;
      } catch { /* Offline: use precached shell. */ }
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(APP_SHELL) || await cache.match(new URL('./', self.registration.scope).href) || Response.error();
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        // Future same-origin assets referenced by a newer online page.
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return Response.error();
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'GHARS_CHECK_OFFLINE') return;
  const port = event.ports?.[0];
  if (!port) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const stored = await Promise.all(PRECACHE_URLS.map(url => cache.match(url)));
    port.postMessage({ ready: stored.every(Boolean), count: stored.filter(Boolean).length, total: stored.length });
  })());
});
