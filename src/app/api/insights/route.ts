import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type BBox = { minLat: number; minLng: number; maxLat: number; maxLng: number }
type Observation = {
  id: string
  lat: number
  lng: number
  hazard_slug: string | null
  created_at: string
}

function parseBBox(searchParams: URLSearchParams): BBox | null {
  const bbox = searchParams.get('bbox')
  if (!bbox) return null
  const parts = bbox.split(',').map(Number)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null
  const [minLat, minLng, maxLat, maxLng] = parts
  return { minLat, minLng, maxLat, maxLng }
}

function daysAgoISO(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams
    const bbox = parseBBox(search) // valgfri
    const days = Math.max(1, Math.min(30, Number(search.get('days') || 7))) // 1..30

    // tidsvinduer
    const nowISO = new Date().toISOString()
    const recentFrom = daysAgoISO(days)
    const prevFrom = daysAgoISO(days * 2)
    const prevTo = recentFrom

    // base query builder
    const base = supabaseAdmin
      .from('observations')
      .select('id, lat, lng, hazard_slug, created_at', { count: 'exact' })

    // recent window
    let recentQuery = base
      .gte('created_at', recentFrom)
      .lte('created_at', nowISO)

    // previous window
    let prevQuery = base
      .gte('created_at', prevFrom)
      .lt('created_at', prevTo)

    // geo filter hvis bbox er angivet
    if (bbox) {
      const { minLat, minLng, maxLat, maxLng } = bbox
      recentQuery = recentQuery
        .gte('lat', minLat).lte('lat', maxLat)
        .gte('lng', minLng).lte('lng', maxLng)

      prevQuery = prevQuery
        .gte('lat', minLat).lte('lat', maxLat)
        .gte('lng', minLng).lte('lng', maxLng)
    }

    const [recentRes, prevRes] = await Promise.all([recentQuery, prevQuery])

    if (recentRes.error) throw recentRes.error
    if (prevRes.error) throw prevRes.error

    const recent = (recentRes.data || []) as Observation[]
    const prev = (prevRes.data || []) as Observation[]

    // Aggreger pr. hazard_slug
    const countBy = (rows: Observation[]) =>
      rows.reduce<Record<string, number>>((acc, r) => {
        const k = r.hazard_slug || 'unknown'
        acc[k] = (acc[k] || 0) + 1
        return acc
      }, {})

    const recentCounts = countBy(recent)
    const prevCounts = countBy(prev)

    // Kombiner nøgler
    const hazards = Array.from(new Set([...Object.keys(recentCounts), ...Object.keys(prevCounts)]))

    type Insight = {
      hazard: string
      recent: number
      previous: number
      trendPct: number // +50 betyder 50% stigning
      message: string
      severity: 'low' | 'medium' | 'high'
      suggestion: string
    }

    const insights: Insight[] = hazards
      .map((hz) => {
        const r = recentCounts[hz] || 0
        const p = prevCounts[hz] || 0
        const trendPct = p === 0 ? (r > 0 ? 100 : 0) : Math.round(((r - p) / p) * 100)

        // simple severities
        const severity: 'low' | 'medium' | 'high' =
          r >= 20 || trendPct >= 75 ? 'high' :
          r >= 8  || trendPct >= 35 ? 'medium' : 'low'

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

        return { hazard: hz, recent: r, previous: p, trendPct, message, severity, suggestion }
      })
      // sortér “vigtigst først”
      .sort((a, b) => {
        const sevOrder = { high: 2, medium: 1, low: 0 } as const
        if (sevOrder[b.severity] !== sevOrder[a.severity]) {
          return sevOrder[b.severity] - sevOrder[a.severity]
        }
        // ellers efter recent count
        return b.recent - a.recent
      })
      .slice(0, 6)

    return NextResponse.json({
      meta: {
        days,
        bbox: bbox || null,
        totals: {
          recent: recent.length,
          previous: prev.length,
        },
      },
      insights,
    })
  } catch (err: any) {
    console.error('[insights] error', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
