// src/lib/push.ts
// Node-only: bruges af cron-/API routes (runtime = 'nodejs')
import webpush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (!publicKey || !privateKey) {
  console.warn("[push] Missing VAPID keys. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY");
}

webpush.setVapidDetails(subject, publicKey, privateKey);

export type PushKeys = { p256dh: string; auth: string };
export type PushSubscriptionLike = { endpoint: string; keys: PushKeys };

export async function sendPush(
  subscription: PushSubscriptionLike,
  payload: Record<string, any>
) {
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}

// Overloads så cron kan kalde enten (endpoint, keys, payload)
// eller (subscriptionObj, payload)
export function sendPushToEndpoint(
  endpoint: string,
  keys: PushKeys,
  payload: Record<string, any>
): Promise<webpush.SendResult>;
export function sendPushToEndpoint(
  subscription: PushSubscriptionLike,
  payload: Record<string, any>
): Promise<webpush.SendResult>;
export function sendPushToEndpoint(
  a: string,
  b: PushKeys,
  c: Record<string, any>
): Promise<webpush.SendResult>;
export function sendPushToEndpoint(
  a: PushSubscriptionLike,
  b: Record<string, any>
): Promise<webpush.SendResult>;
export async function sendPushToEndpoint(
  a: string | PushSubscriptionLike,
  b: PushKeys | Record<string, any>,
  c?: Record<string, any>
): Promise<webpush.SendResult> {
  const subscription: PushSubscriptionLike =
    typeof a === "string"
      ? { endpoint: a, keys: b as PushKeys }
      : (a as PushSubscriptionLike);

  const payload = (typeof a === "string" ? c : b) as Record<string, any>;

  return webpush.sendNotification(subscription, JSON.stringify(payload));
}
