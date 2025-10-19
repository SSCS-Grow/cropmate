'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function TopList({ title, dim }: { title: string; dim: 'type' }) {
  const sp = useSearchParams()
  const [rows, setRows] = useState<{ label: string; count: number }[]>([])

  useEffect(() => {
    const start = sp.get('start') ?? ''
    const end = sp.get('end') ?? ''
    if (!start || !end) return
    const qs = new URLSearchParams({ dim, start, end })
    fetch(`/api/analytics/breakdown?${qs.toString()}`)
      .then((r) => r.json())
      .then((res) => setRows(res.rows ?? []))
      .catch(() => setRows([]))
  }, [sp, dim])

  return (
    <div className="border rounded-2xl p-4">
      <div className="font-medium mb-2">{title}</div>
      <ul className="space-y-1">
        {rows.map((r, i) => (
          <li key={i} className="flex justify-between">
            <span className="truncate">{r.label || '—'}</span>
            <span className="font-mono">{r.count}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-gray-500">Ingen data</li>}
      </ul>
    </div>
  )
}
