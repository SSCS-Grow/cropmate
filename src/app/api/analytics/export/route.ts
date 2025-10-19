import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvEscape(v: unknown) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const type = searchParams.get('type')

  if (!start || !end) return new NextResponse('Missing start/end', { status: 400 })

  const supabase = await createClient() // ⟵
  let query = supabase
    .from('analytics_observations')
    .select('id,created_at,observed_date,type,lat,lng')
    .gte('observed_date', start)
    .lte('observed_date', end)
  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return new NextResponse(error.message, { status: 500 })

  const header = ['id','created_at','observed_date','type','lat','lng']
  const rows = (data ?? []).map(r => [r.id,r.created_at,r.observed_date,r.type,r.lat,r.lng].map(csvEscape).join(','))
  const csv = [header.join(','), ...rows].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'content-type':'text/csv; charset=utf-8',
      'content-disposition':`attachment; filename="analytics_${start}_to_${end}${type?`_${type}`:''}.csv"`,
      'cache-control':'no-store'
    }
  })
}
