/* global workbox */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Precache Next build-manifest hvis du senere vil injecte — placeholder:
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// HTML navigations → Network First (offline fallback)
workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'html-pages',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({statuses: [200]}),
    ],
  })
);

// API (library/observations) → Stale-While-Revalidate
workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/library') || url.pathname.startsWith('/api/observations'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'api-swr',
    plugins: [
      new workbox.expiration.ExpirationPlugin({maxEntries: 200, maxAgeSeconds: 60 * 60}),
      new workbox.cacheableResponse.CacheableResponsePlugin({statuses: [0, 200]}),
    ],
  })
);

// Supabase Storage billeder (thumbnails) → Cache First m. begrænsning
workbox.routing.registerRoute(
  ({url}) => url.hostname.endsWith('supabase.co') && url.pathname.includes('/storage/v1/object/public/'),
  new workbox.strategies.CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7}),
      new workbox.cacheableResponse.CacheableResponsePlugin({statuses: [0, 200]}),
    ],
  })
);

// Kort-tiles (OSM/XYZ) → Cache First m. TTL
workbox.routing.registerRoute(
  ({url}) => url.pathname.match(/(tile|tiles|tile\.openstreetmap|\.png|\.pbf)$/),
  new workbox.strategies.CacheFirst({
    cacheName: 'map-tiles',
    plugins: [
      new workbox.expiration.ExpirationPlugin({maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14}),
      new workbox.cacheableResponse.CacheableResponsePlugin({statuses: [0, 200]}),
    ],
  })
);

// Static assets → Stale-While-Revalidate
workbox.routing.registerRoute(
  ({request}) => ['style', 'script', 'worker'].includes(request.destination),
  new workbox.strategies.StaleWhileRevalidate({cacheName: 'assets'})
);

// Offline fallback (kun for navigations)
const OFFLINE_URL = '/offline';
workbox.routing.setCatchHandler(async ({event}) => {
  if (event.request.destination === 'document') {
    return caches.match(OFFLINE_URL, {ignoreSearch: true});
  }
  return Response.error();
});
