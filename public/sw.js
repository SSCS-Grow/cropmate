/* global workbox */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

(async () => {
  try {
    // Prøv at loade Workbox
    importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
    if (!(self.workbox && self.workbox.routing)) throw new Error('Workbox not available');

    const { routing, strategies, cacheableResponse, expiration, precaching } = self.workbox;

    // Precache placeholder (kan udfyldes senere)
    precaching.precacheAndRoute(self.__WB_MANIFEST || []);

    // HTML navigations → Network First
    routing.registerRoute(
      ({ request }) => request.mode === 'navigate',
      new strategies.NetworkFirst({
        cacheName: 'html-pages',
        networkTimeoutSeconds: 3,
        plugins: [new cacheableResponse.CacheableResponsePlugin({ statuses: [200] })],
      })
    );

    // API → SWR
    routing.registerRoute(
      ({ url }) => url.pathname.startsWith('/api/library') || url.pathname.startsWith('/api/observations') || url.pathname.startsWith('/api/insights'),
      new strategies.StaleWhileRevalidate({
        cacheName: 'api-swr',
        plugins: [
          new expiration.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 }),
          new cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      })
    );

    // Supabase billeder → Cache First
    routing.registerRoute(
      ({ url }) => url.hostname.endsWith('supabase.co') && url.pathname.includes('/storage/v1/object/public/'),
      new strategies.CacheFirst({
        cacheName: 'image-cache',
        plugins: [
          new expiration.ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 }),
          new cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      })
    );

    // Map tiles → Cache First
    routing.registerRoute(
      ({ url }) => /\.(png|pbf)$/.test(url.pathname) || /tile|tiles/i.test(url.pathname),
      new strategies.CacheFirst({
        cacheName: 'map-tiles',
        plugins: [
          new expiration.ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14 }),
          new cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      })
    );

    // Static assets → SWR
    routing.registerRoute(
      ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
      new strategies.StaleWhileRevalidate({ cacheName: 'assets' })
    );

    const OFFLINE_URL = '/offline';
    routing.setCatchHandler(async ({ event }) => {
      if (event.request.destination === 'document') {
        const match = await caches.match(OFFLINE_URL, { ignoreSearch: true });
        return match || Response.error();
      }
      return Response.error();
    });

    console.info('[SW] Workbox ready');
  } catch (e) {
    // Failsafe: No-op SW så vi undgår crashes i dev/misconfig
    console.warn('[SW] Workbox disabled (fallback no-op):', e);
    self.addEventListener('fetch', () => {}); // lad alt passere
  }
})();
