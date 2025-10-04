'use client';

import { useCallback, useEffect, useState } from 'react';

export function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePush() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
    setPermission(Notification.permission);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((s) => setSubscribed(!!s))
      );
    }
  }, []);

  const register = useCallback(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('SW not supported');
    await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
  }, []);

  const subscribe = useCallback(async () => {
    await register();
    const reg = await navigator.serviceWorker.ready;
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(vapid),
    });
    // send til server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });
    setSubscribed(true);
  }, [register]);

  return { supported, permission, subscribed, register, subscribe };
}
