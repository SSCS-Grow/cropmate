import { withSentryConfig } from "@sentry/nextjs";

const baseConfig = {
  reactStrictMode: true,
  experimental: {
    // Turbopack er allerede aktiv via CLI
    typedRoutes: false,
  },
};

export default withSentryConfig(
  baseConfig,
  {
    org: "YOUR-SENTRY-ORG",
    project: "cropmate",
    silent: true,
  },
  {
    // client & server runtime options
    tunnelRoute: "/monitoring",
    disableLogger: false,
  }
);
