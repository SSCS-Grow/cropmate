import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dim = searchParams.get('dim') // 'type'
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!dim || !start || !end) {
    return NextResponse.json({ error: 'Missing dim/start/end' }, { status: 400 })
  }

  const supabase = await createClient() // ⟵ vigitgt
  const { data, error } = await supabase.rpc('rpc_analytics_breakdown', {
    dim, start_date: start, end_date: end,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [] })
}
