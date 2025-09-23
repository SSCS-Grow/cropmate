'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

type UserCropRow = {
  id: string
  user_id: string
  crop_id: string
  planted_on: string | null
  location_note: string | null
  notes: string | null
  auto_water: boolean | null
  crops?: { name: string } | null
}

type SupabaseSession =
  | {
      session: {
        user: { id: string }
        access_token: string
      } | null
    }
  | { session: null }

export default function MyGardenPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])

  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [rows, setRows] = useState<UserCropRow[]>([])

  // Filtre / UI
  const [q, setQ] = useState('') // søg på afgrødenavn
  const [showOnlyAuto, setShowOnlyAuto] = useState<'all' | 'auto'>('all')

  // Gem-status for toggle
  const [savingId, setSavingId] = useState<string | null>(null)

  // Bulk-generator status
  const [bulkGenLoading, setBulkGenLoading] = useState(false)
  const [bulkGenMsg, setBulkGenMsg] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)

      const { data: session } = await supabase.auth.getSession()
      const uid = (session as SupabaseSession).session?.user.id ?? null
      if (!uid) {
        if (alive) {
          setLoggedIn(false)
          setRows([])
          setLoading(false)
        }
        return
      }
      setLoggedIn(true)

      const { data, error } = await supabase
        .from('user_crops')
        .select('id, user_id, crop_id, planted_on, location_note, notes, auto_water, crops(name)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (!alive) return
      if (error || !data) {
        setRows([])
      } else {
        setRows(
          (data as any[]).map(row => ({
            ...row,
            crops: Array.isArray(row.crops) && row.crops.length > 0
              ? { name: String(row.crops[0].name ?? '') }
              : null,
          }))
        )
      }
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [supabase])

  const handleToggle = async (uc: UserCropRow, next: boolean) => {
    setSavingId(uc.id)
    // Optimistisk UI
    setRows(prev => prev.map(r => (r.id === uc.id ? { ...r, auto_water: next } : r)))
    try {
      const { error } = await supabase
        .from('user_crops')
        .update({ auto_water: next })
        .eq('id', uc.id)
      if (error) throw error
    } catch {
      // revert ved fejl
      setRows(prev => prev.map(r => (r.id === uc.id ? { ...r, auto_water: !next } : r)))
      alert('Kunne ikke opdatere auto-vanding. Prøv igen.')
    } finally {
      setSavingId(null)
    }
  }

  const filtered = rows.filter(r => {
    const name = r.crops?.name || '(ukendt)'
    const textMatch = q ? name.toLowerCase().includes(q.toLowerCase()) : true
    const autoMatch = showOnlyAuto === 'auto' ? !!r.auto_water : true
    return textMatch && autoMatch
  })

  async function generateForAll() {
    try {
      setBulkGenLoading(true)
      setBulkGenMsg(null)

      const { data: session } = await supabase.auth.getSession()
      const token = (session as SupabaseSession).session?.access_token
      if (!token) {
        alert('Log ind først.')
        setBulkGenLoading(false)
        return
      }

      const res = await fetch('/api/user/generate-tasks-for-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = (await res.json()) as { ok?: boolean; generated?: number; error?: string }
      if (!res.ok) {
        setBulkGenMsg('Kunne ikke generere opgaver.')
      } else {
        const count = typeof json.generated === 'number' ? json.generated : 0
        setBulkGenMsg(
          `Oprettet ${count} opgave(r) (forsøg). Dubletter undgås af unik-indekset.`
        )
      }
    } catch {
      setBulkGenMsg('Kunne ikke generere opgaver.')
    } finally {
      setBulkGenLoading(false)
    }
  }

  if (loading) return <div className="opacity-60 p-4">Indlæser “Min have”…</div>
  if (!loggedIn) return <div className="p-4">Log ind for at se din have.</div>

  return (
    <div className="grid gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Min have</h1>
          <p className="text-sm opacity-70">
            Slå <strong>Auto-vanding</strong> til for de afgrøder, der må få vandingsopgaver automatisk på ET₀-dage.
          </p>
        </div>
      </header>

      {/* Bulk-generator sektion */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="font-medium mb-1">Opgavegenerator</h3>
        <p className="text-sm opacity-70 mb-2">
          Opret standardopgaver (så/udplant/gød/beskær/vand/høst) for alle dine afgrøder ud fra
          skabeloner.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={generateForAll}
            disabled={bulkGenLoading}
            className="px-3 py-2 rounded bg-slate-900 text-white text-sm"
          >
            {bulkGenLoading ? 'Genererer…' : 'Generér opgaver for alle'}
          </button>
          {bulkGenMsg && <span className="text-xs opacity-70">{bulkGenMsg}</span>}
        </div>
      </section>

      {/* Filtre */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Søg på afgrødenavn…"
          className="border rounded px-3 py-2 text-sm"
        />
        <select
          value={showOnlyAuto}
          onChange={(e) => setShowOnlyAuto(e.target.value as 'all' | 'auto')}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">Vis alle</option>
          <option value="auto">Kun Auto-vanding</option>
        </select>
        <div className="text-xs opacity-70 ml-auto">
          {filtered.length} af {rows.length} vises
        </div>
      </div>

      {/* Liste */}
      <ul className="grid gap-3">
        {filtered.map((uc) => {
          const name = uc.crops?.name || '(ukendt afgrøde)'
          return (
            <li
              key={uc.id}
              className="p-3 rounded-lg bg-white shadow flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{name}</div>
                <div className="text-xs opacity-70">
                  {uc.planted_on ? `Plantet: ${uc.planted_on}` : 'Plantet: —'}
                  {uc.location_note ? ` • Placering: ${uc.location_note}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm opacity-80">Auto-vanding</div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!uc.auto_water}
                    onChange={(e) => handleToggle(uc, e.target.checked)}
                    disabled={savingId === uc.id}
                  />
                  <span className="text-xs opacity-60">
                    {savingId === uc.id ? 'Gemmer…' : uc.auto_water ? 'Til' : 'Fra'}
                  </span>
                </label>
              </div>
            </li>
          )
        })}
      </ul>

      {!filtered.length && (
        <p className="text-sm opacity-70">Ingen afgrøder matcher filtrene.</p>
      )}
    </div>
  )
}
