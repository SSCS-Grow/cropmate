// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: false, // ✅ korrekt placering
  eslint: { ignoreDuringBuilds: true, dirs: [] },
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.tile.openstreetmap.org',
        pathname: '/**',
      },
    ],
  },

  reactStrictMode: true,
}

export default nextConfig
