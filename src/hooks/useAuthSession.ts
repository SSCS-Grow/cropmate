// src/hooks/useAuthSession.ts
'use client';

import { useEffect, useState } from 'react';
import supabaseBrowser from '@/lib/supabaseBrowser';
import type { Session } from '@supabase/supabase-js';

export default function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let alive = true;

    (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        setSession(data.session ?? null);
        setLoading(false);

        const sub = supabase.auth.onAuthStateChange((_event, nextSession) => {
          // VIGTIGT: denne callback må ikke kaste
          try {
            setSession(nextSession ?? null);
          } catch (e) {
            console.warn('[auth] listener error', e);
          }
        });
        unsub = () => sub.data.subscription.unsubscribe();
      } catch (e) {
        console.warn('[auth] useAuthSession init error', e);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
      try {
        unsub?.();
      } catch {}
    };
  }, []);

  return { session, loading };
}
