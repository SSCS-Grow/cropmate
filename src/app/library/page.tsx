import { createClient } from '@/lib/supabase/server';


// Minimal type
type PestRow = {
id: string;
slug: string;
category: 'pest'|'disease';
name: string;
latin_name?: string|null;
updated_at?: string|null;
};


export default async function LibraryIndexPage({ searchParams }: { searchParams?: { q?: string }}) {
const supabase = createClient();
const q = (searchParams?.q ?? '').trim();


let query = (supabase as any)
.from('pests')
.select('id,slug,category,name,latin_name,updated_at')
.order('updated_at', { ascending: false });


if (q) {
query = query.ilike('name', `%${q}%`);
}


const { data, error } = await query;
if (error) {
return <div className="p-4">Fejl: {error.message}</div>;
}


const rows = (data ?? []) as PestRow[];


return (
<div className="max-w-4xl mx-auto p-4 space-y-4">
<h1 className="text-2xl font-bold">Bibliotek</h1>
<form className="flex gap-2">
<input name="q" defaultValue={q} placeholder="Søg navn…" className="p-2 rounded border flex-1" />
<button className="px-3 py-2 rounded-2xl border">Søg</button>
</form>
<div className="grid md:grid-cols-2 gap-3">
{rows.map(r => (
<a key={r.id} href={`/library/${r.slug}`} className="p-3 rounded-xl border bg-white block">
<div className="text-xs uppercase tracking-wide text-gray-500">{r.category}</div>
<div className="font-medium">{r.name}</div>
{r.latin_name && <div className="text-xs italic text-gray-600">{r.latin_name}</div>}
</a>
))}
</div>
</div>
);
}
