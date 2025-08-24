'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
// Brug relativ import for at udelukke alias-issues (kan skifte tilbage senere)
import supabaseBrowser from '../lib/supabaseBrowser'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

// resten af din komponent...


export default function Home() {
const supabase = supabaseBrowser();
const [session, setSession] = useState<any>(null);


useEffect(() => {
supabase.auth.getSession().then(({ data }) => setSession(data.session));
const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
return () => listener.subscription.unsubscribe();
}, [supabase]);


if (!session) {
return (
<div className="grid gap-6">
<p className="text-sm">Log ind eller opret konto for at komme i gang.</p>
<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} />
</div>
);
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
