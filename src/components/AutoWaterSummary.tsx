'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

export default function AutoWaterSummary() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [total, setTotal] = useState<number | null>(null)
  const [enabled, setEnabled] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { setTotal(0); setEnabled(0); setLoading(false); return }

      const { data } = await supabase
        .from('user_crops')
        .select('id, auto_water')
        .eq('user_id', uid)

      if (!alive) return
      const rows = (data || []) as { id: string; auto_water: boolean | null }[]
      const t = rows.length
      const e = rows.filter(r => !!r.auto_water).length
      setTotal(t); setEnabled(e)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [supabase])

  const pill =
    enabled && enabled > 0
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-slate-100 text-slate-800'

  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Auto-vanding status</h3>
          <p className="text-xs opacity-60">Styrer hvilke afgrøder der får opgaver automatisk på ET₀-dage.</p>
        </div>
        <a href="/my" className="text-xs underline">Administrér</a>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm">
        {loading ? (
          <span className="opacity-60">Henter…</span>
        ) : (
          <>
            <span className={`px-2 py-0.5 rounded ${pill}`}>
              {enabled} / {total} aktiveret
            </span>
            <span className="opacity-70">
              {enabled && enabled > 0
                ? 'Auto-vanding er slået til for nogle afgrøder.'
                : 'Ingen afgrøder har auto-vanding slået til endnu.'}
            </span>
          </>
        )}
      </div>
    </section>
  )
}
