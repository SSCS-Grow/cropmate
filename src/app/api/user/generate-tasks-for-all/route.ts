import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Vi bruger RLS med brugerens token (IKKE service-role)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type Template = {
  type: 'sow'|'transplant'|'fertilize'|'prune'|'water'|'harvest'|'other'
  offset_days: number
  repeat_every_days: number | null
  repeat_count: number | null
  notes: string | null
}
type UserCrop = {
  id: string
  crop_id: string
  planted_on: string | null
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
function fmt(d: Date) {
  return d.toISOString().slice(0,10)
}

export async function POST(req: Request) {
  try {
    // 1) Kræv Authorization: Bearer <access_token> fra klienten
    const auth = req.headers.get('authorization') || req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = auth.slice('Bearer '.length)

    // 2) Supabase-klient med brugerens token (RLS håndhæves)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false }
    })

    // 3) Find bruger-id via /auth.getUser()
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id

    // 4) Hent alle user_crops for brugeren
    const { data: ucs, error: ucErr } = await supabase
      .from('user_crops')
      .select('id, crop_id, planted_on')
      .eq('user_id', userId)

    if (ucErr) return NextResponse.json({ error: ucErr.message }, { status: 500 })

    const userCrops = (ucs || []) as UserCrop[]
    if (!userCrops.length) {
      return NextResponse.json({ ok: true, generated: 0, details: 'Ingen afgrøder i Min have.' })
    }

    let totalToInsert = 0

    // 5) For hver crop: hent skabeloner og byg opgaver
    for (const uc of userCrops) {
      const planted = uc.planted_on ? new Date(uc.planted_on) : new Date()

      const { data: templates, error: tErr } = await supabase
        .from('crop_task_templates')
        .select('type, offset_days, repeat_every_days, repeat_count, notes')
        .eq('crop_id', uc.crop_id)
        .order('offset_days', { ascending: true })

      if (tErr) continue
      const tpls = (templates || []) as Template[]
      if (!tpls.length) continue

      const rows: {
        user_id: string
        crop_id: string
        type: Template['type']
        due_date: string
        status: 'pending'
        notes: string | null
      }[] = []

      for (const tpl of tpls) {
        const baseDate = addDays(planted, tpl.offset_days)
        if (!tpl.repeat_every_days || !tpl.repeat_count || tpl.repeat_count <= 1) {
          rows.push({
            user_id: userId,
            crop_id: uc.crop_id,
            type: tpl.type,
            due_date: fmt(baseDate),
            status: 'pending',
            notes: tpl.notes ?? null
          })
        } else {
          for (let i = 0; i < tpl.repeat_count; i++) {
            const d = addDays(baseDate, i * (tpl.repeat_every_days || 0))
            rows.push({
              user_id: userId,
              crop_id: uc.crop_id,
              type: tpl.type,
              due_date: fmt(d),
              status: 'pending',
              notes: tpl.notes ?? null
            })
          }
        }
      }

      if (rows.length) {
        // 6) Indsæt – unik-index på tasks (user_id,crop_id,type,due_date) forhindrer dubletter
        // Ved konflikt/eksisterende rækker vil insert fejle pr. række, men vi ignorerer fejl (partial ok)
        await supabase.from('tasks').insert(rows)
        totalToInsert += rows.length
      }
    }

    return NextResponse.json({ ok: true, generated: totalToInsert })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
