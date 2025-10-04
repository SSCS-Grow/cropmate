'use client';

import { usePush } from '@/hooks/usePush';

export default function EnablePushButton() {
  const { supported, permission, subscribed, subscribe } = usePush();

  if (!supported) return null;
  if (permission === 'denied') return <span className="text-xs text-red-600">Notifikationer blokeret</span>;
  if (subscribed) return <span className="text-xs text-green-700">Notifikationer aktiveret</span>;

  return (
    <button onClick={subscribe} className="px-3 py-1 rounded bg-black text-white text-sm">
      Aktiver notifikationer
    </button>
  );
}
