'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

export default function Settings() {
  // 1) Gør supabase stabil, så useEffect ikke rerunner unødigt
  const supabase = useMemo(() => supabaseBrowser(), [])

  // 2) Hold inputs som STRINGS (så man kan skrive "55.6", "12,5" osv.)
  const [lat, setLat] = useState<string>('')
  const [lng, setLng] = useState<string>('')

  // 3) Load kun én gang
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      // hent session
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { setLoaded(true); return }

      // hent profil
      const { data, error } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', uid)
        .maybeSingle()

      if (!alive) return
      if (!error && data) {
        // sørg for at gemme som string i inputs
        setLat(
          (typeof data.latitude === 'number' ? data.latitude.toString() : '') ?? ''
        )
        setLng(
          (typeof data.longitude === 'number' ? data.longitude.toString() : '') ?? ''
        )
      }
      setLoaded(true)
    })()
    return () => { alive = false }
  }, [supabase])

  // Hjælp: tillad også komma som decimal (dansk tastatur)
  const normalizeNumber = (s: string) => s.replace(',', '.').trim()

  const save = async () => {
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user.id
    if (!uid) return

    // tomme felter -> null; ellers parse til number
    const latNum = lat === '' ? null : Number(normalizeNumber(lat))
    const lngNum = lng === '' ? null : Number(normalizeNumber(lng))

    const { error } = await supabase
      .from('profiles')
      .update({ latitude: latNum, longitude: lngNum })
      .eq('id', uid)

    if (error) {
      alert('Kunne ikke gemme. Prøv igen.')
      return
    }
    alert('Gemt ✔️')
  }

  if (!loaded) return <div className="opacity-60">Indlæser…</div>

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Indstillinger</h2>

      <label className="grid gap-1">
        <span className="text-sm">Breddegrad (latitude)</span>
        <input
          inputMode="decimal"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="fx 55.676"
          className="border px-3 py-2 rounded"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm">Længdegrad (longitude)</span>
        <input
          inputMode="decimal"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="fx 12.568"
          className="border px-3 py-2 rounded"
        />
      </label>

      <button
        onClick={save}
        className="px-3 py-2 rounded bg-slate-900 text-white text-sm max-w-max"
      >
        Gem
      </button>

      <p className="text-xs opacity-60">
        Tip: Du kan skrive med komma eller punktum som decimalseparator.
      </p>
    </div>
  )
}

