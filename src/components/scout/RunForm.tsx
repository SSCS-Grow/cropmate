'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
// Update the path below if the actual location is different, e.g. '../../types/scout'
import type { ScoutTemplate } from '@/lib/types/scout';

export default function RunForm({ template, runId }: { template: ScoutTemplate; runId: string; }) {
  const supabase = createClient();
  const [values, setValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File|undefined>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string|undefined>();

  function setVal(key: string, v:any) { setValues(p=>({ ...p, [key]: v })); }

  async function onSubmit() {
    setSaving(true); setMsg(undefined);

    await (supabase as any)
     .from('scout_runs')
    .update({ started_at: new Date().toISOString() })
    .eq('id', runId);

    for (const item of template.items) {
      let photo_url: string | null = null;
      const f = files[item.key];
      if (f) {
        const ext = f.name.split('.').pop() || 'jpg';
        const path = `${runId}/${item.key}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('scout-photos').upload(path, f, { contentType: f.type });
        if (!upErr) {
          const { data } = supabase.storage.from('scout-photos').getPublicUrl(path);
          photo_url = data.publicUrl;
        } else {
          setMsg(upErr.message);
        }
      }
      await (supabase as any)
         .from('scout_results')
         .insert({
            run_id: runId,
            item_key: item.key,
            value: values[item.key] ?? null,
            photo_url,
        });
     }

    await (supabase as any)
  .from('scout_runs')
  .update({ finished_at: new Date().toISOString() })
  .eq('id', runId);

    setSaving(false); setMsg('Scouting gennemført ✅');
  }

  return (
    <div className="space-y-4">
      {template.items.map((it) => (
        <div key={it.key} className="p-3 rounded-xl border bg-white">
          <div className="font-medium mb-2">{it.label}</div>
          {it.type === 'boolean' && (
            <select className="p-2 rounded border" onChange={e=>setVal(it.key, e.target.value === 'true')}>
              <option value="">Vælg…</option>
              <option value="true">Ja</option>
              <option value="false">Nej</option>
            </select>
          )}
          {it.type === 'number' && (
            <input type="number" className="p-2 rounded border" onChange={e=>setVal(it.key, Number(e.target.value))} />
          )}
          {it.type === 'select' && (
            <select className="p-2 rounded border" onChange={e=>setVal(it.key, e.target.value)}>
              <option value="">Vælg…</option>
              {(it.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          {it.type === 'text' && (
            <textarea className="p-2 rounded border w-full" onChange={e=>setVal(it.key, e.target.value)} />
          )}
          <div className="mt-2">
            <input type="file" accept="image/*" onChange={e=>setFiles(p=>({ ...p, [it.key]: e.target.files?.[0] }))} />
          </div>
          {typeof it.threshold === 'number' && typeof values[it.key] === 'number' && (
            <div className={`mt-2 text-sm ${Number(values[it.key]) >= it.threshold ? 'text-red-600' : 'text-gray-500'}`}>
              Threshold: {it.threshold} · Værdi: {String(values[it.key])}
            </div>
          )}
        </div>
      ))}
      <button disabled={saving} onClick={onSubmit} className="px-4 py-2 rounded-2xl bg-black text-white">Gem runde</button>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  );
}
