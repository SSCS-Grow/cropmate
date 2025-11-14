'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import useSupabaseBrowser from '@/hooks/useSupabaseBrowser'

export default function AdminNavLink() {
  const supabase = useSupabaseBrowser()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!supabase) return

    let alive = true
    const load = async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) { if (alive) setIsAdmin(false); return }
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', uid).maybeSingle()
      if (alive) setIsAdmin(Boolean(data?.is_admin))
    }
    load()
    const { data: sub } = supabase.auth.onAuthStateChange(() => load())
    return () => {
      alive = false
      sub.subscription?.unsubscribe()
    }
  }, [supabase])

  if (!isAdmin) return null
  return <Link className="underline" href="/admin/moderation">Moderation</Link>
}
