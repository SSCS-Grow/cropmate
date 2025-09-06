'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

type HistoryRow = {
  date: string
  et0_mm: number | null
  precipitation_mm: number | null
  tmax_c: number | null
}

export default function WeatherHistory() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { setRows([]); setLoading(false); return }

      const { data, error } = await supabase
        .from('weather_history')
        .select('date, et0_mm, precipitation_mm, tmax_c')
        .eq('user_id', uid)
        .order('date', { ascending: false })
        .limit(14) // seneste 14 dage

      if (!alive) return
      if (error) {
        setRows([])
      } else {
        setRows((data || []) as HistoryRow[])
      }
      setLoading(false)
    })()
    return () => { alive = false }
  }, [supabase])

  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Vejrhistorik (seneste 14 dage)</h3>
        <span className="text-xs opacity-60">ET₀, nedbør, Tmax</span>
      </div>

      {loading ? (
        <div className="opacity-60 mt-2 text-sm">Henter…</div>
      ) : rows.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="text-sm min-w-[520px]">
            <thead>
              <tr className="text-left opacity-70">
                <th className="py-1 pr-4">Dato</th>
                <th className="py-1 pr-4">ET₀ (mm)</th>
                <th className="py-1 pr-4">Nedbør (mm)</th>
                <th className="py-1 pr-4">Tmax (°C)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className="border-t border-slate-200/70">
                  <td className="py-1 pr-4">{r.date}</td>
                  <td className="py-1 pr-4">{r.et0_mm != null ? r.et0_mm.toFixed(1) : '—'}</td>
                  <td className="py-1 pr-4">{r.precipitation_mm != null ? r.precipitation_mm.toFixed(1) : '—'}</td>
                  <td className="py-1 pr-4">{r.tmax_c != null ? Math.round(r.tmax_c) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm opacity-70 mt-2">Ingen historik endnu. Når cron kører første gang i dag, dukker data op her.</p>
      )}
    </section>
  )
}