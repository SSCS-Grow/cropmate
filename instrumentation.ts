export async function register() {
  // Ensure Sentry's config files run in the correct runtime.
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  } else if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
}
