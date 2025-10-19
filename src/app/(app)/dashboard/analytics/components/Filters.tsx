'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useMemo } from 'react'

export default function Filters() {
  const sp = useSearchParams()
  const router = useRouter()

  const start = sp.get('start') ?? new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)
  const end = sp.get('end') ?? new Date().toISOString().slice(0, 10)
  const type = sp.get('type') ?? ''

  const update = (patch: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString())
    Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)))
    router.push(`?${params.toString()}`)
  }

  const types = useMemo(() => ['', 'pest', 'disease', 'other'], [])

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col">
        <label className="text-sm">Start</label>
        <input
          className="border rounded px-3 py-2"
          type="date"
          defaultValue={start}
          onChange={(e) => update({ start: e.target.value })}
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm">Slut</label>
        <input
          className="border rounded px-3 py-2"
          type="date"
          defaultValue={end}
          onChange={(e) => update({ end: e.target.value })}
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm">Type</label>
        <select
          className="border rounded px-3 py-2"
          defaultValue={type}
          onChange={(e) => update({ type: e.target.value })}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t || 'Alle'}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

