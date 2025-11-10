import { useEffect, useMemo, useState } from 'react';

type Params = {
  bbox?: [number, number, number, number]; // west,south,east,north
  days?: number;
};

type InsightPoint = {
  t: string; // ISO
  v: number; // value
};

export default function useInsights(params: Params = {}) {
  const [data, setData] = useState<InsightPoint[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const bboxKey = params?.bbox ? params.bbox.join(',') : '';
  const daysKey = params?.days ?? '';

  const url = useMemo(() => {
    const u = new URL('/api/analytics/timeseries', location.origin);
    if (bboxKey) u.searchParams.set('bbox', bboxKey);
    if (daysKey !== '') u.searchParams.set('days', String(daysKey));
    return u.toString();
  }, [bboxKey, daysKey]);

  useEffect(() => {
    let alive = true;
    setError(null);
    setData(null);
    setLoading(true); // det er ok at sætte her – vi ændrer state pga. param-ændring

    const run = async () => {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(await r.text());
        const json = (await r.json()) as InsightPoint[];
        if (!alive) return;
        setData(json);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Kunne ikke hente data');
        setLoading(false);
      }
    };

    // asynkront kick
    const t = setTimeout(() => {
      void run();
    }, 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [url]);

  return { data, loading, error };
}
