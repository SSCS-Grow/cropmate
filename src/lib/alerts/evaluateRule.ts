import type { AlertRule } from '@/lib/types/alert';
import { createServiceClient } from '@/lib/supabase/serverAdmin';

export async function evaluateRule(rule: AlertRule): Promise<{ triggered: boolean; reason: string }> {
  const c: any = (rule as any).condition as any;

  if (!c || c.kind !== 'weather') {
    return { triggered: false, reason: 'unsupported condition' };
  }

  const supabase = createServiceClient();
  const windowHours = Number(c.windowHours ?? 6);
  const now = new Date();
  const until = new Date(now.getTime() + windowHours * 3600_000);

  let q = (supabase as any)
    .from('weather_hourly')
    .select('ts,temp_c,precip_mm,wind_ms')
    .gte('ts', now.toISOString())
    .lte('ts', until.toISOString())
    .order('ts', { ascending: true })
    .limit(500);

  // 👇 garden-scope hvis angivet
  if ((rule as any).garden_id) q = q.eq('garden_id', (rule as any).garden_id);

  const { data, error } = await q;
  if (error) return { triggered: false, reason: `weather query error: ${error.message}` };

  const rows = (data ?? []) as Array<{ ts: string; temp_c: number|null; precip_mm: number|null; wind_ms: number|null }>; 

  const metrics = {
    temp: rows.map(r => r.temp_c).filter(x => x !== null) as number[],
    rain: rows.map(r => r.precip_mm).filter(x => x !== null) as number[],
    wind: rows.map(r => r.wind_ms).filter(x => x !== null) as number[],
  } as const;

  function agg(metric: 'temp'|'rain'|'wind') {
    const arr = metrics[metric];
    if (arr.length === 0) return null;
    if (metric === 'rain') return arr.reduce((a,b)=>a+b, 0); // sum
    if (metric === 'temp') return Math.min(...arr); // min
    if (metric === 'wind') return Math.max(...arr); // max
    return null;
  }

  const A = agg(c.metric);
  if (A === null) return { triggered: false, reason: `no data for ${c.metric} in next ${windowHours}h` };
  const B = Number(c.value);

  let ok = false;
  switch (c.op) {
    case '>': ok = A > B; break;
    case '<': ok = A < B; break;
    case '≥':
    case '>=': ok = A >= B; break;
    case '≤':
    case '<=': ok = A <= B; break;
    case '=': ok = A === B; break;
  }

  return { triggered: ok, reason: `weather:${c.metric} ${c.op} ${B} (agg=${A}, window=${windowHours}h, garden=${(rule as any).garden_id ?? 'all'})` };
}