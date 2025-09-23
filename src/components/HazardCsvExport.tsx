'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

type CropOpt = { crop_id: string; name: string }

function toDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toCsv(rows: Array<Record<string, any>>): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const esc = (v: any) => {
    if (v == null) return ''
    const s = String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => esc(r[h])).join(',')),
  ]
  return lines.join('\n')
}

export default function HazardCsvExport({ hazardId }: { hazardId: string }) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const today = new Date()
  const defaultFrom = new Date(Date.now() - 30 * 24 * 3600 * 1000)

  // Filtre
  const [from, setFrom] = useState<string>(toDateInput(defaultFrom))
  const [to, setTo] = useState<string>(toDateInput(today))
  const [minSeverity, setMinSeverity] = useState<number>(1)
  const [cropId, setCropId] = useState<string>('') // tom = alle
  const [onlyMine, setOnlyMine] = useState<boolean>(false)
  const [cropOptions, setCropOptions] = useState<CropOpt[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Hent distinct afgrøder til dropdown (for den pågældende hazard)
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data, error } = await supabase
        .from('hazard_reports')
        .select('crop_id, crops(name)')
        .eq('hazard_id', hazardId)
        .not('crop_id', 'is', null)
        .limit(2000)

      if (!alive) return
      if (error) {
        console.error(error)
        return
      }
      const uniq = new Map<string, string>()
      for (const r of data || []) {
        const id = (r as any).crop_id as string
        const nm = (r as any).crops?.name || id
        if (id && !uniq.has(id)) uniq.set(id, nm)
      }
      setCropOptions(Array.from(uniq).map(([id, name]) => ({ crop_id: id, name })).sort((a, b) => a.name.localeCompare(b.name)))
    })()
    return () => { alive = false }
  }, [supabase, hazardId])

  // Hurtigvalg
  function setRangePreset(preset: '7'|'14'|'30'|'ytd'|'all') {
    const now = new Date()
    let start = new Date()
    if (preset === '7') start = new Date(Date.now() - 7 * 24 * 3600 * 1000)
    if (preset === '14') start = new Date(Date.now() - 14 * 24 * 3600 * 1000)
    if (preset === '30') start = new Date(Date.now() - 30 * 24 * 3600 * 1000)
    if (preset === 'ytd') start = new Date(now.getFullYear(), 0, 1)
    if (preset === 'all') start = new Date(Date.now() - 365 * 24 * 3600 * 1000)
    setFrom(toDateInput(start)); setTo(toDateInput(now))
  }

  async function handleExport(allFiltered: boolean) {
    try {
      setLoading(true)
      setErr(null)

      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id

      const fromIso = new Date(from + 'T00:00:00').toISOString()
      const toIso = new Date(to + 'T23:59:59').toISOString()

      let q = supabase
        .from('hazard_reports')
        .select('id, created_at, severity, latitude, longitude, photo_url, crop_id, crops(name), user_id')
        .eq('hazard_id', hazardId)
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false })
        .limit(10000)

      if (minSeverity > 1) q = q.gte('severity', minSeverity)
      if (cropId) q = q.eq('crop_id', cropId)
      if (!allFiltered && uid) q = q.eq('user_id', uid) // "kun mine" når allFiltered=false?
      if (allFiltered && onlyMine && uid) q = q.eq('user_id', uid) // eller respekter toggle

      const { data, error } = await q
      if (error) throw error

      const rows = (data || []).map((r: any) => ({
        id: r.id,
        created_at: r.created_at,
        severity: r.severity ?? null,
        crop_name: r.crops?.name || r.crop_id || '',
        latitude: r.latitude ?? null,
        longitude: r.longitude ?? null,
        photo_url: r.photo_url ?? null,
        user_id: r.user_id,
      }))

      const tag = `${from}_to_${to}${onlyMine ? '_mine' : ''}`
      const csv = toCsv(rows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hazard_${hazardId}_reports_${tag}${allFiltered ? '' : '_mine'}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      console.error(e)
      setErr(e?.message || 'Export fejlede')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 grid gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Eksportér rapporter (CSV)</h3>
      </div>

      {err && <div className="text-sm text-rose-700 bg-rose-50 p-2 rounded">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <label className="grid gap-1">
          <span className="text-xs opacity-70">Fra</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border px-2 py-1 rounded" />
        </label>

        <label className="grid gap-1">
          <span className="text-xs opacity-70">Til</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border px-2 py-1 rounded" />
        </label>

        <label className="grid gap-1">
          <span className="text-xs opacity-70">Min. alvorlighed</span>
          <select value={minSeverity} onChange={(e) => setMinSeverity(Number(e.target.value))} className="border px-2 py-1 rounded">
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs opacity-70">Afgrøde</span>
          <select value={cropId} onChange={(e) => setCropId(e.target.value)} className="border px-2 py-1 rounded">
            <option value="">Alle</option>
            {cropOptions.map(c => <option key={c.crop_id} value={c.crop_id}>{c.name}</option>)}
          </select>
        </label>

        <label className="flex items-end gap-2">
          <input id="onlyMine" type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          <span className="text-sm">Kun mine</span>
        </label>

        {/* Hurtigvalg */}
        <div className="flex items-end gap-2 flex-wrap">
          <button type="button" onClick={() => setRangePreset('7')}  className="text-xs px-2 py-1 rounded border hover:bg-slate-50">7 dage</button>
          <button type="button" onClick={() => setRangePreset('14')} className="text-xs px-2 py-1 rounded border hover:bg-slate-50">14 dage</button>
          <button type="button" onClick={() => setRangePreset('30')} className="text-xs px-2 py-1 rounded border hover:bg-slate-50">30 dage</button>
          <button type="button" onClick={() => setRangePreset('ytd')} className="text-xs px-2 py-1 rounded border hover:bg-slate-50">I år</button>
          <button type="button" onClick={() => setRangePreset('all')} className="text-xs px-2 py-1 rounded border hover:bg-slate-50">Alt</button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleExport(true)}
          className="text-sm px-3 py-2 rounded border hover:bg-slate-50"
          title="Eksportér alle rækker, der matcher filtrene ovenfor"
        >
          {loading ? 'Eksporterer…' : 'Export (alle filtrerede)'}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleExport(false)}
          className="text-sm px-3 py-2 rounded border hover:bg-slate-50"
          title="Eksportér kun dine egne rækker (respekterer filtrene)"
        >
          {loading ? 'Eksporterer…' : 'Export (kun mine)'}
        </button>
      </div>

      <p className="text-xs opacity-70">
        Bemærk: Eksporten kører med RLS, så du skal være logget ind. CSV indeholder: id, created_at, severity, crop_name, latitude, longitude, photo_url, user_id.
      </p>
    </div>
  )
}
