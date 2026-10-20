// Ali Brain service worker: caches the app shell and CDN libraries so the app launches offline.
// Notes live in your local file / browser storage, never in this cache.
const CACHE = 'ali-brain-shell-v1';
const SHELL = ['./', './index.html', './style.css', './favicon.svg', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never touch AI API calls or the Safari local sync bridge
  if (url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname.includes('generativelanguage')) return;
  if (!/^https?:$/.test(url.protocol)) return;

  const sameOrigin = url.origin === self.location.origin;

  // Pages: network first so updates arrive immediately, cache fallback offline
  if (req.mode === 'navigate' || (sameOrigin && /\.(html|css|js|webmanifest)$/.test(url.pathname))) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // Everything else (CDN libraries, fonts, icons): stale-while-revalidate
  event.respondWith(
    caches.match(req).then((hit) => {
      const fetching = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || fetching;
    })
  );
});
