import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const type = searchParams.get('type') // optional

  if (!start || !end) {
    return new NextResponse('Missing start/end', { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('rpc_analytics_timeseries', {
    start_date: start,
    end_date: end,
    type_filter: type || null,
    crop_filter: null,
  })

  if (error) return new NextResponse(error.message, { status: 500 })

  const header = ['observed_date', 'count']
  const rows = (data ?? []).map((r: any) => [csvEscape(r.observed_date), csvEscape(r.count)].join(','))
  const csv = [header.join(','), ...rows].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="timeseries_${start}_to_${end}${type ? '_' + type : ''}.csv"`,
      'cache-control': 'no-store',
    },
  })
}
