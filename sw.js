const CACHE = 'market-pulse-v1';
const SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for the app shell (so updates arrive), cache fallback if offline.
// API calls (coingecko, rss2json, etc.) always go to network — live data should never be stale.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isShell = url.origin === location.origin;
  if (!isShell) return; // let live-data requests pass through untouched
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
