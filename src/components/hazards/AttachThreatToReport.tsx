'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type ThreatLite = { id: string; name_common: string; type: string; category: string };

export default function AttachThreatToReport({ reportId, initialThreatId }: { reportId: string; initialThreatId?: string | null }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState<ThreatLite[]>([]);
  const [selected, setSelected] = useState<string | undefined>(initialThreatId ?? undefined);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let active = true;
    async function run() {
      if (!q || q.length < 2) { setList([]); return; }
      const { data } = await supabase.from('threats').select('id,name_common,type,category').or(`name_common.ilike.%${q}%,name_latin.ilike.%${q}%`).limit(10);
      if (active) setList(data ?? []);
    }
    run();
    return () => { active = false; };
  }, [q]);

  async function save() {
    await supabase.from('hazard_reports').update({ threat_id: selected ?? null }).eq('id', reportId);
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Knyt til bibliotek</div>
      <input className="w-full border rounded-lg px-3 py-2" placeholder="Søg trussel…" value={q} onChange={e => setQ(e.target.value)} />
      {list.length > 0 && (
        <ul className="border rounded-lg divide-y max-h-40 overflow-auto">
          {list.map(t => (
            <li key={t.id} className="p-2 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{t.name_common}</div>
                <div className="text-xs text-gray-500">{t.type} · {t.category}</div>
              </div>
              <button className={`px-2 py-1 rounded border ${selected===t.id ? 'bg-black text-white' : ''}`} onClick={() => setSelected(t.id)}>
                {selected===t.id ? 'Valgt' : 'Vælg'}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <button onClick={save} className="px-3 py-2 rounded bg-black text-white">Gem</button>
        <button onClick={() => { setSelected(undefined); setQ(''); }} className="px-3 py-2 rounded border">Nulstil</button>
      </div>
    </div>
  );
}
