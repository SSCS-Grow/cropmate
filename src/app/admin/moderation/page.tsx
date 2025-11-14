'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import useSupabaseBrowser from '@/hooks/useSupabaseBrowser'

type ReportRow = {
  id: string
  hazard_id: string
  created_at: string
  severity: number | null
  message: string | null
  photo_url: string | null
  user_id: string
  crop_id: string | null
  status: 'visible' | 'flagged' | 'hidden'
  crops?: { name: string } | null
}

function toDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function GlobalModerationPage() {
  const supabase = useSupabaseBrowser()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Filtre
  const today = new Date()
  const since90 = new Date(Date.now() - 90 * 24 * 3600 * 1000)
  const [hazardFilter, setHazardFilter] = useState<string>('') // valgfri: filtrer på hazard_id
  const [from, setFrom] = useState<string>(toDateInput(since90))
  const [to, setTo] = useState<string>(toDateInput(today))
  const [minSeverity, setMinSeverity] = useState<number>(1)

  // Lister
  const [flagged, setFlagged] = useState<ReportRow[]>([])
  const [hiddenList, setHiddenList] = useState<ReportRow[]>([])
  const [visibleRecent, setVisibleRecent] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // 1) Tjek admin
  useEffect(() => {
    if (!supabase) return
    let alive = true
    ;(async () => {
      try {
        setErr(null)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user.id
        if (!uid) { if (alive) setIsAdmin(false); return }
        const { data, error } = await supabase.from('profiles').select('is_admin').eq('id', uid).maybeSingle()
        if (error) throw error
        if (alive) setIsAdmin(Boolean(data?.is_admin))
      } catch (e: any) {
        if (alive) { setIsAdmin(false); setErr(e?.message || 'Kunne ikke tjekke admin-status.') }
      }
    })()
    return () => { alive = false }
  }, [supabase])

  // 2) Hent data (kun admin)
  useEffect(() => {
    if (!isAdmin || !supabase) return
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setErr(null)

        const fromIso = new Date(from + 'T00:00:00').toISOString()
        const toIso = new Date(to + 'T23:59:59').toISOString()

        // Base vælger
        const selectCols = 'id, hazard_id, created_at, severity, message, photo_url, user_id, crop_id, status, crops(name)'

        const base = supabase.from('hazard_reports').select(selectCols)

        // FLAGGED
        let qFlag = base.eq('status', 'flagged')
        if (hazardFilter) qFlag = qFlag.eq('hazard_id', hazardFilter)
        if (minSeverity > 1) qFlag = qFlag.gte('severity', minSeverity)
        const fP = qFlag.order('created_at', { ascending: false }).limit(1000)

        // HIDDEN
        let qHidden = base.eq('status', 'hidden')
        if (hazardFilter) qHidden = qHidden.eq('hazard_id', hazardFilter)
        if (minSeverity > 1) qHidden = qHidden.gte('severity', minSeverity)
        const hP = qHidden.order('created_at', { ascending: false }).limit(1000)

        // VISIBLE (i datointerval)
        let qVis = base.eq('status', 'visible').gte('created_at', fromIso).lte('created_at', toIso)
        if (hazardFilter) qVis = qVis.eq('hazard_id', hazardFilter)
        if (minSeverity > 1) qVis = qVis.gte('severity', minSeverity)
        const vP = qVis.order('created_at', { ascending: false }).limit(1000)

        const [f, h, v] = await Promise.all([fP, hP, vP])

        const mapRows = (rows: any[] | null): ReportRow[] =>
          (rows || []).map((r) => ({
            id: r.id,
            hazard_id: r.hazard_id,
            created_at: r.created_at,
            severity: r.severity ?? null,
            message: r.message ?? null,
            photo_url: r.photo_url ?? null,
            user_id: r.user_id,
            crop_id: r.crop_id,
            status: r.status,
            crops:
              r.crops && !Array.isArray(r.crops)
                ? { name: r.crops?.name }
                : Array.isArray(r.crops) && r.crops.length > 0
                ? { name: r.crops[0]?.name }
                : null,
          }))

        if (!alive) return
        if (f.error) throw f.error
        if (h.error) throw h.error
        if (v.error) throw v.error

        setFlagged(mapRows(f.data))
        setHiddenList(mapRows(h.data))
        setVisibleRecent(mapRows(v.data))
      } catch (e:any) {
        if (alive) setErr(e?.message || 'Kunne ikke hente data.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [supabase, isAdmin, hazardFilter, from, to, minSeverity])

  async function setStatus(reportId: string, next: 'visible' | 'hidden') {
    if (!supabase) return
    try {
      setBusyId(reportId)
      const { error } = await supabase.from('hazard_reports').update({ status: next }).eq('id', reportId)
      if (error) throw error

      // Flyt element mellem listerne lokalt
      setFlagged(prev => prev.filter(r => r.id !== reportId))
      if (next === 'hidden') {
        const fromV = visibleRecent.find(r => r.id === reportId)
        if (fromV) {
          setVisibleRecent(prev => prev.filter(r => r.id !== reportId))
          setHiddenList(prev => [{ ...fromV, status: 'hidden' }, ...prev])
        }
      } else {
        const fromH = hiddenList.find(r => r.id === reportId)
        if (fromH) {
          setHiddenList(prev => prev.filter(r => r.id !== reportId))
          setVisibleRecent(prev => [{ ...fromH, status: 'visible' }, ...prev])
        }
      }
    } catch (e:any) {
      alert('Kunne ikke opdatere status: ' + (e?.message || e))
    } finally {
      setBusyId(null)
    }
  }

  function exportCsv(rows: ReportRow[], filename: string) {
    if (!rows.length) { alert('Ingen rækker at eksportere.'); return }
    const headers = ['id','hazard_id','created_at','status','severity','crop_name','user_id','photo_url','message']
    const esc = (v: any) => {
      if (v == null) return ''
      const s = String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.id,
        r.hazard_id,
        r.created_at,
        r.status,
        r.severity ?? '',
        r.crops?.name || '',
        r.user_id,
        r.photo_url ?? '',
        r.message ?? '',
      ].map(esc).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isAdmin === null) {
    return <div className="max-w-5xl mx-auto p-4 text-sm opacity-70">Tjekker admin-status…</div>
  }
  if (!isAdmin) {
    return <div className="max-w-5xl mx-auto p-4 text-sm">Du har ikke adgang til denne side.</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-4 grid gap-6">
      <header className="flex items-center justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold">Global moderation</h1>
          <p className="text-sm opacity-80">Gennemse og moderér rapporter på tværs af alle hazards.</p>
        </div>
      </header>

      {/* Filtre */}
      <section className="p-3 bg-white rounded-xl shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1">
            <span className="text-xs opacity-70">Hazard ID (valgfrit)</span>
            <input value={hazardFilter} onChange={(e)=>setHazardFilter(e.target.value.trim())} placeholder="fx 0bad016c-…" className="border px-2 py-1 rounded w-[260px]" />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-70">Fra (for Visible)</span>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="border px-2 py-1 rounded" />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-70">Til (for Visible)</span>
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="border px-2 py-1 rounded" />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-70">Min. alvorlighed</span>
            <select value={minSeverity} onChange={(e)=>setMinSeverity(Number(e.target.value))} className="border px-2 py-1 rounded">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          <div className="ml-auto text-sm opacity-70">{loading ? 'Indlæser…' : 'Klar'}</div>
        </div>
      </section>

      {err && <div className="text-sm text-rose-700 bg-rose-50 p-3 rounded">{err}</div>}

      {/* FLAGGED */}
      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Flagged</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">{flagged.length} stk</span>
            <button
              className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
              onClick={() => exportCsv(flagged, 'flagged.csv')}
              disabled={!flagged.length}
            >
              Export CSV
            </button>
          </div>
        </div>

        {flagged.length === 0 ? (
          <div className="text-sm opacity-70">Ingen flagged rapporter.</div>
        ) : (
          <ul className="grid gap-3">
            {flagged.map((r) => (
              <li key={r.id} className="p-3 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 grid gap-2">
                <RowHeader r={r} />
                <RowBody r={r} />
                <RowActions
                  r={r} busyId={busyId}
                  onShow={() => setStatus(r.id, 'visible')}
                  onHide={() => setStatus(r.id, 'hidden')}
                  showShow showHide
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* HIDDEN */}
      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Hidden</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">{hiddenList.length} stk</span>
            <button
              className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
              onClick={() => exportCsv(hiddenList, 'hidden.csv')}
              disabled={!hiddenList.length}
            >
              Export CSV
            </button>
          </div>
        </div>

        {hiddenList.length === 0 ? (
          <div className="text-sm opacity-70">Ingen skjulte rapporter.</div>
        ) : (
          <ul className="grid gap-3">
            {hiddenList.map((r) => (
              <li key={r.id} className="p-3 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 grid gap-2">
                <RowHeader r={r} />
                <RowBody r={r} />
                <RowActions
                  r={r} busyId={busyId}
                  onShow={() => setStatus(r.id, 'visible')}
                  onHide={undefined}
                  showShow
                  showHide={false}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* VISIBLE (date range) */}
      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Visible (datointerval)</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">{visibleRecent.length} stk</span>
            <button
              className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
              onClick={() => exportCsv(visibleRecent, 'visible.csv')}
              disabled={!visibleRecent.length}
            >
              Export CSV
            </button>
          </div>
        </div>

        {visibleRecent.length === 0 ? (
          <div className="text-sm opacity-70">Ingen synlige rapporter i perioden.</div>
        ) : (
          <ul className="grid gap-3">
            {visibleRecent.map((r) => (
              <li key={r.id} className="p-3 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 grid gap-2">
                <RowHeader r={r} />
                <RowBody r={r} />
                <RowActions
                  r={r} busyId={busyId}
                  onShow={undefined}
                  onHide={() => setStatus(r.id, 'hidden')}
                  showShow={false}
                  showHide
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function RowHeader({ r }: { r: ReportRow }) {
  return (
    <div className="flex items-center justify-between">
      <div className="font-medium">
        {r.crops?.name || 'Afgrøde'} · Alvor: {r.severity ?? '-'} · <span className="opacity-70 text-xs">Hazard:</span> <code className="text-xs">{r.hazard_id.slice(0,8)}</code>
      </div>
      <div className="text-xs opacity-60">{new Date(r.created_at).toLocaleString('da-DK')}</div>
    </div>
  )
}
function RowBody({ r }: { r: ReportRow }) {
  return (
    <>
      {r.message && <div className="text-sm opacity-90"><span className="opacity-60">Note:</span> {r.message}</div>}
      {r.photo_url && (
        <div>
          <Image
            src={r.photo_url}
            alt="foto"
            width={360}
            height={220}
            style={{ maxWidth: 360, maxHeight: 220, borderRadius: 8, objectFit: 'cover', width: '100%', height: 'auto' }}
            unoptimized
          />
        </div>
      )}
      <div className="text-xs opacity-60 break-all">Rapport-ID: {r.id}</div>
    </>
  )
}
function RowActions({
  r, busyId, onShow, onHide, showShow, showHide
}: {
  r: ReportRow
  busyId: string | null
  onShow?: () => void
  onHide?: () => void
  showShow: boolean
  showHide: boolean
}) {
  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      {showShow && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded border hover:bg-green-50 border-green-200 text-green-700 disabled:opacity-50"
          onClick={onShow}
          disabled={busyId === r.id}
          title="Gør synlig igen (status → visible)"
        >
          ✅ Vis igen
        </button>
      )}
      {showHide && (
        <button
          type="button"
          className="text-xs px-2 py-1 rounded border hover:bg-rose-50 border-rose-200 text-rose-700 disabled:opacity-50"
          onClick={onHide}
          disabled={busyId === r.id}
          title="Skjul/afpublicér (status → hidden)"
        >
          🗑️ Skjul
        </button>
      )}
      <span className="ml-auto text-xs opacity-60">Bruger: {r.user_id.slice(0,8)}</span>
    </div>
  )
}
