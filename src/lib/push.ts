// src/lib/push.ts
import webpush, { WebPushError, PushSubscription } from 'web-push';

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
};

let vapidReady = false;

function isValidSubject(s?: string | null) {
  if (!s) return false;
  return s.startsWith('mailto:') || s.startsWith('https://') || s.startsWith('http://');
}

/** Lazy init – kaldes først når vi faktisk skal sende */
function ensureVapidConfigured() {
  if (vapidReady) return;

  const pub = process.env.VAPID_PUBLIC_KEY || '';
  const priv = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || '';

  if (pub && priv && isValidSubject(subject)) {
    try {
      webpush.setVapidDetails(subject, pub, priv);
      vapidReady = true;
    } catch (e) {
      // Fejl fra web-push – gør IKKE builden rød
      console.warn('web-push VAPID init failed:', e instanceof Error ? e.message : e);
      vapidReady = false;
    }
  } else {
    // Ingen/ugyldige envs – lad os blot logge en advarsel
    const why = !pub || !priv ? 'missing keys' : 'invalid subject (use mailto: or https://)';
    console.warn('web-push not configured:', why);
    vapidReady = false;
  }
}

export async function sendPushToEndpoint(
  subscription: Pick<PushSubscription, 'endpoint' | 'keys'>,
  payload: PushPayload
): Promise<{ ok: true } | { ok: false; error: string | number }> {
  ensureVapidConfigured();
  if (!vapidReady) {
    return { ok: false, error: 'vapid-not-configured' };
  }

  const data = JSON.stringify(payload);
  try {
    await webpush.sendNotification(subscription as any, data);
    return { ok: true };
  } catch (err) {
    const e = err as WebPushError & { statusCode?: number; message?: string };
    return { ok: false, error: e?.statusCode ?? e?.message ?? 'unknown' };
  }
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || '';
}
