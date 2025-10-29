import type { NextConfig } from 'next';

const nextConfig = {
  typedRoutes: false, // ← her
  eslint: { ignoreDuringBuilds: true, dirs: [] },
  turbopack: { root: process.cwd() }, // absolut sti
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // evt. map-tiles CDN:
      { protocol: 'https', hostname: '*.tile.openstreetmap.org', pathname: '/**' },
    ],
  },
  reactStrictMode: true,
  experimental: {
    // hvis I bruger typedRoutes etc. — bevar jeres eksisterende
  },
};
export default nextConfig;
