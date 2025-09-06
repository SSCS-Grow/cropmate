'use client'
import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

export default function Settings() {
  const supabase = useMemo(() => supabaseBrowser(), [])

  // Profiles (geo)
  const [lat, setLat] = useState<string>('')
  const [lng, setLng] = useState<string>('')

  // User Settings (thresholds)
  const [et0, setEt0] = useState<string>('3.5')
  const [rain, setRain] = useState<string>('1.5')
  const [hot, setHot] = useState<string>('26')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { setLoggedIn(false); setLoading(false); return }
      setLoggedIn(true)

      // load profile coords
      const { data: prof } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', uid)
        .maybeSingle()

      if (prof) {
        setLat(prof.latitude ?? '')
        setLng(prof.longitude ?? '')
      }

      // load user_settings (eller defaults)
      const { data: us } = await supabase
        .from('user_settings')
        .select('et0_threshold_mm, rain_skip_mm, hot_day_c')
        .eq('user_id', uid)
        .maybeSingle()

      if (us) {
        setEt0(String(us.et0_threshold_mm ?? 3.5))
        setRain(String(us.rain_skip_mm ?? 1.5))
        setHot(String(us.hot_day_c ?? 26))
      } else {
        setEt0('3.5'); setRain('1.5'); setHot('26')
      }

      if (!alive) return
      setLoading(false)
    })()
    return () => { alive = false }
  }, [supabase])

  const save = async () => {
    setSaving(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) return

      // Save profile coords
      await supabase
        .from('profiles')
        .update({
          latitude: lat ? Number(lat) : null,
          longitude: lng ? Number(lng) : null
        })
        .eq('id', uid)

      // Upsert user_settings
      const payload = {
        user_id: uid,
        et0_threshold_mm: Number(et0),
        rain_skip_mm: Number(rain),
        hot_day_c: Number(hot),
      }

      // upsert: insert eller update
      const { error } = await supabase
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' })

      if (error) throw error
      alert('Indstillinger gemt.')
    } catch (e) {
      alert('Kunne ikke gemme indstillinger.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="opacity-60 p-4">Indlæser…</div>
  if (!loggedIn) return <div className="p-4">Log ind for at se indstillinger.</div>

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-semibold">Indstillinger</h2>

      <section className="grid gap-3 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="font-medium">Lokation</h3>
        <label className="grid gap-1 max-w-xs">
          <span className="text-sm">Breddegrad (latitude)</span>
          <input value={lat ?? ''} onChange={(e)=>setLat(e.target.value)} className="border px-3 py-2 rounded" />
        </label>
        <label className="grid gap-1 max-w-xs">
          <span className="text-sm">Længdegrad (longitude)</span>
          <input value={lng ?? ''} onChange={(e)=>setLng(e.target.value)} className="border px-3 py-2 rounded" />
        </label>
      </section>

      <section className="grid gap-3 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="font-medium">Autovanding – Tærskler</h3>
        <div className="grid sm:grid-cols-3 gap-3 max-w-3xl">
          <label className="grid gap-1">
            <span className="text-sm">ET₀ tærskel (mm)</span>
            <input value={et0} onChange={(e)=>setEt0(e.target.value)} className="border px-3 py-2 rounded" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Regn-skip (mm i dag)</span>
            <input value={rain} onChange={(e)=>setRain(e.target.value)} className="border px-3 py-2 rounded" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Hedebølge fallback (°C)</span>
            <input value={hot} onChange={(e)=>setHot(e.target.value)} className="border px-3 py-2 rounded" />
          </label>
        </div>
        <p className="text-xs opacity-70">Cron og dashboards bruger disse værdier – ingen kodeændring nødvendig.</p>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="px-3 py-2 rounded bg-slate-900 text-white text-sm max-w-max"
      >
        {saving ? 'Gemmer…' : 'Gem indstillinger'}
      </button>
    </div>
  )
}