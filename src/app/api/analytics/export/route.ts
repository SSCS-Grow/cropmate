import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  // Hvis feltet indeholder komma, citationstegn eller newline -> wrap i "
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const type = searchParams.get('type') // 'pest' | 'disease' | 'other' | '' | null

  if (!start || !end) {
    return new NextResponse('Missing start/end', { status: 400 })
  }

  const supabase = await createClient()

  let query = supabase
    .from('analytics_observations')
    .select('id,created_at,observed_date,type,lat,lng')
    .gte('observed_date', start)
    .lte('observed_date', end)
    .order('observed_date', { ascending: true })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    return new NextResponse(error.message, { status: 500 })
  }

  const header = ['id', 'created_at', 'observed_date', 'type', 'lat', 'lng']
  const rows = (data ?? []).map((r) =>
    [
      csvEscape(r.id),
      csvEscape(r.created_at),
      csvEscape(r.observed_date),
      csvEscape(r.type),
      csvEscape(r.lat),
      csvEscape(r.lng),
    ].join(',')
  )
  const csv = [header.join(','), ...rows].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="analytics_${start}_to_${end}${type ? '_' + type : ''}.csv"`,
      'cache-control': 'no-store',
    },
  })
}
