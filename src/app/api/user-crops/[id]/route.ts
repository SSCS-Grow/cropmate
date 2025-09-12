import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

type Template = {
  type: 'sow'|'transplant'|'fertilize'|'prune'|'water'|'harvest'|'other'
  offset_days: number
  repeat_every_days: number | null
  repeat_count: number | null
  notes: string | null
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json({ error: 'Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE!, { auth: { persistSession: false } })
  const userCropId = params.id

  // 1) Find user_crop
  const { data: uc, error: ucErr } = await admin
    .from('user_crops')
    .select('id, user_id, crop_id, planted_on')
    .eq('id', userCropId)
    .maybeSingle()

  if (ucErr || !uc) return NextResponse.json({ error: 'user_crop not found' }, { status: 404 })
  const planted = uc.planted_on ? new Date(uc.planted_on) : new Date()

  // 2) Hent skabeloner for crop
  const { data: templates, error: tErr } = await admin
    .from('crop_task_templates')
    .select('type, offset_days, repeat_every_days, repeat_count, notes')
    .eq('crop_id', uc.crop_id)
    .order('offset_days', { ascending: true })

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  // 3) Byg opgaver
  const toInsert: any[] = []
  for (const tpl of (templates || []) as Template[]) {
    const baseDate = addDays(planted, tpl.offset_days)
    if (!tpl.repeat_every_days || !tpl.repeat_count || tpl.repeat_count <= 1) {
      toInsert.push(row(uc.user_id, uc.crop_id, tpl.type, baseDate, tpl.notes))
    } else {
      for (let i = 0; i < tpl.repeat_count; i++) {
        const d = addDays(baseDate, i * (tpl.repeat_every_days || 0))
        toInsert.push(row(uc.user_id, uc.crop_id, tpl.type, d, tpl.notes))
      }
    }
  }

  // 4) Indsæt (unik-index forhindrer dubletter)
  if (toInsert.length) {
    await admin.from('tasks').insert(toInsert).then(() => {}, () => {}) // ignore conflicts
  }

  return NextResponse.json({ ok: true, generated: toInsert.length })
}

// Helpers
function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}
function row(user_id: string, crop_id: string, type: string, d: Date, notes?: string | null) {
  return {
    user_id,
    crop_id,
    type,
    due_date: fmt(d),
    status: 'pending',
    notes: notes || null
  }
}
