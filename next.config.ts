// next.config.ts
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  typedRoutes: false,
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

export default withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    widenClientFileUpload: true,
  },
  {
    hideSourcemaps: true,
  },
)
