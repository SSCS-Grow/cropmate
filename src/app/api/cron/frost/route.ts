import { NextResponse } from 'next/server';
// Update the import path to the correct location of your Supabase client utility
import { createAdminClient } from '@/utils/supabase/admin';
import { sendPushToEndpoint } from '@/lib/push';
import { OPEN_METEO, safeFetchJSON } from '@/lib/weather';

export const runtime = 'nodejs';

type HourlyResp = { hourly?: { temperature_2m?: number[] } };
type PrefRow = { user_id: string; frost_enabled: boolean; frost_threshold_c: number; locale: 'da' | 'en' };
type Garden = { user_id: string; lat: number; lon: number; name?: string };
type SubRow = { endpoint: string; p256dh: string; auth: string };

async function fetchMinTemp(lat: number, lon: number): Promise<number> {
  const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&forecast_days=2`;
  const { data, error } = await safeFetchJSON<HourlyResp>(url);
  if (error) throw new Error(`weather fetch failed: ${error}`);
  const temps = data?.hourly?.temperature_2m ?? [];
  const min = Math.min(...temps);
  return Number.isFinite(min) ? min : 99;
}

export async function GET() {
  const supabase = createAdminClient();

  const debug: Record<string, unknown> = {};
  try {
    const { data: prefs, error: prefsErr } = await supabase
      .from('alert_prefs')
      .select('user_id, frost_enabled, frost_threshold_c, locale')
      .eq('frost_enabled', true);
    if (prefsErr) throw new Error(`prefs: ${prefsErr.message}`);
    const prefRows = (prefs ?? []) as PrefRow[];
    debug.prefsCount = prefRows.length;
    if (!prefRows.length) return NextResponse.json({ ok: true, sent: 0, reason: 'no prefs' });

    const { data: gardens, error: gardensErr } = await supabase
      .from('gardens') // skift hvis jeres tabel hedder noget andet
      .select('user_id, lat, lon, name');
    if (gardensErr) throw new Error(`gardens: ${gardensErr.message}`);
    const gardenRows = (gardens ?? []) as Garden[];
    debug.gardensCount = gardenRows.length;

    const byUser = new Map<string, Garden>();
    for (const g of gardenRows) if (!byUser.has(g.user_id)) byUser.set(g.user_id, g);

    const todayKey = new Date().toISOString().slice(0, 10);
    let sent = 0;
    const skipped: string[] = [];

    for (const p of prefRows) {
      const loc = byUser.get(p.user_id);
      if (!loc) { skipped.push(`${p.user_id}:no-location`); continue; }

      const minTemp = await fetchMinTemp(loc.lat, loc.lon);
      if (minTemp > p.frost_threshold_c) { skipped.push(`${p.user_id}:above-threshold`); continue; }

      const dedup_key = `frost:${todayKey}`;
      const { error: dupErr } = await supabase.from('notification_log').insert({
        user_id: p.user_id, kind: 'frost', dedup_key
      });
      if (dupErr) { skipped.push(`${p.user_id}:dedup`); continue; }

      const { data: subs, error: subsErr } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', p.user_id);
      if (subsErr) { skipped.push(`${p.user_id}:subsErr`); continue; }
      const subRows = (subs ?? []) as SubRow[];
      if (!subRows.length) { skipped.push(`${p.user_id}:no-subs`); continue; }

      const title = p.locale === 'en' ? 'Frost alert' : 'Frostvarsel';
      const body =
        p.locale === 'en'
          ? `Minimum temperature next 48h: ${minTemp}°C. Protect sensitive plants.`
          : `Min. temperatur næste 48t: ${minTemp}°C. Beskyt sarte planter.`;

      for (const s of subRows) {
        const res = await sendPushToEndpoint(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          { title, body, url: '/dashboard?alert=frost', tag: 'frost' }
        );
        if (!res.ok) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        } else {
          sent++;
        }
      }
    }

    return NextResponse.json({ ok: true, sent, skipped, debug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    debug.error = msg;
    return NextResponse.json({ error: msg, debug }, { status: 500 });
  }
}
