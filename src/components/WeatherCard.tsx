'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

type ProfileRow = { latitude: number | null; longitude: number | null }

type Weather = {
  hourlyTimes: string[]
  hourlyTemps: number[]
  dailyTimes: string[]
  dailyTmin: number[]
  dailyTmax: number[]
}

export default function WeatherCard() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [coords, setCoords] = useState<{lat:number; lon:number} | null>(null)
  const [w, setW] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(true)
  const [frostRisk, setFrostRisk] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      // 1) find bruger + profil coords
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { setCoords(null); setW(null); setLoading(false); return }

      const { data: prof, error } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', uid)
        .maybeSingle()

      if (error || !prof) { setCoords(null); setW(null); setLoading(false); return }
      const p = prof as ProfileRow
      if (p.latitude == null || p.longitude == null) { setCoords(null); setW(null); setLoading(false); return }
      if (!alive) return
      setCoords({ lat: p.latitude!, lon: p.longitude! })

      // 2) hent vejr fra Open-Meteo
      // - næste 24 timers time-temp
      // - 5 dages daglig min/max
      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.searchParams.set('latitude', String(p.latitude))
      url.searchParams.set('longitude', String(p.longitude))
      url.searchParams.set('hourly', 'temperature_2m')
      url.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max')
      url.searchParams.set('timezone', 'Europe/Copenhagen')

      try {
        const res = await fetch(url.toString())
        const json = await res.json()
        const hourlyTimes: string[] = json?.hourly?.time ?? []
        const hourlyTemps: number[] = json?.hourly?.temperature_2m ?? []
        const dailyTimes: string[] = json?.daily?.time ?? []
        const dailyTmin: number[] = json?.daily?.temperature_2m_min ?? []
        const dailyTmax: number[] = json?.daily?.temperature_2m_max ?? []

        if (!alive) return
        setW({ hourlyTimes, hourlyTemps, dailyTimes, dailyTmin, dailyTmax })

        // Frost-risiko næste 24 timer?
        const now = new Date()
        const until = new Date(Date.now() + 24*60*60*1000)
        let frost = false
        for (let i=0;i<hourlyTimes.length;i++) {
          const t = new Date(hourlyTimes[i])
          if (t >= now && t <= until && typeof hourlyTemps[i] === 'number' && hourlyTemps[i] <= 0) {
            frost = true; break
          }
        }
        setFrostRisk(frost)
      } catch {
        setW(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [supabase])

  // UI
  if (loading) {
    return (
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <div className="opacity-60">Henter vejr…</div>
      </section>
    )
  }

  if (!coords) {
    return (
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="font-medium mb-1">Vejr</h3>
        <p className="text-sm">Ingen lokation sat. Gå til <a className="underline" href="/settings">Indstillinger</a> og udfyld latitude/longitude.</p>
      </section>
    )
  }

  if (!w) {
    return (
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="font-medium mb-1">Vejr</h3>
        <p className="text-sm">Kunne ikke hente data lige nu.</p>
      </section>
    )
  }

  // small helpers
  const fmtDay = (s: string) => {
    try {
      const d = new Date(s + 'T00:00:00+02:00')
      return d.toLocaleDateString('da-DK', { weekday: 'short', day: '2-digit', month: '2-digit' })
    } catch { return s }
  }
  const todayIdx = 0 // dailyTimes er i dag først

  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">Vejr ved din lokation</h3>
          <p className="text-xs opacity-60">Lat {coords.lat.toFixed(3)} • Lon {coords.lon.toFixed(3)}</p>
        </div>
        {frostRisk && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-600 text-white">
            Frost-risiko ≤ 24 t
          </span>
        )}
      </div>

      {/* I dag */}
      {w.dailyTimes.length ? (
        <div className="mt-3 text-sm">
          <div className="font-medium mb-1">I dag ({fmtDay(w.dailyTimes[todayIdx])})</div>
          <div className="inline-flex items-center gap-3">
            <div className="px-2 py-1 rounded bg-slate-100">Min {Math.round(w.dailyTmin[todayIdx])}°C</div>
            <div className="px-2 py-1 rounded bg-slate-100">Max {Math.round(w.dailyTmax[todayIdx])}°C</div>
          </div>
        </div>
      ) : null}

      {/* Næste 4 dage */}
      {w.dailyTimes.length > 1 && (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {w.dailyTimes.slice(1, 5).map((d, i) => (
            <li key={d} className="p-2 rounded border border-slate-200 text-sm">
              <div className="opacity-70">{fmtDay(d)}</div>
              <div className="mt-1">Min {Math.round(w.dailyTmin[i+1])}° • Max {Math.round(w.dailyTmax[i+1])}°</div>
            </li>
          ))}
        </ul>
      )}

      {/* Mini timebånd (6 næste timer) */}
      {w.hourlyTimes.length ? (
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Næste timer</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {w.hourlyTimes.slice(0, 12).map((t, i) => {
              const hh = new Date(t).toLocaleTimeString('da-DK', { hour: '2-digit' })
              const temp = Math.round(w.hourlyTemps[i])
              return (
                <div key={t} className="min-w-[60px] p-2 rounded bg-slate-100 text-center text-sm">
                  <div className="opacity-70">{hh}</div>
                  <div className="font-medium">{temp}°</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
