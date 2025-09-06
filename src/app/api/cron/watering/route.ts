import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

// fallback defaults, hvis bruger ikke har gemt settings endnu
const DEFAULTS = {
  et0_threshold_mm: 3.5,
  rain_skip_mm: 1.5,
  hot_day_c: 26
}

const todayStr = () => new Date().toISOString().slice(0,10)

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json({ error: 'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

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
      // Hent brugerens thresholds (eller defaults)
      const { data: us } = await admin
        .from('user_settings')
        .select('et0_threshold_mm, rain_skip_mm, hot_day_c')
        .eq('user_id', p.id)
        .maybeSingle()

      const et0Thresh = Number(us?.et0_threshold_mm ?? DEFAULTS.et0_threshold_mm)
      const rainSkip  = Number(us?.rain_skip_mm ?? DEFAULTS.rain_skip_mm)
      const hotDayC   = Number(us?.hot_day_c ?? DEFAULTS.hot_day_c)

      // Hent vejr
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

      // Beslutning med brugerens tærskler
      let shouldWater = false
      if (rain >= rainSkip) {
        shouldWater = false
      } else if (et0 >= et0Thresh) {
        shouldWater = true
      } else if (tmax >= hotDayC && rain < 1) {
        shouldWater = true
      }

      // Log historik med thresholds-resultat
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
            should_water: shouldWater,
            source: 'open-meteo'
          }, { onConflict: 'user_id,date' })
        if (!histErr) historyUpserts++
      }

      if (!shouldWater) { touchedUsers++; continue }

      // Auto-vanding kun for user_crops.auto_water = true
      const { data: ucs } = await admin
        .from('user_crops')
        .select('id, crop_id')
        .eq('user_id', p.id)
        .eq('auto_water', true)

      const rows = (ucs || []) as { id: string; crop_id: string }[]
      if (!rows.length) { touchedUsers++; continue }

      const cropIds = rows.map(r => r.crop_id).filter(Boolean)
      if (!cropIds.length) { touchedUsers++; continue }

      const { data: existing } = await admin
        .from('tasks')
        .select('crop_id')
        .eq('user_id', p.id)
        .eq('type', 'water')
        .eq('due_date', today)

      const set = new Set((existing || []).map((e: any) => e.crop_id))

      const toInsert = rows
        .filter(r => !set.has(r.crop_id))
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
      // videre
    }
  }

  return NextResponse.json({
    ok: true,
    users_checked: touchedUsers,
    tasks_created: createdTasks,
    history_upserts: historyUpserts
  })
}
