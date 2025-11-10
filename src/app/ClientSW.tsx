'use client';

import { useEffect } from 'react';

export default function ClientSW() {
  useEffect(() => {
    // KUN i browser + KUN i prod
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    const register = async () => {
      try {
        // Tjek at sw.js faktisk kan hentes og er en gyldig JS-fil
        const res = await fetch('/sw.js', { cache: 'no-store' });
        if (!res.ok) throw new Error(`SW fetch failed: ${res.status}`);
        const text = await res.clone().text();
        if (!text || text.includes('<!DOCTYPE')) {
          throw new Error(
            'SW looks like HTML, not JS (wrong path or dev build)',
          );
        }

        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw?.addEventListener('statechange', () => {
            if (
              nw.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.info('[SW] New version installed.');
              // evt. vis toast / soft reload
            }
          });
        });
      } catch (err) {
        console.info('[SW] Registration skipped:', err);
      }
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
