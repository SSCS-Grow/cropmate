'use client'

import { useEffect, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

export default function TestPage() {
  const [rows, setRows] = useState<any[]>([])
  const supabase = supabaseBrowser()

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.from('crops').select('*').limit(5)
      if (error) {
        console.error('Supabase error:', error)
        setRows([])
      } else {
        setRows(data || [])
      }
    }
    run()
  }, [supabase])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Test Supabase connection</h1>
      {rows.length === 0 ? (
        <p>Ingen data fundet (eller fejl i forbindelse).</p>
      ) : (
        <ul className="list-disc pl-6">
          {rows.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
