import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serverAdmin';
import { evaluateRule } from '@/lib/alerts/evaluateRule';
import { notifyUserPush } from '@/lib/push/notifyUser';

export const dynamic = 'force-dynamic';

type RuleRow = {
  id: string;
  name: string;
  is_enabled: boolean;
  last_fired_at: string | null;
  condition: any;
  profile_id: string | null;
};

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await (supabase as any)
    .from('alert_rules')
    .select('id,name,is_enabled,last_fired_at,condition,profile_id')
    .eq('is_enabled', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rules = (data ?? []) as RuleRow[];
  let fired = 0;

  for (const rule of rules) {
    const { triggered, reason } = await evaluateRule(rule as any);
    const last = rule.last_fired_at ? new Date(rule.last_fired_at) : null;
    const now = new Date();
    const diffH = last ? (now.getTime() - last.getTime()) / 36e5 : Infinity;

    if (triggered && diffH >= 3 && rule.profile_id) {
      const dedupKey = `rule:${rule.id}:${now.toISOString().slice(0, 13)}`;
      const notified = await notifyUserPush(
        rule.profile_id,
        {
          title: `Alert: ${rule.name}`,
          body: reason,
          url: '/dashboard?alert=rule',
          tag: 'rule',
        },
        { dedupKey, kind: `rule:${rule.id}` },
      );
      if (notified.ok) {
        await (supabase as any)
          .from('alert_rules')
          .update({ last_fired_at: now.toISOString() })
          .eq('id', rule.id);
        fired += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, checked: rules.length, fired });
}
