'use client';
import { useState } from 'react';


export default function AdminCreatePage() {
const [saving, setSaving] = useState(false);
const [msg, setMsg] = useState<string|undefined>();


async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
e.preventDefault();
setSaving(true); setMsg(undefined);


const fd = new FormData(e.currentTarget);
const payload = {
slug: String(fd.get('slug')||'').trim(),
name: String(fd.get('name')||'').trim(),
category: (fd.get('category') as string) as 'pest'|'disease',
latin_name: String(fd.get('latin_name')||'') || null,
description: String(fd.get('description')||'') || null,
host_plants: String(fd.get('host_plants')||'').split(',').map(s=>s.trim()).filter(Boolean),
severity: Number(fd.get('severity')||0),
};


const res = await fetch('/api/library', { method: 'POST', body: JSON.stringify(payload) });
const json = await res.json();
setSaving(false);
if (!res.ok) setMsg(json.error || 'Fejl ved oprettelse'); else setMsg('Oprettet ✅');
}


return (
<div className="max-w-3xl mx-auto p-4 space-y-4">
<h1 className="text-2xl font-bold">Ny post</h1>
<form onSubmit={onSubmit} className="space-y-3">
<div className="grid md:grid-cols-2 gap-3">
<input name="slug" placeholder="slug" className="p-2 rounded border" required />
<input name="name" placeholder="Navn" className="p-2 rounded border" required />
<select name="category" className="p-2 rounded border">
<option value="pest">pest</option>
<option value="disease">disease</option>
</select>
<input name="latin_name" placeholder="Latinsk navn" className="p-2 rounded border" />
</div>
<textarea name="description" placeholder="Beskrivelse" className="p-2 rounded border w-full" rows={5} />
<input name="host_plants" placeholder="Værtsplanter (komma-sep)" className="p-2 rounded border w-full" />
<input type="number" name="severity" placeholder="Alvorlighed (0-5)" className="p-2 rounded border w-full" defaultValue={0} />
<button disabled={saving} className="px-4 py-2 rounded-2xl bg-black text-white">Gem</button>
{msg && <p className="text-sm text-gray-600">{msg}</p>}
</form>
</div>
);
}