import { createClient } from '@/lib/supabase/server';


type RunRow = { id: string; planned_for: string|null; scout_templates?: { name: string } };


export default async function UpcomingRuns() {
const supabase = await createClient();
const today = new Date();
const week = new Date(today.getTime() + 7 * 24 * 3600_000);


const { data, error } = await (supabase as any)
.from('scout_runs')
.select('id, planned_for, scout_templates(name)')
.gte('planned_for', today.toISOString().slice(0,10))
.lte('planned_for', week.toISOString().slice(0,10))
.order('planned_for', { ascending: true })
.limit(5);


if (error) return <div className="p-3 rounded-xl border bg-white">Planlagte runder: {error.message}</div>;
const rows = (data ?? []) as RunRow[];


return (
<div className="p-3 rounded-xl border bg-white">
<div className="font-semibold mb-2">Kommende runder (7 dage)</div>
<ul className="text-sm space-y-1">
{rows.length === 0 && <li className="text-gray-500">Ingen planlagt.</li>}
{rows.map(r => (
<li key={r.id}>{r.scout_templates?.name ?? 'Runde'} – {r.planned_for ?? '—'}</li>
))}
</ul>
</div>
);
}