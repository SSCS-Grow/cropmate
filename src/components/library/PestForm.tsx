"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PestForm({ initial }: { initial?: any }) {
  const [form, setForm] = useState(() => initial ?? { name:"", latin_name:"", category:"pest", description:"", host_plants:[], severity:3 });
  const [busy,setBusy] = useState(false);
  const [err,setErr] = useState<string|null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const method = initial ? "PATCH" : "POST";
    const url = initial ? `/api/library/${initial.id}` : `/api/library`;
    const res = await fetch(url, { method, headers: { "Content-Type":"application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Fejl"); setBusy(false); return; }
    router.push(initial ? `/admin/library` : `/admin/library`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm">Navn</label>
        <input className="input input-bordered w-full" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Latinsk navn</label>
          <input className="input input-bordered w-full" value={form.latin_name||""} onChange={e=>setForm({...form, latin_name:e.target.value})}/>
        </div>
        <div>
          <label className="block text-sm">Kategori</label>
          <select className="select select-bordered w-full" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
            <option value="pest">Skadedyr</option>
            <option value="disease">Sygdom</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm">Værtsplanter (komma-separeret)</label>
        <input className="input input-bordered w-full"
          value={(form.host_plants||[]).join(",")}
          onChange={e=>setForm({...form, host_plants:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})}/>
      </div>
      <div>
        <label className="block text-sm">Alvorlighed (1–5)</label>
        <input type="number" min={1} max={5} className="input input-bordered w-24" value={form.severity}
          onChange={e=>setForm({...form, severity: Number(e.target.value)})}/>
      </div>
      <div>
        <label className="block text-sm">Beskrivelse</label>
        <textarea className="textarea textarea-bordered w-full" rows={5}
          value={form.description||""} onChange={e=>setForm({...form, description:e.target.value})}/>
      </div>
      {err && <div className="text-red-600">{err}</div>}
      <button disabled={busy} className="btn btn-primary">{busy ? "Gemmer…" : "Gem"}</button>
    </form>
  );
}
