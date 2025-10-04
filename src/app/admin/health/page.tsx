// app/admin/health/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

type Check = { name: string; ok: boolean; info?: string };

async function requireAdmin() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth');
  const { data: profile } = await sb.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) redirect('/');
  return sb;
}

async function runChecks() {
  const checks: Check[] = [];

  // ENV
  checks.push({
    name: 'ENV: NEXT_PUBLIC_SUPABASE_URL',
    ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    info: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
  });
  checks.push({
    name: 'ENV: NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ok: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    info: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
  });

  const sb = createClient();

  // DB ping
  {
    const { error } = await sb.from('profiles').select('id').limit(1);
    checks.push({ name: 'DB: connection', ok: !error, info: error?.message });
  }

  // Pests public read (policy)
  {
    const { data, error } = await sb.from('pests').select('id,is_published').eq('is_published', true).limit(1);
    checks.push({ name: 'RLS: pests public read', ok: !error, info: error?.message ?? (data?.length ? 'ok' : 'no published rows (ok)') });
  }

  // hazard_reports.pest_id kolonne findes?
  {
    // billig test: forsøg at selecte feltet
    const { error } = await sb.from('hazard_reports').select('id,pest_id').limit(1);
    checks.push({ name: 'DB: hazard_reports.pest_id exists', ok: !error, info: error?.message });
  }

  // Storage buckets
  // (Supabase JS kan ikke liste buckets med anon; vi tester upload-path konvention i pests_images i stedet)
  {
    const { error } = await sb.from('pest_images').select('id,path').limit(1);
    checks.push({ name: 'Storage: pest-images referenced', ok: !error, info: error?.message ?? 'ok (at least table exists)' });
  }

  // App routes basic
  // Vi laver bare HEAD-requests via fetch (samme origin)
  async function headOk(path: string) {
    try {
      const res = await fetch(path, { method: 'HEAD', cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  }
  const routes = ['/dashboard', '/crops'];
  for (const r of routes) {
    const ok = await headOk(r);
    checks.push({ name: `Route: ${r}`, ok, info: ok ? '200' : 'not ok' });
  }

  return checks;
}

export default async function HealthPage() {
  await requireAdmin();
  const checks = await runChecks();
  const okCount = checks.filter(c => c.ok).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">Sundhedstjek</h1>
      <p className="mb-6 opacity-70">{okCount}/{checks.length} checks ok</p>
      <div className="grid gap-2">
        {checks.map((c, i) => (
          <div key={i} className={`rounded-xl border p-3 ${c.ok ? 'border-green-400' : 'border-red-400'}`}>
            <div className="font-medium">{c.name}</div>
            <div className={`text-sm ${c.ok ? 'text-green-600' : 'text-red-600'}`}>{c.ok ? 'OK' : 'FAIL'} {c.info ? `— ${c.info}` : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
