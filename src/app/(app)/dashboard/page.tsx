// src/app/(app)/dashboard/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

import { createClient } from '@/lib/supabase/client' // browser-Supabase klient
import PushCta from '@/components/settings/PushCta'
import ServiceWorkerReady from '@/components/system/ServiceWorkerReady'
import InsightsPanel from '@/components/insights/InsightsPanel'

// ——— Lazy-loadede kort/vejr-komponenter ———
const WeatherCard = dynamic(
  () => import('@/components/WeatherCard').then((m) => m.default ?? (m as any)),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 opacity-60">
        Indlæser vejr…
      </div>
    ),
  }
)

const AutoWaterSummary = dynamic(
  () => import('@/components/AutoWaterSummary').then((m) => m.default ?? (m as any)),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 opacity-60">
        Indlæser vandingsoversigt…
      </div>
    ),
  }
)

const WaterAdvisor = dynamic(
  () => import('@/components/WaterAdvisor').then((m) => m.default ?? (m as any)),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 opacity-60">
        Indlæser vandingsråd…
      </div>
    ),
  }
)

const WeatherHistory = dynamic(
  () => import('@/components/WeatherHistory').then((m) => m.default ?? (m as any)),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 opacity-60">
        Indlæser vejrhistorik…
      </div>
    ),
  }
)

// ——— Types ———
type TaskType =
  | 'sow'
  | 'transplant'
  | 'fertilize'
  | 'prune'
  | 'water'
  | 'harvest'
  | 'other'

type TaskStatus = 'pending' | 'done' | 'skipped'

type TaskRow = {
  id: string
  user_id: string
  crop_id: string | null
  type: TaskType
  due_date: string
  status: TaskStatus
  notes: string | null
}

type AlertKind = 'frost' | 'pest' | 'disease' | string

