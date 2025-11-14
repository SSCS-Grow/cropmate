'use client'


import { useEffect, useState } from 'react'
import useSupabaseBrowser from '@/hooks/useSupabaseBrowser'
import Link from 'next/link' 

type Crop = {
  id: string
  name: string
  scientific_name: string | null
  description: string | null
}

export default function CropsPage() {
  const supabase = useSupabaseBrowser();
  const [crops, setCrops] = useState<Crop[]>([])
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return;
    const run = async () => {
      const { data, error } = await supabase
        .from('crops')
        .select('id, name, scientific_name, description')
        .order('name')
      if (!error && data) setCrops(data as Crop[])
    }
    run()
  }, [supabase])

  const addToGarden = async (cropId: string) => {
    if (!supabase) return;
    setAddingId(cropId)
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user.id
    if (!userId) { setAddingId(null); return alert('Log ind først') }

    const planted_on = new Date().toISOString().slice(0, 10)
    const { error: insErr } = await supabase
      .from('user_crops')
      .insert({ user_id: userId, crop_id: cropId, planted_on })
    if (insErr) { setAddingId(null); return alert('Kunne ikke tilføje (tjek permissions)') }

    setAddingId(null)
    alert('Tilføjet ✔️')
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Afgrødekatalog</h2>
      <ul className="grid gap-3">
        {crops.map((c) => (
          <li key={c.id} className="p-3 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">
                  <Link
                    href={`/crops/${c.id}`}
                    className="underline decoration-slate-300 hover:decoration-slate-900"
                  >
                    {c.name}
                  </Link>
                </h3>

                {c.scientific_name && <p className="text-sm opacity-70">{c.scientific_name}</p>}
              </div>
              <button
                disabled={addingId === c.id}
                onClick={() => addToGarden(c.id)}
                className="px-3 py-2 rounded bg-slate-900 text-white text-sm"
              >
                {addingId === c.id ? 'Tilføjer…' : 'Tilføj'}
              </button>
            </div>
            {c.description && <p className="text-sm mt-2 opacity-90">{c.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
