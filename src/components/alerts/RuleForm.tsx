'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type GardenRow = { id: string; name: string };

type RuleDraft = {
  name: string
  is_enabled: boolean
  garden_id: string | null
  condition: any
}

export default function RuleForm() {
  const supabase = useMemo(() => createClient(), [])
  const [gardens, setGardens] = useState<GardenRow[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string>()

  useEffect(() => {
    ;(async () => {
      const { data } = await (supabase as any)
        .from('gardens')
        .select('id,name')
        .order('name', { ascending: true })
      setGardens((data ?? []) as GardenRow[])
    })()
  }, [supabase])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setMsg(undefined)

    const fd = new FormData(e.currentTarget)
    const metric = String(fd.get('metric')||'temp') // 'temp'|'rain'|'wind'
    const op = String(fd.get('op')||'<')
    const value = Number(fd.get('value')||0)
    const windowHours = Number(fd.get('windowHours')||6)
    const garden_id = String(fd.get('garden_id')||'') || null

    const draft: RuleDraft = {
      name: String(fd.get('name')||'Vejrregel'),
      is_enabled: true,
      garden_id,
      condition: { kind: 'weather', metric, op, value, windowHours }
    }

    const { error } = await (supabase as any)
      .from('alert_rules')
      .insert(draft as any)

    setSaving(false)
    setMsg(error ? error.message : 'Regel gemt ✅')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <input name="name" placeholder="Navn på regel" className="p-2 rounded border" />
        <select name="garden_id" className="p-2 rounded border">
          <option value="">Alle haver</option>
          {gardens.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <div className="grid md:grid-cols-4 gap-2">
        <select name="metric" className="p-2 rounded border">
          <option value="temp">Temp (°C, min)</option>
          <option value="rain">Regn (mm, sum)</option>
          <option value="wind">Vind (m/s, max)</option>
        </select>
        <select name="op" className="p-2 rounded border">
          <option value="<">&lt;</option>
          <option value=">">&gt;</option>
          <option value=">=">≥</option>
          <option value="<=">≤</option>
          <option value="=">=</option>
        </select>
        <input type="number" step="any" name="value" placeholder="Værdi" className="p-2 rounded border" />
        <input type="number" name="windowHours" defaultValue={6} className="p-2 rounded border" title="Vindue (timer)" />
      </div>
      <button disabled={saving} className="px-4 py-2 rounded-2xl bg-black text-white">Gem regel</button>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </form>
  )
}
