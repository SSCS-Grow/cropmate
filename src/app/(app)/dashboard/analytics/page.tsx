import Filters from './components/Filters'
import TimeseriesChart from './components/TimeseriesChart'
import TopList from './components/TopList'
import KPI from './components/KPI'
import ExportMenu from './components/ExportMenu'

export const dynamic = 'force-dynamic'   // undgår statisk prerender

type SP = { start?: string; end?: string; type?: string }

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: SP
}) {
  const today = new Date()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5)

  const start = (searchParams.start ?? thirtyDaysAgo.toISOString().slice(0, 10))
  const end   = (searchParams.end   ?? today.toISOString().slice(0, 10))
  const type  = (searchParams.type  ?? '')

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Observation Analytics</h1>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <Filters start={start} end={end} type={type} />
        <ExportMenu start={start} end={end} type={type} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <KPI label="Total (periode)" id="kpi-total" field="total" start={start} end={end} />
        <KPI label="Unikke typer" id="kpi-types" field="unique_types" start={start} end={end} />
        <KPI label="Unikke afgrøder" id="kpi-crops" field="unique_crops" start={start} end={end} />
        <KPI label="Seneste 24 timer" id="kpi-last24" field="last24h" start={start} end={end} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimeseriesChart start={start} end={end} type={type} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <TopList title="Top typer" dim="type" start={start} end={end} />
        </div>
      </div>
    </div>
  )
}
