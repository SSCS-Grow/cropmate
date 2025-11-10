'use client';

import { useEffect } from 'react';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    // Lazy-load for at undgå build-fejl, hvis pakken mangler
    import('posthog-js')
      .then(({ default: posthog }) => {
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        });
      })
      .catch(() => {
        // Bevidst tom: analytics må aldrig vælte UI
      });
  }, []);

  return <>{children}</>;
}
