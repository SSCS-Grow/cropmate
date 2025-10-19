import { createClient } from '@/lib/supabase/server';


type RunRow = { id: string; finished_at: string|null; created_at?: string; scout_templates?: { name: string } };


export default async function LatestScout() {
const supabase = await createClient();
const { data, error } = await (supabase as any)
.from('scout_runs')
.select('id, finished_at, created_at, scout_templates(name)')
.order('finished_at', { ascending: false })
.limit(5);


if (error) return <div className="p-3 rounded-xl border bg-white">Scouting: {error.message}</div>;
const rows = (data ?? []) as RunRow[];


return (
<div className="p-3 rounded-xl border bg-white">
<div className="font-semibold mb-2">Seneste scouting</div>
<ul className="text-sm space-y-1">
{rows.length === 0 && <li className="text-gray-500">Ingen endnu.</li>}
{rows.map(r => (
<li key={r.id}>
{r.scout_templates?.name ?? 'Runde'} – {r.finished_at ?? 'ikke afsluttet'}
</li>
))}
</ul>
</div>
);
}