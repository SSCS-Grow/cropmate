'use client';
import { useEffect, useState } from 'react';

export function usePushSubscribe() {
  const [status, setStatus] = useState<
    'idle' | 'unsupported' | 'ready' | 'subscribed' | 'blocked'
  >(() =>
    !('serviceWorker' in navigator) || !('PushManager' in window)
      ? 'unsupported'
      : 'idle',
  );

  useEffect(() => {
    if (status === 'unsupported') return;

    (async () => {
      // Vent på at service worker er registreret
      const reg = await navigator.serviceWorker.ready;

      // Har brugeren allerede en subscription?
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setStatus('subscribed');
        return;
      }

      // Spørg om tilladelse
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus('blocked');
        return;
      }

      // Lav en ny subscription med din offentlige VAPID-nøgle
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      // Send den til backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: sub.toJSON().keys,
        }),
      });

      setStatus('subscribed');
    })();
  }, [status]);

  return status;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Clean = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64Clean);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
