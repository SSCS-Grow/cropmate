'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ScoutItem, ScoutTemplate } from '@/lib/types/scout';

function newItem(): ScoutItem { return { key: `item_${Date.now()}`, label: 'Nyt punkt', type: 'boolean' }; }

export default function TemplateBuilder() {
  const supabase = createClient();
  const [name, setName] = useState('Skadedyr – standard');
  const [desc, setDesc] = useState('Ugentlig runde');
  const [items, setItems] = useState<ScoutItem[]>([ newItem() ]);
  const [msg, setMsg] = useState<string|undefined>();

  function addItem() { setItems(p => [...p, newItem()]); }
  function upd(i: number, patch: Partial<ScoutItem>) { setItems(p => p.map((it, idx) => idx===i ? { ...it, ...patch } : it)); }
  function rm(i:number) { setItems(p => p.filter((_,idx) => idx!==i)); }

  async function save() {
    const body = { name, description: desc, items } as Partial<ScoutTemplate>;
    const { error } = await (supabase as any)
      .from('scout_templates')
      .insert(body)
      .select('*')
      .single();
    setMsg(error ? error.message : 'Skabelon gemt ✅');
  }

  return (
    <div className="space-y-3 p-4 rounded-2xl shadow bg-white">
      <h2 className="text-xl font-semibold">Ny scouting-skabelon</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="p-2 rounded border" value={name} onChange={e=>setName(e.target.value)} placeholder="Navn"/>
        <input className="p-2 rounded border" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Beskrivelse"/>
      </div>
      <div className="space-y-2">
        {items.map((it, i)=> (
          <div key={it.key} className="grid md:grid-cols-4 gap-2 items-center">
            <input className="p-2 rounded border" value={it.label} onChange={e=>upd(i,{label:e.target.value})} />
            <select className="p-2 rounded border" value={it.type} onChange={e=>upd(i,{type:e.target.value as any})}>
              <option value="boolean">Ja/Nej</option>
              <option value="number">Tal</option>
              <option value="select">Valg</option>
              <option value="text">Tekst</option>
            </select>
            <input className="p-2 rounded border" placeholder="Options (komma-sep)" onChange={e=>upd(i,{options: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
            <div className="flex gap-2">
              <input className="p-2 rounded border w-full" placeholder="Threshold (tal)" onChange={e=>upd(i,{threshold: Number(e.target.value)||undefined})} />
              <button onClick={()=>rm(i)} className="px-3 py-2 rounded-2xl border">Slet</button>
            </div>
          </div>
        ))}
        <button onClick={addItem} className="px-3 py-2 rounded-2xl border">+ Tilføj punkt</button>
      </div>
      <button onClick={save} className="px-3 py-2 rounded-2xl bg-black text-white">Gem skabelon</button>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  );
}
