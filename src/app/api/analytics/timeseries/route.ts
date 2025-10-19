import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server' // <— BYT TIL createClient

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const type = searchParams.get('type')

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start/end' }, { status: 400 })
  }

  const supabase = await createClient() // <— BYT KALD
  const { data, error } = await supabase.rpc('rpc_analytics_timeseries', {
    start_date: start,
    end_date: end,
    type_filter: type || null,
    crop_filter: null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [] })
}
