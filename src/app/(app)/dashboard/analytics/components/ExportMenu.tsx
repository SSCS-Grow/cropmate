'use client'
export default function ExportMenu({ start, end, type }: { start: string; end: string; type: string }) {
  const params = new URLSearchParams({ start, end })
  if (type) params.set('type', type)
  const rawHref = `/api/analytics/export?${params.toString()}`
  const tsHref  = `/api/analytics/export/timeseries?${params.toString()}`
  const bdHref  = `/api/analytics/export/breakdown?${new URLSearchParams({ start, end, dim: 'type' }).toString()}`

  return (
    <div className="flex gap-2">
      <a href={rawHref} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">⬇ Rå data (CSV)</a>
      <a href={tsHref}  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">⬇ Tidsserie (CSV)</a>
      <a href={bdHref}  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">⬇ Top typer (CSV)</a>
    </div>
  )
}
