'use client'

import Image from 'next/image'
import React, { use, useEffect, useState } from 'react'
import useSupabaseBrowser from '@/hooks/useSupabaseBrowser'
import HazardReportsMap from '@/components/HazardReportsMap'

type ReportRow = {
  id: string
  created_at: string
  severity: number | null
  message: string | null
  photo_url: string | null
  user_id: string
  crop_id: string | null
  status: 'visible' | 'flagged' | 'hidden'
  crops?: { name: string } | null
}

export default function HazardDetailPage({
  params,
}: {
  // Next 15 leverer params som Promise -> unwrap med React.use()
  params: Promise<{ id: string }>
}) {
  const { id: hazardId } = use(params)
  const supabase = useSupabaseBrowser()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // Admin-lister
  const [flagged, setFlagged] = useState<ReportRow[]>([])
  const [hiddenList, setHiddenList] = useState<ReportRow[]>([])
  const [visibleRecent, setVisibleRecent] = useState<ReportRow[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  // Tjek admin-status
  useEffect(() => {
    if (!supabase) return
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setErr(null)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user.id
        let admin = false
        if (uid) {
          const p = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', uid)
            .maybeSingle()
          admin = Boolean(p.data?.is_admin)
        }
        if (!alive) return
        setIsAdmin(admin)
      } catch (e:any) {
        if (!alive) return
        setErr(e?.message || 'Kunne ikke hente profil.')
      } finally {
        if (!alive) return
        setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [supabase])

  // Hent admin-lister
  useEffect(() => {
    if (!isAdmin || !supabase) return
    let alive = true
    ;(async () => {
      // 1) Flagged
      const f = await supabase
        .from('hazard_reports')
        .select('id, created_at, severity, message, photo_url, user_id, crop_id, status, crops(name)')
        .eq('hazard_id', hazardId)
        .eq('status', 'flagged')
        .order('created_at', { ascending: false })
        .limit(500)

      // 2) Hidden
      const h = await supabase
        .from('hazard_reports')
        .select('id, created_at, severity, message, photo_url, user_id, crop_id, status, crops(name)')
        .eq('hazard_id', hazardId)
        .eq('status', 'hidden')
        .order('created_at', { ascending: false })
        .limit(500)

      // 3) Visible (seneste 90 dage – til revision)
      const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString()
      const v = await supabase
        .from('hazard_reports')
        .select('id, created_at, severity, message, photo_url, user_id, crop_id, status, crops(name)')
        .eq('hazard_id', hazardId)
        .eq('status', 'visible')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500)

      if (!alive) return

      const mapRows = (rows: any[] | null): ReportRow[] =>
        (rows || []).map((r) => ({
          id: r.id,
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

      if (!f.error) setFlagged(mapRows(f.data))
      if (!h.error) setHiddenList(mapRows(h.data))
      if (!v.error) setVisibleRecent(mapRows(v.data))
    })()
    return () => { alive = false }
  }, [supabase, hazardId, isAdmin])

  // Status-ændring
  async function setStatus(reportId: string, next: 'visible' | 'hidden') {
    if (!supabase) return
    try {
      setBusyId(reportId)
      const { error } = await supabase
        .from('hazard_reports')
        .update({ status: next })
        .eq('id', reportId)
      if (error) throw error

      // Opdatér lister lokalt (flyt ud fra/ind i lister)
      setFlagged(prev => prev.filter(r => r.id !== reportId))
      if (next === 'hidden') {
        const moved = visibleRecent.find(r => r.id === reportId)
        if (moved) {
          setVisibleRecent(prev => prev.filter(r => r.id !== reportId))
          setHiddenList(prev => [{ ...moved, status: 'hidden' }, ...prev])
        } else {
          // måske kom den fra flagged
          const f = flagged.find(r => r.id === reportId)
          if (f) setHiddenList(prev => [{ ...f, status: 'hidden' }, ...prev])
        }
      } else if (next === 'visible') {
        const movedH = hiddenList.find(r => r.id === reportId)
        if (movedH) {
          setHiddenList(prev => prev.filter(r => r.id !== reportId))
          setVisibleRecent(prev => [{ ...movedH, status: 'visible' }, ...prev])
        } else {
          // måske kom den fra flagged
          const f = flagged.find(r => r.id === reportId)
          if (f) setVisibleRecent(prev => [{ ...f, status: 'visible' }, ...prev])
        }
      }
    } catch (e:any) {
      alert('Kunne ikke opdatere status: ' + (e?.message || e))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <div className="p-4 opacity-60">Indlæser hazard…</div>
  }

  if (err) {
    return <div className="p-4 text-red-600">{err}</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-4 grid gap-6">
      <header className="flex items-center justify-between">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold">
            Observationer & moderation{' '}
            <span className="text-sm align-middle opacity-60">#{hazardId.slice(0,8)}</span>
          </h1>
          <p className="text-sm opacity-80">
            Se observationer på kortet – og (hvis du er admin) moderér rapporter.
          </p>
        </div>

        {isAdmin && (
          <span
            className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50"
            title="Du er logget ind som admin (profiles.is_admin = true)"
          >
            🛡️ Admin
          </span>
        )}
      </header>

      {/* Kortet */}
      <section className="grid gap-2">
        <h2 className="text-lg font-semibold">Kort</h2>
        <HazardReportsMap hazardId={hazardId} />
      </section>

      {/* ADMIN: tre lister */}
      {isAdmin && (
        <section className="grid gap-6">
          {/* FLAGGED */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Flagged til gennemgang</h3>
              <span className="text-xs opacity-70">{flagged.length ? `${flagged.length} rapport(er)` : 'Ingen'}</span>
            </div>

            {!flagged.length ? (
              <div className="text-sm opacity-70">Ingen flagged rapporter for denne hazard.</div>
            ) : (
              <ul className="grid gap-3">
                {flagged.map((r) => (
                  <li key={r.id} className="p-3 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 grid gap-2">
                    <RowHeader r={r} />
                    <RowBody r={r} />
                    <RowActions
                      r={r}
                      busyId={busyId}
                      onShow={() => setStatus(r.id, 'visible')}
                      onHide={() => setStatus(r.id, 'hidden')}
                      showShow
                      showHide
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* HIDDEN */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Skjulte</h3>
              <span className="text-xs opacity-70">{hiddenList.length ? `${hiddenList.length} rapport(er)` : 'Ingen'}</span>
            </div>

            {!hiddenList.length ? (
              <div className="text-sm opacity-70">Ingen skjulte rapporter for denne hazard.</div>
            ) : (
              <ul className="grid gap-3">
                {hiddenList.map((r) => (
                  <li key={r.id} className="p-3 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 grid gap-2">
                    <RowHeader r={r} />
                    <RowBody r={r} />
                    <RowActions
                      r={r}
                      busyId={busyId}
                      onShow={() => setStatus(r.id, 'visible')}
                      onHide={undefined}
                      showShow
                      showHide={false}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* VISIBLE (seneste 90 dage) */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Synlige (seneste 90 dage)</h3>
              <span className="text-xs opacity-70">{visibleRecent.length ? `${visibleRecent.length} rapport(er)` : 'Ingen'}</span>
            </div>

            {!visibleRecent.length ? (
              <div className="text-sm opacity-70">Ingen synlige rapporter (seneste 90 dage).</div>
            ) : (
              <ul className="grid gap-3">
                {visibleRecent.map((r) => (
                  <li key={r.id} className="p-3 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 grid gap-2">
                    <RowHeader r={r} />
                    <RowBody r={r} />
                    <RowActions
                      r={r}
                      busyId={busyId}
                      onShow={undefined}
                      onHide={() => setStatus(r.id, 'hidden')}
                      showShow={false}
                      showHide
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

/** Små hjælpekomponenter for at holde filen overskuelig */
function RowHeader({ r }: { r: ReportRow }) {
  return (
    <div className="flex items-center justify-between">
      <div className="font-medium">
        {r.crops?.name || 'Afgrøde'} · Alvor: {r.severity ?? '-'}
      </div>
      <div className="text-xs opacity-60">
        {new Date(r.created_at).toLocaleString('da-DK')}
      </div>
    </div>
  )
}
function RowBody({ r }: { r: ReportRow }) {
  return (
    <>
      {r.message && (
        <div className="text-sm opacity-90">
          <span className="opacity-60">Note:</span> {r.message}
        </div>
      )}
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
      <span className="ml-auto text-xs opacity-60">#{r.id.slice(0,8)}</span>
    </div>
  )
}
