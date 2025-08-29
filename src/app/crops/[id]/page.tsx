'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabaseBrowser from '@/lib/supabaseBrowser'

type Care = {
  sowing_window?: { from?: string; to?: string; method?: 'direct'|'indoor'|'both'; depth_cm?: number }
  transplant_window?: { from?: string; to?: string; note?: string }
  spacing?: { in_row_cm: number; between_rows_cm: number }
  sun?: 'full' | 'part'
  soil?: { pH_min?: number; pH_max?: number; drainage?: 'well'|'medium'|'heavy'; organic_matter?: 'low'|'medium'|'high' }
  watering?: { need: 'low'|'medium'|'high'; notes?: string }
  fertilizing?: { need: 'low'|'medium'|'high'; notes?: string }
  frost?: { sensitive: boolean; last_frost_safe: 'after' | 'tolerates_light' }
  harvest_window?: { from?: string; to?: string }
  notes?: string
  pests?: string[]
  diseases?: string[]
  greenhouse_ok?: boolean
}

type Crop = {
  id: string
  name: string
  scientific_name: string | null
  description: string | null
  care: Care | null
  category: string | null
}

export default function CropDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])  
  const [crop, setCrop] = useState<Crop | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [genTasks, setGenTasks] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data, error } = await supabase.from('crops').select('*').eq('id', id).maybeSingle()
      if (!alive) return
      if (error || !data) {
        alert('Kunne ikke hente afgrøden')
        router.push('/crops')
        return
      }
      setCrop(data as Crop)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [id, router, supabase])

  const prettyMethod = (m?: 'direct' | 'indoor' | 'both') =>
    m === 'direct' ? 'Direkte såning'
      : m === 'indoor' ? 'Forkultiver indendørs'
      : m === 'both' ? 'Direkte eller forkultiver'
      : undefined

  const windowLabel = (win?: { from?: string; to?: string }) => {
    if (!win?.from && !win?.to) return undefined
    const f = win.from ? win.from.replace('-', '/') : '?'
    const t = win.to ? win.to.replace('-', '/') : '?'
    return `${f} → ${t} (MM/DD)`
  }

  const tasksToCreate = useMemo(() => {
    if (!crop?.care) return []
    const nowYear = new Date().getFullYear()
    const parseMD = (md?: string) => {
      if (!md) return null
      const [mm, dd] = md.split('-').map(Number)
      if (!mm || !dd) return null
      return new Date(Date.UTC(nowYear, mm - 1, dd))
    }

    const t: Array<{ type: 'sow'|'transplant'|'fertilize'|'harvest'; due_date: string; notes?: string }> = []

    const sowFrom = parseMD(crop.care.sowing_window?.from)
    if (sowFrom) t.push({ type: 'sow', due_date: sowFrom.toISOString().slice(0,10), notes: prettyMethod(crop.care.sowing_window?.method) })

    const transFrom = parseMD(crop.care.transplant_window?.from)
    if (transFrom) t.push({ type: 'transplant', due_date: transFrom.toISOString().slice(0,10), notes: crop.care.transplant_window?.note })

    const harvFrom = parseMD(crop.care.harvest_window?.from)
    if (harvFrom) t.push({ type: 'harvest', due_date: harvFrom.toISOString().slice(0,10) })

    if (crop.care.fertilizing?.need === 'high' || crop.care.fertilizing?.need === 'medium') {
      const mid = new Date(Date.UTC(nowYear, 6, 1)) // 1. juli
      t.push({ type: 'fertilize', due_date: mid.toISOString().slice(0,10), notes: crop.care.fertilizing?.notes })
    }
    return t
  }, [crop])

  const addToMyGarden = async () => {
    if (!crop) return
    setAdding(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) { alert('Log ind først'); setAdding(false); return }
      const planted_on = new Date().toISOString().slice(0,10)

      const { error: insErr } = await supabase.from('user_crops').insert({ user_id: userId, crop_id: crop.id, planted_on })
      if (insErr) throw insErr

      if (genTasks && tasksToCreate.length) {
        const rows = tasksToCreate.map(t => ({
          user_id: userId,
          crop_id: crop.id,
          type: t.type,
          due_date: t.due_date,
          status: 'pending' as const,
          notes: t.notes ?? null
        }))
        await supabase.from('tasks').insert(rows)
      }

      alert('Tilføjet til din have ✔️')
    } catch (e) {
      console.error(e)
      alert('Kunne ikke tilføje – tjek login/permissions')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <div className="opacity-60">Henter…</div>
  if (!crop) return <div className="opacity-60">Afgrøde ikke fundet.</div>

  const c = crop.care

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{crop.name}</h1>
          {crop.scientific_name && <p className="opacity-70 italic">{crop.scientific_name}</p>}
          {crop.category && <p className="text-sm opacity-70 mt-1">Kategori: {crop.category}</p>}
        </div>

        <div className="flex flex-col items-end gap-2">
          <label className="text-xs flex items-center gap-2">
            <input type="checkbox" checked={genTasks} onChange={(e)=>setGenTasks(e.target.checked)} />
            Generér opgaver (så/udplant/gød/høst)
          </label>
          <button
            onClick={addToMyGarden}
            disabled={adding}
            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
          >
            {adding ? 'Tilføjer…' : 'Tilføj til min have'}
          </button>
        </div>
      </header>

      {crop.description && (
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <h3 className="font-medium mb-2">Beskrivelse</h3>
          <p className="text-sm leading-6">{crop.description}</p>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <h3 className="font-medium mb-2">Dyrkningsvinduer</h3>
          <ul className="text-sm space-y-2">
            <li><span className="font-medium">Såning: </span>{windowLabel(c?.sowing_window) || '—'} {c?.sowing_window?.method && <>• {prettyMethod(c?.sowing_window?.method)}</>}</li>
            <li><span className="font-medium">Udplantning: </span>{windowLabel(c?.transplant_window) || '—'} {c?.transplant_window?.note && <>• {c?.transplant_window?.note}</>}</li>
            <li><span className="font-medium">Høst: </span>{windowLabel(c?.harvest_window) || '—'}</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <h3 className="font-medium mb-2">Afstand & placering</h3>
          <ul className="text-sm space-y-2">
            <li><span className="font-medium">Afstand: </span>{c?.spacing ? `${c.spacing.in_row_cm} cm i rækken • ${c.spacing.between_rows_cm} cm mellem rækker` : '—'}</li>
            <li><span className="font-medium">Sol: </span>{c?.sun === 'full' ? 'Fuld sol' : c?.sun === 'part' ? 'Halvskygge' : '—'}</li>
            <li><span className="font-medium">Drivhus egnet: </span>{c?.greenhouse_ok ? 'Ja' : 'Nej/ikke nødvendigt'}</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <h3 className="font-medium mb-2">Jord & vand</h3>
          <ul className="text-sm space-y-2">
            <li><span className="font-medium">Jord: </span>
              {c?.soil
                ? [
                    c.soil.drainage ? (c.soil.drainage === 'well' ? 'veldrænet' : c.soil.drainage === 'medium' ? 'middeldrænet' : 'tung') : null,
                    c.soil.pH_min && c.soil.pH_max ? `pH ${c.soil.pH_min}–${c.soil.pH_max}` : null,
                    c.soil.organic_matter ? `organisk materiale: ${c.soil.organic_matter}` : null
                  ].filter(Boolean).join(' • ')
                : '—'}
            </li>
            <li><span className="font-medium">Vanding: </span>{c?.watering ? `${c.watering.need} behov` : '—'}{c?.watering?.notes ? ` • ${c.watering.notes}` : ''}</li>
            <li><span className="font-medium">Gødskning: </span>{c?.fertilizing ? `${c.fertilizing.need} behov` : '—'}{c?.fertilizing?.notes ? ` • ${c.fertilizing.notes}` : ''}</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <h3 className="font-medium mb-2">Frost & risici</h3>
          <ul className="text-sm space-y-2">
            <li><span className="font-medium">Frost: </span>
              {c?.frost ? (c.frost.sensitive ? 'Frostfølsom' : 'Tåler let frost') : '—'}
              {c?.frost?.last_frost_safe === 'after' ? ' • Udplant efter sidste frost' : c?.frost?.last_frost_safe === 'tolerates_light' ? ' • Tåler let frost' : ''}
            </li>
            <li><span className="font-medium">Skadedyr: </span>{c?.pests?.length ? c.pests.join(', ') : '—'}</li>
            <li><span className="font-medium">Sygdomme: </span>{c?.diseases?.length ? c.diseases.join(', ') : '—'}</li>
          </ul>
        </section>
      </div>

      {genTasks && tasksToCreate.length > 0 && (
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <h3 className="font-medium mb-2">Foreslåede opgaver (oprettes ved tilføjelse)</h3>
          <ol className="list-decimal pl-5 text-sm space-y-1">
            {tasksToCreate.map((t, i) => (
              <li key={i}>
                <span className="font-medium">{t.type}</span> – forfald {t.due_date}
                {t.notes ? ` • ${t.notes}` : ''}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
