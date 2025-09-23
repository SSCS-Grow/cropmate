'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

type MyCrop = { crop_id: string; crops: { name: string } | null }
type Props = { hazardId: string }

export default function ReportWizard({ hazardId }: Props) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [myCrops, setMyCrops] = useState<MyCrop[]>([])
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  // form state
  const [cropId, setCropId] = useState<string>('')
  const [severity, setSeverity] = useState<number>(3)
  const [note, setNote] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) return

      // 1) Hent brugerens afgrøder
      const { data: uc } = await supabase
        .from('user_crops')
        .select('crop_id, crops(name)')
        .eq('user_id', uid)

      // DEDUPE pr. crop_id + sortér efter navn
      const list = (uc || []).map((c: any) => ({
        crop_id: c.crop_id,
        crops: Array.isArray(c.crops) && c.crops.length > 0 ? { name: String(c.crops[0].name) } : null
      })) as MyCrop[]
      const uniq = new Map<string, MyCrop>()
      for (const c of list) {
        if (!uniq.has(c.crop_id)) uniq.set(c.crop_id, c)
      }
      const sorted = Array.from(uniq.values()).sort((a, b) =>
        (a.crops?.name || '').localeCompare(b.crops?.name || '')
      )

      if (!alive) return
      setMyCrops(sorted)

      // 2) Brug profil-lokation hvis muligt
      const { data: prof } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', uid)
        .maybeSingle()

      if (prof?.latitude != null && prof?.longitude != null) {
        if (!alive) return
        setLat(prof.latitude)
        setLng(prof.longitude)
      } else if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        // 3) Fallback: browser geolocation (kan afvises af brugeren)
        navigator.geolocation.getCurrentPosition(
          p => {
            if (!alive) return
            setLat(p.coords.latitude)
            setLng(p.coords.longitude)
          },
          _err => { /* bruger kan udfylde felter manuelt */ }
        )
      }
    })()
    return () => { alive = false }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!hazardId) { setMsg('Ukendt trussel.'); return }
    if (!cropId)   { setMsg('Vælg en af dine afgrøder.'); return }

    setBusy(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { setMsg('Log ind først.'); setBusy(false); return }

      // 1) Upload foto (valgfrit)
      let photo_url: string | null = null
      if (file) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const filename = `${crypto.randomUUID()}.${ext}`
        const path = `${uid}/${hazardId}/${filename}`

        const { error: upErr } = await supabase.storage.from('reports').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })
        if (upErr) throw upErr

        const { data } = supabase.storage.from('reports').getPublicUrl(path)
        photo_url = data.publicUrl
      }

      // 2) Indsæt rapport
      const payload = {
        user_id: uid,
        hazard_id: hazardId,
        crop_id: cropId,
        severity,
        note: note || null,
        latitude: lat,
        longitude: lng,
        photo_url,
      }
      const { error: insErr } = await supabase.from('hazard_reports').insert(payload)
      if (insErr) throw insErr

      setMsg('Tak! Din observation er gemt ✅')
      // reset
      setNote('')
      setFile(null)
    } catch (err: any) {
      setMsg(err?.message || 'Kunne ikke gemme rapport.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-1">
        <label className="text-sm">Afgrøde</label>
        <select
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">— vælg fra “Min have” —</option>
          {(myCrops ?? []).map((c, i) => (
            <option key={`${c.crop_id}-${i}`} value={c.crop_id}>
              {c.crops?.name || c.crop_id}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Alvorlighed (1–5)</label>
        <input
          type="range"
          min={1}
          max={5}
          value={severity}
          onChange={(e) => setSeverity(Number(e.target.value))}
        />
        <div className="text-xs opacity-70">Valgt: {severity}/5</div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Note (valgfri)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="border px-3 py-2 rounded"
          placeholder="Beskriv fund, stadie, antal, skader osv."
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Foto (valgfri)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <p className="text-xs opacity-60">Upload gemmes i Storage bucket “reports”.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Latitude</span>
          <input
            value={lat ?? ''}
            onChange={(e) => setLat(e.target.value ? Number(e.target.value) : null)}
            className="border px-3 py-2 rounded"
            placeholder="fx 55.676"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Longitude</span>
          <input
            value={lng ?? ''}
            onChange={(e) => setLng(e.target.value ? Number(e.target.value) : null)}
            className="border px-3 py-2 rounded"
            placeholder="fx 12.568"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="px-3 py-2 rounded bg-slate-900 text-white text-sm"
        >
          {busy ? 'Gemmer…' : 'Indsend observation'}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </form>
  )
}
