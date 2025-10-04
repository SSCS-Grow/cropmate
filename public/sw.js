/* Simple cache-first for static assets + push click */
const CACHE = 'cropmate-v1';
const ASSETS = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  e.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      }).catch(() => cached) // offline fallback
    )
  );
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data?.json() ?? {}; } catch {}
  const title = data.title || 'CropMate';
  const body = data.body || 'Ny notifikation';
  const url = data.url || '/';
  const tag = data.tag || 'cropmate';
  e.waitUntil(
    self.registration.showNotification(title, {
      body, tag,
      icon: '/icons/icon-192.png',
      data: { url }
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clis) => {
      const client = clis.find((c) => 'navigate' in c);
      if (client) return client.focus() && client.navigate(url);
      return clients.openWindow(url);
    })
  );
});
