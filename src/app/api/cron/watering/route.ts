import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Server env (IKKE NEXT_PUBLIC)
const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ---- TÆRSKLER (juster frit) ----
const ET0_WATER_MM = 3.5
const RAIN_SKIP_MM = 1.5
const HOT_DAY_C = 26

const todayStr = () => new Date().toISOString().slice(0,10)

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json({ error: 'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

  // 1) Profiler med lokation
  const { data: profiles, error: profErr } = await admin
    .from('profiles')
    .select('id, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })

  const today = todayStr()
  let touchedUsers = 0
  let createdTasks = 0
  let historyUpserts = 0

  for (const p of profiles || []) {
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.searchParams.set('latitude', String(p.latitude))
      url.searchParams.set('longitude', String(p.longitude))
      url.searchParams.set('daily', 'et0_fao_evapotranspiration,precipitation_sum,temperature_2m_max,temperature_2m_min')
      url.searchParams.set('forecast_days', '1')
      url.searchParams.set('timezone', 'Europe/Copenhagen')

      const res = await fetch(url.toString(), { cache: 'no-store' })
      const wx = await res.json()
      const et0  = Number(wx?.daily?.et0_fao_evapotranspiration?.[0] ?? 0)
      const rain = Number(wx?.daily?.precipitation_sum?.[0] ?? 0)
      const tmax = Number(wx?.daily?.temperature_2m_max?.[0] ?? 0)
      const tmin = Number(wx?.daily?.temperature_2m_min?.[0] ?? 0)

      // 2) Log/UPSERT daglig historik (en række pr. bruger+dato)
      {
        const { error: histErr } = await admin
          .from('weather_history')
          .upsert({
            user_id: p.id,
            date: today,
            latitude: p.latitude,
            longitude: p.longitude,
            et0_mm: et0,
            precipitation_mm: rain,
            tmax_c: tmax,
            tmin_c: tmin,
            source: 'open-meteo'
          },
          { onConflict: 'user_id,date' })  // kræver unique index
        if (!histErr) historyUpserts++
      }

      // 3) Beslut om vi skal vande i dag
      let shouldWater = false
      if (rain >= RAIN_SKIP_MM) {
        shouldWater = false
      } else if (et0 >= ET0_WATER_MM) {
        shouldWater = true
      } else if (tmax >= HOT_DAY_C && rain < 1) {
        shouldWater = true
      }

      if (!shouldWater) { touchedUsers++; continue }

      // 4) Hent brugerens crops med auto_water = true
      const { data: ucs } = await admin
        .from('user_crops')
        .select('id, crop_id')
        .eq('user_id', p.id)
        .eq('auto_water', true)

      const rows = (ucs || []) as { id: string; crop_id: string }[]
      if (!rows.length) { touchedUsers++; continue }

      // 5) Find crops der allerede har water-task i dag
      const cropIds = rows.map(r => r.crop_id).filter(Boolean)
      if (!cropIds.length) { touchedUsers++; continue }

      const { data: existing } = await admin
        .from('tasks')
        .select('crop_id')
        .eq('user_id', p.id)
        .eq('type', 'water')
        .eq('due_date', today)

      const existingSet = new Set((existing || []).map((e: any) => e.crop_id))

      // 6) Indsæt for dem, der mangler (unik-index forhindrer dubletter)
      const toInsert = rows
        .filter(r => !existingSet.has(r.crop_id))
        .map(r => ({
          user_id: p.id,
          crop_id: r.crop_id,
          type: 'water' as const,
          due_date: today,
          status: 'pending' as const,
          notes: 'Automatisk oprettet (ET₀-baseret cron)'
        }))

      if (toInsert.length) {
        const { error: insErr } = await admin.from('tasks').insert(toInsert)
        if (!insErr) createdTasks += toInsert.length
      }

      touchedUsers++
    } catch {
      // fortsæt til næste profil
    }
  }

  return NextResponse.json({
    ok: true,
    users_checked: touchedUsers,
    tasks_created: createdTasks,
    history_upserts: historyUpserts
  })
}