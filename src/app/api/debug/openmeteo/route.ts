import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  const base = process.env.WEATHER_BASE || 'https://api.open-meteo.com/v1/forecast';
  const url = `${base}?latitude=55.6761&longitude=12.5683&hourly=temperature_2m&forecast_days=1`;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    const sample = (await r.text()).slice(0, 200);
    return NextResponse.json({ ok: r.ok, status: r.status, url, sample });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, url, error: msg }, { status: 500 });
  }
}
