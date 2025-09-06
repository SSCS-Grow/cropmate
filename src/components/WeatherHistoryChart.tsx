'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine,
} from 'recharts'

type RowDB = {
  date: string
  et0_mm: number | null
  precipitation_mm: number | null
  tmax_c: number | null
  should_water: boolean | null
}

type RowChart = {
  i: number           // numerisk x-position
  date: string        // label
  et0: number
  rain: number
  tmax: number | null
  should: boolean
}
const [thresholds, setThresholds] = useState<{ et0:number; rain:number }>({ et0: 3.5, rain: 1.5 })


export default function WeatherHistoryChart() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [rows, setRows] = useState<RowChart[]>([])
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
        .select('date, et0_mm, precipitation_mm, tmax_c, should_water')
        .eq('user_id', uid)
        .order('date', { ascending: true }) // stigende for pæn x-akse
        .limit(14)
    const { data: us } = await supabase
        .from('user_settings')
        .select('et0_threshold_mm, rain_skip_mm')
        .eq('user_id', uid)
        .maybeSingle()

const et0Thr = Number(us?.et0_threshold_mm ?? 3.5)
const rainThr = Number(us?.rain_skip_mm ?? 1.5)
setThresholds({ et0: et0Thr, rain: rainThr })

      if (!alive) return
      if (error) {
        setRows([])
      } else {
        const mapped: RowChart[] = (data || []).map((r: RowDB, idx: number) => ({
          i: idx,
          date: r.date,
          et0: r.et0_mm ?? 0,
          rain: r.precipitation_mm ?? 0,
          tmax: r.tmax_c ?? null,
          should: !!r.should_water,
        }))
        setRows(mapped)
      }
      setLoading(false)
    })()
    return () => { alive = false }
  }, [supabase])

  const tooltipFormatter = (value: any, name: any) => {
    if (name === 'ET₀') return [`${value.toFixed?.(1) ?? value} mm`, 'ET₀']
    if (name === 'Nedbør') return [`${value.toFixed?.(1) ?? value} mm`, 'Nedbør']
    if (name === 'Tmax') return [`${Math.round(value)} °C`, 'Tmax']
    return [value, name]
  }

  const renderTick = (props: any) => {
    const { x, y, payload } = props
    const idx = payload.value as number
    const label = rows[idx]?.date ?? ''
    return (
      <text x={x} y={y + 12} textAnchor="middle" fontSize={12} fill="#334155">
        {label}
      </text>
    )
  }

  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Vejrhistorik – graf (14 dage)</h3>
        <span className="text-xs opacity-60">ET₀ (mm), Nedbør (mm), Tmax (°C) + vand-dage</span>
      </div>

      {loading ? (
        <div className="opacity-60 mt-2 text-sm">Henter…</div>
      ) : rows.length ? (
        <div className="mt-3 w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 10, right: 16, bottom: 16, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="i"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={renderTick}
                tickLine={false}
                interval={0}
              />
              {/* Venstre akse: mm (ET0, nedbør) */}
              <YAxis yAxisId="mm" orientation="left" tick={{ fontSize: 12 }} width={36} />
              {/* Højre akse: °C (Tmax) */}
              <YAxis yAxisId="c" orientation="right" tick={{ fontSize: 12 }} width={32} />
              <Tooltip
                labelFormatter={(val: any) => {
                  const idx = Number(val)
                  return rows[idx]?.date ?? ''
                }}
                formatter={tooltipFormatter}
              />
              <Legend />

              {/* --- Vand-dages highlights – også sidste dag --- */}
              {rows.map((r) => {
                if (!r.should) return null
                const x1 = r.i - 0.5
                const x2 = r.i + 0.5
                return (
                  <ReferenceArea
                    key={`water-${r.i}`}
                    x1={x1}
                    x2={x2}
                    y1={0}
                    y2="auto"
                    yAxisId="mm"
                    fillOpacity={0.12}
                  />
                )
              })}

              {/* --- Tærskel-linjer (mm-aksen) --- */}
             <ReferenceLine
                  yAxisId="mm"
                    y={thresholds.et0}
                    strokeDasharray="4 4"
                    ifOverflow="extendDomain"
                    label={{ value: `ET₀ tærskel ${thresholds.et0} mm`, position: 'right', fontSize: 12 }}
                />

            <ReferenceLine
                yAxisId="mm"
                y={thresholds.rain}
                strokeDasharray="2 6"
                ifOverflow="extendDomain"
                label={{ value: `Regn-skip ${thresholds.rain} mm`, position: 'right', fontSize: 12 }}
                />


              {/* Bar: Nedbør (mm) */}
              <Bar yAxisId="mm" dataKey="rain" name="Nedbør" />
              {/* Linje: ET₀ (mm) */}
              <Line yAxisId="mm" type="monotone" dataKey="et0" name="ET₀" dot={false} />
              {/* Linje: Tmax (°C) */}
              <Line yAxisId="c" type="monotone" dataKey="tmax" name="Tmax" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm opacity-70 mt-2">Ingen historik endnu.</p>
      )}
      <p className="text-[11px] opacity-60 mt-2">
        Grå highlights markerer vand-dage (💧). Stiplede linjer viser ET₀-tærskel og (valgfrit) regn-skip.
      </p>
    </section>
  )
}
