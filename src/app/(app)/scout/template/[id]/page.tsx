import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type TemplateRow = { id: string; name: string; description?: string|null; items: any[] };

export default async function TemplatePage({ params }: { params: { id: string }}) {
  const supabase = await createClient();
  const { data: template } = await supabase
    .from('scout_templates')
    .select('*')
    .eq('id', params.id)
    .single() as { data: TemplateRow | null };

  if (!template) return <div className="p-4">Skabelon findes ikke.</div>;

  async function createRun() {
    'use server';
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('scout_runs')
      .insert({ template_id: params.id } as any)
      .select('*')
      .single();
    if (error || !data) return;
    redirect(`/scout/run/${(data as any).id}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{template.name}</h1>
      <div className="text-gray-600">{template.description}</div>
      <div className="p-3 rounded-xl border bg-white">
        <div className="font-medium mb-2">Punkter</div>
        <ul className="list-disc ml-6 text-sm">
          {(template.items ?? []).map((it: any) => (
            <li key={it.key}>{it.label} <span className="text-gray-500">({it.type})</span></li>
          ))}
        </ul>
      </div>
      <form action={createRun}>
        <button className="px-4 py-2 rounded-2xl bg-black text-white">Start runde</button>
      </form>
      <Link href="/scout" className="underline text-sm">Tilbage</Link>
    </div>
  );
}
