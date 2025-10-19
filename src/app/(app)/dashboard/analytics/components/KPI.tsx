'use client'
import { useEffect, useState } from 'react'

export default function KPI({
  label, id, field, start, end
}: {
  label: string; id: string; field: 'total'|'unique_types'|'unique_crops'|'last24h'
  start: string; end: string
}) {
  const [value, setValue] = useState<string>('—')

  useEffect(() => {
    const qs = new URLSearchParams({ start, end })
    fetch(`/api/analytics/kpis?${qs.toString()}`)
      .then((r) => r.json())
      .then((res) => setValue(String(res[field] ?? '—')))
      .catch(() => setValue('—'))
  }, [start, end, field])

  return (
    <div className="border rounded-2xl p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1" id={id}>{value}</div>
    </div>
  )
}
