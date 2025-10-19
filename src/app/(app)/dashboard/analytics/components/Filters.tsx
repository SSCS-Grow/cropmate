'use client'
import { useRouter } from 'next/navigation'

export default function Filters({
  start, end, type,
}: { start: string; end: string; type: string }) {
  const router = useRouter()

  const update = (patch: Record<string, string>) => {
    const params = new URLSearchParams({ start, end, type })
    Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)))
    router.push(`?${params.toString()}`)
  }

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
          {['', 'pest', 'disease', 'other'].map((t) => (
            <option key={t} value={t}>{t || 'Alle'}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

