'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

type Row = { observed_date: string; count: number }

export default function TimeseriesChart({ start, end, type }: { start: string; end: string; type: string }) {
  const [data, setData] = useState<Row[]>([])

  useEffect(() => {
    const qs = new URLSearchParams({ start, end })
    if (type) qs.set('type', type)
    fetch(`/api/analytics/timeseries?${qs.toString()}`)
      .then((r) => r.json())
      .then((res) => setData(res.rows ?? []))
      .catch(() => setData([]))
  }, [start, end, type])

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
