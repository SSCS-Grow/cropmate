import { NextResponse } from 'next/server';
import { createActionClient } from '@/lib/supabase/server';
import { sendPush } from '@/lib/push/send';
import { SupabaseClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createActionClient();

  // 1) Beregn frost-risiko (du har allerede logik)
  const alerts = await computeFrostAlerts(supabase); // <- dine eksisterende data

  // 2) Find brugere der skal have besked
  for (const alert of alerts) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint,p256dh,auth')
      .eq('user_id', alert.user_id);

    for (const s of subs ?? []) {
      const res = await sendPush(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        {
          title: 'Frostrisiko i nat',
          body: `${alert.city}: minimum ${alert.minTemp}°C`,
          url: '/dashboard' // eller detalje-side
        }
      );
      if (!res.ok && /410|404/.test(res.error || '')) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      }
    }
  }

  return NextResponse.json({ ok: true, sent: alerts.length });
}

async function computeFrostAlerts(supabase: SupabaseClient<any, "public", "public", any, any>) {
  // Example: fetch user locations and weather forecast, return alerts for frost risk
  const { data: users } = await supabase
    .from('users')
    .select('id,city,location');

  if (!users) return [];

  const alerts = [];

  for (const user of users) {
    // Example: fetch weather forecast for user's location
    const { data: forecast } = await supabase
      .from('weather_forecasts')
      .select('min_temp')
      .eq('city', user.city)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (forecast && forecast.min_temp <= 0) {
      alerts.push({
        user_id: user.id,
        city: user.city,
        minTemp: forecast.min_temp
      });
    }
  }

  return alerts;
}