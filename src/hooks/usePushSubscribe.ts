'use client';

import { useCallback, useEffect, useState } from 'react';

type PushStatus =
  | 'unsupported'
  | 'checking'
  | 'ready'
  | 'prompting'
  | 'subscribed'
  | 'blocked'
  | 'error';

export function usePushSubscribe() {
  const [status, setStatus] = useState<PushStatus>(() => {
    if (typeof window === 'undefined') return 'checking';
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return 'unsupported';
    }
    return 'checking';
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unsupported') return;

    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (cancelled) return;
        const existing = await reg.pushManager.getSubscription();
        if (cancelled) return;
        setStatus(existing ? 'subscribed' : 'ready');
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Kunne ikke initialisere push-notifikationer');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const subscribe = useCallback(async () => {
    if (
      status === 'unsupported' ||
      status === 'subscribed' ||
      status === 'prompting'
    ) {
      return;
    }

    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      setStatus('unsupported');
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setError('Mangler NEXT_PUBLIC_VAPID_PUBLIC_KEY');
      setStatus('error');
      return;
    }

    setStatus('prompting');
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('blocked');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
        }),
      });

      setStatus('subscribed');
    } catch (err: any) {
      setError(err?.message || 'Kunne ikke aktivere push');
      setStatus('error');
    }
  }, [status]);

  return { status, subscribe, error };
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Clean = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64Clean);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
