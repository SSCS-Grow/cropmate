# PWA & Caching
- SW: public/sw.js (Workbox 6.5)
- Offline fallback: /offline
- Caching:
  - HTML: NetworkFirst
  - API: StaleWhileRevalidate (/api/library, /api/observations)
  - Images (Supabase): CacheFirst (7 dage)
  - Map Tiles: CacheFirst (14 dage)
- Registrering: src/app/ClientSW.tsx
- Test: Lighthouse PWA ≥ 90
