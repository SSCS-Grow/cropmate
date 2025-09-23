'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'
import Link from 'next/link'

type HazardRow = {
  id: string
  type: 'pest' | 'disease'
  common_name: string
  scientific_name: string | null
  summary: string | null
}

type HostRow = { hazard_id: string; crop_id: string }
type WatchRow = { hazard_id: string }
type ReportRow = { hazard_id: string }

export default function HazardListPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])

  // Data
  const [hazards, setHazards] = useState<HazardRow[]>([])
  const [hosts, setHosts] = useState<HostRow[]>([])
  const [myCrops, setMyCrops] = useState<string[]>([])
  const [watch, setWatch] = useState<Set<string>>(new Set())
  const [reportCounts, setReportCounts] = useState<Map<string, number>>(new Map())
  const [loggedIn, setLoggedIn] = useState(false)

  // UI
  const [q, setQ] = useState('')
  const [onlyRelevant, setOnlyRelevant] = useState(false)
  const [onlyWatch, setOnlyWatch] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)

      // 1) Hent alle hazards (offentligt)
      const { data: hz } = await supabase
        .from('hazards')
        .select('id, type, common_name, scientific_name, summary')
        .order('common_name')

      // 2) Hent alle hazard_hosts (offentligt)
      const { data: hh } = await supabase
        .from('hazard_hosts')
        .select('hazard_id, crop_id')

      // 3) Session → mine crops + watchlist + nylige rapporter
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id ?? null
      setLoggedIn(!!uid)

      let myCropIds: string[] = []
      let myWatch = new Set<string>()
      let counts = new Map<string, number>()

      if (uid) {
        const [{ data: uc }, { data: wl }, { data: reps }] = await Promise.all([
          supabase.from('user_crops').select('crop_id').eq('user_id', uid),
          supabase.from('user_watchlist').select('hazard_id').eq('user_id', uid),
          // seneste 28 dage – kun hazard_id til badge
          supabase
            .from('hazard_reports')
            .select('hazard_id')
            .gte('created_at', new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString()),
        ])

        myCropIds = (uc || []).map((r: any) => r.crop_id)
        myWatch = new Set((wl || []).map((w: WatchRow) => w.hazard_id))

        counts = new Map<string, number>()
        ;(reps || []).forEach((r: ReportRow) => {
          const prev = counts.get(r.hazard_id) || 0
          counts.set(r.hazard_id, prev + 1)
        })
      }

      if (!alive) return
      setHazards((hz || []) as HazardRow[])
      setHosts((hh || []) as HostRow[])
      setMyCrops(myCropIds)
      setWatch(myWatch)
      setReportCounts(counts)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [supabase])

  const hostByHazard = useMemo(() => {
    const m = new Map<string, string[]>()
    hosts.forEach(h => {
      const arr = m.get(h.hazard_id) || []
      arr.push(h.crop_id)
      m.set(h.hazard_id, arr)
    })
    return m
  }, [hosts])

  const filtered = hazards.filter(h => {
    const textOk = q ? h.common_name.toLowerCase().includes(q.toLowerCase()) : true
    if (!textOk) return false

    if (onlyWatch && !watch.has(h.id)) return false

    if (onlyRelevant) {
      const hostList = hostByHazard.get(h.id) || []
      const relevant = hostList.some(cid => myCrops.includes(cid))
      if (!relevant) return false
    }

    return true
  })

  const toggleWatch = async (hazardId: string, next: boolean) => {
    if (!loggedIn) {
      alert('Log ind for at bruge “Overvåg”.')
      return
    }
    setSavingId(hazardId)
    try {
      if (next) {
        const { error } = await supabase.from('user_watchlist').insert({ hazard_id: hazardId })
        if (error) throw error
        setWatch(prev => new Set(prev).add(hazardId))
      } else {
        const { error } = await supabase
          .from('user_watchlist')
          .delete()
          .eq('hazard_id', hazardId)
        if (error) throw error
        setWatch(prev => {
          const copy = new Set(prev)
          copy.delete(hazardId)
          return copy
        })
      }
    } catch {
      alert('Kunne ikke opdatere watchlist.')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <div className="opacity-60 p-4">Indlæser…</div>

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Skadedyr & sygdom</h1>

      {/* Filtre */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Søg (fx 'bladlus')…"
          className="border rounded px-3 py-2 text-sm"
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyRelevant}
            onChange={(e) => setOnlyRelevant(e.target.checked)}
            disabled={!loggedIn}
          />
          Kun relevante for mine afgrøder
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyWatch}
            onChange={(e) => setOnlyWatch(e.target.checked)}
            disabled={!loggedIn}
          />
          Kun min watchlist
        </label>
        <span className="text-xs opacity-60 ml-auto">
          Viser {filtered.length} af {hazards.length}
        </span>
      </div>

      {/* Liste */}
      <ul className="grid gap-3">
        {filtered.map(h => {
          const isWatched = watch.has(h.id)
          const count = reportCounts.get(h.id) || 0
          return (
            <li key={h.id} className="p-3 rounded bg-white shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">
                      {h.common_name}{' '}
                      <span className="text-xs opacity-60">({h.type === 'pest' ? 'skadedyr' : 'sygdom'})</span>
                    </div>
                    {/* Badge: seneste rapporter */}
                    {count > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        {count} rapport{count === 1 ? '' : 'er'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-70 truncate">{h.scientific_name || '—'}</div>
                  {h.summary && <p className="text-sm opacity-80 mt-1 line-clamp-2">{h.summary}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link className="text-sm underline" href={`/hazards/${h.id}`}>
                    Se mere
                  </Link>
                  <button
                    onClick={() => toggleWatch(h.id, !isWatched)}
                    disabled={savingId === h.id || !loggedIn}
                    className={`px-3 py-1.5 rounded text-sm ${
                      isWatched ? 'bg-slate-200' : 'bg-slate-900 text-white'
                    }`}
                    title={loggedIn ? '' : 'Log ind for at overvåge'}
                  >
                    {savingId === h.id ? 'Gemmer…' : isWatched ? 'Overvåges' : 'Overvåg'}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {!filtered.length && (
        <p className="text-sm opacity-70">Ingen resultater med de valgte filtre.</p>
      )}
    </div>
  )
}
