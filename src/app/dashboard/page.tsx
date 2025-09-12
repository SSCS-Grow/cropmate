'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'
import WeatherCard from '@/components/WeatherCard'
import WaterAdvisor from '@/components/WaterAdvisor'
import AutoWaterSummary from '@/components/AutoWaterSummary'
import WeatherHistory from '@/components/WeatherHistory'
import WeatherHistoryChart from '@/components/WeatherHistoryChart'


type TaskType = 'sow' | 'transplant' | 'fertilize' | 'prune' | 'water' | 'harvest' | 'other'
type TaskStatus = 'pending' | 'done' | 'skipped'

type TaskRow = {
  id: string
  user_id: string
  crop_id: string | null
  type: TaskType
  due_date: string          // YYYY-MM-DD
  status: TaskStatus
  notes: string | null
  created_at: string
}

type AlertType = 'frost' | 'pest' | 'disease' | 'heat' | 'rain' | 'drought'

type AlertRow = {
  id: string
  user_id: string
  type: AlertType
  severity: number
  message: string
  valid_from: string | null
  valid_to: string | null
  created_at: string
}

export default function Dashboard() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // UNDO state
  const [undoOpen, setUndoOpen] = useState(false)
  const [undoLabel, setUndoLabel] = useState<string>('') // vises i toast
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastAction = useRef<{ taskId: string; prevStatus: TaskStatus } | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)

      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) {
        if (alive) {
          setLoggedIn(false)
          setTasks([])
          setAlerts([])
          setLoading(false)
        }
        return
      }
      setLoggedIn(true)

      const { data: tData } = await supabase
        .from('tasks')
        .select('id, user_id, crop_id, type, due_date, status, notes, created_at')
        .eq('user_id', uid)
        .order('due_date', { ascending: true })
        .limit(10)

      const { data: aData } = await supabase
        .from('alerts')
        .select('id, user_id, type, severity, message, valid_from, valid_to, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!alive) return
      setTasks((tData || []) as TaskRow[])
      setAlerts((aData || []) as AlertRow[])
      setLoading(false)
    })()
    return () => { alive = false }
  }, [supabase])

  const taskPill = (type: TaskType) =>
    type === 'sow'        ? 'bg-green-100 text-green-800' :
    type === 'transplant' ? 'bg-emerald-100 text-emerald-800' :
    type === 'fertilize'  ? 'bg-yellow-100 text-yellow-800' :
    type === 'prune'      ? 'bg-purple-100 text-purple-800' :
    type === 'water'      ? 'bg-blue-100 text-blue-800' :
    type === 'harvest'    ? 'bg-orange-100 text-orange-800' :
                            'bg-slate-100 text-slate-800'

  const statusPill = (status: TaskStatus) =>
    status === 'pending' ? 'bg-slate-100 text-slate-700' :
    status === 'done'    ? 'bg-green-200 text-green-800' :
    status === 'skipped' ? 'bg-red-100 text-red-800' :
                           'bg-slate-100 text-slate-700'

  const alertPill = (type: AlertType) =>
    type === 'frost'   ? 'bg-blue-100 text-blue-800' :
    type === 'heat'    ? 'bg-orange-100 text-orange-800' :
    type === 'rain'    ? 'bg-sky-100 text-sky-800' :
    type === 'drought' ? 'bg-amber-100 text-amber-800' :
    type === 'pest'    ? 'bg-lime-100 text-lime-800' :
    type === 'disease' ? 'bg-rose-100 text-rose-800' :
                         'bg-slate-100 text-slate-800'

  const showUndo = (task: TaskRow, newStatus: TaskStatus) => {
    // ryd tidligere timer
    if (undoTimer.current) { clearTimeout(undoTimer.current); undoTimer.current = null }
    lastAction.current = { taskId: task.id, prevStatus: task.status }
    setUndoLabel(`Markeret som ${newStatus === 'done' ? 'udført' : 'sprunget over'}`)
    setUndoOpen(true)
    // auto-hide efter 5 sek
    undoTimer.current = setTimeout(() => setUndoOpen(false), 5000)
  }

  const undoLast = async () => {
    const action = lastAction.current
    if (!action) return
    setUndoOpen(false)
    try {
      // Optimistisk UI
      setTasks(prev => prev.map(t => t.id === action.taskId ? { ...t, status: action.prevStatus } : t))
      const { error } = await supabase.from('tasks').update({ status: action.prevStatus }).eq('id', action.taskId)
      if (error) throw error
    } catch {
      alert('Kunne ikke fortryde. Prøv igen.')
    } finally {
      lastAction.current = null
    }
  }

  const updateTaskStatus = async (task: TaskRow, newStatus: TaskStatus) => {
    setUpdatingId(task.id)
    // Optimistisk UI-opdatering:
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    showUndo(task, newStatus)
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
      if (error) throw error
    } catch (e) {
      // Revert hvis fejl
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t))
      setUndoOpen(false)
      alert('Kunne ikke opdatere opgaven. Prøv igen.')
    } finally {
      setUpdatingId(null)
    }
  }

  const markDone = (t: TaskRow) => updateTaskStatus(t, 'done')
  const markSkipped = (t: TaskRow) => updateTaskStatus(t, 'skipped')

  if (loading) {
    return (
      <div className="grid gap-6">
        <WeatherCard />
        <div className="opacity-60">Indlæser dashboard…</div>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="grid gap-6">
        <WeatherCard />
        <div>Log ind for at se dine opgaver og varsler.</div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Vejr-kortet */}
      <WeatherCard />
      <WaterAdvisor />  {/* ← NY */}  
      <AutoWaterSummary /> {/* NY */}
      <WeatherHistoryChart /> {/* NY */}
      <WeatherHistory /> {/* NY */}
      

      {/* Opgaver */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Kommende opgaver</h2>
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="p-3 rounded-lg bg-white shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${taskPill(t.type)}`}>
                        {t.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusPill(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                    <span className="text-sm opacity-70">{t.due_date}</span>
                  </div>
                  {t.notes && <p className="text-sm mt-1 opacity-80">{t.notes}</p>}
                </div>

                <div className="flex flex-col gap-2 min-w-[180px] items-end">
                  <button
                    onClick={() => markDone(t)}
                    disabled={updatingId === t.id}
                    className="px-3 py-2 rounded bg-slate-900 text-white text-xs"
                  >
                    {updatingId === t.id ? 'Opdaterer…' : 'Udført'}
                  </button>
                  <button
                    onClick={() => markSkipped(t)}
                    disabled={updatingId === t.id}
                    className="px-3 py-2 rounded border border-slate-300 text-slate-900 text-xs hover:bg-slate-50"
                  >
                    Spring over
                  </button>
                </div>
              </div>
            </li>
          ))}
          {!tasks.length && <p className="text-sm opacity-70">Ingen opgaver endnu.</p>}
        </ul>
      </section>

      {/* Varsler */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Varsler</h2>
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="p-3 rounded-lg bg-white shadow">
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded ${alertPill(a.type)}`}>
                  {a.type}
                </span>
                <span className="text-sm opacity-70">
                  {new Date(a.created_at).toLocaleString('da-DK')}
                </span>
              </div>
              <p className="text-sm mt-1">{a.message}</p>
            </li>
          ))}
          {!alerts.length && <p className="text-sm opacity-70">Ingen varsler endnu.</p>}
        </ul>
      </section>

      {/* ------ UNDO TOAST ------ */}
      {undoOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg bg-slate-900 text-white">
            <span className="text-sm">{undoLabel}</span>
            <button
              onClick={undoLast}
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              Fortryd
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
