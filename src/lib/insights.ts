// src/lib/insights.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type Observation = {
  id: string
  lat: number
  lng: number
  hazard_slug: string | null
  created_at: string
}

export type BBox = { minLat: number; minLng: number; maxLat: number; maxLng: number }

export function daysAgoISO(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

export async function fetchWindowCounts(bbox: BBox | null, from: string, to: string) {
  let q = supabaseAdmin
    .from('observations')
    .select('id, lat, lng, hazard_slug, created_at', { count: 'exact' })
    .gte('created_at', from)
    .lte('created_at', to)

  if (bbox) {
    q = q
      .gte('lat', bbox.minLat).lte('lat', bbox.maxLat)
      .gte('lng', bbox.minLng).lte('lng', bbox.maxLng)
  }

  const { data, error } = await q
  if (error) throw error
  return (data || []) as Observation[]
}

export function aggregateTrends(recent: Observation[], previous: Observation[], days: number) {
  const countBy = (rows: Observation[]) =>
    rows.reduce<Record<string, number>>((acc, r) => {
      const k = (r.hazard_slug || 'unknown').toLowerCase()
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})

  const recentCounts = countBy(recent)
  const prevCounts = countBy(previous)
  const hazards = Array.from(new Set([...Object.keys(recentCounts), ...Object.keys(prevCounts)]))

  return hazards.map((hz) => {
    const r = recentCounts[hz] || 0
    const p = prevCounts[hz] || 0
    const trendPct = p === 0 ? (r > 0 ? 100 : 0) : Math.round(((r - p) / p) * 100)
    const severity = r >= 20 || trendPct >= 75 ? 'high' : r >= 8 || trendPct >= 35 ? 'medium' : 'low'
    const message =
      trendPct > 0
        ? `${hz} er oppe ${trendPct}% (sidste ${days} dage)`
        : trendPct < 0
        ? `${hz} er faldet ${Math.abs(trendPct)}% (sidste ${days} dage)`
        : `${hz} uændret (sidste ${days} dage)`

    const suggestion =
      severity === 'high'
        ? 'Øg scouting i marken, tjek fælder og behandlingsvindue.'
        : severity === 'medium'
        ? 'Planlæg et ekstra tjek de næste par dage.'
        : 'Fortsæt normal overvågning.'

    return { hazard: hz, recent: r, previous: p, trendPct, severity, message, suggestion }
  })
}

export async function computeInsights(params: { bbox?: BBox | null; days?: number }) {
  const days = Math.max(1, Math.min(30, params.days ?? 7))
  const nowISO = new Date().toISOString()
  const recentFrom = daysAgoISO(days)
  const prevFrom = daysAgoISO(days * 2)
  const prevTo = recentFrom

  const [recent, previous] = await Promise.all([
    fetchWindowCounts(params.bbox ?? null, recentFrom, nowISO),
    fetchWindowCounts(params.bbox ?? null, prevFrom, prevTo),
  ])

  const insights = aggregateTrends(recent, previous, days)
    .sort((a, b) => {
      const sevOrder = { high: 2, medium: 1, low: 0 } as const
      if (sevOrder[b.severity as keyof typeof sevOrder] !== sevOrder[a.severity as keyof typeof sevOrder]) {
        return sevOrder[b.severity as keyof typeof sevOrder] - sevOrder[a.severity as keyof typeof sevOrder]
      }
      return b.recent - a.recent
    })

  return {
    meta: {
      days,
      totals: { recent: recent.length, previous: previous.length },
    },
    insights,
  }
}
