import { useEffect, useMemo, useState } from 'react';

type Opts = RequestInit & { ttlMs?: number };

/**
 * Simpelt fetch-hook med localStorage-cache.
 * - key: logisk nøgle til cachen (uden TTL/version i sig)
 * - url: fuld URL
 * - options: fetch options + ttlMs (default 5 min)
 */
export default function useCachedFetch<T = unknown>(
  key: string,
  url: string,
  options: Opts = {},
) {
  const ttlMs = options.ttlMs ?? 5 * 60 * 1000;

  const cacheKey = useMemo(() => `cm_cache:${key}`, [key]);

  type CacheEnvelope = { at: number; data: T };

  const [data, setData] = useState<T | null>(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheEnvelope;
      if (typeof parsed?.at !== 'number') return null;
      if (Date.now() - parsed.at > ttlMs) return null;
      return parsed.data ?? null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(() => data == null);
  const [error, setError] = useState<string | null>(null);

  const requestInit = useMemo(() => {
    const { ttlMs: _ttl, ...rest } = options;
    return JSON.stringify(rest ?? {});
  }, [options]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        if (data != null) {
          setLoading(false);
          return;
        }

        const init = JSON.parse(requestInit || '{}') as RequestInit;
        const res = await fetch(url, init);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = (await res.json()) as T;
        if (!alive) return;

        setData(json);
        setLoading(false);

        try {
          const envelope: CacheEnvelope = { at: Date.now(), data: json };
          localStorage.setItem(cacheKey, JSON.stringify(envelope));
        } catch {
          /* ignore quota */
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Network error');
        setLoading(false);
      }
    };

    const t = setTimeout(() => {
      void run();
    }, 0);

    return () => {
      alive = false;
      clearTimeout(t);
    };
    // inkluderer 'data' for at tilfredsstille exhaustive-deps
  }, [cacheKey, url, requestInit, data]);

  return { data, loading, error, refetchKey: cacheKey };
}
