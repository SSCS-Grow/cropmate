import { createClient } from '@/lib/supabase/server';
import RunForm from '@/components/scout/RunForm';

type RunRow = {
  id: string;
  template_id: string;
  started_at: string|null;
  finished_at: string|null;
};

type TemplateRow = {
  id: string;
  name: string;
  description?: string|null;
  items: any[];
};

export default async function RunPage({ params }: { params: { id: string }}) {
  const supabase = createClient();

  const { data: run } = await supabase
    .from('scout_runs')
    .select('*')
    .eq('id', params.id)
    .single() as { data: RunRow | null };

  if (!run) return <div className="p-4">Runde findes ikke.</div>;

  const { data: template } = await supabase
    .from('scout_templates')
    .select('*')
    .eq('id', run.template_id)
    .single() as { data: TemplateRow | null };

  if (!template) return <div className="p-4">Skabelon mangler.</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Scouting-runde</h1>
      <RunForm template={template as any} runId={run.id} />
    </div>
  );
}
