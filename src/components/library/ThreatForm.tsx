'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export type ThreatPayload = {
  type: 'pest' | 'disease';
  category: 'insect'|'mite'|'nematode'|'weed'|'fungus'|'bacteria'|'virus'|'physiological'|'other';
  name_common: string;
  name_latin?: string;
  summary?: string;
  description_md?: string;
  life_cycle_md?: string;
  management_md?: string;
  severity_min?: number;
  severity_max?: number;
};

export default function ThreatForm({
  initial,
  onSaved,
  submitLabel = 'Gem',
}: {
  initial?: Partial<ThreatPayload>;
  onSaved?: (id: string) => void;
  submitLabel?: string;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<ThreatPayload>({
    type: (initial?.type as any) ?? 'pest',
    category: (initial?.category as any) ?? 'other',
    name_common: initial?.name_common ?? '',
    name_latin: initial?.name_latin ?? '',
    summary: initial?.summary ?? '',
    description_md: initial?.description_md ?? '',
    life_cycle_md: initial?.life_cycle_md ?? '',
    management_md: initial?.management_md ?? '',
    severity_min: initial?.severity_min ?? 1,
    severity_max: initial?.severity_max ?? 5,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function upd<K extends keyof ThreatPayload>(k: K, v: ThreatPayload[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const payload = { ...form };
      if ((payload.severity_min ?? 1) > (payload.severity_max ?? 5)) {
        throw new Error('severity_min må ikke være > severity_max');
      }
      // insert eller update afhænger af presence af slug/id i initial as any
      const id = (initial as any)?.id as string | undefined;
      if (!id) {
        const { data, error } = await supabase.from('threats').insert(payload).select('id').single();
        if (error) throw error;
        onSaved?.(data!.id);
      } else {
        const { data, error } = await supabase.from('threats').update(payload).eq('id', id).select('id').single();
        if (error) throw error;
        onSaved?.(data!.id);
      }
    } catch (e: any) {
      setErr(e?.message ?? 'Kunne ikke gemme');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {err && <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Type</label>
          <select className="w-full border rounded-lg px-3 py-2" value={form.type} onChange={e => upd('type', e.target.value as any)}>
            <option value="pest">Skadedyr</option>
            <option value="disease">Sygdom</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Kategori</label>
          <select className="w-full border rounded-lg px-3 py-2" value={form.category} onChange={e => upd('category', e.target.value as any)}>
            <option>insect</option><option>mite</option><option>nematode</option><option>weed</option>
            <option>fungus</option><option>bacteria</option><option>virus</option><option>physiological</option><option>other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm">Dansk navn</label>
        <input className="w-full border rounded-lg px-3 py-2" value={form.name_common} required onChange={e => upd('name_common', e.target.value)} />
      </div>
      <div>
        <label className="text-sm">Latinsk navn</label>
        <input className="w-full border rounded-lg px-3 py-2" value={form.name_latin} onChange={e => upd('name_latin', e.target.value)} />
      </div>
      <div>
        <label className="text-sm">Kort resume</label>
        <textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={form.summary} onChange={e => upd('summary', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Kendetegn (Markdown)</label>
          <textarea className="w-full border rounded-lg px-3 py-2" rows={6} value={form.description_md ?? ''} onChange={e => upd('description_md', e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Livscyklus (Markdown)</label>
          <textarea className="w-full border rounded-lg px-3 py-2" rows={6} value={form.life_cycle_md ?? ''} onChange={e => upd('life_cycle_md', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-sm">Håndtering (Markdown)</label>
        <textarea className="w-full border rounded-lg px-3 py-2" rows={4} value={form.management_md ?? ''} onChange={e => upd('management_md', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Sværhed (min)</label>
          <input type="number" min={0} max={5} className="w-full border rounded-lg px-3 py-2" value={form.severity_min ?? 1}
                 onChange={(e) => upd('severity_min', Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm">Sværhed (max)</label>
          <input type="number" min={0} max={5} className="w-full border rounded-lg px-3 py-2" value={form.severity_max ?? 5}
                 onChange={(e) => upd('severity_max', Number(e.target.value))} />
        </div>
      </div>

      <button disabled={busy} className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60">
        {busy ? 'Gemmer…' : submitLabel}
      </button>
    </form>
  );
}
