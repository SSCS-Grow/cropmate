"use client";

import { useState } from "react";

type Base = {
  id?: string;
  slug?: string;
  name_da?: string;
  name_en?: string;
  description?: string;
  symptoms?: string;
  control?: string;
};

export default function LibraryForm({
  type,               // "pest" | "disease"
  initial,
  onSubmit,
  submittingLabel = "Gemmer...",
}: {
  type: "pest" | "disease";
  initial?: Base & { category?: string; pathogen?: string };
  onSubmit: (vals: any) => Promise<void>;
  submittingLabel?: string;
}) {
  const [vals, setVals] = useState<any>({
    slug: initial?.slug ?? "",
    name_da: initial?.name_da ?? "",
    name_en: initial?.name_en ?? "",
    description: initial?.description ?? "",
    symptoms: initial?.symptoms ?? "",
    control: initial?.control ?? "",
    category: initial?.category ?? "",
    pathogen: initial?.pathogen ?? "",
  });
  const [loading, setLoading] = useState(false);
  const isPest = type === "pest";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(vals);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input className="w-full border rounded-xl p-2" required
            value={vals.slug} onChange={e=>setVals({...vals, slug: e.target.value})}/>
        </div>
        <div>
          <label className="block text-sm font-medium">Navn (da)</label>
          <input className="w-full border rounded-xl p-2" required
            value={vals.name_da} onChange={e=>setVals({...vals, name_da: e.target.value})}/>
        </div>
        <div>
          <label className="block text-sm font-medium">Navn (en)</label>
          <input className="w-full border rounded-xl p-2"
            value={vals.name_en} onChange={e=>setVals({...vals, name_en: e.target.value})}/>
        </div>

        {isPest ? (
          <div>
            <label className="block text-sm font-medium">Kategori (pest)</label>
            <input className="w-full border rounded-xl p-2"
              placeholder="insect | mite | slug | ..."
              value={vals.category} onChange={e=>setVals({...vals, category: e.target.value})}/>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium">Patogen (disease)</label>
            <input className="w-full border rounded-xl p-2"
              placeholder="fungus | bacteria | virus | ..."
              value={vals.pathogen} onChange={e=>setVals({...vals, pathogen: e.target.value})}/>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Beskrivelse</label>
        <textarea className="w-full border rounded-xl p-2 min-h-[90px]"
          value={vals.description} onChange={e=>setVals({...vals, description: e.target.value})}/>
      </div>
      <div>
        <label className="block text-sm font-medium">Symptomer</label>
        <textarea className="w-full border rounded-xl p-2 min-h-[90px]"
          value={vals.symptoms} onChange={e=>setVals({...vals, symptoms: e.target.value})}/>
      </div>
      <div>
        <label className="block text-sm font-medium">Bekæmpelse / Tiltag</label>
        <textarea className="w-full border rounded-xl p-2 min-h-[90px]"
          value={vals.control} onChange={e=>setVals({...vals, control: e.target.value})}/>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-2xl shadow border hover:bg-gray-50"
      >
        {loading ? submittingLabel : "Gem"}
      </button>
    </form>
  );
}
