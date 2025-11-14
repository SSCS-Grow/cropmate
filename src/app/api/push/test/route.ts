import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serverAdmin';
import { sendPush } from '@/lib/push/send';

type SubscriptionRow = { endpoint: string; p256dh: string; auth: string };

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await (supabase as any)
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth')
    .limit(25);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const subs = (data ?? []) as SubscriptionRow[];

  let sent = 0;
  for (const s of subs) {
    try {
      await sendPush({ title: 'CropMate test', body: s.endpoint.slice(0, 32) + '…' }, s);
      sent++;
    } catch {
      // Ignorer fejl for enkelt-subscriptions
    }
  }

  return NextResponse.json({ ok: true, sent });
}
