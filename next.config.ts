import type { NextConfig } from 'next';

const nextConfig = {
  typedRoutes: false, // ← her
  eslint: { ignoreDuringBuilds: true, dirs: [] },
  turbopack: { root: process.cwd() }, // absolut sti
  outputFileTracingRoot: process.cwd(),
};
export default nextConfig;
