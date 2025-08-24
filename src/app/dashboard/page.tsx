'use client'

import { useEffect, useState } from 'react'
import supabaseBrowser from '../../lib/supabaseBrowser'

type Task = { id: string; type: string; due_date: string; notes: string | null; status?: string }
type Alert = { id: string; type: string; message: string; created_at: string }

export default function Dashboard() {
  const supabase = supabaseBrowser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    const run = async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) return
      const { data: t } = await supabase.from('tasks').select('*').order('due_date', { ascending: true }).limit(10)
      const { data: a } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(5)
      setTasks((t as Task[]) || [])
      setAlerts((a as Alert[]) || [])
    }
    run()
  }, [supabase])

  return (
    <div className="grid gap-6">
      <section>
        <h2 className="text-xl font-semibold mb-2">Kommende opgaver</h2>
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="p-3 rounded-lg bg-white shadow">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.type}</span>
                <span className="text-sm opacity-70">{t.due_date}</span>
              </div>
              {t.notes && <p className="text-sm mt-1 opacity-80">{t.notes}</p>}
            </li>
          ))}
          {!tasks.length && <p className="text-sm opacity-70">Ingen opgaver endnu.</p>}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Varsler</h2>
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="p-3 rounded-lg bg-white shadow">
              <div className="flex items-center justify-between">
                <span className="font-medium">{a.type}</span>
                <span className="text-sm opacity-70">{new Date(a.created_at).toLocaleString('da-DK')}</span>
              </div>
              <p className="text-sm mt-1">{a.message}</p>
            </li>
          ))}
          {!alerts.length && <p className="text-sm opacity-70">Ingen varsler endnu.</p>}
        </ul>
      </section>
    </div>
  )
}
