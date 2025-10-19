import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvEscape(v: unknown) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dim = searchParams.get('dim') || 'type'
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) return new NextResponse('Missing start/end', { status: 400 })
  if (dim !== 'type') return new NextResponse('Unsupported dim', { status: 400 })

  const supabase = await createClient() // ⟵
  const { data, error } = await supabase.rpc('rpc_analytics_breakdown', {
    dim, start_date: start, end_date: end
  })
  if (error) return new NextResponse(error.message, { status: 500 })

  const header = [dim, 'count']
  const rows = (data ?? []).map((r:any) => [csvEscape(r.label), csvEscape(r.count)].join(','))
  const csv = [header.join(','), ...rows].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'content-type':'text/csv; charset=utf-8',
      'content-disposition':`attachment; filename="breakdown_${dim}_${start}_to_${end}.csv"`,
      'cache-control':'no-store'
    }
  })
}
