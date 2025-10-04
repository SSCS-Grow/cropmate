import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.WEB_PUSH_SUBJECT!,
  process.env.WEB_PUSH_PUBLIC_KEY!,
  process.env.WEB_PUSH_PRIVATE_KEY!
);

export async function sendPush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}, payload: any) {
  try {
    await webpush.sendNotification(subscription as any, JSON.stringify(payload));
    return { ok: true };
  } catch (err: any) {
    // Returner fejl til kalder (så vi kan slette døde subs)
    return { ok: false, error: err?.message || 'push failed' };
  }
}
