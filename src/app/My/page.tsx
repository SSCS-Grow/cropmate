'use client'

import { useEffect, useState } from 'react'
// Ensure the file exists at the correct path, or update the import path if necessary
import supabaseBrowser from '../../lib/supabaseBrowser'

type MyRow = {
  id: string
  planted_on: string | null
  crops: { name: string } | null
}

export default function MyGardenPage() {
  const supabase = supabaseBrowser()
  const [rows, setRows] = useState<MyRow[]>([])

  useEffect(() => {
    const run = async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) return
      const { data, error } = await supabase
        .from('user_crops')
        .select('id, planted_on, crops(name)')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setRows(
          (data as any[]).map((row) => ({
            id: row.id,
            planted_on: row.planted_on,
            crops: Array.isArray(row.crops) && row.crops.length > 0
              ? { name: String(row.crops[0].name) }
              : null,
          }))
        )
      }
    }
    run()
  }, [supabase])

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Min have/mark</h2>
      <ul className="grid gap-3">
        {rows.map((r) => (
          <li key={r.id} className="p-3 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{r.crops?.name ?? 'Ukendt afgrøde'}</h3>
                {r.planted_on && <p className="text-sm opacity-70">Plantet: {r.planted_on}</p>}
              </div>
            </div>
          </li>
        ))}
        {!rows.length && <p className="text-sm opacity-70">Ingen afgrøder endnu.</p>}
      </ul>
    </div>
  )
}
