// Update the import path to the correct location of your Supabase client utility
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function run(endpoint: string) {
  'use server';
  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    return await res.text();
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

type LogRow = { created_at: string; kind: string };

export default async function CronAdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) redirect('/');

  const { data: logs } = await supabase
    .from('notification_log')
    .select('created_at, kind')
    .order('created_at', { ascending: false })
    .limit(20);

  const frostEndpoint = '/api/cron/frost';
  const waterEndpoint = '/api/cron/water';
  const healthEndpoint = '/api/cron/health';

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Cron Debug</h1>

      <form action={async () => { await run(healthEndpoint); }} className="flex items-center gap-2">
        <span className="font-medium">Health</span>
        <button className="px-3 py-2 rounded bg-slate-800 text-white">Kør</button>
        <code className="text-sm">{healthEndpoint}</code>
      </form>

      <form action={async () => { await run(frostEndpoint); }} className="flex items-center gap-2">
        <span className="font-medium">Frost</span>
        <button className="px-3 py-2 rounded bg-emerald-600 text-white">Kør nu</button>
        <code className="text-sm">{frostEndpoint}</code>
      </form>

      <form action={async () => { await run(waterEndpoint); }} className="flex items-center gap-2">
        <span className="font-medium">Vanding</span>
        <button className="px-3 py-2 rounded bg-emerald-600 text-white">Kør nu</button>
        <code className="text-sm">{waterEndpoint}</code>
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-2">Seneste notification_log</h2>
        <div className="rounded border divide-y">
          {(logs as LogRow[] | null)?.map((l, i) => (
            <div key={i} className="p-2 text-sm flex justify-between">
              <span>{new Date(l.created_at).toLocaleString()}</span>
              <span className="font-mono">{l.kind}</span>
            </div>
          )) || <div className="p-3 text-sm text-slate-500">Ingen logs endnu.</div>}
        </div>
      </div>
    </div>
  );
}
