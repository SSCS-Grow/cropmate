import { Suspense } from 'react'
import Filters from './components/Filters'
import TimeseriesChart from './components/TimeseriesChart'
import TopList from './components/TopList'
import KPI from './components/KPI'
import ExportMenu from './components/ExportMenu'

// Valgfrit: undgå statisk prerender og kør altid dynamisk
export const dynamic = 'force-dynamic'

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Observation Analytics</h1>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <Suspense fallback={<div className="text-sm text-gray-500">Henter filtre…</div>}>
          <Filters />
        </Suspense>
        <Suspense fallback={<div className="text-sm text-gray-500">Gør klar til eksport…</div>}>
          <ExportMenu />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Suspense fallback={<div className="border rounded-2xl p-4">—</div>}>
          <KPI label="Total (periode)" id="kpi-total" field="total" />
        </Suspense>
        <Suspense fallback={<div className="border rounded-2xl p-4">—</div>}>
          <KPI label="Unikke typer" id="kpi-types" field="unique_types" />
        </Suspense>
        <Suspense fallback={<div className="border rounded-2xl p-4">—</div>}>
          <KPI label="Unikke afgrøder" id="kpi-crops" field="unique_crops" />
        </Suspense>
        <Suspense fallback={<div className="border rounded-2xl p-4">—</div>}>
          <KPI label="Seneste 24 timer" id="kpi-last24" field="last24h" />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="border rounded-2xl p-4 h-64">Indlæser graf…</div>}>
            <TimeseriesChart />
          </Suspense>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Suspense fallback={<div className="border rounded-2xl p-4">Indlæser top-liste…</div>}>
            <TopList title="Top typer" dim="type" />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
