'use client';

import { useEffect, useState } from 'react';

async function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

export default function EnablePushButton() {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<'idle'|'on'|'off'|'loading'>('idle');

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);
  }, []);

  const enable = async () => {
    try {
      setStatus('loading');
      const reg = await navigator.serviceWorker.ready;
      const res = await fetch('/api/push/subscribe');
      const { publicKey } = await res.json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await urlBase64ToUint8Array(publicKey)
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: sub.toJSON().keys,
          userAgent: navigator.userAgent
        })
      });
      setStatus('on');
    } catch (e) {
      console.error(e);
      setStatus('off');
    }
  };

  if (!supported) return null;

  return (
    <button
      onClick={enable}
      className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
      disabled={status==='loading'}
    >
      {status==='loading' ? 'Aktiverer…' : status==='on' ? 'Push er aktiveret ✅' : 'Aktivér push-notifikationer'}
    </button>
  );
}
