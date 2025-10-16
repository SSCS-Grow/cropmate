import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@example.com';

// Init én gang
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export type PushSubscriptionLike = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendPush(payload: { title: string; body?: string; data?: any }, sub?: PushSubscriptionLike) {
  // Behold kompatibilitet: hvis ingen subscription er givet, gør ingenting
  if (!sub) {
    console.warn('sendPush kaldt uden subscription – ingen afsendelse');
    return { ok: false };
  }

  const subscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  } as any;

  const json = JSON.stringify({ title: payload.title, body: payload.body, data: payload.data });
  await webpush.sendNotification(subscription, json);
  return { ok: true };
}