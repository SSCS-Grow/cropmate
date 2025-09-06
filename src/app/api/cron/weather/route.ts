import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Tærskler (kan justeres)
const HEAT_THRESHOLD = 28       // °C i de næste 48 timer
const RAIN_DAILY_MM = 12        // mm næste døgn
const DROUGHT_DAYS = 5          // antal dage vi kigger frem
const DROUGHT_TOTAL_MM = 2      // mm over perioden → tørke

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

  const now = new Date()
  const dayStartIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const dayEndIso = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  let checked = 0
  for (const p of profiles || []) {
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.searchParams.set('latitude', String(p.latitude))
      url.searchParams.set('longitude', String(p.longitude))
      url.searchParams.set('hourly', 'temperature_2m,precipitation')
      url.searchParams.set('daily', 'temperature_2m_max,precipitation_sum')
      url.searchParams.set('forecast_days', '7')
      url.searchParams.set('timezone', 'Europe/Copenhagen')

      const res = await fetch(url.toString(), { cache: 'no-store' })
      const wx = await res.json()

      const hourlyTimes: string[] = wx?.hourly?.time ?? []
      const hourlyTemp: number[] = wx?.hourly?.temperature_2m ?? []
      const dailyTimes: string[] = wx?.daily?.time ?? []
      const dailyTmax: number[] = wx?.daily?.temperature_2m_max ?? []
      const dailyPrec: number[] = wx?.daily?.precipitation_sum ?? []

      // ---- Detektioner ----
      // HEAT: mindst én time >= threshold i 48 timer
      let heat = false
      const heatValidTo = new Date(Date.now() + 48 * 3600 * 1000)
      for (let i=0;i<hourlyTimes.length;i++) {
        const t = new Date(hourlyTimes[i])
        if (t > heatValidTo) break
        if (typeof hourlyTemp[i] === 'number' && hourlyTemp[i] >= HEAT_THRESHOLD) { heat = true; break }
      }

      // RAIN: dagens nedbør ≥ RAIN_DAILY_MM
      let rain = false
      if (dailyTimes.length && dailyPrec.length) {
        const rain24 = dailyPrec[0] ?? 0
        if (rain24 >= RAIN_DAILY_MM) rain = true
      }

      // DROUGHT: næste X dage samlet ≤ DROUGHT_TOTAL_MM
      let drought = false
      if (dailyTimes.length >= DROUGHT_DAYS) {
        const sum = dailyPrec.slice(0, DROUGHT_DAYS).reduce((a,b)=>a+(b||0), 0)
        if (sum <= DROUGHT_TOTAL_MM) drought = true
      }

      // ---- Indsæt alerts (undgå dubletter) ----
      const alertsToInsert: Array<{type:'heat'|'rain'|'drought', message:string, severity:number, valid_from:string, valid_to:string}> = []

      if (heat) {
        alertsToInsert.push({
          type: 'heat',
          message: `Høj temperatur forventes (≥ ${HEAT_THRESHOLD}°C) inden for 48 timer – planlæg vanding/skygge.`,
          severity: 3,
          valid_from: now.toISOString(),
          valid_to: new Date(Date.now() + 48*3600*1000).toISOString()
        })
      }
      if (rain) {
        alertsToInsert.push({
          type: 'rain',
          message: `Kraftig regn forventes (≥ ${RAIN_DAILY_MM} mm) det næste døgn – beskyt sarte planter og krukker.`,
          severity: 2,
          valid_from: dayStartIso,
          valid_to: dayEndIso
        })
      }
      if (drought) {
        alertsToInsert.push({
          type: 'drought',
          message: `Lav nedbør de næste ${DROUGHT_DAYS} dage (≤ ${DROUGHT_TOTAL_MM} mm) – øg vandingsfrekvens.`,
          severity: 2,
          valid_from: dayStartIso,
          valid_to: new Date(now.getFullYear(), now.getMonth(), now.getDate() + DROUGHT_DAYS).toISOString()
        })
      }

      for (const a of alertsToInsert) {
        await admin.from('alerts').insert({
          user_id: p.id,
          type: a.type,
          severity: a.severity,
          message: a.message,
          valid_from: a.valid_from,
          valid_to: a.valid_to
        })
      }

      checked++
    } catch (e) {
      // sluk fejl for enkeltbruger, fortsæt loop
    }
  }

  return NextResponse.json({ ok: true, checked })
}