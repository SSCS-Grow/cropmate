'use client';

import { useEffect, useState } from 'react';

/**
 * useCachedFetch - simpel cache-aware data hook.
 * Viser cached data instant, mens den opdaterer fra netværket.
 *
 * Eksempel:
 * const { data, loading, error } = useCachedFetch('/api/library');
 */

export function useCachedFetch<T = any>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;

    const cacheKey = `cache:${url}`;

    // 1️⃣ vis cache hvis findes
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
      } catch {}
    }

    // 2️⃣ hent nyt data og opdater cache
    fetch(url, options)
      .then(async (res) => {
        if (!res.ok) throw new Error(res.statusText);
        const json = await res.json();
        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify(json));
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[useCachedFetch] offline eller fetch fejl', err);
        setError(err);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}
