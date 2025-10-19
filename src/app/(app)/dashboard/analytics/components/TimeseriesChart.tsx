'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

type Row = { observed_date: string; count: number }

export default function TimeseriesChart() {
  const sp = useSearchParams()
  const [data, setData] = useState<Row[]>([])

  useEffect(() => {
    const start = sp.get('start') ?? ''
    const end = sp.get('end') ?? ''
    const type = sp.get('type') ?? ''
    if (!start || !end) return

    const qs = new URLSearchParams({ start, end })
    if (type) qs.set('type', type)

    fetch(`/api/analytics/timeseries?${qs.toString()}`)
      .then((r) => r.json())
      .then((res) => setData(res.rows ?? []))
      .catch(() => setData([]))
  }, [sp])

  return (
    <div className="border rounded-2xl p-4">
      <div className="font-medium mb-2">Tidsserie</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="observed_date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
