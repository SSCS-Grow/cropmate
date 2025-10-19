import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start/end' }, { status: 400 })
  }

  const supabase = await createClient() // ⟵
  const { data, error } = await supabase.rpc('rpc_analytics_kpis', {
    start_date: start,
    end_date: end,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const row = (data && data[0]) || { total: 0, unique_types: 0, unique_crops: 0, last24h: 0 }
  return NextResponse.json({ ...row })
}
