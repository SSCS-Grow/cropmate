'use client'

import { useEffect, useMemo, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

export default function AdminBadge() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user.id
        if (!uid) {
          if (alive) setIsAdmin(false)
          return
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', uid)
          .maybeSingle()
        if (error) throw error
        if (alive) setIsAdmin(Boolean(data?.is_admin))
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()

    // Opdater badge ved login/logud
    const { data: sub } = supabase.auth.onAuthStateChange(() => load())
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  if (loading || !isAdmin) return null

  return (
    <span
      className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50"
      title="Du er logget ind som admin (profiles.is_admin = true)"
    >
      🛡️ Admin
    </span>
  )
}
