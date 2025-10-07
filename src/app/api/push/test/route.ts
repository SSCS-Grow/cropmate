import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendPushToEndpoint, getVapidPublicKey } from '@/lib/push';

export const runtime = 'nodejs';

type SubRow = { endpoint: string; p256dh: string; auth: string };

function isValidSubject(s?: string | null) {
  if (!s) return false;
  return s.startsWith('mailto:') || s.startsWith('https://') || s.startsWith('http://');
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'ping';

  // VAPID status (læses kun fra env – ingen init ved import)
  const vapid = {
    hasPublic: Boolean(process.env.VAPID_PUBLIC_KEY),
    hasPrivate: Boolean(process.env.VAPID_PRIVATE_KEY),
    subject: process.env.VAPID_SUBJECT || '',
    subjectValid: isValidSubject(process.env.VAPID_SUBJECT || '')
  };
  const vapidConfigured = vapid.hasPublic && vapid.hasPrivate && vapid.subjectValid;

  if (mode === 'ping') {
    return NextResponse.json({
      ok: true,
      mode,
      vapidConfigured,
      vapidPublicKeySet: getVapidPublicKey() !== '',
      hint:
        vapidConfigured
          ? 'VAPID ser fin ud. Brug mode=send for at prøve en rigtig push.'
          : 'Sæt VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY og VAPID_SUBJECT=mailto:you@example.com'
    });
  }

  if (mode === 'send') {
    const supabase = await createClient();

    // kræver login (vi sender til brugerens egne subscriptions)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // find første subscription
    const { data: subs, error: subsErr } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user.id)
      .limit(1);
    if (subsErr) {
      return NextResponse.json({ error: `subs: ${subsErr.message}` }, { status: 500 });
    }
    const sub = (subs?.[0] ?? null) as SubRow | null;
    if (!sub) {
      return NextResponse.json({
        error: 'no-subscription',
        hint: 'Registrér en push subscription i browseren først.'
      }, { status: 400 });
    }

    // send test-push
    const result = await sendPushToEndpoint(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      {
        title: 'CropMate – test push',
        body: 'Det virker! 🎉 (via /api/push/test?mode=send)',
        url: '/dashboard',
        tag: 'test'
      }
    );

    // sendPushToEndpoint returnerer { ok:true } eller { ok:false, error:'...' }
    return NextResponse.json({ mode, vapidConfigured, result });
  }

  // fallback for ukendt mode
  return NextResponse.json({
    error: 'bad-request',
    hint: 'Brug ?mode=ping eller ?mode=send'
  }, { status: 400 });
}
