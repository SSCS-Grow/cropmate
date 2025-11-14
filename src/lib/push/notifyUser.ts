import { createServiceClient } from '@/lib/supabase/serverAdmin';
import { sendPushToEndpoint } from '@/lib/push';

type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
};

type NotifyOptions = {
  dedupKey?: string;
  kind?: string;
};

type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function notifyUserPush(
  userId: string,
  payload: PushPayload,
  options?: NotifyOptions,
) {
  const supabase = createServiceClient() as any;

  if (options?.dedupKey) {
    const { error: dedupErr } = await supabase.from('notification_log').insert({
      user_id: userId,
      dedup_key: options.dedupKey,
      kind: options.kind || payload.tag || 'push',
    });

    if (dedupErr) {
      return { ok: false, reason: 'dedup', error: dedupErr };
    }
  }

  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth')
    .eq('user_id', userId);

  if (subsErr) {
    return { ok: false, reason: 'subsErr', error: subsErr };
  }

  const rows = (subs ?? []) as SubscriptionRow[];
  if (!rows.length) {
    return { ok: false, reason: 'no-subs' };
  }

  let sent = 0;
  for (const sub of rows) {
    try {
      await sendPushToEndpoint(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        { ...payload },
      );
      sent += 1;
    } catch (err: any) {
      const code = err?.statusCode ?? err?.status ?? 0;
      if (code === 404 || code === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      } else {
        console.info('[push] send error', code, err?.body || err?.message || err);
      }
    }
  }

  return { ok: sent > 0, sent };
}
