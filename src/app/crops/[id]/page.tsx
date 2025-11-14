'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSupabaseBrowser from '@/hooks/useSupabaseBrowser'
import Link from 'next/link'

type Crop = {
  id: string
  name: string
  scientific_name: string | null
  category: string | null
  description: string | null
  frost_sensitive: boolean | null
}

type UserCrop = {
  id: string
  user_id: string
  crop_id: string
  planted_on: string | null
  location_note: string | null
  notes: string | null
  auto_water: boolean | null
}

type GenerateResp = { ok: boolean; generated: number }

export default function CropDetailPage() {
  const params = useParams<{ id: string }>()
  const cropId = params.id
  const router = useRouter()
  const supabase = useSupabaseBrowser()

  const [loading, setLoading] = useState(true)
  const [crop, setCrop] = useState<Crop | null>(null)

  const [loggedIn, setLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [userCrop, setUserCrop] = useState<UserCrop | null>(null)

  const [adding, setAdding] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [genMsg, setGenMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let alive = true
    ;(async () => {
      setLoading(true)
      setErrorMsg(null)

      // 1) Hent afgrøde
      const { data: cData, error: cErr } = await supabase
        .from('crops')
        .select('id, name, scientific_name, category, description, frost_sensitive')
        .eq('id', cropId)
        .maybeSingle()

      if (!alive) return
      if (cErr) {
        setErrorMsg('Kunne ikke hente afgrøden.')
        setCrop(null)
        setLoading(false)
        return
      }
      setCrop(cData as Crop | null)

      // 2) Session + user
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id ?? null
      setLoggedIn(!!uid)
      setUserId(uid)

      // 3) Hvis logget ind: tjek om afgrøden findes i Min have
      if (uid) {
        const { data: ucData } = await supabase
          .from('user_crops')
          .select('id, user_id, crop_id, planted_on, location_note, notes, auto_water')
          .eq('user_id', uid)
          .eq('crop_id', cropId)
          .maybeSingle()

        if (!alive) return
        setUserCrop((ucData as UserCrop | null) ?? null)
      }

      setLoading(false)
    })()
    return () => { alive = false }
  }, [supabase, cropId])

  async function addToMyGarden() {
    if (!supabase) return
    if (!userId || !crop) return
    setAdding(true)
    setGenMsg(null)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('user_crops')
        .insert({
          user_id: userId,
          crop_id: crop.id,
          planted_on: today,
        })
        .select('id, user_id, crop_id, planted_on, location_note, notes, auto_water')
        .maybeSingle()

      if (error) throw error
      setUserCrop(data as UserCrop)
    } catch {
      setErrorMsg('Kunne ikke tilføje afgrøden til Min have.')
    } finally {
      setAdding(false)
    }
  }

  async function generateTasks() {
    if (!supabase) return
    if (!userCrop) return
    setGenLoading(true)
    setGenMsg(null)
    try {
      const res = await fetch(`/api/user-crops/${userCrop.id}/generate-tasks`, { method: 'POST' })
      const json: GenerateResp = await res.json()
      if (!res.ok) {
        setGenMsg('Kunne ikke generere opgaver.')
      } else {
        setGenMsg(`Oprettet ${json.generated} opgave(r).`)
      }
    } catch {
      setGenMsg('Kunne ikke generere opgaver.')
    } finally {
      setGenLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4 opacity-60">Indlæser afgrøde…</div>
  }

  if (!crop) {
    return (
      <div className="p-4">
        <p className="mb-3">Afgrøden blev ikke fundet.</p>
        <Link className="underline" href="/crops">Tilbage til katalog</Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{crop.name}</h1>
          <p className="text-sm opacity-70">
            {crop.scientific_name || '—'} • {crop.category || '—'}
            {crop.frost_sensitive ? ' • Frostfølsom' : ''}
          </p>
        </div>
        <Link className="text-sm underline" href="/crops">Tilbage</Link>
      </header>

      {errorMsg && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">
          {errorMsg}
        </div>
      )}

      {crop.description && (
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <h3 className="font-medium mb-2">Beskrivelse</h3>
          <p className="text-sm whitespace-pre-line">{crop.description}</p>
        </section>
      )}

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="font-medium mb-3">Handlinger</h3>

        {!loggedIn ? (
          <p className="text-sm opacity-70">Log ind for at tilføje afgrøden og generere opgaver.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {!userCrop ? (
              <button
                onClick={addToMyGarden}
                disabled={adding}
                className="px-3 py-2 rounded bg-slate-900 text-white text-sm"
              >
                {adding ? 'Tilføjer…' : 'Tilføj til Min have'}
              </button>
            ) : (
              <>
                <span className="text-sm opacity-70">
                  I din have siden {userCrop.planted_on ?? '—'}
                </span>
                <button
                  onClick={generateTasks}
                  disabled={genLoading}
                  className="px-3 py-2 rounded bg-slate-900 text-white text-sm"
                >
                  {genLoading ? 'Genererer…' : 'Generér opgaver'}
                </button>
                {genMsg && <span className="text-xs opacity-70">{genMsg}</span>}
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-3 py-2 rounded border text-sm"
                >
                  Gå til Dashboard
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
