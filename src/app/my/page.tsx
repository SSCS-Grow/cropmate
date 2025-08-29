'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'
import Link from 'next/link'

type UserCropRow = {
  id: string
  crop_id: string
  planted_on: string | null
  notes: string | null
  crops: {
    name: string
    category: string | null
  } | null
}

type TaskRow = {
  id: string
  user_id: string
  crop_id: string | null
  type: 'sow' | 'transplant' | 'fertilize' | 'prune' | 'water' | 'harvest' | 'other'
  due_date: string
  status: 'pending' | 'done' | 'skipped'
  notes: string | null
}

type Filter = 'all' | 'withPending' | 'withoutPending'

export default function MyGardenPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<UserCropRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [removingUserCropId, setRemovingUserCropId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const load = async () => {
    setLoading(true)
    // 1) Session → userId
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user.id || null
    if (!uid) { setUserId(null); setRows([]); setTasks([]); setLoading(false); return }
    setUserId(uid)

    // 2) user_crops + crops
    const { data: uc, error: ucErr } = await supabase
      .from('user_crops')
      .select('id, crop_id, planted_on, notes, crops(name, category)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (ucErr) { console.error(ucErr); setRows([]); setTasks([]); setLoading(false); return }

    const cropIds = (uc || []).map(r => r.crop_id).filter(Boolean) as string[]

    // 3) tasks for disse cropIds
    let allTasks: TaskRow[] = []
    if (cropIds.length) {
      const { data: t, error: tErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', uid)
        .in('crop_id', cropIds)
      if (tErr) { console.error(tErr) }
      allTasks = (t || []) as TaskRow[]
    }

    setRows((uc || []) as UserCropRow[])
    setTasks(allTasks)
    setLoading(false)
  }

  useEffect(() => { load() /* initial load */ }, []) // supabase memoized, så [] er ok

  const pendingByCropCount = (cropId: string) =>
    tasks.filter(t => t.crop_id === cropId && t.status === 'pending').length

  const nextPendingByCrop = (cropId: string) =>
    tasks
      .filter(t => t.crop_id === cropId && t.status === 'pending')
      .sort((a,b) => a.due_date.localeCompare(b.due_date))[0] || null

  const markTaskDone = async (taskId: string) => {
    setUpdatingTaskId(taskId)
    try {
      const { error } = await supabase.from('tasks').update({ status: 'done' }).eq('id', taskId)
      if (error) throw error
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'done' } as TaskRow : t))
    } catch (e) {
      console.error(e)
      alert('Kunne ikke opdatere opgaven.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  // Fjern afgrøde (sletter user_crops-rækken + relaterede tasks for denne bruger/afgrøde)
  const removeUserCrop = async (userCrop: UserCropRow) => {
    if (!userId) return
    if (!confirm(`Fjern ${userCrop.crops?.name ?? 'afgrøde'} fra Min have?`)) return
    setRemovingUserCropId(userCrop.id)
    try {
      // 1) Slet tasks til denne afgrøde for bruger
      const { error: delTasksErr } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('crop_id', userCrop.crop_id)
      if (delTasksErr) throw delTasksErr

      // 2) Slet user_crops-rækken
      const { error: delUcErr } = await supabase
        .from('user_crops')
        .delete()
        .eq('id', userCrop.id)
        .eq('user_id', userId)
      if (delUcErr) throw delUcErr

      // 3) Opdater UI
      setRows(prev => prev.filter(r => r.id !== userCrop.id))
      setTasks(prev => prev.filter(t => t.crop_id !== userCrop.crop_id))
    } catch (e) {
      console.error(e)
      alert('Kunne ikke fjerne afgrøden.')
    } finally {
      setRemovingUserCropId(null)
    }
  }

  const filteredRows = rows.filter(r => {
    if (filter === 'withPending') return pendingByCropCount(r.crop_id) > 0
    if (filter === 'withoutPending') return pendingByCropCount(r.crop_id) === 0
    return true
  })

  if (loading) return <div className="opacity-60 p-4">Indlæser din have…</div>
  if (!userId) return <div className="p-4">Log ind for at se <span className="font-medium">Min have</span>.</div>

  const totalPending = tasks.filter(t => t.status === 'pending').length

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Min have</h1>
          <p className="text-sm opacity-70">Dine afgrøder, seneste status og næste opgave.</p>
        </div>
        <div className="text-right">
          <div className="text-sm">Åbne opgaver</div>
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-900 text-white text-sm">
            {totalPending}
          </div>
        </div>
      </header>

      <section className="flex items-center gap-3">
        <label className="text-sm">Filter:</label>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={filter}
          onChange={e => setFilter(e.target.value as Filter)}
        >
          <option value="all">Alle</option>
          <option value="withPending">Med åbne opgaver</option>
          <option value="withoutPending">Uden åbne opgaver</option>
        </select>
      </section>

      {!filteredRows.length && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <p className="text-sm">Ingen afgrøder matcher filteret. Gå til <Link className="underline" href="/crops">Katalog</Link> og tilføj flere 🌱</p>
        </div>
      )}

      <ul className="grid gap-4">
        {filteredRows.map((r) => {
          const next = nextPendingByCrop(r.crop_id)
          const pendingCount = pendingByCropCount(r.crop_id)
          const removing = removingUserCropId === r.id
          return (
            <li key={r.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium">
                    <Link href={`/crops/${r.crop_id}`} className="underline decoration-slate-300 hover:decoration-slate-900">
                      {r.crops?.name || 'Ukendt afgrøde'}
                    </Link>
                  </h3>
                  <p className="text-sm opacity-70">
                    {r.crops?.category ? `Kategori: ${r.crops.category}` : '—'}
                    {r.planted_on ? ` • Plantet: ${r.planted_on}` : ''}
                  </p>
                  {r.notes && <p className="text-sm mt-1">{r.notes}</p>}
                </div>

                <div className="text-right min-w-[220px]">
                  <div className="inline-flex items-center gap-2 px-2 py-1 mb-2 rounded-full bg-slate-100 text-slate-900 text-xs">
                    Åbne opgaver: <span className="font-medium">{pendingCount}</span>
                  </div>

                  {next ? (
                    <div className="text-sm">
                      <div className="font-medium">Næste opgave</div>
                      <div className="opacity-80 capitalize">{next.type} • {next.due_date}</div>
                      {next.notes && <div className="opacity-60">{next.notes}</div>}
                      <button
                        onClick={() => markTaskDone(next.id)}
                        disabled={updatingTaskId === next.id}
                        className="mt-2 px-3 py-2 rounded bg-slate-900 text-white text-xs"
                      >
                        {updatingTaskId === next.id ? 'Opdaterer…' : 'Markér som udført'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm opacity-60 mb-2">Ingen kommende opgaver</div>
                  )}

                  <button
                    onClick={() => removeUserCrop(r)}
                    disabled={removing}
                    className="mt-3 px-3 py-2 rounded border border-red-600 text-red-600 text-xs hover:bg-red-50"
                  >
                    {removing ? 'Fjerner…' : 'Fjern fra min have'}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
