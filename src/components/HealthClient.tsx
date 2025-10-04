'use client';

import { useEffect, useState } from 'react';

type C = { name: string; ok: boolean; info?: string };

export default function HealthClient() {
  const [checks, setChecks] = useState<C[]>([]);

  useEffect(() => {
    (async () => {
      const results: C[] = [];

      const swSupported = 'serviceWorker' in navigator;
      results.push({ name: 'PWA: serviceWorker supported', ok: swSupported, info: swSupported ? 'supported' : 'not supported' });

      if (swSupported) {
        const regs = await navigator.serviceWorker.getRegistrations();
        results.push({ name: 'PWA: serviceWorker registered', ok: regs.length > 0, info: regs.length ? `registrations=${regs.length}` : 'no registrations' });
      }

      const notif = 'Notification' in window ? Notification.permission : 'unsupported';
      results.push({ name: 'PWA: notifications permission', ok: notif !== 'denied', info: typeof notif === 'string' ? notif : 'unsupported' });

      const inStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      results.push({ name: 'PWA: display-mode standalone', ok: inStandalone, info: inStandalone ? 'standalone' : 'browser' });

      const supported = ['da', 'en'];
      const lang = document.documentElement.lang || navigator.language?.slice(0, 2) || 'da';
      results.push({ name: 'i18n: document.lang', ok: supported.includes(lang), info: lang });

      setChecks(results);
    })();
  }, []);

  return (
    <div className="grid gap-2">
      {checks.map((c, i) => (
        <div key={i} className={`rounded-xl border p-3 ${c.ok ? 'border-green-400' : 'border-yellow-400'}`}>
          <div className="font-medium">{c.name}</div>
          <div className={`text-sm ${c.ok ? 'text-green-600' : 'text-yellow-700'}`}>{c.ok ? 'OK' : 'WARN'} {c.info ? `— ${c.info}` : ''}</div>
        </div>
      ))}
    </div>
  );
}
