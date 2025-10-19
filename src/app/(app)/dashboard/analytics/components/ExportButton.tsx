'use client'
import { useSearchParams } from 'next/navigation'

export default function ExportButton() {
  const sp = useSearchParams()
  const start = sp.get('start') ?? new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)
  const end = sp.get('end') ?? new Date().toISOString().slice(0, 10)
  const type = sp.get('type') ?? ''

  const params = new URLSearchParams({ start, end })
  if (type) params.set('type', type)

  const href = `/api/analytics/export?${params.toString()}`

  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
    >
      <span>⬇</span>
      <span>Export CSV</span>
    </a>
  )
}
