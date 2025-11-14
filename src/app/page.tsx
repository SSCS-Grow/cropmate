'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import useSupabaseBrowser from '@/hooks/useSupabaseBrowser'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import type { Session } from '@supabase/supabase-js' // kun Session bruges

export default function Home() {
  const supabase = useSupabaseBrowser()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!supabase) return

    // Hent aktuel session
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    // Lyt på login/logout – uden 'any' og uden AuthChangeEvent-import
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: unknown, newSession: Session | null) => {
        setSession(newSession)
      }
    )

    return () => {
      sub.subscription?.unsubscribe()
    }
  }, [supabase])

  if (!supabase) {
    return null
  }

  if (!session) {
    return (
      <div className="grid gap-6">
        <p className="text-sm">Log ind eller opret konto for at komme i gang.</p>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} />
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <p>Du er logget ind.</p>
      <nav className="flex gap-4 text-sm">
        <Link className="underline" href="/dashboard">Gå til Dashboard</Link>
        <Link className="underline" href="/crops">Katalog</Link>
        <Link className="underline" href="/my">Min have</Link>
        <Link className="underline" href="/settings">Indstillinger</Link>
      </nav>
    </div>
  )
}
