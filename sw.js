// Keeps a copy of the player on each iPad so it still opens and plays without Wi-Fi.
const CACHE = 'maravelle-show-v5';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'assets/bg-voices.webp', 'assets/voices.webp', 'assets/button-frame.png', 'assets/fonts/ivymode-regular.woff2', 'assets/ghaf.webp', 'assets/mar-rose.webp', 'assets/mar-white.webp', 'assets/icon-192.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') { const c = await caches.open(CACHE); c.put(req, res.clone()); }
  return res;
}
async function networkFirst(req) {
  try {
    const res = await fetch(req, { cache: 'no-store' });
    if (res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
    return res;
  } catch (e) {
    return (await caches.match(req)) || (await caches.match('index.html')) || Response.error();
  }
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== location.origin) {
    if (/(^|\.)fonts\.(gstatic|googleapis)\.com$/.test(u.hostname)) e.respondWith(cacheFirst(req));
    return;
  }
  if (u.pathname.endsWith('/show.json')) return;               // the page keeps its own offline copy
  if (u.pathname.includes('/media/') || u.pathname.includes('/assets/')) { e.respondWith(cacheFirst(req)); return; }
  e.respondWith(networkFirst(req));
});
