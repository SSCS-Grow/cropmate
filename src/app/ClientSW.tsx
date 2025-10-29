'use client';

import { useEffect } from 'react';

/**
 * Registrerer service worker KUN i browseren og KUN i produktion.
 * Sikker mod SSR, og støjer ikke i dev (hot reload).
 */
export default function ClientSW() {
  useEffect(() => {
    // Kun i browseren + kun i production-builds
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      const register = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

          // (Valgfrit) auto-refresh når ny SW er klar:
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Ny version er klar. Her kan du vise en toast eller auto-reloade:
                // window.location.reload();
                // Eller emitte en custom event som din UI kan lytte på.
                console.info('[SW] Ny version klar (installeret).');
              }
            });
          });
        } catch (err) {
          console.error('[SW] Registrering fejlede:', err);
        }
      };

      // Vent til page-load for at undgå race med Next routing
      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}
