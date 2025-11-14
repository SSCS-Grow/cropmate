'use client'

import { useEffect, useState } from 'react'
import useSupabaseBrowser from '@/hooks/useSupabaseBrowser'

type ProfileRow = { latitude: number | null; longitude: number | null }

type Advice = {
  shouldWater: boolean
  reason: string
  severity: 'low' | 'medium' | 'high'
  todayStr: string
}

export default function WaterAdvisor() {
  const supabase = useSupabaseBrowser()
  const [loading, setLoading] = useState(true)
  const [coords, setCoords] = useState<{ lat:number; lon:number } | null>(null)
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [creating, setCreating] = useState(false)
  const [createdCount, setCreatedCount] = useState<number | null>(null)
  const [thresholds, setThresholds] = useState<{ et0:number; rain:number; hot:number }>({ et0:3.5, rain:1.5, hot:26 })

  const todayStr = () => new Date().toISOString().slice(0,10)

  useEffect(() => {
    if (!supabase) return
    let alive = true
    ;(async () => {
      setLoading(true)

      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { setLoading(false); return }

      // profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', uid).maybeSingle()

      const p = (prof || {}) as ProfileRow
      if (!p || p.latitude == null || p.longitude == null) { setLoading(false); return }
      if (!alive) return
      setCoords({ lat: p.latitude, lon: p.longitude })

      // user_settings
      const { data: us } = await supabase
        .from('user_settings')
        .select('et0_threshold_mm, rain_skip_mm, hot_day_c')
        .eq('user_id', uid).maybeSingle()

      const et0Thr = Number(us?.et0_threshold_mm ?? 3.5)
      const rainThr = Number(us?.rain_skip_mm ?? 1.5)
      const hotC = Number(us?.hot_day_c ?? 26)
      setThresholds({ et0: et0Thr, rain: rainThr, hot: hotC })

      // weather
      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.searchParams.set('latitude', String(p.latitude))
      url.searchParams.set('longitude', String(p.longitude))
      url.searchParams.set('daily', 'et0_fao_evapotranspiration,precipitation_sum,temperature_2m_max')
      url.searchParams.set('forecast_days', '1')
      url.searchParams.set('timezone', 'Europe/Copenhagen')

      let recommendation: Advice = {
        shouldWater: false,
        reason: 'Ingen data.',
        severity: 'low',
        todayStr: todayStr()
      }

      try {
        const res = await fetch(url.toString(), { cache: 'no-store' })
        const json = await res.json()
        const et0 = Number(json?.daily?.et0_fao_evapotranspiration?.[0] ?? 0)
        const r0  = Number(json?.daily?.precipitation_sum?.[0] ?? 0)
        const t   = Number(json?.daily?.temperature_2m_max?.[0] ?? 0)

        if (r0 >= rainThr) {
          recommendation = {
            shouldWater: false,
            reason: `Der ventes ≥ ${rainThr} mm regn i dag – vent med at vande.`,
            severity: 'low',
            todayStr: todayStr()
          }
        } else if (et0 >= et0Thr) {
          recommendation = {
            shouldWater: true,
            reason: `ET₀ er høj (≥ ${et0Thr} mm) og lav regn i dag – vand anbefales.`,
            severity: 'high',
            todayStr: todayStr()
          }
        } else if (t >= hotC && r0 < 1) {
          recommendation = {
            shouldWater: true,
            reason: `Varm dag (≥ ${hotC}°C) og næsten ingen regn – overvej vanding.`,
            severity: 'medium',
            todayStr: todayStr()
          }
        } else {
          recommendation = {
            shouldWater: false,
            reason: 'Ingen tydelig varme/tørke – vanding er nok ikke nødvendig.',
            severity: 'low',
            todayStr: todayStr()
          }
        }
      } catch {
        recommendation = {
          shouldWater: false,
          reason: 'Kunne ikke hente vejrdata.',
          severity: 'low',
          todayStr: todayStr()
        }
      }

      if (!alive) return
      setAdvice(recommendation)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [supabase])

  const createWaterTasksToday = async () => {
    if (!supabase) return
    setCreating(true)
    setCreatedCount(null)
    try {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { alert('Log ind først.'); return }

      // Hent brugerens afgrøder
      const { data: uc } = await supabase
        .from('user_crops')
        .select('id, crop_id, auto_water')
        .eq('user_id', uid)

      const rows = (uc || []) as { id: string; crop_id: string; auto_water: boolean | null }[]
      // Brug KUN dem med auto_water
      const allowed = rows.filter(r => !!r.auto_water)
      if (!allowed.length) { alert('Ingen af dine afgrøder har Auto-vanding slået til.'); setCreating(false); return }

      const today = todayStr()

      const { data: existing } = await supabase
        .from('tasks')
        .select('crop_id')
        .eq('user_id', uid)
        .eq('status', 'pending')
        .eq('type', 'water')
        .eq('due_date', today)

      const existingSet = new Set((existing || []).map((e: any) => e.crop_id))

      const toInsert = allowed
        .filter(r => !existingSet.has(r.crop_id))
        .map(r => ({
          user_id: uid,
          crop_id: r.crop_id,
          type: 'water' as const,
          due_date: today,
          status: 'pending' as const,
          notes: 'Oprettet fra “Vanding i dag?”'
        }))

      if (toInsert.length) {
        const { error } = await supabase.from('tasks').insert(toInsert)
        if (error) throw error
      }
      setCreatedCount(toInsert.length)
    } catch {
      alert('Kunne ikke oprette vandingsopgaver.')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <div className="opacity-60">Analyserer vanding…</div>
      </section>
    )
  }

  if (!coords || !advice) {
    return (
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="font-medium mb-1">Vanding i dag?</h3>
        <p className="text-sm">Ingen lokation eller data.</p>
      </section>
    )
  }

  const pill =
    advice.severity === 'high'   ? 'bg-orange-100 text-orange-800' :
    advice.severity === 'medium' ? 'bg-amber-100 text-amber-800'  :
                                   'bg-slate-100 text-slate-800'

  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">Vanding i dag?</h3>
          <p className="text-xs opacity-60">Lat {coords.lat.toFixed(3)} • Lon {coords.lon.toFixed(3)}</p>
          <p className="text-[11px] opacity-60 mt-1">
            Dine tærskler: ET₀ ≥ {thresholds.et0} mm • Regn-skip ≥ {thresholds.rain} mm • Hedebølge ≥ {thresholds.hot}°C
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${pill}`}>
          {advice.shouldWater ? (advice.severity === 'high' ? 'Anbefalet' : 'Overvej') : 'Ikke nødvendig'}
        </span>
      </div>

      <p className="text-sm mt-2">{advice.reason}</p>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={createWaterTasksToday}
          disabled={creating}
          className="px-3 py-2 rounded bg-slate-900 text-white text-xs"
        >
          {creating ? 'Opretter…' : 'Opret vandingsopgaver i dag (Auto-vanding)'}
        </button>
        {createdCount !== null && (
          <span className="text-xs opacity-70">
            {createdCount === 0 ? 'Ingen nye – opgaver fandtes allerede.' : `Oprettede ${createdCount} opgave(r).`}
          </span>
        )}
      </div>
    </section>
  )
}
