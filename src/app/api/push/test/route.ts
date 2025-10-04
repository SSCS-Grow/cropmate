import { NextResponse } from 'next/server';
import { createActionClient } from '@/lib/supabase/server';
import { sendPush } from '@/lib/push/send';

export async function POST() {
  const supabase = createActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth')
    .eq('user_id', user.id)
    .limit(10);

  if (!subs || subs.length === 0) return NextResponse.json({ error: 'no subscriptions' }, { status: 404 });

  const results = [];
  for (const s of subs) {
    const res = await sendPush(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      { title: 'CropMate test', body: 'Push virker ✅', url: '/' }
    );
    results.push({ endpoint: s.endpoint, ...res });
    if (!res.ok && /410|404/.test(res.error || '')) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
    }
  }

  return NextResponse.json({ ok: true, results });
}
