import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serverAdmin';

export const dynamic = 'force-dynamic';

async function fetchOpenMeteo(lat: number, lon: number) {
  // UTC så vores timestamper matcher
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`+
    `&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=UTC&past_hours=0&forecast_days=3`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const j = await res.json();
  const times: string[] = j.hourly?.time ?? [];
  const temp: number[] = j.hourly?.temperature_2m ?? [];
  const precip: number[] = j.hourly?.precipitation ?? [];
  const wind: number[] = j.hourly?.wind_speed_10m ?? [];
  const rows = times.map((ts, i) => ({
    ts: new Date(ts).toISOString(),
    temp_c: Number.isFinite(temp[i]) ? temp[i] : null,
    precip_mm: Number.isFinite(precip[i]) ? precip[i] : null,
    wind_ms: Number.isFinite(wind[i]) ? wind[i] / 3.6 : null, // km/h -> m/s
  }));
  return rows;
}

export async function GET() {
  const supabase = createServiceClient();

  // Hent haver med lat/lon
  const { data: gardens, error: gErr } = await (supabase as any)
    .from('gardens')
    .select('id, profile_id, name, lat, lon')
    .not('lat', 'is', null)
    .not('lon', 'is', null)
    .limit(200);

  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 400 });

  let upserts = 0;
  for (const g of gardens ?? []) {
    try {
      const hours = await fetchOpenMeteo(g.lat, g.lon);
      for (const h of hours) {
        const row = {
          profile_id: g.profile_id,
          garden_id: g.id,
          ts: h.ts,
          temp_c: h.temp_c,
          precip_mm: h.precip_mm,
          wind_ms: h.wind_ms,
          source: { provider: 'open-meteo' },
        };
        const { error: uErr } = await (supabase as any)
          .from('weather_hourly')
          .upsert(row, { onConflict: 'garden_id,ts' });
        if (!uErr) upserts++;
      }
    } catch (e: any) {
      // Fortsæt med de andre haver
      console.error('weather error', g.id, e?.message);
    }
  }

  return NextResponse.json({ ok: true, gardens: (gardens ?? []).length, upserts });
}