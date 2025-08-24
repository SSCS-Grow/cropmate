'use client'
import { useEffect, useState } from 'react'
import supabaseBrowser from '../../lib/supabaseBrowser'

export default function Settings() {
  const supabase = supabaseBrowser()
  const [lat, setLat] = useState(''); const [lng, setLng] = useState('')

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession()
      const user = session.session?.user; if (!user) return
      const { data } = await supabase.from('profiles').select('latitude,longitude').eq('id', user.id).maybeSingle()
      if (data) { setLat(String(data.latitude ?? '')); setLng(String(data.longitude ?? '')) }
    })()
  }, [supabase])

  const save = async () => {
    const { data: session } = await supabase.auth.getSession()
    const user = session.session?.user; if (!user) return
    await supabase.from('profiles').update({ latitude: Number(lat), longitude: Number(lng) }).eq('id', user.id)
    alert('Gemt')
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Indstillinger</h2>
      <label className="grid gap-1">
        <span className="text-sm">Breddegrad (latitude)</span>
        <input value={lat} onChange={e=>setLat(e.target.value)} className="border px-3 py-2 rounded" />
      </label>
      <label className="grid gap-1">
        <span className="text-sm">Længdegrad (longitude)</span>
        <input value={lng} onChange={e=>setLng(e.target.value)} className="border px-3 py-2 rounded" />
      </label>
      <button onClick={save} className="px-3 py-2 rounded bg-slate-900 text-white text-sm max-w-max">Gem</button>
    </div>
  )
}
