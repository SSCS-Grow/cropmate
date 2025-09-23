'use client'
import React from 'react'
import HazardCsvExport from '@/components/HazardCsvExport'
import HazardReportsMap from '@/components/HazardReportsMap'

// ...din eksisterende kode...

export default function HazardDetailClient({ hazardId }: { hazardId: string }) {
  // ...state/fetch osv.

  return (
    <div className="grid gap-6">
      {/* Sektion: CSV export */}
      <HazardCsvExport hazardId={hazardId} />

      {/* Sektion: Kort */}
      <section className="rounded bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="text-lg font-semibold mb-2">Observationer på kort</h3>
        <HazardReportsMap hazardId={hazardId} />
      </section>

      {/* Sektion: Rapportér observation */}
      {/* ... din ReportWizard ... */}
    </div>
  )
}
