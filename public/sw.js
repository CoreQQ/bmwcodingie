// Minimal service worker — presence + a fetch handler makes PULT installable
// as a standalone app on Windows (Chrome/Edge) and gives a fast shell on iOS.
// Network-first so admin data is always fresh; no aggressive caching of API.
const SHELL = 'pult-shell-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/miniapp'])).catch(() => undefined));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Never cache API calls — the admin must see live data.
  if (url.pathname.startsWith('/api/')) return;
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (url.pathname.startsWith('/miniapp')) {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(e.request, copy)).catch(() => undefined);
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('/miniapp'))),
  );
});
