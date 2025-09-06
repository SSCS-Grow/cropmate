'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'
import Link from 'next/link'

type TaskRow = {
  id: string
  user_id: string
  crop_id: string | null
  type: 'sow'|'transplant'|'fertilize'|'prune'|'water'|'harvest'|'other'
  due_date: string            // YYYY-MM-DD
  status: 'pending'|'done'|'skipped'
  notes: string | null
  crops?: { name: string } | null // vi henter navn via select relation
}

type TabKey = 'today'|'week'|'overdue'|'all'

export default function TasksPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [active, setActive] = useState<TabKey>('today')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // utils
  const todayStr = () => new Date().toISOString().slice(0,10)
  const startOfWeekStr = () => {
    const d = new Date()
    const day = d.getDay() || 7 // søn=0 -> 7
    d.setHours(0,0,0,0)
    d.setDate(d.getDate() - (day - 1)) // mandag
    return d.toISOString().slice(0,10)
  }
  const endOfWeekStr = () => {
    const d = new Date(startOfWeekStr())
    d.setDate(d.getDate() + 6) // søndag
    return d.toISOString().slice(0,10)
  }

  const load = async () => {
    setLoading(true)
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user.id || null
    if (!uid) { setUserId(null); setTasks([]); setLoading(false); return }
    setUserId(uid)

    // Hent alle tasks for brugeren + crop-navn (relation alias: crops)
    const { data, error } = await supabase
      .from('tasks')
      .select('id, user_id, crop_id, type, due_date, status, notes, crops(name)')
      .eq('user_id', uid)
      .order('due_date', { ascending: true })
    if (error) { console.error(error); setTasks([]); setLoading(false); return }

    setTasks(
      (data as any[]).map(row => ({
        ...row,
        crops: row.crops && Array.isArray(row.crops) && row.crops.length > 0
          ? { name: String(row.crops[0].name) }
          : null
      }))
    )
    setLoading(false)
  }

  useEffect(() => { load() }, []) // supabase er memoized

  // Filtrering til tabs
  const filtered = (() => {
    const t = tasks.filter(t => t.status === 'pending') // vis kun åbne
    const today = todayStr()
    if (active === 'all') return t
    if (active === 'today') return t.filter(x => x.due_date === today)
    if (active === 'week') {
      const s = startOfWeekStr(), e = endOfWeekStr()
      return t.filter(x => x.due_date >= s && x.due_date <= e)
    }
    if (active === 'overdue') return t.filter(x => x.due_date < today)
    return t
  })()

  const counts = {
    today: tasks.filter(t => t.status === 'pending' && t.due_date === todayStr()).length,
    week: (() => {
      const s = startOfWeekStr(), e = endOfWeekStr()
      return tasks.filter(t => t.status === 'pending' && t.due_date >= s && t.due_date <= e).length
    })(),
    overdue: tasks.filter(t => t.status === 'pending' && t.due_date < todayStr()).length,
    all: tasks.filter(t => t.status === 'pending').length
  }

  const markDone = async (id: string) => {
    setUpdatingId(id)
    try {
      const { error } = await supabase.from('tasks').update({ status: 'done' }).eq('id', id)
      if (error) throw error
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } as TaskRow : t))
    } catch (e) {
      console.error(e); alert('Kunne ikke markere som udført.')
    } finally { setUpdatingId(null) }
  }

  const snoozeToTomorrow = async (id: string) => {
    setUpdatingId(id)
    try {
      const t = tasks.find(x => x.id === id)
      if (!t) return
      const d = new Date(t.due_date); d.setDate(d.getDate() + 1)
      const newDate = d.toISOString().slice(0,10)
      const { error } = await supabase.from('tasks').update({ due_date: newDate }).eq('id', id)
      if (error) throw error
      setTasks(prev => prev.map(x => x.id === id ? { ...x, due_date: newDate } as TaskRow : x))
    } catch (e) {
      console.error(e); alert('Kunne ikke skubbe opgaven.')
    } finally { setUpdatingId(null) }
  }

  if (loading) return <div className="opacity-60 p-4">Indlæser opgaver…</div>
  if (!userId) return <div className="p-4">Log ind for at se dine opgaver.</div>

  const TabBtn = ({k, label}:{k:TabKey; label:string}) => (
    <button
      onClick={() => setActive(k)}
      className={[
        'px-3 py-2 rounded-full text-sm border',
        active===k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200'
      ].join(' ')}
    >
      {label}
      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-900">{counts[k]}</span>
    </button>
  )

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Opgaver</h1>
          <p className="text-sm opacity-70">Hold styr på hvad der skal gøres – i dag, denne uge og det forsinkede.</p>
        </div>
        <div className="text-right">
          <div className="text-sm">Åbne i alt</div>
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-900 text-white text-sm">
            {counts.all}
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        <TabBtn k="today" label="I dag" />
        <TabBtn k="week" label="Denne uge" />
        <TabBtn k="overdue" label="Forsinkede" />
        <TabBtn k="all" label="Alle" />
      </nav>

      {!filtered.length && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <p className="text-sm">Ingen opgaver i denne kategori. Gå til <Link className="underline" href="/crops">Katalog</Link> og tilføj/åbn afgrøder.</p>
        </div>
      )}

      <ul className="grid gap-3">
        {filtered.map(t => (
          <li key={t.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm opacity-60">{t.due_date}</div>
                <div className="font-medium capitalize">{t.type}</div>
                {t.crops?.name && (
                  <div className="text-sm">
                    Afgrøde: <Link href={`/crops/${t.crop_id}`} className="underline decoration-slate-300 hover:decoration-slate-900">{t.crops.name}</Link>
                  </div>
                )}
                {t.notes && <div className="text-sm opacity-80 mt-1">{t.notes}</div>}
              </div>
              <div className="flex flex-col gap-2 min-w-[200px] items-end">
                <button
                  onClick={() => markDone(t.id)}
                  disabled={updatingId === t.id}
                  className="px-3 py-2 rounded bg-slate-900 text-white text-xs"
                >
                  {updatingId === t.id ? 'Opdaterer…' : 'Markér som udført'}
                </button>
                <button
                  onClick={() => snoozeToTomorrow(t.id)}
                  disabled={updatingId === t.id}
                  className="px-3 py-2 rounded border border-slate-300 text-slate-900 text-xs hover:bg-slate-50"
                >
                  Skub til i morgen
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
