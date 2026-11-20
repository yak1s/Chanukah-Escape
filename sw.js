// © 2026 Yak1s. All rights reserved.
// Offline: once The Hidden Seal has been opened, everything it loaded is kept on this device, so the game keeps
// working with no internet (also after the computer has slept). Pages and code are refreshed in the background
// when online; the voices are fetched once, all of them, as soon as the Control Center asks.
const CACHE = 'hidden-seal-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './teacher.html', './display.html']).catch(() => {})));
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then((r) => { if (r.ok && r.status === 200) c.put(req, r.clone()); return r; }).catch(() => hit || Response.error());
    return hit || net; // cached first (works offline), refreshed in the background
  }));
});
// the Control Center sends the list of voice files: keep them all, so every line can be spoken offline
self.addEventListener('message', (e) => {
  if (e.data?.type !== 'precache' || !Array.isArray(e.data.urls)) return;
  e.waitUntil(caches.open(CACHE).then(async (c) => { for (const u of e.data.urls) { if (!(await c.match(u))) await c.add(u).catch(() => {}); } }));
});
