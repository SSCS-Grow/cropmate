'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

type ProfileRow = { latitude: number | null; longitude: number | null }

type Advice = {
  shouldWater: boolean
  reason: string
  severity: 'low' | 'medium' | 'high'
  todayStr: string
}

export default function WaterAdvisor() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [loading, setLoading] = useState(true)
  const [coords, setCoords] = useState<{ lat:number; lon:number } | null>(null)
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [creating, setCreating] = useState(false)
  const [createdCount, setCreatedCount] = useState<number | null>(null)

  const todayStr = () => new Date().toISOString().slice(0,10)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)

      // 1) Session + profil
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { setLoading(false); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', uid)
        .maybeSingle()

      const p = (prof || {}) as ProfileRow
      if (!p || p.latitude == null || p.longitude == null) { setLoading(false); return }
      if (!alive) return
      setCoords({ lat: p.latitude, lon: p.longitude })

      // 2) Hent vejr (i dag + 2 dage), daglig: max temp & nedbørssum
      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.searchParams.set('latitude', String(p.latitude))
      url.searchParams.set('longitude', String(p.longitude))
      url.searchParams.set('daily', 'temperature_2m_max,precipitation_sum')
      url.searchParams.set('forecast_days', '3')
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
        const days: string[] = json?.daily?.time ?? []
        const tmax: number[] = json?.daily?.temperature_2m_max ?? []
        const prec: number[] = json?.daily?.precipitation_sum ?? []

        // Simple, gennemskuelige regler:
        // - Hvis i dag: tmax >= 26°C og regn < 1mm → HØJ (vand)
        // - Eller (tmax 22–25°C og regn < 1mm) → MID (overvej vanding)
        // - Hvis kommende 48h regn >= 6mm → LAV (vent)
        // - Ellers: neutral
        if (days.length) {
          const i0 = 0
          const i1 = Math.min(1, prec.length - 1)
          const i2 = Math.min(2, prec.length - 1)
          const t = tmax[i0] ?? 0
          const r0 = prec[i0] ?? 0
          const r48 = (prec[i0] ?? 0) + (prec[i1] ?? 0) // enkel sum ~næste 48h

          if (r48 >= 6) {
            recommendation = {
              shouldWater: false,
              reason: 'Der ventes >6 mm regn inden for 48 timer – vent med at vande.',
              severity: 'low',
              todayStr: todayStr()
            }
          } else if (t >= 26 && r0 < 1) {
            recommendation = {
              shouldWater: true,
              reason: 'Varm dag (≥26°C) og næsten ingen regn i dag – vand anbefales.',
              severity: 'high',
              todayStr: todayStr()
            }
          } else if (t >= 22 && t < 26 && r0 < 1) {
            recommendation = {
              shouldWater: true,
              reason: 'Lun dag (22–25°C) og næsten ingen regn i dag – overvej vanding.',
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
    setCreating(true)
    setCreatedCount(null)
    try {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { alert('Log ind først.'); return }

      // Hent alle brugerens afgrøder
      const { data: uc } = await supabase
        .from('user_crops')
        .select('id, crop_id')
        .eq('user_id', uid)

      const rows = (uc || []) as { id: string; crop_id: string }[]
      if (!rows.length) { alert('Du har ingen afgrøder i “Min have”.'); return }

      // Find hvilke crops allerede har en pending water-opgave i dag
      const cropIds = rows.map(r => r.crop_id)
      const today = todayStr()

      const { data: existing } = await supabase
        .from('tasks')
        .select('crop_id')
        .eq('user_id', uid)
        .eq('status', 'pending')
        .eq('type', 'water')
        .eq('due_date', today)
        .in('crop_id', cropIds)

      const existingSet = new Set((existing || []).map((e: any) => e.crop_id))

      // Indsæt tasks for de crops, der mangler
      const toInsert = rows
        .filter(r => !existingSet.has(r.crop_id))
        .map(r => ({
          user_id: uid,
          crop_id: r.crop_id,
          type: 'water' as const,
          due_date: today,
          status: 'pending' as const,
          notes: 'Automatisk oprettet via vandingsråd'
        }))

      if (toInsert.length) {
        const { error } = await supabase.from('tasks').insert(toInsert)
        if (error) throw error
      }
      setCreatedCount(toInsert.length)
    } catch (e) {
      console.error(e)
      alert('Kunne ikke oprette vandingsopgaver.')
    } finally {
      setCreating(false)
    }
  }

  // UI
  if (loading) {
    return (
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <div className="opacity-60">Analyserer vanding…</div>
      </section>
    )
  }

  if (!coords) {
    return (
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="font-medium mb-1">Vanding i dag?</h3>
        <p className="text-sm">Ingen lokation sat. Udfyld latitude/longitude under <a className="underline" href="/settings">Indstillinger</a>.</p>
      </section>
    )
  }

  if (!advice) return null

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
          {creating ? 'Opretter…' : 'Opret vandingsopgaver i dag'}
        </button>
        {createdCount !== null && (
          <span className="text-xs opacity-70">
            {createdCount === 0 ? 'Alle havde allerede en opgave i dag.' : `Oprettede ${createdCount} opgave(r).`}
          </span>
        )}
      </div>
    </section>
  )
}
