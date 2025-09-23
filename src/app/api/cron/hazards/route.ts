import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

const MONTH = new Date().getMonth() + 1 // 1-12
const NEAR_KM = 100 // km radius for “nær”-rapporter
const TODAY = new Date().toISOString().slice(0, 10)

type Profile = { id: string; latitude: number | null; longitude: number | null }
type Hazard = { id: string; type: 'pest' | 'disease'; common_name: string }
type Host = { hazard_id: string; crop_id: string }
type Risk = { hazard_id: string; month: number; risk_level: number }
type Report = { hazard_id: string; latitude: number | null; longitude: number | null; created_at: string }
type UserCrop = { crop_id: string }

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lon - a.lon) * Math.PI / 180
  const la1 = a.lat * Math.PI / 180
  const la2 = b.lat * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json({ error: 'Missing server env' }, { status: 500 })
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

  // 1) Brugere med lokation (ellers kan vi ikke vurdere “nær” rapporter)
  const { data: profs, error: profErr } = await admin
    .from('profiles')
    .select('id, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })
  const users = (profs || []) as Profile[]

  // 2) Katalog + relationer + månedlig risiko + nylige rapporter (28 dage)
  const since = new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString()
  const [
    { data: hazards },
    { data: hosts },
    { data: risks },
    { data: reports },
  ] = await Promise.all([
    admin.from('hazards').select('id, type, common_name'),
    admin.from('hazard_hosts').select('hazard_id, crop_id'),
    admin.from('hazard_calendar').select('hazard_id, month, risk_level').eq('month', MONTH),
    admin.from('hazard_reports').select('hazard_id, latitude, longitude, created_at').gte('created_at', since),
  ])

  const H = new Map((hazards || [] as Hazard[]).map(h => [h.id, h]))
  const hostByHazard = new Map<string, string[]>()
  ;(hosts || [] as Host[]).forEach(x => {
    const arr = hostByHazard.get(x.hazard_id) || []
    arr.push(x.crop_id)
    hostByHazard.set(x.hazard_id, arr)
  })
  const riskByHazard = new Map<string, number>()
  ;(risks || [] as Risk[]).forEach(r => riskByHazard.set(r.hazard_id, r.risk_level))

  let alertsCreated = 0
  let tasksUpserted = 0

  // 3) Gennemgå brugere
  for (const u of users) {
    // Hent brugerens watchlist og crops
    const [{ data: watch }, { data: userCrops }] = await Promise.all([
      admin.from('user_watchlist').select('hazard_id').eq('user_id', u.id),
      admin.from('user_crops').select('crop_id').eq('user_id', u.id),
    ])
    const myCropIds = new Set((userCrops || [] as UserCrop[]).map(r => r.crop_id))
    const watchIds = new Set((watch || []).map((w: { hazard_id: string }) => w.hazard_id))

    // Kandidater: watchlist, ellers hazards som rammer mine crops
    const candidateHazards = (hazards || [] as Hazard[]).filter(hz => {
      if (watchIds.size) return watchIds.has(hz.id)
      const hostList = hostByHazard.get(hz.id) || []
      return hostList.some(cid => myCropIds.has(cid))
    })

    // Nær-rapporter for denne bruger
    const nearbyByHazard = new Set<string>()
    if (u.latitude != null && u.longitude != null) {
      const me = { lat: u.latitude, lon: u.longitude }
      for (const r of (reports || []) as Report[]) {
        if (r.latitude == null || r.longitude == null) continue
        const d = haversineKm(me, { lat: r.latitude, lon: r.longitude })
        if (d <= NEAR_KM) nearbyByHazard.add(r.hazard_id)
      }
    }

    // 4) For hver kandidat: lav alert (høj risiko i måned ELLER nær-rapporter)
    //    OG opret inspektionsopgaver i dag for mine relevante værtsafgrøder
    for (const hz of candidateHazards) {
      const risk = riskByHazard.get(hz.id) || 0
      const nearby = nearbyByHazard.has(hz.id)
      if (!(risk >= 4 || nearby)) continue

      // (a) ALERT
      const msg = nearby
        ? `${hz.common_name}: Nylige lokale observationer i nærheden. Tjek dine planter.`
        : `${hz.common_name}: Høj sæsonrisiko denne måned. Overvåg og forebyg.`
        await admin.from('alerts').insert({
          user_id: u.id,
          type: hz.type,                 // 'pest' | 'disease'
          severity: nearby ? 4 : 3,
          message: msg,
          hazard_id: hz.id,              //  <-- NYT
          valid_from: new Date().toISOString(),
          valid_to: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        })
      alertsCreated++

      // (b) INSPEKTIONSOPGAVER (type=other, due_date=today) for mine crops der er værter
      const hostList = hostByHazard.get(hz.id) || []
      const affectedMyCrops = hostList.filter(cid => myCropIds.has(cid))
      if (affectedMyCrops.length) {
        const rows = affectedMyCrops.map(cid => ({
          user_id: u.id,
          crop_id: cid,
          type: 'other' as const,
          due_date: TODAY,
          status: 'pending' as const,
          notes: `Inspektion: ${hz.common_name}`,
        }))

        // Upsert med konflikt-nøgle så vi ikke laver dubletter
        const { error } = await admin
          .from('tasks')
          .upsert(rows, {
            onConflict: 'user_id,crop_id,type,due_date',
            ignoreDuplicates: true,
          })
        if (!error) tasksUpserted += rows.length
        // Ved konflikt/dubletter ignoreres de — unikke indeks håndterer det
      }
    }
  }

  return NextResponse.json({
    ok: true,
    month: MONTH,
    alertsCreated,
    tasksUpsertedAttempted: tasksUpserted, // antal rækker vi forsøgte at upserte
  })
}
