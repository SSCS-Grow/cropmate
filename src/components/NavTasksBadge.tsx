'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

export default function NavTasksBadge() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [count, setCount] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  async function refresh() {
    // Kræv login
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user.id || null
    setUserId(uid)
    if (!uid) { setCount(null); return }

    // Kun antal, ingen rækker:
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('status', 'pending')

    if (!error) setCount(count ?? 0)
  }

  useEffect(() => {
    refresh()

    // Opdater ved faneskift/visibilitet (når man vender tilbage til tabben)
    const onVis = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVis)

    // Realtime: lyt efter ændringer i tasks for denne bruger
    // (supabase realtime skal være slået til i projektet)
    let channel: ReturnType<typeof supabase.channel> | null = null
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) return
      channel = supabase
        .channel('nav_tasks_badge')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${uid}` },
          () => refresh()
        )
        .subscribe()
    })()

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase])

  // Ikke logget ind → vis ikke badge
  if (!userId) return null

  return (
    <span
      className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs
                 bg-slate-900 text-white align-middle"
      aria-label="Antal åbne opgaver"
      title="Åbne opgaver"
    >
      {count ?? '…'}
    </span>
  )
}
