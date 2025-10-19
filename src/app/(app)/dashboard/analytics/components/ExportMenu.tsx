'use client'
import { useSearchParams } from 'next/navigation'

export default function ExportMenu() {
  const sp = useSearchParams()
  const start = sp.get('start') ?? new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)
  const end = sp.get('end') ?? new Date().toISOString().slice(0, 10)
  const type = sp.get('type') ?? ''

  const params = new URLSearchParams({ start, end })
  if (type) params.set('type', type)

  const rawHref = `/api/analytics/export?${params.toString()}`
  const tsHref = `/api/analytics/export/timeseries?${params.toString()}`
  const bdHref = `/api/analytics/export/breakdown?${new URLSearchParams({ start, end, dim: 'type' }).toString()}`

  return (
    <div className="flex gap-2">
      <a href={rawHref} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
        ⬇ Rå data (CSV)
      </a>
      <a href={tsHref} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
        ⬇ Tidsserie (CSV)
      </a>
      <a href={bdHref} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
        ⬇ Top typer (CSV)
      </a>
    </div>
  )
}
