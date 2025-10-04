'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const categories = [
  'insect','mite','nematode','weed','fungus','bacteria','virus','physiological','other'
];

export default function ThreatFilters({
  initialQuery,
  initialType,
  initialCategory,
}: {
  initialQuery?: string;
  initialType?: 'pest' | 'disease';
  initialCategory?: string;
}) {
  const [q, setQ] = useState(initialQuery ?? '');
  const [type, setType] = useState<'pest'|'disease'|''>(initialType ?? '');
  const [category, setCategory] = useState(initialCategory ?? '');
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    setQ(initialQuery ?? '');
  }, [initialQuery]);

  function apply() {
    const params = new URLSearchParams(sp?.toString());
    if (q) params.set('q', q); else params.delete('q');
    if (type) params.set('type', type); else params.delete('type');
    if (category) params.set('category', category); else params.delete('category');
    router.push(`/library?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label className="text-sm">Søg</label>
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Navn, latinsk navn…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
        />
      </div>
      <div>
        <label className="text-sm">Type</label>
        <select className="block border rounded-lg px-3 py-2"
          value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="">Alle</option>
          <option value="pest">Skadedyr</option>
          <option value="disease">Sygdom</option>
        </select>
      </div>
      <div>
        <label className="text-sm">Kategori</label>
        <select className="block border rounded-lg px-3 py-2"
          value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Alle</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button className="px-4 py-2 rounded-lg bg-black text-white" onClick={apply}>
        Anvend filtre
      </button>
    </div>
  );
}