type AlertRow = {
  id: string
  user_id: string
  type: AlertKind
  severity: number | null
  message: string | null
  created_at: string
  valid_from: string | null
  valid_to: string | null
  hazard_id?: string | null
}

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        setLoading(false)
        return
      }

      const [{ data: t, error: tErr }, { data: a, error: aErr }] = await Promise.all([
        (supabase as any)
          .from('tasks')
          .select('*')
          .order('due_date', { ascending: true })
          .limit(20),
        (supabase as any)
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      if (!alive) return
      if (!tErr) setTasks((t || []) as TaskRow[])
      if (!aErr) setAlerts((a || []) as AlertRow[])
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [supabase])

  const taskPill = (type: TaskType) =>
    type === 'sow'
      ? 'bg-green-100 text-green-800'
      : type === 'transplant'
      ? 'bg-emerald-100 text-emerald-800'
      : type === 'fertilize'
      ? 'bg-yellow-100 text-yellow-800'
      : type === 'prune'
      ? 'bg-purple-100 text-purple-800'
      : type === 'water'
      ? 'bg-blue-100 text-blue-800'
      : type === 'harvest'
      ? 'bg-orange-100 text-orange-800'
      : 'bg-slate-100 text-slate-800'

  function alertBadge(a: AlertRow) {
    switch (a.type) {
      case 'frost':
        return { cls: 'bg-sky-100 text-sky-800', label: 'Frost', icon: '❄️' }
      case 'pest':
        return { cls: 'bg-rose-100 text-rose-800', label: 'Skadedyr', icon: '🐛' }
      case 'disease':
        return { cls: 'bg-amber-100 text-amber-900', label: 'Sygdom', icon: '🦠' }
      default:
        return { cls: 'bg-slate-100 text-slate-800', label: a.type, icon: '🔔' }
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const todaysInspections = tasks.filter(
    (t) => t.notes?.startsWith('Inspektion:') && t.due_date === today
  ).length

  // ——— Opgavehandlinger ———
  async function setTaskStatus(id: string, newStatus: TaskStatus) {
    const prev = [...tasks]
    setTasks(prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)))
    const { error } = await (supabase as any)
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)
    if (error) {
      setTasks(prev) // rollback
      alert('Kunne ikke opdatere opgaven – prøv igen.')
    }
  }

  async function undoTaskStatus(id: string) {
    await setTaskStatus(id, 'pending')
  }

  // ——— Opret inspektionsopgaver fra et varsel ———
  async function createInspectionFromAlert(a: AlertRow) {
    try {
      if (a.type !== 'pest' && a.type !== 'disease') {
        alert('Kun relevant for skadedyr/sygdom.')
        return
      }
      if (!a.hazard_id) {
        alert('Denne varsel er ikke knyttet til en trussel.')
        return
      }

      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) {
        alert('Log ind først.')
        return
      }

      const { data: uc } = await (supabase as any)
        .from('user_crops')
        .select('crop_id')
        .eq('user_id', uid)
      const mySet = new Set<string>((uc || []).map((r: { crop_id: string }) => r.crop_id))

      const { data: hosts } = await (supabase as any)
        .from('hazard_hosts')
        .select('crop_id')
        .eq('hazard_id', a.hazard_id)

      const hostIds = (hosts || []).map((h: { crop_id: string }) => h.crop_id)
      const affected = hostIds.filter((cid) => mySet.has(cid))

      if (!affected.length) {
        alert('Ingen af dine afgrøder er værter for denne trussel.')
        return
      }

      const rows = affected.map((cid) => ({
        user_id: uid,
        crop_id: cid,
        type: 'other' as const,
        due_date: today,
        status: 'pending' as const,
        notes: `Inspektion: ${a.message?.split(':')[0] || 'Trussel'}`,
      }))

      const { error } = await (supabase as any)
        .from('tasks')
        .upsert(rows, { onConflict: 'user_id,crop_id,type,due_date', ignoreDuplicates: true })

      if (error) {
        alert('Kunne ikke oprette opgaver (eller de findes allerede). Tjek dashboard.')
      } else {
        alert(`Oprettet ${rows.length} inspektionsopgave(r) i dag.`)
        const { data: t } = await (supabase as any)
          .from('tasks')
          .select('*')
          .order('due_date', { ascending: true })
          .limit(20)
        setTasks((t || []) as TaskRow[])
      }
    } catch {
      alert('Noget gik galt ved oprettelse af inspektionsopgaver.')
    }
  }

  if (loading) return <div className="opacity-60 p-4">Indlæser dashboard…</div>

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* SW-status & Push-tilmelding */}
      <ServiceWorkerReady />
      <PushCta />

      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Grow-AI / Insights */}
      <InsightsPanel />

      <div className="grid gap-6">
        {/* Vejr */}
        <WeatherCard />

        {/* Vandingsoversigt */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Vandingsoversigt</h2>
          <AutoWaterSummary />
        </section>

        {/* Vandingsrådgivning */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Vandingsrådgivning</h2>
          <WaterAdvisor />
        </section>

        {/* Vejrhistorik */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Vejrhistorik (7 dage)</h2>
          <WeatherHistory />
        </section>

        {/* Opgaver */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Kommende opgaver</h2>
            <span className="text-xs opacity-60">
              {todaysInspections} inspektionsopgave{todaysInspections === 1 ? '' : 'r'} i dag
            </span>
          </div>

          <ul className="space-y-2">
            {tasks.map((t) => {
              const isInspection = t.notes?.startsWith('Inspektion:')
              return (
                <li key={t.id} className="p-3 rounded-lg bg-white shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${taskPill(t.type)}`}>
                        {t.type}
                      </span>
                      {isInspection && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-pink-100 text-pink-800">
                          🔍 Inspektion
                        </span>
                      )}
                      {t.status !== 'pending' && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {t.status === 'done' ? '✓ Udført' : '↷ Skippet'}
                        </span>
                      )}
                    </div>

                    {/* Hurtighandlinger + dato */}
                    <div className="flex items-center gap-2">
                      {t.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => setTaskStatus(t.id, 'done')}
                            className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Markér som udført"
                          >
                            ✓ Udført
                          </button>
                          <button
                            onClick={() => setTaskStatus(t.id, 'skipped')}
                            className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-800 hover:bg-slate-300"
                            title="Markér som skippet"
                          >
                            ↷ Skip
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => undoTaskStatus(t.id)}
                          className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
                          title="Fortryd (tilbage til afventer)"
                        >
                          Fortryd
                        </button>
                      )}
                      <span className="text-sm opacity-70">{t.due_date}</span>
                    </div>
                  </div>

                  {t.notes && <p className="text-sm mt-1 opacity-80">{t.notes}</p>}
                </li>
              )
            })}
            {!tasks.length && <p className="text-sm opacity-70">Ingen opgaver endnu.</p>}
          </ul>
        </section>

        {/* Varsler */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Varsler</h2>
          <ul className="space-y-2">
            {alerts.map((a) => {
              const { cls, label, icon } = alertBadge(a)
              const sev = a.severity ?? 0
              return (
                <li key={a.id} className="p-3 rounded-lg bg-white shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>
                        {icon} {label}
                      </span>
                      {sev > 0 && (
                        <span
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                          title={`Alvorlighed ${sev}/5`}
                        >
                          Alvor: {sev}/5
                        </span>
                      )}
                    </div>
                    <span className="text-xs opacity-60">
                      {new Date(a.created_at).toLocaleString('da-DK')}
                    </span>
                  </div>

                  {a.message && <p className="text-sm mt-1">{a.message}</p>}

                  <div className="flex items-center gap-2 mt-2">
                    {a.valid_to && (
                      <p className="text-xs opacity-60">
                        Gælder til: {new Date(a.valid_to).toLocaleString('da-DK')}
                      </p>
                    )}

                    {a.type !== 'frost' && a.hazard_id && (
                      <>
                        <Link
                          href={`/hazards/${a.hazard_id}`}
                          className="text-xs px-2 py-1 rounded border"
                          title="Se detaljer og vejledning"
                        >
                          Se detaljer →
                        </Link>
                        <button
                          onClick={() => createInspectionFromAlert(a)}
                          className="ml-auto text-xs px-2 py-1 rounded bg-slate-900 text-white"
                          title="Opret inspektionsopgaver for berørte afgrøder i dag"
                        >
                          🔍 Opret inspektion nu
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
            {!alerts.length && <p className="text-sm opacity-70">Ingen varsler endnu.</p>}
          </ul>
        </section>
      </div>
    </div>
  )
}
