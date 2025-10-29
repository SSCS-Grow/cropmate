// src/hooks/useInsights.ts
'use client'

import { useEffect, useState } from 'react'

export type Insight = {
  hazard: string
  recent: number
  previous: number
  trendPct: number
  message: string
  severity: 'low' | 'medium' | 'high'
  suggestion: string
}

export function useInsights(params?: { bbox?: [number, number, number, number]; days?: number }) {
  const [data, setData] = useState<{ insights: Insight[]; meta: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const u = new URL('/api/insights', window.location.origin)
    if (params?.bbox) u.searchParams.set('bbox', params.bbox.join(','))
    if (params?.days) u.searchParams.set('days', String(params.days))

    setLoading(true)
    fetch(u.toString())
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then((j) => {
        setData(j)
        setLoading(false)
      })
      .catch((e) => {
        setError(e as Error)
        setLoading(false)
      })
  }, [params?.bbox?.join(','), params?.days])

  return { data, loading, error }
}
