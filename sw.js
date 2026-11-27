// © 2026 Yak1s. All rights reserved.
// Offline: once The Hidden Seal has been opened, everything it loaded is kept on this device, so the game keeps
// working with no internet (also after the computer has slept).
//   Pages and small data (html, json): fresh from the network when online, the kept copy only when offline. (Kept
//     copies first made an updated game open its old pages, which asked for files that no longer exist: a black
//     classroom preview. Owner report 2026-11-21.)
//   Code, pictures, fonts and voices: their names change with every version, so the kept copy is used first.
// The voices are fetched once, all of them, as soon as the Control Center asks.
const CACHE = 'hidden-seal-v4'; // v3: drops old copies of printables (owner 2026-11-23: the viewer showed an old page)
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './teacher.html', './display.html']).catch(() => {})));
});
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  // only this game's own old copies go: the saved voices (hidden-seal-voices-*) stay, and other apps' storage is untouched
  for (const k of await caches.keys()) if (/^hidden-seal-v\d+$/.test(k) && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
// printables (PDFs and their page pictures) keep their names when rebuilt: always fresh when online, kept for offline
const fresh = (req, url) => req.mode === 'navigate' || /\.(html|json|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/') || url.pathname.includes('/print/');
self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // voices are kept by the game itself (one copy, in hidden-seal-voices-v1): not here too
  if (/\/voices(-[a-z]+)?\//.test(url.pathname)) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const keep = (r) => { if (r.ok && r.status === 200) c.put(req, r.clone()); return r; };
    if (fresh(req, url)) { // network first, the kept copy when offline
      // a barely working network: after 3 s the saved copy (the page never hangs)
      const saved = c.match(req, { ignoreSearch: true });
      try { return keep(await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 3000))])); }
      catch { return (await saved) || fetch(req).then(keep).catch(() => Response.error()); }
    }
    const hit = await c.match(req, { ignoreSearch: true });
    return hit || fetch(req).then(keep).catch(() => Response.error());
  }));
});
// the Control Center sends the list of voice files: keep them all, so every line can be spoken offline
self.addEventListener('message', (e) => {
  if (e.data?.type !== 'precache' || !Array.isArray(e.data.urls)) return;
  e.waitUntil(caches.open(CACHE).then(async (c) => { for (const u of e.data.urls) { if (!(await c.match(u))) await c.add(u).catch(() => {}); } }));
});
