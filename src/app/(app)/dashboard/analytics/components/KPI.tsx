'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function KPI({ label, id, field }: { label: string; id: string; field: 'total'|'unique_types'|'unique_crops'|'last24h' }) {
  const sp = useSearchParams()
  const [value, setValue] = useState<string>('—')

  useEffect(() => {
    const start = sp.get('start') ?? ''
    const end = sp.get('end') ?? ''
    if (!start || !end) return
    const qs = new URLSearchParams({ start, end })

    fetch(`/api/analytics/kpis?${qs.toString()}`)
      .then((r) => r.json())
      .then((res) => setValue(String(res[field] ?? '—')))
      .catch(() => setValue('—'))
  }, [sp, field])

  return (
    <div className="border rounded-2xl p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1" id={id}>{value}</div>
    </div>
  )
}
