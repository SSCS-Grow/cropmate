import { redirect } from 'next/navigation';
// Update the import path if your supabase client is at src/lib/supabase/server.ts
// If 'createClient' is the default export:
// If your supabase client exports 'createClient' as a named export:
import { createClient } from '../../../lib/supabase/server';
// Or, if the export is named differently, e.g. 'supabaseClient':
// import { supabaseClient as createClient } from '../../../lib/supabase/server';
// Update the import path below to the correct relative path if HealthClient exists elsewhere, for example:
import HealthClient from '../../../components/HealthClient';
// If HealthClient is in a different location, adjust the path accordingly.

type Check = { name: string; ok: boolean; info?: string };

async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth');
  const { data: profile } = await sb.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) redirect('/');
  return sb;
}

async function headOk(path: string) {
  try {
    const res = await fetch(path, { method: 'HEAD', cache: 'no-store' });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function runChecks() {
  const checks: Check[] = [];
  const sb = await createClient();

  // ENV
  checks.push({ name: 'ENV: NEXT_PUBLIC_SUPABASE_URL', ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL, info: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing' });
  checks.push({ name: 'ENV: NEXT_PUBLIC_SUPABASE_ANON_KEY', ok: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, info: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing' });

  // DB
  {
    const { error } = await sb.from('profiles').select('id').limit(1);
    checks.push({ name: 'DB: connection', ok: !error, info: error?.message });
  }
  {
    const { error } = await sb.from('pests').select('id').limit(1);
    checks.push({ name: 'DB: pests table', ok: !error, info: error?.message });
  }
  {
    const { error } = await sb.from('hazard_reports').select('id,pest_id').limit(1);
    checks.push({ name: 'DB: hazard_reports.pest_id', ok: !error, info: error?.message });
  }
  {
    const { error } = await sb.from('pest_images').select('id,path').limit(1);
    checks.push({ name: 'Storage: pest-images referenced', ok: !error, info: error?.message ?? 'ok' });
  }

  // PWA assets
  for (const path of ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png', '/sw.js']) {
    const r = await headOk(path);
    checks.push({ name: `PWA asset: ${path}`, ok: r.ok, info: r.ok ? String(r.status) : 'missing' });
  }

  // i18n route prefixes
  for (const path of ['/da', '/en']) {
    const r = await headOk(path);
    checks.push({ name: `i18n route prefix present: ${path}`, ok: r.ok, info: String(r.status) });
  }

  // App routes (tilpas til dine faktiske sider)
  for (const rPath of ['/da/dashboard', '/da/crops', '/en/dashboard']) {
    const r = await headOk(rPath);
    checks.push({ name: `Route: ${rPath}`, ok: r.ok, info: String(r.status) });
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
      <p className="mb-6 opacity-70">{okCount}/{checks.length} server-checks ok</p>

      <div className="grid gap-2 mb-8">
        {checks.map((c, i) => (
          <div key={i} className={`rounded-xl border p-3 ${c.ok ? 'border-green-400' : 'border-red-400'}`}>
            <div className="font-medium">{c.name}</div>
            <div className={`text-sm ${c.ok ? 'text-green-600' : 'text-red-600'}`}>{c.ok ? 'OK' : 'FAIL'} {c.info ? `— ${c.info}` : ''}</div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-2">Klient-checks (PWA & i18n runtime)</h2>
      <p className="mb-4 opacity-70">Disse kører i browseren og viser runtime-status (SW, notifikationer, display-mode, lang).</p>
      <HealthClient />
    </div>
  );
}
