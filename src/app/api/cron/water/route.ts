import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendPushToEndpoint } from '@/lib/push';
import { OPEN_METEO, safeFetchJSON } from '@/lib/weather';

export const runtime = 'nodejs';

type DailyResp = { daily?: { precipitation_sum?: number[] } };
type PrefRow = {
  user_id: string;
  water_enabled: boolean;
  water_dry_days: number;
  locale: 'da' | 'en';
};
type Garden = { user_id: string; lat: number; lon: number; name?: string };
type SubRow = { endpoint: string; p256dh: string; auth: string };

async function fetchDryStreak(
  lat: number,
  lon: number,
  neededDays: number,
): Promise<boolean> {
  const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&past_days=${neededDays}&forecast_days=0`;
  const { data, error } = await safeFetchJSON<DailyResp>(url);
  if (error) throw new Error(`weather fetch failed: ${error}`);
  const arr = data?.daily?.precipitation_sum ?? [];
  const threshold = 0.2;
  if (arr.length < neededDays) return false;
  const lastN = arr.slice(-neededDays);
  return lastN.every((v) => (v ?? 0) <= threshold);
}

export async function GET() {
  const supabase = createAdminClient();

  const debug: Record<string, unknown> = {};
  try {
    const { data: prefs, error: prefsErr } = await supabase
      .from('alert_prefs')
      .select('user_id, water_enabled, water_dry_days, locale')
      .eq('water_enabled', true);
    if (prefsErr) throw new Error(`prefs: ${prefsErr.message}`);
    const prefRows = (prefs ?? []) as PrefRow[];
    debug.prefsCount = prefRows.length;
    if (!prefRows.length)
      return NextResponse.json({ ok: true, sent: 0, reason: 'no prefs' });

    const { data: gardens, error: gardensErr } = await supabase
      .from('gardens') // skift hvis jeres tabel hedder noget andet
      .select('user_id, lat, lon, name');
    if (gardensErr) throw new Error(`gardens: ${gardensErr.message}`);
    const gardenRows = (gardens ?? []) as Garden[];
    debug.gardensCount = gardenRows.length;

    const byUser = new Map<string, Garden>();
    for (const g of gardenRows)
      if (!byUser.has(g.user_id)) byUser.set(g.user_id, g);

    const todayKey = new Date().toISOString().slice(0, 10);
    let sent = 0;
    const skipped: string[] = [];

    for (const p of prefRows) {
      const loc = byUser.get(p.user_id);
      if (!loc) {
        skipped.push(`${p.user_id}:no-location`);
        continue;
      }

      const dry = await fetchDryStreak(loc.lat, loc.lon, p.water_dry_days || 3);
      if (!dry) {
        skipped.push(`${p.user_id}:not-dry`);
        continue;
      }

      const dedup_key = `water:${todayKey}`;
      const { error: dupErr } = await supabase.from('notification_log').insert({
        user_id: p.user_id,
        kind: 'water',
        dedup_key,
      });
      if (dupErr) {
        skipped.push(`${p.user_id}:dedup`);
        continue;
      }

      const { data: subs, error: subsErr } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', p.user_id);
      if (subsErr) {
        skipped.push(`${p.user_id}:subsErr`);
        continue;
      }
      const subRows = (subs ?? []) as SubRow[];
      if (!subRows.length) {
        skipped.push(`${p.user_id}:no-subs`);
        continue;
      }

      const title =
        p.locale === 'en' ? 'Watering reminder' : 'Vandingspåmindelse';
      const body =
        p.locale === 'en'
          ? `No rain for ${p.water_dry_days} days. Time to water your plants.`
          : `Ingen regn i ${p.water_dry_days} dage. Tid til at vande.`;

      for (const s of subRows) {
        try {
          await sendPushToEndpoint(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            { title, body, url: '/dashboard?alert=frost', tag: 'frost' },
          );
          sent++; // kom hertil = succes (2xx)
        } catch (err: any) {
          const code = err?.statusCode ?? err?.status ?? 0;
          // 404/410 = endpoint findes ikke længere -> slet subscription
          if (code === 404 || code === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', s.endpoint);
          } else {
            // andre fejl: log og fortsæt
            console.info('Push notification failed:', err);
          }
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
