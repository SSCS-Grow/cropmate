'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import supabaseBrowser from '@/lib/supabaseBrowser';

/**
 * Badge med antal åbne opgaver for den aktuelle bruger.
 * Skjuler sig selv hvis ikke logget ind eller count <= 0.
 */
export default function NavTasksBadge() {
  const supabase = useMemo(() => {
    return typeof window === 'undefined' ? null : supabaseBrowser();
  }, []);
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) {
        setCount(null);
        return;
      }

      const { count: openCount, error } = await supabase
        .from('plant_tasks' as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        // "åben" = ikke afsluttet i enten done_at eller completed_at
        .or('done_at.is.null,completed_at.is.null');

      if (error) {
        setCount(null);
        return;
      }
      setCount(typeof openCount === 'number' ? openCount : 0);
    } catch {
      setCount(null);
    }
  }, [supabase]);

  // Initial load + refresh ved tab-visibilitet (asynkront kick)
  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    const run = async () => {
      if (!cancelled) await refresh();
    };

    const t = setTimeout(() => {
      void run();
    }, 0);

    const onVis = () => {
      if (document.visibilityState === 'visible') void run();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      clearTimeout(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [supabase, refresh]);

  // Opdater ved login/logout
  useEffect(() => {
    if (!supabase) return;

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        void refresh();
      }, 0);
    });
    return () => {
      sub.subscription?.unsubscribe();
    };
  }, [supabase, refresh]);

  if (count == null || count <= 0) return null;

  const text = count > 99 ? '99+' : String(count);

  return (
    <span
      className="ml-2 inline-flex min-w-[20px] h-[20px] items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] px-1.5 leading-none"
      aria-label={`${text} åbne opgaver`}
      title={`${text} åbne opgaver`}
    >
      {text}
    </span>
  );
}
