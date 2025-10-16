'use client';
import { useEffect, useState } from 'react';


type PestRow = {
id: string; slug: string; category: 'pest'|'disease'; name: string;
latin_name?: string|null; description?: string|null; host_plants?: string[]; severity?: number;
};


export default function AdminEditPest({ params }: { params: { id: string } }) {
const [row, setRow] = useState<PestRow | null>(null);
const [msg, setMsg] = useState<string|undefined>();
const [saving, setSaving] = useState(false);


useEffect(() => {
(async () => {
const res = await fetch(`/api/library/${params.id}`);
const json = await res.json();
setRow(json as PestRow);
})();
}, [params.id]);


async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
e.preventDefault(); if (!row) return;
setSaving(true); setMsg(undefined);
const fd = new FormData(e.currentTarget);
const patch = {
slug: String(fd.get('slug')||'').trim(),
name: String(fd.get('name')||'').trim(),
latin_name: String(fd.get('latin_name')||'') || null,
description: String(fd.get('description')||'') || null,
host_plants: String(fd.get('host_plants')||'').split(',').map(s=>s.trim()).filter(Boolean),
severity: Number(fd.get('severity')||0),
};
const res = await fetch(`/api/library/${params.id}`, { method: 'PUT', body: JSON.stringify(patch) });
const json = await res.json();
setSaving(false);
if (!res.ok) setMsg(json.error || 'Fejl ved opdatering'); else setMsg('Opdateret ✅');
}


if (!row) return <div className="p-4">Henter…</div>;


return (
<div className="max-w-3xl mx-auto p-4 space-y-4">
<h1 className="text-2xl font-bold">Redigér (pest)</h1>
<form onSubmit={onSubmit} className="space-y-3">
<div className="grid md:grid-cols-2 gap-3">
<input name="slug" defaultValue={row.slug} className="p-2 rounded border" required />
<input name="name" defaultValue={row.name} className="p-2 rounded border" required />
<input name="latin_name" defaultValue={row.latin_name ?? ''} className="p-2 rounded border" />
</div>
<textarea name="description" defaultValue={row.description ?? ''} className="p-2 rounded border w-full" rows={5} />
<input name="host_plants" defaultValue={(row.host_plants ?? []).join(', ')} className="p-2 rounded border w-full" />
<input type="number" name="severity" defaultValue={row.severity ?? 0} className="p-2 rounded border w-full" />
<button disabled={saving} className="px-4 py-2 rounded-2xl bg-black text-white">Gem</button>
{msg && <p className="text-sm text-gray-600">{msg}</p>}
</form>
</div>
);
}