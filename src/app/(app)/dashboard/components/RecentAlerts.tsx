import { createClient } from '@/lib/supabase/server';


type RuleRow = { id: string; name: string; last_fired_at: string|null };


export default async function RecentAlerts() {
const supabase = await createClient();
const { data, error } = await (supabase as any)
.from('alert_rules')
.select('id, name, last_fired_at')
.not('last_fired_at', 'is', null)
.order('last_fired_at', { ascending: false })
.limit(10);


if (error) return <div className="p-3 rounded-xl border bg-white">Alerts: {error.message}</div>;
const rows = (data ?? []) as RuleRow[];


return (
<div className="p-3 rounded-xl border bg-white">
<div className="font-semibold mb-2">Seneste alerts</div>
<ul className="text-sm space-y-1">
{rows.length === 0 && <li className="text-gray-500">Ingen endnu.</li>}
{rows.map(r => (
<li key={r.id}>{r.name} – {r.last_fired_at}</li>
))}
</ul>
</div>
);
}