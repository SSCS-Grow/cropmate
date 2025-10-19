import TemplateBuilder from '@/components/scout/TemplateBuilder';
import { createClient } from '@/lib/supabase/server';

type TemplateRow = { id: string; name: string; items: any[] };
type RunRow = { id: string; started_at: string|null; finished_at: string|null; scout_templates?: { name: string } };

export default async function ScoutHome() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from('scout_templates')
    .select('*')
    .order('created_at', { ascending: false }) as { data: TemplateRow[] | null };

  const { data: runs } = await supabase
    .from('scout_runs')
    .select('*, scout_templates(name)')
    .order('created_at', { ascending: false }) as { data: RunRow[] | null };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Scouting</h1>
      <TemplateBuilder />

      <div>
        <h2 className="text-lg font-semibold mb-2">Skabeloner</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {(templates ?? []).map((t: TemplateRow) => (
            <a key={t.id} href={`/scout/template/${t.id}`} className="p-3 rounded-xl border bg-white block">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-500">{(t.items?.length ?? 0)} punkter</div>
            </a>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Seneste runder</h2>
        <div className="space-y-2">
          {(runs ?? []).map((r: RunRow) => (
            <div key={r.id} className="p-3 rounded-xl border bg-white">
              <div className="font-medium">{r.scout_templates?.name ?? 'Runde'}</div>
              <div className="text-xs text-gray-500">Start: {r.started_at ?? '—'} · Slut: {r.finished_at ?? '—'}</div>
              <a href={`/scout/run/${r.id}`} className="text-sm underline">Åbn runde</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
