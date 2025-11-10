// src/app/api/cron/insights/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { computeInsights } from '@/lib/insights'

function authCron(req: Request) {
  const key = process.env.CRON_SECRET
  const header = req.headers.get('authorization') || req.headers.get('x-cron-secret') || ''
  return key && (header === key || header === `Bearer ${key}`)
}

export async function GET(req: Request) {
  if (!authCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Hent alle aktive abonnementer
  const { data: subs, error } = await supabaseAdmin
    .from('insight_subscriptions')
    .select('*')
    .eq('active', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let alertsCreated = 0

  for (const s of subs || []) {
    const bbox = {
      minLat: s.bbox_min_lat,
      minLng: s.bbox_min_lng,
      maxLat: s.bbox_max_lat,
      maxLng: s.bbox_max_lng,
    }

    const { insights } = await computeInsights({ bbox, days: s.days })
    const filtered = insights.filter((it) => {
      const passTrend = it.trendPct >= s.threshold_pct
      const passCount = it.recent >= s.min_recent
      const passHaz = !s.hazards || s.hazards.length === 0 ? true : s.hazards.includes(it.hazard.toLowerCase())
      return passTrend && passCount && passHaz
    })

    if (filtered.length === 0) continue

    // Skriv alerts – type 'insight' (din UI håndterer generisk type)
    const rows = filtered.map((it) => ({
      user_id: s.user_id,
      type: 'insight',
      severity: it.severity === 'high' ? 5 : it.severity === 'medium' ? 3 : 1,
      message: `${it.hazard}: ${it.message}`,
      valid_from: new Date().toISOString(),
      valid_to: null,
      hazard_id: null,
    }))

    const { error: insErr } = await supabaseAdmin.from('alerts').insert(rows)
    if (!insErr) alertsCreated += rows.length
  }

  return NextResponse.json({ ok: true, subscriptions: (subs || []).length, alertsCreated })
}
