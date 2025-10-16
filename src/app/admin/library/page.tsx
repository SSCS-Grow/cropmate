import { supabaseServer } from '@/lib/supabase/server';


// samme minimal type
type PestRow = {
id: string;
slug: string;
category: 'pest'|'disease';
name: string;
latin_name?: string|null;
updated_at?: string|null;
};


export default async function AdminLibrary() {
const supabase = await supabaseServer();
const { data, error } = await (supabase as any)
.from('pests')
.select('id,slug,category,name,latin_name,updated_at')
.order('updated_at', { ascending: false });


if (error) return <div className="p-4">Fejl: {error.message}</div>;
const rows = (data ?? []) as PestRow[];


return (
<div className="max-w-5xl mx-auto p-4 space-y-4">
<div className="flex items-center justify-between">
<h1 className="text-2xl font-bold">Admin · Library</h1>
<a href="/admin/library/create" className="px-3 py-2 rounded-2xl bg-black text-white">+ Ny post</a>
</div>


<div className="grid md:grid-cols-2 gap-3">
{rows.map(r => (
<div key={r.id} className="p-3 rounded-xl border bg-white">
<div className="text-xs uppercase tracking-wide text-gray-500">{r.category}</div>
<div className="font-medium">{r.name}</div>
{r.latin_name && <div className="text-xs italic text-gray-600">{r.latin_name}</div>}
<div className="mt-2 flex gap-2 text-sm">
{r.category === 'pest' ? (
<a className="underline" href={`/admin/library/pests/${r.id}/edit`}>Redigér</a>
) : (
<a className="underline" href={`/admin/library/diseases/${r.id}/edit`}>Redigér</a>
)}
<a className="underline" href={`/library/${r.slug}`}>Vis</a>
</div>
</div>
))}
</div>
</div>
);
}